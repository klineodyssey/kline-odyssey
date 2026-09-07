/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
PURPOSE: Visual-only 11520 avatar-facing correction. Keep canonical XYZ and heading semantics unchanged while compensating the mirrored-X presentation so X+ faces screen-right and X- faces screen-left.
*/
import * as THREE from 'three';

export function install11520AvatarFacingCorrection(){
  const proto=THREE.WebGLRenderer.prototype;
  if(proto.__k11520AvatarFacingCorrectionV1)return true;
  const nextRender=proto.render;
  proto.render=function(scene,camera){
    let player=null,originalYaw=null;
    try{
      scene?.traverse?.(o=>{if(!player&&o?.userData?.isPlayer)player=o});
      if(player?.rotation){
        originalYaw=player.rotation.y;
        // Reflect only the visual X-facing component before the existing render
        // pipeline. For ±X this reverses the visible face; for ±Z it preserves
        // the current appearance. Simulation heading/XYZ are restored untouched.
        player.rotation.y=-originalYaw;
      }
    }catch{}
    try{return nextRender.call(this,scene,camera)}finally{
      if(player?.rotation&&originalYaw!==null)player.rotation.y=originalYaw;
    }
  };
  proto.__k11520AvatarFacingCorrectionV1=true;
  globalThis.__K11520_AVATAR_FACING__={version:'1.0.0',scope:'render-only',canonicalCoordinatesUntouched:true,xPositive:'screen-right',xNegative:'screen-left'};
  return true;
}
