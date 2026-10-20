Codelens::Engine.routes.draw do
  scope "courses/:course_id/codelens" do
    resources :attempts, only: [:create, :show] do
      patch :draft, on: :member, to: "drafts#update"
      resources :test_runs, only: :create
      resources :review_submissions, only: :create
      get :reference_solutions, on: :member, to: "reference_solutions#index"
    end

    resources :test_runs, only: :show
    resources :review_submissions, only: [] do
      resources :ai_assessments, only: :create
      get :ta_feedback, on: :member, to: "ta_feedback#show"
    end
    resources :ai_assessments, only: :show
  end
end
