require "bundler/setup"
require "codelens"

module CodelensEndpointHost
  class Application < Rails::Application
    config.eager_load = false
    config.api_only = true
    config.hosts = ["localhost", "127.0.0.1", "www.example.com"]
    config.secret_key_base = "local-endpoint-host-only-" * 4
    config.logger = Logger.new($stderr)

    config.x.codelens.workflow = nil
    config.x.codelens.mock_owner_id = "student-1"

    config.after_initialize do
      if ENV["CODELENS_MOCK_MODE"] == "1"
        config.x.codelens.workflow = Codelens::Mock::Workflow.new
      end
    end

    routes.append do
      mount Codelens::Engine => "/"
    end
  end
end
