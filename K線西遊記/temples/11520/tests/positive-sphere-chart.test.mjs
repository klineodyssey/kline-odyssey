import test from 'node:test';
import assert from 'node:assert/strict';
import {sphereMetrics,validatePositiveSphere,sphereChartToGeo,geoToSphereChart,eastWestCircleAtLatitude} from '../runtime/positive-sphere-chart.mjs';
const r=6371000,close=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('circle, sphere area, volume',()=>{const m=sphereMetrics(2);close(m.circumferenceMeters,4*Math.PI);close(m.crossSectionAreaM2,4*Math.PI);close(m.surfaceAreaM2,16*Math.PI);close(m.volumeM3,32*Math.PI/3)});
test('positive chart bounds',()=>{assert.equal(validatePositiveSphere({x:0,y:0,z:0},r).z,0);assert.equal(validatePositiveSphere({x:2*Math.PI*r,y:Math.PI*r,z:r},r).z,r);for(const p of [{x:-1,y:0,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:-1},{x:0,y:0,z:r+1}])assert.throws(()=>validatePositiveSphere(p,r),/OUTSIDE_POSITIVE_SPHERE_CHART/)});
test('geo to chart and back',()=>{const loc={latitudeDeg:24.8,longitudeDeg:121,radialMeters:r};const back=sphereChartToGeo(geoToSphereChart(loc,r),r);close(back.latitudeDeg,loc.latitudeDeg);close(back.longitudeDeg,loc.longitudeDeg);close(back.altitudeAboveSphereMeters,0)});
test('east-west arc shrinks at poles',()=>{close(eastWestCircleAtLatitude(r,0),2*Math.PI*r);close(eastWestCircleAtLatitude(r,60),Math.PI*r);assert.ok(eastWestCircleAtLatitude(r,90)<1e-7)});
test('invalid input is rejected',()=>{assert.throws(()=>sphereMetrics(0));assert.throws(()=>geoToSphereChart({latitudeDeg:91,longitudeDeg:0,radialMeters:r},r))});
