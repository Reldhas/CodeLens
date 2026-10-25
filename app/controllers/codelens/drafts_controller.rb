module Codelens
  class DraftsController < ApplicationController
    def update
      mock_operation(:draft, id: params[:id], payload: mock_payload(:draft))
    end
  end
end
