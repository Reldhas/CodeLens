module Codelens
  class AiAssessmentsController < ApplicationController
    def create
      return not_implemented unless Rails.application.config.x.codelens.workflow
      unless request.request_parameters.empty?
        return render_error("INVALID_REQUEST", "AI assessment requests must have an empty body.", 422)
      end

      mock_operation(:create_assessment, id: params[:review_submission_id], status: :accepted)
    end

    def show
      mock_operation(:assessment, id: params[:id])
    end
  end
end
