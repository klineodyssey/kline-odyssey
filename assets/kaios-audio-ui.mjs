import {getKaiosAudio} from './kaios-audio.mjs';
let id=0;
export function mountAudioControl({container,worldId,existingButton=null,button=null,world='PORTAL'}={}){
  existingButton=existingButton||button;worldId=worldId||world;
  if(!container&&!existingButton)throw new TypeError('Audio control container required');
  const audio=getKaiosAudio();audio.setWorld(worldId);
  let destroyed=false;
  const doc=(container||existingButton).ownerDocument;
  if(!doc.querySelector('link[data-kaios-audio-style]')){const css=doc.createElement('link');css.rel='stylesheet';css.href=new URL('./kaios-audio.css',import.meta.url).href;css.dataset.kaiosAudioStyle='1';doc.head.append(css);}
  const root=doc.createElement('div');root.className='kaios-audio'+(existingButton?' kaios-audio-compact':'');root.dataset.kaiosAudio=String(worldId);
  const toggle=existingButton||doc.createElement('button');toggle.type='button';toggle.classList.add('kaios-audio-toggle');toggle.dataset.audioAction='toggle';toggle.dataset.kaiosAudioToggle='';
  const settings=doc.createElement('button');settings.type='button';settings.className='kaios-audio-settings';settings.textContent='⚙';settings.setAttribute('aria-label','聲音設定');settings.dataset.audioAction='settings';
  const panel=doc.createElement('section');panel.className='kaios-audio-panel';panel.hidden=true;panel.id=`kaios-audio-panel-${++id}`;panel.setAttribute('aria-label','KAIOS 聲音設定');settings.setAttribute('aria-controls',panel.id);settings.setAttribute('aria-expanded','false');
  if(existingButton&&typeof panel.showPopover==='function')panel.setAttribute('popover','manual');
  const title=doc.createElement('strong');title.textContent='KAIOS 聲音';title.tabIndex=-1;panel.append(title);
  const status=doc.createElement('p');status.dataset.audioStatus='';status.setAttribute('aria-live','polite');panel.append(status);
  const summary=doc.createElement('small');summary.className='kaios-audio-summary';summary.setAttribute('aria-live','polite');
  const inputs={};for(const [channel,label]of Object.entries({master:'Master 總音量',music:'Music 音樂',sfx:'SFX 音效',voice:'AI Voice 語音'})){const row=doc.createElement('label');row.textContent=label;const input=doc.createElement('input');input.type='range';input.min='0';input.max='100';input.step='1';input.setAttribute('aria-label',label);input.dataset.audioVolume=channel;input.addEventListener('input',()=>audio.setVolume(channel,Number(input.value)/100));row.append(input);panel.append(row);inputs[channel]=input;}
  const stop=doc.createElement('button');stop.type='button';stop.textContent='停止音樂';stop.dataset.audioAction='music';stop.addEventListener('click',async()=>{if(!audio.snapshot().settings.musicEnabled){if(!await audio.unlock())return;}audio.setMusicEnabled(!audio.snapshot().settings.musicEnabled);});panel.append(stop);
  const mute=doc.createElement('button');mute.type='button';mute.textContent='靜音';mute.dataset.audioAction='mute';mute.addEventListener('click',()=>audio.setMuted(!audio.snapshot().settings.muted));panel.append(mute);
  const close=doc.createElement('button');close.type='button';close.textContent='關閉設定';close.addEventListener('click',()=>openSettings(false));panel.append(close);
  function openSettings(force){if(destroyed)return;const show=typeof force==='boolean'?force:panel.hidden;if(!show&&panel.hasAttribute('popover'))panel.hidePopover();panel.hidden=!show;if(show&&panel.hasAttribute('popover'))panel.showPopover();settings.setAttribute('aria-expanded',String(show));if(existingButton)toggle.setAttribute('aria-expanded',String(show));if(show){title.focus({preventScroll:true});panel.scrollTop=0;}else if(existingButton)toggle.focus({preventScroll:true});}
  settings.addEventListener('click',()=>openSettings());
  let activating=false;
  const onToggle=async()=>{if(destroyed||activating)return;const state=audio.snapshot();if(state.needsGesture||state.settings.muted||!state.settings.musicEnabled){activating=true;try{if(!await audio.unlock()||destroyed)return;audio.setMuted(false);audio.setMusicEnabled(true);if(!state.settings.master||!state.settings.music)openSettings(true);}finally{activating=false;}}else if(existingButton)openSettings();else audio.setMuted(true);};
  toggle.addEventListener('click',onToggle);
  const keydown=e=>{if(e.key==='Escape'&&!panel.hidden){openSettings(false);(existingButton||settings).focus({preventScroll:true});}};doc.addEventListener('keydown',keydown);
  const unsub=audio.subscribe(state=>{const start=state.needsGesture||!state.settings.musicEnabled,label=start?'開啟聲音':state.settings.muted?'取消靜音':existingButton?'聲音設定':'靜音';toggle.textContent=existingButton?(state.settings.muted?'🔇':state.musicPlaying?'🔊':'♪'):start?'🔊 開啟聲音':state.settings.muted?'🔇 已靜音':'🔊 聲音開啟';toggle.setAttribute('aria-label',label);toggle.setAttribute('aria-pressed',String(state.musicPlaying));status.textContent=`${state.theme} · ${state.needsGesture?'請點開啟聲音（瀏覽器需手勢）':state.settings.muted?'靜音':!state.settings.master||!state.settings.music?'音量為 0，請調整音量':state.loadingTrack?'載入所選原創曲目…':state.musicPlaying?'播放中':'音樂已停止'}${state.lastError?' · '+state.lastError:''}`;summary.textContent=status.textContent;toggle.title=status.textContent;for(const channel of Object.keys(inputs))inputs[channel].value=String(Math.round(state.settings[channel]*100));stop.textContent=state.settings.musicEnabled?'停止音樂':'播放音樂';mute.textContent=state.settings.muted?'取消靜音':'靜音';});
  if(!existingButton)root.append(toggle,settings,summary);else{toggle.setAttribute('aria-controls',panel.id);toggle.setAttribute('aria-haspopup','true');}root.append(panel);(existingButton?doc.body:container).append(root);
  return{audio,root,openSettings,destroy(){if(destroyed)return;destroyed=true;unsub();toggle.removeEventListener('click',onToggle);doc.removeEventListener('keydown',keydown);if(panel.hasAttribute('popover'))panel.hidePopover();root.remove();}};
}
