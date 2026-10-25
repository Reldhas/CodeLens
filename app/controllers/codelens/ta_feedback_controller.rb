module Codelens
  class TaFeedbackController < ApplicationController
    def show
      mock_operation(:ta_feedback, id: params[:id])
    end
  end
end
