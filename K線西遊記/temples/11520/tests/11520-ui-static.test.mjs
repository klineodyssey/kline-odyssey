import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {createWorldFeedbackObserver,WORLD_FEEDBACK} from '../runtime/game-ui-product-fixes-v23.mjs';

const here=dirname(fileURLToPath(import.meta.url));
const read=p=>readFileSync(resolve(here,p),'utf8');
const html=read('../game-5d.html');
const main=read('../runtime/game-5d-main.mjs');
const mobileShell=read('../runtime/game-mobile-shell.mjs');
const logistics=read('../runtime/digital-ant-logistics-runtime.mjs');
const walletRuntime=read('../runtime/evm-wallet-runtime.mjs');
test('dodge tries safe alternatives without bypassing midpoint or endpoint collision',()=>{
  const dodge=main.split("$('#dodge').onclick=")[1]?.split('\n')[0]||'';
  assert.ok(dodge.includes('[0,Math.PI/2,-Math.PI/2,Math.PI]'));
  assert.ok(dodge.includes('!resolvePlayerMove(S.xyz,mid).blocked&&!resolvePlayerMove(S.xyz,next).blocked'));
  assert.ok(dodge.includes('閃避受阻'));
});
const fixes=read('../runtime/game-ui-product-fixes.mjs');
const productFixesV23=read('../runtime/game-ui-product-fixes-v23.mjs');
const controls=read('../runtime/game-controls-v251.mjs');
const xyzControl=read('../runtime/joystick-xzxy.mjs');
const xyzAuthority=read('../runtime/xyz-input-authority-runtime.mjs');
const driveLive=read('../runtime/combat-drive-live-runtime.mjs');
const driveAdapter=read('../runtime/combat-drive-adapter.mjs');
const massScale=read('../runtime/combat-mass-scale-runtime.mjs');
const characterStatus=read('../runtime/character-status-runtime.mjs');
const signedC=read('../runtime/mobile-signed-c-immersive-runtime.mjs');
const actionRail=read('../runtime/mobile-action-rail-clearance-runtime.mjs');
const publicMarketQuotes=read('../runtime/public-market-quotes.mjs');
const source=[html,main,fixes,controls,xyzControl,xyzAuthority,driveLive,driveAdapter,massScale,characterStatus].join('\n');

test('new players enter the 5D world in 0C journey mode before trading',()=>{
  assert.match(main,/KX:\{market:'BTCUSDT',side:'多',lots:1,c:0,pos:null\}/);
  assert.match(main,/KY:\{market:'ETHUSDT',side:'多',lots:1,c:0,pos:null\}/);
  assert.match(main,/KZ:\{market:'BNBUSDT',side:'多',lots:1,c:0,pos:null\}/);
  assert.ok(main.includes("mode.mode==='MONSTER_MODE'?'取經 / MONSTER'"));
});

test('entry hook explains the journey-to-trading loop without requiring a wallet',()=>{
  assert.ok(productFixesV23.includes('先取經，再交易。你的市場冒險從 0C 開始。'));
  assert.ok(productFixesV23.includes('走路取經'));
  assert.ok(productFixesV23.includes('斬妖掉寶'));
  assert.ok(productFixesV23.includes('0.001C'));
  assert.ok(productFixesV23.includes('不用連錢包也能先玩'));
  assert.ok(productFixesV23.includes('開始取經'));
});

test('player economy UI separates KGEN settlement from KAIOS loot and exposes engine progression',()=>{
  assert.ok(main.includes('KGEN 跨市場結算'));
  assert.ok(main.includes('KAIOS 掉寶／運鈔獎勵'));
  assert.ok(main.includes('WALLET-BOUND CLAIMABLE'));
  assert.ok(main.includes('多空運算引擎'));
  assert.ok(main.includes("settlementCurrency:'KGEN'"));
  assert.ok(main.includes("authority:'PLAYER_DECIDES_NO_AUTO_ORDER'"));
});

test('market and ATM organs surface cross-market engine and wallet-bound KAIOS custody',()=>{
  assert.ok(main.includes('多空運算引擎 · Lv.'));
  assert.ok(main.includes('CROSS-MARKET SCORE'));
  assert.ok(main.includes('DOMINANT_MARKET'));
  assert.ok(main.includes('DIVERGENCE_SCAN'));
  assert.ok(main.includes('CROSS_MARKET_ALIGNMENT'));
  assert.ok(main.includes('KAIOS 運鈔 ATM'));
  assert.ok(main.includes('正式 KAIOS 發放合約／地址與 Human 轉帳授權完成前'));
});

test('journey monster has an always-visible find-and-attack guide',()=>{
  assert.ok(main.includes('k11520MonsterGuide'));
  assert.ok(main.includes('用左下搖桿靠近'));
  assert.ok(main.includes('靠近再攻擊'));
  assert.ok(main.includes('⚔ 可攻擊'));
  assert.ok(main.includes('KAIOS 戰利品已記帳'));
});

test('entry gesture unlocks BGM and AI customer service has zh-TW voice control',()=>{
  assert.ok(productFixesV23.includes("startBgm();speakAi('歡迎來到花果山"));
  assert.ok(productFixesV23.includes('getKaiosAudio().speak')||productFixesV23.includes('audio.speak(text)'));
  const shared=read('../../../../assets/kaios-audio.mjs');
  assert.ok(shared.includes("lang='zh-TW'"));
  assert.ok(shared.includes('settings.master*settings.voice'));
  assert.ok(productFixesV23.includes('id="aiVoice"'));
  assert.ok(productFixesV23.includes("voice.textContent=aiVoiceOn?'🔊':'🔇'"));
});

test('combat loot and trade events are wired to the shared audio FX engine',()=>{
  assert.ok(productFixesV23.includes('__K11520_AUDIO_FX__'));
  assert.ok(productFixesV23.includes('getKaiosAudio().play(kind)'));
  assert.ok(main.includes("skill==='slash'?'SLASH':'ATTACK'"));
  assert.ok(main.includes("if(r.reason==='WEAK_POINT')emit11520WorldFeedback('WEAK_POINT');else audioFx?.play?.(r.reason==='BLOCKED_RESIST'?'BLOCKED':'HIT')"));
  assert.ok(main.includes("r.loot.rarity+'_LOOT':'COMMON_LOOT'"));
  assert.ok(main.includes("e.status==='LIQUIDATED'?'liquidation'"));
});

