/* KGEN_META
VERSION: 1.2.0
STATUS: ACTIVE
PURPOSE: Visual-only 11520 avatar-facing and locomotion presentation. Keep canonical XYZ and heading semantics unchanged while compensating the mirrored-X presentation and making XZ ground locomotion visually distinct from XY flight/hover locomotion.
*/
import * as THREE from 'three';

const plane=()=>document.documentElement?.dataset?.k11520JoyPlane==='XY'?'XY':'XZ';
const motionInput=()=>globalThis.__K11520_JOYSTICK_XZXY__?.input||{active:false};
function playerAncestor(root){let n=root;while(n){if(n?.userData?.isPlayer)return n;n=n.parent}return null}
function clipName(action){try{return action?.getClip?.()?.name||''}catch{return''}}

export function install11520AvatarFacingCorrection(){
  const proto=THREE.Object3D.prototype;
  if(!proto.__k11520AvatarFacingCorrectionV3){
    const nextUpdateMatrixWorld=proto.updateMatrixWorld;
    proto.updateMatrixWorld=function(force){
      if(!this?.userData?.isPlayer||!this.rotation)return nextUpdateMatrixWorld.call(this,force);
      const originalYaw=this.rotation.y,originalPitch=this.rotation.x,originalY=this.position?.y;
      const xy=plane()==='XY';
      try{
        // Keep simulation XYZ/heading untouched. Only the rendered player matrix is corrected.
        this.rotation.y=-originalYaw;
        if(xy){
          this.rotation.x=-Math.PI/10;
          if(this.position&&Number.isFinite(originalY))this.position.y=originalY+.09+Math.sin(performance.now()/180)*.035;
        }
        this.userData.k11520Motion=xy?'FLIGHT':'GROUND';
        document.documentElement.dataset.k11520AvatarMotion=xy?'FLIGHT':'GROUND';
        return nextUpdateMatrixWorld.call(this,force);
      }finally{
        this.rotation.y=originalYaw;
        this.rotation.x=originalPitch;
        if(this.position&&Number.isFinite(originalY))this.position.y=originalY;
      }
    };
    proto.__k11520AvatarFacingCorrectionV3=true;
  }

  const mixerProto=THREE.AnimationMixer.prototype;
  if(!mixerProto.__k11520GroundFlightSplit){
    const nextMixerUpdate=mixerProto.update;
    mixerProto.update=function(dt){
      const result=nextMixerUpdate.call(this,dt);
      const player=playerAncestor(this.getRoot?.());
      if(!player)return result;
      const actions=this._actions||[],xy=plane()==='XY';
      const locomotion=actions.filter(a=>/walk|run/i.test(clipName(a)));
      const idle=actions.find(a=>/idle/i.test(clipName(a)));
      const attackActive=actions.some(a=>/attack|slash|sword/i.test(clipName(a))&&a.isRunning?.()&&a.getEffectiveWeight?.()>.05);
      if(xy){
        for(const a of locomotion)a.setEffectiveWeight?.(0);
        if(idle&&!attackActive){idle.enabled=true;idle.play?.();idle.setEffectiveWeight?.(1)}
        this.__k11520FlightOverride=true;
      }else if(this.__k11520FlightOverride){
        const moving=!!motionInput().active;
        for(const a of locomotion)a.setEffectiveWeight?.(moving?1:0);
        if(idle){idle.enabled=true;idle.play?.();idle.setEffectiveWeight?.(moving?0:1)}
        this.__k11520FlightOverride=false;
      }
      return result;
    };
    mixerProto.__k11520GroundFlightSplit=true;
  }

  globalThis.__K11520_AVATAR_FACING__={version:'1.2.0',scope:'player-matrix-and-locomotion-presentation',canonicalCoordinatesUntouched:true,xPositive:'screen-right',xNegative:'screen-left',ground:'XZ',flight:'XY'};
  return true;
}
