import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadPoints,createRequest,acceptPrice,makeTrip,advanceTrip,deliveryPreview} from './market.mjs';
import {COW_FRAME,createCowOrderSpec,createCowMission,advanceCowMission,inspectCowMission,activateCow,tickCow,restoreCowSnapshot} from './cow.mjs';
const map=JSON.parse(readFileSync(new URL('../../../../docs/maps/UniverseMap_V10_2_DISTANCE_COMPLETE_ALL_POINTS.json',import.meta.url),'utf8'));
const ps=loadPoints(map),point=k=>ps.find(p=>p.k===k).id, origin=point(12345),target=point(11520);
const site={pointId:target,frame:COW_FRAME,x:12,y:0,z:8},grassPatch={pointId:target,frame:COW_FRAME,x:17,y:0,z:9};
function order(){return createRequest({orderId:'COW_001',buyer:'K11520玩家',seller:'萬獸生命公司',buyerPointId:target,sellerPointId:origin,meetingPointId:target,asset:'數位牛創生服務',quantity:1,currency:'KAIOS',buyerBid:'1200',sellerAsk:'1100',dealPrice:'1150',points:ps})}
function ready(){let o=acceptPrice(acceptPrice(order(),'buyer'),'seller'),b=makeTrip(ps,target,target,{mode:'WALK',walkKmh:5}),s=advanceTrip(makeTrip(ps,origin,target,{mode:'VEHICLE',vehicleC:100}),8250);return {o,b,s}}
function prepared(){let {o,b,s}=ready(),spec=createCowOrderSpec({order:o,site,grassPatch});return {o,b,s,spec}}
function built(){let t=prepared();let m=advanceCowMission(createCowMission(t.spec),{order:t.o,buyerTrip:t.b,sellerTrip:t.s,seconds:3600,monsterAction:'FOLLOW'});return {m,...t}}
function accepted(){let {m}=built();return inspectCowMission(m,{goodsChecked:true,buyerAccepted:true,buyerPosition:site,sellerPosition:{...site,x:13}})}
test('canon 123 records and 108 unique K points are preserved',()=>{assert.equal(ps.length,123);assert.equal(new Set(ps.map(p=>p.k)).size,108)});
test('K11520 is point identity, not a Z altitude',()=>assert.equal(createCowOrderSpec(prepared()).site.pointId,target));
test('three prices require buyer and seller acceptance',()=>assert.equal(ready().o.quoteStatus,'AGREED_MEETING_PENDING'));
test('seller cannot teleport to K11520',()=>{const {o,b}=ready(),spec=createCowOrderSpec({order:o,site,grassPatch});assert.throws(()=>advanceCowMission(createCowMission(spec),{order:o,buyerTrip:b,sellerTrip:makeTrip(ps,origin,target,{mode:'VEHICLE',vehicleC:100}),seconds:3600}),/COW_BOTH_PARTIES_MUST_ARRIVE/)});
test('time alone and avoided monsters cannot complete the cow build',()=>{const {o,b,s,spec}=prepared(),m=advanceCowMission(createCowMission(spec),{order:o,buyerTrip:b,sellerTrip:s,seconds:3600,monsterAction:'AVOID'});assert.equal(m.constructionReady,false)});
test('construction does not pre-mint a cow or Life ID',()=>{const {m}=built();assert.equal(m.cow,null);assert.equal(m.spec.lifeId,null)});
test('same point but wrong local XYZ position cannot accept',()=>assert.throws(()=>inspectCowMission(built().m,{goodsChecked:true,buyerAccepted:true,buyerPosition:site,sellerPosition:{...site,x:100}}),/COW_LOCAL_XYZ_MEETING_REQUIRED/));
test('buyer must inspect before one cow is born',()=>assert.throws(()=>activateCow(built().m),/COW_DELIVERY_NOT_ACCEPTED/));
test('accepted delivery creates exactly one game cow at XYZ',()=>{const a=activateCow(accepted());assert.equal(a.cow.cowId,'COW-COW_001');assert.deepEqual(a.cow.position,{x:12,y:0,z:8});assert.equal(a.cow.lifeId,null)});
test('restart replay cannot spawn duplicate cow',()=>{const a=activateCow(accepted());assert.throws(()=>activateCow(accepted(),{existingCowIds:[a.cow.cowId]}),/COW_DUPLICATE_BIRTH/)});
test('no grass means cow creation blocked',()=>assert.throws(()=>activateCow(accepted(),{grassAvailable:false}),/COW_GRASS_NOT_AVAILABLE/));
test('cow may walk to grass and eat in its game world',()=>{const c=activateCow(accepted()).cow,t=tickCow(c,{seconds:3600,grassAvailable:true,grassUnits:1});assert.equal(t.activity,'GRAZING');assert.equal(t.position.x,17);assert.ok(t.hunger<c.hunger)});
test('reload persists cow as game only and no paid receipt',()=>{const m=activateCow(accepted()),snap=restoreCowSnapshot({version:1,cowIds:[m.cow.cowId],cow:m.cow});assert.equal(snap.cow.cowId,m.cow.cowId);assert.equal(m.receipt,null);assert.equal(m.paymentStatus,'NO_ONCHAIN_SETTLEMENT')});
test('do not elevate browser snapshot into formal Life ID',()=>{const c=activateCow(accepted()).cow;assert.throws(()=>restoreCowSnapshot({version:1,cowIds:[c.cowId],cow:{...c,lifeId:'FAKE-LIFE'}}),/COW_SNAPSHOT_INVALID/)});