test('11520 always exposes a return to the KAIOS world portal',()=>{
  assert.ok(productFixesV23.includes("id='kaiosPortalButton'"));
  assert.ok(productFixesV23.includes("title='回 KAIOS 總世界'"));
  assert.ok(productFixesV23.includes("location.href='../../../'"));
  assert.ok(productFixesV23.includes("addEventListener('pageshow',()=>{b.disabled=false})"));
});

test('live HUD teaches the KX/KY/KZ six-phase combat mapping',()=>{
  assert.ok(main.includes('XZ→KY / XY→KZ / YZ→KX'));
  assert.ok(main.includes('0C 自動取經'));
  assert.ok(main.includes('snapshot.selection?.body'));
});

test('mobile combat uses contextual disclosure instead of a second persistent K-space card',()=>{
  assert.ok(main.includes("targetHud.hidden=true"));
  assert.ok(main.includes("monsterHud.title='點擊查看 K-space 六相戰鬥詳情'"));
  assert.ok(main.includes("monsterHud.addEventListener('click'"));
});

test('V2.9.5 release stamp preserves restored-player encounter boot',()=>{
  assert.ok(fixes.includes('V2.9.5 · 5D K線西遊記'));
  assert.ok(read('../runtime/game-5d-bootstrap.mjs').includes("const PRODUCT_VERSION='V2.9.5'"));
  assert.ok(read('../../../../assets/kaios-world-registry.mjs').includes("version:'V2.9.5'"),'Portal registry must advertise the same K11520 release');
  // Reuse the canonical release guard established by the Courier QA repair;
  // check literal AND escaped active consumers, never historical documents.
  const release=read('../runtime/game-5d-bootstrap.mjs').match(/const PRODUCT_VERSION='([^']+)'/)[1],escaped=release.replaceAll('.',String.raw`\.`);
  for(const path of ['./11520-browser-responsive.mjs','./11520-browser-smoke.mjs']){
    const source=read(path);assert.ok(source.includes(escaped),`${path} exact regex must match canonical release ${release}`);
    for(const version of source.match(/V2(?:\\)?\.9(?:\\)?\.\d+/g)||[])assert.equal(version.replaceAll('\\',''),release,`${path} stale active version ${version}`);
  }
  assert.ok(read('../../../../tests/kaios-portal.test.mjs').includes(`'${release}'`),'Portal unit consumer must match canonical release');
  assert.ok(main.includes('createKSpaceEncounter(world,undefined,S.xyz)'));
});

test('accepted world state produces one feedback per transition, never reload awards',()=>{
  const emitted=[],observe=createWorldFeedbackObserver(e=>emitted.push(e));
  const base={playerId:'A',level:1,engineLevel:1,houseLevel:0,bossAlive:false,encounter:'guardian:0',phase:'KX+'};
  assert.deepEqual(observe(base),[]);
  assert.deepEqual(observe({...base,level:2,engineLevel:2,houseLevel:1}),['PLAYER_LEVEL_UP','ENGINE_LEVEL_UP','HOME_BUILD']);
  const next={...base,level:2,engineLevel:2,houseLevel:2,bossAlive:true,encounter:'guardian:5'};
  assert.deepEqual(observe(next),['HOME_UPGRADE','BOSS_SPAWN']);
  assert.deepEqual(observe(next),[]);
  assert.deepEqual(observe({...next,phase:'KY-'}),['BOSS_PHASE_CHANGE']);
  assert.deepEqual(observe({...next,playerId:'B',level:8,houseLevel:7}),[],'player switching must not invent level-up or home events');
  for(const event of emitted)assert.ok(WORLD_FEEDBACK[event]);
  assert.deepEqual(Object.keys(WORLD_FEEDBACK).sort(),['MONSTER_DETECTED','WEAK_POINT','BOSS_SPAWN','BOSS_PHASE_CHANGE','BOSS_RAGE','BOSS_LOW_HP','BOSS_DEFEAT','COMMON_LOOT','RARE_LOOT','EPIC_LOOT','LEGENDARY_LOOT','PLAYER_LEVEL_UP','ENGINE_LEVEL_UP','GA600_LEVEL_UP','HOME_BUILD','HOME_UPGRADE','PORTAL_OPEN','WORLD_ENTER','QUEST_COMPLETE'].sort());
  assert.ok(main.includes("['RARE','EPIC','LEGENDARY'].includes(r.loot.rarity)"));
  assert.ok(main.includes("if(journey.event('PREVIEW',{c})){emit11520WorldFeedback('QUEST_COMPLETE')"));
});

test('journey teaching reuses contextual HUD and starts audio only from a real gesture',()=>{
  const boot=read('../runtime/game-5d-bootstrap.mjs'),settings=read('../runtime/mobile-ui-settings.mjs');
  assert.ok(boot.includes('if(e?.isTrusted)unlockJourneyAudio()'));
  assert.ok(boot.includes('e.isTrusted&&e.target.closest'));
  assert.ok(!boot.includes('setTimeout(optionalAudio'));
  assert.ok(main.includes("journey.event('HIT')"));assert.ok(main.includes("journey.event('LOOT')"));
  assert.ok(main.includes("journey.event('PREVIEW',{c})"));
  assert.ok(settings.includes('重播取經序章'));
  assert.ok(main.includes('LOCAL_TUTORIAL')||read('../runtime/world-runtime.mjs').includes('LOCAL_TUTORIAL_NO_REWARD'));
});

const organs=['world','trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help'];
const fixed=['three','lookPad','axes','walletPanel','walletToggle','walletConnect','walletRefresh','minimap','joy','knob','yControl','cControl','lotsControl','attack','skill','dodge','flat','orderFire','tradeSword','dock','dockToggle','rail','sheet','sheetClose','confirm','confirmOrder','cancelOrder'];

