/* KGEN_META
VERSION: 2.8.0
STATUS: LOCAL_CANDIDATE
PURPOSE: Contextual Player Life profile/home/privacy UI. No cloud, transaction,
GPS request or economic authority. Uses the existing sheet and utility settings.
*/
import {createLocalPlayerStore,HOME_STAGES} from './player-life-runtime.mjs';
import {restoreBackpack} from './backpack-runtime.mjs';
import {createPlayerScopedStorage} from './evm-wallet-runtime.mjs';
const $=s=>document.querySelector(s);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createPlayerLife({lastXYZ}={}){
  const options={verifyWalletSignature:async(message,signature)=>{
    if(!globalThis.ethers){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('../../../assets/ethers-5.7.2.umd.min.js',import.meta.url).href;script.onload=resolve;script.onerror=()=>reject(new Error('SIGNATURE_LIBRARY_UNAVAILABLE'));document.head.append(script)})}
    return (globalThis.ethers.utils||globalThis.ethers).verifyMessage(message,signature);
  }};
  let store=createLocalPlayerStore(options),storageIssue=null;const createdThisBoot=!store.activePlayer();
  try{store.ensurePlayer(lastXYZ?{lastXYZ}:{})}catch(error){storageIssue=error.message;store=createLocalPlayerStore({...options,storage:null});store.ensurePlayer(lastXYZ?{lastXYZ}:{})}
  const original=store;store=Object.freeze({...original,snapshot:()=>({...original.snapshot(),createdThisBoot,...(storageIssue?{status:storageIssue+' / SESSION_ONLY',persistent:false}:{})})});
  globalThis.__K11520_PLAYER_LIFE__=Object.freeze({snapshot:()=>store.snapshot()});
  return store;
}
export function installPlayerLifeUI({store,getXYZ,saveSession,onChange=()=>{},beforePlayerChange=()=>{},navigate,toast=()=>{},wallet,startEncounter=()=>{},claimDaily=()=>{}}){
  let binding=false;
  const act=fn=>async()=>{try{await fn();onChange()}catch(e){toast(String(e?.message||'PLAYER_SAVE_FAILED'));const el=$('#playerLifeMessage');if(el)el.textContent=String(e?.message||'PLAYER_SAVE_FAILED')}};
  function close(){ $('#sheet').classList.remove('open') }
  function render(){
    const state=store.snapshot(),p=state.player;if(!p)return;
    const home=state.home||{},appearance=p.characterAppearance||'WUKONG',game=store.gameplayProfile(),daily=game.daily;
    $('#k11520UiSettings')?.classList.remove('open');$('#dock')?.classList.remove('open');
    if(document.documentElement.classList.contains('k11520UtilitiesOpen'))$('#k11520UtilityMaster')?.click();
    $('#sheetTitle').textContent='Player Life · 玩家與起家地';$('#sheetBody').dataset.simOrgan='';
    $('#sheetBody').innerHTML=`<section id="playerLifePanel" aria-label="Player Life">
      <p id="playerLifeStatus" role="status">${escape(state.status)} · ${state.persistent?'此瀏覽器儲存':'僅本次記憶體，關閉即失去'} · LOCAL CANDIDATE</p>
      <p style="overflow-wrap:anywhere">PLAYER_ID <strong>${escape(p.playerId)}</strong></p>
      <p>先取經，再選擇身分。無需錢包；不詢問真實生日、出生地或 GPS。</p>
      <div class="card"><label>遊戲暱稱（可略過）<input id="playerLifeName" maxlength="32" value="${escape(p.displayName)}"></label>
      <label>外觀色彩<select id="playerLifeAppearance"><option value="WUKONG">悟空 · 金色光環</option><option value="EXPLORER">旅人 · 翡翠光環</option><option value="STARGAZER">觀星者 · 紫星光環</option></select></label>
      <label>遊戲稱謂（可略過）<input id="playerLifePronoun" maxlength="24" value="${escape(p.pronoun||'')}" placeholder="旅人 / 她 / 他 / 自訂"></label>
      <label>遊戲出生世界<select id="playerLifeWorld"><option value="11520">花果山 K11520</option><option value="12345">心世界 K12345</option><option value="16888">宇宙 K16888</option></select></label>
      <p class="muted">出生世界為遊戲背景；本輪在花果山呈現起家地投影，不會瞬移或改變既有 XYZ。建屋後背景固定。</p><button class="btn" id="playerLifeSave">保存角色</button></div>
      <div class="card" id="gameplayProgression"><h3>PLAYER · 成長與解鎖</h3><p id="playerLifeProgress">Lv.${escape(p.level)} · XP ${escape(p.xp)}${game.nextPlayerLevel?' / '+game.nextPlayerLevel.xp:''}</p>
      <p id="ga600Progress">GA600 · ENGINE Lv.${p.engineLevel} · ENGINE XP ${p.engineXp}${game.nextEngineLevel?' / '+game.nextEngineLevel.xp:''}</p>
      <p>GAME TRAINING ONLY · 完整 GA600 引擎未整合。遊戲成長不提高真實槓桿、資本或交易權限。</p>
      <ul id="gameplayUnlocks">${game.unlockTable.map(u=>`<li>${u.unlocked?'✓':'🔒'} ${escape(u.label)} · 玩家 Lv.${u.playerLevel} / 引擎 Lv.${u.engineLevel}</li>`).join('')}</ul>
      <div id="dailyJourney"><h3>今日取經 · ${daily.day} UTC</h3><p>擊倒 ${Math.min(daily.kills,3)}/3 · 六相命中 ${Math.min(daily.sixPhase,1)}/1 · 探索 ${Math.min(daily.distanceMeters,50)}/50 m</p><p>完成：25 XP + 20 ENGINE XP + 星塵（遊戲道具）</p><button class="btn" id="dailyJourneyClaim" ${!daily.ready?'disabled':''}>${daily.claimed?'XP 已領 · 檢查道具交付':'領取今日獎勵'}</button></div>
      <details><summary>遭遇 / 歷史市場訓練</summary><p>遊戲化市場型態，不是歷史績效、預測或投資建議。選擇遭遇將替換目前遊戲怪物，不改市場生命來源或金融帳本。</p>${[['GUARDIAN','取經守關猿',true],['COURIER','KAIOS 運鈔妖',game.unlocks.STRONG_MONSTERS],['MARKET_BOSS','三市場守關 Boss',game.unlocks.BOSS],['TREND_BOSS','趨勢 Boss',game.unlocks.HISTORICAL_TRAINING],['CRASH_BOSS','急跌 Boss',game.unlocks.HISTORICAL_TRAINING],['RANGE_BOSS','盤整 Boss',game.unlocks.HISTORICAL_TRAINING]].map(([id,label,enabled])=>`<button class="btn" data-journey-encounter="${id}" ${enabled?'':'disabled'}>${enabled?'':'🔒 '}${label}</button>`).join('')}</details>
      <p>遊戲進度僅本機候選；不是安全經濟帳本或鏈上 KAIOS。</p><pre id="playerLifeInventory">${escape((globalThis.K11520Backpack?.get?.().items||[]).map(i=>`${i.name} ×${i.qty}`).join('\n')||'背包目前是空的')}</pre><button class="btn" id="playerLifeBag">開啟原有背包</button></div>
      <div class="card"><h3>🏡 起家地</h3><p id="playerLifeHome">${escape(home.homePlotId||home.plotId||p.homePlotId||'尚未分配')} · HOUSE ${escape(home.houseLevel??0)}</p>
      <p>遊戲資料，不是 NFT／土地所有權。空地 → 草屋 → 房屋 → 洞府，後續升級依資料規則。</p>
      <button class="btn" id="playerLifeHomeNav">AI 導航到起家地門前</button><button class="btn" id="playerLifeBuild">建第一間草屋</button><button class="btn" id="playerLifeUpgrade">升級房屋</button></div>
      <details><summary>可選錢包綁定</summary><p>錢包是經濟身分，不是 PLAYER_ID。只簽署本網站的一次身分證明，不發交易、不授權 token。連線地址本身不算綁定。</p>
      <div id="playerLifeWalletLinks">${(p.walletLinks||[]).map(x=>`<p>${escape(x.address)}<button class="btn" data-player-wallet-unlink="${escape(x.address)}">解除本機連結</button></p>`).join('')||'尚未綁定'}</div><button class="btn" id="playerLifeBind">以目前錢包簽署綁定</button></details>
      <details><summary>隱私與現實取經（尚未啟用）</summary><p>本版不讀取位置、感測器或步數，也不保存 GPS 軌跡。未同意仍可完整遊玩。</p><button class="btn" id="playerLifeConsent">撤回現實取經同意</button></details>
      <details><summary>本機玩家 / 備份 / 換裝置</summary><p>同一瀏覽器的本機存檔不是登入或安全帳戶；可接觸此裝置者可讀取資料。正式跨裝置帳戶待雲端身分驗證。備份含角色／進度／起家地／遊戲背包，只能匯入為不可信本機候選；不含錢包綁定或 KGEN／KAIOS 資產。</p>
      <button class="btn" id="playerLifeExport">匯出遊戲備份</button><textarea id="playerLifeImportText" aria-label="遊戲備份 JSON" maxlength="262144" placeholder="貼入自己的遊戲備份（不要貼 private key 或 seed）"></textarea><button class="btn" id="playerLifeImport">確認匯入本機候選</button>
      <label>此裝置本機玩家<select id="playerLifePlayers"></select></label><button class="btn" id="playerLifeSwitch">切換本機玩家並重載</button><button class="btn" id="playerLifeNew">建立另一位本機玩家</button></details>
      <p id="playerLifeMessage" role="status"></p><button class="btn" id="playerLifeContinue">繼續取經</button></section>`;
    $('#playerLifeAppearance').value=appearance;$('#playerLifeWorld').value=p.homeWorld||'11520';$('#playerLifeWorld').disabled=home.houseLevel>0;
    const nextHouse=HOME_STAGES[(home.houseLevel||0)+1];$('#playerLifeBuild').disabled=home.houseLevel>0;$('#playerLifeUpgrade').hidden=!home.houseLevel;$('#playerLifeUpgrade').disabled=!nextHouse||p.level<nextHouse.minPlayerLevel;$('#playerLifeUpgrade').textContent=nextHouse?`升級 ${nextHouse.label} · 需 Lv.${nextHouse.minPlayerLevel}`:'房屋已達本輪最高階';
    const players=store.listPlayers?.()||[p];$('#playerLifePlayers').innerHTML=players.map(v=>`<option value="${escape(v.playerId)}">${escape(v.displayName||'旅人')} · ${escape(v.playerId.slice(-8))}</option>`).join('');$('#playerLifePlayers').value=p.playerId;
    $('#playerLifeSave').onclick=act(()=>{store.updateProfile({displayName:$('#playerLifeName').value||'取經旅人',pronoun:$('#playerLifePronoun').value,characterAppearance:$('#playerLifeAppearance').value,homeWorld:$('#playerLifeWorld').value});render();toast('角色已保存（本機候選）')});
    $('#playerLifeHomeNav').onclick=act(()=>{const h=store.loadHomePlot();close();navigate(h.xyz);toast('導航到起家地門前（距中心 2.2m）；搖桿可隨時停止')});
    $('#playerLifeBuild').onclick=act(()=>{store.buildStarterHouse();render();toast('草屋已建造 · 本機遊戲資料')});
    $('#playerLifeUpgrade').onclick=act(()=>{store.upgradeHouse();render();toast('房屋升級 · 本機遊戲資料，沒有資產轉移')});
    $('#playerLifeConsent').onclick=act(()=>{store.updateProfile({privacyConsent:{location:false,motion:false,analytics:false}});render();toast('同意已撤回；本版不讀位置或感測器')});
    $('#playerLifeExport').onclick=act(()=>{saveSession();$('#playerLifeImportText').value=JSON.stringify({schema:'KAIOS_PLAYER_BACKUP_V1',player:JSON.parse(store.exportPlayer()),backpack:globalThis.K11520Backpack.get()});toast('備份已顯示；可自行保存，勿包含任何秘密')});
    $('#playerLifeImport').onclick=act(()=>{
      if(!confirm('只匯入本機遊戲候選；不恢復錢包、資產或正式身分。確定？'))return;
      const text=$('#playerLifeImportText').value;if(text.length>262144)throw new Error('BACKUP_TOO_LARGE');let bundle;try{bundle=JSON.parse(text)}catch{throw new Error('INVALID_BACKUP')}
      if(bundle?.schema!=='KAIOS_PLAYER_BACKUP_V1'||Object.keys(bundle).some(k=>!['schema','player','backpack'].includes(k)))throw new Error('INVALID_BACKUP');
      const id=bundle.player?.player?.playerId;if(bundle.backpack?.ownerId!==id)throw new Error('INVALID_BACKPACK_OWNER');
      const backpack=restoreBackpack(bundle.backpack,id); // Validate every item before changing either store.
      saveSession();store.importPlayer(JSON.stringify(bundle.player),{confirmLocalCandidate:true});beforePlayerChange();
      try{const target=createPlayerScopedStorage(store.snapshot().persistent?undefined:null,id);target.setItem('11520.backpack.v1',JSON.stringify(backpack));const stage=store.activePlayer().journeyProgress?.tutorialStage;if(stage)target.setItem('k11520.journey.tutorial',JSON.stringify({stage}))}
      catch{render();$('#playerLifeMessage').textContent='IMPORT_INCOMPLETE_STORAGE_FAILURE：角色候選已保存，但背包未成功保存。原備份未變，請保留備份並重新載入；不得視為完整恢復。';return}
      location.reload();
    });
    $('#playerLifeNew').onclick=act(()=>{if(!confirm('建立新本機玩家並重新載入？原玩家存檔保留；本機切換不是安全登入。'))return;saveSession();store.createPlayer({lastXYZ:{x:0,y:0,z:0}});beforePlayerChange();location.reload()});
    $('#playerLifeSwitch').onclick=act(()=>{if(!confirm('切換本機玩家並重新載入？此操作不是安全登入。'))return;saveSession();store.activatePlayer($('#playerLifePlayers').value);beforePlayerChange();location.reload()});
    $('#playerLifeContinue').onclick=close;
    $('#dailyJourneyClaim').onclick=act(()=>{claimDaily();render()});
    for(const b of document.querySelectorAll('[data-journey-encounter]'))b.onclick=act(()=>{startEncounter(b.dataset.journeyEncounter);close()});
    $('#playerLifeBag').onclick=()=>{close();if(!document.documentElement.classList.contains('k11520UtilitiesOpen'))$('#k11520UtilityMaster')?.click();if(!$('#backpackPanel')?.classList.contains('open'))$('#backpackButton')?.click()};
    for(const button of document.querySelectorAll('[data-player-wallet-unlink]'))button.onclick=act(()=>{if(!confirm('只移除此本機角色連結，不撤銷 token allowance、不轉移資產。確定？'))return;store.unlinkWallet(button.dataset.playerWalletUnlink,{confirmLocalOnly:true});render();toast('本機錢包連結已移除；鏈上資產與授權未變')});
    $('#playerLifeBind').onclick=act(async()=>{if(binding)return;binding=true;$('#playerLifeBind').disabled=true;try{
      const session=wallet.snapshot();if(session.status!=='CONNECTED'||!session.account)throw new Error('CONNECT_WALLET_FIRST');
      const provider=wallet.provider||globalThis.ethereum;if(!provider?.request)throw new Error('WALLET_UNAVAILABLE');
      const address=session.account,chainId=session.chainId,challenge=store.beginWalletBinding({address,chainId});
      const bytes=new TextEncoder().encode(challenge.message),hex='0x'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
      const signature=await provider.request({method:'personal_sign',params:[hex,address]});
      const live=wallet.snapshot();if(live.account?.toLowerCase()!==address.toLowerCase()||live.chainId!==chainId)throw new Error('WALLET_CHANGED');
      await store.bindWallet({challenge,signature,address,chainId});render();toast('錢包身分已驗證綁定；未發送交易');
    }finally{binding=false;const b=$('#playerLifeBind');if(b)b.disabled=false}});
    $('#sheet').classList.add('open');$('#sheetBody').scrollTop=0;
  }
  const style=document.createElement('style');style.textContent='#sheet:has(#playerLifePanel){background:#08141efc!important;display:flex;flex-direction:column;overflow:hidden}#sheet:has(#playerLifePanel) .sheetHead{position:relative;flex:0 0 auto;background:#08141e;z-index:3;padding-bottom:10px;gap:8px}#sheet:has(#playerLifePanel) #sheetBody{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain}#sheet:has(#playerLifePanel) #sheetClose{min-width:44px;min-height:44px;flex:0 0 44px}#playerLifePanel{overflow-wrap:anywhere}#playerLifePanel label{display:block;margin:10px 0}#playerLifePanel input,#playerLifePanel select,#playerLifePanel textarea{display:block;box-sizing:border-box;width:100%;min-height:44px;background:#102632;color:#edfcff;border:1px solid #6acbdf;border-radius:8px;padding:8px;font:16px system-ui}#playerLifePanel textarea{min-height:100px}#playerLifePanel .btn,#playerLifePanel summary{min-height:44px;padding:10px;box-sizing:border-box}#playerLifePanel .btn{margin:4px 4px 4px 0}#playerLifePanel pre{white-space:pre-wrap;max-height:160px;overflow:auto}#playerLifePanel details{padding:8px 0;border-bottom:1px solid #68e4ff33}#playerLifePanel p{line-height:1.5}';document.head.append(style);
  function launcher(){const settings=$('#k11520UiSettings');if(!settings||$('#playerLifeOpen'))return;const b=document.createElement('button');b.id='playerLifeOpen';b.className='btn full';b.style.minHeight='44px';b.textContent='🧍 玩家 / 起家地';b.onclick=render;settings.append(b);settings.style.maxHeight='calc(100dvh - 32px)';settings.style.overflowY='auto'}
  launcher();
  // Settings loads independently of the 3D module. Observe this exact owner,
  // not a guessed boot timeout; cold/offline boot must not lose the launcher.
  if(!$('#playerLifeOpen')){const observer=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.id==='k11520UiSettings'||n.querySelector?.('#k11520UiSettings'))))){launcher();if($('#playerLifeOpen'))observer.disconnect()}});observer.observe(document.body,{childList:true,subtree:true})}
  return Object.freeze({open:render});
}
