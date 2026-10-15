import test from 'node:test';import assert from 'node:assert/strict';
import {createSimulation,selectBoat} from '../src/simulation/state.js';
import {stepWorkboat,planingPivotBlend,WORKBOAT_SPIN_PIVOT} from '../src/simulation/workboat.js';
test('aft pivot response is absent in displacement mode and during straight tracking',()=>{assert.equal(planingPivotBlend(0,1,1/120),0);assert.equal(planingPivotBlend(1,0,1/120),0);assert.equal(planingPivotBlend(1,1,0),0);assert(WORKBOAT_SPIN_PIVOT<0&&WORKBOAT_SPIN_PIVOT>-.15);});
test('planing spin has an effective pivot just aft of midships',()=>{for(const steer of [-35,35]){const s=createSimulation();selectBoat(s,'deadrise-40');s.solids=[];s.fenderShapes=[];Object.assign(s.state,{x:0,y:0,a:0,vx:24/110,vy:0,omega:0,steer,port:.5});s.workboatDynamics={plane:1,trim:0,breakaway:1};for(let i=0;i<60;i++)stepWorkboat(s,1/120);const a=s.state.a*Math.PI/180,lateral=-s.state.vx*Math.sin(a)+s.state.vy*Math.cos(a),pivot=-lateral*s.scale/(s.state.omega*Math.PI/180);assert(pivot<0&&pivot>-6,'effective pivot '+pivot+' ft');assert(Math.abs(s.state.omega)>5);assert(s.workboatDynamics.plane>.9);}});
test('spin transition handles heading wrap, holds bow engagement, and resets with helm',async()=>{
 const {spinPivotWeight}=await import('../src/simulation/workboat.js');
 for(const direction of [-1,1]){const response={};const heading=direction>0?350:10;
 assert.equal(spinPivotWeight(response,heading,35*direction,1),1);
 assert.equal(spinPivotWeight(response,(heading+45*direction+360)%360,35*direction,1),.5);
 assert.equal(spinPivotWeight(response,(heading+60*direction+360)%360,35*direction,1),0);
 assert.equal(spinPivotWeight(response,(heading+80*direction+360)%360,35*direction,0),0);
 assert.equal(spinPivotWeight(response,heading,0,0),1);
 }
});
test('continued planing turn releases the stern after the initial aft pivot',()=>{
 for(const steer of [-35,35]){const s=createSimulation();selectBoat(s,'deadrise-40');s.solids=[];s.fenderShapes=[];
 Object.assign(s.state,{x:0,y:0,a:0,vx:24/110,vy:0,omega:0,steer,port:.5});s.workboatDynamics={plane:1,trim:0,breakaway:1};
 for(let i=0;i<240;i++)stepWorkboat(s,1/120);
 const a=s.state.a*Math.PI/180,lateral=-s.state.vx*Math.sin(a)+s.state.vy*Math.cos(a),pivot=-lateral*s.scale/(s.state.omega*Math.PI/180);
 assert(s.workboatDynamics.spinDegrees>55);assert(pivot>8&&pivot<24,'bowward pivot '+pivot+' ft');
 }
});
test('workboat reverse acceleration is close to forward acceleration',()=>{
 const speeds=[1,-1].map(port=>{const s=createSimulation();selectBoat(s,'deadrise-40');s.solids=[];s.fenderShapes=[];
 Object.assign(s.state,{x:0,y:0,a:0,vx:0,vy:0,omega:0,steer:0,port});for(let i=0;i<600;i++)stepWorkboat(s,1/120);
 return Math.hypot(s.state.vx,s.state.vy)*110;});
 assert(speeds[1]>speeds[0]*.85);assert(speeds[1]<speeds[0]);
});
