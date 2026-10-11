import test from 'node:test';
import assert from 'node:assert/strict';
import {createSimulation,selectBoat,resetSimulation} from '../src/simulation/state.js';
import {TRAFFIC_ROUTES,setPracticeTraffic,stepPracticeTraffic,updateMovingHull,berthOccupied} from '../src/simulation/moving-traffic.js';
import {GAS_TRAFFIC_BERTHS,TRAFFIC_BERTH_IDS,TRAFFIC_ENTRANCE,TRAFFIC_EXIT,trafficBerthEnvelope} from '../src/data/traffic-routes.js';
import {setOtherBoats,npcShape} from '../src/simulation/traffic.js';
import {SOLIDS,DOCK_CLEATS,RACING_BERTHS} from '../src/data/marina.js';
import {hullAt,overlap,rectPoly} from '../src/simulation/collisions.js';
import {FLEET} from '../src/data/fleet.js';
import {stepPhysics} from '../src/simulation/physics.js';
import {startLevel,enterPractice,stepLevel} from '../src/simulation/levels.js';
const diff=(a,b)=>((a-b)%360+540)%360-180;
const bounds=points=>({minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))});
function obstaclesAt(points,objects){const b=bounds(points);return objects.filter(s=>s.x<b.maxX&&s.x+s.w>b.minX&&s.y<b.maxY&&s.y+s.h>b.minY&&overlap(points,s.points||rectPoly(s)));}
function routeSamples(r,check){let a=r.points[0].heading??Math.atan2(r.points[1].y-r.points[0].y,r.points[1].x-r.points[0].x)*180/Math.PI;const outline=npcShape(r.boatKey).outline;
 for(let i=0;i<r.points.length-1;i++){const p=r.points[i],q=r.points[i+1],h=q.heading??Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI,d=diff(h,a);for(let j=0;j<=12;j++)check(hullAt({x:p.x,y:p.y,a:a+d*j/12},outline,1),`turn ${i}`);const n=Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)/2);for(let j=0;j<=n;j++)check(hullAt({x:p.x+(q.x-p.x)*j/n,y:p.y+(q.y-p.y)*j/n,a:h},outline,1),`leg ${i}`);a=h;}
}
test('all ten paths and turning hulls clear dock geometry',()=>{
 assert.equal(TRAFFIC_ROUTES.length,10);
 for(const r of TRAFFIC_ROUTES.flatMap(r=>r.departurePoints?[r,{...r,id:r.id+' departure',points:r.departurePoints,end:null,start:r.end}]:[r])){routeSamples(r,(poly,where)=>assert.deepEqual(obstaclesAt(poly,SOLIDS).map(s=>s.id),[],r.id+' '+where));if(!r.start)assert.deepEqual({x:r.points[0].x,y:r.points[0].y},TRAFFIC_ENTRANCE);if(!r.end){const p=r.points.at(-1);assert.deepEqual({x:p.x,y:p.y},TRAFFIC_EXIT);}}
 for(let i=0;i<GAS_TRAFFIC_BERTHS.length;i++)for(let j=i+1;j<GAS_TRAFFIC_BERTHS.length;j++)assert(!overlap(trafficBerthEnvelope(GAS_TRAFFIC_BERTHS[i]),trafficBerthEnvelope(GAS_TRAFFIC_BERTHS[j])));
});
test('High parked density leaves route berths and approaches clear',()=>{
 const sim=createSimulation();let seed=18;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);setOtherBoats(sim,'high',random);
 assert(sim.otherBoats.length>150);
 assert(sim.otherBoats.every(b=>!TRAFFIC_BERTH_IDS.has(b.id)));
 for(const r of TRAFFIC_ROUTES.flatMap(r=>r.departurePoints?[r,{...r,id:r.id+' departure',points:r.departurePoints}]:[r]))routeSamples(r,(poly,where)=>assert.deepEqual(obstaclesAt(poly,sim.otherBoats).map(s=>s.id),[],r.id+' '+where));
 setPracticeTraffic(sim,'high');for(const b of sim.movingBoats){assert(!berthOccupied(sim,b,b.routeDefinition.start),b.routeDefinition.id+' source');assert(!berthOccupied(sim,b,b.routeDefinition.end),b.routeDefinition.id+' destination');}
 const models=new Set(sim.otherBoats.map(b=>npcShape(b.boatKey).entry.id));for(const e of Object.values(FLEET).filter(e=>e.npcOnly))assert(models.has(e.id),e.id);
 const classics=sim.otherBoats.filter(b=>npcShape(b.boatKey).entry.id==='classic-30').length;assert(classics>=2&&classics<=3);
});
test('traffic setting persists through reset, boat selection and a level round trip',()=>{
 const sim=createSimulation();for(const [density,count] of [['none',0],['medium',5],['high',10]]){setPracticeTraffic(sim,density);assert.equal(sim.movingBoats.length,count);}
 resetSimulation(sim,'a');assert.equal(sim.movingBoats.length,10);selectBoat(sim,'Motoryacht-60','f');assert.equal(sim.trafficDensity,'high');assert.equal(sim.movingBoats.length,10);
 startLevel(sim,'gas-arrival');assert.equal(sim.movingBoats.length,0);enterPractice(sim);assert.equal(sim.trafficDensity,'high');resetSimulation(sim);assert.equal(sim.movingBoats.length,10);
 setPracticeTraffic(sim,'none');assert.equal(sim.movingBoats.length,0);assert(sim.solids.every(s=>!s.practiceTraffic));
});
test('NPC holds 50 feet off an occupied berth and resumes once clear',()=>{
 const sim=createSimulation();setPracticeTraffic(sim,'high');const boat=sim.movingBoats.find(b=>b.routeDefinition.id==='entrance-north'),r=boat.routeDefinition,p=r.points.at(-2),end=r.end;
 sim.movingBoats=[boat];Object.assign(boat,{scheduled:false,segment:r.points.length-2,xCenter:p.x,yCenter:p.y,heading:90});updateMovingHull(boat);sim.state.x=end.x/sim.scale;sim.state.y=end.y/sim.scale;sim.state.a=90;
 assert(berthOccupied(sim,boat,end));for(let i=0;i<200;i++)stepPracticeTraffic(sim,.1);
 assert(Math.abs(Math.hypot(boat.xCenter-end.x,boat.yCenter-end.y)-50)<.1);assert(boat.waiting);
 const y=boat.yCenter;sim.state.x=700/sim.scale;sim.state.y=600/sim.scale;stepPracticeTraffic(sim,.1);assert(!boat.waiting);assert(boat.yCenter>y);
});
test('underway traffic holds course when the player occupies its path',()=>{
 const sim=createSimulation();setPracticeTraffic(sim,'high');const boat=sim.movingBoats.find(b=>b.routeDefinition.id==='fuel-exit');sim.movingBoats=[boat];const p=boat.route[1];Object.assign(boat,{scheduled:false,segment:1,xCenter:p.x,yCenter:p.y+50,heading:90});updateMovingHull(boat);sim.state.x=boat.xCenter/sim.scale;sim.state.y=(boat.yCenter+1)/sim.scale;
 const y=boat.yCenter;stepPracticeTraffic(sim,.1);assert(boat.yCenter>y);assert.equal(boat.waiting,false);assert.equal(boat.heading,90);
});
test('route cycling remains bounded and uses distinct routes',()=>{
 const sim=createSimulation();setPracticeTraffic(sim,'medium');sim.state.x=750/sim.scale;sim.state.y=650/sim.scale;sim.otherBoats=[];
 for(let i=0;i<3000;i++)stepPracticeTraffic(sim,.5);
 assert.equal(sim.movingBoats.length,5);assert.equal(new Set(sim.movingBoats.map(b=>b.routeDefinition.id)).size,5);
 for(const b of sim.movingBoats)assert(Number.isFinite(b.xCenter)&&Number.isFinite(b.yCenter)&&Number.isFinite(b.heading));
 assert(sim.solids.length<=SOLIDS.length+5);
});
test('helm locations follow the aft-cabin roof and aft starboard workboat positions',()=>{
 const yacht=FLEET['Motoryacht-60'],p=yacht.p,ft=.3048;
 const a=(p.aftCabinOffset-p.aft)*ft,b=a+p.aftCabinLength*ft,deck=x=>{const t=(x+p.aft*ft)/((p.aft+p.forward)*ft)*64,i=Math.min(63,Math.floor(t)),u=t-i;return yacht.model.vertices[yacht.model.rings[i][15]][1]*(1-u)+yacht.model.vertices[yacht.model.rings[i+1][15]][1]*u;};
 assert(yacht.helmFloor>Math.max(deck(a),deck(b))+(p.aftCabinLift+p.aftCabinHeight)*ft);assert(yacht.helm.height*ft>yacht.helmFloor);
 const work=FLEET['deadrise-40'];assert.equal(work.helm.forward,-10);assert(work.helm.side>0);assert(work.helm.height*ft>work.helmFloor);
});
test('motor yacht responds more reluctantly to rudder, differential thrust and bow thruster',()=>{
 for(const input of [{port:.25,stbd:.25,steer:35},{port:.25,stbd:-.25,steer:0},{port:0,stbd:0,bowThruster:1}]){
  const sim=createSimulation();selectBoat(sim,'Motoryacht-60');sim.solids=[];sim.fenderShapes=[];sim.state.x=0;sim.state.y=0;sim.state.a=0;Object.assign(sim.state,input);
  const old=structuredClone(sim);old.boat.propulsion.yawResponse=1;old.boat.propulsion.bowThruster.force=.007;old.boat.maneuvering.fullPowerTurnRadiusFt=30;old.boat.maneuvering.turnCalibrationResponse=1.45;
  for(let i=0;i<120;i++){stepPhysics(sim,1/120);stepPhysics(old,1/120);}
  assert(Math.abs(sim.state.omega)<Math.abs(old.state.omega)*.8,JSON.stringify(input));
 }
});
test('race piling attachments remain unchanged and challenge targets are not reserved traffic berths',()=>{
 const raceIds=DOCK_CLEATS.filter(c=>c.racePiling).map(c=>c.id);assert.equal(raceIds.length,32);
 for(const b of RACING_BERTHS)for(const id of b.pilingIds)assert(raceIds.includes(id));
 const sim=createSimulation();startLevel(sim,'workboat-race');assert(!TRAFFIC_BERTH_IDS.has('race-south-west-2'));
 startLevel(sim,'gas-departure');assert(sim.lines['port:bow']);assert(sim.lines['port:stern']);
 sim.lines={};const t=sim.levelRun.definition.target;sim.state.x=(t.x+10)/sim.scale;sim.state.y=(t.y+10)/sim.scale;sim.state.vx=.1;stepLevel(sim,.01);assert(sim.levelRun.complete);
});
