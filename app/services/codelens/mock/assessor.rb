module Codelens
  module Mock
    class Assessor
      MODEL_VERSION = "mock-no-model-v1".freeze
      PROMPT_VERSION = "mock-feedback-v1".freeze

      def call(submission)
        {
          summary: "Mock feedback only: no AI model has evaluated this review.",
          criteria: submission[:review].fetch("criteria").map do |criterion|
            evidence = criterion.fetch("line_numbers", []).map { |line| { type: "code_line", line: line } }
            evidence += criterion.fetch("test_run_ids", []).map { |id| { type: "test_run", id: id } }
            { criterion: criterion.fetch("criterion"), outcome: "not_assessable",
              explanation: "Your reasoning was saved. This mock does not judge its quality.",
              evidence: evidence, suggested_next_step: "Compare your reasoning with the approved reference explanation." }
          end,
          missed_issues: [], alternative_approaches: [], needs_human_review: true
        }
      end
    end
  end
end
