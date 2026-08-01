export function validatePopulationContract(populations, boundaries, populationSchema, rootSchema) {
  const issues = [];
  const populationRules = populationSchema.allOf ?? [];
  const populationLimit = boundaries.maximum_population;
  const declaredInvariant = (rootSchema["x-kaios-invariants"] ?? [])
    .some((rule) => rule.includes("sum(populations[*].count)"));

  if (!declaredInvariant) issues.push("SHARED_POPULATION_INVARIANT_MISSING");
  if (!Number.isInteger(populationLimit) || populationLimit < 1) issues.push("INVALID_SHARED_POPULATION_CAP");

  let total = 0;
  for (const population of populations) {
    total += population.count;
    const rule = populationRules.find((candidate) =>
      candidate.if?.properties?.species_id?.const === population.species_id);
    const expectedStock = rule?.then?.properties?.stock_type?.const;
    if (!expectedStock || population.stock_type !== expectedStock) {
      issues.push(`STOCK_TYPE_MISMATCH:${population.population_id}`);
    }
  }

  if (total > populationLimit) issues.push("POPULATION_CAP_REACHED");
  return { valid: issues.length === 0, total_population: total, issues };
}
