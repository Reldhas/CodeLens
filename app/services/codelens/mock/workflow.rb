require "digest"
require "json"
require "time"

module Codelens
  module Mock
    # Local, single-process test double. No durable storage or authentication.
    class Workflow
      class Error < StandardError
        attr_reader :code, :status, :field

        def initialize(code, message, status = 422, field = nil)
          super(message)
          @code, @status, @field = code, status, field
        end
      end

      CRITERIA = %w[correctness efficiency maintainability context_fit].freeze
      LEVELS = %w[beginner intermediate advanced].freeze
      DECISIONS = %w[approve request_changes need_information].freeze
      JUDGMENTS = %w[acceptable needs_changes insufficient_information].freeze
      CODE = "def calculate_total(amount):\n    if amount >= 500:\n        return amount * 0.9\n    return amount\n".freeze

      def initialize
        raise "CodeLens mocks require development or test" unless Rails.env.development? || Rails.env.test?

        @mutex = Mutex.new
        @attempts, @submissions, @idempotency = {}, {}, {}
        @sequence = 0
      end

      def call(operation, course_id:, owner_id:, id: nil, payload: {}, key: nil)
        @mutex.synchronize do
          fail_with("NOT_FOUND", "Record not found.", 404) unless course_id.to_s == "12"
          context = [course_id.to_s, owner_id.to_s]
          result = case operation
                   when :create then create(context, payload)
                   when :show then present(find_attempt(id, context))
                   when :draft then save_draft(find_attempt(id, context), payload)
                   when :submit then submit(find_attempt(id, context), context, payload, key)
                   when :references then references(find_attempt(id, context))
                   when :ta_feedback
                     submission = @submissions[id.to_s]
                     fail_with("NOT_FOUND", "Record not found.", 404) unless submission && submission[:context] == context
                     { feedback: nil }
                   else raise ArgumentError, "Unknown workflow operation"
                   end
          copy(result)
        end
      end

      private

      def create(context, payload)
        fail_with("ACTIVITY_NOT_AVAILABLE", "Only mock activity 15 is available.") unless payload["activity_id"].to_s == "15"
        fail_with("INVALID_LEVEL", "Choose an available level.", 422, "level") unless LEVELS.include?(payload["level"])
        now = timestamp
        attempt = { id: next_id, context: context, activity_version_id: 22,
                    level: payload["level"], status: "in_progress", lock_version: 0,
                    draft: nil, review_submission_ids: [], references_viewed: false,
                    created_at: now, updated_at: now }
        @attempts[attempt[:id].to_s] = attempt
        metadata(attempt)
      end

      def find_attempt(id, context)
        attempt = @attempts[id.to_s]
        fail_with("NOT_FOUND", "Record not found.", 404) unless attempt && attempt[:context] == context
        attempt
      end

      def metadata(attempt)
        attempt.slice(:id, :activity_version_id, :level, :status, :lock_version, :created_at, :updated_at)
      end

      def present(attempt)
        metadata(attempt).merge(
          exercise: { title: "Discount calculation", scenario: "Review a checkout discount function.",
                      requirements: ["Amounts at least 500 receive 20% off."], language: "python", code: CODE,
                      input_schema: { type: "object", properties: { amount: { type: "number" } },
                                      required: ["amount"], additionalProperties: false },
                      guidance: ["What happens at the discount threshold?"] },
          capabilities: { can_run_tests: false, can_view_references: attempt[:review_submission_ids].any? },
          draft: attempt[:draft], review_submission_ids: attempt[:review_submission_ids]
        )
      end

      def save_draft(attempt, payload)
        check_lock(attempt, payload)
        review = validate_review(payload["review"], complete: false)
        attempt[:draft] = copy(review)
        advance(attempt)
        { review: attempt[:draft], lock_version: attempt[:lock_version], updated_at: attempt[:updated_at] }
      end

      def submit(attempt, context, payload, key)
        unless key.is_a?(String) && !key.strip.empty? && key.bytesize <= 200
          fail_with("IDEMPOTENCY_KEY_REQUIRED", "Provide an Idempotency-Key of at most 200 bytes.", 422, "Idempotency-Key")
        end
        scope = [*context, :submit, attempt[:id], key]
        digest = Digest::SHA256.hexdigest(JSON.generate(canonical(payload)))
        previous = @idempotency[scope]
        if previous
          fail_with("IDEMPOTENCY_CONFLICT", "This key was used with a different request.", 409) unless previous[:digest] == digest
          return previous[:response]
        end
        check_lock(attempt, payload)
        review = validate_review(payload["review"], complete: true)
        submission = { id: next_id, attempt_id: attempt[:id], context: context,
                       activity_version_id: attempt[:activity_version_id], rubric_version_id: 7,
                       review: copy(review), evidence: [], status: "submitted", created_at: timestamp,
                       feedback_exposure: { references_viewed: attempt[:references_viewed], ai: false, ta: false } }
        @submissions[submission[:id].to_s] = submission
        attempt[:review_submission_ids] << submission[:id]
        attempt[:status] = "submitted"
        attempt[:draft] = nil
        advance(attempt)
        response = submission.slice(:id, :attempt_id, :status, :created_at).merge(lock_version: attempt[:lock_version])
        @idempotency[scope] = { digest: digest, response: response }
        response
      end

      def references(attempt)
        fail_with("REFERENCES_LOCKED", "Submit a complete review before viewing references.", 403) if attempt[:review_submission_ids].empty?
        attempt[:references_viewed] = true
        {
          items: [{ id: 1, code: "def calculate_total(amount):\n    return amount * 0.8 if amount >= 500 else amount\n",
                    explanation: "Apply a 20% discount at the inclusive threshold.", priority: 1,
                    trade_offs: ["This mock exercise does not specify money rounding."] }],
          rubric_explanations: [
            { criterion: "correctness", explanation: "At 500 the required total is 400; the exercise returns 450." },
            { criterion: "efficiency", explanation: "Both implementations use constant time and space." },
            { criterion: "maintainability", explanation: "Explain how clearly the discount rule is expressed." },
            { criterion: "context_fit", explanation: "Identify missing rounding and negative-input requirements." }
          ]
        }
      end

      def validate_review(review, complete:)
        fail_with("INVALID_REVIEW", "review must be an object.", 422, "review") unless review.is_a?(Hash)
        allowed = %w[decision criteria summary proposed_changes proposed_code]
        fail_with("INVALID_REVIEW", "Unknown review fields.") if (review.keys - allowed).any?
        if complete || review.key?("decision")
          fail_with("INVALID_DECISION", "Choose a valid review decision.", 422, "decision") unless DECISIONS.include?(review["decision"])
        end
        %w[summary proposed_changes proposed_code].each do |field|
          value = review[field]
          fail_with("INVALID_REVIEW", "#{field} must be text or null.", 422, field) unless value.nil? || (value.is_a?(String) && value.length <= 20_000)
        end
        if complete
          require_text(review["summary"], "summary")
          require_text(review["proposed_changes"], "proposed_changes") if review["decision"] == "request_changes"
        end
        criteria = review.fetch("criteria", [])
        fail_with("INVALID_CRITERIA", "criteria must contain at most four records.") unless criteria.is_a?(Array) && criteria.size <= 4
        names = criteria.map do |criterion|
          fail_with("INVALID_CRITERIA", "Each criterion must be an object.") unless criterion.is_a?(Hash)
          if (criterion.keys - %w[criterion judgment reasoning line_numbers test_run_ids]).any?
            fail_with("INVALID_CRITERIA", "Unknown criterion fields.")
          end
          name = criterion["criterion"]
          fail_with("INVALID_CRITERIA", "Unknown criterion.") unless CRITERIA.include?(name)
          if complete || criterion.key?("judgment")
            fail_with("INVALID_JUDGMENT", "Choose a valid judgment.") unless JUDGMENTS.include?(criterion["judgment"])
          end
          if complete
            require_text(criterion["reasoning"], "reasoning")
          elsif criterion.key?("reasoning")
            value = criterion["reasoning"]
            unless value.nil? || (value.is_a?(String) && value.length <= 20_000)
              fail_with("INVALID_REVIEW", "reasoning must be text or null.")
            end
          end
          lines = criterion.fetch("line_numbers", [])
          unless lines.is_a?(Array) && lines.all? { |line| line.is_a?(Integer) && (1..CODE.lines.size).cover?(line) }
            fail_with("INVALID_LINE_REFERENCE", "Line numbers must refer to the exercise code.")
          end
          evidence = criterion.fetch("test_run_ids", [])
          fail_with("INVALID_EVIDENCE", "Test evidence is unavailable until the runner mock is implemented.") unless evidence == []
          name
        end
        fail_with("INVALID_CRITERIA", "Duplicate criteria are not allowed.") unless names.uniq == names
        if complete && names.sort != CRITERIA.sort
          fail_with("INCOMPLETE_REVIEW", "Provide all four criteria and their reasoning.")
        end
        review
      end

      def require_text(value, field)
        unless value.is_a?(String) && !value.strip.empty? && value.length <= 20_000
          fail_with("INVALID_REVIEW", "#{field} must contain text (maximum 20000 characters).", 422, field)
        end
      end

      def check_lock(attempt, payload)
        version = payload["lock_version"]
        fail_with("INVALID_LOCK_VERSION", "lock_version must be a nonnegative integer.") unless version.is_a?(Integer) && version >= 0
        fail_with("STALE_VERSION", "Reload the attempt before saving.", 409) unless version == attempt[:lock_version]
      end

      def advance(attempt)
        attempt[:lock_version] += 1
        attempt[:updated_at] = timestamp
      end

      def canonical(value)
        case value
        when Hash then value.keys.sort.to_h { |key| [key, canonical(value[key])] }
        when Array then value.map { |item| canonical(item) }
        else value
        end
      end

      def next_id
        @sequence += 1
      end

      def timestamp
        Time.now.utc.iso8601(6)
      end

      def copy(value)
        Marshal.load(Marshal.dump(value))
      end

      def fail_with(code, message, status = 422, field = nil)
        raise Error.new(code, message, status, field)
      end
    end
  end
end
