import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(resolve(here,'../game-5d.html'),'utf8');
const organs=['world','trade','positions','orders','history','assets','records','market','bag','character','worldmap','atm','settings','help'];
const fixed=['toolToggle','organClose','tradeSword','orderFire','confirmOrder','cancelOrder','cancelX','flat','attack','skill','dodge','modeBtn','profileBtn','enterBtn','joy','lookPad','yControl','warpControl','fireControl','levControl'];

test('all formal organs remain present',()=>{for(const id of organs)assert.ok(html.includes(`['${id}'`)||html.includes(`case'${id}'`),id)});
test('all fixed control surfaces exist',()=>{for(const id of fixed)assert.ok(html.includes(`id="${id}"`),id)});
test('fixed buttons/controls have event wiring',()=>{for(const id of fixed)assert.ok(html.includes(`$('#${id}').addEventListener`)||html.includes(`const el=$('#'+id)`),`missing handler for ${id}`)});
test('0C walking is not disabled by old zero-speed gate',()=>{assert.equal(html.includes('D.warp===0?0'),false);assert.ok(html.includes('movementStep({forward:jv.forward,turn:jv.turn'))});
test('dynamic organ actions are wired',()=>{for(const token of ['data-close-axis','data-cancel-order','data-market-axis','data-item','data-dest','simExchange','musicRange','cameraRange','resetUi'])assert.ok(html.includes(token),token)});
test('economy boundaries remain separate',()=>{assert.ok(html.includes('XYZ 戰鬥結算 KAIOS'));assert.ok(html.includes('KX/KY/KZ 交易結算 KGEN'));assert.ok(html.includes('previewOrder'));assert.ok(html.includes('executeOrder'))});
