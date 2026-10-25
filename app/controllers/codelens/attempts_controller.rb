module Codelens
  class AttemptsController < ApplicationController
    def create
      mock_operation(:create, payload: mock_payload(:attempt), status: :created)
    end

    def show
      mock_operation(:show, id: params[:id])
    end
  end
end
