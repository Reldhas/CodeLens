module Codelens
  class ReviewSubmissionsController < ApplicationController
    def create
      mock_operation(:submit, id: params[:attempt_id],
                     payload: mock_payload(:review_submission), status: :created)
    end
  end
end
