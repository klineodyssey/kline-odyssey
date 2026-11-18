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
function mountVideoPlayer(document,host,{videoId,title,label,className}){
 if(typeof videoId!=='string'||!/^[A-Za-z0-9_-]{11}$/.test(videoId))throw new TypeError('INVALID_VIDEO_ID');
 const play=el(document,'button',className);play.type='button';play.dataset.videoId=videoId;
 play.append(el(document,'span','film-play-icon','▶'),el(document,'strong','',label),el(document,'small','','點擊後在本站載入 YouTube 播放器'));host.append(play);
 play.addEventListener('click',()=>{
  const frame=el(document,'iframe');frame.src='https://www.youtube.com/embed/'+videoId+'?autoplay=1&playsinline=1';frame.title=title;frame.referrerPolicy='strict-origin-when-cross-origin';frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;host.replaceChildren(frame);
 },{once:true});
}
export function mountVisitorInfo(document,{base=portalBase(),fetcher=globalThis.fetch}={}){
 const section=el(document,'section','section visitor-section');section.id='youtube';section.setAttribute('aria-labelledby','visitorTitle');
 const heading=el(document,'div','section-heading');heading.append(el(document,'p','eyebrow','K-LINE ODYSSEY / STORIES'),el(document,'h2','','走進 K線西遊記'));heading.lastChild.id='visitorTitle';section.append(heading);
 const grid=el(document,'div','visitor-grid'),film=el(document,'div','brand-film');
 // Both players require an explicit playback gesture before loading a frame.
 mountVideoPlayer(document,film,{videoId:'akp4K_uzJ28',title:'K線西遊記官方品牌影片',label:'播放官方品牌影片',className:'brand-film-play'});
 const copy=el(document,'div','visitor-copy');copy.append(el(document,'h3','','官方品牌影片'),el(document,'p','visitor-note','從一支影片認識我們的世界。'));
 const original=el(document,'a','visitor-link','在 YouTube 觀看品牌影片 ↗');original.href='https://www.youtube.com/watch?v=akp4K_uzJ28';original.target='_blank';original.rel='noopener noreferrer';copy.append(original);
 const latest=el(document,'div','latest-video');latest.id='latestVideo';latest.setAttribute('aria-live','polite');latest.append(el(document,'h3','','最新影片'),el(document,'p','visitor-note','最近同步的頻道影片；完整最新發布請查看官方頻道。'));
 const video=el(document,'a','visitor-link','前往官方 YouTube 頻道 ↗');video.href='https://www.youtube.com/@klineodyssey/videos';video.target='_blank';video.rel='noopener noreferrer';latest.append(video);copy.append(latest);
 const community=el(document,'div','visitor-community');community.id='community';community.append(el(document,'h3','','官方社群'));
 const socials=el(document,'div','visitor-socials');socials.dataset.officialLinks='youtube,x,telegram,tiktok,facebook_page,instagram,line_official,github';socials.dataset.officialLinksCardClass='visitor-social';socials.dataset.officialLinksAnchorClass='visitor-link';socials.dataset.officialLinksShowStatus='false';community.append(socials);
 const all=el(document,'a','visitor-link','查看所有官方社群 →');all.href=new URL('community/',base).href;community.append(all);copy.append(community);
 const contact=el(document,'div','visitor-contact');contact.id='support';contact.append(el(document,'h3','','聯絡我們'));const email=el(document,'a','visitor-link','klineodyssey.io@gmail.com');email.href='mailto:klineodyssey.io@gmail.com';const website=el(document,'a','visitor-link','https://klineodyssey.github.io/kline-odyssey/');website.href='https://klineodyssey.github.io/kline-odyssey/';contact.append(email,el(document,'br'),website);community.append(contact);
 grid.append(film,copy);section.append(grid);document.querySelector('#explore').before(section);
 // Reuse the existing official-link renderer and canonical manifest.
 const script=el(document,'script');script.src=new URL('assets/official-links.js',base).href;script.dataset.manifest=new URL('OfficialLinks.json',base).href;document.body.append(script);
 const ready=Promise.resolve().then(()=>fetcher(new URL('README.md',base).href,{cache:'no-store'})).then(response=>{if(!response.ok)throw new Error('VIDEO_SOURCE_UNAVAILABLE');return response.text()}).then(readme=>{
  const current=parseLatestVideo(readme);if(!current)throw new Error('VIDEO_SOURCE_INVALID');
  const player=el(document,'div','latest-film');mountVideoPlayer(document,player,{videoId:current.videoId,title:'最近同步影片：'+current.title,label:'播放最近同步影片',className:'latest-film-play'});
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
