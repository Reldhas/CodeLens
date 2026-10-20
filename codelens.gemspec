Gem::Specification.new do |spec|
  spec.name = "codelens"
  spec.version = "0.1.0"
  spec.summary = "Student API endpoint scaffold for the CodeLens POC"
  spec.authors = ["CodeLens"]
  spec.files = Dir["app/**/*", "config/**/*", "lib/**/*", "README.md"]
  spec.required_ruby_version = ">= 3.2"
  spec.add_dependency "rails", ">= 7.1", "< 9"
  spec.add_development_dependency "rake"
  spec.add_development_dependency "minitest"
end
