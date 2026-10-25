module Codelens
  class TestRunsController < ApplicationController
    def create
      return not_implemented unless Rails.application.config.x.codelens.workflow

      object = params.require(:test_run)
      raise ActionController::ParameterMissing, :test_run unless object.is_a?(ActionController::Parameters)

      # Preserve nested shapes for the strict fixture-specific service validator.
      payload = params.slice(:test_run).permit(test_run: {}).to_h.fetch("test_run")
      mock_operation(:create_test_run, id: params[:attempt_id], payload: payload, status: :accepted)
    end

    def show
      mock_operation(:test_run, id: params[:id])
    end
  end
end