test('all formal organs remain present in production source',()=>{for(const id of organs)assert.ok(main.includes(`['${id}'`),id)});
test('all current fixed control surfaces exist in shell HTML',()=>{for(const id of fixed)assert.ok(html.includes(`id="${id}"`),id)});
test('core controls have runtime event wiring',()=>{for(const token of ["joy.addEventListener('pointerdown'","$('#lookPad').addEventListener('pointerdown'","$('#attack').onclick","$('#skill').onclick","$('#dodge').onclick","$('#tradeSword').onclick","$('#flat').onclick","$('#orderFire').onclick","$('#dockToggle').onclick","$('#walletConnect').onclick","$('#walletRefresh').onclick","$('#walletToggle').onclick","bindVertical('#lotsControl'","bindVertical('#cControl'"])assert.ok(main.includes(token),token);for(const token of ['function bindDisc()','function bindRail()','__K11520_3D_CONTROL__','railAxis','discAxes'])assert.ok(xyzControl.includes(token),token);assert.equal(main.includes("bindVertical('#yControl'"),false,'remaining-axis rail must not use legacy bounded Y slider wiring')});
test('0C walking remains independent from C control',()=>{assert.equal(source.includes('D.warp===0?0'),false);assert.ok(main.includes('function moveManual()'));assert.ok(main.includes('const speed=.10'))});
test('current dynamic organ actions are wired',()=>{for(const token of ['data-organ','openOrgan(','data-axis','data-market','openOrder()','closePos','setWaypoint','bindMap','PLANE_TRADE_AXIS','syncTradeAxisFromPlane'])assert.ok(main.includes(token),token)});

test('Player Courier exposes explicit local-only Bandit mode, raid action and one-shot loot UI',()=>{
  for(const token of ['playerBanditTarget','playerBanditPanel','BANDIT_MODE','CARGO_RAID_ACTION','banditLootButton','LOCAL GAMEPLAY','LOOT_REPLAY_BLOCKED'])assert.ok(mobileShell.includes(token),`missing Player Courier public bandit wiring: ${token}`);
  assert.ok(mobileShell.includes('distance>8'),'Player Courier robbery must fail visibly outside the local raid distance');
  assert.ok(mobileShell.includes('一般 PvE／PvP 不會偷貨'),'ordinary combat must remain separate from explicit cargo robbery');
  assert.ok(mobileShell.includes('未實作跨裝置 realtime multiplayer'),'local gameplay must not claim a realtime multiplayer backend');
  for(const token of ['TARGET_POSITION_UNVERIFIED','previewLoot','BACKPACK_DELIVERY_EVIDENCE_REQUIRED','confirmInsurancePayout'])assert.ok(logistics.includes(token),`missing fail-closed courier settlement gate: ${token}`);
  for(const token of ['recordCourierInsurancePayout','courierInsuranceReceipts','COURIER_INSURANCE_RECEIPT_CONFLICT'])assert.ok(walletRuntime.includes(token),`missing replay-protected local insurance ledger: ${token}`);
  assert.ok(mobileShell.includes("kind:'TREASURE',treasureClass:'CARGO_CRATE'"),'loot crate must use the existing backpack item model');
  assert.ok(mobileShell.includes('#courierInsuranceClaim{display:block;width:100%;min-height:44px'),'insurance claim must be a mobile-sized touch target');
  assert.equal(mobileShell.includes("['LOOT_CRATE','CLAIMED_BY_BANDIT']"),false,'claimed loot must not remain advertised as an eligible target');
});
test('economy boundaries remain visibly separate',()=>{assert.ok(html.includes('KGEN Local Free'));assert.ok(html.includes('KAIOS'));for(const token of ['requiredMargin','positionRisk','attackKSpace'])assert.ok(main.includes(token),token);assert.equal(main.includes('S.kaios+=r.rewardKaios'),false)});

test('public reference quotes use the browser-safe market-data origin without credentials',()=>{
  assert.ok(main.includes("import {fetchPublicMarketObservations,publicObservationStatus} from './public-market-quotes.mjs'"));
  assert.ok(main.includes('observedAt:r.updatedAt'),'execution must use provider time, never fetch time');
  assert.ok(publicMarketQuotes.includes("origin:'https://data-api.binance.vision'"));
  assert.ok(publicMarketQuotes.includes("credentials:'omit'"));
  assert.equal(main.includes('https://api.binance.com'),false,'CORS-hostile general API origin returned');
  for(const forbidden of ['Authorization','privateKey','sendTransaction','eth_sendTransaction'])assert.equal(publicMarketQuotes.includes(forbidden),false,forbidden);
});

test('human-approved current control imagery is production-wired',()=>{
  assert.ok(controls.includes("const KGEN_GENESIS_DATA='data:image/webp;base64,"),'KGEN Genesis joystick data asset');
  for(const token of ['goddess-ui.webp','kgen-user-ui.webp','ufo-ui.png'])assert.ok(controls.includes(token),token);
  for(const token of ['#knob','#yJoyV250 .yKnob','#lotsThumb','#cThumb'])assert.ok(controls.includes(token),token);
  assert.ok(xyzControl.includes("const HEART='data:image/webp;base64,"),'human-approved YZ heart art must be embedded in formal controller');
  assert.ok(xyzControl.includes("const MODES=['XZ','XY','YZ']"),'three-plane mode cycle');
});

test('XYZ plane control is unbounded intent with collision-constrained body',()=>{
  assert.ok(main.includes('intentXYZ:{x:0,y:0,z:0}'));
  assert.ok(main.includes('unboundedIntent:true'));
  assert.ok(main.includes("blocker={name:'GROUND'}"));
  assert.ok(main.includes('S.intentXYZ={x:S.intentXYZ.x+v.x*speed'));
  assert.ok(xyzControl.includes('unboundedCoordinateIntent:true'));
});

