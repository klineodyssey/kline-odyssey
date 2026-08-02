export function parseStrictJson(text) {
  let cursor = 0;
  const fail = (code) => { throw new SyntaxError(`${code}@${cursor}`); };
  const skipWhitespace = () => {
    while (cursor < text.length && /\s/.test(text[cursor])) cursor += 1;
  };
  const parseString = () => {
    if (text[cursor] !== '"') fail("EXPECTED_JSON_STRING");
    const start = cursor++;
    while (cursor < text.length) {
      if (text[cursor] === "\\") {
        cursor += 2;
        continue;
      }
      if (text[cursor] === '"') {
        cursor += 1;
        return JSON.parse(text.slice(start, cursor));
      }
      cursor += 1;
    }
    fail("UNTERMINATED_JSON_STRING");
  };
  const parseValue = () => {
    skipWhitespace();
    if (text[cursor] === '"') return parseString();
    if (text[cursor] === "{") return parseObject();
    if (text[cursor] === "[") return parseArray();
    for (const [literal, value] of [["true", true], ["false", false], ["null", null]]) {
      if (text.startsWith(literal, cursor)) {
        cursor += literal.length;
        return value;
      }
    }
    const number = text.slice(cursor).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!number) fail("INVALID_JSON_VALUE");
    cursor += number[0].length;
    return Number(number[0]);
  };
  const parseArray = () => {
    const result = [];
    cursor += 1;
    skipWhitespace();
    if (text[cursor] === "]") {
      cursor += 1;
      return result;
    }
    while (cursor < text.length) {
      result.push(parseValue());
      skipWhitespace();
      if (text[cursor] === "]") {
        cursor += 1;
        return result;
      }
      if (text[cursor] !== ",") fail("EXPECTED_ARRAY_SEPARATOR");
      cursor += 1;
    }
    fail("UNTERMINATED_JSON_ARRAY");
  };
  const parseObject = () => {
    const result = {};
    const keys = new Set();
    cursor += 1;
    skipWhitespace();
    if (text[cursor] === "}") {
      cursor += 1;
      return result;
    }
    while (cursor < text.length) {
      skipWhitespace();
      const key = parseString();
      if (keys.has(key)) fail(`DUPLICATE_JSON_KEY:${key}`);
      keys.add(key);
      skipWhitespace();
      if (text[cursor] !== ":") fail("EXPECTED_OBJECT_COLON");
      cursor += 1;
      result[key] = parseValue();
      skipWhitespace();
      if (text[cursor] === "}") {
        cursor += 1;
        return result;
      }
      if (text[cursor] !== ",") fail("EXPECTED_OBJECT_SEPARATOR");
      cursor += 1;
    }
    fail("UNTERMINATED_JSON_OBJECT");
  };

  const result = parseValue();
  skipWhitespace();
  if (cursor !== text.length) fail("TRAILING_JSON_CONTENT");
  return result;
}

export const REQUIRED_DIVISIONS = Object.freeze([
  "CUSTOMER_SERVICE_DIVISION", "REQUIREMENTS_DIVISION", "ARCHITECTURE_DIVISION",
  "LIFE_CREATION_DIVISION", "DESIGN_DIVISION", "PHYSICS_REVIEW_DIVISION",
  "ECONOMY_REVIEW_DIVISION", "RIGHTS_REVIEW_DIVISION", "CIVILIZATION_REVIEW_DIVISION",
  "PROCUREMENT_DIVISION", "SUPPLY_CHAIN_DIVISION", "LABOR_DIVISION",
  "CONSTRUCTION_DIVISION", "MANUFACTURING_DIVISION", "LOGISTICS_DIVISION",
  "QA_INSPECTION_DIVISION", "FINANCE_DIVISION", "RISK_DIVISION",
  "LEGAL_SIMULATION_DIVISION", "MAINTENANCE_DIVISION", "DELIVERY_DIVISION"
]);

export const REQUIRED_GATES = Object.freeze([
  "PHYSICS_GATE", "TIME_GATE", "LOCATION_GATE", "LAND_GATE", "RIGHTS_GATE",
  "CIVILIZATION_GATE", "TECHNOLOGY_GATE", "ENERGY_GATE", "MATERIAL_GATE",
  "LABOR_GATE", "EQUIPMENT_GATE", "LOGISTICS_GATE", "ECONOMY_GATE",
  "SAFETY_GATE", "ENVIRONMENT_GATE", "QUALITY_GATE"
]);

export const REQUIRED_TEMPLATES = Object.freeze([
  "FISHPOND_PROJECT", "BASIC_HOUSE_PROJECT", "SMALL_FARM_PROJECT",
  "WAREHOUSE_PROJECT", "BASIC_ROAD_PROJECT", "SMALL_BRIDGE_PROJECT",
  "WORKSHOP_PROJECT", "LIFE_PACKAGE_PROJECT", "SOFTWARE_MODULE_PROJECT"
]);

export function validateAiCompanySpecification({ schemas, specification, crosswalk }) {
  const issues = [];
  const ids = new Set();
  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") issues.push(`SCHEMA_DRAFT:${name}`);
    if (!schema.$id || ids.has(schema.$id)) issues.push(`SCHEMA_ID:${name}`);
    ids.add(schema.$id);
    if (schema.type !== "object") issues.push(`SCHEMA_ROOT_TYPE:${name}`);
  }

  const organization = schemas.KAIOS_AI_COMPANY_ORGANIZATION_SCHEMA_V1;
  const divisions = organization?.properties?.divisions?.items?.properties?.division_id?.enum ?? [];
  if (divisions.length !== REQUIRED_DIVISIONS.length || REQUIRED_DIVISIONS.some((id) => !divisions.includes(id))) {
    issues.push("DIVISION_CONTRACT_MISMATCH");
  }

  const templates = schemas.KAIOS_AI_COMPANY_PROJECT_SCHEMA_V1?.properties?.template_id?.enum ?? [];
  if (templates.length !== REQUIRED_TEMPLATES.length || REQUIRED_TEMPLATES.some((id) => !templates.includes(id))) {
    issues.push("PROJECT_TEMPLATE_MISMATCH");
  }

  for (const gate of REQUIRED_GATES) if (!specification.includes(gate)) issues.push(`MISSING_GATE:${gate}`);
  for (const boundary of ["NO_REAL_WALLET", "NO_REAL_KGEN", "NO_PRODUCTION_AUTHORITY", "NO_EXTERNAL_AUTONOMY"]) {
    if (!specification.includes(boundary)) issues.push(`MISSING_BOUNDARY:${boundary}`);
  }
  if (!specification.includes("BLOCKED_DEPENDENCY") || !specification.includes("SMALL_FARM_PROJECT")) issues.push("FARM_DEPENDENCY_POLICY_MISSING");
  if (!specification.includes("GET") || !specification.includes("Mutation endpoints are `FALSE`")) issues.push("READ_ONLY_API_POLICY_MISSING");
  if (!crosswalk.includes("SEVEN_PAIR_LINEAGE_CONFLICT") || !crosswalk.includes("SOURCE_UNDERSPECIFIED")) issues.push("SOURCE_CONFLICT_POLICY_MISSING");
  if (!crosswalk.includes("PROGRAM_REGISTRY_DOMAIN_MISMATCH")) issues.push("REGISTRY_DOMAIN_MISMATCH_POLICY_MISSING");
  return { valid: issues.length === 0, issues, schema_count: Object.keys(schemas).length, division_count: divisions.length, template_count: templates.length, gate_count: REQUIRED_GATES.length };
}
