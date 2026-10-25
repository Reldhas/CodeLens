require_relative "test_helper"

class MockConsistencyTest < ActiveSupport::TestCase
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
