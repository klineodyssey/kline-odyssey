
window.RUNTIME_GENOME = {
  universe:"V10.46.0",
  base_from:"V10.42.6",
  timeline:"V10.44.2",
  evolution:"MORPH_DNA_RUNTIME_GENESIS",
  immortal:true,
  organs:[
    "FestivalHeartRuntime",
    "HolyCupRuntime",
    "RecordingRuntime",
    "WarpRuntime",
    "MorphDNARuntime"
  ]
};

window.UniverseClock = {
  timer:null,
  start(){
    if(this.timer) clearInterval(this.timer);
    this.timer = setInterval(()=>{
      const now = new Date();
      const el = document.querySelector('#festivalClock');
      if(el){
        el.textContent = "跨年宇宙心跳 " + now.toLocaleTimeString();
      }
    },1000);
  }
};

window.HolyCupRuntime = {
  state:0,
  max:3,
  set(v){
    this.state=v;
    const el=document.querySelector('#holyCupState');
    if(el) el.textContent=`${this.state}/${this.max}`;
  }
};

window.MorphDNARuntime = {
  forms:["human","tree","bird","beast","temple","warp"],
  current:"human",
  morph(next){
    this.current=next;
    document.body.setAttribute("data-morph",next);
  }
};

window.RuntimeImmuneSystem = {
  scan(){
    return {
      ghostIntervals:false,
      recursiveAppend:false,
      dnaPollution:false,
      runtimeStable:true
    };
  }
};

window.addEventListener("DOMContentLoaded",()=>{
  UniverseClock.start();
  HolyCupRuntime.set(3);

  const rightPanel=document.querySelector('#rightRulePanel');
  if(rightPanel){
    rightPanel.classList.add('collapsed');
  }

  const record=document.querySelector('#recordHUD');
  if(record){
    let sec=0;
    setInterval(()=>{
      sec++;
      const h=String(Math.floor(sec/3600)).padStart(2,'0');
      const m=String(Math.floor((sec%3600)/60)).padStart(2,'0');
      const s=String(sec%60).padStart(2,'0');
      record.textContent=`REC ${h}:${m}:${s}`;
    },1000);
  }
});
