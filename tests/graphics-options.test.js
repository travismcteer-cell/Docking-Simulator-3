import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {graphicsDefaults,validateGraphicsSettings,resolveGraphicsSettings} from '../src/graphics/performance.js';
import {createOtherBoatGraphics} from '../src/graphics/traffic.js';
const mobile={mobile:true,fps:30,pixelRatio:1.25},desktop={mobile:false,fps:0,pixelRatio:1.75};
test('graphics defaults preserve each device profile; invalid stored options fall back safely',()=>{
 for(const profile of [mobile,desktop]){const defaults=graphicsDefaults(profile),r=resolveGraphicsSettings(defaults,profile);assert.equal(r.fps,profile.fps);assert.equal(r.pixelRatio,profile.pixelRatio);assert.equal(r.far,2200);assert.equal(r.simpleWater,false);assert.deepEqual(validateGraphicsSettings(null,profile),defaults);assert.deepEqual(validateGraphicsSettings({fps:'900',resolution:99,distance:'invalid'},profile),defaults);}
});
test('power options combine independently and restore to original values',()=>{
 const settings=validateGraphicsSettings({fps:'24',resolution:'1',distance:'short',water:'simple',boats:'reduced',ui:'10',shadows:'off'},mobile),r=resolveGraphicsSettings(settings,mobile);
 assert.equal(r.fps,24);assert.equal(r.pixelRatio,1);assert.equal(r.simpleWater,true);assert.equal(r.boatDetailDistance,100);assert.equal(r.uiInterval,100);assert(r.fogNear<r.fogFar&&r.fogFar<r.far);assert.equal(resolveGraphicsSettings({...settings,distance:'full'},mobile).simpleWater,true);assert.equal(resolveGraphicsSettings(graphicsDefaults(mobile),mobile).uiInterval,0);
});
test('parked boat drawing is culled without changing simulation boats and responds to option changes',()=>{
 const boats=[{boatKey:'bowrider21',xCenter:0,yCenter:0,heading:0},{boatKey:'bowrider21',xCenter:1500,yCenter:0,heading:0}],sim={state:{x:0,y:0},scale:1,trafficRevision:1,otherBoats:boats},scene=new THREE.Scene(),options={detailDistance:220,renderDistance:700};
 const graphics=createOtherBoatGraphics(scene,sim,options),drawn=()=>scene.children[0].children.reduce((n,m)=>n+m.count,0);
 graphics.update();const nearOnly=drawn();assert(nearOnly>0);assert.equal(sim.otherBoats.length,2);
 options.renderDistance=Infinity;graphics.update();assert(drawn()>nearOnly);
 options.renderDistance=700;graphics.update();assert.equal(drawn(),nearOnly);
 sim.state.x=3000;graphics.update();assert.equal(drawn(),0);assert.equal(sim.otherBoats.length,2);
});
