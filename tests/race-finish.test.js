import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,stepLevel} from '../src/simulation/levels.js';
import {RACING_BERTHS} from '../src/data/marina.js';

const definition=LEVELS.find(l=>l.id==='workboat-race');
const keys=['port:bow','stbd:bow','port:stern','stbd:stern'];
function race(heading=270){
 const t=definition.target;
 return {mode:'levels',scale:1,state:{x:t.x+t.w/2,y:t.y+t.h/2,a:heading,vx:0,vy:0,port:1,stbd:1,bowThruster:1},lines:Object.fromEntries(keys.map((key,i)=>[key,{target:{id:definition.requiredPilingIds[i]}}])),levelRun:{definition,elapsed:0,penalty:0,impacts:[],hold:0,complete:false,contactTimes:new Map()}};
}
test('race stern-in heading points out of the south-wall destination berth',()=>{
 const berth=RACING_BERTHS.find(b=>b.id==='race-south-west-2');
 assert.equal(definition.heading,berth.a);
 assert.equal(berth.a,270);
 assert(Math.sin(berth.a*Math.PI/180)<0);
 assert.match(definition.description,/finish stern-in/);
 assert.match(definition.objective,/Finish stern-in/);
});
test('stern-in race finish is immediate and wraps headings correctly',()=>{
 for(const heading of [270,-90,630,260,280]){
  const sim=race(heading);stepLevel(sim,.01);
  assert.equal(sim.levelRun.complete,true,`heading ${heading}`);
  assert.equal(sim.levelRun.total,.01);
  assert.equal(sim.levelRun.hold,0);
  assert.equal(sim.state.port,0);
 }
});
test('bow-in, sideways and misaligned finishes are rejected even with four pilings',()=>{
 for(const heading of [90,0,180,259.9,280.1]){
  const sim=race(heading);stepLevel(sim,.01);
  assert.equal(sim.levelRun.complete,false,`heading ${heading}`);
  assert.match(sim.levelRun.status,/Finish stern-in/);
 }
});
test('race still requires the destination zone and four distinct bow/stern attachments',()=>{
 for(const mutation of [
  s=>{s.state.x+=100;},
  s=>{delete s.lines['port:bow'];},
  s=>{s.lines['port:bow'].target.id='race-south-east-piling-1-wall';},
  s=>{s.lines['port:bow'].target.id=s.lines['stbd:bow'].target.id;},
  s=>{s.lines['port:fwdSpring']=s.lines['port:bow'];delete s.lines['port:bow'];}
 ]){const sim=race();mutation(sim);stepLevel(sim,.01);assert.equal(sim.levelRun.complete,false);}
});
test('racing contact adds no time penalty',()=>{
 const sim=race();sim.collision={kind:'piling',id:'test',knots:3};stepLevel(sim,.01);
 assert.equal(sim.levelRun.complete,true);
 assert.equal(sim.levelRun.penalty,0);
 assert.equal(sim.levelRun.impacts[0].seconds,0);
 assert.equal(sim.levelRun.total,.01);
});
