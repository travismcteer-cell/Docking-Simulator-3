import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,RACES,startLevel,stepLevel,stepRaceStart,raceLight,registerRaceThrottle} from '../src/simulation/levels.js';
import {createSimulation,selectBoat} from '../src/simulation/state.js';
import {SPAWNS,RACING_BERTHS,SOLIDS} from '../src/data/marina.js';
import {hullAt,overlap,rectPoly} from '../src/simulation/collisions.js';
test('thirty challenges and five races have the requested starts and destinations',()=>{
 assert.equal(LEVELS.length,30);assert.equal(RACES.length,5);assert(!LEVELS.some(l=>l.type==='race'));
 const starts=['racingSouth','racing','racing','racingSouth','racingBow'],finishes=['race-south-west-2','race-west-2','race-south-west-2','race-west-2','race-south-west-2'];
 const sim=createSimulation();
 RACES.forEach((r,i)=>{assert.equal(r.spawnId,starts[i]);assert.deepEqual(r.requiredPilingIds,RACING_BERTHS.find(b=>b.id===finishes[i]).pilingIds);startLevel(sim,r.id);assert.equal(sim.levelRun.elapsed,0);assert.equal(raceLight(sim.levelRun),'red');const poly=hullAt(sim.state,sim.outline,sim.scale);assert(!SOLIDS.some(d=>overlap(poly,d.points||rectPoly(d))),r.name+' spawn clear');assert(Math.hypot(sim.state.x*sim.scale-r.spawn.x,sim.state.y*sim.scale-r.spawn.y)<.001);});
 assert.equal(SPAWNS.racingBow.a,90);assert(SPAWNS.racingBow.x<SPAWNS.racingSouth.x);
});
test('lights use exact boundaries and countdown is excluded from race time',()=>{
 const sim=createSimulation();startLevel(sim,RACES[0].id);
 assert.equal(stepRaceStart(sim,1),0);assert.equal(raceLight(sim.levelRun),'yellow');
 assert.equal(stepRaceStart(sim,.5),0);assert.equal(raceLight(sim.levelRun),'green');assert.equal(sim.levelRun.elapsed,0);
 const dt=stepRaceStart(sim,1);stepLevel(sim,dt);assert.equal(raceLight(sim.levelRun),null);assert.equal(sim.levelRun.elapsed,1);
 startLevel(sim,RACES[0].id);assert.equal(stepRaceStart(sim,1.6),.10000000000000009);
});
test('early taps or held throttle incur one penalty; green throttle is legal; restarts clear it',()=>{
 const sim=createSimulation();startLevel(sim,RACES[0].id);registerRaceThrottle(sim);registerRaceThrottle(sim);sim.state.port=1;stepRaceStart(sim,1);assert.equal(sim.levelRun.penalty,5);registerRaceThrottle(sim);assert.equal(sim.levelRun.penalty,5);
 startLevel(sim,RACES[0].id);stepRaceStart(sim,1.5);registerRaceThrottle(sim);assert.equal(sim.levelRun.penalty,0);
 startLevel(sim,RACES[0].id);sim.state.port=-1;stepRaceStart(sim,.1);assert.equal(sim.levelRun.penalty,5);
 const r=sim.levelRun.definition,t=r.target;Object.assign(sim.state,{x:(t.x+t.w/2)/sim.scale,y:(t.y+t.h/2)/sim.scale,a:r.heading});sim.lines=Object.fromEntries(['port:bow','stbd:bow','port:stern','stbd:stern'].map((k,i)=>[k,{target:{id:r.requiredPilingIds[i]}}]));sim.levelRun.elapsed=12;stepLevel(sim,.1);assert.equal(sim.levelRun.total,17.1);
 startLevel(sim,RACES[0].id);assert.equal(sim.levelRun.penalty,0);assert(!sim.levelRun.falseStart);
});

test('all courses finish stern-in at their own four pilings, including west-wall headings',()=>{
 const sim=createSimulation();
 for(const r of RACES){startLevel(sim,r.id);const t=r.target;Object.assign(sim.state,{x:(t.x+t.w/2)/sim.scale,y:(t.y+t.h/2)/sim.scale,a:r.heading});sim.lines=Object.fromEntries(['port:bow','stbd:bow','port:stern','stbd:stern'].map((k,i)=>[k,{target:{id:r.requiredPilingIds[i]}}]));sim.state.a+=180;stepLevel(sim,.01);assert(!sim.levelRun.complete);sim.state.a=r.heading;stepLevel(sim,.01);assert(sim.levelRun.complete,r.name);}
});
