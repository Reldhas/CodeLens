require_relative "test_helper"

class MockJobsTest < ActionDispatch::IntegrationTest
  BASE = "/courses/12/codelens".freeze

  setup do
    Rails.application.config.x.codelens.workflow = Codelens::Mock::Workflow.new
    Rails.application.config.x.codelens.mock_owner_id = "student-1"
  end

  teardown do
    Rails.application.config.x.codelens.workflow = nil
    Rails.application.config.x.codelens.mock_owner_id = "student-1"
  end

  def attempt(level = "beginner")
    post "#{BASE}/attempts", params: { attempt: { activity_id: 15, level: level } }, as: :json
    assert_response :created
    response.parsed_body.fetch("id")
  end

  def cases(amount = 500)
    [{ client_case_id: "case-1", inputs: { amount: amount }, prediction: { kind: "value", value: 400 } }]
  end

  def create_run(id, values = cases, key: "run-1")
    post "#{BASE}/attempts/#{id}/test_runs", params: { test_run: { cases: values } },
         headers: { "Idempotency-Key" => key }, as: :json
    response.parsed_body
  end

  def finish(url)
    get url
    assert_response :ok
    assert_equal "running", response.parsed_body["status"]
    get url
    assert_response :ok
    response.parsed_body
  end

  def submit(id, evidence = [])
    review = { decision: "request_changes", summary: "Incorrect rate", proposed_changes: "Use 20%", criteria:
      Codelens::Mock::Workflow::CRITERIA.map { |name| { criterion: name, judgment: "needs_changes", reasoning: "Check rate", test_run_ids: evidence, line_numbers: [3] } } }
    post "#{BASE}/attempts/#{id}/review_submissions", params: { review_submission: { lock_version: 0, review: review } },
         headers: { "Idempotency-Key" => "submit-1" }, as: :json
    response.parsed_body
  end

  def assess(id, key = "ai-1")
    post "#{BASE}/review_submissions/#{id}/ai_assessments", headers: { "Idempotency-Key" => key }, as: :json
    response.parsed_body
  end

  test "test lifecycle returns simulated actual expected and prediction verdicts" do
    id = attempt
    job = create_run(id)
    assert_response :accepted
    assert_equal "queued", job["status"]
    result = finish(job["poll_url"])
    assert_equal "completed", result["status"]
    assert_equal true, result["simulated"]
    item = result["cases"].first
    assert_equal 450, item.dig("actual", "value")
    assert_equal 400, item.dig("expected", "value")
    assert_equal false, item["prediction_matches_actual"]
    assert_equal false, item["actual_meets_requirement"]
    get job["poll_url"]
    assert_equal result, response.parsed_body
    get "#{BASE}/attempts/#{id}/reference_solutions"
    assert_response :forbidden
  end

  test "negative input has unknown expected outcome and can predict an error" do
    id = attempt
    values = cases(-1)
    values[0][:prediction] = { kind: "error", error_code: "INVALID_INPUT" }
    job = create_run(id, values)
    result = finish(job["poll_url"])["cases"].first
    assert_nil result["expected"]
    assert_nil result["actual_meets_requirement"]
    assert_equal false, result["prediction_matches_actual"]
  end

  test "test jobs require keys and reject duplicate-key payload changes" do
    id = attempt
    first = create_run(id)
    assert_equal first, create_run(id)
    create_run(id, cases(100))
    assert_response :conflict
    create_run(id, key: "")
    assert_response :unprocessable_entity
  end

  test "invalid or executable inputs are rejected without jobs" do
    id = attempt
    invalid = [[], cases * 11, cases * 2, cases("1; system('anything')"), cases(1e10)]
    invalid << [cases.first.merge(code: "print('bad')")]
    invalid << [cases.first.merge(inputs: { amount: 2, path: "/tmp" })]
    invalid << [cases.first.merge(prediction: { kind: "value", value: "400" })]
    invalid.each do |values|
      create_run(id, values)
      assert_response :unprocessable_entity
    end
    %w[intermediate advanced].each do |level|
      create_run(attempt(level))
      assert_response :unprocessable_entity
      assert_equal "TESTING_NOT_AVAILABLE", response.parsed_body.dig("errors", 0, "code")
    end
  end

  test "only completed evidence from the same attempt can be submitted" do
    id = attempt
    job = create_run(id)
    submit(id, [job["id"]])
    assert_response :unprocessable_entity
    finish(job["poll_url"])
    submit(attempt, [job["id"]])
    assert_response :unprocessable_entity
    submission = submit(id, [job["id"]])
    assert_response :created
    ai = assess(submission["id"])
    assert_response :accepted
    assert_equal ai["id"], assess(submission["id"], "inflight-key")["id"]
    feedback = finish(ai["poll_url"])
    assert_equal "ai", feedback["source"]
    assert_equal true, feedback["simulated"]
    assert_equal 4, feedback.dig("feedback", "criteria").size
    assert feedback.dig("feedback", "criteria").all? { |item| item["outcome"] == "not_assessable" }
    assert_includes feedback.dig("feedback", "criteria", 0, "evidence"), { "type" => "test_run", "id" => job["id"] }
    assert_equal ai["id"], assess(submission["id"], "another-key")["id"]
    get "#{BASE}/review_submissions/#{submission['id']}/ta_feedback"
    assert_equal({ "feedback" => nil }, response.parsed_body)
  end

  test "polling and job creation enforce student and course ownership" do
    id = attempt
    job = create_run(id)
    submission = submit(id)
    ai = assess(submission["id"])
    Rails.application.config.x.codelens.mock_owner_id = "student-2"
    [job["poll_url"], ai["poll_url"]].each do |url|
      get url
      assert_response :not_found
    end
    create_run(id)
    assert_response :not_found
    assess(submission["id"])
    assert_response :not_found
    Rails.application.config.x.codelens.mock_owner_id = "student-1"
    get job["poll_url"].sub("/12/", "/99/")
    assert_response :not_found
    get ai["poll_url"].sub("/12/", "/99/")
    assert_response :not_found
  end

  test "AI settings cannot be supplied by the student" do
    submission = submit(attempt)
    post "#{BASE}/review_submissions/#{submission['id']}/ai_assessments", params: { model: "other", prompt: "override" },
         headers: { "Idempotency-Key" => "ai-1" }, as: :json
    assert_response :unprocessable_entity
    assess(submission["id"], "")
    assert_response :unprocessable_entity
  end

  test "AI uses the frozen review and evidence after later draft edits" do
    captured = nil
    assessor = lambda do |submission|
      captured = submission
      Codelens::Mock::Assessor.new.call(submission)
    end
    Rails.application.config.x.codelens.workflow = Codelens::Mock::Workflow.new(assessor: assessor)
    id = attempt
    job = create_run(id)
    finish(job["poll_url"])
    submission = submit(id, [job["id"]])
    patch "#{BASE}/attempts/#{id}/draft", params: { draft: { lock_version: 1, review: { summary: "Changed draft" } } }, as: :json
    assert_response :ok
    get "#{BASE}/attempts/#{id}/reference_solutions"
    ai = assess(submission["id"])
    finish(ai["poll_url"])
    assert_equal "Incorrect rate", captured[:review]["summary"]
    assert_equal job["id"], captured[:evidence].first[:id]
    assert_equal 450, captured[:evidence].first[:cases].first.dig("actual", "value")
    assert_equal false, captured[:feedback_exposure][:references_viewed]
    assert_equal false, captured[:feedback_exposure][:ai]
    assert_equal 22, captured[:activity_version_id]
    assert_equal 7, captured[:rubric_version_id]
  end

  test "provider failures preserve reviews and allow only two additional attempts" do
    failing = ->(*) { raise "private provider secret" }
    Rails.application.config.x.codelens.workflow = Codelens::Mock::Workflow.new(assessor: failing, evaluator: failing)
    id = attempt
    run = create_run(id)
    failed_run = finish(run["poll_url"])
    assert_equal "failed", failed_run["status"]
    assert_not failed_run.to_json.include?("secret")
    submit(id, [run["id"]])
    assert_response :unprocessable_entity
    submission = submit(id)
    original = assess(submission["id"])
    result = finish(original["poll_url"])
    assert_equal "failed", result["status"]
    assert_not result.to_json.include?("secret")
    assert_equal original["id"], assess(submission["id"])["id"]
    ids = [original["id"]]
    2.times do |index|
      retry_job = assess(submission["id"], "retry-#{index}")
      ids << retry_job["id"]
      assert_equal "failed", finish(retry_job["poll_url"])["status"]
    end
    assert_equal 3, ids.uniq.size
    assert_equal ids.last, assess(submission["id"], "over-limit")["id"]
    get "#{BASE}/attempts/#{id}"
    assert_equal [submission["id"]], response.parsed_body["review_submission_ids"]
    get "#{BASE}/attempts/#{id}/reference_solutions"
    assert_response :ok
  end
end
