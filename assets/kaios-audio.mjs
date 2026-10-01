/** First-party synthesized world audio. No media assets, network, wallet or economic authority. */
export const AUDIO_STORAGE_KEY = 'KAIOS_AUDIO_PREFERENCES_V1';
export const DEFAULT_AUDIO_SETTINGS = Object.freeze({ master:.65, music:.65, sfx:.65, voice:.7, muted:false, musicEnabled:false });
// Synth envelopes were ~-47 dBFS at the old defaults. Preserve saved user gains;
// raise the first-party theme bus, with bounded envelopes and output headroom.
export const MUSIC_THEME_GAIN = 3;
const clamp = value => Math.max(0, Math.min(1, Number(value)));
const normalWorld = value => String(value || 'PORTAL').toUpperCase().replace(/^K(?=\d)/,'');
const notes = { PORTAL:[196,261.63,293.66,392,349.23,293.66,261.63,220], '12345':[261.63,329.63,392,523.25,392,329.63,293.66,329.63], '16888':[146.83,220,293.66,349.23,440,349.23,293.66,220], '11520':[220,261.63,293.66,329.63,392,329.63,293.66,261.63] };
export const AUDIO_THEMES = Object.freeze({ PORTAL:'KAIOS Universe Theme', '11520':'花果山・星際戰場', '12345':'Heart / Life — 心光', '16888':'Universe / Space — 星海' });
const EVENT_NOTES = Object.freeze({ attack:[220,110], slash:[220,110], hit:[160,80], weak:[440,660], loot:[523,659,784], fill:[392,523], close:[523,392], liquidation:[196,110], boss:[110,146,196], golden:[392,523,784], axe:[110,73], BOSS_SPAWN:[110,146,196], BOSS_PHASE_CHANGE:[146,220,294], RARE_LOOT:[523,659,784,1046], PLAYER_LEVEL_UP:[392,523,659,784], ENGINE_LEVEL_UP:[294,440,587,880], HOME_BUILD:[261,329,392], HOME_UPGRADE:[329,392,523], PORTAL_OPEN:[196,294,392], WORLD_ENTER:[261,392,523], QUEST_COMPLETE:[392,523,659], WEAK_POINT:[440,660], GOLDEN_RAIN:[392,523,784], PHANTOM_AXE:[110,73], SLASH:[220,110], HIT:[160,80], LOOT:[523,659,784], FILL:[392,523], CLOSE:[523,392], LIQUIDATION:[196,110] });
// First-party arrangements sharing one continuing musical clock. Layer values
// cross-blend on each pulse; changing gameplay state never starts another BGM.
export const MUSIC_STATES = Object.freeze(Object.fromEntries(Object.entries({
  EXPLORE:{pulse:.34,bass:.022,drum:.016,shine:.003,transpose:1},
  ENCOUNTER:{pulse:.30,bass:.025,drum:.025,shine:.005,transpose:1},
  COMBAT:{pulse:.25,bass:.029,drum:.034,shine:.008,transpose:1},
  BOSS:{pulse:.23,bass:.035,drum:.038,shine:.011,transpose:.75},
  BOSS_LOW_HP:{pulse:.19,bass:.038,drum:.042,shine:.014,transpose:.75},
  VICTORY:{pulse:.36,bass:.02,drum:.006,shine:.018,transpose:1.5},
  RARE_LOOT:{pulse:.39,bass:.016,drum:0,shine:.022,transpose:2},
  LEVEL_UP:{pulse:.31,bass:.021,drum:.011,shine:.021,transpose:1.5},
  GA600_LEVEL_UP:{pulse:.22,bass:.025,drum:.014,shine:.024,transpose:2},
  HOME:{pulse:.58,bass:.012,drum:0,shine:.004,transpose:1},
  PORTAL:{pulse:.52,bass:.014,drum:0,shine:.013,transpose:1.5}
}).map(([key,value])=>[key,Object.freeze(value)])));
const EVENT_ALIASES = Object.freeze({attack:'ATTACK',slash:'SLASH',hit:'HIT',weak:'WEAK_POINT',loot:'COMMON_LOOT',LOOT:'COMMON_LOOT',boss:'BOSS_SPAWN',golden:'GOLDEN_RAIN',axe:'PHANTOM_AXE',ENGINE_LEVEL_UP:'GA600_LEVEL_UP'});
const SOUND_DESIGNS = Object.freeze({
  MONSTER_DETECTED:{notes:[165,247],type:'triangle',sweep:1.3},
  ATTACK:{notes:[310,190],type:'sawtooth',sweep:.3,metal:true},
  SLASH:{notes:[660,330],type:'triangle',sweep:.18,metal:true},
  HIT:{notes:[135,73],type:'triangle',sweep:.45},
  CRITICAL:{notes:[330,660,990],type:'triangle',metal:true},
  WEAK_POINT:{notes:[660,990,1320],type:'sine',metal:true},
  BLOCKED:{notes:[180,185],type:'square',sweep:.9},
  MISS:{notes:[200,95],type:'sine',sweep:.45},
  BOSS_SPAWN:{notes:[55,82,110],type:'triangle',length:.5,space:true,duck:true},
  BOSS_PHASE_CHANGE:{notes:[110,165,247],type:'sawtooth',length:.3,duck:true},
  BOSS_RAGE:{notes:[73,110,146],type:'sawtooth',sweep:1.7,duck:true},
  BOSS_LOW_HP:{notes:[110,220,110],type:'triangle',duck:true},
  BOSS_DEFEAT:{notes:[130,196,261,392,523],type:'triangle',length:.3,space:true,duck:true},
  COMMON_LOOT:{notes:[523,659],type:'sine'},
  UNCOMMON_LOOT:{notes:[523,659,784],type:'sine',metal:true},
  RARE_LOOT:{notes:[659,784,1046],type:'sine',metal:true,space:true,duck:true},
  EPIC_LOOT:{notes:[523,784,1046,1318],type:'triangle',metal:true,space:true,duck:true},
  LEGENDARY_LOOT:{notes:[392,587,784,1046,1568],type:'sine',length:.32,metal:true,space:true,duck:true},
  PLAYER_LEVEL_UP:{notes:[392,493,587,784],type:'triangle',length:.28,space:true,duck:true},
  GA600_LEVEL_UP:{notes:[110,220,440,880,1320],type:'triangle',sweep:1.4,length:.24,duck:true},
  PORTAL_OPEN:{notes:[146,220,440],type:'sine',sweep:1.5,length:.4,space:true,duck:true}
});

