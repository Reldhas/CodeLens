module Codelens
  module Mock
    # Simulates only the fixed discount fixture. Never executes submitted code.
    class Evaluator
      def call(cases)
        cases.map do |item|
          amount = item.fetch("inputs").fetch("amount")
          actual = amount >= 500 ? amount * 0.9 : amount
          expected = amount.negative? ? nil : (amount >= 500 ? amount * 0.8 : amount)
          prediction = item.fetch("prediction")
          item.merge(
            "actual" => { "kind" => "value", "value" => actual },
            "expected" => expected.nil? ? nil : { "kind" => "value", "value" => expected },
            "prediction_matches_actual" => prediction["kind"] == "value" && close?(prediction["value"], actual),
            "actual_meets_requirement" => expected.nil? ? nil : close?(actual, expected)
          )
        end
      end

      private

      def close?(left, right)
        (left - right).abs <= 0.000001
      end
    end
  end
end