test('C and lot drive bridge is installed by XYZ authority without asset mutation',()=>{
  assert.ok(xyzAuthority.includes("import('./combat-drive-live-runtime.mjs')"),'XYZ authority must install live drive bridge');
  assert.ok(xyzAuthority.includes('applyToLiveControl:true'),'live XYZ intent scaling must be enabled');
  assert.ok(driveLive.includes('rawVectorFromControl'),'drive scaling must rebuild raw XYZ from disc/rail state to avoid compounding');
  assert.ok(driveLive.includes('__K11520_3D_CONTROL__=live'),'scaled control must reach canonical main runtime input');
  assert.ok(driveLive.includes('simulationOnly:true'),'drive bridge must remain simulation-only');
  assert.ok(massScale.includes('kaiosPerKgen: 1000'),'1 KGEN must remain 1000 KAIOS');
  assert.ok(massScale.includes("if (c===0) return 'LOCAL_WALK'"),'0C must remain local walking');
  assert.ok(massScale.includes("if (c===1) return 'LIGHT_SPEED_SPOT'"),'1C must remain light-speed spot');
  for(const forbidden of ['sendTransaction','eth_sendTransaction','privateKey','treasuryTransfer'])assert.equal(driveLive.includes(forbidden),false,forbidden);
});

test('detailed HP and character inspection are read-only and boot-wired',()=>{
  assert.ok(xyzAuthority.includes("import('./character-status-runtime.mjs')"),'character status must load in live boot path');
  for(const token of ['HP ${Math.round(h.current)} / ${h.max}','${h.pct.toFixed(1)}%','角色資料','悟空 · 11520 玩家','KAIOS','XYZ','C 曲速','口數','KX','KY','KZ'])assert.ok(characterStatus.includes(token),token);
  assert.ok(characterStatus.includes('simulationOnly:true'));
  assert.ok(characterStatus.includes("addEventListener('k11520:player-tap'"),'avatar inspection must use the canonical 3D player raycast event');
  assert.ok(characterStatus.includes('worldTapPassthrough:true'),'non-avatar world taps must remain canonical');
  assert.equal(characterStatus.includes('centralAvatar='),false,'hard-coded canvas rectangle must not consume world/entity taps');
  assert.ok(main.includes("emitWorldTapRoute('PLAYER')"),'player raycast route must be explicit');
  assert.ok(main.includes("emitWorldTapRoute('GROUND'"),'ground route must remain explicit');
  for(const forbidden of ['sendTransaction','eth_sendTransaction','privateKey','treasuryTransfer','approve(','transfer('])assert.equal(characterStatus.includes(forbidden),false,forbidden);
});

test('known central interceptor is explicitly retired, not heuristically scanned',()=>{
  assert.ok(controls.includes("#lookPad{display:none!important;pointer-events:none!important}"));
  assert.equal(controls.includes('largeBlank='),false,'heuristic large blank node deletion returned');
  assert.equal(controls.includes('document.body.children'),false,'broad body-child blocker deletion returned');
});

test('one real wallet/backpack organ remains in product-fix layer',()=>{assert.ok(fixes.includes('restoreWalletOrgan'));assert.ok(fixes.includes('placeOnlyRealBag'))});

test('legacy zero-parameter event handlers and observers are removed at source',()=>{
  for(const token of ['installZeroParameterSemantics','pinZeroThumb','zeroSemantics','zeroLots','zeroWarp','zeroObserver',"style.top='64%'"])
    assert.equal(fixes.includes(token),false,`obsolete parameter writer returned: ${token}`);
});

test('temporary compatibility shims are deleted rather than kept as late DOM owners',()=>{
  for(const shim of ['legacy-parameter-zero-retirement.mjs','mobile-lot-numeric-canonical-bridge.mjs'])assert.equal(existsSync(resolve(here,'../runtime',shim)),false,`delete obsolete shim: ${shim}`);
  assert.equal(actionRail.includes('mobile-lot-numeric-canonical-bridge.mjs'),false,'action rail must not load a second lot-input owner');
});

test('game main no longer owns signed C display or thumb rendering',()=>{
  assert.ok(main.includes('__K11520_TRADE_DIRECTION_API__'),'game state must expose one direct canonical side API');
  assert.ok(main.includes('__K11520_SIGNED_C_IMMERSIVE__?.api?.paintSignedC?.(S.axis)'),'native control refresh must delegate signed-C rendering');
  assert.equal(main.includes("$('#cRead').textContent=`${a.c}C`"),false,'unsigned cRead writer returned');
  assert.equal(main.includes("setThumb($('#cThumb')"),false,'unsigned cThumb writer returned');
  assert.ok(main.includes("setTradeSide(S.axis,axis().side==='多'?'空':'多')"),'legacy side button fallback must use canonical side setter');
});

test('signed C runtime owns one positive-lot numeric policy and direct side synchronization',()=>{
  for(const token of ['function normalizeNumericLots','invalidLotPolicy:\'REJECT_AND_KEEP_PREVIOUS\'','__K11520_TRADE_DIRECTION_API__?.getSide','api.setSide(axis,side)','l.type=\'text\''])assert.ok(signedC.includes(token),token);
  for(const token of ['TRADE_ORGAN_NOT_FOUND','SIDE_BUTTON_NOT_FOUND','SIDE_SYNC_FAILED','trade.click()'])assert.equal(signedC.includes(token),false,`async UI-button side sync returned: ${token}`);
});

test('market cards remain information-only and cannot rewrite plane-selected trade authority',()=>{
  assert.equal(signedC.includes('paintSignedC(card.dataset.axis)'),false,'market-card click must not repaint C for the inspected market');
  assert.equal(signedC.includes('syncCanonicalSide(v,card.dataset.axis)'),false,'market-card click must not synchronize direction for the inspected market');
});

test('product help uses signed C and positive lots without obsolete zero-lot hints',()=>{
  for(const token of ['最低 0口','C 最低 0','#cControl::after','#lotsControl::after'])assert.equal(fixes.includes(token),false,token);
  assert.ok(fixes.includes('口數永遠為正'));
  assert.ok(fixes.includes('向上為 +C 多、向下為 -C 空'));
  assert.ok(fixes.includes('最小 1 口'));
});

