/* KGEN_META
STATUS: ACTIVE
FORMAL_ORGAN_NAME: XYZ Input Authority
PURPOSE: Keep the three-plane controller authoritative by allowing its capture handlers to run first, then stopping legacy XZ bubble handlers from interpreting the same pointer event a second time.
*/

const GUARD='k11520XyzInputAuthority';

function bindGuard(host){
  if(!host||host.dataset[GUARD])return !!host;
  host.dataset[GUARD]='1';
  for(const type of ['pointerdown','pointermove','pointerup','pointercancel']){
    host.addEventListener(type,e=>{
      if(!globalThis.__K11520_3D_CONTROL__)return;
      e.stopImmediatePropagation();
      if(e.cancelable)e.preventDefault();
    },{capture:true,passive:false});
  }
  return true;
}

function expose(){
  globalThis.__K11520_XYZ_INPUT_AUTHORITY__={
    organ:'XYZ Input Authority',
    authoritative:true,
    legacyXZBubbleSuppressed:true,
    controller:'XYZ Plane Joystick',
  };
}

export function install11520XyzInputAuthority(){
  const joy=document.querySelector('#joy');
  const ok=bindGuard(joy);
  expose();
  for(const delay of [60,180,500,1200])setTimeout(()=>{bindGuard(document.querySelector('#joy'));expose()},delay);
  return {ok,...globalThis.__K11520_XYZ_INPUT_AUTHORITY__};
}
