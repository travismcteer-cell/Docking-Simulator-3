import test from 'node:test';
import assert from 'node:assert/strict';
import {createChallengeScore,approachRisk,safeClosingSpeed,recordControlStates,recordImpact,recordLineRelease,stepChallengeScore,scoreBreakdown} from '../src/simulation/scoring.js';
import {createSimulation} from '../src/simulation/state.js';
import {LEVELS,RACES,startLevel,stepLevel} from '../src/simulation/levels.js';
function fixture(){const sim={scale:1,outline:[[-10,-4],[10,-4],[10,4],[-10,4]],boat:{propulsion:{type:'twinSterndrive'}},state:{x:0,y:0,a:0,vx:0,vy:0,omega:0,port:0,stbd:0,bowThruster:0},fenders:{port:false,stbd:false},lines:{},anchor:{mode:'stowed'},solids:[{id:'dock',x:14,y:-30,w:10,h:60}],levelRun:{definition:{type:'arrival',heading:0,speed:.75},complete:false,hold:0}};sim.levelRun.score=createChallengeScore(sim);return sim;}
test('safety uses closing velocity, not parallel speed or receding motion',()=>{
 const s=fixture();s.state.vy=2/.592484;assert.equal(approachRisk(s,s.levelRun.score,.1).rate,0);
 s.state.vy=0;s.state.vx=2/.592484;assert(approachRisk(s,s.levelRun.score,.1).rate>0);
 s.state.vx=-2/.592484;assert.equal(approachRisk(s,s.levelRun.score,.1).rate,0);
 s.state.vx=0;s.state.omega=30;assert(approachRisk(s,s.levelRun.score,.1).rate>0,'a rotating corner can approach quickly');
 assert(safeClosingSpeed(1)<safeClosingSpeed(4));assert(safeClosingSpeed(4)<safeClosingSpeed(25));
});
test('fenders protect relevant sides without permitting a fast approach',()=>{
 const s=fixture();s.solids=[{id:'dock',x:-30,y:-8,w:60,h:2}];s.state.vy=-.2/.592484;
 let risk=approachRisk(s,s.levelRun.score,.1);assert(risk.protection&&risk.unprotected);
 s.fenders.stbd=true;assert(approachRisk(s,s.levelRun.score,.1).unprotected,'wrong-side fenders do not earn protection');
 s.fenders.port=true;assert(!approachRisk(s,s.levelRun.score,.1).unprotected);
 s.state.vy=-2/.592484;assert(approachRisk(s,s.levelRun.score,.1).rate>0);
});
test('gear changes include very short holds but throttle/steering adjustments do not count as shifts',()=>{
 const s=fixture(),q=s.levelRun.score;s.state.port=.1;recordControlStates(s);assert.equal(q.shifts,1);
 s.state.port=.25;s.state.steer=30;recordControlStates(s);assert.equal(q.shifts,1);
 s.state.port=0;recordControlStates(s);s.state.port=-.1;recordControlStates(s);assert.equal(q.shifts,3);assert.equal(q.reversals,1);
 recordControlStates(s);assert.equal(q.shifts,3);q.shifts=100;assert(scoreBreakdown(s,true).efficiency<30);
});
test('gentle fendered contact is acceptable; hard contacts retain caps despite fenders',()=>{
 const s=fixture(),q=s.levelRun.score;recordImpact(q,{knots:.1,protected:true});assert.equal(q.impactPenalty,0);
 recordImpact(q,{knots:1*.45,protected:true});assert.equal(q.cap,49);assert.equal(scoreBreakdown(s,true).total,49);
 recordImpact(q,{knots:1.6*.45,protected:true});assert.equal(q.cap,24);assert(scoreBreakdown(s,true).total<=24);
 assert.equal(q.contacts.at(-1).severity,'crash');
});
test('neutral waiting cannot erase risk or missing-fender deductions',()=>{
 const s=fixture(),q=s.levelRun.score;s.state.vx=2/.592484;for(let i=0;i<10;i++)stepChallengeScore(s,.1);q.unprotectedSeconds=3;q.finalSum=300;q.finalSeconds=3;
 const before=scoreBreakdown(s,true);s.state.vx=0;for(let i=0;i<200;i++)stepChallengeScore(s,.1);const after=scoreBreakdown(s,true);
 assert.equal(after.safety,before.safety);assert.equal(after.total,before.total);
});
test('departure protection sequence applies to exposed side lines, not stern-to quay lines',()=>{
 const s=fixture(),q=s.levelRun.score;s.levelRun.definition.type='departure';
 recordLineRelease(s,{type:'bow',side:-1,target:{x:2,y:-7}});assert.equal(q.sequencePenalty,5);
 s.fenders.port=true;recordLineRelease(s,{type:'stern',side:-1,target:{x:2,y:-7}});assert.equal(q.sequencePenalty,5);
 s.fenders.port=false;recordLineRelease(s,{type:'stern',side:-1,target:{x:-14,y:-1}});assert.equal(q.sequencePenalty,5);
});
test('safety dominates efficiency and hard-impact runs cannot outrank clean completions',()=>{
 const clean=fixture();clean.levelRun.score.shifts=100;const unsafe=fixture();recordImpact(unsafe.levelRun.score,{knots:1,protected:false});
 assert(scoreBreakdown(clean,true).total>scoreBreakdown(unsafe,true).total);
});
test('all thirty challenges complete with bounded breakdowns, and restarts clear score state',()=>{
 const s=createSimulation();
 for(const level of LEVELS){startLevel(s,level.id);const l=s.levelRun.definition,t=l.target;Object.assign(s.state,{x:(t.x+t.w/2)/s.scale,y:(t.y+t.h/2)/s.scale,a:l.heading,vx:0,vy:0,omega:0});
  if(l.requireFenders)s.fenders.port=s.fenders.stbd=true;s.lines=l.type==='departure'?{}:{'port:stern':{},'stbd:stern':{}};s.anchor={mode:l.requireAnchor?'holding':'stowed',target:l.anchorDropZone?{x:l.anchorDropZone.x+l.anchorDropZone.w/2,y:l.anchorDropZone.y+l.anchorDropZone.h/2}:{x:0,y:0}};
  for(let i=0;i<400&&!s.levelRun.complete;i++)stepLevel(s,1/120);
  assert(s.levelRun.complete,level.id);const r=s.levelRun.result;assert(r&&r.total>=0&&r.total<=100);assert.equal(s.levelRun.total,r.total);assert.equal(s.levelRun.penalty,0);assert.equal(r.finalControl,100);assert(r.feedback.length);
 }
 startLevel(s,LEVELS[0].id);s.levelRun.score.riskDose=9;startLevel(s,LEVELS[0].id);assert.equal(s.levelRun.score.riskDose,0);assert.equal(s.levelRun.score.shifts,0);
 startLevel(s,RACES[0].id);assert.equal(s.levelRun.score,undefined);
});
test('unprotected actual impacts deduct points, and persistent resting contact is one event',()=>{
 const s=createSimulation();startLevel(s,LEVELS[0].id);s.collision={id:'test-dock',kind:'dock',knots:.5,protected:false};stepLevel(s,.01);assert.equal(s.levelRun.score.contacts.length,1);assert.equal(s.levelRun.score.impactPenalty,12);
 for(let i=0;i<100;i++)stepLevel(s,.01);assert.equal(s.levelRun.score.contacts.length,1);
 s.collision=null;stepLevel(s,1);s.collision={id:'test-dock',kind:'dock',knots:.5,protected:false};stepLevel(s,.01);assert.equal(s.levelRun.score.contacts.length,2);
});
