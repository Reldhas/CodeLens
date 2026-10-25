require_relative "test_helper"

class MockConsistencyTest < ActiveSupport::TestCase
  test "mock initialization is refused in production" do
    previous = Rails.env
    begin
      Rails.env = "production"
      error = assert_raises(RuntimeError) { Codelens::Mock::Workflow.new }
      assert_match "require development or test", error.message
    ensure
      Rails.env = previous
    end
  end

  test "concurrent identical job requests create a single run" do
    workflow = Codelens::Mock::Workflow.new
    context = { course_id: "12", owner_id: "student-1" }
    id = workflow.call(:create, **context, payload: { "activity_id" => 15, "level" => "beginner" })[:id]
    payload = { "cases" => [{ "client_case_id" => "one", "inputs" => { "amount" => 500 },
                            "prediction" => { "kind" => "value", "value" => 400 } }] }
    results = 2.times.map do
      Thread.new { workflow.call(:create_test_run, **context, id: id, payload: payload, key: "same-key") }
    end.map(&:value)
    assert_equal results.first, results.last
    assert_equal "queued", results.first[:status]
  end

  test "simultaneous saves accept only one update at a given version" do
    workflow = Codelens::Mock::Workflow.new
    context = { course_id: "12", owner_id: "student-1" }
    id = workflow.call(:create, **context, payload: { "activity_id" => 15, "level" => "beginner" })[:id]
    results = 2.times.map do |index|
      Thread.new do
        workflow.call(:draft, **context, id: id,
                      payload: { "lock_version" => 0, "review" => { "summary" => "Draft #{index}" } })
        :saved
      rescue Codelens::Mock::Workflow::Error => error
        error.code
      end
    end.map(&:value)
    assert_equal 1, results.count(:saved)
    assert_equal 1, results.count("STALE_VERSION")
    assert_equal 1, workflow.call(:show, **context, id: id)[:lock_version]
  end

  test "responses cannot mutate stored drafts" do
    workflow = Codelens::Mock::Workflow.new
    context = { course_id: "12", owner_id: "student-1" }
    id = workflow.call(:create, **context, payload: { "activity_id" => 15, "level" => "beginner" })[:id]
    payload = { "lock_version" => 0, "review" => { "summary" => "Original" } }
    saved = workflow.call(:draft, **context, id: id, payload: payload)
    payload["review"]["summary"].replace("Mutated input")
    saved[:review]["summary"].replace("Mutated output")
    assert_equal "Original", workflow.call(:show, **context, id: id)[:draft]["summary"]
  end
end
