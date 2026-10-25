require_relative "test_helper"

class MockWorkflowTest < ActionDispatch::IntegrationTest
  BASE = "/courses/12/codelens".freeze

  setup do
    Rails.application.config.x.codelens.workflow = Codelens::Mock::Workflow.new
    Rails.application.config.x.codelens.mock_owner_id = "student-1"
  end

  teardown do
    Rails.application.config.x.codelens.workflow = nil
    Rails.application.config.x.codelens.mock_owner_id = "student-1"
  end

  def create_attempt(level = "beginner")
    post "#{BASE}/attempts", params: { attempt: { activity_id: 15, level: level } }, as: :json
    assert_response :created
    response.parsed_body.fetch("id")
  end

  def review
    { decision: "request_changes", summary: "The discount is incorrect.", proposed_changes: "Use 20%.",
      criteria: Codelens::Mock::Workflow::CRITERIA.map do |name|
        { criterion: name, judgment: "needs_changes", reasoning: "Compare the rule and code.", line_numbers: [3] }
      end }
  end

  def submit(id, body = review, version: 0, key: "submission-1")
    post "#{BASE}/attempts/#{id}/review_submissions",
         params: { review_submission: { lock_version: version, review: body } },
         headers: { "Idempotency-Key" => key }, as: :json
  end

  test "student completes review and references unlock only after submission" do
    id = create_attempt
    assert_equal "mock", response.headers["X-CodeLens-Mode"]
    get "#{BASE}/attempts/#{id}"
    assert_response :ok
    assert_nil response.parsed_body["draft"]
    assert_equal false, response.parsed_body.dig("capabilities", "can_view_references")
    assert_equal false, response.parsed_body.dig("capabilities", "can_run_tests")
    assert_not response.body.include?("rubric_explanations")
    get "#{BASE}/attempts/#{id}/reference_solutions"
    assert_response :forbidden
    patch "#{BASE}/attempts/#{id}/draft", params: { draft: { lock_version: 0, review: { summary: "First thought" } } }, as: :json
    assert_response :ok
    assert_equal 1, response.parsed_body["lock_version"]
    submit(id, version: 1)
    assert_response :created
    submission_id = response.parsed_body["id"]
    get "#{BASE}/attempts/#{id}/reference_solutions"
    assert_response :ok
    assert_equal 4, response.parsed_body["rubric_explanations"].size
    get "#{BASE}/review_submissions/#{submission_id}/ta_feedback"
    assert_response :ok
    assert_nil response.parsed_body["feedback"]
    get "#{BASE}/attempts/#{id}"
    assert_equal [submission_id], response.parsed_body["review_submission_ids"]
    assert_nil response.parsed_body["draft"]
  end

  test "stale drafts and submissions do not change stored content" do
    id = create_attempt
    patch "#{BASE}/attempts/#{id}/draft", params: { draft: { lock_version: 0, review: { summary: "Saved" } } }, as: :json
    patch "#{BASE}/attempts/#{id}/draft", params: { draft: { lock_version: 0, review: { summary: "Stale" } } }, as: :json
    assert_response :conflict
    submit(id)
    assert_response :conflict
    get "#{BASE}/attempts/#{id}"
    assert_equal "Saved", response.parsed_body.dig("draft", "summary")
    assert_empty response.parsed_body["review_submission_ids"]
  end

  test "submission retries are idempotent and revisions are separate" do
    id = create_attempt
    submit(id)
    assert_response :created
    first = response.parsed_body
    submit(id)
    assert_response :created
    assert_equal first, response.parsed_body
    submit(id, review.merge(summary: "Different"))
    assert_response :conflict
    submit(id, review.merge(summary: "Revision"), version: 1, key: "revision-2")
    assert_response :created
    second = response.parsed_body["id"]
    get "#{BASE}/attempts/#{id}"
    assert_equal [first["id"], second], response.parsed_body["review_submission_ids"]
    assert_equal 2, response.parsed_body["lock_version"]
  end

  test "records are scoped to the configured student and course" do
    id = create_attempt
    submit(id)
    submission_id = response.parsed_body["id"]
    Rails.application.config.x.codelens.mock_owner_id = "student-2"
    get "#{BASE}/attempts/#{id}", params: { owner_id: "student-1" }
    assert_response :not_found
    patch "#{BASE}/attempts/#{id}/draft", params: { draft: { lock_version: 1, review: {} } }, as: :json
    assert_response :not_found
    submit(id, version: 1)
    assert_response :not_found
    get "#{BASE}/attempts/#{id}/reference_solutions"
    assert_response :not_found
    get "#{BASE}/review_submissions/#{submission_id}/ta_feedback"
    assert_response :not_found
    Rails.application.config.x.codelens.mock_owner_id = "student-1"
    get "/courses/99/codelens/attempts/#{id}"
    assert_response :not_found
  end

  test "invalid final reviews never release references" do
    id = create_attempt
    invalid = [review.merge(criteria: []), review.merge(proposed_changes: " "),
               review.merge(decision: "invalid"), review.merge(summary: ""),
               review.merge(criteria: [review[:criteria].first] * 4)]
    bad_line = review
    bad_line[:criteria][0][:line_numbers] = [500]
    invalid << bad_line
    bad_evidence = review
    bad_evidence[:criteria][0][:test_run_ids] = [91]
    invalid << bad_evidence
    invalid.each do |body|
      submit(id, body)
      assert_response :unprocessable_entity
    end
    get "#{BASE}/attempts/#{id}/reference_solutions"
    assert_response :forbidden
    submit(id, key: "")
    assert_response :unprocessable_entity
  end

  test "invalid request objects and unknown levels are rejected" do
    post "#{BASE}/attempts", params: { attempt: "wrong" }, as: :json
    assert_response :unprocessable_entity
    post "#{BASE}/attempts", params: { attempt: { activity_id: 15, level: "expert" } }, as: :json
    assert_response :unprocessable_entity
    post "#{BASE}/attempts", params: { attempt: { activity_id: 999, level: "beginner" } }, as: :json
    assert_response :unprocessable_entity
  end

  test "mock mode leaves test and AI jobs unimplemented" do
    id = create_attempt("advanced")
    post "#{BASE}/attempts/#{id}/test_runs", as: :json
    assert_response :not_implemented
    submit(id)
    submission_id = response.parsed_body["id"]
    post "#{BASE}/review_submissions/#{submission_id}/ai_assessments", as: :json
    assert_response :not_implemented
  end
end
