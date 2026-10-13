import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderGate,mobileGraphicsProfile} from '../src/graphics/performance.js';
test('mobile defaults preserve desktop graphics',()=>{
 const fine=()=>({matches:false});
 assert.deepEqual(mobileGraphicsProfile({userAgent:'iPhone',maxTouchPoints:5},fine),{mobile:true,fps:30,pixelRatio:1.25});
 assert.deepEqual(mobileGraphicsProfile({userAgent:'Desktop',maxTouchPoints:0},fine),{mobile:false,fps:0,pixelRatio:1.75});
 assert.equal(mobileGraphicsProfile({userAgent:'Macintosh',maxTouchPoints:5},()=>({matches:true})).mobile,true);
});
test('30 FPS gate works at 60, 90 and 120 Hz without slowing visual time',()=>{
 for(const hz of [60,90,120]){const gate=createRenderGate(30);let count=0,time=0;for(let i=0;i<=hz*2;i++){const dt=gate(i*1000/hz);if(dt!==null){count++;time+=dt;}}assert.equal(count,61);assert(Math.abs(time-2)<1e-9);}
});
test('hidden and home screens reset visual time; desktop renders each callback',()=>{
 const gate=createRenderGate(30);assert.equal(gate(0),0);assert.equal(gate(10),null);assert.equal(gate(2000,false),null);assert.equal(gate(4000),0);
 const desktop=createRenderGate(0);assert.equal(desktop(0),0);assert.equal(desktop(10),.01);
});