test('plane switch directly owns trading axis and sword no longer gates orders',()=>{assert.ok(main.includes("const PLANE_TRADE_AXIS=Object.freeze({XZ:'KY',XY:'KZ',YZ:'KX'})"));assert.equal(main.includes('if(!S.tradeArmed)'),false);assert.equal(main.includes('tradeArmed'),false);for(const skill of ['phantomAxe','goldenRain','slash'])assert.ok(main.includes(`performCombat('${skill}')`));assert.ok(main.includes("data-market-card"));assert.ok(main.includes("點市場卡不會改變交易軸"));for(const pair of ["KX:'BTCUSDT'","KY:'ETHUSDT'","KZ:'BNBUSDT'"])assert.ok(main.includes(pair),pair);assert.equal(main.includes('核爆'),false);assert.equal(html.includes('核爆'),false)});

test('combat FX shields translucent HUD surfaces while effects are active',()=>{const fx=readFileSync(new URL('../runtime/combat-fx-runtime.mjs',import.meta.url),'utf8');assert.ok(fx.includes('k11520CombatFxActive'));assert.ok(fx.includes('hudShielded:true'));assert.ok(fx.includes("background:#091119!important"))});

test('landscape More positions chat only when its existing open state is set',()=>{
  const entry=read('../game-5d.html');
  assert.ok(entry.includes('html.k11520UtilitiesOpen #gameChat.open,'));
  assert.ok(!entry.includes('html.k11520UtilitiesOpen #gameChat,'));
});

test('Settings context preserves organ states and restores only its temporary inert ownership',async()=>{
  const {runInNewContext}=await import('node:vm');
  const ui=read('../runtime/mobile-ui-settings.mjs');
  const element=(id,inert=false)=>({id,inert,attributes:{},classList:{values:new Set(),contains(v){return this.values.has(v)},toggle(v,on){if(on)this.values.add(v);else this.values.delete(v)}},hasAttribute(name){return name==='inert'&&this.inert},setAttribute(name,value){this.attributes[name]=value},focus(){focused=this.id}});
  let focused=null;const root=element('root'),panel=element('k11520UiSettings'),launcher=element('gameModeToggle'),close=element('k11520UiSettingsClose'),courier=element('homeDeliveryButton'),rail=element('yControl'),preexisting=element('bgmButton',true);
  courier.dataset={contextState:'active'};const nodes=[launcher,courier,rail,preexisting],byId=Object.fromEntries([panel,launcher,close,...nodes].map(el=>['#'+el.id,el]));
  const context={document:{documentElement:root,querySelector:s=>byId[s]||null,querySelectorAll:()=>nodes,dispatchEvent(){}},CustomEvent:class{constructor(type,{detail}){this.type=type;this.detail=detail}}};
  runInNewContext("const $=s=>document.querySelector(s);"+ui.slice(ui.indexOf('const SETTINGS_BACKGROUND='),ui.indexOf('// Visibility stays'))+'globalThis.openSettings=setSettingsOpen;globalThis.syncSettings=syncSettingsContext;',context);
  context.openSettings(true);assert.equal(focused,'k11520UiSettingsClose');assert.ok(nodes.every(el=>el.inert));assert.equal(root.classList.contains('k11520SettingsOpen'),true);
  // The mission can finish while the dialog is open. Closing must never restore
  // a stale state, toggle More, or make an already-inert organ interactive.
  courier.dataset.contextState='arrived';context.syncSettings();context.openSettings(false);
  assert.equal(courier.dataset.contextState,'arrived');assert.equal(courier.inert,false);assert.equal(rail.inert,false);assert.equal(preexisting.inert,true);assert.equal(launcher.inert,false);assert.equal(focused,'gameModeToggle');assert.equal(root.classList.contains('k11520SettingsOpen'),false);
  context.openSettings(true);context.openSettings(false);assert.equal(preexisting.inert,true);
  assert.ok(ui.includes("e.key==='Escape'"));assert.ok(ui.includes("e.key==='Tab'"));
});

test('the existing Market owner collapses every HUD profile after a real 15-second idle interval',async()=>{
  const {runInNewContext}=await import('node:vm');const ui=read('../runtime/mobile-ui-settings.mjs');let timer=null;
  const row={hidden:false,attributes:{},setAttribute(k,v){this.attributes[k]=v}},root={dataset:{},classList:{toggle(k,v){this[k]=v}}};
  const context={document:{documentElement:root},row,setTimeout:(fn,ms)=>{timer={fn,ms};return 1},clearTimeout:()=>{timer=null}};
  runInNewContext("const $=()=>row;const MARKET_IDLE_MS=15000;let profile='FULL',marketOpen=false,marketTimer=0,marketPointers=new Set(),allOn=true,state={markets:true};"+ui.slice(ui.indexOf('function syncWorldFirst()'),ui.indexOf('function installWorldFirst()'))+"globalThis.openMarket=showMarketCards;globalThis.holdMarket=()=>{marketPointers.add(1);scheduleMarketHide()};globalThis.releaseMarket=()=>{marketPointers.clear();scheduleMarketHide()};",context);
  context.openMarket();assert.equal(row.attributes['aria-expanded'],'true');assert.equal(timer.ms,15000);assert.equal(row.textContent,'⌃');context.holdMarket();assert.equal(timer,null);context.releaseMarket();assert.equal(timer.ms,15000);timer.fn();assert.equal(root.classList.k11520MarketOpen,false);assert.equal(row.attributes['aria-expanded'],'false');assert.equal(row.textContent,'📈');
  const layout=read('../runtime/mobile-control-layout.mjs');assert.ok(layout.includes('html[data-k11520-hud-profile]:not(.k11520MarketOpen) .axes{display:none!important}'));assert.equal(main.includes('KX BTC · KY ETH · KZ BNB ·'),false,'quotes must not recreate the persistent ticker');
});

