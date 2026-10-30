// Curated variants share titles so setup does not reveal whether an issue exists.
export function additionalSamples([seats, discount]) {
  const cleanSeats = { ...seats, id: 'seats-clean', code: seats.reference.split('\n'), findings: [] };
  const cleanDiscount = { ...discount, id: 'discount-clean', code: discount.reference.split('\n'), findings: [] };
  return [cleanSeats, cleanDiscount,
    { ...cleanSeats, id: 'seats-maintainability',
      requirements: [...seats.requirements, 'Use descriptive parameter and local variable names so another developer can maintain the booking logic.'],
      code: ['def available_seats(a, b):', '    c = set(a)', '    return [d for d in b if d not in c]'],
      findings: [{ dimension: 'Maintainability', start: 1, end: 3, keywords: ['name', 'naming', 'variable', 'readability', 'readable', 'descriptive'], fixes: ['rename', 'descriptive', 'booked', 'requested'], claim: 'Single-letter names hide the purpose of each value.', reasoning: 'The result is correct and membership is efficient, but a, b, c and d do not communicate which seats are booked or requested. This makes later changes harder to review.', fix: 'Rename the parameters to booked and requested, the set to booked_set, and the loop variable to seat.' }] },
    { ...cleanDiscount, id: 'discount-maintainability',
      requirements: [...discount.requirements, 'Give the discount threshold and rate named constants so pricing rules are easy to change.'],
      findings: [{ dimension: 'Maintainability', start: 4, end: 5, keywords: ['constant', 'magic', 'literal', '100', '0.9', 'name'], fixes: ['constant', 'threshold', 'rate'], claim: 'The threshold and discount multiplier are unexplained numeric literals.', reasoning: 'The numeric values implement the current rule correctly, but changing the pricing policy is clearer when the threshold and rate are named in one place.', fix: 'Introduce DISCOUNT_THRESHOLD = 100 and DISCOUNT_RATE = 0.10, then use those constants.' }],
      reference: 'DISCOUNT_THRESHOLD = 100\nDISCOUNT_RATE = 0.10\n\ndef discounted_total(total):\n    if total < 0:\n        raise ValueError("Total must be non-negative")\n    if total >= DISCOUNT_THRESHOLD:\n        return total * (1 - DISCOUNT_RATE)\n    return total' },
    { ...cleanSeats, id: 'seats-appropriateness',
      requirements: [...seats.requirements, 'Use direct membership testing; do not dynamically evaluate Python source for a seat lookup.'],
      code: ['def available_seats(booked, requested):', '    booked_set = set(booked)', '    available = []', '    for seat in requested:', '        if eval("seat not in booked_set"):', '            available.append(seat)', '    return available'],
      findings: [{ dimension: 'Appropriateness', start: 5, end: 5, keywords: ['eval', 'dynamic', 'evaluate'], fixes: ['not in', 'direct', 'membership', 'remove eval'], claim: 'Dynamic evaluation is unnecessary for a fixed membership condition.', reasoning: 'The expression is known ahead of time. Using eval adds dynamic-code machinery to a simple membership test and violates the requested approach.', fix: 'Replace eval("seat not in booked_set") with seat not in booked_set.' }] },
    { ...cleanDiscount, id: 'discount-appropriateness',
      requirements: [...discount.requirements, 'Express the discount rule directly with comparisons and arithmetic, without evaluating source strings.'],
      code: ['def discounted_total(total):', '    if total < 0:', '        raise ValueError("Total must be non-negative")', '    return eval("total * 0.9 if total >= 100 else total")'],
      findings: [{ dimension: 'Appropriateness', start: 4, end: 4, keywords: ['eval', 'dynamic', 'evaluate'], fixes: ['if', 'direct', 'remove eval', 'comparison'], claim: 'A fixed pricing rule is implemented by evaluating a string.', reasoning: 'This expression can be written directly in Python. Dynamic evaluation is an unnecessary technique and conflicts with the explicit requirement.', fix: 'Use a normal if total >= 100 branch and return the calculated value directly.' }] }
  ];
}
