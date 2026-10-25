module Codelens
  class ReferenceSolutionsController < ApplicationController
    def index
      mock_operation(:references, id: params[:id])
    end
  end
end