test('Camera Recenter is context-only and never gains movement or settlement authority',async()=>{
  const {runInNewContext}=await import('node:vm');const context={cameraView:{manual:false,zoom:1,panX:0,panZ:0},cameraReset:{dataset:{}}};
  runInNewContext(main.slice(main.indexOf('function syncCameraResetContext()'),main.indexOf("const cameraStatus=document.createElement"))+'globalThis.sync=syncCameraResetContext;',context);
  context.sync();assert.equal(context.cameraReset.hidden,true);assert.equal(context.cameraReset.inert,true);context.cameraView.manual=true;context.sync();assert.equal(context.cameraReset.hidden,false);assert.equal(context.cameraReset.inert,false);context.cameraView.manual=false;context.sync();assert.equal(context.cameraReset.hidden,true);
  assert.ok(main.includes('cameraView.manual=true;cameraGesture=true;syncCameraResetContext();return;'),'existing pinch owner must reveal Recenter');assert.ok(main.includes('showCameraStatus();syncCameraResetContext()};'),'existing Recenter handler must hide its own control again');
});

test('World context uses existing mission eligibility, not idle or settled history',async()=>{
  const {runInNewContext}=await import('node:vm');const context={};runInNewContext(mobileShell.slice(mobileShell.indexOf('function contextActionWorldVisibility('),mobileShell.indexOf('function style(){'))+'globalThis.visibility=contextActionWorldVisibility;',context);
  const input={target:null,courier:null,digital:null,playerLifeId:'PLAYER-A',playerPosition:{x:0,y:0,z:0},raidDistance:5,now:2000};const visible=patch=>context.visibility({...input,...patch});
  assert.equal(visible({}).raid,false);assert.equal(visible({}).courier,false);
  for(const status of ['ACTIVE','CLOCK_REVIEW'])assert.equal(visible({courier:{status}}).courier,true);
  for(const status of ['DELIVERED','ROBBED','FAILED'])assert.equal(visible({courier:{status}}).courier,false);
  assert.equal(visible({courier:{status:'ROBBED',insurance:{claimStatus:'APPROVED'}}}).courier,true);
  assert.equal(visible({courier:{status:'DELIVERED'},digital:{status:'IN_TRANSIT'}}).courier,false,'keep existing courier-before-digital selection precedence');
  const target={status:'ACTIVE',courierLifeId:'PLAYER-B',dueAt:5000,bandit:{attackWindowStartsAt:1000,lastRaidAt:0,cooldownMs:1000}};
  assert.equal(visible({target}).raid,true);for(const raidDistance of [-1,8.01,NaN,Infinity])assert.equal(visible({target,raidDistance}).raid,false);
  assert.equal(visible({target,playerPosition:{x:0,y:0}}).raid,false);assert.equal(visible({target,now:900}).raid,false);assert.equal(visible({target,now:5000}).raid,false);assert.equal(visible({target:{...target,courierLifeId:'PLAYER-A'}}).raid,false);
  assert.equal(visible({target:{...target,bandit:{...target.bandit,lastRaidAt:1500}}}).raid,false);
  assert.equal(visible({target,digitalInterceptionEligible:true,raidDistance:20}).raid,false,'target-before-digital selection stays canonical');
  assert.equal(visible({digital:{status:'IN_TRANSIT'}}).raid,false,'a flight alone does not pass canonical missile eligibility');assert.equal(visible({digitalInterceptionEligible:true}).raid,true);
  assert.equal(visible({target:{status:'ROBBED',cargo:{ownerState:'LOOT_CRATE',ownerLifeId:'PLAYER-A'}}}).raid,true);
});

test('existing rail owners cancel capture on Settings and require a fresh pointer after close',async()=>{
  const {runInNewContext}=await import('node:vm');
  for(const owner of ['lots','C','Y']){
    let settings=false,commits=[],clears=0;
    const listeners=new Map(),documentListeners=new Map(),captured=new Set();
    const el={dataset:{},classList:{contains:()=>false},closest:()=>el,getBoundingClientRect:()=>({top:0,height:100}),addEventListener(type,fn){const a=listeners.get(type)||[];a.push(fn);listeners.set(type,a)},setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),releasePointerCapture:id=>captured.delete(id)};
    const root={classList:{contains:()=>settings}},doc={documentElement:root,addEventListener(type,fn){const a=documentListeners.get(type)||[];a.push(fn);documentListeners.set(type,a)}};
    const ctx={$:()=>el,ROOT:root,document:doc,el,record:value=>commits.push(value),clear:()=>clears++,signedFromPointer:y=>y,paintSignedC:()=>{},applySignedValue:value=>commits.push(value)};
    if(owner==='lots')runInNewContext(main.slice(main.indexOf('function bindVertical('),main.indexOf("bindVertical('#lotsControl'"))+"bindVertical('#lotsControl',record);",ctx);
    if(owner==='C')runInNewContext('let cPointer=null,internalNative=false;'+signedC.slice(signedC.indexOf('function cancelCInput()'),signedC.indexOf('function onDocumentClick('))+signedC.slice(signedC.indexOf('function bindC()'),signedC.indexOf('function publish()'))+'bindC();',ctx);
    if(owner==='Y')runInNewContext('let railPid=null,rail={active:false,value:0};function railFrom(e){rail={active:true,value:e.clientY};record(e.clientY)}function clearRail(){rail={active:false,value:0};clear()}'+xyzControl.slice(xyzControl.indexOf('function bindRail()'),xyzControl.indexOf('function install(){'))+'bindRail();',ctx);
    const emit=(type,pointerId,clientY=25)=>{const e={type,pointerId,clientY,target:el,preventDefault(){},stopImmediatePropagation(){}};for(const fn of listeners.get(type)||[])fn(e)};
    const context=open=>{settings=open;for(const fn of documentListeners.get('k11520:settings-context')||[])fn({detail:{open}})};
    emit('pointerdown',1);assert.equal(commits.length,1,owner+' fresh down');assert.ok(captured.has(1));
    emit('pointerdown',2);assert.equal(commits.length,1,owner+' second contact must not steal current ownership');assert.equal(captured.has(2),false);
    context(true);assert.equal(captured.size,0,owner+' releases capture on Settings open');const previous=commits.at(-1);
    emit('pointermove',1,80);emit('pointerdown',3,80);assert.equal(commits.length,1,owner+' hidden gestures cannot edit values');
    context(false);emit('pointermove',1,80);emit('pointerup',1,80);assert.equal(commits.length,1,owner+' old input cannot resume after close');assert.equal(commits.at(-1),previous);
    emit('pointerdown',4,40);assert.equal(commits.length,2,owner+' fresh input works after close');emit('lostpointercapture',4);assert.equal(captured.size,0);emit('pointermove',4,90);assert.equal(commits.length,2,owner+' lost capture ends ownership');
    if(owner==='Y')assert.ok(clears>=2,'remaining-axis transient movement is cleared without writing XYZ');
  }
});

