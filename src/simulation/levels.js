import {selectBoat} from './state.js?v=anchor-scenery-21';
import {setOtherBoats,npcShape} from './traffic.js?v=anchor-scenery-21';
import {SOLIDS,FENDER_SHAPES} from '../data/marina.js?v=basin-slips-18';
import {hullAt} from './collisions.js?v=levels-23';
import {attachLine} from './lines.js?v=fleet-14';
export const LEVELS=[
 {id:'gas-arrival',number:1,name:'Gas Dock Arrival',boat:'Express-33',density:'medium',spawn:{x:169,y:135,a:270},target:{x:133,y:39,w:72,h:9,label:'GAS DOCK'},description:'In calm water, approach the south face of the fuel pier. Settle alongside and secure with two lines.',objective:'Inside the gold zone, parallel to the pier, below 0.75 kt with two lines attached. Hold for 3 seconds.'},
 {id:'gas-departure',number:2,name:'Crowded Gas Dock Departure',boat:'sportfisher-30',density:'high',spawn:{x:168.1,y:43.5,a:0},target:{x:88,y:111,w:162,h:48,label:'OPEN BASIN'},description:'Cast off from the fuel pier between boats ahead and astern. Use the twin engines to reach the open basin. Port bow/stern lines and fenders start deployed.',objective:'Release every line, retrieve any anchor, and enter the gold exit zone. No speed limit or waiting period.'}
];
export const IMPACT_PENALTIES={gentle:2,firm:10,hard:30,crash:60};
export function classifyImpact(knots){return knots<.3?'gentle':knots<.8?'firm':knots<1.5?'hard':'crash';}
export function formatTime(seconds){const ticks=Math.round(Math.max(0,seconds)*10);return Math.floor(ticks/600)+':'+((ticks%600)/10).toFixed(1).padStart(4,'0');}
function seeded(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function startLevel(sim,id){const definition=LEVELS.find(l=>l.id===id);if(!definition)throw new Error('Unknown level: '+id);
 if(!sim.practiceSettings)sim.practiceSettings={boat:sim.model.id,spawn:sim.spawnId,density:sim.otherBoatsDensity,environment:{...sim.environment}};
 selectBoat(sim,definition.boat);Object.assign(sim.state,{x:definition.spawn.x/sim.scale,y:definition.spawn.y/sim.scale,a:definition.spawn.a});Object.assign(sim.environment,{wind:0,current:0,windDirection:90,currentDirection:180});setOtherBoats(sim,definition.density,seeded(100+definition.number));
 const t=definition.target,spawn=definition.spawn;
 sim.otherBoats=sim.otherBoats.filter(b=>Math.hypot(b.xCenter-spawn.x,b.yCenter-spawn.y)>50&&!(b.x+b.w>t.x-12&&b.x<t.x+t.w+12&&b.y+b.h>t.y-12&&b.y<t.y+t.h+12));
 if(definition.number===2){const shape=npcShape('bowrider21'),xs=sim.outline.map(p=>p[0]);for(const [id,x] of [['ahead',spawn.x+Math.max(...xs)+7+10.5],['astern',spawn.x+Math.min(...xs)-7-10.5]]){const points=hullAt({x,y:spawn.y,a:0},shape.outline,1),px=points.map(p=>p.x),py=points.map(p=>p.y);sim.otherBoats.push({id:'level-'+id,boatKey:'bowrider21',heading:0,xCenter:x,yCenter:spawn.y,x:Math.min(...px),y:Math.min(...py),w:Math.max(...px)-Math.min(...px),h:Math.max(...py)-Math.min(...py),points,kind:'boat'});}sim.fenders.port=true;attachLine(sim,'bow','port');attachLine(sim,'stern','port');if(Object.keys(sim.lines).length!==2)throw new Error('Departure starting lines could not attach');}
 sim.solids=[...SOLIDS,...sim.otherBoats];sim.fenderShapes=[...FENDER_SHAPES,...sim.otherBoats];sim.trafficRevision++;sim.contact=false;sim.collision=null;sim.mode='levels';sim.levelRevision=(sim.levelRevision||0)+1;sim.levelRun={definition,elapsed:0,penalty:0,impacts:[],hold:0,complete:false,contactTimes:new Map()};return sim.levelRun;
}
export function enterPractice(sim){const saved=sim.practiceSettings;sim.mode='practice';sim.levelRun=null;sim.levelRevision=(sim.levelRevision||0)+1;sim.practiceSettings=null;if(saved){sim.otherBoatsDensity=saved.density;Object.assign(sim.environment,saved.environment);selectBoat(sim,saved.boat,saved.spawn);}sim.collision=null;}
export function stepLevel(sim,dt){const run=sim.levelRun;if(sim.mode!=='levels'||!run||run.complete)return;run.elapsed+=dt;
 const impact=sim.collision;if(impact){const key=impact.kind+':'+impact.id,last=run.contactTimes.get(key);if(last===undefined||run.elapsed-last>.7){const severity=classifyImpact(impact.knots),seconds=IMPACT_PENALTIES[severity];run.impacts.push({...impact,severity,seconds,at:run.elapsed});run.penalty+=seconds;}run.contactTimes.set(key,run.elapsed);}
 const s=sim.state,t=run.definition.target,x=s.x*sim.scale,y=s.y*sim.scale,inside=x>=t.x&&x<=t.x+t.w&&y>=t.y&&y<=t.y+t.h,speed=Math.hypot(s.vx,s.vy)*110,lines=Object.keys(sim.lines).length,parallel=Math.abs(Math.sin(s.a*Math.PI/180))<=Math.sin(10*Math.PI/180);
 const departure=run.definition.number===2,secured=departure?lines===0&&sim.anchor.mode==='stowed':lines>=2&&parallel;run.hold=!departure&&inside&&speed<=.75&&secured?run.hold+dt:0;
 run.status=!inside?(departure?'Enter the gold exit zone':'Enter the gold docking zone'):departure?(lines>0?'Release every line':sim.anchor.mode!=='stowed'?'Retrieve the anchor':'Exit reached'):lines<2?'Attach two lines':!parallel?'Align parallel to the pier':speed>.75?'Slow below 0.75 kt':'Hold '+run.hold.toFixed(1)+' / 3s';
 if((departure&&inside&&secured)||(!departure&&run.hold+1e-9>=3)){run.complete=true;run.total=run.elapsed+run.penalty;s.port=0;s.stbd=0;s.bowThruster=0;}
}
