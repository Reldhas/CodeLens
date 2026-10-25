ENV["RAILS_ENV"] = "test"
# Tests opt in individually, independent of the developer's shell settings.
ENV.delete("CODELENS_MOCK_MODE")
require_relative "dummy/config/application"
Rails.application.initialize!
require "rails/test_help"
