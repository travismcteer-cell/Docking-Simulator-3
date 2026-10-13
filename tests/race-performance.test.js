import test from 'node:test';
import assert from 'node:assert/strict';
import {createSimulation} from '../src/simulation/state.js';
import {RACES,startLevel,enterPractice} from '../src/simulation/levels.js';
import {setOtherBoats} from '../src/simulation/traffic.js';
import {setPracticeTraffic} from '../src/simulation/moving-traffic.js';

test('all races omit NPC rendering and collision hulls, including restarts',()=>{
 const sim=createSimulation();
 setOtherBoats(sim,'high');setPracticeTraffic(sim,'high');
 assert(sim.otherBoats.length>0);assert(sim.movingBoats.length>0);
 for(const race of RACES){for(let restart=0;restart<2;restart++){
  startLevel(sim,race.id);
  assert.equal(sim.otherBoats.length,0,race.name);
  assert.equal(sim.movingBoats.length,0,race.name);
  assert(!sim.solids.some(s=>s.kind==='boat'));
  assert(!sim.fenderShapes.some(s=>s.kind==='boat'));
 }}
 enterPractice(sim);
 assert.equal(sim.otherBoatsDensity,'high');assert(sim.otherBoats.length>0);
 assert.equal(sim.trafficDensity,'high');assert.equal(sim.movingBoats.length,10);
 startLevel(sim,'gas-departure');
 assert(sim.otherBoats.some(b=>b.id==='level-ahead'));
 assert(sim.otherBoats.some(b=>b.id==='level-astern'));
});
