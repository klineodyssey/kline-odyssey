import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {chromium} from 'playwright';

const OUT='artifacts/11520-visual-qa';
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(1200);
if(await page.locator('#intro11520').isVisible().catch(()=>false))await page.locator('#enter11520').click().catch(()=>{});
await page.waitForTimeout(500);

const result=await page.evaluate(async()=>{
  const THREE=await import('three');
  const {createProceduralLifeBody,creatureArchetypeForSpecies}=await import('/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/runtime/life-visual-runtime.mjs');
  const species=['DIGITAL_ANT','BULL_DEMON','STONE_APE','FIRE_WISP','FISH','SHRIMP','COW','SHEEP','CHICKEN','DUCK','TREE','FLOWER'];
  const display=s=>({DIGITAL_ANT:'Digital Ant',BULL_DEMON:'牛魔王',STONE_APE:'暗影猿',FIRE_WISP:'火靈',FISH:'魚',SHRIMP:'蝦',COW:'牛',SHEEP:'羊',CHICKEN:'雞',DUCK:'鴨',TREE:'樹',FLOWER:'花'}[s]||s);
  const renderCanvas=document.createElement('canvas');renderCanvas.width=180;renderCanvas.height=180;
  const renderer=new THREE.WebGLRenderer({canvas:renderCanvas,antialias:true,alpha:false,preserveDrawingBuffer:true});renderer.setSize(180,180,false);renderer.setPixelRatio(1);renderer.setClearColor(0x0a1720,1);
  const warmScene=new THREE.Scene();warmScene.add(new THREE.AmbientLight(0xffffff,2));const warmMesh=new THREE.Mesh(new THREE.BoxGeometry(.5,.5,.5),new THREE.MeshBasicMaterial({color:0xffffff}));warmScene.add(warmMesh);const warmCamera=new THREE.PerspectiveCamera(50,1,.01,10);warmCamera.position.z=2;renderer.render(warmScene,warmCamera);renderer.getContext().finish();renderCanvas.toDataURL('image/png');
  const cards=[],labels=[];
  for(const [i,s] of species.entries()){
    const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x263544,2.6));const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(3,6,8);scene.add(key);
    const root=createProceduralLifeBody(THREE,{species:s,name:s,scale:.92});root.rotation.y=i%2?-.34:.3;scene.add(root);
    const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3(),center=new THREE.Vector3();box.getSize(size);box.getCenter(center);
    const half=Math.max(.45,Math.max(size.x,size.y,size.z)*.68+.12);
    const camera=new THREE.OrthographicCamera(-half,half,half,-half,.01,20);camera.position.set(center.x,center.y,center.z+6);camera.lookAt(center);
    renderer.compile(scene,camera);renderer.render(scene,camera);renderer.getContext().finish();
    cards.push({species:s,label:display(s),url:renderCanvas.toDataURL('image/png')});labels.push({species:s,archetype:creatureArchetypeForSpecies(s),childCount:root.children.length});
  }
  const host=document.createElement('section');host.id='qaCreatureGallery';host.style.cssText='position:fixed;inset:0;z-index:99999;background:#071016;padding:9px;box-sizing:border-box;color:#fff;font:11px system-ui;overflow:hidden';
  const title=document.createElement('div');title.textContent='11520 生物／妖怪 3D 識別 QA';title.style.cssText='font-size:15px;font-weight:800;color:#f5d77c;text-align:center;height:27px';host.appendChild(title);
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(3,1fr);gap:6px;height:790px;align-content:stretch';
  grid.innerHTML=cards.map(c=>`<div style="border:1px solid #ffffff22;border-radius:10px;background:#0a1720;padding:4px;text-align:center;min-width:0;overflow:hidden"><img src="${c.url}" alt="${c.species}" style="width:100%;height:168px;object-fit:contain;display:block;margin:auto"><b style="display:block;color:#d8e8ef;font-size:9px;line-height:1.1;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.label}</b><small style="display:block;color:#78909c;font-size:6px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.species}</small></div>`).join('');
  host.appendChild(grid);document.body.appendChild(host);globalThis.__K11520_QA_CREATURE_RENDERER__=renderer;
  await Promise.all([...grid.querySelectorAll('img')].map(img=>img.decode?.().catch(()=>{})||Promise.resolve()));
  return labels;
});

assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
assert.equal(result.length,12);
assert.equal(new Set(result.map(x=>x.archetype)).size,12,'all canonical species should retain distinct archetype IDs');
assert.ok(result.every(x=>x.childCount>=3),'each creature must render as a multi-part 3D body');
await page.waitForTimeout(300);
await page.screenshot({path:`${OUT}/11520-creature-archetypes-390x844.png`,fullPage:true});
await browser.close();
console.log('11520 creature/monster 3D archetype browser visual QA PASS');
