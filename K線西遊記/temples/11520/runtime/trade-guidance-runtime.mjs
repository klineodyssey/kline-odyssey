export const TRADE_GUIDE_STATE = Object.freeze({IDLE:'IDLE',PREVIEW:'PREVIEW',CONFIRMING:'CONFIRMING',SUBMITTED:'SUBMITTED',FILLED:'FILLED',REJECTED:'REJECTED',CLOSED:'CLOSED',LIQUIDATED:'LIQUIDATED'});

export function buildOrderSpeech({stage,axis,symbol,side,lots,c,margin,freeKgen,pnl,maxAdversePoints,reason}){
  const m=Number(margin||0).toFixed(4), f=Number(freeKgen||0).toFixed(4), p=Number(pnl||0).toFixed(4);
  const speed=Number(c||0),risk=Number.isFinite(Number(maxAdversePoints))?`，理論反向 ${Number(maxAdversePoints).toLocaleString()} 點本金歸零`:'，零 C 不產生交易損益';
  if(stage===TRADE_GUIDE_STATE.PREVIEW)return `${axis} ${symbol}，${side}，${lots}口，曲速 ${speed} C。本金與保證金 ${m} KGEN。每點損益等於 ${lots} 乘 ${speed} KGEN${risk}。確認後才會進入送單程序。`;
  if(stage===TRADE_GUIDE_STATE.CONFIRMING)return `請再次確認 ${axis} ${symbol} ${side} ${lots}口，${speed} C，本金 ${m} KGEN。取消不會改變任何資產。`;
  if(stage===TRADE_GUIDE_STATE.SUBMITTED)return `訂單已送出，正在等待可驗證的成交結果。`;
  if(stage===TRADE_GUIDE_STATE.FILLED)return `${axis} ${symbol} 已成交，${side} ${lots}口，${speed} C。已鎖定 ${m} KGEN 本金保證金。`;
  if(stage===TRADE_GUIDE_STATE.REJECTED)return `訂單未成交。${reason||'請檢查 KGEN 餘額、行情、網路或交易規則。'}`;
  if(stage===TRADE_GUIDE_STATE.LIQUIDATED)return `本金已耗盡，部位已歸零清算。本單最大損失限制在 ${m} KGEN。`;
  if(stage===TRADE_GUIDE_STATE.CLOSED)return `部位已平倉，已實現損益 ${p} KGEN。剩餘本金已回到可用餘額。`;
  return '';
}

export function speakTrade(text,{enabled=true,lang='zh-TW',rate=1,pitch=1}={}){
  if(!enabled||!text||typeof window==='undefined'||!('speechSynthesis' in window))return {ok:false,reason:'SPEECH_UNAVAILABLE'};
  window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=rate;u.pitch=pitch;window.speechSynthesis.speak(u);return {ok:true};
}

export function visualTradeState(stage){
  const table={IDLE:{icon:'⚔️',label:'待命',tone:'neutral'},PREVIEW:{icon:'👁️',label:'預覽',tone:'info'},CONFIRMING:{icon:'🛡️',label:'等待確認',tone:'warning'},SUBMITTED:{icon:'📡',label:'送單中',tone:'info'},FILLED:{icon:'✅',label:'已成交',tone:'success'},REJECTED:{icon:'⛔',label:'未成交',tone:'danger'},CLOSED:{icon:'🏁',label:'已平倉',tone:'success'},LIQUIDATED:{icon:'💥',label:'本金歸零',tone:'danger'}};
  return table[stage]||table.IDLE;
}

export const CUSTOMER_SERVICE_TOPICS = Object.freeze({
  QUICK_START:'可以用走路取經的速度玩 5D 世界，不需要交易。要交易時先連錢包、確認 BSC 與 KGEN 真實餘額，再選 KX、KY 或 KZ、方向、口數與 C。',
  KGEN_ACCOUNT:'KGEN 錢包總額不是全部自動變成保證金。每一張訂單下幾口，就鎖幾 KGEN 作為該單本金保證金；未使用的 KGEN 保持可用。',
  LEVERAGE:'11520 的槓桿是 C 曲速。C 不降低本金。下 100 口就需要 100 KGEN 本金；損益 = 價差 × 口數 × C。1C 時反向 1 點本金歸零，0.001C 時理論反向 1000 點本金歸零。',
  K_AXES:'KX、KY、KZ 是三個獨立交易軸，各自保留市場、方向、口數、C、委託與持倉狀態，互不覆蓋。',
  ORDER_FLOW:'下單流程是設定 → Preview → Confirm → Submit → Fill/Reject。取消 Preview 或 Confirm 不得改變 KGEN 或持倉。',
  WALLET:'錢包連線目前直接讀 BSC 地址、BNB 與正式 KGEN ERC-20 真實餘額。11520 衍生交易送鏈只會在 Settlement 合約地址、ABI、保證金 custody 與 receipt 規則驗證完成後啟用。',
  RISK:'C 是損益速度，不是本金折扣。單筆最大損失限制在該筆本金；本金耗盡即清算，不再向錢包追繳本單之外的 KGEN。100 倍額外燃料門檻目前尚未鎖定，因此不會偷偷強制。'
});

export function answerCustomerService(topic){return CUSTOMER_SERVICE_TOPICS[topic]||'請選擇：快速開始、KGEN 帳戶、C 曲速、KX/KY/KZ、下單流程、錢包或風險。';}
