import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createSimulation,selectBoat,resetSimulation} from '../src/simulation/state.js';
import {stepPhysics} from '../src/simulation/physics.js';
import {hullAt,overlap,rectPoly} from '../src/simulation/collisions.js';
import {SOLIDS,DOCKS} from '../src/data/marina.js';
import {workboatVisualPose} from '../src/graphics/workboat.js';
const playable=['Express-33','bowrider','sportfisher-30','Motoryacht-60','deadrise-40'];
test('every practice gas spawn is alongside with port bow/stern lines and port fenders',()=>{
 const sim=createSimulation(),dock=DOCKS.find(d=>d.id==='dock135');
 for(const id of playable){selectBoat(sim,id,'gasAlongside');assert.deepEqual(Object.keys(sim.lines).sort(),['port:bow','port:stern']);assert(sim.fenders.port);assert(!sim.fenders.stbd);assert.equal(sim.state.a,0);assert(sim.state.y*sim.scale>dock.y+dock.h);assert(sim.state.y*sim.scale<dock.y+dock.h+12);
  for(const line of Object.values(sim.lines)){assert(line.target.x>=dock.x&&line.target.x<=dock.x+dock.w);assert(Math.abs(line.target.y-(dock.y+dock.h))<.01);assert.equal(line.tension,0);}
  const poly=hullAt(sim.state,sim.outline,sim.scale);assert(!SOLIDS.some(d=>overlap(poly,d.points||rectPoly(d))),id+' starts clear');
  for(let i=0;i<60;i++)stepPhysics(sim,1/120);assert(!sim.contact,id+' has no initial dock contact');
  resetSimulation(sim,'gasAlongside');assert.equal(Object.keys(sim.lines).length,2);resetSimulation(sim,'f');assert.equal(Object.keys(sim.lines).length,0);assert(!sim.fenders.port);
 }
});
test('accelerating and bobbing workboat keeps every cockpit floor vertex above water',()=>{
 const sim=createSimulation();selectBoat(sim,'deadrise-40');sim.environment.wind=20;
 const transform=new THREE.Matrix4(),rotation=new THREE.Matrix4();let raised=false;
 for(const trim of [0,.5,1])for(const plane of [0,.5,1])for(const omega of [-100,0,100])for(let time=0;time<20;time+=.2){
  sim.workboatDynamics={trim,plane};sim.state.omega=omega;sim.state.vx=(10+plane*15)/110;
  const before=structuredClone(sim.state),pose=workboatVisualPose(sim,time);
  // Use Three.js's actual rotateZ then rotateX convention independently of the clamp formula.
  transform.makeRotationZ(pose.pitch);rotation.makeRotationX(pose.roll);transform.multiply(rotation);
  for(const p of sim.model.cockpitFloorPoints){const v=new THREE.Vector3(...p).applyMatrix4(transform);assert(v.y+pose.heave>=.10-1e-9);}
  assert(pose.pitch>-.1&&pose.pitch<.15);assert.deepEqual(sim.state,before);
  if(pose.heave>.6)raised=true;
 }
 assert(raised,'strong trim retains bow rise by lifting the cosmetic hull around its low cockpit');
});
