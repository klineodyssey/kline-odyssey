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
  const host=document.createElement('section');host.id='qaCreatureGallery';host.style.cssText='position:fixed;inset:0;z-index:99999;background:#071016;padding:10px;box-sizing:border-box;color:#fff;font:11px system-ui;display:flex;flex-direction:column;gap:8px';
  const title=document.createElement('div');title.textContent='11520 生物／妖怪 3D 識別 QA';title.style.cssText='font-size:15px;font-weight:800;color:#f5d77c;text-align:center';host.appendChild(title);
  const canvas=document.createElement('canvas');canvas.width=370;canvas.height=650;canvas.style.cssText='width:370px;height:650px;border:1px solid #ffffff22;border-radius:12px;background:#0a1720';host.appendChild(canvas);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setSize(370,650,false);renderer.setPixelRatio(1);renderer.setClearColor(0x0a1720,1);
  const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x263544,2.1));const key=new THREE.DirectionalLight(0xffffff,2);key.position.set(3,7,8);scene.add(key);
  const camera=new THREE.OrthographicCamera(-5.2,5.2,8.4,-.5,.1,30);camera.position.set(0,4.2,12);camera.lookAt(0,4.2,0);
  const labels=[];
  species.forEach((s,i)=>{const col=i%4,row=Math.floor(i/4);const root=createProceduralLifeBody(THREE,{species:s,name:s,scale:.72});root.position.set(-3.8+col*2.55,5.9-row*2.65,0);root.rotation.y=(i%2?-.32:.28);scene.add(root);labels.push({species:s,archetype:creatureArchetypeForSpecies(s),childCount:root.children.length});});
  renderer.render(scene,camera);
  const legend=document.createElement('div');legend.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:3px;text-align:center;font-size:8px;color:#b9cad4;margin-top:-144px;pointer-events:none';legend.innerHTML=species.map(s=>`<div>${s.replace('DIGITAL_','D.').replace('_DEMON',' DEMON').replace('STONE_','S.').replace('FIRE_','F.')}</div>`).join('');host.appendChild(legend);
  document.body.appendChild(host);
  return labels;
});

assert.deepEqual(errors,[],'page errors: '+errors.join('\n'));
assert.equal(result.length,12);
assert.equal(new Set(result.map(x=>x.archetype)).size,12,'all canonical species should retain distinct archetype IDs');
assert.ok(result.every(x=>x.childCount>=3),'each creature must render as a multi-part 3D body');
await page.screenshot({path:`${OUT}/11520-creature-archetypes-390x844.png`,fullPage:true});
await browser.close();
console.log('11520 creature/monster 3D archetype browser visual QA PASS');
