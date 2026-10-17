import test from 'node:test';import assert from 'node:assert/strict';
import {LEVELS,startLevel,stepLevelTraffic} from '../src/simulation/levels.js';
import {createSimulation} from '../src/simulation/state.js';
import {SOLIDS,RACING_BASIN,RACING_BERTHS} from '../src/data/marina.js';
import {hullAt,overlap,rectPoly,integrate} from '../src/simulation/collisions.js';
import {applyRacePadding} from '../src/simulation/fenders.js';
import {paddedWallContact} from '../src/simulation/padded-contact.js';
import {challengeDescription} from '../src/interface/challenge-description.js';
const level=n=>LEVELS.find(l=>l.number===n);
test('scripted traffic stays clear of fixed and parked boats and exits safely',()=>{
 const sim=createSimulation();for(const n of [22,24]){startLevel(sim,level(n).id);let firstPass=null,secondPass=null;const initial=sim.movingBoats.map(b=>({x:b.xCenter,y:b.yCenter}));
 for(let i=0;i<1400;i++){sim.levelRun.elapsed+=.5;stepLevelTraffic(sim,.5);for(const [j,b]of sim.movingBoats.entries()){if(b.finished)continue;assert(!SOLIDS.some(d=>overlap(b.points,d.points||rectPoly(d))),n+' fixed '+b.id+' '+b.xCenter+','+b.yCenter);assert(!sim.otherBoats.some(d=>overlap(b.points,d.points)),n+' parked '+b.id);if(n===22&&b.yCenter>=100){if(j===0&&firstPass===null)firstPass=sim.levelRun.elapsed;if(j===1&&secondPass===null)secondPass=sim.levelRun.elapsed;}}
 if(n===24&&i===1)assert(sim.movingBoats[0].xCenter<initial[0].x,'pulls away from the wharf immediately');
 }
 if(n===22){assert.equal(sim.movingBoats.length,2);assert.notEqual(sim.movingBoats[0].boatKey,sim.movingBoats[1].boatKey);assert(firstPass>5&&firstPass<25);assert(secondPass-firstPass>25&&secondPass-firstPass<35);}
 assert(sim.movingBoats.every(b=>b.finished));
 }
});
test('challenge cards describe actual conditions and only actual anchor requirements',()=>{
 for(const l of LEVELS){const text=challengeDescription(l);assert(text.startsWith(l.type==='departure'?'Departure':'Arrival'));assert(text.includes(l.target.label));assert(text.includes('Wind '+(l.wind||0)+' kt'));assert.equal(/anchor/i.test(text),!!(l.requireAnchor||l.startAnchor));}
 for(const n of [7,17,27]){assert(!/anchor/i.test(challengeDescription(level(n))));assert(!/anchor/i.test(level(n).objective));}
});
test('all racing berth back walls have continuous padding with inward force and no suction',()=>{
 assert.equal(RACING_BASIN.padding.length,RACING_BERTHS.length);
 for(const pad of RACING_BASIN.padding){for(const across of [-10,0,10]){
 const sim={state:{x:pad.x-pad.ny*across+pad.nx*1.1,y:pad.y+pad.nx*across+pad.ny*1.1,a:0,vx:-pad.nx*.01,vy:-pad.ny*.01,omega:0},outline:[[-.1,-.1],[.1,-.1],[.1,.1],[-.1,.1]],scale:1,geometryLength:1,racePadding:[pad]};let normal=0;
 applyRacePadding(sim,(x,y)=>normal+=x*pad.nx+y*pad.ny);assert(normal>0);assert(paddedWallContact(sim,pad.x-pad.ny*across,pad.y+pad.nx*across,pad.nx,pad.ny));
 sim.state.x+=pad.nx*5;sim.state.y+=pad.ny*5;normal=0;applyRacePadding(sim,(x,y)=>normal+=Math.hypot(x,y));assert.equal(normal,0);
 }}
});
test('padding cushions stern-on collision feedback without protecting adjacent bare wall',()=>{
 const pad=RACING_BASIN.padding[0],a=Math.atan2(pad.ny,pad.nx)*180/Math.PI;
 function impact(across){const wall=SOLIDS.find(d=>d.id==='dock138'),sim={state:{x:pad.x-pad.ny*across+pad.nx*.9,y:pad.y+pad.nx*across+pad.ny*.9,a,vx:-pad.nx,vy:-pad.ny,omega:0},outline:[[-1,-.5],[1,-.5],[1,.5],[-1,.5]],scale:1,docks:[wall],solids:[wall],fenders:{},racePadding:RACING_BASIN.padding,bounds:{minX:-1000,maxX:1000,minY:-1000,maxY:1000}};integrate(sim,.1);return sim.collision;}
 const cushioned=impact(0),bare=impact(-25);assert(cushioned?.protected);assert(!bare?.protected);assert(cushioned.knots<bare.knots*.5);
});
test('wall padding slows an approaching hull before hard wall contact',()=>{
 const pad={x:0,y:0,nx:1,ny:0,halfWidth:12.5,face:.6},wall={id:'wall',x:-5,y:-20,w:5,h:40};
 function run(padded){const sim={state:{x:3/100,y:0,a:0,vx:-2/100,vy:0,omega:0},outline:[[-1,-.5],[1,-.5],[1,.5],[-1,.5]],scale:100,geometryLength:2,racePadding:padded?[pad]:[],docks:[wall],solids:[wall],fenders:{},bounds:{minX:-100,maxX:100,minY:-100,maxY:100}};let peak=0;
 for(let i=0;i<240;i++){applyRacePadding(sim,(x,y)=>{sim.state.vx+=x/120;sim.state.vy+=y/120;});integrate(sim,1/120);peak=Math.max(peak,sim.collision?.knots||0);}return peak;}
 assert(run(true)<run(false)*.5);
});
test('each visible timber face matches the shared physics padding location',async()=>{
 const {addRacingBasinDetails}=await import('../src/graphics/racing-basin.js');const THREE=await import('../vendor/three.module.js');const previous=globalThis.document;
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},fillText(){}})})};
 try{const scene=new THREE.Scene();addRacingBasinDetails(scene);scene.updateMatrixWorld(true);
 for(const pad of RACING_BASIN.padding){const rack=scene.getObjectByName(pad.id);assert(rack);assert.equal(rack.children.length,6);const board=rack.children.at(-1),face=board.localToWorld(new THREE.Vector3(0,0,1/12));assert(Math.abs(face.x-(pad.x+pad.nx*pad.face))<1e-8);assert(Math.abs(face.z-(pad.y+pad.ny*pad.face))<1e-8);assert.equal(board.geometry.parameters.width,pad.halfWidth*2);}
 }finally{globalThis.document=previous;}
});
