/** Legacy Heart/Universe entry bridge: one shared player, no legacy media downloads. */
import {getKaiosAudio} from './kaios-audio.mjs';
import {mountAudioControl} from './kaios-audio-ui.mjs';
export function bindWorldAudio(worldId){
  const audio=getKaiosAudio();audio.setWorld(worldId);globalThis.KAIOS_AUDIO=audio;
  let control;
  function install(){
    const app=globalThis.app;if(!app)return;
    // Target only the two known legacy music organs, not arbitrary page media.
    for(const media of [document.getElementById('music-audio'),app._music?.audio,app._musicAudio]){try{media?.pause();media?.removeAttribute('src');media?.load();}catch{}}
    app._stopAudio?.();
    // Universe owns its original presentation; sharing a synthesizer does not
    // authorize reparenting its navigation or replacing its music organ.
    if(worldId==='16888'){
      if(!control)control=bindUniversePresentation(app,audio);
      globalThis.KAIOS_AUDIO_CONTROL=control;
      return;
    }
    const legacyConsole=document.getElementById('temple-audio-console');if(legacyConsole)legacyConsole.hidden=true;
    const panel=document.getElementById('music-panel');if(panel){panel.hidden=true;panel.style.setProperty('display','none','important');}
    const button=document.querySelector('.nav-music');if(!button)return;
    // Keep this one control reachable even on legacy fixed desktop HUDs. Do not
    // rescale or restructure the Heart/Universe gameplay surface itself.
    document.body.append(button);button.classList.add('kaios-world-audio-button');
    button.removeAttribute('onclick');button.textContent='♪';button.title='KAIOS 聲音設定';
    if(!control)control=mountAudioControl({button,world:worldId});
    globalThis.KAIOS_AUDIO_CONTROL=control;
    const start=async()=>{if(await audio.unlock())audio.setMusicEnabled(true);};
    app.enableAudio=start;app.musicInit=()=>{};app.openMusic=()=>control.openSettings();
    app.musicPlay=start;app.musicPause=app.musicStop=()=>audio.setMusicEnabled(false);
    app.musicPrev=app.musicNext=()=>control.openSettings(true);
    app.musicLoadBuiltIn=app.musicLoadBuiltin=async()=>[];
    app.musicSetVolume=value=>audio.setVolume('music',Number(value)/100);
    app.speak=text=>audio.speak(text);
    const oldAudio=document.querySelector('.nav-audio');if(oldAudio){oldAudio.hidden=true;oldAudio.style.display='none';}
    if(globalThis.templeAudio)Object.assign(globalThis.templeAudio,{playBgm:start,stopBgm:app.musicStop,toggleMini:()=>control.openSettings(),setVolume:app.musicSetVolume});
    const home=document.querySelector('[data-kaios-return="PORTAL"]');
    const compactHeart=worldId==='12345';
    if(compactHeart){
      let rail=document.getElementById('k12345-utility-rail');
      if(!rail){rail=document.createElement('nav');rail.id='k12345-utility-rail';rail.setAttribute('aria-label','聲音與 KAIOS 世界');document.body.append(rail);}
      rail.append(button);if(home)rail.append(home);
      const continuity=document.getElementById('return-wallet-continuity');
      if(continuity){document.getElementById('kgen-heart-live-panel')?.append(continuity);continuity.classList.add('k12345-wallet-continuity');}
    }
    function sizeControls(){
      const scale=1/(globalThis.visualViewport?.scale||1),visibleWidth=(globalThis.visualViewport?.width||innerWidth)/scale;
      const inset=(globalThis.visualViewport?.height||innerHeight)/scale<480?110:8; // preserve the legacy right-edge Warp rail in landscape
      for(const [name,value]of Object.entries({position:'fixed',left:'auto',right:`${(inset+152)*scale}px`,top:`${8*scale}px`,bottom:'auto',width:`${44*scale}px`,minWidth:`${44*scale}px`,maxWidth:`${44*scale}px`,height:`${44*scale}px`,minHeight:`${44*scale}px`,padding:'0',margin:'0',fontSize:`${20*scale}px`,zIndex:'10040',transform:'none'}))button.style[name]=value;
      if(home)Object.assign(home.style,{right:`${inset*scale}px`,top:`${8*scale}px`,width:`${140*scale}px`,minWidth:'0',height:`${44*scale}px`,minHeight:`${44*scale}px`,fontSize:`${11.5*scale}px`,padding:`${9*scale}px`,lineHeight:'1.4'});
      const continuity=document.getElementById('return-wallet-continuity');if(continuity)Object.assign(continuity.style,{top:`${58*scale}px`,right:`${inset*scale}px`,width:`${140*scale}px`,fontSize:`${9*scale}px`});
      const settings=control.root.querySelector('.kaios-audio-panel');if(settings){settings.style.transform=`translate(-50%,-50%) scale(${scale})`;settings.style.width=`${Math.min(310,visibleWidth-24)}px`;settings.style.maxHeight=`${Math.max(160,(globalThis.visualViewport?.height||innerHeight)/scale-32)}px`;}
      if(compactHeart){
        for(const el of [button,home].filter(Boolean))el.removeAttribute('style');
        document.getElementById('return-wallet-continuity')?.removeAttribute('style');
      }
    }
    sizeControls();if(!button.dataset.kaiosSizeBound){button.dataset.kaiosSizeBound='1';globalThis.visualViewport?.addEventListener('resize',sizeControls);globalThis.addEventListener('resize',sizeControls);}
    if(home&&!home.dataset.kaiosFadeBound){home.dataset.kaiosFadeBound='1';home.addEventListener('click',async event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||home.target)return;event.preventDefault();await Promise.race([audio.transitionToWorld('PORTAL'),new Promise(resolve=>setTimeout(resolve,450))]);location.assign(home.href);});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  if(document.readyState!=='complete')globalThis.addEventListener('load',install,{once:true});
  return audio;
}

