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
  for(const token of ['whiteholeEscortButton','KAIOS-CARGO-WHITEHOLE-ESCORT-001','50,000 KAIOS','10 KGEN','SIMULATION_ONLY','formal worker ACK = false','kgen-margin-runtime.mjs'])assert.ok(mobileShell.includes(token),`missing white-hole escort disclosure or entry: ${token}`);
  for(const token of ['createWhiteholeEscortDemoOffer','reviewWhiteholeEscortDemoOffer','startWhiteholeEscort','advanceWhiteholeEscort','acceptWhiteholeEscortDestination','REVIEW_GATED_SIMULATED_RECEIVABLE','SUPPLY_MASS_RULE_NOT_MARKET_PRICE'])assert.ok(logistics.includes(token),`missing white-hole escort runtime gate: ${token}`);
  assert.equal(mobileShell.includes('spendLocalKaios?.(10'),false,'10 KGEN receivable must never become an automatic local KAIOS payment');
  assert.equal(mobileShell.includes("['LOOT_CRATE','CLAIMED_BY_BANDIT']"),false,'claimed loot must not remain advertised as an eligible target');
  assert.equal((mobileShell.match(/m\.mode!=='WHITEHOLE_ESCORT_DEMO'/g)||[]).length,2,'generic active and robbed bandit selectors must exclude the specialized white-hole escort');
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
  let focused=null;const root=element('root'),panel=element('k11520UiSettings'),launcher=element('gameModeToggle'),close=element('k11520UiSettingsClose'),courier=element('homeDeliveryButton'),whitehole=element('whiteholeEscortButton'),rail=element('yControl'),preexisting=element('bgmButton',true);
  courier.dataset={contextState:'active'};const nodes=[launcher,courier,whitehole,rail,preexisting],byId=Object.fromEntries([panel,launcher,close,...nodes].map(el=>['#'+el.id,el]));
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

test('wrapped Wallet help links require ownership of every rendered fragment without accepting paragraph whitespace',async()=>{
  const {runInNewContext}=await import('node:vm'),browserSource=read('./11520-browser-responsive.mjs');
  const source=browserSource.slice(browserSource.indexOf('async function verifyScrolledControlCenters('),browserSource.indexOf('async function verifySettingsContext('));
  async function inspect(blockedFragment=-1,blockedOwner='overlay'){
    let now=0;const probes=[],fragments=[{x:200,y:10,width:60,height:16},{x:20,y:26,width:40,height:16}],paragraph={id:'walletProviderHelp'},overlay={id:'overlay'};
    const anchor={id:'help',tagName:'A',dataset:{},isConnected:true,scrollIntoView(options){assert.equal(options.behavior,'instant')},getBoundingClientRect:()=>({x:20,y:10,width:240,height:32}),getClientRects:()=>[...fragments,{x:20,y:10,width:0,height:0}],contains:el=>el===anchor};
    const context={assert,performance:{now:()=>now},getComputedStyle:()=>({visibility:'visible'}),document:{elementFromPoint(x,y){probes.push([x,y]);const index=fragments.findIndex(r=>x===r.x+r.width/2&&y===r.y+r.height/2);return index<0?paragraph:index===blockedFragment?(blockedOwner==='paragraph'?paragraph:overlay):anchor}},setTimeout,clearTimeout,requestAnimationFrame:fn=>{now+=16;queueMicrotask(fn)}};
    runInNewContext(source+'globalThis.verify=verifyScrolledControlCenters;',context);
    const run=context.verify({locator:()=>({evaluateAll:fn=>fn([anchor])})},'a:visible','Wallet');
    if(blockedFragment>=0)await assert.rejects(run,/owns its actual center/);else await run;
    assert.deepEqual(probes,[[140,26],[230,18],[40,34]],'inspect union only for diagnostics, then each real fragment; no parent acceptance or occluded-fragment skip');
  }
  await inspect();await inspect(0);await inspect(1);await inspect(0,'paragraph');await inspect(1,'paragraph');
});

test('signed-C quote fixture is loopback-only and separates SIMULATION WAIT preview from public LIVE and 100C no-chain guards',async()=>{
  const {runInNewContext}=await import('node:vm'),source=read('./11520-browser-signed-c-immersive.mjs');
  const config=source.slice(source.indexOf('const BASE='),source.indexOf('await fs.mkdir'));
  const payload=source.slice(source.indexOf('function freeQuotePayload('),source.indexOf("import fs from 'node:fs/promises'"));
  for(const [base,expected] of [[undefined,true],['http://127.0.0.1:4173',true],['http://localhost:4173',true],['https://klineodyssey.github.io/kline-odyssey',false],['https://example.com',false]]){
    const context={URL,Date:{now:()=>40000},process:{env:base?{K11520_BASE_URL:base}:{}}};
    runInNewContext(config+payload+'globalThis.result={local:LOCAL_SIMULATION_QA,rows:quoteFixtureRows,ready:quoteFixtureReady};globalThis.payload=freeQuotePayload;',context);
    assert.equal(context.result.local,expected);assert.equal(context.result.ready,false,'start with WAIT rather than masking quote rejection');
    const route={request:()=>({url:()=> 'https://data-api.binance.vision/api/v3/aggTrades?symbol=ETHUSDT'})};
    assert.equal(context.payload(route,[]).length,0);const row=context.payload(route,context.result.rows)[0];assert.equal(row.p,'3500');assert.equal(row.T,40000);assert.equal(row.a,40000);
  }
  assert.ok(source.includes("if(LOCAL_SIMULATION_QA)await page.route('https://data-api.binance.vision/api/v3/aggTrades*'"));
  assert.ok(source.includes("status==='WAIT'"));assert.ok(source.includes("K11520_DETERMINISTIC_SIMULATION"));assert.ok(source.includes("simulationMode,'SIMULATION_WALLET'"));assert.ok(source.includes("status==='LIVE'"));
  assert.ok(source.includes("if(LOCAL_SIMULATION_QA)await page.waitForFunction(()=>globalThis.__K11520_MARKET_K__?.status==='LIVE',null,{timeout:5000})"),'final fixture readiness is local-only');
  for(const guard of ['V1_HIGH_SPEED_PRODUCTION_LOCKED',"'#confirmOrder').isDisabled(),true",'PENDING 模擬委託；下一筆有效價格觸及／穿越才成交，不送鏈'])assert.ok(source.includes(guard),guard);
  assert.ok(source.includes("page.locator('#confirm').waitFor({state:'visible',timeout:2500})"),'confirmation timeout remains unchanged');
});

test('signed-C WAIT preview checks source, public status, no debit and native cancellation',()=>{
  const source=read('./11520-browser-signed-c-immersive.mjs');
  const block=source.slice(source.indexOf('if(LOCAL_SIMULATION_QA){'),source.indexOf('// Human 12:43'));
  for(const guard of ["'#cNumericInput').fill('1')", "'#orderFire').click", "'#confirmOrder').isDisabled(),false", 'K11520_DETERMINISTIC_SIMULATION', "snapshot().wallet),before", "'#cancelOrder').click()", "waitPreviewAllowed:true"])assert.ok(block.includes(guard),guard);
  assert.ok(block.indexOf("'#cancelOrder').click()")<block.indexOf('quoteFixtureReady=true'));
  assert.doesNotMatch(block,/waitRejected:true|__SIGNED_C_WAIT_EVIDENCE__/);
});

