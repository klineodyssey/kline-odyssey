import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createReproductionEcologyRuntimeV1 } from "../../../KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../../..");
const output=resolve(root,"api/kaios/ecosystem/v1");
await mkdir(output,{recursive:true});
const runtime=createReproductionEcologyRuntimeV1();runtime.createEcosystem();runtime.start();runtime.advanceTime(3);runtime.pause();
const state=runtime.getState(),integrity=runtime.integrityReport();
const envelope={schema_version:"1.0.0",runtime:state.runtime,mode:"STATIC_READ_ONLY_PROJECTION",generated_from_seed:state.seed,simulation_only:true,read_only:true,authority:"NO_PRODUCTION_AUTHORITY",wallet:"NONE",real_kgen:"NO_REAL_KGEN"};
const files={
  "index.json":{...envelope,endpoints:["state.json","habitats.json","populations.json","food-web.json","resources.json","events.json","status.json"]},
  "state.json":{...envelope,state},
  "habitats.json":{...envelope,habitats:state.habitats},
  "populations.json":{...envelope,populations:state.populations,maximum_total_population:500},
  "food-web.json":{...envelope,abstract_resource_pools:["AQUATIC_PRIMARY_FOOD_POOL","DETRITUS_POOL","MICROBIAL_DECOMPOSITION_PROXY"],relationships:["GRASS_AND_TREE_TO_PLANT_BIOMASS","AQUATIC_PRIMARY_FOOD_TO_FISH_AND_SHRIMP","DETRITUS_TO_SHRIMP","DEAD_BIOMASS_TO_DECOMPOSITION_TO_SOIL_NUTRIENTS","WATER_DEPENDENCY","MOUNTAIN_RUNOFF_TO_RIVER"]},
  "resources.json":{...envelope,resources:state.resources,conditions:state.conditions,accounting:"BOUNDED_MASS_TRANSFER"},
  "events.json":{...envelope,events:state.events},
  "status.json":{...envelope,status:state.status,integrity,deterministic:true,serializable:true,stoppable:true,resumable:true,replayable:true,auditable:true,automatic_new_species:false,uncontrolled_reproduction:false}
};
for(const [name,value] of Object.entries(files))await writeFile(resolve(output,name),`${JSON.stringify(value,null,2)}\n`,"utf8");
