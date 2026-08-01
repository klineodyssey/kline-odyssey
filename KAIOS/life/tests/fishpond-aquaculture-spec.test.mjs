import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root=resolve(import.meta.dirname,"../../..");
const base=resolve(root,"KAIOS/life/aquaculture");
const jsonFiles=["KAIOS_FISHPOND_SCHEMA_V1.json","KAIOS_AQUACULTURE_WATER_QUALITY_SCHEMA_V1.json","KAIOS_AQUACULTURE_POPULATION_SCHEMA_V1.json","KAIOS_AQUACULTURE_CONSTRUCTION_SCHEMA_V1.json","KAIOS_AQUACULTURE_HARVEST_SCHEMA_V1.json","KAIOS_AQUACULTURE_COLD_CHAIN_SCHEMA_V1.json","KAIOS_AQUACULTURE_ENTERPRISE_LEDGER_SCHEMA_V1.json","KAIOS_AQUACULTURE_EVENT_SCHEMA_V1.json"];
for(const name of jsonFiles){const value=JSON.parse(await readFile(resolve(base,name),"utf8"));assert.equal(value.$schema,"https://json-schema.org/draft/2020-12/schema");assert.equal(value.type,"object");assert.ok(Array.isArray(value.required));assert.equal(value.additionalProperties,false)}
const spec=await readFile(resolve(base,"KAIOS_FISHPOND_AQUACULTURE_RUNTIME_V1_SPEC.md"),"utf8");
for(let section=1;section<=42;section+=1)assert.match(spec,new RegExp(`## ${section}\\.`),`missing section ${section}`);
for(const marker of ["NO_REAL_WALLET","NO_REAL_KGEN","NO_REAL_FOOD_SAFETY_CERTIFICATION","NO_PRODUCTION_AUTHORITY","CURSOR_RESEARCH_ONLY","READY_FOR_STOCKING","SIMULATED_RIGHTS_ONLY"])assert.ok(spec.includes(marker),marker);
const crosswalk=await readFile(resolve(base,"KAIOS_FISHPOND_AQUACULTURE_SOURCE_CROSSWALK.md"),"utf8");
for(const chapter of [23,24,38,39,40,45,47,48,49,51,80,84,86,87,90,91,107,109,114,121,122,124,129,132])assert.match(crosswalk,new RegExp(`\\| ${chapter} \\|`),`chapter ${chapter}`);
const main=JSON.parse(await readFile(resolve(base,"KAIOS_FISHPOND_SCHEMA_V1.json"),"utf8"));
assert.equal(main.properties.boundaries.$ref,"#/$defs/boundaries");
assert.equal(main.$defs.boundaries.properties.production_authority.const,false);
assert.equal(main.$defs.boundaries.properties.maximum_population.maximum,500);
console.log("KAIOS_FISHPOND_AQUACULTURE_SPEC_TEST_PASS");
