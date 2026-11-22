/* LOCAL ISOLATED YOUTUBE API FIXTURE. No YouTube code or upstream media.
 * Player state derives from native video events in the fulfilled fixture frame.
 * The internal message channel below is test transport only, never product API.
 */
(()=>{
 'use strict';
 const CHANNEL='KGEN_LOCAL_YT_MEDIA_FIXTURE_V1';
 const records=[];
 const diagnostics=globalThis.__KGEN_LOCAL_YT_MEDIA_FIXTURE__??={label:'LOCAL ISOLATED FIXTURE - NOT YOUTUBE PLAYBACK',apiScriptLoads:0,players:records,snapshot(){return this.players.map(({iframe,options,...r})=>JSON.parse(JSON.stringify(r)));}};
 diagnostics.apiScriptLoads++;
 let serial=diagnostics.players.length;
 const PlayerState={UNSTARTED:-1,ENDED:0,PLAYING:1,PAUSED:2,BUFFERING:3,CUED:5};
 class Player{
  constructor(element,options={}){
   this.iframe=typeof element==='string'?document.getElementById(element):element;
   if(!this.iframe||this.iframe.tagName!=='IFRAME')throw new TypeError('LOCAL_FIXTURE_REQUIRES_EXISTING_IFRAME');
   const url=new URL(this.iframe.src);
   if(url.origin!=='https://www.youtube.com'||!/^\/embed\/[A-Za-z0-9_-]{11}$/.test(url.pathname))throw new TypeError('LOCAL_FIXTURE_UNEXPECTED_EMBED');
   this.options=options;this.origin=url.origin;this.key='local-native-player-'+(++serial);
   this.record={key:this.key,videoId:url.pathname.split('/').pop(),src:url.href,state:-1,muted:true,ready:false,destroyRequested:false,destroyed:false,nativeSnapshot:null,commands:[],events:[],playErrors:[],iframe:this.iframe,options};
   diagnostics.players.push(this.record);
   this.onMessage=event=>{
    if(event.source!==this.iframe.contentWindow||event.origin!==this.origin)return;
    const message=event.data;
    if(!message||typeof message!=='object'||message.channel!==CHANNEL||message.key!==this.key)return;
    if(message.snapshot){
     const previous=this.record.state;
     this.record.nativeSnapshot=message.snapshot;
     this.record.state=message.snapshot.state;
     this.record.muted=message.snapshot.muted;
     this.record.events.push({kind:message.kind,state:message.snapshot.state,currentTime:message.snapshot.currentTime,paused:message.snapshot.paused,muted:message.snapshot.muted,at:performance.now()});
     if(message.snapshot.readyState>=2&&!this.record.ready){this.record.ready=true;this.emit('onReady');}
     if(this.record.ready&&previous!==this.record.state)this.emit('onStateChange',this.record.state);
    }
    if(message.kind==='autoplay-blocked'){this.record.playErrors.push(message.error);this.emit('onAutoplayBlocked');}
    if(message.kind==='error'){this.record.playErrors.push(message.error);this.emit('onError',5);}
    if(message.kind==='destroyed'){this.record.destroyed=true;this.detach();this.iframe.remove();}
   };
   this.onLoad=()=>this.post('hello');
   addEventListener('message',this.onMessage);this.iframe.addEventListener('load',this.onLoad);
   // Do not post to a not-yet-navigated about:blank iframe with the YT origin.
   // A committed cross-origin document exposes no contentDocument; load also
   // repeats the handshake so readiness emitted before API load is not lost.
   if(!this.iframe.contentDocument)this.post('hello');
  }
  emit(name,data){const fn=this.options.events?.[name];if(typeof fn==='function')fn({target:this,...(data===undefined?{}:{data}),localFixture:true});}
  post(command){if(this.record.destroyed)return;this.record.commands.push({command,at:performance.now()});this.iframe.contentWindow?.postMessage({channel:CHANNEL,key:this.key,command},this.origin);}
  getIframe(){return this.iframe;}
  mute(){this.post('mute');}
  unMute(){this.post('unmute');}
  isMuted(){return this.record.muted;}
  playVideo(){this.post('play');}
  pauseVideo(){this.post('pause');}
  getPlayerState(){return this.record.state;}
  getCurrentTime(){return this.record.nativeSnapshot?.currentTime??0;}
  getDuration(){return this.record.nativeSnapshot?.duration??0;}
  destroy(){if(this.record.destroyRequested)return;this.record.destroyRequested=true;this.post('destroy');}
  detach(){removeEventListener('message',this.onMessage);this.iframe.removeEventListener('load',this.onLoad);}
 }
 globalThis.YT={...(globalThis.YT||{}),Player,PlayerState,loaded:1,loading:0};
 queueMicrotask(()=>{if(typeof globalThis.onYouTubeIframeAPIReady==='function')globalThis.onYouTubeIframeAPIReady();});
})();
