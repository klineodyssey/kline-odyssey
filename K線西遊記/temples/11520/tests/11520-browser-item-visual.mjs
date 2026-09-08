import {chromium} from 'playwright';
import fs from 'node:fs/promises';

const out='artifacts/11520-visual-qa/11520-backpack-item-3d.png';
await fs.mkdir('artifacts/11520-visual-qa',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
await page.addInitScript(()=>{
  localStorage.setItem('11520.backpack.v1',JSON.stringify({version:'11520-BACKPACK-V1',ownerId:'QA',capacitySlots:24,capacityWeight:120,updatedAt:Date.now(),items:[
    {itemId:'QA-TREASURE',name:'火眼晶石',kind:'TREASURE',species:null,qty:1,weightEach:.5,stackable:true,treasureClass:'RARE',lifeId:null,meta:{}},
    {itemId:'QA-KGEN',name:'KGEN 貨筒',kind:'MATERIAL',species:null,qty:2,weightEach:1,stackable:true,treasureClass:null,lifeId:null,meta:{cargoKind:'KGEN'}},
    {itemId:'QA-CASH',name:'KAIOS 現鈔',kind:'MATERIAL',species:null,qty:1,weightEach:1,stackable:true,treasureClass:null,lifeId:null,meta:{cargoKind:'CASH',unit:'KAIOS'}},
    {itemId:'QA-FOOD',name:'蟠桃',kind:'FOOD',species:null,qty:3,weightEach:.2,stackable:true,treasureClass:null,lifeId:null,meta:{}},
    {itemId:'QA-COW',name:'花果山牛',kind:'LIVING_CARGO',species:'COW',qty:1,weightEach:1,stackable:false,treasureClass:null,lifeId:'LIFE-QA-COW',meta:{}},
  ]}));
});
await page.goto('http://127.0.0.1:4173/K%E7%B7%9A%E8%A5%BF%E9%81%8A%E8%A8%98/temples/11520/game-5d.html',{waitUntil:'networkidle',timeout:60000});
await page.waitForSelector('#backpackButton',{timeout:30000});
await page.click('#backpackButton');
await page.waitForSelector('#backpackPanel.open');
await page.waitForFunction(()=>document.querySelectorAll('canvas.bp3d[data-item3d="ready"]').length>=5,null,{timeout:30000});
const shapes=await page.$$eval('canvas.bp3d[data-item3d="ready"]',els=>els.map(e=>e.dataset.itemShape));
for(const expected of ['CRYSTAL','KGEN_CYLINDER','CASH_BUNDLE','FOOD','LIFE_CRATE'])if(!shapes.includes(expected))throw new Error(`MISSING_3D_ITEM_SHAPE:${expected}`);
if(pageErrors.length)throw new Error(`PAGEERROR:${pageErrors.join('|')}`);
await page.screenshot({path:out,fullPage:false});
console.log(`[11520 ITEM 3D QA] PASS shapes=${shapes.join(',')} screenshot=${out}`);
await browser.close();
