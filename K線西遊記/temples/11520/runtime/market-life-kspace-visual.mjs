/*
KGEN_META
VERSION: 1.0.0
REVISION: 2026-09-04.KSPACE-VISUAL
STATUS: ACTIVE
SOURCE_OF_TRUTH: MARKET_LIFE_AI_SPEC.md
CHANGE_REASON: Make KX/KY/KZ market direction, capital, vitality and lifecycle one-glance visual state.
*/

const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));

export const KSPACE_VECTORS=Object.freeze({
  KX:Object.freeze({PLUS:Object.freeze({x:1,y:0,z:0,label:'左→右'}),MINUS:Object.freeze({x:-1,y:0,z:0,label:'右→左'})}),
  KY:Object.freeze({PLUS:Object.freeze({x:0,y:1,z:0,label:'下→上'}),MINUS:Object.freeze({x:0,y:-1,z:0,label:'上→下'})}),
  KZ:Object.freeze({PLUS:Object.freeze({x:0,y:0,z:1,label:'近→遠'}),MINUS:Object.freeze({x:0,y:0,z:-1,label:'遠→近'})}),
});

export function sideSign(side){
  const s=String(side??'').trim().toUpperCase();
  if(['+','LONG','BUY','多','1'].includes(s))return 1;
  if(['-','SHORT','SELL','空','-1'].includes(s))return -1;
  return 0;
}

export function vectorForAxis(axis,side){
  const sign=sideSign(side);if(!sign)return null;
  const row=KSPACE_VECTORS[String(axis||'').toUpperCase()];if(!row)return null;
  return sign>0?{axis,sign,side:'+',...row.PLUS}:{axis,sign,side:'-',...row.MINUS};
}

export function buildAxisVisualState({KX=null,KY=null,KZ=null}={}){
  const src={KX,KY,KZ};
  const out={};
  for(const axis of ['KX','KY','KZ']){
    const p=src[axis];
    const v=vectorForAxis(axis,p?.side);
    out[axis]={axis,market:p?.market||null,lots:Number(p?.lots)||0,c:Number(p?.c)||0,side:v?.side||'0',vector:v};
  }
  return out;
}

export function buildLifeVisualSnapshot(life,{relations=null}={}){
  const vitality=clamp(life?.vitality,0,100);
  const capital=Math.max(0,Number(life?.capital)||0);
  const startingCapital=Math.max(0,Number(life?.startingCapital)||0);
  const capitalRatio=startingCapital>0?clamp(capital/startingCapital,0,1):0;
  const axes=buildAxisVisualState(life?.positions||{});
  const lifecycle=String(life?.state||'ALIVE').toUpperCase();
  const visibleInBattle=!['NAIHE','MENGPO_RECOVERY'].includes(lifecycle);
  const alive=!['DEAD','NAIHE','MENGPO_RECOVERY'].includes(lifecycle)&&vitality>0;
  return {
    lifeId:life?.lifeId||null,
    name:life?.name||life?.lifeId||'MARKET_LIFE',
    lifecycle,
    alive,
    visibleInBattle,
    vitality,
    vitalityRatio:vitality/100,
    capital,
    startingCapital,
    capitalRatio,
    bankrupt:capital<=0,
    strategy:life?.strategy||'HOLD',
    confidence:clamp(life?.confidence,0,1),
    intelligence:Number(life?.intelligence)||1,
    marketDimensions:[...(life?.marketDimensions||[])],
    axes,
    relations:relations||null,
    appearance:lifecycle==='REBIRTH'?'REBIRTH_FLASH':lifecycle==='DEAD'?'DEATH':lifecycle==='NAIHE'?'NAIHE_GHOST':lifecycle==='MENGPO_RECOVERY'?'MENGPO_RECOVERY':lifecycle==='RETREATING'?'RETREAT':'PRESENT',
  };
}

export function oneGlanceLabel(snapshot){
  const axes=['KX','KY','KZ'].map(a=>`${a}${snapshot.axes?.[a]?.side||'0'}`).join(' ');
  const cap=`KGEN ${snapshot.capital.toFixed(1)}`;
  const hp=`HP ${snapshot.vitality.toFixed(0)}`;
  return `${snapshot.name}｜${axes}｜${hp}｜${cap}｜${snapshot.lifecycle}`;
}
