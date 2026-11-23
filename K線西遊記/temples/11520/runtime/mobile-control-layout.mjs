// 2026-11-18 / Codex / Human clean-combat HUD: existing live edge summaries,
// original explicit detail surfaces, and one canvas-owned floating-disc visual.
// Earlier presentation notes remain below as source ancestry.
// 2026-11-17 / Codex /root / PR672: original action visibility follows retained
// controls OR explicit trade context. Compact overlays fit the existing world;
// no financial state, world coordinate or gesture admission rule is changed.
// LOCAL_CANDIDATE_REVISION: HUD-FLOW2-TAP-J1; latestHumanretainfaintoutlineandremoveoutervisualsquareonly; actualauthorCodex originaltechnicalexecutor01a189ef-ecbc-7699-b87b-a4538d57c029.
import {K11520_MOBILE_WIDTH_QUERY,K11520_TOUCH_PORTRAIT_QUERY} from './market-origin-wallet-layout-runtime.mjs';
import {formatGameDistanceK} from './spatial-coordinate-runtime.mjs';
/* KGEN_META
STATUS: ACTIVE
FORMAL_ORGAN_NAME: Mobile Control Layout
VERSION: 1.3.17
REVISION: 2026-11-02.HUD-FLOW1-TAP-J1
ACTUAL_AUTHOR: Codex original technical executor / 01a189ef-ecbc-7699-b87b-a4538d57c029
SOURCE_COMMIT: f887ac0405d2f3f774d348b1b77395933d806571
TASK_ID: K11520-FIRST-VIEW-ZERO-CARDS-NATURE-20261012-001
CHANGE_REASON: Reuse measured HUD flow, retain accepted faint idle/press feedback, remove outer visual border without deleting the touch container, and compose only with separately pinned central tap usability; world/control values and financial/storage logic unchanged.
PURPOSE: Preserve approved HUD anchors across mobile widths; center the normal-axis energy rail in the mobile viewport, keep its approved Wukong artwork upright and recognisable at 34px, own its track/thumb horizontal geometry, place signed-C and positive lot rails to its right without overlap, preserve Market/Wallet utility-layout ownership, and keep expanded KX/KY/KZ market cards equally wide and readable. Raid/courier action geometry is owned by the existing Market/Wallet utility rail. Thumb travel is presentation-only; no wallet identity, chain, payment, treasury or governance mutation.
*/
const $=s=>document.querySelector(s);
const MOBILE_MAX=600;
const wideTouchPortrait=()=>innerWidth>MOBILE_MAX&&globalThis.matchMedia?.(K11520_TOUCH_PORTRAIT_QUERY).matches;
const mobileWidth=()=>innerWidth<=MOBILE_MAX||wideTouchPortrait();
const railLayoutProperties=['position','left','right','top','bottom','width','height','display','transform','margin','z-index','opacity','visibility','pointer-events'];
let booted=false,flowObserver=null,guard=null,timers=[],energyTimer=null,energyLabelGuard=null,collapseBound=false;
const thumbObservers=new WeakMap();
const flowObserved=new WeakSet();
const hudCollapsed=()=>document.documentElement.classList.contains('k11520HudCollapsed');
const paramsHidden=()=>!!$('.sliderDock')?.classList.contains('k11520HiddenBySettings');
const onDemand=()=>document.documentElement.dataset.k11520HudMode==='ON_DEMAND';
const compactHud=()=>{const root=document.documentElement;return onDemand()&&root.dataset.k11520HudProfile==='MINIMAL'&&!['k11520InfoOpen','k11520TradeOpen','k11520SettingsOpen','k11520UtilitiesOpen','k11520HudCollapsed'].some(name=>root.classList.contains(name))};
const railDisclosed=sel=>!onDemand()||document.documentElement.classList.contains('k11520ControlsOpen')||document.documentElement.classList.contains('k11520TradeOpen')||(sel==='#yControl'&&document.documentElement.classList.contains('k11520MovementActive'));
function installStyle(){
  let s=$('#k11520MobileControlLayout');
  if(!s){s=document.createElement('style');s.id='k11520MobileControlLayout';document.head.appendChild(s)}
  const compact='html[data-k11520-hud-mode="ON_DEMAND"][data-k11520-hud-profile="MINIMAL"]:not(.k11520InfoOpen):not(.k11520TradeOpen):not(.k11520SettingsOpen):not(.k11520UtilitiesOpen):not(.k11520HudCollapsed)';
  const css=`
@media ${K11520_MOBILE_WIDTH_QUERY}{
  .hud-drawer-toggle,#yJoyV250{display:none!important;visibility:hidden!important;pointer-events:none!important}
  .top{left:6px!important;right:6px!important;height:58px!important;padding:7px 8px!important;gap:5px!important}
  .brand{min-width:0!important}.brand b{font-size:12px!important}
  .brand .hqLine{white-space:nowrap!important}
  html[data-k11520-layout-owner] .brand .brandMetaV250{font-size:8px!important;white-space:normal!important;flex-wrap:wrap!important;column-gap:4px!important;row-gap:1px!important;line-height:1.05!important}
  html[data-k11520-layout-owner] .brand .brandMetaV250>span{white-space:nowrap!important}
  .brand .hqDistrictV111{color:#f1ca73!important;font-weight:900!important}
  .pill{padding:5px 6px!important}.pill b{font-size:12px!important}
  .axes{top:70px!important;left:6px!important;right:6px!important;height:auto!important;min-height:104px!important;gap:4px!important;align-items:stretch!important;z-index:250!important}
  .axis{min-width:0!important;padding:5px!important}.axis select{font-size:8px!important;padding:5px 3px!important}.axis .marketName,.axis .q{display:block!important;white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important}.axis .marketName{font-size:12px!important;line-height:14px!important}.axis .q{font-size:12px!important;line-height:15px!important}.axis .pos{font-size:7px!important}.axis .marketKValue{white-space:normal!important;overflow-wrap:normal!important;word-break:keep-all!important;line-height:1.25!important}
  .universeFloorBadge{font-size:6px!important;overflow:hidden;text-overflow:ellipsis}
  #joy.joyWrap{left:14px!important;width:min(146px,calc(50vw - 44px))!important;height:min(146px,calc(50vw - 44px))!important;bottom:max(16px,env(safe-area-inset-bottom))!important}
  #joy{--guideSize:98px;--knobSize:62px}
  #cControl .track,#lotsControl .track{left:8px!important;right:8px!important;top:27px!important;bottom:24px!important;min-width:0!important}
  #yControl .track{left:50%!important;right:auto!important;top:27px!important;bottom:24px!important;width:26px!important;min-width:0!important;transform:translateX(-50%)!important;background:linear-gradient(to bottom,#123f32 0%,#123f32 49.5%,#2b343b 49.5%,#2b343b 50.5%,#4b2029 50.5%,#4b2029 100%)!important;box-shadow:inset 0 0 0 1px #ffffff0c!important}
  #k11520RealTradePreflight{right:58px!important;bottom:264px!important;max-width:190px!important}
  @media(orientation:portrait){
    /* Leave one grid gap before the escort shortcut in the expanded tray. */
    html.k11520UtilitiesOpen #k11520RealTradePreflight{right:101px!important}
    html.k11520UtilitiesOpen #k11520RealTradePreflightBtn{justify-self:start}
  }
  #cControl::after,#lotsControl::after{display:none!important}
  .tele,.monsterHud{top:var(--k11520-status-top,190px)!important;height:var(--k11520-status-height,108px)!important;padding:7px!important;font-size:7px!important}
  .tele{left:6px!important;width:calc(50% - 9px)!important}
  .monsterHud{right:6px!important;width:calc(50% - 9px)!important}
  html.k11520UtilitiesOpen .tele{width:calc(50% - 36px)!important}
  html.k11520UtilitiesOpen .monsterHud{right:60px!important;width:calc(50% - 36px)!important}
  .minimapWrap{top:var(--k11520-map-top,308px)!important;left:6px!important;width:116px!important;height:134px!important;padding:5px!important}.minimapWrap #minimap{width:104px!important;height:94px!important}
  #knob{will-change:transform!important}
  .sliderDock{position:static!important;display:contents!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:auto!important;height:auto!important;gap:0!important}
  #cControl,#lotsControl,#yControl{box-sizing:border-box!important;margin:0!important;transform:none!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;position:fixed!important;top:auto!important;bottom:max(28px,env(safe-area-inset-bottom))!important;width:42px!important;height:132px!important;z-index:456!important;display:block!important}
  #yControl{left:calc(50% - 21px)!important;right:auto!important}
  #cControl{left:calc(50% + 29px)!important;right:auto!important}
  #lotsControl{left:calc(50% + 79px)!important;right:auto!important}
  #cControl label,#lotsControl label,#yControl label{top:5px!important;font-size:7px!important;line-height:1.05!important;font-weight:900!important;white-space:nowrap!important;text-shadow:0 1px 2px #000!important}
  html[data-k11520-layout-owner] #cControl .read,html[data-k11520-layout-owner] #lotsControl .read,html[data-k11520-layout-owner] #yControl .read{bottom:4px!important;font-size:7px!important;line-height:1!important;font-weight:900!important;white-space:nowrap!important;text-shadow:0 1px 2px #000!important}
  #cControl .thumb,#lotsControl .thumb,#yControl .thumb{box-sizing:border-box!important;left:50%!important;width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;max-width:34px!important;max-height:34px!important;aspect-ratio:1/1!important;flex:0 0 34px!important;flex-shrink:0!important;border-radius:50%!important;transform:translate(-50%,-50%)!important;overflow:hidden!important;top:calc(44px + var(--k11520-thumb-ratio,.5)*47px)!important}
  /* The source is a portrait poster. A cover crop turns the 34px thumb into an
     unreadable diagonal collage, so lock the crop to Wukong's upright face. */
  #yThumb{border:2px solid #f1ca73!important;background-color:#111!important;background-image:url('./assets/wukong-y-control.jpg')!important;background-position:31.5% 46.3%!important;background-size:426.5% auto!important;background-repeat:no-repeat!important;box-shadow:0 0 0 2px #05080dcc,0 0 14px #f1ca7366!important}
  #yControl label:after{content:none!important;display:none!important}
  #yControl[data-energy-sign="nonnegative"] #yThumb{border-color:#65e798!important;box-shadow:0 0 0 2px #05080dcc,0 0 16px #65e79888!important}
  #yControl[data-energy-sign="negative"] #yThumb{border-color:#ff737a!important;box-shadow:0 0 0 2px #05080dcc,0 0 16px #ff737a88!important}
  #yControl[data-energy-sign="nonnegative"]{border-color:#65e79899!important;box-shadow:0 0 16px #65e79822!important}
  #yControl[data-energy-sign="negative"]{border-color:#ff737a99!important;box-shadow:0 0 16px #ff737a22!important}
  #yControl[data-energy-sign="nonnegative"] label,#yControl[data-energy-sign="nonnegative"] .read{color:#65e798!important}
  #yControl[data-energy-sign="negative"] label,#yControl[data-energy-sign="negative"] .read{color:#ff737a!important}
  html[data-k11520-layout-owner] .controls{position:fixed!important;left:auto!important;right:56px!important;top:auto!important;bottom:166px!important;width:176px!important;height:42px!important;transform:none!important;z-index:460!important}
  html[data-k11520-layout-owner] .controls .skill,html[data-k11520-layout-owner] .controls .dodge,html[data-k11520-layout-owner] .controls .flat,html[data-k11520-layout-owner] .controls .tool{position:absolute!important;width:40px!important;height:40px!important;top:auto!important;bottom:0!important;border-radius:50%!important;font-size:11px!important}
  .controls .skill{right:0!important}.controls .flat{right:44px!important}.controls .dodge{right:88px!important}.controls .tool{right:132px!important}
  html[data-k11520-layout-owner] .controls .attack,html[data-k11520-layout-owner] .controls .order{position:fixed!important;top:auto!important;bottom:212px!important;width:58px!important;height:40px!important;border-radius:12px!important;font-size:10px!important;line-height:1.05!important;z-index:470!important}
  html[data-k11520-layout-owner] .controls .attack{left:136px!important;right:auto!important}html[data-k11520-layout-owner] .controls .order{left:200px!important;right:auto!important}
  /* Utility geometry and styling are supplied by Market/Wallet Layout. */
  html:not(.k11520UtilitiesOpen) #walletPanel,html:not(.k11520UtilitiesOpen) #walletToggle,html:not(.k11520UtilitiesOpen) #chatHandle,html:not(.k11520UtilitiesOpen) #gameModeToggle,html:not(.k11520UtilitiesOpen) #bgmButton,html:not(.k11520UtilitiesOpen) #aiChatButton,html:not(.k11520UtilitiesOpen) #backpackButton,html:not(.k11520UtilitiesOpen) #k11520HudCollapseAll,html:not(.k11520UtilitiesOpen) #dock{display:none!important}
  html.k11520UtilitiesOpen #gameModeToggle{display:grid!important;visibility:visible!important;pointer-events:auto!important}
  body:has(#aiChatPanel.open,#gameChat.open,#backpackPanel.open,#k11520UiSettings.open,#sheet.open,#walletLaunchSheet.open) #k11520HudCollapseAll,body:has(#aiChatPanel.open,#gameChat.open,#backpackPanel.open,#k11520UiSettings.open,#sheet.open,#walletLaunchSheet.open) #k11520UtilityMaster{visibility:hidden!important;pointer-events:none!important}
  #dock.open .rail{right:58px!important}
  html.k11520HudCollapsed .top,html.k11520HudCollapsed .axes,html.k11520HudCollapsed .tele,html.k11520HudCollapsed .monsterHud,html.k11520HudCollapsed .minimapWrap,html.k11520HudCollapsed .joyWrap,html.k11520HudCollapsed #cControl,html.k11520HudCollapsed #lotsControl,html.k11520HudCollapsed #yControl,html.k11520HudCollapsed .controls,html.k11520HudCollapsed #walletPanel,html.k11520HudCollapsed #walletToggle,html.k11520HudCollapsed #chatHandle,html.k11520HudCollapsed #gameChat,html.k11520HudCollapsed .bagRelocatedV250,html.k11520HudCollapsed #backpackButton,html.k11520HudCollapsed #gameModeToggle,html.k11520HudCollapsed #aiChatButton,html.k11520HudCollapsed #bgmButton,html.k11520HudCollapsed #k11520UtilityMaster,html.k11520HudCollapsed .dock{display:none!important}
}
@media(orientation:landscape) and (max-height:600px){
  #cControl,#lotsControl,#yControl{height:108px!important;bottom:max(58px,calc(env(safe-area-inset-bottom) + 50px))!important}
  #cNumericInput,#lotsNumericInput{top:calc(100% + 5px)!important;bottom:auto!important;width:44px!important;min-height:44px!important;height:44px!important;left:50%!important;transform:translateX(-50%)!important;font-size:11px!important}
  #cControl .track,#lotsControl .track{left:8px!important;right:8px!important;top:27px!important;bottom:24px!important;min-width:0!important}
  #yControl .track{left:50%!important;right:auto!important;top:27px!important;bottom:24px!important;width:26px!important;min-width:0!important;transform:translateX(-50%)!important;background:linear-gradient(to bottom,#123f32 0%,#123f32 49.5%,#2b343b 49.5%,#2b343b 50.5%,#4b2029 50.5%,#4b2029 100%)!important;box-shadow:inset 0 0 0 1px #ffffff0c!important}
  #cControl label,#lotsControl label,#yControl label{top:5px!important;font-size:7px!important;line-height:1.05!important;font-weight:900!important;white-space:nowrap!important;text-shadow:0 1px 2px #000!important}
  html[data-k11520-layout-owner] #cControl .read,html[data-k11520-layout-owner] #lotsControl .read,html[data-k11520-layout-owner] #yControl .read{bottom:4px!important;font-size:7px!important;line-height:1!important;font-weight:900!important;white-space:nowrap!important;text-shadow:0 1px 2px #000!important}
  #cControl .thumb,#lotsControl .thumb,#yControl .thumb{box-sizing:border-box!important;left:50%!important;width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;max-width:34px!important;max-height:34px!important;aspect-ratio:1/1!important;flex:0 0 34px!important;flex-shrink:0!important;border-radius:50%!important;transform:translate(-50%,-50%)!important;overflow:hidden!important;top:calc(36px + var(--k11520-thumb-ratio,.5)*31px)!important}
  #yThumb{border:2px solid #f1ca73!important;background-color:#111!important;background-image:url('./assets/wukong-y-control.jpg')!important;background-position:31.5% 46.3%!important;background-size:426.5% auto!important;background-repeat:no-repeat!important;box-shadow:0 0 0 2px #05080dcc,0 0 14px #f1ca7366!important}
  #yControl label:after{content:none!important;display:none!important}
  #yControl[data-energy-sign="nonnegative"] #yThumb{border-color:#65e798!important;box-shadow:0 0 0 2px #05080dcc,0 0 16px #65e79888!important}
  #yControl[data-energy-sign="negative"] #yThumb{border-color:#ff737a!important;box-shadow:0 0 0 2px #05080dcc,0 0 16px #ff737a88!important}
}
@media(max-width:380px){
  html[data-k11520-layout-owner] #k11520PlaneLabel{width:calc(100vw - 252px)!important}
}
@media(max-width:380px) and (orientation:portrait){
  /* Keep a real world gesture gap between the map and movement controls on
     narrow screens; retain the existing map owner and 44px action buttons. */
  html[data-k11520-hud-profile] .minimapWrap{height:110px!important}
  html[data-k11520-hud-profile] .minimapWrap #minimap{height:70px!important}
}
/* WORLD_FIRST_HUD_POLICY: disclosure never changes coordinates or control owners. */
#k11520MarketRow{position:fixed;top:68px;left:auto;right:6px;width:44px;height:44px;min-height:44px;z-index:310;border:1px solid #68e4ff66;border-radius:12px;background:#071018e8;color:#dffaff;font:700 12px system-ui;touch-action:manipulation}
#k11520HudProfile{min-height:44px;background:#102332;color:#dffaff;border:1px solid #68e4ff66;border-radius:8px}
#k11520PlaneLabel{overflow:hidden!important;text-overflow:ellipsis!important;max-width:100%}
html[data-k11520-hud-profile]:not(.k11520MarketOpen) .axes{display:none!important}
html[data-k11520-hud-profile="MINIMAL"]:not(.k11520InfoOpen) .tele,html[data-k11520-hud-profile="MINIMAL"]:not(.k11520InfoOpen) .monsterHud{display:none!important}
/* Expanded Market owns the full available row. Camera controls live in their
   own compact context cluster instead of consuming a fourth market column. */
html[data-k11520-hud-profile] .axes{top:116px!important;left:6px!important;right:6px!important;z-index:610!important}
html.k11520UtilitiesOpen[data-k11520-hud-profile="FULL"] .axes{right:6px!important}
html[data-k11520-hud-profile="MINIMAL"] .minimapWrap{top:auto!important;bottom:268px!important;height:134px!important}
html[data-k11520-hud-profile="MINIMAL"] #k11520MonsterGuide{top:168px!important;left:6px!important;right:6px!important;width:auto!important;max-width:none!important;transform:none!important;min-height:44px;white-space:nowrap!important;overflow:hidden;text-overflow:ellipsis}
html[data-k11520-hud-profile="MINIMAL"].k11520MarketOpen #k11520MonsterGuide{top:230px!important}
html[data-k11520-hud-profile] #logisticsMissionHud{display:none!important}
#k11520CameraReset{position:fixed;left:6px;top:auto;bottom:max(170px,calc(env(safe-area-inset-bottom) + 170px));width:44px;height:44px;z-index:590;border-radius:50%;border:1px solid #68e4ff88;background:#071018dd;color:#dffaff;font-size:22px;touch-action:manipulation}
/* 170px keeps the compact status below the 360x740 FULL minimap while
   retaining a clear gap above the 44px movement controls. */
#k11520CameraZoomStatus{position:fixed;z-index:589;left:54px;right:auto;top:auto;bottom:max(170px,calc(env(safe-area-inset-bottom) + 170px));width:116px;transform:translateY(6px);padding:6px 8px;border:1px solid #68e4ff66;border-radius:999px;background:#071018e8;color:#dffaff;font:800 11px system-ui;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:0;pointer-events:none;transition:opacity .18s,transform .18s}
#k11520CameraZoomStatus.show{opacity:1;transform:translateY(0)}
@media(orientation:portrait) and (max-width:${MOBILE_MAX}px){
  /* Fit between Recenter and the combat row without rising over the map. */
  #k11520CameraZoomStatus{width:72px;padding-inline:4px}
}
#k11520FollowMonster{position:fixed;left:54px;right:auto;top:116px;width:calc(100vw - 224px);height:44px;z-index:620;border:1px solid #68e4ff88;border-radius:10px;background:#071018dd;color:#dffaff;font:700 10px system-ui;overflow:hidden;text-overflow:ellipsis}
#k11520CameraReset[hidden],#k11520FollowMonster[hidden],#k11520MarketRow[hidden]{display:none!important}
@media(orientation:landscape) and (max-height:600px){
  /* The tiny Market edge has its own 44px lane plus an 8px gap. Reserve that
     lane beside the header so FULL balance labels/values stay readable. */
  html[data-k11520-hud-profile] .top{right:calc(max(6px, env(safe-area-inset-right)) + 52px)!important;height:54px!important}
  #k11520MarketRow{top:6px;left:auto;right:max(6px, env(safe-area-inset-right));width:44px;min-height:44px}
  html[data-k11520-hud-profile] .axes{top:54px!important;left:360px!important;right:58px!important;width:auto!important;max-width:none!important;transform:none!important}
  /* Realistic quotes may wrap k/alpha/theta onto two lines. Size to content,
     then flow diagnostic HUD below it instead of leaking past a 74px card. */
  html[data-k11520-hud-profile] .axes{height:auto!important;min-height:74px!important}
  html[data-k11520-hud-profile] .axis .marketKValue{white-space:normal!important;overflow-wrap:normal!important;word-break:keep-all!important;line-height:1.25!important}
  html[data-k11520-hud-profile] .tele,html[data-k11520-hud-profile] .monsterHud{top:var(--k11520-landscape-status-top,136px)!important}
  /* Taller readable header must not push the diagnostic row onto the fixed
     parameter rails. Use the existing portrait text scale, with auto height. */
  html[data-k11520-hud-profile] .tele{font-size:7px!important;line-height:1.1!important;padding:5px!important}
  html[data-k11520-hud-profile] #k11520MonsterGuide{top:auto!important;bottom:8px!important;transform:none!important}
  html[data-k11520-hud-profile="MINIMAL"].k11520MarketOpen #k11520MonsterGuide{top:auto!important}
  html[data-k11520-hud-profile="MINIMAL"] .minimapWrap{top:66px!important;bottom:auto!important;left:6px!important}
  html[data-k11520-hud-profile="MINIMAL"]:not(.k11520InfoOpen) .top>.pill{display:none!important}
  html[data-k11520-hud-profile="MINIMAL"] #k11520MonsterGuide{top:auto!important;bottom:8px!important;left:346px!important;right:180px!important}
  #k11520CameraReset{left:160px;top:66px;bottom:auto}
  #k11520CameraZoomStatus{left:160px;right:auto;top:114px;bottom:auto;width:126px;max-width:126px;transform:translateY(6px)}
  #k11520CameraZoomStatus.show{transform:translateY(0)}
  #k11520FollowMonster{left:360px;top:54px;width:calc(100vw - 540px)}
  #k11520UiSettings{top:54px!important;max-height:calc(100dvh - 64px);overflow:auto}
}
/* V2.9.6 candidate: visibility changes never resize/reanchor the world. */
/* Information disclosure must not own Settings, Wallet, camera recovery or
   explicit controls. Each original organ keeps its own foreground/hidden gate. */
html[data-k11520-hud-mode="ON_DEMAND"]:not(.k11520InfoOpen):not(.k11520TradeOpen) :where(.axes,.tele,.monsterHud,.minimapWrap,#k11520MonsterGuide){display:none!important;visibility:hidden!important;pointer-events:none!important}
html[data-k11520-hud-mode="ON_DEMAND"]:not([data-k11520-hud-profile="FULL"]):not(.k11520InfoOpen):not(.k11520TradeOpen) .top{display:none!important;visibility:hidden!important;pointer-events:none!important}
html[data-k11520-hud-mode="ON_DEMAND"]:not(.k11520ControlsOpen):not(.k11520TradeOpen) .controls{display:none!important;visibility:hidden!important;pointer-events:none!important}
/* Explicit information restores original status/map cards even in the compact
   utility context; individual preferences and foreground Settings still win. */
html[data-k11520-hud-mode="ON_DEMAND"].k11520InfoOpen:not(.k11520UtilitiesOpen):not(.k11520HudCollapsed):not(.k11520SettingsOpen) :is(.tele,.monsterHud,.minimapWrap):not(.k11520HiddenBySettings){display:block!important;visibility:visible!important;pointer-events:auto!important}
html[data-k11520-hud-mode="ON_DEMAND"]:not(.k11520TradeOpen):not(.k11520ControlsOpen) :is(#orderFire,#flat){display:none!important;visibility:hidden!important;pointer-events:none!important}
html[data-k11520-hud-mode="ON_DEMAND"] #joy{display:block!important;visibility:visible!important;opacity:.28!important;pointer-events:auto!important;background:transparent!important;border:0!important;box-shadow:none!important;transition:opacity .18s linear;touch-action:none}
html[data-k11520-hud-mode="ON_DEMAND"]:not(.k11520MovementActive) #joy>*{opacity:.3!important}
html[data-k11520-hud-mode="ON_DEMAND"].k11520MovementActive #joy{opacity:.72!important;background:#68e4ff0a!important;border-color:#9eeeff66!important}
html[data-k11520-hud-mode="ON_DEMAND"] :is(#yControl,#cControl,#lotsControl){transition:opacity .18s linear,visibility 0s linear .18s}
html[data-k11520-hud-mode="ON_DEMAND"]:not(.k11520ControlsOpen):not(.k11520TradeOpen):not(.k11520MovementActive) #yControl,
html[data-k11520-hud-mode="ON_DEMAND"]:not(.k11520ControlsOpen):not(.k11520TradeOpen) :is(#cControl,#lotsControl){opacity:0!important;visibility:hidden!important;pointer-events:none!important}
html[data-k11520-hud-mode="ON_DEMAND"].k11520MovementActive #yControl,html[data-k11520-hud-mode="ON_DEMAND"].k11520ControlsOpen :is(#yControl,#cControl,#lotsControl),html[data-k11520-hud-mode="ON_DEMAND"].k11520TradeOpen :is(#yControl,#cControl,#lotsControl){transition-delay:0s}
html[data-k11520-hud-mode="ON_DEMAND"] #k11520MarketRow{display:block!important;visibility:visible!important;pointer-events:auto!important;position:fixed!important;top:68px!important;right:max(6px,env(safe-area-inset-right))!important;bottom:auto!important;left:auto!important;min-width:44px!important;z-index:7100!important}
html.k11520SettingsOpen[data-k11520-hud-mode="ON_DEMAND"] #k11520MarketRow{visibility:hidden!important;pointer-events:none!important}
@media(orientation:landscape) and (max-height:600px){html[data-k11520-hud-mode="ON_DEMAND"] #k11520MarketRow{top:6px!important}}
html[data-k11520-hud-mode="ON_DEMAND"] .axes{position:fixed!important}
html[data-k11520-hud-mode="ON_DEMAND"] .top .brand{transform:translateY(var(--k11520-brand-offset,0px))!important}
html[data-k11520-hud-mode="ON_DEMAND"] .axes{top:var(--k11520-market-top,116px)!important}
@media(orientation:landscape) and (max-height:600px){html[data-k11520-hud-mode="ON_DEMAND"] .axes{top:var(--k11520-market-top,54px)!important}}
#k11520BuildStamp::after{content:' · L:FLOW2/TAP-J1'}
@media (max-width:600px) and (orientation:portrait), ${K11520_TOUCH_PORTRAIT_QUERY}{
  /* FULL and compact modes share one compact guide. Full story/details remain
     on its original explicit activation, not a centred world-blocking card. */
  html[data-k11520-hud-profile] #k11520MonsterGuide{left:6px!important;right:6px!important;width:auto!important;max-width:none!important;transform:none!important;height:44px!important;min-height:44px!important;box-sizing:border-box!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
  html[data-k11520-hud-mode="ON_DEMAND"]:is(.k11520InfoOpen,.k11520TradeOpen) #k11520MonsterGuide{top:var(--k11520-guide-top,346px)!important;bottom:auto!important}
  html[data-k11520-hud-mode="ON_DEMAND"]:is(.k11520InfoOpen,.k11520TradeOpen) .minimapWrap{top:var(--k11520-map-top,400px)!important;bottom:auto!important}
}
@media(orientation:landscape) and (max-height:600px){
  html[data-k11520-hud-mode="ON_DEMAND"]:is(.k11520InfoOpen,.k11520TradeOpen) #k11520MonsterGuide{top:var(--k11520-landscape-guide-top,252px)!important;bottom:auto!important}
}
/* Compact combat reuses the live HP/XYZ/selected-market organs. Full cards
   remain in their original explicit information and trading contexts. */
${compact}:not(.k11520ControlsOpen) #k11520RealTradePreflight{display:none!important;pointer-events:none!important}
${compact} #k11520BuildStamp{display:none!important}
${compact} .monsterHud:not(.k11520HiddenBySettings){display:flex!important;visibility:visible!important;pointer-events:none!important;position:fixed!important;left:max(6px,env(safe-area-inset-left))!important;right:auto!important;top:max(24px,calc(env(safe-area-inset-top) + 20px))!important;bottom:auto!important;width:110px!important;height:44px!important;min-height:44px!important;box-sizing:border-box!important;padding:4px 6px!important;gap:3px;flex-direction:column;justify-content:center;background:#071018b8!important;border:1px solid #68e4ff44!important;border-radius:9px!important;z-index:610!important;font-size:12px!important;line-height:1.2!important}
${compact} .monsterHud .bar{height:5px!important;margin:0!important}
${compact} .monsterHud details{display:none!important}
${compact} .monsterHud :is(#k11520MotionCombat,#k11520HpDetail,#k11520DriveHud){display:none!important}
${compact} .axes:not(.k11520HiddenBySettings){display:block!important;visibility:visible!important;pointer-events:auto!important;position:fixed!important;left:max(124px,calc(env(safe-area-inset-left) + 118px))!important;right:auto!important;top:max(24px,calc(env(safe-area-inset-top) + 20px))!important;bottom:auto!important;width:min(244px,calc(100vw - max(124px,calc(env(safe-area-inset-left) + 118px)) - max(58px,calc(env(safe-area-inset-right) + 52px))))!important;height:44px!important;min-height:44px!important;max-width:none!important;transform:none!important;z-index:610!important}
${compact} .axes .axis:not(.active){display:none!important}
${compact} .axes .axis.active{display:grid!important;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:1fr 1fr;align-items:center;column-gap:6px;position:static!important;width:100%!important;height:44px!important;min-height:44px!important;box-sizing:border-box!important;margin:0!important;padding:3px 6px!important;outline:none!important;box-shadow:none!important;border:1px solid #68e4ff44!important;border-radius:9px!important;background:#071018b8!important;font-size:11px!important;line-height:1.2!important;overflow:hidden}
${compact} .axis .axisHead{display:contents!important}
${compact} .axis .axisHead>span,${compact} .axis .pos,${compact} .axis .marketKValue,${compact} .axis .universeFloorBadge{display:none!important}
${compact} .axis .axisHead>b{grid-column:2;grid-row:1;font-size:9px!important}
${compact} .axis .marketName{grid-column:1;grid-row:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px!important}
${compact} .axis .q{grid-column:1/-1;grid-row:2;white-space:nowrap;font-size:12px!important;line-height:1.2!important}
${compact} .tele:not(.k11520HiddenBySettings){display:flex!important;visibility:visible!important;pointer-events:none!important;position:fixed!important;left:max(6px,env(safe-area-inset-left))!important;right:max(58px,calc(env(safe-area-inset-right) + 52px))!important;top:max(74px,calc(env(safe-area-inset-top) + 70px))!important;bottom:auto!important;width:auto!important;height:32px!important;min-height:32px!important;box-sizing:border-box!important;padding:4px 6px!important;align-items:center;background:#07101899!important;border:0!important;border-radius:7px!important;z-index:609!important;font-size:11px!important;line-height:1.25!important;overflow:hidden}
${compact} .tele>b{display:block;width:100%;min-width:0;font-size:0!important;line-height:12px!important;white-space:normal;overflow:visible;text-overflow:clip}
${compact} .tele #xyz{display:block;font-size:10px!important;line-height:12px!important;white-space:normal;overflow-wrap:anywhere}
${compact} .tele>div{display:none!important}
${compact} #k11520MonsterGuide[style*="display: block"]:not(.k11520HiddenBySettings){display:block!important;visibility:visible!important;pointer-events:auto!important;position:fixed!important;left:max(6px,env(safe-area-inset-left))!important;right:auto!important;top:max(112px,calc(env(safe-area-inset-top) + 108px))!important;bottom:auto!important;width:min(320px,calc(100vw - max(6px,env(safe-area-inset-left)) - max(58px,calc(env(safe-area-inset-right) + 52px))))!important;max-width:none!important;height:44px!important;min-height:44px!important;box-sizing:border-box!important;margin:0!important;padding:6px 8px!important;transform:none!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;background:#07101899!important;border:1px solid #68e4ff33!important;border-radius:9px!important;z-index:609!important;font-size:11px!important;line-height:30px!important}
${compact}:not(.k11520ControlsOpen) .controls:not(.k11520HiddenBySettings){display:block!important;visibility:visible!important;pointer-events:none!important;position:fixed!important;left:auto!important;right:max(58px,calc(env(safe-area-inset-right) + 52px))!important;top:auto!important;bottom:max(72px,calc(env(safe-area-inset-bottom) + 64px))!important;width:154px!important;height:156px!important;transform:none!important;z-index:470!important}
${compact} .controls>button{min-width:44px!important;min-height:44px!important}
${compact}:not(.k11520ControlsOpen) .controls :is(#attack,#skill,#dodge,#tradeSword){position:absolute!important;left:auto!important;top:auto!important;pointer-events:auto!important;border-radius:50%!important}
${compact}:not(.k11520ControlsOpen) .controls #attack{right:0!important;bottom:0!important;width:56px!important;height:56px!important;font-size:13px!important}
${compact}:not(.k11520ControlsOpen) .controls #skill{right:66px!important;bottom:0!important;width:44px!important;height:44px!important;font-size:13px!important}
${compact}:not(.k11520ControlsOpen) .controls #tradeSword{right:0!important;bottom:66px!important;width:44px!important;height:44px!important;font-size:15px!important}
${compact}:not(.k11520ControlsOpen) .controls #dodge{right:66px!important;bottom:56px!important;width:44px!important;height:44px!important;font-size:15px!important}
@media(orientation:landscape) and (max-height:600px){
  ${compact} #k11520CameraZoomStatus{left:var(--k11520-compact-zoom-left,160px);top:var(--k11520-compact-zoom-top,114px)}
}
/* The same canvas-owned joystick is only a visual while floating. Neither it
   nor its children can steal the second contact from the existing pinch owner. */
html[data-k11520-hud-mode="ON_DEMAND"]:not(.k11520ControlsOpen):not(.k11520TradeOpen) #joy:not([data-k11520-floating-active="1"]){opacity:0!important;visibility:hidden!important;pointer-events:none!important}
html[data-k11520-hud-mode="ON_DEMAND"] #joy[data-k11520-floating-active="1"]{position:fixed!important;left:var(--k11520-floating-x,50vw)!important;right:auto!important;top:var(--k11520-floating-y,50vh)!important;bottom:auto!important;transform:translate(-50%,-50%)!important;opacity:.88!important;visibility:visible!important;pointer-events:none!important;background:#07101844!important;border:1px solid #9eeeff88!important;border-radius:50%!important;box-shadow:none!important;z-index:450!important}
html[data-k11520-hud-mode="ON_DEMAND"] #joy[data-k11520-floating-active="1"] *{pointer-events:none!important;opacity:1!important}
html[data-k11520-hud-mode="ON_DEMAND"] #joy[data-k11520-floating-active="1"] #k11520PlaneLabel{display:none!important}
html[data-k11520-hud-mode="ON_DEMAND"]:is(.k11520ControlsOpen,.k11520TradeOpen) #joy:not([data-k11520-floating-active="1"]){visibility:visible!important;pointer-events:auto!important}
#k11520MovePlane{position:fixed!important;left:max(6px,env(safe-area-inset-left))!important;right:auto!important;top:auto!important;bottom:max(8px,env(safe-area-inset-bottom))!important;width:70px!important;height:44px!important;min-width:70px!important;min-height:44px!important;box-sizing:border-box!important;display:grid!important;place-items:center!important;padding:4px!important;border:1px solid #68e4ff66!important;border-radius:10px!important;background:#071018d9!important;color:#dffaff!important;font:700 12px system-ui!important;z-index:590!important;touch-action:manipulation!important}
/* Keep reading sizes useful on touch displays that report a wide layout viewport. */
@media (orientation:portrait) and (max-width:600px), ${K11520_TOUCH_PORTRAIT_QUERY}{
  html[data-k11520-layout-owner]{
    --k11520-hud-label:clamp(11px,2.65vw,26px);
    --k11520-hud-value:clamp(14px,3.6vw,36px);
  }
  html[data-k11520-layout-owner] .top{height:auto!important;min-height:58px!important;padding-top:22px!important}
  html[data-k11520-layout-owner][data-k11520-hud-mode="ON_DEMAND"] .top .brand{transform:none!important}
  html[data-k11520-layout-owner] :is(#k11520MarketRow,#k11520ControlsClose){top:var(--k11520-portrait-disclosure-top,68px)!important}
  html[data-k11520-layout-owner] .brand .hqLine{font-size:clamp(13px,3vw,29px)!important}
  html[data-k11520-layout-owner] .brand .brandMetaV250,html[data-k11520-layout-owner] .top .pill small{font-size:var(--k11520-hud-label)!important}
  html[data-k11520-layout-owner] .top .pill b{font-size:var(--k11520-hud-value)!important}
  html[data-k11520-layout-owner] .axis .marketName,html[data-k11520-layout-owner] .axis .q{font-size:var(--k11520-hud-value)!important;line-height:1.2!important}
  html[data-k11520-layout-owner] .axis .marketKValue,html[data-k11520-layout-owner] .axis .pos,html[data-k11520-layout-owner] .axisHead :is(b,span){font-size:var(--k11520-hud-label)!important}
  html[data-k11520-layout-owner]:is(.k11520InfoOpen,.k11520TradeOpen) :is(.tele,.monsterHud){font-size:var(--k11520-hud-label)!important;line-height:1.25!important;overflow-wrap:anywhere}
  html[data-k11520-layout-owner]:is(.k11520InfoOpen,.k11520TradeOpen) :is(.tele,.monsterHud) :is(small,#k11520HpDetail,#k11520DriveHud,#k11520MotionCombat){font-size:inherit!important;line-height:inherit!important}
  html[data-k11520-layout-owner]:is(.k11520InfoOpen,.k11520TradeOpen) #k11520MonsterGuide{font-size:var(--k11520-hud-label)!important;height:auto!important;white-space:normal!important;overflow-wrap:anywhere}
  html.k11520UtilitiesOpen[data-k11520-layout-owner] :is(.tele,.monsterHud){width:calc((100% - 163px)/2)!important}
  html.k11520UtilitiesOpen[data-k11520-layout-owner] .monsterHud{right:149px!important}
  html.k11520UtilitiesOpen[data-k11520-layout-owner] #k11520MonsterGuide{
    right:auto!important;width:calc(100% - 163px)!important;
  }
  @media(max-width:480px){
    /* The guide gets its own left lane while the utility and trading buttons
       are visible. Its text wraps without owning the adjacent controls. */
    html.k11520UtilitiesOpen[data-k11520-layout-owner] #k11520RealTradePreflight{max-width:158px!important}
    html.k11520UtilitiesOpen[data-k11520-layout-owner] #k11520MonsterGuide{width:calc(100% - 271px)!important}
  }
  html[data-k11520-layout-owner] :is(#yControl,#cControl,#lotsControl) label{
    font-size:9px!important;white-space:normal!important;overflow-wrap:anywhere;max-width:100%;
  }
  html[data-k11520-layout-owner] #cControl label{letter-spacing:-.045em;overflow-wrap:normal}
  html[data-k11520-layout-owner] :is(#yControl,#cControl,#lotsControl) .read{font-size:9px!important}
}
@media ${K11520_TOUCH_PORTRAIT_QUERY} and (width > 600px){
  html[data-k11520-layout-owner]{
    --k11520-wide-rail-width:clamp(54px,8vw,88px);
    --k11520-wide-rail-height:clamp(148px,20vw,220px);
    --k11520-wide-thumb:clamp(42px,6vw,60px);
  }
  ${compact}{
    --k11520-summary-row:clamp(64px,8.7vw,88px);
    --k11520-summary-life:clamp(144px,24vw,232px);
    --k11520-summary-world-top:calc(30px + var(--k11520-summary-row));
    --k11520-summary-world-height:clamp(38px,5vw,50px);
  }
  ${compact} :is(.monsterHud:not(.k11520HiddenBySettings),.axes:not(.k11520HiddenBySettings),.axes .axis.active){
    height:var(--k11520-summary-row)!important;min-height:var(--k11520-summary-row)!important;
  }
  ${compact} .monsterHud:not(.k11520HiddenBySettings){width:var(--k11520-summary-life)!important;font-size:var(--k11520-hud-value)!important}
  ${compact} .axes:not(.k11520HiddenBySettings){
    left:calc(max(6px,env(safe-area-inset-left)) + var(--k11520-summary-life) + 8px)!important;
    width:min(440px,calc(100vw - var(--k11520-summary-life) - 80px))!important;
  }
  ${compact} .axis .marketName,${compact} .axis .axisHead>b{font-size:var(--k11520-hud-label)!important}
  ${compact} .axis .q{font-size:var(--k11520-hud-value)!important}
  ${compact} .tele:not(.k11520HiddenBySettings){
    top:var(--k11520-summary-world-top)!important;height:var(--k11520-summary-world-height)!important;
  }
  ${compact} .tele #xyz{font-size:var(--k11520-hud-label)!important;line-height:1.15!important}
  ${compact} #k11520MarketRow{top:24px!important}
  ${compact} #k11520MonsterGuide[style*="display: block"]:not(.k11520HiddenBySettings){
    top:calc(var(--k11520-summary-world-top) + var(--k11520-summary-world-height) + 8px)!important;
    font-size:var(--k11520-hud-label)!important;width:min(560px,calc(100vw - 70px))!important;
  }
  html[data-k11520-layout-owner] :is(#yControl,#cControl,#lotsControl) .track{top:42px!important}
  html[data-k11520-layout-owner] :is(#yControl,#cControl,#lotsControl) :is(label,.read){font-size:clamp(11px,1.5vw,16px)!important}
  html[data-k11520-layout-owner] :is(#yControl,#cControl,#lotsControl) .thumb{
    width:var(--k11520-wide-thumb)!important;height:var(--k11520-wide-thumb)!important;
    min-width:var(--k11520-wide-thumb)!important;min-height:var(--k11520-wide-thumb)!important;
    max-width:var(--k11520-wide-thumb)!important;max-height:var(--k11520-wide-thumb)!important;
    top:calc(58px + var(--k11520-thumb-ratio,.5)*(100% - 116px))!important;
  }
}
#k11520MovePlane[hidden],html:is(.k11520ControlsOpen,.k11520TradeOpen,.k11520SettingsOpen,.k11520UtilitiesOpen,.k11520HudCollapsed) #k11520MovePlane,html.k11520WorldInputBlocked #k11520MovePlane{display:none!important;visibility:hidden!important;pointer-events:none!important}
html:is(.k11520SettingsOpen,.k11520UtilitiesOpen,.k11520HudCollapsed) #joy[data-k11520-floating-active="1"],html.k11520WorldInputBlocked #joy[data-k11520-floating-active="1"]{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
`;
  if(s.textContent!==css)s.textContent=css;
}
function setImportant(el,key,value){if(el&&(el.style.getPropertyValue(key)!==value||el.style.getPropertyPriority(key)!=='important'))el.style.setProperty(key,value,'important')}
function applyRail(){
  const landscape=globalThis.matchMedia?.('(orientation:landscape) and (max-height:600px)').matches;
  if(!mobileWidth()&&!landscape){
    for(const el of document.querySelectorAll('[data-k11520-mobile-layout="center-normal-rail"]')){
      for(const property of railLayoutProperties)el.style.removeProperty(property);
      delete el.dataset.k11520MobileLayout;
    }
    return;
  }
  globalThis.__K11520_AXIS_RAIL_GUARD__?.disconnect?.();
  const specs=landscape?[['#yControl','max(182px, calc(env(safe-area-inset-left) + 168px))'],['#cControl','max(232px, calc(env(safe-area-inset-left) + 218px))'],['#lotsControl','max(282px, calc(env(safe-area-inset-left) + 268px))']]:[['#yControl','calc(50% - 21px)'],['#cControl','calc(50% + 29px)'],['#lotsControl','calc(50% + 79px)']];
  if(wideTouchPortrait()){
    const width='var(--k11520-wide-rail-width)';
    specs[0][1]=`calc(50% - ${width}/2)`;
    specs[1][1]=`calc(50% + ${width}/2 + 8px)`;
    specs[2][1]=`calc(50% + ${width}*1.5 + 16px)`;
  }
  for(const [sel,left] of specs){const el=$(sel);if(!el)continue;if(landscape&&el.parentElement!==document.body)document.body.appendChild(el);if(hudCollapsed()||paramsHidden()||document.documentElement.classList.contains('k11520SettingsOpen')){setImportant(el,'display','none');continue}for(const [k,v] of [['position','fixed'],['left',left],['right','auto'],['top','auto'],['bottom','max(28px, env(safe-area-inset-bottom))'],['width',wideTouchPortrait()?'var(--k11520-wide-rail-width)':'42px'],['height',wideTouchPortrait()?'var(--k11520-wide-rail-height)':'132px'],['display','block'],['transform','none'],['margin','0'],['z-index','456'],['opacity',railDisclosed(sel)?'1':'0'],['visibility',railDisclosed(sel)?'visible':'hidden'],['pointer-events',railDisclosed(sel)?'auto':'none']])setImportant(el,k,v);el.dataset.k11520MobileLayout='center-normal-rail'}
  if(landscape)for(const [sel] of specs){const el=$(sel);setImportant(el,'bottom','max(58px, calc(env(safe-area-inset-bottom) + 50px))');setImportant(el,'height','108px');setImportant(el,'width','44px')}
}
function installThumbBounds(){
  for(const id of ['cThumb','lotsThumb','yThumb']){
    const el=$('#'+id);if(!el||thumbObservers.has(el))continue;
    const sync=()=>{
      const raw=el.style.top.trim();let ratio=.5;
      if(/^-?\d+(?:\.\d+)?%$/.test(raw))ratio=parseFloat(raw)/100;
      else if(/^-?\d+(?:\.\d+)?px$/.test(raw))ratio=parseFloat(raw)/(el.parentElement?.clientHeight||132);
      const next=String(Math.max(0,Math.min(1,ratio)));
      if(el.style.getPropertyValue('--k11520-thumb-ratio')!==next)el.style.setProperty('--k11520-thumb-ratio',next);
    };
    const observer=new MutationObserver(sync);observer.observe(el,{attributes:true,attributeFilter:['style']});thumbObservers.set(el,observer);sync();
  }
}
function applyRightOrgans(){/* Utility geometry/visibility is owned only by market-origin-wallet-layout-runtime. */}
function normalizeBrand(){
  const line=$('.brand .hqLine'),meta=$('.brand .brandMetaV250');if(!line||!meta)return false;
  const text=(line.textContent||'').replace(/\s+/g,' ').trim();
  if(text.includes('（華爾街）'))line.innerHTML='<span class="hqFlag" aria-hidden="true">🇺🇸</span><span>11520 花果山美國</span>';
  let district=meta.querySelector('.hqDistrictV111');if(!district){district=document.createElement('span');district.className='hqDistrictV111';district.textContent='（華爾街）';const clock=meta.querySelector('.brandClockV250');meta.insertBefore(district,clock||null)}
  return true;
}
function installEnergyRead(){
  const rail=$('#yControl');if(!rail)return false;
  const label=rail.querySelector('label'),out=rail.querySelector('.read');if(!label||!out)return false;
  const paint=()=>{
    const ctl=globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__||null;
    const axis=String(ctl?.railAxis||'Y').toUpperCase(),key=axis.toLowerCase();
    const world=globalThis.__K11520_WORLD_COORDS__||null;
    const raw=Number(world?.intent?.[key]??ctl?.rail?.value??0),v=Number.isFinite(raw)?raw:0;
    const sign=v<0?'negative':'nonnegative';rail.dataset.energySign=sign;
    const level=sign==='negative'?'負能階':'非負能階';
    const nextLabel=`${axis} 縱搖桿`;
    if(label.textContent!==nextLabel)label.textContent=nextLabel;
    const safe=Object.is(v,-0)?0:v;
    const nextRead=formatGameDistanceK(safe,{compact:true});
    if(out.textContent!==nextRead)out.textContent=nextRead;
    const detail=`${axis} 縱搖桿 ${level} ${formatGameDistanceK(safe,{detail:true})}`;
    rail.setAttribute('aria-label',detail);rail.title=detail;
  };
  paint();clearInterval(energyTimer);energyTimer=setInterval(paint,100);
  try{energyLabelGuard?.disconnect()}catch{}
  let repairing=false;
  energyLabelGuard=new MutationObserver(()=>{if(repairing)return;repairing=true;queueMicrotask(()=>{paint();repairing=false})});
  energyLabelGuard.observe(label,{childList:true,characterData:true,subtree:true});
  return true;
}
function installMasterCollapse(){
  let b=$('#k11520HudCollapseAll');if(!b){b=document.createElement('button');b.id='k11520HudCollapseAll';b.type='button';b.setAttribute('aria-label','總收合或展開 HUD');document.body.appendChild(b)}
  const sync=()=>{const collapsed=hudCollapsed();b.textContent=collapsed?'▣':'▤';b.title=collapsed?'展開全部 HUD':'總收合 HUD';b.setAttribute('aria-expanded',String(!collapsed));document.documentElement.dataset.k11520HudCollapsed=collapsed?'1':'0';applyRail();applyRightOrgans()};
  if(!collapseBound){b.addEventListener('click',()=>{document.documentElement.classList.toggle('k11520HudCollapsed');sync()});collapseBound=true}sync();return true;
}
function apply(){installStyle();document.documentElement.dataset.k11520LayoutOwner='mobile-control-layout';document.documentElement.dataset.k11520LayoutRevision='HUD-FLOW1-TAP-J1';applyRail();installThumbBounds();applyRightOrgans();normalizeBrand();installEnergyRead();installMasterCollapse();syncStatusFlow();const report=measure();globalThis.__K11520_MOBILE_CONTROL_LAYOUT__=report;return report}
function overlap(a,b,pad=0){return !!a&&!!b&&a.left<b.right-pad&&a.right>b.left+pad&&a.top<b.bottom-pad&&a.bottom>b.top+pad}
function rect(sel){const e=$(sel);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
function measure(){
  const isVisible=sel=>{const el=$(sel);if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0};
  const statusVisible=isVisible('.tele')||isVisible('.monsterHud'),marketVisible=isVisible('.axes');
  const report={version:'1.3.14',viewport:{width:innerWidth,height:innerHeight},joy:rect('#joy'),axisRail:rect('#yControl'),axisTrack:rect('#yControl .track'),axisThumb:rect('#yThumb'),warp:rect('#cControl'),lots:rect('#lotsControl'),attack:rect('#attack'),order:rect('#orderFire'),minimap:rect('.minimapWrap'),wallet:rect('#walletPanel'),backpack:rect('.bagRelocatedV250'),chat:rect('#chatHandle'),dock:rect('#dock'),marketHud:rect('.axes'),worldHud:rect('.tele'),lifeHud:rect('.monsterHud'),masterCollapse:rect('#k11520HudCollapseAll')};
  report.axisRailCentered=!mobileWidth()||Boolean(report.axisRail&&Math.abs((report.axisRail.left+report.axisRail.width/2)-innerWidth/2)<2);
  report.axisEnergyGeometryAligned=!mobileWidth()||Boolean(report.axisRail&&report.axisTrack&&report.axisThumb&&Math.abs((report.axisTrack.left+report.axisTrack.width/2)-(report.axisRail.left+report.axisRail.width/2))<1&&Math.abs((report.axisThumb.left+report.axisThumb.width/2)-(report.axisRail.left+report.axisRail.width/2))<1&&report.axisTrack.left>=report.axisRail.left&&report.axisTrack.right<=report.axisRail.right);
  report.threeRailAligned=!mobileWidth()||Boolean(report.warp&&report.lots&&report.axisRail&&Math.abs(report.warp.top-report.lots.top)<2&&Math.abs(report.lots.top-report.axisRail.top)<2&&report.axisRail.right<=report.warp.left&&report.warp.right<=report.lots.left);
  report.hudProfile=document.documentElement.dataset.k11520HudProfile||'FULL';report.statusVisible=statusVisible;report.marketVisible=marketVisible;
  report.equalWorldLifeWidth=!mobileWidth()||!statusVisible||Boolean(report.worldHud&&report.lifeHud&&Math.abs(report.worldHud.width-report.lifeHud.width)<2);
  report.statusBelowMarket=!mobileWidth()||!statusVisible||!marketVisible||Boolean(report.marketHud&&report.worldHud&&report.lifeHud&&report.worldHud.top>=report.marketHud.bottom+8&&report.lifeHud.top>=report.marketHud.bottom+8);
  report.mapBelowStatus=!mobileWidth()||!statusVisible||Boolean(report.worldHud&&report.lifeHud&&report.minimap&&report.minimap.top>=Math.max(report.worldHud.bottom,report.lifeHud.bottom)+8);
  report.overlaps={joyRail:overlap(report.joy,report.axisRail),warpLots:overlap(report.warp,report.lots),lotsRail:overlap(report.lots,report.axisRail),warpRail:overlap(report.warp,report.axisRail),railDock:overlap(report.axisRail,report.dock),attackWarp:overlap(report.attack,report.warp),orderLots:overlap(report.order,report.lots),worldLife:overlap(report.worldHud,report.lifeHud),marketWorld:overlap(report.marketHud,report.worldHud),marketLife:overlap(report.marketHud,report.lifeHud),worldMap:overlap(report.worldHud,report.minimap),lifeMap:overlap(report.lifeHud,report.minimap),chatMaster:overlap(report.chat,report.masterCollapse)};
  report.collapsed=hudCollapsed();report.paramsHidden=paramsHidden();report.settingsOpen=document.documentElement.classList.contains('k11520SettingsOpen');
  report.compact=compactHud();report.floatingActive=$('#joy')?.dataset.k11520FloatingActive==='1';
  // A compact summary is intentionally not the equal-width diagnostic cards.
  // Measure its actual visible edge organs; hidden rails retain their values.
  const compactSelectors=['.axes','.tele','.monsterHud','#k11520MonsterGuide','#k11520MovePlane','#k11520MarketRow','#k11520UtilityMaster','#attack','#skill','#dodge','#tradeSword','#orderFire','#flat','#yControl','#cControl','#lotsControl'];
  const compactBoxes=compactSelectors.filter(isVisible).map(selector=>({selector,rect:rect(selector)}));
  report.compactContained=compactBoxes.every(({rect:r})=>r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight);
  report.compactOverlaps=[];for(let i=0;i<compactBoxes.length;i++)for(let j=i+1;j<compactBoxes.length;j++)if(overlap(compactBoxes[i].rect,compactBoxes[j].rect))report.compactOverlaps.push([compactBoxes[i].selector,compactBoxes[j].selector]);
  report.compactTouchTargets=compactBoxes.filter(({selector})=>!['.axes','.tele','.monsterHud','#k11520MonsterGuide','#yControl','#cControl','#lotsControl'].includes(selector)).every(({rect:r})=>r.width>=44&&r.height>=44);
  const fullGeometry=!mobileWidth()||(report.paramsHidden||report.axisRailCentered&&report.axisEnergyGeometryAligned&&report.threeRailAligned)&&report.equalWorldLifeWidth&&report.statusBelowMarket&&report.mapBelowStatus&&Object.values(report.overlaps).every(v=>!v);
  report.ok=report.collapsed||report.settingsOpen||(report.compact?report.compactContained&&report.compactTouchTargets&&report.compactOverlaps.length===0:fullGeometry);
  document.documentElement.dataset.k11520MobileControlLayout=report.ok?'PASS':'RED';
  return report;
}
function installGuard(){
  try{guard?.disconnect()}catch{}
  const roots=[$('#yControl'),$('#cControl'),$('#lotsControl'),$('#walletPanel'),$('#chatHandle'),$('#aiChatButton'),$('#bgmButton'),$('.bagRelocatedV250'),$('#dock')].filter(Boolean);if(roots.length){let busy=false;guard=new MutationObserver(()=>{if(busy||!mobileWidth())return;busy=true;applyRail();applyRightOrgans();queueMicrotask(()=>{busy=false})});for(const root of roots)guard.observe(root,{attributes:true,attributeFilter:['style','class']})}
  timers.forEach(clearTimeout);timers=[];for(const delay of [0,90,240,520,1100,1900,2600])timers.push(setTimeout(apply,delay));
}
function syncHeaderFlow(){
  const root=document.documentElement,landscape=globalThis.matchMedia?.('(orientation:landscape) and (max-height:600px)').matches;
  if(hudCollapsed()||root.classList.contains('k11520SettingsOpen')||(!mobileWidth()&&!landscape))return;
  const box=el=>{if(!el||el.hidden)return null;const style=getComputedStyle(el);if(style.display==='none'||style.visibility==='hidden')return null;const r=el.getBoundingClientRect();return Number.isFinite(r.top)&&Number.isFinite(r.bottom)&&r.height>0?r:null};
  const stamp=box($('#k11520BuildStamp')),brand=$('.brand'),title=$('.brand .hqLine')||brand,at=box(title);if(!stamp||!box(brand)||!at)return;
  const put=(key,n)=>{const value=n+'px';if(root.style.getPropertyValue(key)!==value)root.style.setProperty(key,value)};
  const portrait=globalThis.matchMedia?.('(orientation: portrait)').matches;
  if(!portrait){
    const previous=parseFloat(root.style.getPropertyValue('--k11520-brand-offset'))||0,baseTop=at.top-previous;
    put('--k11520-brand-offset',Math.max(0,Math.ceil(stamp.bottom+4-baseTop)));
  }
  const headerBottom=box($('.top'))?.bottom||0;
  if(portrait)put('--k11520-portrait-disclosure-top',Math.max(68,Math.ceil(headerBottom+6)));
  const disclosureBottom=portrait?Math.max(box($('#k11520ControlsClose'))?.bottom||0,box($('#k11520MarketRow'))?.bottom||0):0;
  const contentBottom=Math.max(headerBottom,box(brand)?.bottom||0,box(title)?.bottom||0,disclosureBottom);
  put('--k11520-market-top',Math.max(landscape?54:116,Math.ceil(contentBottom+8)));
}
// Only the compact landscape presentation follows the actual guide bounds.
// Keep the camera owner, Recenter control, zoom text and 1500ms timer intact.
function syncCompactCameraStatus(){
  const root=document.documentElement,leftKey='--k11520-compact-zoom-left',topKey='--k11520-compact-zoom-top';
  const reset=()=>{root.style.removeProperty(leftKey);root.style.removeProperty(topKey)};
  if(!compactHud()||!globalThis.matchMedia?.('(orientation:landscape) and (max-height:600px)').matches){reset();return}
  const guide=$('#k11520MonsterGuide'),status=$('#k11520CameraZoomStatus');
  if(!guide||!status||!guide.getClientRects().length){reset();return}
  const style=getComputedStyle(guide),g=guide.getBoundingClientRect(),s=status.getBoundingClientRect();
  if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)===0||!(g.width>0&&g.height>0&&s.width>0&&s.height>0)){reset();return}
  const gap=8,inset=6,right={x:g.right+gap,y:g.top+Math.max(0,(g.height-s.height)/2)},below={x:Math.max(inset,Math.min(innerWidth-inset-s.width,g.left)),y:g.bottom+gap};
  const fits=p=>p.x>=inset&&p.y>=inset&&p.x+s.width<=innerWidth-inset&&p.y+s.height<=innerHeight-inset;
  const position=fits(right)?right:fits(below)?below:null;
  if(!position){reset();return}
  for(const [key,n] of [[leftKey,position.x],[topKey,position.y]]){const value=n+'px';if(root.style.getPropertyValue(key)!==value)root.style.setProperty(key,value)}
}
function syncStatusFlow(){
  syncHeaderFlow();
  syncCompactCameraStatus();
  const root=document.documentElement;
  if(hudCollapsed()||root.classList.contains('k11520SettingsOpen'))return;
  if(onDemand()&&!root.classList.contains('k11520InfoOpen')&&!root.classList.contains('k11520TradeOpen'))return;
  const landscape=globalThis.matchMedia?.('(orientation:landscape) and (max-height:600px)').matches;
  if(!mobileWidth()&&!landscape)return;
  const visibleRect=el=>{if(!el||el.hidden)return null;const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden')return null;const r=el.getBoundingClientRect();return Number.isFinite(r.bottom)&&r.height>0?r:null};
  const put=(key,n)=>{const value=`${n}px`;if(root.style.getPropertyValue(key)!==value)root.style.setProperty(key,value)};
  const market=visibleRect($('.axes')),hud=[$('.tele'),$('.monsterHud')].filter(el=>visibleRect(el));
  const bottom=Math.max(landscape?128:174,market?.bottom||0),top=Math.max(landscape?136:190,Math.ceil(bottom+(landscape?8:10)));
  if(landscape)put('--k11520-landscape-status-top',top);
  else{
    const height=Math.max(108,...hud.map(el=>{const r=el.getBoundingClientRect();return Math.ceil(Math.max(r.top,...[...el.children].map(c=>c.getBoundingClientRect().bottom))-r.top+9)}));
    put('--k11520-status-top',top);put('--k11520-status-height',height);
  }
  // Read the resulting HUD bounds, including its actual border/padding. Only
  // overlay variables change; canvas and movement/C/lots anchors stay fixed.
  const statusBottom=Math.max(top,...hud.map(el=>visibleRect(el)?.bottom||top)),guideTop=Math.ceil(statusBottom+8);
  put(landscape?'--k11520-landscape-guide-top':'--k11520-guide-top',guideTop);
  const guide=visibleRect($('#k11520MonsterGuide')),guideHeight=Math.max(44,guide?.height||0);
  if(!landscape)put('--k11520-map-top',Math.ceil(guideTop+guideHeight+10));
}
function observeFlowRoots(){
  if(!flowObserver)return;
  for(const el of [$('.axes'),$('.tele'),$('.monsterHud'),$('#k11520MonsterGuide'),$('#k11520BuildStamp'),$('.top'),$('.brand')].filter(Boolean)){
    if(flowObserved.has(el))continue;
    flowObserver.observe(el);flowObserved.add(el);
  }
}
export function install11520MobileControlLayout(){
  apply();
  if(booted){observeFlowRoots();return globalThis.__K11520_MOBILE_CONTROL_LAYOUT__}
  booted=true;installGuard();addEventListener('resize',apply,{passive:true});
  if(typeof ResizeObserver==='function'){
    flowObserver=new ResizeObserver(()=>{syncStatusFlow();globalThis.__K11520_MOBILE_CONTROL_LAYOUT__=measure()});
    observeFlowRoots();
  }
  return globalThis.__K11520_MOBILE_CONTROL_LAYOUT__;
}
// Restore current values through the same rail owner; never replay old geometry
// or reset the canonical C/lots/XYZ values after a Settings close.
if(typeof document!=='undefined')document.addEventListener('k11520:settings-context',()=>{applyRail();syncStatusFlow();globalThis.__K11520_MOBILE_CONTROL_LAYOUT__=measure()});
if(typeof document!=='undefined')for(const type of ['k11520:movement-context','k11520:hud-context'])document.addEventListener(type,()=>{applyRail();syncStatusFlow();globalThis.__K11520_MOBILE_CONTROL_LAYOUT__=measure()});
export function get11520MobileControlLayout(){return measure()}
