import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");
const specRoot = path.join(root, "KAIOS", "ai-company");
const schemaFiles = fs.readdirSync(specRoot).filter((name) => name.endsWith("_SCHEMA_V1.json"));
const schemas = Object.fromEntries(schemaFiles.map((name) => [name.replace(".json", ""), JSON.parse(fs.readFileSync(path.join(specRoot, name), "utf8"))]));
const specification = fs.readFileSync(path.join(specRoot, "KAIOS_AI_COMPANY_ORDER_PROJECT_RUNTIME_V1_SPEC.md"), "utf8");
const crosswalk = fs.readFileSync(path.join(specRoot, "KAIOS_AI_COMPANY_SOURCE_CROSSWALK.md"), "utf8");
const validator = await import(pathToFileURL(path.join(specRoot, "ai-company-spec-validator.mjs")));

function resolvePointer(document, pointer) {
  return pointer.replace(/^#\//, "").split("/").reduce((value, token) => {
    const key = token.replaceAll("~1", "/").replaceAll("~0", "~");
    return value[key];
  }, document);
}

function visitSchema(node, document, visit) {
  if (Array.isArray(node)) return node.forEach((item) => visitSchema(item, document, visit));
  if (!node || typeof node !== "object") return;
  visit(node, document);
  Object.values(node).forEach((value) => visitSchema(value, document, visit));
}

test("AI Company specification schemas and policy gates are complete", () => {
  assert.equal(schemaFiles.length, 12);
  assert.deepEqual(validator.validateAiCompanySpecification({ schemas, specification, crosswalk }), {
    valid: true,
    issues: [],
    schema_count: 12,
    division_count: 21,
    template_count: 9,
    gate_count: 16
  });
});

test("all schema references and required members resolve deeply", () => {
  for (const schema of Object.values(schemas)) {
    visitSchema(schema, schema, (node, document) => {
      if (node.required) {
        assert.ok(node.properties, "required members need a properties object");
        for (const key of node.required) assert.ok(key in node.properties, `${key} must be declared`);
      }
      if (!node.$ref) return;
      if (node.$ref.startsWith("#/")) {
        assert.ok(resolvePointer(document, node.$ref), `${node.$ref} must resolve`);
        return;
      }
      const [file, fragment] = node.$ref.split("#");
      const target = schemas[file.replace(".json", "")];
      assert.ok(target, `${file} must exist`);
      if (fragment) assert.ok(resolvePointer(target, `#${fragment}`), `${node.$ref} must resolve`);
    });
  }
});

test("task and authority contracts forbid instant or external work", () => {
  const task = schemas.KAIOS_AI_COMPANY_TASK_SCHEMA_V1;
  assert.equal(task.properties.duration_hours.exclusiveMinimum, 0);
  const boundaries = schemas.KAIOS_AI_COMPANY_SCHEMA_V1.$defs.boundaries.properties;
  assert.equal(boundaries.production_authority.const, false);
  assert.equal(boundaries.external_autonomy.const, false);
  assert.equal(boundaries.unbounded_spending.const, false);
  assert.equal(boundaries.self_modifying_code.const, false);
  assert.equal(boundaries.mutation_endpoints.const, false);
  assert.match(specification, /KAIOS AI 公司創造中心/);
});

test("farm and life-package demonstrations are bounded", () => {
  assert.match(specification, /SMALL_FARM_PROJECT[\s\S]*BLOCKED_DEPENDENCY/);
  assert.match(specification, /LIFE_PACKAGE_PROJECT[\s\S]*candidate/i);
  assert.match(specification, /no automatic Canonical promotion/i);
});