test('numeric editors preserve ordinary blur but cannot commit after Settings suppresses geometry',async()=>{
  const {runInNewContext}=await import('node:vm');let settings=false,commits=[],syncs=0;const listeners={};
  const input={dataset:{},value:'12',addEventListener:(type,fn)=>listeners[type]=fn,blur:()=>listeners.blur()};
  const ctx={input,commit:v=>commits.push(v),ROOT:{classList:{contains:()=>settings}},syncNumericEditors:()=>syncs++};
  runInNewContext(signedC.slice(signedC.indexOf('function bindNumericEditor('),signedC.indexOf('function ensureNumericEditors('))+'bindNumericEditor(input,commit);',ctx);
  listeners.blur();assert.deepEqual(commits,['12'],'normal blur-before-open still commits');settings=true;input.value='99';listeners.change();listeners.blur();listeners.keydown({key:'Enter',stopPropagation(){},preventDefault(){}});assert.deepEqual(commits,['12'],'Settings-active change/blur/Enter cannot dispatch into hidden rails');assert.ok(syncs>=2);
  settings=false;input.value='7';listeners.keydown({key:'Enter',stopPropagation(){},preventDefault(){}});assert.deepEqual(commits,['12','7'],'a fresh Enter after close commits normally');
});

test('shared Wallet foreground guard composes with Settings and current hidden preferences',async()=>{
  const {runInNewContext}=await import('node:vm');const layout=read('../runtime/market-origin-wallet-layout-runtime.mjs');
  const flags=new Set(['k11520UtilitiesOpen']),node=id=>({id,textContent:'',title:'',dataset:{},attrs:{},classes:new Set(),classList:{contains(name){return this.owner.classes.has(name)}},style:{values:{},setProperty(k,v){this.values[k]=v},removeProperty(k){delete this.values[k]},getPropertyValue(k){return this.values[k]||''},getPropertyPriority(k){return k in this.values?'important':''}},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]}});
  const ids=['k11520UtilityMaster','cargoInterceptionButton','homeDeliveryButton','dock','gameModeToggle','walletToggle','walletPanel','chatHandle','bgmButton','aiChatButton','backpackButton','k11520HudCollapseAll','kaiosPortalButton'];const nodes=Object.fromEntries(ids.map(id=>{const el=node(id);el.classList.owner=el;return['#'+id,el]}));nodes['#walletPanel'].classes.add('collapsed');nodes['#chatHandle'].classes.add('k11520HiddenBySettings');
  const ctx={$:s=>nodes[s]||null,document:{documentElement:{classList:{contains:k=>flags.has(k)}},querySelectorAll:s=>nodes[s]?[nodes[s]]:[]},settingsOpen:()=>flags.has('k11520SettingsOpen'),installUtilityMaster:()=>nodes['#k11520UtilityMaster'],matchMedia:q=>({matches:q.includes('(max-width:600px)')&&!q.includes('landscape')})};
  runInNewContext('let walletWasOpen=false;'+layout.slice(layout.indexOf('function put('),layout.indexOf('function installStyle()'))+layout.slice(layout.indexOf('function pinMobileUtilityStack()'),layout.indexOf('function closeUtilitySurfaces()'))+layout.slice(layout.indexOf('function syncUtilityMaster()'),layout.indexOf('function walletAnchor()'))+'globalThis.sync=()=>{pinMobileUtilityStack();syncUtilityMaster();pinMobileUtilityStack();syncUtilityMaster()};',ctx);
  ctx.sync();assert.equal(nodes['#chatHandle'].style.values.display,'none');assert.notEqual(nodes['#gameModeToggle'].style.values.display,'none');
  nodes['#cargoInterceptionButton'].dataset.worldContext='true';nodes['#homeDeliveryButton'].dataset.worldContext='true';nodes['#walletPanel'].classes.delete('collapsed');ctx.sync();assert.equal(nodes['#gameModeToggle'].style.values.display,'none');assert.equal(nodes['#dock'].style.values.display,'none');assert.notEqual(nodes['#walletToggle'].style.values.display,'none');for(const id of ['#cargoInterceptionButton','#homeDeliveryButton'])assert.equal(nodes[id].style.values.display,'none','active context peer stays hidden across owner ticks');
  flags.add('k11520HudCollapsed');ctx.sync();assert.notEqual(nodes['#k11520HudCollapseAll'].style.values.display,'none','whole-HUD restore remains available');flags.delete('k11520HudCollapsed');
  flags.add('k11520SettingsOpen');ctx.sync();assert.equal(nodes['#walletToggle'].style.values.display,'none');assert.equal(nodes['#walletPanel'].style.values.display,'none');assert.equal(nodes['#walletPanel'].classes.has('collapsed'),false,'Settings never rewrites Wallet state');
  flags.delete('k11520SettingsOpen');ctx.sync();assert.notEqual(nodes['#walletPanel'].style.values.display,'none');assert.equal(nodes['#gameModeToggle'].style.values.display,'none','Wallet remains the foreground owner after Settings closes');
  nodes['#walletPanel'].classes.add('collapsed');ctx.sync();assert.notEqual(nodes['#gameModeToggle'].style.values.display,'none');assert.equal(nodes['#chatHandle'].style.values.display,'none','Wallet close does not override a hidden chat preference');
  flags.delete('k11520UtilitiesOpen');for(const eligible of [true,false,true]){for(const id of ['#cargoInterceptionButton','#homeDeliveryButton'])nodes[id].dataset.worldContext=String(eligible);ctx.sync();for(const id of ['#cargoInterceptionButton','#homeDeliveryButton'])assert.equal(nodes[id].style.values.display,eligible?'grid':'none','closed tray uses current eligibility after Wallet close')}
});

