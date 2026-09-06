import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureSession,aimCapture,spinCapture,throwCapture,capturedLifeRecord,releaseCapturedLife} from '../runtime/capture-runtime.mjs';

test('original capture flow preserves SAME_LIFE_ID',()=>{
  const life={lifeId:'LIFE-QA-001',name:'QA Life',species:'DIGITAL_ANT',vitality:20,x:1,y:0,z:2};
  const s=createCaptureSession({life,itemId:'MONKEY_KING_RING'});
  aimCapture(s,{quality:1});spinCapture(s,{turns:3});const r=throwCapture(s,{quality:1,hit:true,random:()=>0});
  assert.equal(r.captured,true);const record=capturedLifeRecord(s);assert.equal(record.lifeId,life.lifeId);assert.equal(record.sameLifeId,true);
  const released=releaseCapturedLife(record,{x:9,y:3,z:11});assert.equal(released.lifeId,life.lifeId);assert.equal(released.sameLifeId,true);assert.equal(released.capture.status,'RELEASED');
});

test('miss returns to aim without manufacturing a replacement life',()=>{
  const s=createCaptureSession({life:{lifeId:'LIFE-QA-002',vitality:100}});aimCapture(s,{quality:.5});spinCapture(s,{turns:1});const r=throwCapture(s,{quality:.5,hit:false});assert.equal(r.captured,false);assert.equal(s.lifeId,'LIFE-QA-002');assert.equal(s.status,'AIM');
});
