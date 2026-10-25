module Codelens
  module Mock
    # Poll-driven lifecycle for the POC; intentionally not a durable job queue.
    module Jobs
      private

      def owned_record(records, id, context)
        record = records[id.to_s]
        fail_with("NOT_FOUND", "Record not found.", 404) unless record && record[:context] == context
        record
      end

      def job_request(operation, parent_id, context, payload, key)
        unless key.is_a?(String) && !key.strip.empty? && key.bytesize <= 200
          fail_with("IDEMPOTENCY_KEY_REQUIRED", "Provide an Idempotency-Key of at most 200 bytes.")
        end
        scope = [*context, operation, parent_id, key]
        digest = Digest::SHA256.hexdigest(JSON.generate(canonical(payload)))
        previous = @idempotency[scope]
        if previous
          fail_with("IDEMPOTENCY_CONFLICT", "This key was used with a different request.", 409) unless previous[:digest] == digest
          return job_receipt(previous[:job])
        end
        job = yield
        @idempotency[scope] = { digest: digest, job: job }
        job_receipt(job)
      end

      def job_receipt(job)
        job.slice(:id, :status, :poll_url)
      end

      def create_test_run(attempt, context, payload, key)
        fail_with("TESTING_NOT_AVAILABLE", "Test execution is available only at beginner level.") unless attempt[:level] == "beginner"
        job_request(:test_run, attempt[:id], context, payload, key) do
          cases = validate_cases(payload)
          job = { id: next_id, context: context, attempt_id: attempt[:id], activity_version_id: attempt[:activity_version_id],
                  status: "queued", cases: copy(cases), created_at: timestamp, simulated: true,
                  artifact_digest: Digest::SHA256.hexdigest(Workflow::CODE) }
          job[:poll_url] = "/courses/#{context.first}/codelens/test_runs/#{job[:id]}"
          @test_runs[job[:id].to_s] = job
        end
      end

      def validate_cases(payload)
        fail_with("INVALID_TEST_INPUT", "Only cases may be supplied.") unless payload.keys == ["cases"]
        cases = payload["cases"]
        unless cases.is_a?(Array) && (1..10).cover?(cases.size)
          fail_with("INVALID_TEST_INPUT", "Supply between one and ten cases.")
        end
        ids = cases.map do |item|
          unless item.is_a?(Hash) && item.keys.sort == %w[client_case_id inputs prediction]
            fail_with("INVALID_TEST_INPUT", "Each case requires an ID, inputs and prediction only.")
          end
          id = item["client_case_id"]
          fail_with("INVALID_TEST_INPUT", "Case IDs must be nonempty strings up to 100 characters.") unless id.is_a?(String) && !id.strip.empty? && id.length <= 100
          inputs = item["inputs"]
          unless inputs.is_a?(Hash) && inputs.keys == ["amount"] && bounded_number?(inputs["amount"])
            fail_with("INVALID_TEST_INPUT", "amount must be a finite number between -1e9 and 1e9.")
          end
          prediction = item["prediction"]
          valid = prediction.is_a?(Hash) && (
            (prediction.keys.sort == %w[kind value] && prediction["kind"] == "value" && bounded_number?(prediction["value"])) ||
            (prediction.keys.sort == %w[error_code kind] && prediction["kind"] == "error" &&
              prediction["error_code"].is_a?(String) && prediction["error_code"].match?(/\A[A-Z][A-Z0-9_]{0,63}\z/))
          )
          fail_with("INVALID_TEST_INPUT", "Provide a numeric value prediction or an error code.") unless valid
          id
        end
        fail_with("INVALID_TEST_INPUT", "Case IDs must be unique within a run.") unless ids.uniq == ids
        cases
      end

      def bounded_number?(value)
        value.is_a?(Numeric) && value.finite? && value.abs <= 1_000_000_000
      end

      def poll_test_run(job)
        transition(job) { job[:cases] = @evaluator.call(copy(job[:cases])) }
        result = job.slice(:id, :status, :simulated, :error)
        result[:cases] = job[:cases] if job[:status] == "completed"
        result
      end

      def create_assessment(submission, context, payload, key)
        fail_with("INVALID_REQUEST", "AI assessment requests must have an empty body.") unless payload.empty?
        job_request(:ai_assessment, submission[:id], context, payload, key) do
          existing = @assessments.values.select { |job| job[:review_submission_id] == submission[:id] }
          latest = existing.last
          # Same server-owned rubric/prompt/model configuration for this mock.
          if latest && (latest[:status] != "failed" || existing.size >= 3)
            latest
          else
            job = { id: next_id, context: context, review_submission_id: submission[:id], status: "queued",
                    source: "ai", simulated: true, rubric_version_id: submission[:rubric_version_id],
                    model_version: Assessor::MODEL_VERSION, prompt_version: Assessor::PROMPT_VERSION,
                    created_at: timestamp }
            job[:poll_url] = "/courses/#{context.first}/codelens/ai_assessments/#{job[:id]}"
            @assessments[job[:id].to_s] = job
          end
        end
      end

      def poll_assessment(job)
        submission = @submissions.fetch(job[:review_submission_id].to_s)
        transition(job) { job[:feedback] = @assessor.call(copy(submission)) }
        if job[:status] == "completed"
          @attempts.fetch(submission[:attempt_id].to_s)[:ai_viewed] = true
        end
        job.slice(:id, :review_submission_id, :status, :source, :simulated, :rubric_version_id,
                  :model_version, :prompt_version, :feedback, :error)
      end

      def transition(job)
        case job[:status]
        when "queued" then job[:status] = "running"
        when "running"
          begin
            yield
            job[:status] = "completed"
          rescue StandardError
            job[:status] = "failed"
            job[:error] = { code: "MOCK_JOB_FAILED", message: "The simulated job failed. Your review is preserved." }
          end
          job[:completed_at] = timestamp
        end
      end

      def evidence_for(review, attempt)
        review.fetch("criteria", []).flat_map { |criterion| criterion.fetch("test_run_ids", []) }.uniq.map do |id|
          run = @test_runs[id.to_s]
          unless run && run[:attempt_id] == attempt[:id] && run[:context] == attempt[:context] &&
                 run[:activity_version_id] == attempt[:activity_version_id] && run[:status] == "completed"
            fail_with("INVALID_EVIDENCE", "Evidence must be a completed run from this attempt and version.")
          end
          copy(run.slice(:id, :activity_version_id, :artifact_digest, :cases, :simulated))
        end
      end
    end
  end
end
