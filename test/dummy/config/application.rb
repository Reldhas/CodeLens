require "bundler/setup"
require "codelens"

module CodelensEndpointHost
  class Application < Rails::Application
    config.eager_load = false
    config.api_only = true
    config.hosts = ["localhost", "127.0.0.1", "www.example.com"]
    config.secret_key_base = "local-endpoint-host-only-" * 4
    config.logger = Logger.new($stderr)

    routes.append do
      mount Codelens::Engine => "/"
    end
  end
end
