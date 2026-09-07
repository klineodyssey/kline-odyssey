/* KGEN_META
VERSION: 1.3.3
STATUS: ACTIVE
PURPOSE: Visual-only 11520 avatar-facing and locomotion presentation. Keep canonical XYZ and heading semantics unchanged, center the original 3D character visual pivot, keep its animated silhouette framed during facing turns, compensate mirrored-X presentation, and distinguish XZ ground locomotion from XY / YZ flight presentation.
*/
import * as THREE from 'three';

const plane=()=>{const v=document.documentElement?.dataset?.k11520JoyPlane;return v==='XY'||v==='YZ'?v:'XZ'};
const motionInput=()=>globalThis.__K11520_3D_CONTROL__?.vector||globalThis.__K11520_JOYSTICK_XZXY__?.vector||{x:0,y:0,z:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function playerAncestor(root){let n=root;while(n){if(n?.userData?.isPlayer)return n;n=n.parent}return null}
function clipName(action){try{return action?.getClip?.()?.name||''}catch{return''}}
function centerPlayerVisual(child){
  if(!child||child.userData?.k11520PivotCentered)return child;
  try{
    child.updateMatrixWorld?.(true);
    const box=new THREE.Box3().setFromObject(child);
    if(!box.isEmpty()){
      const center=box.getCenter(new THREE.Vector3());
      if(Number.isFinite(center.x))child.position.x-=center.x;
      if(Number.isFinite(center.z))child.position.z-=center.z;
    }
    child.userData.k11520PivotCentered=true;
  }catch{}
  return child;
}
function findPlayer(scene){let found=null;try{scene?.traverse?.(n=>{if(!found&&n?.userData?.isPlayer)found=n})}catch{}return found}

export function install11520AvatarFacingCorrection(){
  const proto=THREE.Object3D.prototype;
  if(!proto.__k11520PlayerVisualPivotV1){
    const nextAdd=proto.add;
    proto.add=function(...objects){
      if(this?.userData?.isPlayer)for(const obj of objects)centerPlayerVisual(obj);
      return nextAdd.apply(this,objects);
    };
    proto.__k11520PlayerVisualPivotV1=true;
  }

  if(!proto.__k11520AvatarFacingCorrectionV4){
    const nextUpdateMatrixWorld=proto.updateMatrixWorld;
    proto.updateMatrixWorld=function(force){
      if(!this?.userData?.isPlayer||!this.rotation)return nextUpdateMatrixWorld.call(this,force);
      const originalYaw=this.rotation.y,originalPitch=this.rotation.x,originalRoll=this.rotation.z,originalY=this.position?.y,p=plane();
      try{
        this.rotation.y=-originalYaw;
        if(p==='XY'){
          this.rotation.x=-Math.PI/10;
          if(this.position&&Number.isFinite(originalY))this.position.y=originalY+.09+Math.sin(performance.now()/180)*.035;
        }else if(p==='YZ'){
          this.rotation.x=-Math.PI/14;
          this.rotation.z=Math.PI/12;
          if(this.position&&Number.isFinite(originalY))this.position.y=originalY+.11+Math.sin(performance.now()/170)*.04;
        }
        const visual=p==='XZ'?'GROUND':p==='XY'?'FLIGHT_XY':'FLIGHT_YZ';
        this.userData.k11520Motion=visual;
        document.documentElement.dataset.k11520AvatarMotion=visual;
        return nextUpdateMatrixWorld.call(this,force);
      }finally{
        this.rotation.y=originalYaw;this.rotation.x=originalPitch;this.rotation.z=originalRoll;
        if(this.position&&Number.isFinite(originalY))this.position.y=originalY;
      }
    };
    proto.__k11520AvatarFacingCorrectionV4=true;
  }

  const rendererProto=THREE.WebGLRenderer.prototype;
  if(!rendererProto.__k11520AvatarFrameV2){
    const nextRender=rendererProto.render;
    rendererProto.render=function(scene,camera){
      const player=findPlayer(scene);if(!player||!camera?.position)return nextRender.call(this,scene,camera);
      const original=camera.position.clone();
      try{
        scene.updateMatrixWorld?.(true);
        const box=new THREE.Box3().setFromObject(player);
        if(!box.isEmpty()){
          const center=box.getCenter(new THREE.Vector3()),dx=center.x-player.position.x,dz=center.z-player.position.z,expectedY=player.position.y+.8,dy=center.y-expectedY;
          if(Number.isFinite(dx))camera.position.x+=clamp(dx,-8,8);
          if(Number.isFinite(dz))camera.position.z+=clamp(dz,-8,8);
          if(Number.isFinite(dy))camera.position.y+=clamp(dy,-4,4);
        }
        return nextRender.call(this,scene,camera);
      }finally{camera.position.copy(original)}
    };
    rendererProto.__k11520AvatarFrameV2=true;
  }

  const mixerProto=THREE.AnimationMixer.prototype;
  if(!mixerProto.__k11520GroundFlightSplitV2){
    const nextMixerUpdate=mixerProto.update;
    mixerProto.update=function(dt){
      const result=nextMixerUpdate.call(this,dt),player=playerAncestor(this.getRoot?.());if(!player)return result;
      const actions=this._actions||[],p=plane(),flight=p!=='XZ',locomotion=actions.filter(a=>/walk|run/i.test(clipName(a))),idle=actions.find(a=>/idle/i.test(clipName(a))),attackActive=actions.some(a=>/attack|slash|sword/i.test(clipName(a))&&a.isRunning?.()&&a.getEffectiveWeight?.()>.05);
      if(flight){
        for(const a of locomotion)a.setEffectiveWeight?.(0);
        if(idle&&!attackActive){idle.enabled=true;idle.play?.();idle.setEffectiveWeight?.(1)}
        this.__k11520FlightOverride=true;
      }else if(this.__k11520FlightOverride){
        const v=motionInput(),moving=Math.abs(v.x||0)+Math.abs(v.z||0)>.03;
        for(const a of locomotion)a.setEffectiveWeight?.(moving?1:0);
        if(idle){idle.enabled=true;idle.play?.();idle.setEffectiveWeight?.(moving?0:1)}
        this.__k11520FlightOverride=false;
      }
      return result;
    };
    mixerProto.__k11520GroundFlightSplitV2=true;
  }

  globalThis.__K11520_AVATAR_FACING__={version:'1.3.3',scope:'player-pivot-frame-matrix-and-locomotion-presentation',canonicalCoordinatesUntouched:true,pivotCentered:true,visualBoundsFramed:true,xPositive:'screen-right',xNegative:'screen-left',ground:'XZ',flight:['XY','YZ']};
  return true;
}