function bindUniversePresentation(app,audio){
  const panel=document.getElementById('music-panel'),button=document.querySelector('.nav-music'),toggle=document.querySelector('.nav-audio');
  const volume=document.getElementById('music-vol');
  const start=async()=>{if(await audio.unlock()){audio.setMuted(false);audio.setMusicEnabled(true);}};
  const openSettings=force=>{
    const show=typeof force==='boolean'?force:panel.style.display==='none';
    panel.style.display=show?'block':'none';button.setAttribute('aria-expanded',String(show));
    if(show&&audio.snapshot().needsGesture)void start();
  };
  button.setAttribute('aria-controls','music-panel');button.setAttribute('aria-expanded','false');
  app.openMusic=openSettings;
  app.enableAudio=async()=>{const state=audio.snapshot();if(state.needsGesture||state.settings.muted||!state.settings.musicEnabled)await start();else audio.setMuted(true);};
  app.musicInit=()=>{};app.musicPlay=start;
  app.musicPause=app.musicStop=()=>audio.setMusicEnabled(false);
  // One original, continuously arranged Universe theme, not an MP3 playlist.
  app.musicPrev=app.musicNext=()=>{};
  app.musicLoadBuiltIn=app.musicLoadBuiltin=async()=>[];
  app.musicSetVolume=value=>audio.setVolume('music',Number(value)/100);
  app.speak=text=>audio.speak(text);
  volume.addEventListener('input',()=>app.musicSetVolume(volume.value));
  document.getElementById('music-mute').addEventListener('click',()=>audio.setMuted(!audio.snapshot().settings.muted));
  audio.subscribe(state=>{
    toggle.classList.toggle('on',state.musicPlaying);toggle.setAttribute('aria-pressed',String(state.musicPlaying));
    toggle.textContent=state.needsGesture?'開啟音效/說明':state.settings.muted?'開啟音效/說明':state.musicPlaying?'關閉音效/說明':'開啟音效/說明';
    document.getElementById('music-name').textContent=state.theme;
    document.getElementById('music-now').textContent=state.needsGesture?'請點播放以開啟聲音':state.settings.muted?'已靜音':state.musicPlaying?'播放中':'已停止';
    document.getElementById('music-status').textContent=state.lastError||'第一方合成音樂 · 不載入商業 MP3';
    document.getElementById('music-mute').textContent=state.settings.muted?'取消靜音':'靜音';
    volume.value=String(Math.round(state.settings.music*100));document.getElementById('music-vol-txt').textContent=volume.value+'%';
  });
  const home=document.querySelector('[data-kaios-return="PORTAL"]');
  home.addEventListener('click',async event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||home.target)return;
    event.preventDefault();await Promise.race([audio.transitionToWorld('PORTAL'),new Promise(resolve=>setTimeout(resolve,450))]);location.assign(home.href);
  });
  return{audio,root:panel,openSettings};
}
