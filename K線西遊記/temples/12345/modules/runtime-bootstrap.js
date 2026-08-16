/* Canonical 12345 frontend bootstrap. Contract resolution is owned by contract-resolver.js. */
(function(){
  "use strict";
  const SELF={version:"12345-TEMPLE-FRONTEND-V3.4.0",manifest:"./LIFE_MANIFEST.json",genome:"./RUNTIME_GENOME.json"};
  const RELEASE={
    frontend:"V3.4.0",templeHeartTarget:"3.4.x",chainIds:[56,97],
    mainnetCurrentHeart:"PENDING",mainnetFortuneGame:"PENDING",mainnetFrontendSwitch:"NOT PERFORMED",
    status:"FRONTEND_READY_CONTRACTS_PENDING"
  };
  const state={loadedAt:new Date().toISOString(),manifest:null,genome:null,missing:[],warnings:[],status:"BOOTING"};

  function emit(type,message,data){
    const detail={type:type,message:message,data:data||null,at:new Date().toISOString()};
    try{console[type==="error"?"error":"log"]("[KGEN LIFE BOOT]",detail);}catch(_){}
    try{window.dispatchEvent(new CustomEvent("kgen-life-boot",{detail:detail}));}catch(_){}
  }
  async function loadJson(path){const response=await fetch(path,{cache:"no-store"});if(!response.ok)throw new Error("LOAD_FAIL "+path);return response.json();}
  async function exists(path){try{const response=await fetch(path,{method:"GET",cache:"no-store"});return response.ok;}catch(_){return false;}}
  function flatten(manifest){const out=[];Object.entries(manifest.required_files||{}).forEach(([group,items])=>(Array.isArray(items)?items:[]).forEach(item=>out.push(Object.assign({group:group},item))));return out;}
  function relative(path){
    const marker="/temples/12345/",index=String(path||"").indexOf(marker);
    if(String(path||"").endsWith("/modules/kgen-land-engine.js")) return "../../modules/kgen-land-engine.js";
    return index>=0?"./"+String(path).slice(index+marker.length):String(path||"").replace(/^\//,"./");
  }
  function badge(){
    let node=document.getElementById("kgen-12345-release-badge");
    if(!node){node=document.createElement("div");node.id="kgen-12345-release-badge";node.setAttribute("role","status");node.style.cssText="position:fixed;left:8px;top:70px;z-index:260;max-width:min(360px,calc(100vw - 16px));padding:6px 9px;border:1px solid rgba(255,215,120,.45);border-radius:9px;background:rgba(5,7,11,.86);color:#ffe28a;font:700 10px/1.4 system-ui;pointer-events:none";document.body.appendChild(node);}
    node.textContent="12345 Frontend V3.4 · Mainnet Current Heart PENDING · FortuneGame PENDING";return node;
  }
  function enforce(){
    const version=document.getElementById("ver-st");if(version){version.textContent=RELEASE.frontend;version.dataset.version=SELF.version;version.title="TempleHeart V3.4 frontend; Mainnet proxy pending";}
    document.documentElement.dataset.kgen12345Release=RELEASE.frontend;window.KGEN_12345_RELEASE=Object.assign({},RELEASE);badge();
  }
  async function check(){
    state.status="CHECKING";
    try{[state.manifest,state.genome]=await Promise.all([loadJson(SELF.manifest),loadJson(SELF.genome)]);}catch(error){state.status="MANIFEST_OR_GENOME_MISSING";state.missing.push({path:SELF.manifest+" / "+SELF.genome,diagnosis:error.message});emit("error",state.status,state);window.KGEN_LIFE_BOOT=state;return state;}
    for(const file of flatten(state.manifest)){if(file.path && !(await exists(relative(file.path))))state.missing.push({group:file.group,path:file.path,diagnosis:file.diagnosis||"required file missing"});}
    state.status=state.missing.length?"INJURED":"ALIVE";emit(state.missing.length?"error":"log",state.status,state);window.KGEN_LIFE_BOOT=state;return state;
  }
  function start(){enforce();check();}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