test('responsive event routing retains standalone mobile-HUD coverage and references only its required exact-tree Game owner',async()=>{
  const {mkdtempSync,mkdirSync,rmSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{spawnSync}=await import('node:child_process');
  const responsive=read('../../../../.github/workflows/11520-responsive-qa.yml'),game=read('../../../../.github/workflows/11520-game-product-qa.yml');
  const paths=(source,event)=>source.split('  '+event+':\n')[1].split(/\n  [a-z_]+:/)[0].split('\n').map(line=>line.match(/^      - ['"](.+)['"]$/)?.[1]).filter(Boolean);
  for(const event of ['pull_request','push'])for(const path of paths(responsive,event))assert.ok(paths(game,event).includes(path),event+' Game owner must trigger for '+path);
  assert.ok(game.includes('timeout --signal=TERM --kill-after=10s 90s node "K線西遊記/temples/11520/tests/11520-browser-mobile-hud.mjs"'));
  assert.ok(game.includes('RC=${PIPESTATUS[0]}'));assert.ok(game.includes('mobile HUD three-rail/collapse screenshots missing'));
  const start=responsive.indexOf('          if [ "$PUBLIC_QA" != true ]; then'),end=responsive.indexOf('      - name: Preserve screenshots and focused failure logs',start);
  const script=responsive.slice(start,end).replace(/^          /gm,'');
  for(const [event,production,reference,mobile] of [['pull_request','false',true,false],['push','false',true,false],['workflow_dispatch','false',false,true],['workflow_dispatch','true',false,false],['workflow_run','true',false,false]]){
    const directory=mkdtempSync(resolve(tmpdir(),'k11520-hud-routing-'));try{
      mkdirSync(resolve(directory,'artifacts/11520-responsive-qa'),{recursive:true});const trace=resolve(directory,'trace');
      const mocked='set -euo pipefail\ntimeout(){ printf "%s\\n" "$*" >> "$TRACE"; }\npython3(){ printf "REFERENCE\\n" >> "$TRACE"; cat >/dev/null; }\n';
      const result=spawnSync('bash',['-c',mocked+script],{cwd:directory,env:{PATH:process.env.PATH,TRACE:trace,GITHUB_EVENT_NAME:event,PUBLIC_QA:production},encoding:'utf8'});
      assert.equal(result.status,0,result.stderr);const observed=existsSync(trace)?readFileSync(trace,'utf8'):'';
      assert.equal(observed.includes('REFERENCE'),reference,event+'/'+production+' ownership reference');assert.equal(observed.includes('11520-browser-mobile-hud.mjs'),mobile,event+'/'+production+' local mobile-HUD execution');assert.equal(observed.includes('11520-browser-character-status.mjs'),production==='false','character coverage remains unchanged');
    }finally{rmSync(directory,{recursive:true,force:true})}
  }
  for(const field of ["'head':head","'tree':subprocess.check_output", "'scriptSha256':hashlib.sha256", "'requiredWorkflow':'11520 Game Product QA'", "'requiredJob':'product-qa'", "'requiredConclusion':'success'", "'evidenceIsReferenceOnly':True",'11520-mobile-hud-3rail.png','11520-mobile-hud-collapsed.png'])assert.ok(script.includes(field),field);
  assert.ok(script.includes("assert head==os.environ['K11520_SOURCE_SHA']"));
});

// Read the actual job gates so routing tests fail when workflow expressions drift.
const responsiveWorkflow=read('../../../../.github/workflows/11520-responsive-qa.yml');
const responsiveJobs=Object.fromEntries([...responsiveWorkflow.matchAll(/^  ([\w-]+):\n([\s\S]*?)(?=^  [\w-]+:|$(?![\s\S]))/gm)]
  .filter(match=>match.index>responsiveWorkflow.indexOf('\njobs:\n'))
  .map(([,name,body])=>[name,{
    needs:(body.match(/^    needs: (.+)$/m)?.[1]||'').replace(/[\[\]]/g,'').split(',').map(value=>value.trim()).filter(Boolean),
    condition:body.match(/^    if: (.+)$/m)?.[1].replace(/^\$\{\{\s*|\s*\}\}$/g,''),
    timeoutMinutes:Number(body.match(/^    timeout-minutes: (\d+)$/m)?.[1]||0)
  }]));

test('responsive QA serializes heavy jobs without cancelling or hiding failed coverage',()=>{
  assert.deepEqual(responsiveJobs['contextual-hud'].needs,[]);
  assert.deepEqual(responsiveJobs['world-first'].needs,['contextual-hud']);
  assert.deepEqual(responsiveJobs.responsive.needs,['contextual-hud','world-first']);
  assert.equal(responsiveJobs.responsive.timeoutMinutes,20,'real-entry QA keeps bounded headroom for browser installation plus the full layout matrix');
  assert.deepEqual(responsiveJobs['m1-public-readonly'].needs,['responsive']);
  for(const name of ['world-first','responsive','m1-public-readonly'])assert.match(responsiveJobs[name].condition,/!cancelled\(\)/,name+' overrides implicit ancestor success but respects cancellation');
  assert.match(responsiveJobs['m1-public-readonly'].condition,/needs\.responsive\.result == 'success'/);
  assert.doesNotMatch(responsiveWorkflow,/continue-on-error:/);
});

test('responsive DAG preserves event, failed ancestor, intentional skip and cancellation routing',async()=>{
  const {runInNewContext}=await import('node:vm');
  const order=['contextual-hud','world-first','responsive','m1-public-readonly'];
  const routes=[
    ['pull_request',false,'success',[true,true,true,false]],
    ['push',false,'success',[true,true,true,false]],
    ['workflow_dispatch',false,'success',[true,true,true,false]],
    ['workflow_dispatch',true,'success',[true,false,true,true]],
    ['workflow_run',false,'success',[true,false,true,true]],
    ['workflow_run',false,'failure',[false,false,false,false]],
    ['workflow_run',false,'cancelled',[false,false,false,false]],
    ['workflow_run',false,'skipped',[false,false,false,false]]
  ];
  for(const [event,production,conclusion,expected] of routes){
    for(const contextualResult of ['success','failure'])for(const worldResult of ['success','failure'])for(const responsiveResult of ['success','failure']){
      const needs={},observed=[];
      const github={event_name:event,event:{workflow_run:{conclusion}},head_ref:''};
      for(const [index,name] of order.entries()){
        const job=responsiveJobs[name];
        const enabled=runInNewContext(job.condition,{github,inputs:{production},needs,cancelled:()=>false});
        // A gate without a status function also has GitHub's implicit success().
        const implicitSuccess=/\b(?:always|cancelled|success|failure)\(/.test(job.condition)||job.needs.every(parent=>needs[parent].result==='success');
        observed.push(Boolean(enabled&&implicitSuccess));
        needs[name]={result:observed[index]?([contextualResult,worldResult,responsiveResult,'success'][index]):'skipped'};
      }
      const wanted=[...expected];wanted[3]&&=responsiveResult==='success';
      assert.deepEqual(observed,wanted,JSON.stringify({event,production,conclusion,contextualResult,worldResult,responsiveResult}));
      // A cancelled workflow must never start any dependent browser runner.
      for(const name of order.slice(1))assert.equal(runInNewContext(responsiveJobs[name].condition,{github,inputs:{production},needs,cancelled:()=>true}),false,name+' cancelled');
    }
  }
});

test('one open-PR push stays within four heavy runners including bounded diagnostics',()=>{
  // Enumerate all antichains: jobs in one chain cannot be simultaneously running,
  // regardless of duration, failed predecessors or intentionally skipped jobs.
  const names=Object.keys(responsiveJobs);
  const depends=(name,parent)=>responsiveJobs[name].needs.some(dependency=>dependency===parent||depends(dependency,parent));
  let width=0;
  for(let mask=0;mask<(1<<names.length);mask++){
    const parallel=names.filter((_,index)=>mask&(1<<index));
    if(parallel.every(a=>parallel.every(b=>a===b||!depends(a,b))))width=Math.max(width,parallel.length);
  }
  assert.equal(width,2,'serialized QA plus optional public-input-diagnostics');
  assert.equal(width+2,4,'push Game + PR Game + Responsive antichain');
  assert.equal(names.filter(name=>name!=='public-input-diagnostics').length,4,'all existing primary jobs retained');
});

test('contextual entry tolerates only a completed intro transition and still requires character readiness',async()=>{
  const {runInNewContext}=await import('node:vm'),browserSource=read('./11520-browser-responsive.mjs');
  const contextual=browserSource.slice(browserSource.indexOf('async function verifyContextualHud(){'));
  const entry=contextual.slice(contextual.indexOf("if(await page.locator('#enter11520')"),contextual.indexOf("      assert.equal(await page.locator('#axes')"));
  assert.ok(entry.includes("await page.waitForFunction(()=>/READY|FALLBACK/.test"),'runtime readiness remains mandatory after intro dismissal');
  for(const scenario of [
    {name:'native click',button:true,dismiss:true},
    {name:'already entered',button:false},
    {name:'removed during click',button:true,dismiss:true,clickError:true},
    {name:'click blocked while intro remains',button:true,clickError:true,expected:'native click failed'},
    {name:'click returned but intro remains',button:true,expected:'intro still visible'},
    {name:'button missing but intro remains',button:false,intro:true,expected:'intro still visible'},
    {name:'dismissed but character unready',button:true,dismiss:true,ready:false,expected:'character not ready'},
  ]){
    let intro=scenario.intro??scenario.button,clicks=0,hiddenChecks=0,readinessChecks=0;
    const context={document:{querySelector:()=>({textContent:scenario.ready===false?'LOADING':'READY'})},page:{
      locator(selector){
        if(selector==='#enter11520')return{isVisible:async()=>scenario.button,click:async options=>{clicks++;assert.equal(options.timeout,1500);assert.equal('force' in options,false);if(scenario.dismiss)intro=false;if(scenario.clickError)throw new Error('native click failed')}};
        assert.equal(selector,'#intro11520');return{isVisible:async()=>intro,waitFor:async options=>{hiddenChecks++;assert.equal(options.state,'hidden');if(intro)throw new Error('intro still visible')}};
      },
      waitForFunction:async fn=>{readinessChecks++;if(!fn())throw new Error('character not ready')},
    }};
    const run=runInNewContext('(async()=>{'+entry+'})()',context);
    if(scenario.expected)await assert.rejects(run,new RegExp(scenario.expected),scenario.name);else{await run;assert.equal(hiddenChecks,1);assert.equal(readinessChecks,1)}
    assert.equal(clicks,Number(scenario.button),scenario.name+' keeps the ordinary native-click path');
  }
});

test('world-first minimap waits for dismissal and requires native owned pointer delivery',async()=>{
  const {runInNewContext}=await import('node:vm');
  const source=read('./11520-browser-responsive.mjs');
  const context={assert};
  runInNewContext(source.slice(source.indexOf('async function clickWorldFirstMinimap('),source.indexOf('async function verifyWorldFirst('))+'globalThis.clickMap=clickWorldFirstMinimap;',context);
  async function run({blocked=false,wrongTarget=false,untrusted=false,missingUp=false,wrongPlane=false,diagnosticsFail=false}={}){
    const order=[],result={};let evaluations=0;
    const clickError=new Error('native actionability blocked');
    const page={locator(selector){return selector==='#sheet'?{async waitFor(options){assert.equal(options.state,'hidden');order.push('hidden')}}:{async getAttribute(){return 'XYZ'},async boundingBox(){return {x:1,y:2,width:200,height:100}},async click(options){order.push('click');assert.equal(options.force,undefined);assert.equal(options.position.x,170);assert.equal(options.position.y,80);if(blocked)throw clickError}}},async evaluate(){evaluations++;if(evaluations===1)return wrongPlane?'XY':'XZ';if(evaluations===2){order.push('reset');return}if(diagnosticsFail)throw Error('diagnostic unavailable');return {plane:'XZ',coordinateSpace:'XYZ',events:[{type:'pointerdown',id:7,target:wrongTarget?'sheet':'minimap',isTrusted:!untrusted},...(missingUp?[]:[{type:'pointerup',id:7,target:'minimap',isTrusted:true}])]}}};
    try{await context.clickMap(page,result)}catch(error){return {error,clickError,order,result}}
    return {order,result};
  }
  const good=await run();assert.equal(good.error,undefined);assert.deepEqual(good.order,['hidden','reset','click']);
  for(const option of ['wrongTarget','untrusted','missingUp','wrongPlane'])assert.ok((await run({[option]:true})).error,option+' must fail closed');
  const blocked=await run({blocked:true,diagnosticsFail:true});assert.equal(blocked.error,blocked.clickError,'diagnostics cannot mask native input failure');
  assert.match(source,/await clickWorldFirstMinimap\(page,result\);\s*await page.locator\('#waypointAction'\).waitFor\(\{state:'visible'\}\)/);
});

test('FULL HUD readiness diagnostics observe existing queries without extra hit tests or relaxed thresholds',async()=>{
 const {runInNewContext}=await import('node:vm'),source=read('./11520-browser-responsive.mjs');
 const begin=source.indexOf("const canvas=document.querySelector('#three'),r=canvas.getBoundingClientRect(),began=performance.now(),history=[];"),end=source.indexOf('  });\n  report.fullHudPanPrecondition',begin);
 assert.ok(begin>0&&end>begin);const body=source.slice(begin,end);
 async function inspect(kind){
  let now=0,domReads=0,canPanReads=0,afterDeadlineReads=0;const canvas={getBoundingClientRect:()=>({left:0,top:0,right:140,bottom:240})},hud={id:'fixture-HUD'};
  const context={performance:{now:()=>now},innerWidth:140,innerHeight:240,requestAnimationFrame:fn=>{now+=50;fn(now)},document:{querySelector:()=>canvas,elementFromPoint:()=>{domReads++;if(now>=2000)afterDeadlineReads++;return kind==='DOM'?hud:canvas}},__K11520_CAMERA__:{canPanAt:()=>{canPanReads++;if(now>=2000)afterDeadlineReads++;return kind!=='SCENE'}},__K11520_WORLD_SELECTION_PROJECTION__:{journeyLifeSnapshot:()=>[],playerHomeSnapshot:()=>({})}};
  const result=await runInNewContext('(async()=>{'+body+'})()',context);return {result,domReads,canPanReads,afterDeadlineReads};
 }
 const pass=await inspect('CLEAR');assert.ok(pass.result.point);assert.equal(pass.result.radius,30);assert.equal(pass.result.stableMs,150);assert.equal(pass.canPanReads,49*4,'all49 scene predicates remain checked each stability sample');
 for(const kind of ['DOM','SCENE']){
  const x=await inspect(kind),d=x.result.diagnostics;assert.equal(x.result.point,null);assert.equal(x.result.elapsedMs,2000);assert.equal(x.afterDeadlineReads,0,'diagnostics never probe after deadline');
  assert.equal(d.domReads,x.domReads);assert.equal(d.canPanReads,x.canPanReads);assert.equal(d.frames.length,16);assert.ok(d.droppedFrames>0);assert.ok(d.centers>0&&d.rows>0);
  if(kind==='DOM'){assert.equal(x.canPanReads,0);assert.equal(d.firstDomBlock.owner,'fixture-HUD');assert.ok(d.domRejects>0)}else{assert.equal(d.firstDomBlock,null);assert.ok(d.firstCanPanBlock);assert.ok(d.canPanRejects>0)}
 }
 assert.match(body,/performance\.now\(\)-since>=150&&performance\.now\(\)-began<2000/);
});

test('shared order confirmation keeps actions outside its scrolling body in portrait, landscape and reduced visual viewport',()=>{
  const shared=html.split('/* Shared order-confirmation viewport:')[1]?.split('.confirm input{')[0]||'';
  assert.ok(shared,'the existing confirmation needs one orientation-independent layout owner');
  assert.doesNotMatch(shared,/@media|position:\s*(?:absolute|sticky)/,'no orientation-only or overlaid replacement action row');
  assert.match(shared,/#confirm\.open\{[^}]*display:flex;flex-direction:column;overflow:hidden/);
  assert.match(shared,/var\(--k11520-visible-vh,100dvh\)/,'use existing VisualViewport height owner for keyboard resize');
  assert.match(shared,/top:max\(8px,env\(safe-area-inset-top\)\)!important;bottom:auto!important/);
  assert.match(shared,/#confirm #confirmBody\{min-height:0;overflow:auto;flex:1 1 auto;overscroll-behavior:contain/);
  assert.match(shared,/#confirm>\.sheetHead,#confirm>\.grid2\{flex:0 0 auto/,'header and both actions must not shrink with overflowing content');
  assert.match(shared,/#confirm \.btn,#confirm \.close\{min-height:44px/);
  assert.match(html,/<div id="confirmBody"><\/div><div class="grid2"><button class="btn" id="cancelOrder">取消<\/button><button class="btn" id="confirmOrder">/,'retain the original reachable Cancel and Submit controls');
});

test('offline acceptance waits for the actual adapter before reload assertions and emits bounded missing-boot evidence',async()=>{
 const {runInNewContext}=await import('node:vm'),source=read('./11520-browser-settlement.mjs');
 const fn=source.slice(source.indexOf('    const waitForSimulationBoot=async()=>{'),source.indexOf('    const game=async()=>{'));
 let checked=0,fail=false;
 const context={page:{waitForFunction:async(predicate,arg,options)=>{checked++;assert.equal(options.timeout,12000);assert.doesNotThrow(()=>predicate());if(fail)throw new Error('fixture timeout');}},state:async()=>({simulation:null,execution:null,axis:null,url:'http://127.0.0.1/fixture'})};
 runInNewContext(fn+';globalThis.waitForSimulationBoot=waitForSimulationBoot;',context);
 await context.waitForSimulationBoot();assert.equal(checked,1,'absent global is an ordinary not-ready observation');
 fail=true;await assert.rejects(context.waitForSimulationBoot(),/SIMULATION_BOOT_NOT_READY.*adapterPresent.*false.*fixture timeout/);
 const reload=source.slice(source.indexOf("stage='reload-recovery'"),source.indexOf('result.reload=await state()'));
 assert.ok(reload.indexOf('await waitForSimulationBoot()')<reload.indexOf('globalThis.__K11520_SIMULATION_EXCHANGE__?.snapshot()'));
 assert.match(reload,/receipts\.length===length/,'receipt equality remains mandatory');
});

test('offline acceptance closes each open surface once and awaits its completed hidden transition',async()=>{
 const {runInNewContext}=await import('node:vm'),source=read('./11520-browser-settlement.mjs');
 const start=source.indexOf('    const game=async()=>{'),fn=source.slice(start,source.indexOf('    const organ=async name=>{',start));
 for(const open of [false,true]){
  const clicks=[],waits=[],page={locator:selector=>({evaluate:async predicate=>predicate({classList:{contains:cls=>selector==='#walletPanel'?cls==='collapsed':['#confirm','#sheet'].includes(selector)&&cls==='open'&&open}}),click:async()=>clicks.push(selector),waitFor:async options=>{assert.deepEqual({...options},{state:'hidden',timeout:12000});waits.push(selector)},isVisible(){throw new Error('transitional visibility is not close authority')}})};
  const context={page,usable:async selector=>assert.equal(selector,'#cancelOrder')};runInNewContext(fn+';globalThis.game=game;',context);await context.game();
  assert.deepEqual(clicks,open?['#cancelOrder','#sheetClose']:[]);assert.deepEqual(waits,['#confirm','#sheet']);
 }
});

test('camera QA reacquires only rejected native origins with a fixed budget and complete evidence',async()=>{
 const {runInNewContext}=await import('node:vm'),source=read('./11520-browser-responsive.mjs');
 const start=source.indexOf('async function acquireAdmittedCameraPan('),fn=source.slice(start,source.indexOf('// Real entry only:',start));
 const context={};runInNewContext(fn+';globalThis.acquire=acquireAdmittedCameraPan;',context);
 const fixture=(outcomes,{pickCost=10,beginCost=10,downOverride=null}={})=>{let time=0,begins=0,cancels=0;const records=[];return{records,get counts(){return{begins,cancels}},options:{records,now:()=>time,pick:async()=>{time+=pickCost;return{origin:{x:212,y:116},before:{camera:{manual:false},player:{x:422,y:216}}}},begin:async()=>{begins++;time+=beginCost},cancel:async()=>{cancels++},inspect:async()=>({down:downOverride??{type:'pointerdown',target:'three',isTrusted:true,canPan:outcomes[begins-1]},camera:{manual:false}})}}};
 const first=fixture([true]);const admitted=await context.acquire(first.options);assert.equal(admitted.admission.admitted,true);assert.deepEqual(first.counts,{begins:1,cancels:0});
 const moved=fixture([false,true]);await context.acquire(moved.options);assert.deepEqual(moved.counts,{begins:2,cancels:1});assert.equal(moved.records[0].reason,'ORIGIN_REJECTED_AT_NATIVE_DOWN');assert.ok(moved.records[0].afterCancel);assert.equal(moved.records[1].admitted,true);
 const rejected=fixture([false,false,false,true]);await assert.rejects(context.acquire(rejected.options),/3_ATTEMPTS_1000MS/);assert.deepEqual(rejected.counts,{begins:3,cancels:3});assert.equal(rejected.records.length,3);
 const slow=fixture([true],{pickCost:1000});await assert.rejects(context.acquire(slow.options),/3_ATTEMPTS_1000MS/);assert.equal(slow.counts.begins,0,'no late native attempt after acquisition deadline');
 const delayed=fixture([true],{beginCost:1000});await assert.rejects(context.acquire(delayed.options),/ACQUISITION_BUDGET_EXPIRED/);assert.deepEqual(delayed.counts,{begins:1,cancels:1});
 for(const downOverride of [{type:'pointerdown',target:'three',isTrusted:false,canPan:true},{type:'pointerdown',target:'button',isTrusted:true,canPan:true}]){const wrong=fixture([true],{downOverride});await assert.rejects(context.acquire(wrong.options),/TRUSTED_CANVAS_DOWN_REQUIRED/);assert.deepEqual(wrong.counts,{begins:1,cancels:1})}
 for(const canPan of [undefined,null,'false',1]){const malformed=fixture([false,true],{downOverride:{type:'pointerdown',target:'three',isTrusted:true,canPan}});await assert.rejects(context.acquire(malformed.options),/BOOLEAN_PAN_ELIGIBILITY_REQUIRED/);assert.deepEqual(malformed.counts,{begins:1,cancels:1})}
 const movement=source.slice(source.indexOf('const attempt={name,origin:gesturePoint'),source.indexOf('result.pointerTrace=await page.evaluate'));
 assert.match(movement,/sign>8/);assert.match(movement,/timeout:3000/);assert.match(movement,/after\.camera\.playerXYZ,start\.playerXYZ/);
 assert.doesNotMatch(movement,/acquireAdmittedCameraPan|continue|catch\s*\(/,'a failed admitted movement is never retried or ignored');
});


test('offline confirmation readiness observes rendered animation and geometry with a bounded fail-closed wait',async()=>{
 const {runInNewContext}=await import('node:vm'),source=read('./11520-browser-settlement.mjs');
 const start=source.indexOf('async function waitForOfflineConfirmationGeometry('),fn=source.slice(start,source.indexOf('async function offlineSimulationBrowserQA(',start));
 async function scenario(kind){
  let frame=0;const record={selector:'#confirmOrder'},qa={};
  const surface={id:'confirm',tagName:'DIV',classList:{contains:()=>kind!=='hidden'},parentElement:null,getAnimations:()=>kind==='forever'||(kind==='animation'&&frame<3)?[{playState:'running',pending:frame===1,currentTime:frame*16,effect:{getComputedTiming:()=>({progress:.25})}}]:[]};
  const element={id:'confirmOrder',tagName:'BUTTON',parentElement:surface,getAnimations:()=>[],getBoundingClientRect:()=>({x:20,y:kind==='clipped'?900:(kind==='moving'&&frame<3?frame*20:100),width:150,height:44,right:170,bottom:kind==='clipped'?944:(kind==='moving'&&frame<3?frame*20+44:144)})};
  const context={__offlineSimulationQA:qa,Date:{now:()=>frame*16},performance:{now:()=>frame*16},document:{querySelector:selector=>selector==='#confirm'?surface:element},getComputedStyle:node=>({display:'block',visibility:'visible',opacity:'1',transform:node===surface&&frame<3?'matrix(1,0,0,1,-180,100)':'matrix(1,0,0,1,-180,0)'})};
  const page={evaluate:async(callback,arg)=>{context.arg=arg;return runInNewContext('('+callback.toString()+')(arg)',context)},waitForFunction:async(predicate,arg,options)=>{assert.deepEqual({...options},{polling:'raf',timeout:1200});for(frame=1;frame<=8;frame++){if(await runInNewContext('('+predicate.toString()+')()',context))return}throw new Error('fixture timeout')}};
  context.page=page;context.record=record;runInNewContext(fn+'globalThis.wait=waitForOfflineConfirmationGeometry;',context);
  let error;try{await context.wait(page,record)}catch(caught){error=caught}return{record,error,frame};
 }
 for(const kind of ['still','animation','moving','clipped']){const result=await scenario(kind);assert.equal(result.error,undefined,kind);assert.equal(result.record.status,'STABLE_RENDERED_GEOMETRY');assert.equal(result.frame,kind==='animation'||kind==='moving'?5:3);assert.equal(result.record.observation.frames.length,result.frame);assert.equal(result.record.observation.frames.at(-1).stableFrames,3)}
 for(const kind of ['forever','hidden']){const result=await scenario(kind);assert.match(String(result.error),/CONFIRM_GEOMETRY_NOT_STABLE.*fixture timeout/);assert.equal(result.record.status,'NOT_STABLE');assert.equal(result.record.observation.frames.length,8)}
 const offline=source.slice(source.indexOf('async function offlineSimulationBrowserQA('),source.indexOf('async function localCandidateBrowserQA('));
 assert.match(offline,/box\.right<=profile\.width\+1&&box\.bottom<=profile\.height\+1/,'stable clipped geometry still fails the unchanged viewport assertion');
 assert.match(offline,/assert\.ok\(box\.hit/,'own-hit remains mandatory');
 assert.match(offline,/evidence\.submitActionHit=await usable\('#confirmOrder'\);await page\.locator\('#confirmOrder'\)\.click\(\)/,'own-hit is rechecked immediately after the screenshot and before native Submit');
 assert.doesNotMatch(fn,/waitForTimeout|scroll|style\.|\.finish\(|\.cancel\(|\.click\(/,'readiness cannot alter rendering or dispatch/retry actions');
});


test('one existing toast follows trading-panel context without replacing text, timers or accessibility',async()=>{
 const {runInNewContext}=await import('node:vm'),source=read('../runtime/game-ui-product-fixes-v23.mjs');
 const start=source.indexOf('let toastContextObserver=null;'),fn=source.slice(start,source.indexOf('export function emit11520WorldFeedback(',start)).replace('export function show11520Toast','function show11520Toast');
 const nodes={},timers=[],cleared=[],observers=[],listeners={};let moves=0;
 const element=id=>{const classes=new Set(),styleValues={};return nodes[id]={id,dataset:{},attrs:{},parentElement:null,children:[],style:{setProperty:(k,v)=>styleValues[k]=v,removeProperty:k=>delete styleValues[k]},styleValues,classList:{contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},setAttribute(k,v){this.attrs[k]=v},appendChild(node){if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(x=>x!==node);this.children.push(node);node.parentElement=this;moves++},querySelector:()=>null,getBoundingClientRect:()=>({left:6,top:160,bottom:200,width:360,height:24})}};
 const body=element('body'),toast=element('toast'),confirm=element('confirm'),sheet=element('sheet'),sheetBody=element('sheetBody'),sheetTitle=element('sheetTitle'),confirmHeader=element('confirmHeader'),sheetHeader=element('sheetHeader');element('k11520MonsterGuide');body.appendChild(toast);confirm.querySelector=()=>confirmHeader;sheet.querySelector=()=>sheetHeader;
 const context={isGame:true,innerHeight:844,document:{body,getElementById:id=>nodes[id],querySelector:selector=>({getAttribute:()=>({orders:'委託',positions:'持倉',history:'歷史'})[selector.match(/data-organ="(.*?)"/)[1]]})},MutationObserver:class{constructor(callback){this.callback=callback;this.observed=[];observers.push(this)}observe(node,options){this.observed.push({node,options})}disconnect(){this.disconnected=true}},setTimeout:(callback,ms)=>{timers.push({callback,ms});return timers.length},clearTimeout:id=>cleared.push(id),addEventListener:(name,callback)=>listeners[name]=callback};
 runInNewContext(fn+'globalThis.api={install:install11520ToastContext,show:show11520Toast,dispose:dispose11520ToastContext};',context);
 context.api.install();assert.equal(observers.length,1);assert.equal(toast.parentElement,body);assert.equal(toast.attrs.role,'status');assert.equal(toast.attrs['aria-live'],'polite');
 assert.deepEqual(observers[0].observed.map(x=>x.node.id),['confirm','sheet','toast','sheetBody','sheetTitle']);for(const {node,options} of observers[0].observed){if(node===sheetTitle){assert.equal(options.childList,true);assert.equal(options.characterData,true);assert.equal(options.subtree,true)}else{assert.equal(options.attributes,true);assert.equal(options.childList,undefined);assert.equal(options.subtree,undefined)}}
 context.api.show('ORDER_REJECTED · KEEP_ERROR',{duration:1700});assert.equal(toast.textContent,'ORDER_REJECTED · KEEP_ERROR');assert.equal(timers.length,1);assert.equal(toast.styleValues.top,'206px');
 confirm.classList.add('open');observers[0].callback([{target:confirm,attributeName:'class'}]);assert.equal(toast.parentElement,confirmHeader);assert.equal(toast.dataset.panelContext,'confirm');assert.equal(toast.styleValues.top,undefined);assert.equal(toast.textContent,'ORDER_REJECTED · KEEP_ERROR');assert.equal(timers.length,1,'context does not reset the feedback lifetime');
 const moved=moves;observers[0].callback([{target:confirm,attributeName:'class'}]);assert.equal(moves,moved,'idempotent placement cannot create a child-list feedback loop');
 toast.textContent='DIRECT_PREFLIGHT_ROUTE';toast.classList.add('show');observers[0].callback([{target:toast,attributeName:'class'}]);assert.equal(toast.textContent,'DIRECT_PREFLIGHT_ROUTE');assert.equal(toast.parentElement,confirmHeader);
 sheet.classList.add('open');sheetBody.dataset.simOrgan='history';sheetTitle.textContent='歷史';observers[0].callback([{target:sheetTitle,type:'childList'}]);assert.equal(toast.parentElement,confirmHeader,'confirmation takes priority');
 confirm.classList.remove('open');observers[0].callback([{target:confirm,attributeName:'class'}]);assert.equal(toast.parentElement,sheetHeader);assert.equal(toast.dataset.panelContext,'sheet');
 context.api.show('SIM-R-4 · CLOSED',{event:'GA600_LEVEL_UP',duration:2000});assert.equal(observers.length,1);assert.equal(timers.at(-1).ms,2000);assert.equal(toast.textContent,'SIM-R-4 · CLOSED');assert.equal(toast.dataset.worldEvent,'GA600_LEVEL_UP');
 timers.at(-1).callback();assert.equal(toast.classList.contains('show'),false);assert.equal(toast.dataset.worldEvent,undefined);
 sheetTitle.textContent='市場卡';observers[0].callback([{target:sheetTitle,type:'childList'}]);assert.equal(toast.parentElement,body,'a stale history marker cannot claim an unrelated sheet');sheetTitle.textContent='歷史';observers[0].callback([{target:sheetTitle,type:'childList'}]);assert.equal(toast.parentElement,sheetHeader);sheetBody.dataset.simOrgan='help';observers[0].callback([{target:sheetBody,attributeName:'data-sim-organ'}]);assert.equal(toast.parentElement,body,'unrelated sheets keep existing world behavior');assert.equal(toast.dataset.panelContext,undefined);assert.equal(toast.styleValues.top,'206px');
 const guideRect={left:132,top:355,bottom:434.75,width:220,height:79.75};nodes.k11520MonsterGuide.getBoundingClientRect=()=>guideRect;
 context.api.show('DISMISS_IN_PLACE',{combat:true,duration:450});assert.equal(toast.styleValues.top,'440.75px');const fadePlacement={...toast.styleValues},timerCount=timers.length;
 guideRect.top-=8;guideRect.bottom-=8;timers.at(-1).callback();observers[0].callback([{target:toast,attributeName:'class'}]);
 assert.deepEqual(toast.styleValues,fadePlacement,'dismissal must preserve visible placement while the guide moves');assert.equal(toast.classList.contains('show'),false);assert.equal(toast.textContent,'DISMISS_IN_PLACE');assert.equal(timers.length,timerCount);
 toast.textContent='DIRECT_NEXT_MESSAGE';toast.classList.add('show');observers[0].callback([{target:toast,attributeName:'class'}]);assert.equal(toast.styleValues.top,'432.75px','the next direct message must use current world geometry');
 toast.classList.remove('show');confirm.classList.add('open');observers[0].callback([{target:toast,attributeName:'class'},{target:confirm,attributeName:'class'}]);assert.equal(toast.parentElement,confirmHeader,'real panel changes still reparent a dismissing toast');assert.equal(toast.styleValues.top,undefined);assert.equal(timers.length,timerCount);
 context.api.dispose();assert.equal(observers[0].disconnected,true);listeners.pageshow();assert.equal(observers.length,2,'bfcache return reinstalls a single observer');listeners.pageshow();assert.equal(observers.length,2);
 assert.match(source,/pagehide',\(\)=>\{dispose11520ToastContext\(\);clearTimeout\(show11520Toast.timer\)/);
 assert.match(html,/:is\(#confirm,#sheet\)>\.sheetHead:has\(>#toast\)\{flex-wrap:wrap;position:sticky/);
 assert.match(html,/:is\(#confirm,#sheet\)>\.sheetHead>#toast\{[^}]*position:static!important[^}]*flex:0 0 100%[^}]*max-height:min\(96px,25dvh\)[^}]*overflow:auto/);
 assert.match(html,/#confirm>\.sheetHead,#confirm>\.grid2\{flex:0 0 auto/,'feedback must not shrink the existing footer');
});


test('toast visual assertions cannot prevent the existing failure screenshot capture',async()=>{
 const {runInNewContext}=await import('node:vm'),source=read('./11520-browser-settlement.mjs');
 const start=source.indexOf('    const shot=async label=>{'),fn=source.slice(start,source.indexOf('    const usable=async selector=>{',start));
 for(const evaluationThrows of [false,true])for(const captureThrows of [false,true]){
  const originalError=new Error('fixture DOM unavailable'),result={screenshots:[]},captured=[],context={assert,baseline:false,name:'390x844',out:'artifacts',profile:{width:390,height:844},result,page:{evaluate:async()=>{if(evaluationThrows)throw originalError;return{panel:'confirm',context:'wrong',inHeader:false}},screenshot:async options=>{captured.push(options.path);if(captureThrows)throw new Error('fixture capture unavailable')}}};
  runInNewContext(fn+'globalThis.shot=shot;',context);await assert.rejects(context.shot('failure'),error=>{if(evaluationThrows)assert.equal(error,originalError);else assert.equal(error.code,'ERR_ASSERTION');return true});assert.deepEqual(captured,['artifacts/390x844-failure.png']);assert.deepEqual(result.screenshots,captureThrows?[]:['390x844-failure.png']);if(captureThrows)assert.match(result.screenshotErrors[0].error,/capture unavailable/);
 }
});


test('offline toast visual gate cannot pass without actual preview and history observations',async()=>{
 const {runInNewContext}=await import('node:vm'),source=read('./11520-browser-settlement.mjs');
 const start=source.indexOf('function assertOfflineToastCoverage('),fn=source.slice(start,source.indexOf('async function offlineSimulationBrowserQA(',start)),context={assert};
 runInNewContext(fn+'globalThis.check=assertOfflineToastCoverage;',context);
 assert.throws(()=>context.check({}, {width:390}),/order-preview feedback coverage/);
 const preview={panel:'confirm',stage:'BTCUSDT-LONG-preview'},history={panel:'sheet',stage:'BTCUSDT-LONG-close-receipt'};
 assert.throws(()=>context.check({toastLayout:[preview]}, {width:390}),/history feedback coverage/);
 assert.doesNotThrow(()=>context.check({toastLayout:[preview,history]}, {width:390}));assert.doesNotThrow(()=>context.check({toastLayout:[preview]}, {width:360}));
 assert.match(source,/if\(!baseline\)assertOfflineToastCoverage\(result,profile\);/,'immutable baseline stays a reproduction lane');
});


test('simulation component revisions expose complete provenance and recorded executable bytes',async()=>{
 const {createHash}=await import('node:crypto'),hash=text=>createHash('sha256').update(text).digest('hex');
 const revision='2026-10-06.SIMULATION-ORDER-PLAYABILITY',sourceCommit='0ad0cffe33d23d1104baa963fedef25ad149a0ac';
 const assets=[{"path": "runtime/game-5d-main.mjs", "version": "2.9.0", "status": "ACTIVE", "nonMetadataSha256": "4c4b69e6e0c78160b28c28df12c387a7c9d50af62270b5b5a22a71ebf0e8d950", "priorFullSha256": "d38f0a6c21b73553eddfba6fb1742891bef800f4d1ca33e81e2f46123935afda", "revision": "2026-10-06.MARKET-CARD-NODE-RETENTION", "sourceCommit": "cf2ffb47c3e71e444935ef6151adc7f9d6208ca4", "ancestorCommit": "cf2ffb47c3e71e444935ef6151adc7f9d6208ca4"}, {"path": "runtime/public-market-quotes.mjs", "version": "1.0.0", "status": "ACTIVE", "nonMetadataSha256": "850908b15e29dfeba665b2d1b28535e7bb7812fa5c8cad271a9154ee0603eeaf", "priorFullSha256": "07d2553b0a918a0d33236202eed35dd93dc6b44f7c4f24b1243b199587f99071"}, {"path": "runtime/real-trading-order-intent.mjs", "version": "1.0.0", "status": "CANDIDATE", "nonMetadataSha256": "59c72325eda86da744153e4f64035f032025a6d5a2529fdf30ad417c373113b0", "priorFullSha256": "f412d5e054e2df611c74efc2ee2a66d7467f28ee8adeef6ed22ed22a20c36ece"}, {"path": "runtime/kgen-margin-runtime.mjs", "version": "CURRENT", "status": "ACTIVE", "nonMetadataSha256": "cbbb60fead493a081252f92b222caa6951b8d0cf7dd6e24669f839dd40bc0341", "priorFullSha256": "03063c4c323826fb3a74275884aac060c9267e7dc7b9db9750298f3ef2787631", "revision": "2026-10-07.BNB-LIQUIDATION-STATUS-CONSISTENCY", "sourceCommit": "35e2a331b05140a33e1b86e6918304e3e36ff039", "ancestorCommit": "f7f67950418ebbb6f7a5a309a32d529232fcb3b6", "lastUpdated": "2026-10-07", "reviewedBy": "dot / independent scoped technical source review / 2026-10-07; no registered Reviewer role or release approval", "taskId": "K11520-BNB-LIQUIDATION-STATUS-20261007"}, {"path": "runtime/game-ui-product-fixes-v23.mjs", "version": "2.4.0", "status": "ACTIVE", "nonMetadataSha256": "ec23460a1632e6ec61eda91a5334c9f08d50173ad6091a4c5cb563f35ba4653b", "priorFullSha256": "a944b9fbe886e0348ad1ef0d39a5af0d64f5acf261be9338cef74d621b13b2f2", "revision": "2026-10-06.TOAST-DISMISSAL-PLACEMENT", "sourceCommit": "de5c876bb713b0d4bbd7b6de4c84c11d27b4e9e9", "ancestorCommit": "de5c876bb713b0d4bbd7b6de4c84c11d27b4e9e9"}, {"path": "game-5d.html", "version": "2.9.5", "status": "ACTIVE", "nonMetadataSha256": "dc961da9c95ebe0278f3e36f212af1a71911078e161b8a56280e0d5a7f42045f", "priorFullSha256": "dc961da9c95ebe0278f3e36f212af1a71911078e161b8a56280e0d5a7f42045f"}];
 const mandatory=['VERSION','REVISION','STATUS','LAST_UPDATED','UPDATED_BY','REVIEWED_BY','SOURCE_COMMIT','TASK_ID','CHANGE_REASON','ANCESTOR','SOURCE_OF_TRUTH'];
 for(const asset of assets){
  const source=read('../'+asset.path),match=asset.path.endsWith('.mjs')?source.match(/^\/\* KGEN_META\n([\s\S]*?)\*\/\n/):source.match(/^\ufeff<!doctype html>\n<!-- KGEN_META\n([\s\S]*?)-->\n/);
  assert.ok(match,asset.path+' has one leading metadata comment');const fields=Object.fromEntries(match[1].trim().split('\n').map(line=>[line.slice(0,line.indexOf(':')),line.slice(line.indexOf(':')+1).trim()]));
  for(const field of mandatory)assert.ok(fields[field],asset.path+' '+field);assert.equal(fields.VERSION,asset.version);assert.equal(fields.STATUS,asset.status);assert.equal(fields.REVISION,asset.revision||revision);assert.equal(fields.PRODUCT_CONTEXT,'V2.9.5');assert.equal(fields.SOURCE_COMMIT,asset.sourceCommit||sourceCommit);assert.equal(fields.LAST_UPDATED,asset.lastUpdated||'2026-10-06');assert.match(fields.UPDATED_BY,/^dot \/ TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER/);assert.equal(fields.SOURCE_OF_TRUTH,'TRUE');assert.equal(fields.REVIEWED_BY,asset.reviewedBy||'dot / independent scoped metadata and provenance review / 2026-10-06; no registered Reviewer role or release approval','recorded scoped review required');if(asset.taskId)assert.equal(fields.TASK_ID,asset.taskId);
  assert.equal(fields.ANCESTOR,'K線西遊記/temples/11520/'+asset.path+' @ '+(asset.ancestorCommit||'e26f3a76ef0be7f43058225f46def3fbe123371e'));
  const body=asset.path.endsWith('.mjs')?source.slice(match[0].length):'\ufeff<!doctype html>\n'+source.slice(match[0].length);assert.equal(hash(body),asset.nonMetadataSha256,asset.path+' changed non-metadata bytes');
 }
 const changelog=read('../CHANGELOG.md');assert.ok(changelog.includes('| REVISION | 2026-10-06.MARKET-CARD-NODE-RETENTION |'));assert.ok(changelog.includes('| SOURCE_COMMIT | cf2ffb47c3e71e444935ef6151adc7f9d6208ca4 |'));assert.ok(changelog.includes('V2.9.5 simulation-playability component revision'));assert.ok(changelog.includes('full VISUAL_QA/release gate remained FAIL'));assert.ok(changelog.includes('needs its own exact-head Chromium'));
 const logMetadata=changelog.split('## Metadata\n')[1]?.split('## 2026-10-06')[0]||'';for(const field of mandatory)assert.ok(logMetadata.includes('| '+field+' | '),'CHANGELOG '+field);
 const entryFields=['Date','Version / Revision','Task ID','Actor','Reviewer','Files','Reason','Compatibility','Rollback'];assert.ok(changelog.includes('| '+entryFields.join(' | ')+' |'));
 for(const path of [".github/workflows/11520-game-product-qa.yml", "K線西遊記/temples/11520/CHANGELOG.md", "K線西遊記/temples/11520/HANDOFF_CURRENT.md", "K線西遊記/temples/11520/game-5d.html", "K線西遊記/temples/11520/runtime/game-5d-main.mjs", "K線西遊記/temples/11520/runtime/game-ui-product-fixes-v23.mjs", "K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs", "K線西遊記/temples/11520/runtime/public-market-quotes.mjs", "K線西遊記/temples/11520/runtime/real-trading-order-intent.mjs", "K線西遊記/temples/11520/tests/11520-browser-responsive.mjs", "K線西遊記/temples/11520/tests/11520-browser-settlement.mjs", "K線西遊記/temples/11520/tests/11520-browser-signed-c-immersive.mjs", "K線西遊記/temples/11520/tests/11520-ui-static.test.mjs", "tests/11520-order-route.test.mjs", "tests/11520-real-trading-order-intent.test.mjs"])assert.ok(changelog.includes('`'+path+'`'),'CHANGELOG aggregate file '+path);
 assert.ok(changelog.includes('metadata-only commit can be reverted'));assert.ok(changelog.includes('do not load the old runtime against active synthetic-source books'));
 assert.ok(!/PENDING_(?:METADATA|SCOPED)_REVIEW/.test(changelog),'CHANGELOG reviewer must be accepted before handoff');
 const history='# 11520 Changelog\n\n'+changelog.slice(changelog.indexOf('## 2026-10-04 — Canonical signed market address candidate'));assert.equal(hash(history),'214f25ea9de3aff65ee08cfabb871e78a7c39e1a33b055150e3c936ad3149881','prior changelog history remains byte-exact');
});


test('camera origin endpoint prefilter preserves the exact ordered result while reducing scene checks',async()=>{
 const {runInNewContext}=await import('node:vm'),source=read('./11520-browser-responsive.mjs');
 const start=source.indexOf('function selectWorldFirstPanOrigin('),fn=source.slice(start,source.indexOf('// Qualify the actual trusted down',start));
 for(const [width,height] of [[390,844],[844,390]])for(const [dx,dy] of [[60,0],[-60,0],[0,60],[0,-60]])for(const kind of ['clear','top-hud','alternating','late-origin','no-endpoint','no-origin']){
  const r={top:0,left:0,right:width,bottom:height},canvas={getBoundingClientRect:()=>r};let calls=0,time=0;
  const endpoint=(x,y)=>kind==='no-endpoint'?false:kind==='top-hud'?y>=70:kind==='alternating'?(x+y)%24===4:true;
  const origin=(x,y)=>kind==='no-origin'?false:kind==='late-origin'?x>=164&&y>=116:true;
  const camera={isWorldGestureArea:(x,y,radius)=>{assert.equal(radius,10);calls++;time+=5;return origin(x,y)},snapshot:()=>({panX:0,panZ:0,manual:false})};
  const context={document:{querySelector:()=>canvas,elementFromPoint:(x,y)=>endpoint(x,y)?canvas:null},__K11520_CAMERA__:camera,__K11520_WORLD_SELECTION_PROJECTION__:{playerHomeSnapshot:()=>({playerScreen:{x:width/2,y:height/2}})},performance:{now:()=>time}};
  let expected=null;outer:for(let y=r.top+80;y<r.bottom-80;y+=12)for(let x=r.left+80;x<r.right-80;x+=12)if(camera.isWorldGestureArea(x,y,10)&&context.document.elementFromPoint(x+dx,y+dy)===canvas){expected={x,y};break outer}
  const beforeCalls=calls;calls=0;time=0;runInNewContext(fn+'globalThis.pick=selectWorldFirstPanOrigin;',context);const actual=context.pick({dx,dy}),stats=context.worldFirstPanPickDiagnostics;
  assert.deepEqual(actual?.origin?{...actual.origin}:null,expected,width+'/'+height+'/'+dx+'/'+dy+'/'+kind);assert.ok(calls<=beforeCalls);assert.equal(stats.originPredicateCalls,calls);assert.equal(stats.candidates,stats.endpointDomChecks);assert.equal(stats.candidates,stats.endpointRejects+stats.originPredicateCalls);assert.equal(stats.elapsedMs,calls*5);
  if(kind==='no-endpoint'||kind==='top-hud'&&dy===-60)assert.ok(calls<beforeCalls,'covered endpoints do not pay for the scene predicate');
  if(actual){assert.equal(actual.before.camera.manual,false);assert.equal(actual.selectedAt,stats.finishedAt);assert.deepEqual({...actual.pickDiagnostics},{...stats})}else assert.equal(actual,null,'no clear origin still fails closed');
 }
 const acquisition=source.slice(source.indexOf('async function acquireAdmittedCameraPan('),source.indexOf('// Real entry only:'));assert.match(acquisition,/budgetMs=1000,maxAttempts=3/);assert.match(acquisition,/elapsedAfterDown>=budgetMs/);assert.match(acquisition,/down\.canPan!==true&&down\.canPan!==false/);
 const movement=source.slice(source.indexOf('const attempt={name,origin:gesturePoint'),source.indexOf('result.pointerTrace=await page.evaluate'));assert.match(movement,/sign>8/);assert.match(movement,/timeout:3000/);assert.match(movement,/after\.camera\.playerXYZ,start\.playerXYZ/);
});


test('simulation ticks retain canonical market cards and normal-owner decorations while updating leaves',async()=>{
const vm=await import('node:vm');
// Execute the real owners in a DOM-tree fixture; no browser/CSS/heights are modeled.
let nextId=1;const opened=[];
class N {constructor(type){this.nodeType=type;this.uid=nextId++;this.parentNode=null;this.childNodes=[]}get textContent(){return this.nodeType===3?this.data:this.childNodes.map(n=>n.textContent).join('')}set textContent(x){if(this.nodeType===3){this.data=String(x);return}this.replaceChildren(new T(String(x)))}replaceChildren(...nodes){for(const n of this.childNodes)n.parentNode=null;this.childNodes=[];this.append(...nodes)}append(...nodes){for(let n of nodes){if(typeof n==='string')n=new T(n);if(n.parentNode)n.parentNode.childNodes=n.parentNode.childNodes.filter(x=>x!==n);n.parentNode=this;this.childNodes.push(n)}}appendChild(n){this.append(n);return n}prepend(n){this.append(n);this.childNodes.pop();this.childNodes.unshift(n)}get isConnected(){return this===doc||!!this.parentNode?.isConnected}}
class T extends N{constructor(s){super(3);this.data=s}}
function camel(s){return s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())}
class E extends N {constructor(tag){super(1);this.tagName=tag.toUpperCase();this.attrs={};this.dataset=new Proxy({},{set:(target,key,value)=>{target[key]=String(value);this.attrs['data-'+key.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())]=String(value);return true}});this.style={};this.classList={contains:c=>this.className.split(/\s+/).includes(c),toggle:(c,on)=>{const a=this.className.split(/\s+/).filter(Boolean),had=a.includes(c);if(on===undefined)on=!had;this.className=(on?[...new Set([...a,c])]:a.filter(x=>x!==c)).join(' ');return on}}}setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[camel(k.slice(5))]=String(v)}getAttribute(k){return this.attrs[k]??null}get id(){return this.attrs.id||''}set id(s){this.attrs.id=s}get className(){return this.attrs.class||''}set className(s){this.attrs.class=s}get children(){return this.childNodes.filter(n=>n.nodeType===1)}set innerHTML(html){this.replaceChildren();const stack=[this];for(const tok of html.match(/<[^>]+>|[^<]+/g)||[]){if(tok.startsWith('</')){stack.pop();continue}if(tok.startsWith('<')){const m=tok.match(/^<([\w-]+)([\s\S]*?)\/?>$/),el=new E(m[1]);for(const a of m[2].matchAll(/([\w:-]+)(?:="([^"]*)")?/g))el.setAttribute(a[1],a[2]??'');stack.at(-1).append(el);if(!tok.endsWith('/>'))stack.push(el)}else stack.at(-1).append(new T(tok))}}querySelectorAll(sel){const parts=sel.trim().split(/\s+/),match=(el,p)=>{const tag=p.match(/^[a-zA-Z][\w-]*/)?.[0];if(tag&&el.tagName!==tag.toUpperCase())return false;for(const m of p.matchAll(/#([\w-]+)|\.([\w-]+)|\[([\w-]+)(?:="([^"]*)")?\]/g)){if(m[1]&&el.id!==m[1])return false;if(m[2]&&!el.classList.contains(m[2]))return false;if(m[3]&&(el.getAttribute(m[3])===null||(m[4]!==undefined&&el.getAttribute(m[3])!==m[4])))return false}return true},matches=el=>{let i=parts.length-1;if(!match(el,parts[i--]))return false;let p=el.parentNode;while(i>=0){while(p&&(!p.tagName||!match(p,parts[i])))p=p.parentNode;if(!p)return false;i--;p=p.parentNode}return true},out=[];const walk=n=>{for(const c of n.children||[]){if(matches(c))out.push(c);walk(c)}};walk(this);return out}querySelector(sel){return this.querySelectorAll(sel)[0]||null}}
const doc=new E('document');doc.head=new E('head');doc.body=new E('body');doc.append(doc.head,doc.body);doc.createElement=t=>new E(t);doc.body.innerHTML='<div id="axes"></div><div id="feed"></div><div id="k11520PlaneLabel">XZ 操控面</div>';
let now=0,sequence=0;const intervals=[],trace=[];
const snapshot=label=>{trace.push({at:now,label,cards:doc.querySelectorAll('[data-market-card]').map(c=>({axis:c.dataset.axis,uid:c.uid,head:c.querySelector('.axisHead span').uid,badge:c.querySelector('.k11520NormalBadge')?.uid??null,normal:c.classList.contains('k11520NormalActive'),classes:c.className,marketLabel:c.querySelector('.marketKValue')?.textContent??null,clickHandler:typeof c.onclick}))})};
const ctx=vm.createContext({document:doc,Node:{TEXT_NODE:3},setInterval:(fn,period)=>{const i={id:++sequence,fn,period,next:now+period};intervals.push(i);return i.id},clearInterval:id=>{const i=intervals.find(i=>i.id===id);if(i)i.disabled=true},S:{axis:'KY',quotes:{BTCUSDT:77564.83,ETHUSDT:2511.16,BNBUSDT:724.23},axes:{KX:{market:'BTCUSDT'},KY:{market:'ETHUSDT'},KZ:{market:'BNBUSDT'}}},execution:{mode:'SIMULATION',readOnly:false,tick:()=>({ok:true,events:[]}),snapshot:()=>({observations:{}})},fmt:(x,n)=>x.toFixed(n),openMarketCard:axis=>opened.push(axis),world:{},kMarketSnapshot:()=>({markets:[['KX','BTCUSDT'],['KY','ETHUSDT'],['KZ','BNBUSDT']].map(([axis,symbol])=>({axis,symbol,universe:axis,price:1})),status:'LIVE',receivedAt:0}),formatUniverseAddress:a=>a+' fixture address',resolveCMode:()=>({mode:'MONSTER_MODE'}),combatSelection:()=>({c:0}),publicObservations:{},publicObservationStatus:()=>{},playerLifeSwitching:false,publicQuoteAttempted:true,recordSimulationEvents:()=>{},syncSimulationPositions:()=>{},refreshSimulationSheet:()=>{},pending:false,toast:()=>{},__K11520_3D_CONTROL__:{mode:'XZ'}});
const render=main.slice(main.indexOf('function renderAxes(){'),main.indexOf('function openMarketCard('));
const labels=main.slice(main.indexOf('function syncMarketKLabels(){'),main.indexOf('function controlState('));
const tick=main.slice(main.indexOf('function tickSimulation(){'),main.indexOf('function executionQuote('));
const normal=read('../runtime/normal-market-presentation.mjs');
vm.runInContext("const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];"+render+labels+tick,ctx);
vm.runInContext(normal.replace(/^import .*;$/m,'').replace(/^const \$=.*$/m,'').replace(/^const \$\$=.*$/m,'').replace('export function install11520NormalMarketPresentation','function install11520NormalMarketPresentation'),ctx);
vm.runInContext('renderAxes()',ctx);snapshot('initial actual renderAxes + actual syncMarketKLabels');
now=37;vm.runInContext('install11520NormalMarketPresentation()',ctx);snapshot('actual decorator installed, 120ms interval starts');
const original=doc.querySelectorAll('[data-market-card]'),originalBadges=original.map(c=>c.querySelector('.k11520NormalBadge'));
function advance(until){while(true){const next=intervals.filter(i=>!i.disabled&&i.next<=until).sort((a,b)=>a.next-b.next||a.id-b.id)[0];if(!next)break;now=next.next;next.next+=next.period;next.fn();if(now>=997)snapshot(next.period===1000?'actual 1s tickSimulation callback':'actual 120ms normal callback')}now=until}
advance(1117);
const current=doc.querySelectorAll('[data-market-card]');
assert(original.every((c,i)=>c===current[i]&&c.isConnected),'unchanged simulation tick must retain every market card');
assert(originalBadges.every((b,i)=>b===current[i].querySelector('.k11520NormalBadge')&&b.isConnected),'existing normal badges must remain attached');
assert(trace.filter(t=>t.at>=1000).every(t=>t.cards.every(c=>c.badge!==null)),'there must be no undecorated timer gap');


const before=JSON.stringify(ctx.S);vm.runInContext('renderAxes()',ctx);assert.equal(JSON.stringify(ctx.S),before,'presentation must not mutate game/trade state');
ctx.S.quotes.BTCUSDT=80001.25;ctx.S.axes.KX.pos={side:'空',lots:3,c:-1};ctx.S.axis='KX';
vm.runInContext('renderAxes()',ctx);
assert.equal(current[0].querySelector('.q').textContent,'$80001.25');assert.equal(current[0].querySelector('.pos').textContent,'空 3口 · -1C');assert.equal(current[0].getAttribute('aria-current'),'true');assert.equal(current[1].getAttribute('aria-current'),'false');
for(const card of current){card.onclick();assert.equal(card.querySelector('.marketName').textContent,ctx.S.axes[card.dataset.axis].market.replace('USDT','/USDT'));assert.equal(card.getAttribute('aria-label'),`查看 ${card.dataset.axis} ${ctx.S.axes[card.dataset.axis].market.replace('USDT','/USDT')} 市場詳情`);assert.equal(card.querySelector('.marketKValue').textContent,card.dataset.axis+' fixture address')}
assert.deepEqual(opened,['KX','KY','KZ']);assert(original.every((card,i)=>card===doc.querySelectorAll('[data-market-card]')[i]));
ctx.execution.readOnly=true;delete ctx.S.quotes.ETHUSDT;vm.runInContext('renderAxes()',ctx);assert(current.every(card=>card.querySelector('.pos').textContent==='NOT_REQUESTED'));assert.equal(current[1].querySelector('.q').textContent,'--');
ctx.__K11520_3D_CONTROL__.mode='YZ';advance(1237);assert.deepEqual(current.filter(card=>card.classList.contains('k11520NormalActive')).map(card=>card.dataset.axis),['KX'],'existing normal owner still follows the current control plane');assert.equal(doc.querySelectorAll('[data-market-card]').length,3);assert(originalBadges.every((badge,i)=>badge===current[i].querySelector('.k11520NormalBadge')));

});
