require_relative "test_helper"

class EndpointsTest < ActionDispatch::IntegrationTest
  ENDPOINTS = [
    [:post, "/attempts"],
    [:get, "/attempts/81"],
    [:patch, "/attempts/81/draft"],
    [:post, "/attempts/81/test_runs"],
    [:get, "/test_runs/91"],
    [:post, "/attempts/81/review_submissions"],
    [:post, "/review_submissions/101/ai_assessments"],
    [:get, "/ai_assessments/114"],
    [:get, "/attempts/81/reference_solutions"],
    [:get, "/review_submissions/101/ta_feedback"]
  ].freeze

  ENDPOINTS.each do |method, path|
    test "#{method} #{path} is declared and explicitly unavailable" do
      public_send(method, "/courses/12/codelens#{path}", as: :json)
      assert_response :not_implemented
      body = response.parsed_body
      assert_equal "ENDPOINT_NOT_IMPLEMENTED", body.fetch("errors").first.fetch("code")
      assert body.fetch("request_id").present?
      assert_equal %w[errors request_id], body.keys.sort
    end
  end

  test "activities and management routes are excluded" do
    ["/activities", "/manage/activities", "/auth/login"].each do |path|
      assert_raises(ActionController::RoutingError) do
        Codelens::Engine.routes.recognize_path("/courses/12/codelens#{path}", method: :get)
      end
    end
  end
end
