import * as THREE from 'three';
import {decorateLegacyMarketLifeMesh} from './life-visual-factory.mjs';

const FLAG='__k11520LifeVisualBootstrap';

export function installLifeVisualBootstrap(){
  if(THREE.Scene.prototype[FLAG])return {ok:true,alreadyInstalled:true};
  const originalAdd=THREE.Scene.prototype.add;
  THREE.Scene.prototype.add=function(...objects){
    for(const obj of objects){
      try{
        const isLegacyRock=obj?.isMesh&&obj.geometry?.type==='DodecahedronGeometry'&&obj.material?.color?.getHex?.()===0x7b2025;
        if(isLegacyRock)decorateLegacyMarketLifeMesh(obj,{species:'DIGITAL_ANT_MARKET_LIFE'});
      }catch{}
    }
    return originalAdd.apply(this,objects);
  };
  THREE.Scene.prototype[FLAG]=true;
  return {ok:true};
}

installLifeVisualBootstrap();