export function createKaiosAudio(options={}) {
  const env = options.env || globalThis;
  const doc = options.document === undefined ? env.document : options.document;
  let storage = options.storage;
  if (storage === undefined) { try { storage = env.localStorage; } catch { storage = null; } }
  let settings = {...DEFAULT_AUDIO_SETTINGS}, persistent=!!storage;
  try { const saved=JSON.parse(storage?.getItem(AUDIO_STORAGE_KEY)||'null'); if(saved && typeof saved==='object') { for(const key of ['master','music','sfx','voice']) if(Number.isFinite(saved[key])) settings[key]=clamp(saved[key]); for(const key of ['muted','musicEnabled']) if(typeof saved[key]==='boolean') settings[key]=saved[key]; } } catch { persistent=false; }
  let context=null, master=null, channels=null, unlocked=false, recoveryGesture=false, world='PORTAL', timer=null, beat=0, themeBus=null, disposed=false, lastError=null, ownedSpeech=null;
  let musicState='EXPLORE',musicMix={...MUSIC_STATES.EXPLORE},nextPulse=0,duckTimer=null,voiceTimer=null,sfxDuck=false,voiceDuck=false;
  const nodes=new Set(), listeners=new Set(), customThemes=new Map(), cooldown=new Map(), retiring=new Map();
  const timeout=options.setTimeout||env.setTimeout?.bind(env),clearTimeoutFn=options.clearTimeout||env.clearTimeout?.bind(env);
  const interval=options.setInterval||env.setInterval?.bind(env), clearIntervalFn=options.clearInterval||env.clearInterval?.bind(env);
  const musicActive=()=>timer!==null&&context?.state==='running'&&!doc?.hidden&&!settings.muted&&settings.musicEnabled&&settings.master>0&&settings.music>0;
  const duckFactor=()=>voiceDuck?.22:sfxDuck?.38:1;
  const snapshot=()=>({world,theme:AUDIO_THEMES[world]||AUDIO_THEMES.PORTAL,musicState,musicMix:{...musicMix},duckFactor:duckFactor(),settings:{...settings},unlocked,needsGesture:!unlocked||recoveryGesture||context?.state!=='running',contextState:context?.state||'NOT_CREATED',musicPlaying:musicActive(),playing:musicActive(),musicEnabled:settings.musicEnabled,activeMusicLayers:timer===null?0:1,activeVoices:nodes.size,activeNodes:nodes.size,persistent,lastError});
  function notify(){for(const listener of listeners) listener(snapshot());}
  function persist(){try{storage?.setItem(AUDIO_STORAGE_KEY,JSON.stringify(settings));}catch{persistent=false;} notify();}
  function gainTo(node,value,seconds=.08){if(!node||!context)return;const param=node.gain,t=context.currentTime;param.cancelScheduledValues(t);param.setValueAtTime(param.value,t);param.linearRampToValueAtTime(value,t+seconds);}
  function musicVolume(){gainTo(channels?.music,settings.music*duckFactor(),.14);}
  function releaseVoice(){if(voiceTimer!==null)clearTimeoutFn?.(voiceTimer);voiceTimer=null;voiceDuck=false;musicVolume();}
  function clearDucking(){if(duckTimer!==null)clearTimeoutFn?.(duckTimer);duckTimer=null;sfxDuck=false;releaseVoice();}
  function duckSfx(){if(duckTimer!==null)clearTimeoutFn?.(duckTimer);sfxDuck=true;musicVolume();duckTimer=timeout?.(()=>{duckTimer=null;sfxDuck=false;musicVolume();notify();},1100)??null;}
  function applyVolumes(){gainTo(master,settings.muted?0:settings.master);musicVolume();for(const channel of ['sfx','voice'])gainTo(channels?.[channel],settings[channel]);if(ownedSpeech){ownedSpeech.volume=settings.master*settings.voice;if(settings.muted||!settings.master||!settings.voice){env.speechSynthesis?.cancel();ownedSpeech=null;releaseVoice();}}}
  function removeNode(record){if(!nodes.delete(record))return;try{record.osc.disconnect();record.gain.disconnect();}catch{}}
  function stopNodes(channel){for(const record of [...nodes])if(!channel||record.channel===channel){try{record.osc.stop();}catch{}removeNode(record);}}
  function stopTheme(fade=0){if(timer!==null){clearIntervalFn?.(timer);timer=null;}
    for(const [bus,handle]of retiring){clearTimeoutFn?.(handle);try{bus.disconnect();}catch{}retiring.delete(bus);}
    if(fade>0&&themeBus&&context?.state==='running'){
      const old=themeBus;gainTo(old,0,fade);for(const record of [...nodes])if(record.channel==='music')try{record.osc.stop(context.currentTime+fade+.025);}catch{}
      const handle=timeout?.(()=>{try{old.disconnect();}catch{}retiring.delete(old);},(fade+.04)*1000);retiring.set(old,handle);
    }else{stopNodes('music');try{themeBus?.disconnect();}catch{}}
    themeBus=null;
  }
  function tone({frequency=440,toFrequency,duration=.18,volume=.05,type='sine',channel='sfx',delay=0}={}){
    if(disposed||!unlocked||!context||context.state!=='running'||doc?.hidden||settings.muted||nodes.size>=96)return false;
    if(!['music','sfx','voice'].includes(channel)||!Number.isFinite(frequency)||frequency<=0)return false;
    const length=Math.max(.025,Math.min(2,Number(duration)||.18)),wait=Math.max(0,Math.min(2,Number(delay)||0));
    const start=context.currentTime+wait,osc=context.createOscillator(),gain=context.createGain();
    const record={osc,gain,channel};nodes.add(record);osc.type=['sine','triangle','sawtooth','square'].includes(type)?type:'sine';osc.frequency.setValueAtTime(Math.min(16000,frequency),start);
    if(Number.isFinite(toFrequency)&&toFrequency>0)osc.frequency.exponentialRampToValueAtTime(Math.min(16000,toFrequency),start+length);
    gain.gain.setValueAtTime(.00001,start);gain.gain.linearRampToValueAtTime(Math.min(.18,Math.max(0,Number(volume)||0)),start+.012);gain.gain.exponentialRampToValueAtTime(.00001,start+length);
    osc.connect(gain);gain.connect(channel==='music'?(themeBus||channels.music):channels[channel]);osc.onended=()=>removeNode(record);osc.start(start);osc.stop(start+length+.025);return true;
  }
  function step(){
    if(!unlocked||doc?.hidden||context?.state!=='running')return;
    const custom=customThemes.get(world);if(custom){custom.step(api,beat++);return;}
    if(world==='11520'&&context.currentTime<nextPulse)return;
    if(world==='11520'){
      const target=MUSIC_STATES[musicState];for(const key of Object.keys(musicMix))musicMix[key]+=(target[key]-musicMix[key])*.32;
      nextPulse=context.currentTime+musicMix.pulse;
    }
    const melody=notes[world]||notes.PORTAL,index=beat++;
    if(world==='11520'){
      tone({frequency:melody[index%8]*musicMix.transpose,type:'sine',volume:.026,duration:.28,channel:'music'});
      if(index%2===0)tone({frequency:92,toFrequency:42,volume:musicMix.drum,duration:.12,channel:'music'});
      if(index%4===0){tone({frequency:55,type:'triangle',volume:musicMix.bass,duration:1.1,channel:'music'});tone({frequency:110,volume:.01,duration:1.1,channel:'music'});}
      if(index%2===1&&musicMix.shine>.001)tone({frequency:melody[(index+2)%8]*2,type:'triangle',volume:musicMix.shine,duration:.32,channel:'music',delay:.04});
    } else {
      tone({frequency:melody[index%8],type:world==='12345'?'triangle':'sine',volume:.033,duration:world==='16888'?1.45:.8,channel:'music'});
      if(index%4===0){tone({frequency:melody[0]/2,volume:.023,duration:1.9,channel:'music'});tone({frequency:melody[0]*1.5,volume:.011,duration:1.7,channel:'music',delay:.07});}
      if(world==='12345'&&index%2===0)tone({frequency:72,toFrequency:48,volume:.022,duration:.12,channel:'music'});
    }
  }
  function startTheme(){
    if(timer!==null||!unlocked||recoveryGesture||!settings.musicEnabled||settings.muted||doc?.hidden||context?.state!=='running'||disposed)return;
    themeBus=context.createGain();themeBus.gain.setValueAtTime(0,context.currentTime);themeBus.connect(channels.music);gainTo(themeBus,MUSIC_THEME_GAIN,.65);beat=0;nextPulse=0;step();
    timer=interval?.(step,(customThemes.get(world)?.beatSeconds||(world==='11520'?.05:world==='16888'?.8:.58))*1000)??null;notify();
  }
  async function unlock(){
    if(disposed)return false;
    try {
      if(!context){const C=options.AudioContext||env.AudioContext||env.webkitAudioContext;if(!C){lastError='AUDIO_UNAVAILABLE';notify();return false;}context=new C();master=context.createGain();master.gain.value=0;master.connect(context.destination);channels={};for(const channel of ['music','sfx','voice']){channels[channel]=context.createGain();channels[channel].connect(master);}context.onstatechange=()=>{if(disposed)return;if(context.state!=='running'){recoveryGesture=true;stopTheme();stopNodes();clearDucking();if(ownedSpeech)env.speechSynthesis?.cancel();ownedSpeech=null;}else{applyVolumes();startTheme();}notify();}; }
      await context.resume();unlocked=context.state==='running';if(unlocked)recoveryGesture=false;lastError=unlocked?null:'USER_GESTURE_REQUIRED';applyVolumes();startTheme();notify();return unlocked;
    }catch{lastError='USER_GESTURE_REQUIRED';notify();return false;}
  }
  function setWorld(value){const next=normalWorld(value);if(next===world)return;stopTheme(.24);world=next;startTheme();notify();}
  function setMusicState(value){const next=String(value).toUpperCase();if(!Object.hasOwn(MUSIC_STATES,next)||disposed)return false;if(next!==musicState){musicState=next;notify();}return true;}
  async function transitionToWorld(value){stopTheme(.16);if(context?.state==='running')await new Promise(resolve=>timeout(resolve,190));world=normalWorld(value);notify();}
  function setMuted(value){settings.muted=!!value;if(settings.muted){stopTheme();stopNodes();clearDucking();}applyVolumes();if(!settings.muted)startTheme();persist();}
  function setMusicEnabled(value){settings.musicEnabled=!!value;if(settings.musicEnabled)startTheme();else stopTheme();persist();}
  function setVolume(channel,value){if(!['master','music','sfx','voice'].includes(channel)||!Number.isFinite(Number(value)))return false;settings[channel]=clamp(value);applyVolumes();persist();return true;}
  function play(event){
    const raw=String(event),key=EVENT_ALIASES[raw]||raw,design=SOUND_DESIGNS[key],sequence=design?.notes||EVENT_NOTES[key],now=context?.currentTime||0;
    if(disposed||!unlocked||settings.muted||!settings.master||!settings.sfx||doc?.hidden||context?.state!=='running'||!sequence)return false;
    if(cooldown.has(key)&&now-cooldown.get(key)<.09)return false;cooldown.set(key,now);
    let played=false;sequence.forEach((frequency,i)=>{played=tone({frequency,toFrequency:design?.sweep?frequency*design.sweep:undefined,duration:design?.length||.16,delay:i*.065,volume:design?.type==='sawtooth'?.027:.043,type:design?.type||'sine'})||played;});
    if(played&&design?.metal)tone({frequency:sequence[0]*2.71,toFrequency:sequence[0]*1.34,type:'sine',volume:.017,duration:.22});
    if(played&&design?.space)tone({frequency:sequence[sequence.length-1],type:'sine',volume:.018,duration:.6,delay:.29});
    if(played&&design?.duck)duckSfx();return played;
  }
  function speak(text,{lang='zh-TW',rate=1,pitch=1,onstart,onend,onerror}={}){if(disposed||!unlocked||context?.state!=='running'||settings.muted||!settings.voice||!settings.master||doc?.hidden||!env.speechSynthesis||!env.SpeechSynthesisUtterance)return false;if(ownedSpeech)env.speechSynthesis.cancel();releaseVoice();const message=new env.SpeechSynthesisUtterance(String(text).slice(0,260));message.lang=lang;message.rate=Math.max(.5,Math.min(2,Number(rate)||1));message.pitch=Math.max(.5,Math.min(2,Number(pitch)||1));message.volume=settings.master*settings.voice;message.voice=env.speechSynthesis.getVoices?.().find(v=>v.lang===lang)||null;ownedSpeech=message;voiceDuck=true;musicVolume();voiceTimer=timeout?.(()=>{voiceTimer=null;if(ownedSpeech===message){env.speechSynthesis.cancel();ownedSpeech=null;releaseVoice();notify();}},45000)??null;message.onstart=onstart;const finish=(callback,event)=>{if(ownedSpeech===message){ownedSpeech=null;releaseVoice();notify();}callback?.(event);};message.onend=event=>finish(onend,event);message.onerror=event=>finish(onerror,event);try{env.speechSynthesis.speak(message);return true;}catch{finish(onerror,{error:'SPEECH_UNAVAILABLE'});return false;}}
  async function visibility(){if(!context)return;if(doc?.hidden){stopTheme();stopNodes();clearDucking();if(ownedSpeech)env.speechSynthesis?.cancel();ownedSpeech=null;await context.suspend().catch(()=>{});}else if(unlocked){try{await context.resume();recoveryGesture=context.state!=='running';applyVolumes();startTheme();}catch{lastError='USER_GESTURE_REQUIRED';}}notify();}
  function storageChanged(event){if(event.key!==AUDIO_STORAGE_KEY)return;try{const saved=JSON.parse(event.newValue);for(const key of ['master','music','sfx','voice'])if(Number.isFinite(saved?.[key]))settings[key]=clamp(saved[key]);for(const key of ['muted','musicEnabled'])if(typeof saved?.[key]==='boolean')settings[key]=saved[key];if(settings.muted||!settings.musicEnabled)stopTheme();if(settings.muted){stopNodes();clearDucking();}applyVolumes();startTheme();notify();}catch{}}
  const pagehide=()=>{stopTheme();stopNodes();clearDucking();if(ownedSpeech)env.speechSynthesis?.cancel();ownedSpeech=null;context?.suspend().catch(()=>{});};
  const pageshow=event=>{if(event.persisted)void visibility();};
  doc?.addEventListener('visibilitychange',visibility);env.addEventListener?.('storage',storageChanged);env.addEventListener?.('pagehide',pagehide);env.addEventListener?.('pageshow',pageshow);
  async function dispose(){disposed=true;stopTheme();stopNodes();clearDucking();doc?.removeEventListener('visibilitychange',visibility);env.removeEventListener?.('storage',storageChanged);env.removeEventListener?.('pagehide',pagehide);env.removeEventListener?.('pageshow',pageshow);if(ownedSpeech)env.speechSynthesis?.cancel();ownedSpeech=null;await context?.close();listeners.clear();}
  const api={unlock,resume:unlock,setWorld,setMusicState,transitionToWorld,setMuted,setMusicEnabled,setVolume,tone,play,speak,snapshot,subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);},registerTheme(id,theme){if(!theme||typeof theme.step!=='function'||!Number.isFinite(theme.beatSeconds)||theme.beatSeconds<.1)throw new TypeError('INVALID_THEME');customThemes.set(normalWorld(id),theme);},dispose};
  return api;
}
let singleton;
export function getKaiosAudio(){return singleton||(singleton=createKaiosAudio());}
