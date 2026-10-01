import {WORLD_REGISTRY,findWorld,isPlayable,playableDestination,portalBase,worldUrl} from './kaios-world-registry.mjs';
import {createLocalPlayerStore} from '../K線西遊記/temples/11520/runtime/player-life-runtime.mjs';

/** Read-only, privacy-minimal projection of the existing validated Player Life. */
export function readPortalPlayer(storage){
 try{
  const store=createLocalPlayerStore({storage}),snapshot=store.snapshot(),player=store.loadPlayer();
  if(snapshot.status!=='READY'||!player)return null;
  const destination=playableDestination(player.lastWorld);if(!destination)return null;
  return Object.freeze({displayName:player.displayName,level:player.level,homeWorld:player.homeWorld,lastWorld:player.lastWorld,destination});
 }catch{return null}
}
function el(document,tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
export function renderPortal(document,{storage,base=portalBase()}={}){
 const link=(text,path,className='')=>{const a=el(document,'a',className,text);a.href=new URL(path,base).href;return a};
 const status=world=>el(document,'span','world-status',world.status==='PLAYABLE'?'● PLAYABLE · 可玩':'研究 / 資訊');
 const primary=findWorld('11520'),primaryHost=document.querySelector('#primaryWorld');primaryHost.replaceChildren(status(primary));
 const launch=link('進入 K11520 世界',primary.entryUrl,'primary-cta');launch.dataset.worldId=primary.worldId;launch.id='primaryPlay';launch.append(el(document,'span','','↗'));primaryHost.append(launch);
 const cards=document.querySelector('#worldCards');cards.replaceChildren();
 for(const world of WORLD_REGISTRY.filter(isPlayable)){
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
  welcome.append(el(document,'p','welcome-name',`歡迎回來，${player.displayName}`),el(document,'p','welcome-detail',`Lv. ${player.level} · 家園 ${findWorld(player.homeWorld)?.name||'KAIOS'} · 上次 ${findWorld(player.lastWorld).name}`));
  const resume=link('繼續旅程 →',player.destination,'resume-cta');resume.dataset.worldId=player.lastWorld;resume.id='continueJourney';welcome.append(resume,el(document,'small','','本機玩家紀錄 · 非雲端登入'));
 }
 updateWelcome();return {refreshPlayer:updateWelcome,worldUrl:id=>worldUrl(id,base)};
}
if(typeof document!=='undefined'){
 const portal=renderPortal(document);
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
 const aliases={top:'main',temples:'worlds',token:'explore',library:'explore',map:'explore',operating:'explore','official-info':'explore',dna:'explore',youtube:'explore',community:'explore',support:'explore','player-genesis':'explore','causal-world':'explore','ecosystem-runtime':'explore','aquaculture-runtime':'explore','ai-company-runtime':'explore','creator-marketplace':'explore','life-runtime':'explore','kaios-world':'explore','k280-world':'explore'};
 const restoreBookmark=()=>{const id=aliases[location.hash.slice(1)];if(id)document.getElementById(id).scrollIntoView()};
 restoreBookmark();window.addEventListener('hashchange',restoreBookmark);
}
