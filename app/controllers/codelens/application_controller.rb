module Codelens
  # Deliberately exposes no data until platform authentication, course scoping
  # and application services are wired together.
  class ApplicationController < ActionController::API
    private

    def not_implemented
      render json: {
        errors: [{
          code: "ENDPOINT_NOT_IMPLEMENTED",
          message: "This endpoint is declared but its backend is not connected.",
          field: nil
        }],
        request_id: request.request_id
      }, status: :not_implemented
    end
  end
end
