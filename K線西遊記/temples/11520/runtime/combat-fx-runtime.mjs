/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE
FORMAL_ORGAN_NAME: Combat FX Runtime
PURPOSE: Presentation-only 3D slash, spark, flash, camera-shake and audio feedback for immediate combat actions. No trade, wallet, settlement, payment, treasury, governance or chain authority.
*/
export function create11520CombatFx(THREE,{scene,camera,avatar}={}){
  if(!THREE||!scene||!camera||!avatar)return {trigger(){},tick(){},applyCameraShake(){}};
  let audio=null,shakeUntil=0,shakePower=0,flash=null;
  const dustCount=64,dustGeo=new THREE.BufferGeometry(),dustPos=new Float32Array(dustCount*3);
  for(let i=0;i<dustCount;i++){dustPos[i*3]=(Math.random()-.5)*36;dustPos[i*3+1]=.4+Math.random()*5;dustPos[i*3+2]=(Math.random()-.5)*36}
  dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPos,3));
  const dustMat=new THREE.PointsMaterial({size:.055,color:0x8defff,transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending});
  const dust=new THREE.Points(dustGeo,dustMat);scene.add(dust);
  function ensureFlash(){if(typeof document==='undefined')return null;if(flash&&document.body.contains(flash))return flash;flash=document.createElement('div');flash.id='k11520CombatFlash';flash.style.cssText='position:fixed;z-index:6400;inset:0;pointer-events:none;opacity:0;background:radial-gradient(circle at 50% 62%,rgba(255,238,153,.40),rgba(104,228,255,.14) 24%,transparent 62%);mix-blend-mode:screen;transition:opacity .11s ease-out';document.body.appendChild(flash);return flash}
  function sound(power=1){try{const C=globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;if(!audio)audio=new C();audio.resume?.();const now=audio.currentTime,g=audio.createGain(),o=audio.createOscillator(),o2=audio.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(190+power*50,now);o.frequency.exponentialRampToValueAtTime(70,now+.16);o2.type='sine';o2.frequency.setValueAtTime(620+power*180,now);o2.frequency.exponentialRampToValueAtTime(180,now+.12);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.035*power,now+.012);g.gain.exponentialRampToValueAtTime(.0001,now+.19);o.connect(g);o2.connect(g);g.connect(audio.destination);o.start(now);o2.start(now);o.stop(now+.2);o2.stop(now+.2)}catch{}}
  function trigger({variant='hit',heading=0}={}){
    const power=variant==='power'?1.35:variant==='burst'?1.65:1;
    const root=new THREE.Group(),forward=new THREE.Vector3(Math.sin(heading),0,Math.cos(heading));
    root.position.copy(avatar.position).addScaledVector(forward,.8);root.position.y+=1.05;root.rotation.y=heading;scene.add(root);
    const arcMat=new THREE.MeshBasicMaterial({color:variant==='burst'?0xffd36a:0x7deaff,transparent:true,opacity:.96,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
    const arc=new THREE.Mesh(new THREE.TorusGeometry(1.05*power,.045*power,6,42,Math.PI*1.35),arcMat);arc.rotation.set(Math.PI/2,.25,-.55);root.add(arc);
    const light=new THREE.PointLight(variant==='burst'?0xffc85e:0x65eaff,5.5*power,7);root.add(light);
    const sparks=[];for(let i=0;i<22;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.025+Math.random()*.035,5,4),new THREE.MeshBasicMaterial({color:i%3?0x8eefff:0xffdd75,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending}));m.position.set((Math.random()-.5)*.5,(Math.random()-.5)*.55,(Math.random()-.5)*.35);m.userData.v=new THREE.Vector3((Math.random()-.5)*3.2,(Math.random()*.9+.15)*2.2,(Math.random()-.5)*3.2);root.add(m);sparks.push(m)}
    const start=performance.now(),life=330*power;shakeUntil=start+190;shakePower=.035*power;const f=ensureFlash();if(f){f.style.opacity=String(.6*Math.min(1,power));setTimeout(()=>{if(f)f.style.opacity='0'},45)}
    sound(power);
    const animate=now=>{const t=Math.min(1,(now-start)/life),dt=.016;arc.scale.setScalar(.7+t*.8);arc.material.opacity=1-t;arc.rotation.z=-.55+t*1.45;light.intensity=(1-t)*5.5*power;for(const s of sparks){s.position.addScaledVector(s.userData.v,dt);s.userData.v.y-=3.2*dt;s.material.opacity=1-t}if(t<1)requestAnimationFrame(animate);else{scene.remove(root);arc.geometry.dispose();arc.material.dispose();for(const s of sparks){s.geometry.dispose();s.material.dispose()}}};requestAnimationFrame(animate);
    globalThis.__K11520_COMBAT_FX__={variant,power,at:Date.now(),presentationOnly:true};
  }
  function tick(now,pos){dust.rotation.y=now*.000018;dust.position.x=Number(pos?.x)||0;dust.position.z=Number(pos?.z)||0;dustMat.opacity=.22+.08*Math.sin(now*.0012)}
  function applyCameraShake(now){if(now>=shakeUntil)return;const k=(shakeUntil-now)/190*shakePower;camera.position.x+=(Math.random()-.5)*k;camera.position.y+=(Math.random()-.5)*k*.7;camera.position.z+=(Math.random()-.5)*k}
  return {trigger,tick,applyCameraShake};
}
