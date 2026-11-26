import {WORLD_REGISTRY,BANK_SERVICE,findWorld,isPlayable,isNavigable,playableDestination,resumeDestination,portalBase,worldUrl} from './kaios-world-registry.mjs';
import {createLocalPlayerStore} from '../K線西遊記/temples/11520/runtime/player-life-runtime.mjs';

/** A separate holder-wallet service, not a playable world or player destination. */
export const ALCHEMY_SERVICE=Object.freeze({entryUrl:'K線西遊記/temples/18911/index.html'});

/** Read-only, privacy-minimal projection of the existing validated Player Life. */
export function readPortalPlayer(storage){
 try{
  const store=createLocalPlayerStore({storage}),snapshot=store.snapshot(),player=store.loadPlayer();
  if(snapshot.status!=='READY'||!player)return null;
   const destination=resumeDestination(player.lastWorld);if(!destination)return null;
  return Object.freeze({displayName:player.displayName,level:player.level,homeWorld:player.homeWorld,lastWorld:player.lastWorld,displayLastWorld:['11520','88888'].includes(player.lastWorld)?'12682':player.lastWorld,destination});
 }catch{return null}
}
function el(document,tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
export function renderPortal(document,{storage,base=portalBase()}={}){
 const link=(text,path,className='')=>{const a=el(document,'a',className,text);a.href=new URL(path,base).href;return a};
 const status=world=>el(document,'span','world-status',world.status==='PLAYABLE'?'● PLAYABLE · 可玩':world.status==='BETA'?'BETA · 候選入口':'研究 / 資訊');
 const alchemy=document.querySelector('#alchemyService');if(alchemy)alchemy.href=new URL(ALCHEMY_SERVICE.entryUrl,base).href;
 const bankHost=document.querySelector('#bankEntry');bankHost.replaceChildren();
 const bank=link('',BANK_SERVICE.entryUrl,'bank-service');bank.id='bankEntryLink';
 const bankCopy=el(document,'span','bank-service-copy');bankCopy.append(el(document,'strong','bank-service-name',BANK_SERVICE.name),el(document,'span','bank-service-description',BANK_SERVICE.description));
 bank.append(bankCopy,el(document,'span','bank-service-action',BANK_SERVICE.cta+' →'));bankHost.append(bank);
 const primary=findWorld('11520'),primaryHost=document.querySelector('#primaryWorld');primaryHost.replaceChildren(status(primary));
 const launch=link('前往11520宇宙萬物交易所',primary.entryUrl,'primary-cta');launch.dataset.worldId=primary.worldId;launch.id='primaryPlay';launch.append(el(document,'span','','↗'));primaryHost.append(launch);
 const cards=document.querySelector('#worldCards');cards.replaceChildren();
 for(const world of WORLD_REGISTRY.filter(world=>isNavigable(world)&&!world.routeOnly)){
  const card=el(document,'article',`world-card ${world.tone}`);card.dataset.worldId=world.worldId;
  const visual=el(document,'div','card-art');visual.setAttribute('aria-hidden','true');visual.append(el(document,'span','card-orb'),el(document,'span','card-symbol',world.worldId==='11520'?'山':world.worldId==='12345'?'心':'宙'));
  card.append(visual,status(world),el(document,'h3','',world.name),el(document,'p','card-subtitle',world.subtitle),el(document,'p','card-description',world.description));
  const tags=el(document,'div','capabilities');for(const c of world.capabilities)tags.append(el(document,'span','',c));card.append(tags);
  const play=link(world.cta,world.entryUrl,'card-cta');play.dataset.worldId=world.worldId;play.append(el(document,'span','','↗'));card.append(play);cards.append(card);
 }
 const explore=document.querySelector('#exploreCards'),research=document.querySelector('#researchArchiveCards');explore.replaceChildren();research.replaceChildren();
 for(const world of WORLD_REGISTRY.filter(w=>w.status==='RESEARCH')){
  const card=el(document,'article','explore-card');card.dataset.status=world.status;card.dataset.worldId=world.worldId;
  card.append(el(document,'span','research-label',world.subtitle),el(document,'h3','',world.name),el(document,'p','',world.description),link('了解更多 ↗',world.entryUrl,'info-link'));(world.disclosure?research:explore).append(card);
 }
 const construction=document.querySelector('#constructionWorlds');construction.replaceChildren();
 for(const world of WORLD_REGISTRY.filter(w=>w.status==='UNDER_CONSTRUCTION')){const row=el(document,'div','construction-row');row.dataset.status=world.status;row.append(el(document,'span','',world.name),el(document,'span','','建設中'));construction.append(row)}
 const welcome=document.querySelector('#playerWelcome');
 function updateWelcome(){
  const player=readPortalPlayer(storage);welcome.replaceChildren();welcome.hidden=!player;if(!player)return;
  welcome.append(el(document,'p','welcome-name',`歡迎回來，${player.displayName}`),el(document,'p','welcome-detail',`Lv. ${player.level} · 家園 ${findWorld(player.homeWorld)?.name||'KAIOS'} · 上次 ${findWorld(player.displayLastWorld)?.name||'KAIOS'}`));
  const resume=link('繼續旅程 →',player.destination,'resume-cta');resume.dataset.worldId=player.lastWorld;resume.id='continueJourney';welcome.append(resume,el(document,'small','','本機玩家紀錄 · 非雲端登入'));
 }
 updateWelcome();return {refreshPlayer:updateWelcome,worldUrl:id=>worldUrl(id,base)};
}
/** Read only the updater-owned block; never interpret README markup as HTML. */
export function parseLatestVideo(readme){
 const start='<!-- LATEST_VIDEO_START -->',end='<!-- LATEST_VIDEO_END -->';
 if(typeof readme!=='string'||readme.split(start).length!==2||readme.split(end).length!==2)return null;
 const from=readme.indexOf(start),to=readme.indexOf(end);if(to<from)return null;
 const block=readme.slice(from+start.length,to),title=block.match(/^▶\s+(.+?)\s*$/m)?.[1]?.trim(),href=block.match(/^👉\s+(https:\/\/\S+)\s*$/m)?.[1];
 if(!title||!href)return null;
 try{
  const url=new URL(href),id=url.searchParams.get('v');
  if(url.protocol!=='https:'||url.hostname!=='www.youtube.com'||url.port||url.username||url.password||url.pathname!=='/watch'||url.hash||[...url.searchParams.keys()].join()!=='v'||!/^[A-Za-z0-9_-]{11}$/.test(id))return null;
  return Object.freeze({title,url:url.href,videoId:id});
 }catch{return null}
}
const youtubeApiLoads=new WeakMap();
/** Load the official API only after a visible player or an explicit play action. */
function loadYouTubeApi(document){
 const view=document.defaultView;
 if(typeof view?.YT?.Player==='function')return Promise.resolve(view.YT);
 if(youtubeApiLoads.has(document))return youtubeApiLoads.get(document);
 const pending=new Promise((resolve,reject)=>{
  let settled=false;
  const previous=view.onYouTubeIframeAPIReady,script=el(document,'script');
  const finish=error=>{
   if(settled)return;
   settled=true;
   view.clearTimeout(timer);
   if(view.onYouTubeIframeAPIReady===onReady)view.onYouTubeIframeAPIReady=previous;
   script.onerror=null;
   if(error){script.remove();reject(error)}else resolve(view.YT);
  };
  const timer=view.setTimeout(()=>finish(new Error('VIDEO_API_UNCONFIRMED')),8000);
  const onReady=()=>{
   if(settled)return;
   try{if(typeof previous==='function')previous()}catch{}
   finish(typeof view.YT?.Player==='function'?null:new Error('VIDEO_API_UNAVAILABLE'));
  };
  view.onYouTubeIframeAPIReady=onReady;
  script.src='https://www.youtube.com/iframe_api';script.async=true;script.referrerPolicy='strict-origin-when-cross-origin';
  script.onerror=()=>finish(new Error('VIDEO_API_UNAVAILABLE'));document.head.append(script);
 });
 youtubeApiLoads.set(document,pending);
 pending.catch(()=>{if(youtubeApiLoads.get(document)===pending)youtubeApiLoads.delete(document)});
 return pending;
}
/** One viewport-owned player. Removing its frame also stops late/background audio. */
function createViewportVideoController(document){
 const view=document.defaultView,entries=[],motion=view.matchMedia?.('(prefers-reduced-motion: reduce)');
 let active=null,manualHold=null,scheduled=false,scheduledHandle=null,schedulerUsesRaf=false,sequence=0,suspended=false;
 const autoAllowed=()=>!motion?.matches&&!view.navigator?.connection?.saveData;
 const visible=entry=>{
  if(suspended||document.hidden||!entry.stage.isConnected)return false;
  const r=entry.stage.getBoundingClientRect(),w=view.innerWidth,h=view.innerHeight;
  const area=Math.max(0,Math.min(r.bottom,h)-Math.max(r.top,0))*Math.max(0,Math.min(r.right,w)-Math.max(r.left,0));
  return r.width>=200&&r.height>=200&&area/(r.width*r.height)>.5;
 };
 const canRetryBlockedPlayer=entry=>{
  if(!entry.awaitingGesture||!entry.ready||!entry.muted||entry.userSound)return false;
  const r=entry.play.getBoundingClientRect();
  return r.bottom>0&&r.top<view.innerHeight&&r.right>0&&r.left<view.innerWidth;
 };
 const current=(entry,epoch,target)=>active===entry&&entry.epoch===epoch&&entry.frame?.isConnected&&(!target||entry.player===target);
 function soundState(entry){
  let confirmed=null;
  try{const muted=entry.player.isMuted();if(typeof muted==='boolean'){confirmed=muted;entry.muted=muted;entry.host.dataset.muted=String(muted)}}catch{}
  if(confirmed===null)entry.host.dataset.muted='unknown';
  entry.sound.textContent=entry.muted?'開啟聲音':'靜音';entry.sound.setAttribute('aria-pressed',String(!entry.muted));
  return confirmed;
 }
 function state(entry,value,message){
  if(value!=='blocked')entry.awaitingGesture=false;
  entry.state=value;entry.host.dataset.playbackState=value;entry.status.textContent=message;
  entry.play.textContent=value==='playing'?'暫停影片':entry.label;
  entry.sound.disabled=!(active===entry&&entry.ready&&visible(entry));
  entry.watch.hidden=!['blocked','unconfirmed','error'].includes(value);
 }
 function removePlayer(entry){
  ++entry.epoch;view.clearTimeout(entry.timer);
  try{entry.player?.pauseVideo()}catch{}
  try{entry.player?.destroy()}catch{}
  entry.player=null;entry.frame=null;entry.ready=false;entry.muted=true;entry.userSound=false;
  entry.stage.replaceChildren(entry.placeholder);entry.host.dataset.muted='true';entry.sound.textContent='開啟聲音';entry.sound.setAttribute('aria-pressed','false');
 }
 function stop(entry,message='影片已停止；再次進入畫面會靜音播放。'){
  removePlayer(entry);if(active===entry)active=null;state(entry,'stopped',message);
 }
 function attempt(entry,mute=true){
  state(entry,'attempting',mute?'正在嘗試靜音播放；若未開始，請按播放。':'正在嘗試播放；若未開始，請使用播放器控制。');
  try{if(mute){entry.player.mute();entry.userSound=false}entry.player.playVideo()}catch{state(entry,'blocked','播放器未能開始，請按播放或前往 YouTube。')}
  const epoch=entry.epoch;view.clearTimeout(entry.timer);
  entry.timer=view.setTimeout(()=>{if(current(entry,epoch)&&!['playing','paused','ended','error','blocked'].includes(entry.state))state(entry,'unconfirmed','尚未確認播放，請按播放或前往 YouTube。')},8000);
 }
 async function start(entry,manual=false){
  if(manual&&!suspended&&!document.hidden&&!visible(entry))entry.stage.scrollIntoView({block:'center',behavior:'instant'});
  if(!visible(entry)){if(manual)state(entry,'blocked','請將播放器移入畫面，或使用 YouTube 連結。');return}
  manualHold=null;entry.attempted=true;
  if(active===entry&&entry.player&&entry.ready){attempt(entry,!entry.userSound);return}
  if(active===entry&&['loading','attempting'].includes(entry.state))return;
  if(active)stop(active,'已切換到另一支影片。');
  active=entry;const epoch=++entry.epoch;entry.muted=true;entry.userSound=false;entry.host.dataset.muted='true';
  state(entry,'loading',manual?'正在載入播放器…':'影片進入畫面，正在準備靜音播放…');
  try{
   const api=await loadYouTubeApi(document);
   if(active!==entry||entry.epoch!==epoch)return;
   if(!visible(entry)){stop(entry);return}
   const frame=el(document,'iframe');frame.id='visitor-video-'+(++sequence);frame.title=entry.title;
   const url=new URL('https://www.youtube.com/embed/'+entry.videoId);
   url.search=new URLSearchParams({autoplay:'0',mute:'1',playsinline:'1',enablejsapi:'1',origin:view.location.origin}).toString();
   frame.src=url.href;frame.referrerPolicy='strict-origin-when-cross-origin';frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;
   entry.frame=frame;entry.stage.replaceChildren(frame);
   entry.timer=view.setTimeout(()=>{if(current(entry,epoch)&&!entry.ready){removePlayer(entry);state(entry,'error','播放器尚未回應，請使用 YouTube 連結。')}},8000);
   entry.player=new api.Player(frame.id,{events:{
    onReady:event=>{
     if(active!==entry||entry.epoch!==epoch)return;
     if(!visible(entry)){stop(entry);return}
     let frame;try{frame=event.target.getIframe();if((entry.player&&event.target!==entry.player)||!frame||!entry.stage.contains(frame)||new URL(frame.src).origin!=='https://www.youtube.com')return}catch{return}
     entry.player=event.target;entry.frame=frame;entry.ready=true;attempt(entry);
    },
    onStateChange:event=>{
     if(!event.target||!current(entry,epoch,event.target))return;
     if(!visible(entry)){stop(entry);return}
     let confirmed;try{confirmed=event.target.getPlayerState()}catch{stop(entry,'未能確認播放器狀態，請手動播放。');entry.attempted=true;manualHold=entry;return}
     if(event.data===1&&confirmed===1){
      const muted=soundState(entry);
      if(!entry.userSound&&muted!==true){stop(entry,'尚未確認靜音，請手動播放。');entry.attempted=true;manualHold=entry;return}
      view.clearTimeout(entry.timer);state(entry,'playing',muted===true?'靜音播放中；可按「開啟聲音」。':muted===false?'影片播放中，聲音已開啟。':'影片播放中；聲音狀態尚未確認。');
     }else if(event.data===2){view.clearTimeout(entry.timer);state(entry,'paused','影片已暫停；請按播放繼續。');manualHold=entry}
     else if(event.data===0){view.clearTimeout(entry.timer);state(entry,'ended','影片播放完畢；可再次按播放。');manualHold=entry}
    },
    onAutoplayBlocked:event=>{if(event.target&&current(entry,epoch,event.target)){view.clearTimeout(entry.timer);entry.awaitingGesture=true;state(entry,'blocked','瀏覽器未允許自動播放，請按播放或前往 YouTube。')}},
    onError:event=>{if(event.target&&current(entry,epoch,event.target)){removePlayer(entry);state(entry,'error','這支影片暫時無法內嵌播放，請前往 YouTube。')}}
   }});
  }catch{if(active===entry&&entry.epoch===epoch){removePlayer(entry);state(entry,'error','播放器未能載入，請使用 YouTube 連結。')}}
 }
 function update(){
  scheduled=false;scheduledHandle=null;
  for(const entry of entries){entry.visible=visible(entry);if(!entry.visible){entry.attempted=false;if(manualHold===entry)manualHold=null}}
  if(active){
   // A short viewport may show the retry button while less than half of the player is visible.
   if(!active.visible&&!canRetryBlockedPlayer(active))stop(active);
   else active.sound.disabled=!(active.ready&&active.visible);
  }
  if(active||suspended||document.hidden||!autoAllowed()||manualHold?.visible)return;
  const next=entries.find(entry=>entry.visible&&!entry.attempted);if(next)start(next);
 }
 function cancelSchedule(){
  if(scheduledHandle!==null){if(schedulerUsesRaf)view.cancelAnimationFrame?.(scheduledHandle);else view.clearTimeout(scheduledHandle)}
  scheduledHandle=null;scheduled=false;
 }
 function schedule(){
  if(scheduled||suspended||document.hidden)return;scheduled=true;schedulerUsesRaf=typeof view.requestAnimationFrame==='function';
  scheduledHandle=schedulerUsesRaf?view.requestAnimationFrame(update):view.setTimeout(update,16);
 }
 function stopAll(){for(const entry of entries){if(entry===active)stop(entry,'影片已停止；回到畫面後再播放。');entry.attempted=false}manualHold=null}
 view.addEventListener('scroll',schedule,{passive:true});view.addEventListener('resize',schedule,{passive:true});
 view.addEventListener('pagehide',()=>{suspended=true;cancelSchedule();stopAll()});view.addEventListener('pageshow',()=>{suspended=false;cancelSchedule();schedule()});
 document.addEventListener('visibilitychange',()=>{cancelSchedule();document.hidden?stopAll():schedule()});
 const preferenceChanged=()=>{cancelSchedule();if(!autoAllowed())stopAll();schedule()};
 motion?.addEventListener?.('change',preferenceChanged);view.navigator?.connection?.addEventListener?.('change',preferenceChanged);
 return {mount(host,{videoId,title,label,className}){
  if(typeof videoId!=='string'||!/^[A-Za-z0-9_-]{11}$/.test(videoId))throw new TypeError('INVALID_VIDEO_ID');
  const controls=el(document,'div','video-controls'),play=el(document,'button',className),sound=el(document,'button','video-sound','開啟聲音');
  play.type=sound.type='button';play.dataset.videoId=videoId;play.textContent=label;sound.disabled=true;sound.setAttribute('aria-pressed','false');
  const status=el(document,'p','video-status',autoAllowed()?'滑到影片區會嘗試靜音播放；也可按播放。':'依減少動態或省流量設定，請按播放。');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const watch=el(document,'a','video-watch','在 YouTube 開啟 ↗');watch.href='https://www.youtube.com/watch?v='+videoId;watch.target='_blank';watch.rel='noopener';watch.hidden=true;
  const stage=el(document,'div','video-stage'),placeholder=el(document,'p','video-placeholder','▶ '+title);stage.append(placeholder);controls.append(play,sound,status,watch);host.append(controls,stage);
  const entry={host,stage,placeholder,play,sound,status,watch,videoId,title,label,epoch:0,attempted:false,ready:false,muted:true,userSound:false,awaitingGesture:false,state:'idle'};host.dataset.playbackState='idle';host.dataset.muted='true';entries.push(entry);
  play.addEventListener('click',event=>{if(!event.isTrusted)return;if(active===entry&&entry.state==='playing'){entry.attempted=true;manualHold=entry;try{entry.player.pauseVideo();state(entry,'pausing','正在暫停影片…')}catch{stop(entry,'影片已停止；可重新按播放。')}}else start(entry,true)});
  sound.addEventListener('click',event=>{
   if(!event.isTrusted||active!==entry||!entry.ready||!visible(entry))return;
   try{if(entry.muted){entry.userSound=true;entry.player.unMute();entry.player.playVideo()}else{entry.userSound=false;entry.player.mute()}const epoch=entry.epoch;view.setTimeout(()=>{if(current(entry,epoch)){const muted=soundState(entry);if(entry.state==='playing')state(entry,'playing',muted===true?'靜音播放中；可按「開啟聲音」。':muted===false?'影片播放中，聲音已開啟。':'影片播放中；聲音狀態尚未確認。')}},150)}catch{state(entry,'blocked','聲音未能開啟，可使用播放器控制或前往 YouTube。')}
  });
  schedule();return entry;
 }};
}
export function mountVisitorInfo(document,{base=portalBase(),fetcher=globalThis.fetch}={}){
 const section=el(document,'section','section visitor-section');section.id='youtube';section.setAttribute('aria-labelledby','visitorTitle');
 const heading=el(document,'div','section-heading');heading.append(el(document,'p','eyebrow','K-LINE ODYSSEY / STORIES'),el(document,'h2','','走進 K線西遊記'));heading.lastChild.id='visitorTitle';section.append(heading);
 const grid=el(document,'div','visitor-grid'),film=el(document,'div','brand-film');
 const videos=createViewportVideoController(document);
 videos.mount(film,{videoId:'akp4K_uzJ28',title:'K線西遊記官方品牌影片',label:'播放官方品牌影片',className:'brand-film-play'});
 const copy=el(document,'div','visitor-copy');copy.append(el(document,'h3','','官方品牌影片'),el(document,'p','visitor-note','從一支影片認識我們的世界。'));
 const original=el(document,'a','visitor-link','在 YouTube 觀看品牌影片 ↗');original.href='https://www.youtube.com/watch?v=akp4K_uzJ28';original.target='_blank';original.rel='noopener';copy.append(original);
 const latest=el(document,'div','latest-video');latest.id='latestVideo';latest.setAttribute('aria-live','polite');latest.append(el(document,'h3','','最新影片'),el(document,'p','visitor-note','最近同步的頻道影片；完整最新發布請查看官方頻道。'));
 const video=el(document,'a','visitor-link','前往官方 YouTube 頻道 ↗');video.href='https://www.youtube.com/@klineodyssey/videos';video.target='_blank';video.rel='noopener';latest.append(video);copy.append(latest);
 const community=el(document,'div','visitor-community');community.id='community';community.append(el(document,'h3','','官方社群'));
 const socials=el(document,'div','visitor-socials');socials.dataset.officialLinks='youtube,x,telegram,tiktok,facebook_page,instagram,line_official,github';socials.dataset.officialLinksCardClass='visitor-social';socials.dataset.officialLinksAnchorClass='visitor-link';socials.dataset.officialLinksShowStatus='false';community.append(socials);
 const all=el(document,'a','visitor-link','查看所有官方社群 →');all.href=new URL('community/',base).href;community.append(all);copy.append(community);
 const contact=el(document,'div','visitor-contact');contact.id='support';contact.append(el(document,'h3','','聯絡我們'));const email=el(document,'a','visitor-link','klineodyssey.io@gmail.com');email.href='mailto:klineodyssey.io@gmail.com';const website=el(document,'a','visitor-link','https://klineodyssey.github.io/kline-odyssey/');website.href='https://klineodyssey.github.io/kline-odyssey/';contact.append(email,el(document,'br'),website);community.append(contact);
 grid.append(film,copy);section.append(grid);document.querySelector('#explore').before(section);
 // Reuse the existing official-link renderer and canonical manifest.
 const script=el(document,'script');script.src=new URL('assets/official-links.js',base).href;script.dataset.manifest=new URL('OfficialLinks.json',base).href;document.body.append(script);
 const ready=Promise.resolve().then(()=>fetcher(new URL('README.md',base).href,{cache:'no-store'})).then(response=>{if(!response.ok)throw new Error('VIDEO_SOURCE_UNAVAILABLE');return response.text()}).then(readme=>{
  const current=parseLatestVideo(readme);if(!current)throw new Error('VIDEO_SOURCE_INVALID');
  const player=el(document,'div','latest-film');videos.mount(player,{videoId:current.videoId,title:'最近同步影片：'+current.title,label:'播放最近同步影片',className:'latest-film-play'});
  video.href=current.url;video.textContent=current.title+' ↗';latest.append(player);latest.dataset.state='synced';
 }).catch(()=>{latest.dataset.state='unavailable';latest.querySelector('p').textContent='暫時無法讀取同步影片，請前往官方頻道查看最新發布。'});
 return {ready};
}
/** Visitor clocks use exchange-local IANA zones, including New York DST. */
export function marketClocks(now=new Date()){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw new TypeError('INVALID_MARKET_CLOCK');
 const format=timeZone=>new Intl.DateTimeFormat('zh-TW',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'}).format(now);
 return {taipei:format('Asia/Taipei'),newYork:format('America/New_York'),iso:now.toISOString()};
}
export const MARKET_NEWS_LINKS=Object.freeze([
 ['聯合新聞網 · 綜合新聞','https://udn.com/news/index'],
 ['經濟日報 · 期貨新聞','https://money.udn.com/money/cate/11111'],
 ['兆豐 · 國際財經新聞查詢','https://fund.megabank.com.tw/ETFWeb/HTML/ETNEWS.DJHTM#TYPE=1&DATE=&PAGE=1'],
 ['非凡新聞台','https://news.ustv.com.tw/'],
 ['東森財經新聞','https://fnc.ebc.net.tw/'],
].map(Object.freeze));
export function mountMarketWatch(document,{base=portalBase()}={}){
 const section=el(document,'section','section market-watch');section.id='market-watch';section.setAttribute('aria-labelledby','marketTitle');
 const heading=el(document,'div','section-heading');heading.append(el(document,'p','eyebrow','MARKET WATCH'),el(document,'h2','','股期資訊'),el(document,'p','','看市場時間、前往行情工具，追蹤公開新聞。'));heading.children[1].id='marketTitle';section.append(heading);
 const clocks=el(document,'div','market-clocks'),clockNodes={};
 for(const [key,label] of [['taipei','台北 · Asia/Taipei'],['newYork','紐約 · America/New_York']]){
  const box=el(document,'div','market-clock');clockNodes[key]=el(document,'time');clockNodes[key].dataset.marketClock=key;box.append(el(document,'span','',label),clockNodes[key]);clocks.append(box);
 }
 section.append(clocks);
 const refreshClock=()=>{const current=marketClocks();for(const key of Object.keys(clockNodes)){clockNodes[key].textContent=current[key];clockNodes[key].dateTime=current.iso;}};refreshClock();
 const link=(label,path)=>{const a=el(document,'a','visitor-link',label);a.href=new URL(path,base).href;if(new URL(a.href).origin!==new URL(base).origin){a.target='_blank';a.rel='noopener noreferrer'}return a;};
 const grid=el(document,'div','market-watch-grid'),hours=el(document,'article','market-panel');hours.id='market-times';hours.append(el(document,'h3','','一般交易時段'),el(document,'p','visitor-note','時段參考；假日、提早收盤與到期契約以交易所公告為準。'));
 const sessions=[
  ['台股現貨','09:00–13:30 · 台北時間','證交所一般交易時段','https://www.twse.com.tw/en/products/system/trading.html'],
  ['台指期貨 TX','日盤 08:45–13:45 · 台北時間','夜盤 15:00–次日 05:00；到期契約最後交易日日盤至13:30，無夜盤。','https://www.taifex.com.tw/cht/2/tX'],
  ['美股 Nasdaq 現貨','09:30–16:00 · 紐約時間','紐約時鐘自動反映夏令時間；此列為現貨一般時段。','https://www.nasdaq.com/market-activity'],
 ];
 for(const [name,period,note,url] of sessions){const row=el(document,'div','market-session');row.append(el(document,'h4','',name),el(document,'p','market-period',period),el(document,'p','visitor-note',note),link('交易所時段與公告 ↗',url));hours.append(row)}
 const international=el(document,'div','market-session');international.append(el(document,'h3','','國際期貨時段'),el(document,'p','visitor-note','各商品的日夜盤、休息與假日安排，請查看對應交易所規格。'));
 const internationalLinks=el(document,'div','market-source-list');
 for(const [label,url] of [
  ['CME · Nasdaq-100 期貨（NQ） ↗','https://www.cmegroup.com/markets/equities/nasdaq/e-mini-nasdaq-100.html'],
  ['JPX · 日經225期貨 ↗','https://www.jpx.co.jp/english/derivatives/products/domestic/225futures/01.html'],
  ['HKEX · 恒生指數期貨 ↗','https://www.hkex.com.hk/products/listed-derivatives/equity-index/hang-seng-index-(hsi)/hang-seng-index-futures?sc_lang=en'],
  ['Eurex · DAX期貨 ↗','https://www.eurex.com/ex-en/markets/idx/dax'],
 ])internationalLinks.append(link(label,url));international.append(internationalLinks);hours.append(international);
 const sources=el(document,'article','market-panel');sources.id='market-sources';sources.append(el(document,'h3','','行情入口'),el(document,'p','visitor-note','外部行情工具；更新時間與延遲狀態以來源頁面標示為準。'));
 const quotes=el(document,'div','market-source-list');
 for(const [label,path] of [
  ['11520 市場看盤 · BTC / ETH / BNB','K線西遊記/temples/11520/index.html'],
  ['WantGoo · 台指與期權行情 ↗','https://www.wantgoo.com/futures'],
  ['WantGoo · 美股行情（含 Nasdaq） ↗','https://www.wantgoo.com/global/us-stocks'],
  ['WantGoo · 台股與國際市場總覽 ↗','https://www.wantgoo.com/'],
 ])quotes.append(link(label,path));sources.append(quotes);
 const news=el(document,'div','market-news');news.id='market-news';news.append(el(document,'h3','','公開新聞'),el(document,'p','visitor-note','外部新聞網站；兆豐連結提供國際財經新聞查詢。'));
 const newsLinks=el(document,'div','market-source-list');for(const [label,url] of MARKET_NEWS_LINKS)newsLinks.append(link(label+' ↗',url));news.append(newsLinks);sources.append(news);
 grid.append(hours,sources);section.append(grid);document.querySelector('#youtube').before(section);
 return {refreshClock};
}
if(typeof document!=='undefined'){
 const portal=renderPortal(document);
 mountVisitorInfo(document);
 const market=mountMarketWatch(document);
 window.setInterval(()=>{if(!document.hidden)market.refreshClock()},60000);
 window.addEventListener('pageshow',market.refreshClock);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)market.refreshClock()});
 window.addEventListener('storage',()=>portal.refreshPlayer());window.addEventListener('pageshow',()=>portal.refreshPlayer());
 // Audio failure must not prevent navigation or Player Life. No autoplay attempt.
 import('./kaios-audio-ui.mjs').then(({mountAudioControl})=>mountAudioControl({container:document.querySelector('#portalAudio'),worldId:'PORTAL'})).catch(()=>{document.querySelector('#portalAudio').textContent='聲音暫不可用 · 可靜音遊玩'});
 let navigating=false;
 window.addEventListener('pageshow',()=>{navigating=false});
 document.addEventListener('click',async event=>{
  const a=event.target.closest?.('a[data-world-id]');
  if(!a||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||a.target||a.download)return;
  const target=new URL(a.href);if(target.origin!==location.origin||!playableDestination(a.dataset.worldId))return;
  event.preventDefault();if(navigating)return;navigating=true;
  try{await Promise.race([import('./kaios-audio.mjs').then(({getKaiosAudio})=>getKaiosAudio().transitionToWorld?.(a.dataset.worldId)),new Promise(resolve=>setTimeout(resolve,450))])}catch{}
  location.assign(target.href);
 });
 // Old homepage bookmarks converge to the one Portal rather than dead sections.
 const aliases={top:'main',temples:'worlds',token:'explore',library:'explore',map:'explore',operating:'explore','official-info':'explore',dna:'explore','player-genesis':'explore','causal-world':'explore','ecosystem-runtime':'explore','aquaculture-runtime':'explore','ai-company-runtime':'explore','creator-marketplace':'explore','life-runtime':'explore','kaios-world':'explore','k280-world':'explore'};
 const restoreBookmark=()=>{const id=aliases[location.hash.slice(1)];if(id)document.getElementById(id).scrollIntoView()};
 restoreBookmark();window.addEventListener('hashchange',restoreBookmark);
}
