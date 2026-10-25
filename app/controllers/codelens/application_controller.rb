module Codelens
  class ApplicationController < ActionController::API
    rescue_from ActionController::ParameterMissing do |error|
      render_error("INVALID_REQUEST", "A required request object is missing or invalid.", 422, error.param.to_s)
    end

    private

    def mock_operation(operation, id: nil, payload: {}, status: :ok)
      workflow = Rails.application.config.x.codelens.workflow
      return not_implemented unless workflow

      # The synthetic identity comes from host configuration, never the request.
      result = workflow.call(operation, course_id: params[:course_id],
                             owner_id: Rails.application.config.x.codelens.mock_owner_id,
                             id: id, payload: payload, key: request.headers["Idempotency-Key"])
      response.set_header("X-CodeLens-Mode", "mock")
      render json: result, status: status
    rescue Codelens::Mock::Workflow::Error => error
      render_error(error.code, error.message, error.status, error.field)
    end

    def mock_payload(name)
      return {} unless Rails.application.config.x.codelens.workflow

      object = params.require(name)
      raise ActionController::ParameterMissing, name unless object.is_a?(ActionController::Parameters)

      object.permit(:activity_id, :level, :lock_version, review: {}).to_h
    end

    def render_error(code, message, status, field = nil)
      render json: { errors: [{ code: code, message: message, field: field }],
                     request_id: request.request_id }, status: status
    end

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