test('browser control inspection preserves per-control hit checks with one bounded frame settle',async()=>{
  const {runInNewContext}=await import('node:vm'),browserSource=read('./11520-browser-responsive.mjs');
  const source=browserSource.slice(browserSource.indexOf('async function verifyScrolledControlCenters('),browserSource.indexOf('async function verifySettingsContext('));
  async function inspect({hidden=false,wallet=false,blocked=false,unstable=false,stalled=false}={}){
    let current=null,clock=0,frames=0;const scrolled=[];
    const nodes=Array.from({length:15},(_,i)=>({id:'control-'+i,dataset:{},isConnected:true,hidden:hidden&&i===4,getBoundingClientRect(){return{x:10+(unstable&&i===7?clock:0),y:20+i,width:this.hidden?0:44,height:this.hidden?0:44}},scrollIntoView(options){assert.equal(options.behavior,'instant');scrolled.push(this.id);current=this},contains(hit){return hit===this}}));
    const context={assert,performance:{now:()=>clock},document:{elementFromPoint:(x,y)=>{const r=current.getBoundingClientRect();assert.equal(x,r.x+r.width/2);assert.equal(y,r.y+r.height/2);return blocked&&current===nodes[7]?{id:'overlay'}:current}},getComputedStyle:el=>({display:el.hidden?'none':'block',visibility:'visible'}),setTimeout:stalled?(fn)=>{queueMicrotask(fn);return 1}:setTimeout,clearTimeout:stalled?()=>{}:clearTimeout,requestAnimationFrame:fn=>{frames++;clock+=16;if(!stalled)queueMicrotask(fn)}};
    runInNewContext(source+'globalThis.verify=verifyScrolledControlCenters;',context);
    const run=context.verify({locator:selector=>({evaluateAll:fn=>fn(nodes.filter(el=>!selector.includes(':visible')||!el.hidden))})},wallet?'controls:visible':'controls',wallet?'Wallet':'Settings');
    if(blocked)await assert.rejects(run,/owns its actual center.*control-7/);
    else if(hidden&&!wallet)await assert.rejects(run,/control is visible.*control-4/);
    else if(unstable)await assert.rejects(run,/stable geometry/);
    else if(stalled)await assert.rejects(run,/animation frame stalled/);
    else await run;
    return{scrolled,frames};
  }
  const all=await inspect();assert.equal(all.scrolled.length,15);assert.equal(all.frames,3,'one dialog settle, never three animation frames per control');
  const wallet=await inspect({hidden:true,wallet:true});assert.equal(wallet.scrolled.length,14);assert.equal(wallet.frames,3);
  await inspect({hidden:true});await inspect({blocked:true});await inspect({unstable:true});await inspect({stalled:true});
  assert.match(browserSource,/for\(const \[cycle,closeWith\] of \['button','Escape','button'\]\.entries\(\)\)/,'all three original native close cycles remain');
  assert.match(browserSource,/if\(cycle===2\)await page\.screenshot/,'retain the final screenshot without overwriting an earlier identical-path capture');
});

test('tiny landscape Market reserves its own lane and browser regression rejects covered balance text',async()=>{
  const {runInNewContext}=await import('node:vm'),layout=read('../runtime/mobile-control-layout.mjs'),browserSource=read('./11520-browser-responsive.mjs');
  assert.match(layout,/html\[data-k11520-hud-profile\] \.top\{right:calc\(max\(6px, env\(safe-area-inset-right\)\) \+ 52px\)!important\}/);
  assert.match(layout,/#k11520MarketRow\{top:6px;left:auto;right:max\(6px, env\(safe-area-inset-right\)\);width:44px;min-height:44px\}/);
  const source=browserSource.slice(browserSource.indexOf('async function verifyMarketHeaderSeparation('),browserSource.indexOf('async function verifySettingsInterruptedRails('));
  async function inspect({covered=false,clipped=false,blocked=false}={}){
    const node=(text,x,y,width,height)=>({textContent:text,getBoundingClientRect(){return{x,y,width,height,right:x+width,bottom:y+height}}});
    const edge=node('Market',794,6,44,44);edge.contains=hit=>hit===edge;
    const balances={};for(const [id,x] of [['topFree',612],['topKaios',covered?764:696]]){const pill=node('',x,10,covered&&id==='topKaios'?72:84,38),label=node('LOCAL',x+6,14,clipped&&id==='topKaios'?100:52,8),value=node('100',x+16,25,30,16);pill.querySelector=()=>label;value.closest=()=>pill;balances[id]=value}
    const context={assert,innerWidth:844,innerHeight:390,document:{querySelector:()=>edge,getElementById:id=>balances[id],elementFromPoint:()=>blocked?{}:edge}};runInNewContext(source+'globalThis.verify=verifyMarketHeaderSeparation;',context);
    const report={},run=context.verify({evaluate:fn=>fn()},report,'full-idle-hidden');
    if(covered)await assert.rejects(run,/must not cover balance label\/value/);
    else if(clipped)await assert.rejects(run,/fits its own pill/);
    else if(blocked)await assert.rejects(run,/actual pointer ownership/);
    else{await run;assert.equal(report.marketHeaderSeparation['full-idle-hidden'].balances.length,2)}
  }
  await inspect();await inspect({covered:true});await inspect({clipped:true});await inspect({blocked:true});
  for(const state of ['full-explicit-collapse','full-expanded','full-idle-hidden'])assert.ok(browserSource.includes("verifyMarketHeaderSeparation(page,report,'"+state+"')"));
});
