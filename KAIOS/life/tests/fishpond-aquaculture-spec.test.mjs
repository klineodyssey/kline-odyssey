import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validatePopulationContract } from "../aquaculture/aquaculture-spec-validator.mjs";

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
for(const field of ["feed","harvests","inventory","orders","cold_chain","action_log"])assert.ok(main.required.includes(field),field);
assert.equal(main.properties.cold_chain.items.$ref,"KAIOS_AQUACULTURE_COLD_CHAIN_SCHEMA_V1.json");
assert.ok(main["x-kaios-invariants"].some((rule)=>rule.includes("sum(populations[*].count)")));
const refs=JSON.stringify(main).match(/KAIOS_[A-Z0-9_]+\.json/g)??[];
for(const ref of new Set(refs))await readFile(resolve(base,ref),"utf8");
const population=JSON.parse(await readFile(resolve(base,"KAIOS_AQUACULTURE_POPULATION_SCHEMA_V1.json"),"utf8"));
assert.equal(population.allOf.length,2);
assert.equal(population.allOf[0].then.properties.stock_type.const,"FISH_JUVENILE_STOCK");
assert.equal(population.allOf[1].then.properties.stock_type.const,"SHRIMP_POST_LARVAL_STOCK");
for(const reason of ["POND_NOT_READY","WATER_UNSTABLE","LOW_OXYGEN","WRONG_TEMPERATURE","WRONG_SALINITY","STOCK_NOT_AVAILABLE","TRANSPORT_NOT_AVAILABLE","OVER_CARRYING_CAPACITY","HEALTH_CHECK_FAILED_SIMULATION","QUARANTINE_NOT_COMPLETE"])assert.ok(population.properties.blocked_reason.enum.includes(reason));
const boundaries={maximum_population:500};
const mismatched=validatePopulationContract([{population_id:"FISH-1",species_id:"SPECIES-KAIOS-FOUNDATIONAL-FISH",stock_type:"SHRIMP_POST_LARVAL_STOCK",count:10}],boundaries,population,main);
assert.equal(mismatched.valid,false);
assert.deepEqual(mismatched.issues,["STOCK_TYPE_MISMATCH:FISH-1"]);
const overCap=validatePopulationContract([
  {population_id:"FISH-1",species_id:"SPECIES-KAIOS-FOUNDATIONAL-FISH",stock_type:"FISH_JUVENILE_STOCK",count:300},
  {population_id:"SHRIMP-1",species_id:"SPECIES-KAIOS-FOUNDATIONAL-SHRIMP",stock_type:"SHRIMP_POST_LARVAL_STOCK",count:250}
],boundaries,population,main);
assert.equal(overCap.valid,false);
assert.deepEqual(overCap.issues,["POPULATION_CAP_REACHED"]);
assert.equal(validatePopulationContract([
  {population_id:"FISH-1",species_id:"SPECIES-KAIOS-FOUNDATIONAL-FISH",stock_type:"FISH_JUVENILE_STOCK",count:250},
  {population_id:"SHRIMP-1",species_id:"SPECIES-KAIOS-FOUNDATIONAL-SHRIMP",stock_type:"SHRIMP_POST_LARVAL_STOCK",count:250}
],boundaries,population,main).valid,true);
const construction=JSON.parse(await readFile(resolve(base,"KAIOS_AQUACULTURE_CONSTRUCTION_SCHEMA_V1.json"),"utf8"));
assert.equal(construction.properties.completed_stages.items.enum.length,17);
assert.equal(construction.properties.completed_stages.items.enum.includes("INSTANT_COMPLETE"),false);
const envelope=JSON.parse(await readFile(resolve(base,"KAIOS_AQUACULTURE_CURSOR_TASK_ENVELOPE.json"),"utf8"));
const registry=JSON.parse(await readFile(resolve(root,"KGEN-KAIOS/worker_registry.json"),"utf8"));
const dispatch=registry.dispatch_history.find(({task_id})=>task_id===envelope.task_id);
assert.equal(dispatch.worker_id,envelope.worker_id);
assert.equal(dispatch.branch,envelope.branch);
assert.equal(dispatch.status,"COMPLETED_CODEX_REVIEWED");
assert.equal(registry.workers.find(({worker_id})=>worker_id===envelope.worker_id).current_task,null);
console.log("KAIOS_FISHPOND_AQUACULTURE_SPEC_TEST_PASS");
