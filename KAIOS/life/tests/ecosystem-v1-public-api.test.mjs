import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const root=resolve(import.meta.dirname,"../../..");const api=resolve(root,"api/kaios/ecosystem/v1");
const expected=["events.json","food-web.json","habitats.json","index.json","populations.json","resources.json","state.json","status.json"];
const names=await readdir(api);for(const name of expected)assert.ok(names.includes(name),`${name} missing`);
for(const name of expected){const value=JSON.parse(await readFile(resolve(api,name),"utf8"));assert.equal(value.read_only,true);assert.equal(value.simulation_only,true);assert.equal(value.wallet,"NONE");assert.equal(value.real_kgen,"NO_REAL_KGEN");assert.equal(value.authority,"NO_PRODUCTION_AUTHORITY")}
const status=JSON.parse(await readFile(resolve(api,"status.json"),"utf8"));assert.equal(status.integrity.ok,true);assert.equal(status.automatic_new_species,false);assert.equal(status.uncontrolled_reproduction,false);
const schema=JSON.parse(await readFile(resolve(root,"KAIOS/life/ecology/KAIOS_REPRODUCTION_ECOLOGY_SCHEMA_V1.json"),"utf8"));const projected=JSON.parse(await readFile(resolve(api,"state.json"),"utf8")).state;
function validate(value,node,path="state"){
  if(node.$ref){const target=node.$ref.split("/").slice(1).reduce((current,key)=>current[key],schema);return validate(value,target,path)}
  if(Object.hasOwn(node,"const"))assert.deepEqual(value,node.const,`${path} const`);if(node.enum)assert.ok(node.enum.includes(value),`${path} enum`);
  if(node.type==="object"){assert.ok(value&&typeof value==="object"&&!Array.isArray(value),`${path} object`);for(const key of node.required||[])assert.ok(Object.hasOwn(value,key),`${path}.${key} required`);for(const [key,item] of Object.entries(value)){if(node.properties?.[key])validate(item,node.properties[key],`${path}.${key}`);else if(node.additionalProperties===false)assert.fail(`${path}.${key} undeclared`);else if(node.additionalProperties&&typeof node.additionalProperties==="object")validate(item,node.additionalProperties,`${path}.${key}`)}}
  if(node.type==="array"){assert.ok(Array.isArray(value),`${path} array`);if(node.minItems!==undefined)assert.ok(value.length>=node.minItems,`${path} minItems`);if(node.maxItems!==undefined)assert.ok(value.length<=node.maxItems,`${path} maxItems`);if(node.uniqueItems)assert.equal(new Set(value.map(JSON.stringify)).size,value.length,`${path} uniqueItems`);value.forEach((item,index)=>validate(item,node.items,`${path}[${index}]`))}
  if(node.type==="string"){assert.equal(typeof value,"string",`${path} string`);if(node.minLength!==undefined)assert.ok(value.length>=node.minLength,`${path} minLength`);if(node.maxLength!==undefined)assert.ok(value.length<=node.maxLength,`${path} maxLength`)}
  if(node.type==="number"||node.type==="integer"){assert.equal(typeof value,"number",`${path} number`);assert.ok(Number.isFinite(value),`${path} finite`);if(node.type==="integer")assert.ok(Number.isInteger(value),`${path} integer`);if(node.minimum!==undefined)assert.ok(value>=node.minimum,`${path} minimum`);if(node.maximum!==undefined)assert.ok(value<=node.maximum,`${path} maximum`);if(node.exclusiveMinimum!==undefined)assert.ok(value>node.exclusiveMinimum,`${path} exclusiveMinimum`)}
}
validate(projected,schema);
const page=await readFile(resolve(root,"world-viewer/ecosystem-v1/index.html"),"utf8");for(const marker of ["KAIOS 生態系世界","SIMULATION ONLY","NO REAL KGEN","NO REAL BIOENGINEERING","NO PRODUCTION AUTHORITY","重新載入"])assert.ok(page.includes(marker),marker);
console.log("KAIOS_ECOSYSTEM_V1_PUBLIC_API_TEST_PASS");
