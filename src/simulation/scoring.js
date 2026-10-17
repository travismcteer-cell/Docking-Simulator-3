import {effectivePower} from './faults.js?v=progression-52';
import {bodyPoint,nearestShape} from './collisions.js?v=traffic-padding-60';
export const SCORE_VERSION=1;
const clamp=(v,lo=0,hi=100)=>Math.max(lo,Math.min(hi,v));
export function safeClosingSpeed(clearanceFt){return Math.min(3,.15+.22*Math.sqrt(Math.max(0,clearanceFt)));}
export function createChallengeScore(sim){
 const outline=sim.outline,points=[];
 for(let i=0;i<Math.min(12,outline.length);i++)points.push(outline[Math.floor(i*outline.length/Math.min(12,outline.length))]);
 for(const axis of [0,1])for(const sign of [-1,1]){const p=outline.reduce((a,b)=>sign*b[axis]>sign*a[axis]?b:a);if(!points.includes(p))points.push(p);}
 const single=['singleOutboard','singleInboardRudder'].includes(sim.boat.propulsion.type);
 return {version:SCORE_VERSION,points,radius:Math.max(...outline.map(p=>Math.hypot(...p))),engines:single?1:2,gear:[0,0],lastDirection:[0,0],shifts:0,reversals:0,powerEffort:0,riskDose:0,unsafeSeconds:0,protectionSeconds:0,unprotectedSeconds:0,sequencePenalty:0,impactPenalty:0,cap:100,contacts:[],sampleClock:0,obstaclePositions:new Map(),obstacleClock:0,finalSum:0,finalSeconds:0};
}
export function recordControlStates(sim){
 const score=sim.levelRun?.score;if(!score||sim.levelRun.complete)return;
 for(let i=0;i<score.engines;i++){const gear=Math.sign(effectivePower(sim,i===0?'port':'stbd'));if(gear===score.gear[i])continue;score.shifts++;if(gear&&score.lastDirection[i]&&gear!==score.lastDirection[i])score.reversals++;if(gear)score.lastDirection[i]=gear;score.gear[i]=gear;}
}
// Relative point velocity includes the hull's rotation. Only closing motion is penalized.
export function approachRisk(sim,score,dt){
 const s=sim.state,scale=sim.scale,cx=s.x*scale,cy=s.y*scale,reach=score.radius+40,a=s.a*Math.PI/180,omega=(s.omega||0)*Math.PI/180;
 const candidates=(sim.solids||sim.docks||[]).filter(d=>!d.finished&&!d.scheduled&&cx+reach>d.x&&cx-reach<d.x+d.w&&cy+reach>d.y&&cy-reach<d.y+d.h);
 score.obstacleClock+=dt;let rate=0,protection=false,unprotected=false;
 for(const d of candidates){
  let ovx=0,ovy=0;const before=score.obstaclePositions.get(d.id);if(d.moving&&before&&score.obstacleClock>before.time){const elapsed=score.obstacleClock-before.time;ovx=(d.xCenter-before.x)/elapsed;ovy=(d.yCenter-before.y)/elapsed;}
  if(d.moving)score.obstaclePositions.set(d.id,{x:d.xCenter,y:d.yCenter,time:score.obstacleClock});
  for(const [bx,by] of score.points){const p=bodyPoint(s,bx,by,scale),near=nearestShape(p,d);if(near.dist>40)continue;
   const rx=p.x-cx,ry=p.y-cy,vx=s.vx*scale-omega*ry,vy=s.vy*scale+omega*rx;
   // Do not punish a stationary player solely because an NPC heads toward it.
   const ownClosing=Math.max(0,-(vx*near.nx+vy*near.ny))*.592484;
   const closing=ownClosing>.02?Math.max(0,-((vx-ovx)*near.nx+(vy-ovy)*near.ny))*.592484:0;
   const limit=safeClosingSpeed(near.dist),excess=Math.max(0,closing-limit);
   rate=Math.max(rate,Math.min(16,(excess/Math.max(.2,limit))**2));
   const sideToward=(-near.nx)*(-Math.sin(a))+(-near.ny)*Math.cos(a);
   if(near.dist<4&&closing>.03&&Math.abs(sideToward)>.55){protection=true;const side=sideToward<0?'port':'stbd';if(!sim.fenders[side])unprotected=true;}
  }
 }
 return {rate,protection,unprotected};
}
export function recordImpact(score,impact){
 // Existing collision feedback attenuates impact speed by .45 with fenders.
 const raw=impact.rawKnots??impact.knots/(impact.protected?.45:1);
 const severity=raw<.3?'gentle':raw<.8?'firm':raw<1.5?'hard':'crash';
 let penalty={gentle:3,firm:12,hard:35,crash:65}[severity];
 if(impact.protected&&raw<.8)penalty*=severity==='gentle'?0:.5;
 score.impactPenalty+=penalty;score.contacts.push({severity,protected:!!impact.protected,rawKnots:raw,penalty});
 if(severity==='hard')score.cap=Math.min(score.cap,49);if(severity==='crash')score.cap=Math.min(score.cap,24);
}
export function recordLineRelease(sim,line){
 const score=sim.levelRun?.score;if(!score||sim.levelRun.complete||sim.levelRun.definition.type!=='departure'||!line)return;
 if(sim.levelRun.definition.requireFenders&&!(sim.fenders.port&&sim.fenders.stbd)){score.sequencePenalty=10;return;}
 if(line.type!=='bow'&&line.type!=='stern')return;
 const point=line.target;if(!point)return;
 const near=Math.hypot(point.x-sim.state.x*sim.scale,point.y-sim.state.y*sim.scale)<score.radius+8;
 const a=sim.state.a*Math.PI/180,dx=point.x-sim.state.x*sim.scale,dy=point.y-sim.state.y*sim.scale;
 if(Math.abs(-dx*Math.sin(a)+dy*Math.cos(a))/Math.max(.01,Math.hypot(dx,dy))<.55)return;
 const side=line.side<0?'port':'stbd';
 if(near&&!sim.fenders[side])score.sequencePenalty=Math.min(10,score.sequencePenalty+5);
}
export function stepChallengeScore(sim,dt){
 const run=sim.levelRun,score=run?.score;if(!score||run.complete)return;
 recordControlStates(sim);
 const s=sim.state;score.powerEffort+=(effectivePower(sim,'port')**2+(score.engines===2?effectivePower(sim,'stbd')**2:0)+.1*effectivePower(sim,'bowThruster')**2)*dt;
 score.sampleClock+=dt;if(score.sampleClock+.000001>=.1){const period=score.sampleClock;score.sampleClock=0;const risk=approachRisk(sim,score,period);score.riskDose+=risk.rate*period;if(risk.rate>0)score.unsafeSeconds+=period;if(risk.protection)score.protectionSeconds+=period;if(risk.unprotected)score.unprotectedSeconds+=period;}
}
export function finalControlQuality(sim){
 const run=sim.levelRun,l=run.definition,s=sim.state,yaw=Math.abs(s.omega||0);
 if(l.type==='departure')return clamp(100-yaw*8);
 const angle=Math.asin(Math.min(1,Math.abs(Math.sin((s.a-l.heading)*Math.PI/180))))*180/Math.PI;
 const speed=Math.hypot(s.vx,s.vy)*110;
 return .4*clamp(100-angle*3.5)+.4*clamp(100-speed/Math.max(.1,l.speed)*35)+.2*clamp(100-yaw*25);
}
export function scoreBreakdown(sim,complete=false){
 const score=sim.levelRun.score;
 const protectionPenalty=Math.min(10,score.unprotectedSeconds*2);
 const safety=clamp(100-score.riskDose*1.5-score.impactPenalty-protectionPenalty-score.sequencePenalty);
 const finalControl=complete?(score.finalSeconds>0?score.finalSum/score.finalSeconds:finalControlQuality(sim)):0;
 const efficiency=clamp(100-Math.max(0,score.shifts-score.engines*12)-score.reversals*1.5-score.powerEffort*.2);
 const total=Math.min(score.cap,Math.round(safety*.7+finalControl*.2+efficiency*.1));
 const feedback=[];
 if(score.unsafeSeconds>.2)feedback.push('Slow the bow, stern or side earlier near obstacles.');
 if(protectionPenalty+score.sequencePenalty>0)feedback.push('Deploy fenders on the exposed side before approaching or casting off.');
 if(score.cap<100)feedback.push('A hard impact limits the overall score; prioritize a controlled approach.');
 else if(score.impactPenalty>0)feedback.push('Reduce closing speed before contact.');
 if(efficiency<90)feedback.push('Try fewer gear reversals and shorter powered bursts; make any correction needed for safety.');
 if(complete&&finalControl<90)feedback.push(sim.levelRun.definition.type==='departure'?'Steady the turn as you clear the berth.':'Settle closer to parallel with less movement before securing.');
 if(!feedback.length)feedback.push('Controlled handling, with no major deductions.');
 return {version:SCORE_VERSION,total,safety:Math.round(safety),finalControl:Math.round(finalControl),efficiency:Math.round(efficiency),cap:score.cap,shifts:score.shifts,reversals:score.reversals,unsafeSeconds:score.unsafeSeconds,contacts:score.contacts,feedback};
}
