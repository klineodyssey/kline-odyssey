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

export function createKaiosAudio(options={}) {
  const env = options.env || globalThis;
  const doc = options.document === undefined ? env.document : options.document;
  let storage = options.storage;
  if (storage === undefined) { try { storage = env.localStorage; } catch { storage = null; } }
  let settings = {...DEFAULT_AUDIO_SETTINGS}, persistent=!!storage;
  try { const saved=JSON.parse(storage?.getItem(AUDIO_STORAGE_KEY)||'null'); if(saved && typeof saved==='object') { for(const key of ['master','music','sfx','voice']) if(Number.isFinite(saved[key])) settings[key]=clamp(saved[key]); for(const key of ['muted','musicEnabled']) if(typeof saved[key]==='boolean') settings[key]=saved[key]; } } catch { persistent=false; }
  let context=null, master=null, channels=null, unlocked=false, world='PORTAL', timer=null, beat=0, themeBus=null, disposed=false, lastError=null, ownedSpeech=null;
  const nodes=new Set(), listeners=new Set(), customThemes=new Map(), cooldown=new Map(), retiring=new Map();
  const timeout=options.setTimeout||env.setTimeout?.bind(env),clearTimeoutFn=options.clearTimeout||env.clearTimeout?.bind(env);
  const interval=options.setInterval||env.setInterval?.bind(env), clearIntervalFn=options.clearInterval||env.clearInterval?.bind(env);
  const musicActive=()=>timer!==null&&context?.state==='running'&&!doc?.hidden&&!settings.muted&&settings.musicEnabled&&settings.master>0&&settings.music>0;
  const snapshot=()=>({world,theme:AUDIO_THEMES[world]||AUDIO_THEMES.PORTAL,settings:{...settings},unlocked,needsGesture:!unlocked||context?.state!=='running',contextState:context?.state||'NOT_CREATED',musicPlaying:musicActive(),playing:musicActive(),musicEnabled:settings.musicEnabled,activeMusicLayers:timer===null?0:1,activeVoices:nodes.size,activeNodes:nodes.size,persistent,lastError});
  function notify(){for(const listener of listeners) listener(snapshot());}
  function persist(){try{storage?.setItem(AUDIO_STORAGE_KEY,JSON.stringify(settings));}catch{persistent=false;} notify();}
  function gainTo(node,value,seconds=.08){if(!node||!context)return;const param=node.gain,t=context.currentTime;param.cancelScheduledValues(t);param.setValueAtTime(param.value,t);param.linearRampToValueAtTime(value,t+seconds);}
  function applyVolumes(){gainTo(master,settings.muted?0:settings.master);for(const channel of ['music','sfx','voice'])gainTo(channels?.[channel],settings[channel]);if(ownedSpeech){ownedSpeech.volume=settings.master*settings.voice;if(settings.muted||!settings.master||!settings.voice){env.speechSynthesis?.cancel();ownedSpeech=null;}}}
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
    const melody=notes[world]||notes.PORTAL,index=beat++;
    if(world==='11520'){
      tone({frequency:melody[index%8],type:index%4===0?'square':'sine',volume:.026,duration:.28,channel:'music'});
      if(index%2===0)tone({frequency:92,toFrequency:42,volume:.04,duration:.12,channel:'music'});
      if(index%8===0){tone({frequency:55,type:'triangle',volume:.022,duration:1.9,channel:'music'});tone({frequency:110,volume:.012,duration:1.9,channel:'music'});}
    } else {
      tone({frequency:melody[index%8],type:world==='12345'?'triangle':'sine',volume:.033,duration:world==='16888'?1.45:.8,channel:'music'});
      if(index%4===0){tone({frequency:melody[0]/2,volume:.023,duration:1.9,channel:'music'});tone({frequency:melody[0]*1.5,volume:.011,duration:1.7,channel:'music',delay:.07});}
      if(world==='12345'&&index%2===0)tone({frequency:72,toFrequency:48,volume:.022,duration:.12,channel:'music'});
    }
  }
  function startTheme(){
    if(timer!==null||!unlocked||!settings.musicEnabled||settings.muted||doc?.hidden||context?.state!=='running'||disposed)return;
    themeBus=context.createGain();themeBus.gain.setValueAtTime(0,context.currentTime);themeBus.connect(channels.music);gainTo(themeBus,MUSIC_THEME_GAIN,.65);beat=0;step();
    timer=interval?.(step,(customThemes.get(world)?.beatSeconds||(world==='11520'?.34:world==='16888'?.8:.58))*1000)??null;notify();
  }
  async function unlock(){
    if(disposed)return false;
    try {
      if(!context){const C=options.AudioContext||env.AudioContext||env.webkitAudioContext;if(!C){lastError='AUDIO_UNAVAILABLE';notify();return false;}context=new C();master=context.createGain();master.gain.value=0;master.connect(context.destination);channels={};for(const channel of ['music','sfx','voice']){channels[channel]=context.createGain();channels[channel].connect(master);}context.onstatechange=()=>{if(disposed)return;if(context.state!=='running'){stopTheme();stopNodes();}else{applyVolumes();startTheme();}notify();}; }
      await context.resume();unlocked=context.state==='running';lastError=unlocked?null:'USER_GESTURE_REQUIRED';applyVolumes();startTheme();notify();return unlocked;
    }catch{lastError='USER_GESTURE_REQUIRED';notify();return false;}
  }
  function setWorld(value){const next=normalWorld(value);if(next===world)return;stopTheme(.24);world=next;startTheme();notify();}
  async function transitionToWorld(value){stopTheme(.16);if(context?.state==='running')await new Promise(resolve=>timeout(resolve,190));world=normalWorld(value);notify();}
  function setMuted(value){settings.muted=!!value;if(settings.muted)stopTheme();applyVolumes();if(!settings.muted)startTheme();persist();}
  function setMusicEnabled(value){settings.musicEnabled=!!value;if(settings.musicEnabled)startTheme();else stopTheme();persist();}
  function setVolume(channel,value){if(!['master','music','sfx','voice'].includes(channel)||!Number.isFinite(Number(value)))return false;settings[channel]=clamp(value);applyVolumes();persist();return true;}
  function play(event){const key=String(event),now=context?.currentTime||0;if(!unlocked||settings.muted)return false;if(cooldown.has(key)&&now-cooldown.get(key)<.07)return false;cooldown.set(key,now);const sequence=EVENT_NOTES[key];if(!sequence)return false;return sequence.map((frequency,i)=>tone({frequency,duration:.16,delay:i*.065,volume:.052,type:key.includes('BOSS')?'triangle':'sine'})).some(Boolean);}
  function speak(text,{lang='zh-TW',rate=1,pitch=1,onstart,onend,onerror}={}){if(!unlocked||settings.muted||!settings.voice||!settings.master||doc?.hidden||!env.speechSynthesis||!env.SpeechSynthesisUtterance)return false;if(ownedSpeech)env.speechSynthesis.cancel();const message=new env.SpeechSynthesisUtterance(String(text).slice(0,260));message.lang=lang;message.rate=Math.max(.5,Math.min(2,Number(rate)||1));message.pitch=Math.max(.5,Math.min(2,Number(pitch)||1));message.volume=settings.master*settings.voice;message.voice=env.speechSynthesis.getVoices?.().find(v=>v.lang===lang)||null;ownedSpeech=message;message.onstart=onstart;message.onend=event=>{if(ownedSpeech===message)ownedSpeech=null;onend?.(event);};message.onerror=event=>{if(ownedSpeech===message)ownedSpeech=null;onerror?.(event);};env.speechSynthesis.speak(message);return true;}
  async function visibility(){if(!context)return;if(doc?.hidden){stopTheme();stopNodes();if(ownedSpeech)env.speechSynthesis?.cancel();ownedSpeech=null;await context.suspend().catch(()=>{});}else if(unlocked){try{await context.resume();applyVolumes();startTheme();}catch{lastError='USER_GESTURE_REQUIRED';}}notify();}
  function storageChanged(event){if(event.key!==AUDIO_STORAGE_KEY)return;try{const saved=JSON.parse(event.newValue);for(const key of ['master','music','sfx','voice'])if(Number.isFinite(saved?.[key]))settings[key]=clamp(saved[key]);for(const key of ['muted','musicEnabled'])if(typeof saved?.[key]==='boolean')settings[key]=saved[key];if(settings.muted||!settings.musicEnabled)stopTheme();applyVolumes();startTheme();notify();}catch{}}
  const pagehide=()=>{stopTheme();stopNodes();if(ownedSpeech)env.speechSynthesis?.cancel();ownedSpeech=null;context?.suspend().catch(()=>{});};
  const pageshow=event=>{if(event.persisted)void visibility();};
  doc?.addEventListener('visibilitychange',visibility);env.addEventListener?.('storage',storageChanged);env.addEventListener?.('pagehide',pagehide);env.addEventListener?.('pageshow',pageshow);
  async function dispose(){disposed=true;stopTheme();stopNodes();doc?.removeEventListener('visibilitychange',visibility);env.removeEventListener?.('storage',storageChanged);env.removeEventListener?.('pagehide',pagehide);env.removeEventListener?.('pageshow',pageshow);if(ownedSpeech)env.speechSynthesis?.cancel();await context?.close();listeners.clear();}
  const api={unlock,resume:unlock,setWorld,transitionToWorld,setMuted,setMusicEnabled,setVolume,tone,play,speak,snapshot,subscribe(fn){listeners.add(fn);fn(snapshot());return()=>listeners.delete(fn);},registerTheme(id,theme){if(!theme||typeof theme.step!=='function'||!Number.isFinite(theme.beatSeconds)||theme.beatSeconds<.1)throw new TypeError('INVALID_THEME');customThemes.set(normalWorld(id),theme);},dispose};
  return api;
}
let singleton;
export function getKaiosAudio(){return singleton||(singleton=createKaiosAudio());}
