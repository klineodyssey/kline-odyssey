/* KGEN_META
VERSION: 1.1.0
STATUS: ACTIVE
PURPOSE: Visual-only 11520 avatar-facing correction. Keep canonical XYZ and heading semantics unchanged while compensating the mirrored-X presentation so X+ faces screen-right and X- faces screen-left.
*/
import * as THREE from 'three';

export function install11520AvatarFacingCorrection(){
  const proto=THREE.Object3D.prototype;
  if(proto.__k11520AvatarFacingCorrectionV2)return true;
  const nextUpdateMatrixWorld=proto.updateMatrixWorld;
  proto.updateMatrixWorld=function(force){
    if(!this?.userData?.isPlayer||!this.rotation)return nextUpdateMatrixWorld.call(this,force);
    const originalYaw=this.rotation.y;
    try{
      // game-5d-main keeps canonical movement heading in simulation and assigns
      // the avatar the opposite yaw. The canvas is then mirrored on X. Reflect
      // only the player's visual yaw while its world matrix is built so ±X face
      // the same screen direction as motion; ±Z remain visually unchanged.
      this.rotation.y=-originalYaw;
      return nextUpdateMatrixWorld.call(this,force);
    }finally{
      this.rotation.y=originalYaw;
    }
  };
  proto.__k11520AvatarFacingCorrectionV2=true;
  globalThis.__K11520_AVATAR_FACING__={version:'1.1.0',scope:'player-matrix-only',canonicalCoordinatesUntouched:true,xPositive:'screen-right',xNegative:'screen-left'};
  return true;
}
