import {createChallengeScore,stepChallengeScore,recordImpact,finalControlQuality,scoreBreakdown} from './scoring.js?v=progression-52';
import {selectBoat} from './state.js?v=progression-52';
import {setOtherBoats,npcShape,buildBerthSlots} from './traffic.js?v=races-40';
import {SOLIDS,FENDER_SHAPES,DOCK_POLYGONS,SPAWNS,RACING_BERTHS} from '../data/marina.js?v=races-40';
import {hullAt,overlap,rectPoly} from './collisions.js?v=navigation-handling-30';
import {anchorBowPoint} from './anchor.js?v=navigation-handling-30';
import {FLEET} from '../data/fleet.js?v=staged-spin-56';
import {attachLine} from './lines.js?v=navigation-handling-30';
const feet=(x,y,a)=>({x:x*180-650,y:y*120-525,a});
const box=(x,y,w,h,label)=>({x:x*180-650,y:y*120-525,w:w*180,h:h*120,label});
const centered=(x,y,w,h,label,rotation=0)=>({x:x-w/2,y:y-h/2,w,h,label,rotation});
const slots=buildBerthSlots(),aSlot=slots.find(s=>s.id==='A-138-5-L'),yachtSlot=slots.find(s=>s.id==='E-north-4');
const wall=DOCK_POLYGONS.find(p=>p.id==='poly0'),qa=wall.points[3],qb=wall.points[2],medHeading=285,angle=medHeading*Math.PI/180;
const medRotation=Math.atan2(qb.y-qa.y,qb.x-qa.x)*180/Math.PI;
function medPose(boat,t=.5){const stern=-Math.min(...FLEET[boat].outline.map(p=>p[0])),offset=stern+1.5;return {x:qa.x+(qb.x-qa.x)*t+Math.cos(angle)*offset,y:qa.y+(qb.y-qa.y)*t+Math.sin(angle)*offset,a:medHeading};}
function medTarget(boat){const p=medPose(boat);return centered(p.x,p.y,25,12,'D · MED BERTH',medRotation);}
const medAnchorZone=centered((qa.x+qb.x)/2+Math.cos(angle)*85,(qa.y+qb.y)/2+Math.sin(angle)*85,32,24,'DROP ANCHOR',medRotation);
const medNeighbours=[.22,.78].map((t,i)=>({...medPose('sportfisher-30',t),id:'med-neighbour-'+i,boatKey:'inboard30'}));
export const LEVELS=[
 {id:'gas-arrival',number:1,name:'Gas Dock Arrival',boat:'Express-33',density:'medium',spawn:{x:169,y:135,a:270},target:{x:133,y:39,w:72,h:9,label:'GAS DOCK'},description:'In calm water, approach the south face of the fuel pier. Settle alongside and secure with two lines.',objective:'Inside the gold zone, parallel to the pier, below 0.75 kt with two lines attached. Hold for 3 seconds.'},
 {id:'gas-departure',number:2,startFenders:'port',name:'Crowded Gas Dock Departure',boat:'sportfisher-30',density:'high',spawn:{x:168.1,y:43.5,a:0},target:{x:88,y:111,w:162,h:48,label:'OPEN BASIN'},description:'Cast off from the fuel pier between boats ahead and astern. Use the twin engines to reach the open basin. Port bow/stern lines and fenders start deployed.',objective:'Release every line, retrieve any anchor, and enter the gold exit zone. No speed limit or waiting period.'},
 {id:'finger-crosswind',number:3,name:'Finger Slip Crosswind',boat:'bowrider',density:'medium',type:'arrival',spawn:feet(1.9,4.15,270),target:centered(aSlot.x,aSlot.y,9,18,'A · FINGER SLIP'),heading:270,wind:10,windDirection:90,current:0,currentDirection:180,speed:.75,description:'Bring the single-outboard bowrider into an A-section finger slip in a 10 kt crosswind, then secure with two lines.',obstacles:[{...slots.find(s=>s.id==='A-138-5-R'),a:90,id:'a-neighbour',boatKey:'bowrider21'}]},
 {id:'west-cross-current',number:4,name:'West Pier Cross-Current',boat:'Express-33',density:'medium',type:'arrival',spawn:feet(3.55,3.95,270),target:centered(61.3,-165,6,36,'C · WEST PIER'),heading:270,wind:8,windDirection:90,current:.4,currentDirection:270,speed:.70,description:'Bring the Express-33 alongside the west face of the long fuel jetty in wind and cross-current. Secure with two lines.',obstacles:[{...feet(3.9625,2.5,270),id:'west-neighbour',boatKey:'inboard30'}]},
 {id:'yacht-tight-departure',number:5,name:'Big Yacht Tight Departure',boat:'Motoryacht-60',density:'high',type:'departure',spawn:{x:yachtSlot.x,y:yachtSlot.y-5,a:270},target:box(1.3,4.1,.65,.35,'CLEAR FAIRWAY'),wind:14,windDirection:270,current:.6,currentDirection:90,startLines:[['bow','stbd'],['aftSpring','stbd'],['stern','stbd']],startFenders:'stbd',description:'Cast off the 60-foot motor yacht from an E-section slip between neighbors. Use engines and bow thruster to clear the berth in strong wind and current.',obstacles:[3,5].map(i=>{const b=slots.find(s=>s.id==='E-north-'+i);return {x:b.x,y:b.y-5,a:270,id:'north-yacht-'+i,boatKey:'motorYacht42'};})},
 {id:'gas-squeeze',number:6,name:'Gas Dock Squeeze',boat:'bowrider',density:'high',type:'arrival',spawn:feet(4.55,5.45,270),target:centered(168.1,42.5,12,8,'C · FUEL GAP'),heading:0,wind:15,windDirection:180,current:.8,currentDirection:270,speed:.60,description:'Place the single-outboard bowrider between two boats at the fuel pier in strong wind and current. Secure with two lines.',gasNeighbours:true},
 {id:'windy-fuel-departure',number:7,name:'Windy Fuel Dock Departure',boat:'Express-33',density:'high',type:'departure',spawn:{x:168.1,y:43.5,a:0},target:box(6.23,7.76,.4,.5,'F · SOUTH EXIT'),wind:16,windDirection:270,current:.8,currentDirection:90,startLines:[['bow','port'],['aftSpring','port'],['stern','port']],startFenders:'port',gasNeighbours:true,movingTraffic:true,description:'Cast off from the fuel pier in strong wind and current, yield to a departing boat, and follow the eastern fairway to the entrance.'},
 {id:'med-windy-arrival',number:8,name:'Windy Med Arrival',boat:'Express-33',density:'medium',type:'arrival',spawn:feet(4.25,6.85,105),target:medTarget('Express-33'),heading:285,wind:14,windDirection:90,current:.2,currentDirection:180,speed:.70,requireAnchor:true,requireSternPair:true,description:'Approach the diagonal Med quay in a crosswind. Drop anchor, reverse stern-to, and attach both port and starboard stern lines.',obstacles:medNeighbours},
 {id:'med-yacht-departure',number:9,name:'Crowded Yacht Departure',boat:'Motoryacht-60',density:'high',type:'departure',spawn:medPose('Motoryacht-60'),target:box(6.23,7.76,.4,.5,'F · SOUTH EXIT'),wind:10,windDirection:270,current:.3,currentDirection:90,startLines:[['stern','port'],['stern','stbd']],startFenders:'both',startAnchor:true,description:'Release both stern lines, retrieve the anchor, and guide the 60-foot motor yacht past neighboring boats and through the entrance.',obstacles:medNeighbours},
 {id:'precision-anchor',number:10,name:'Precision Anchor Drop',boat:'sportfisher-30',density:'high',type:'arrival',spawn:feet(4.3,6.70,105),target:medTarget('sportfisher-30'),heading:285,wind:9,windDirection:90,current:.2,currentDirection:180,speed:.65,requireAnchor:true,requireSternPair:true,anchorDropZone:medAnchorZone,description:'Drop the anchor inside the orange zone, then reverse the twin-inboard cruiser between neighbors to the diagonal Med quay and attach both stern lines.',obstacles:medNeighbours},


];
// Three rounds retain task identity while increasing the conditions.
const baseChanges={
 2:{target:centered(300,230,80,55,'LARGE BASIN · EXIT')},3:{wind:3},4:{wind:4},
 5:{target:centered(165,190,100,60,'BASIN · GAS DOCK FRONT'),wind:3},6:{wind:4,current:.4},
 7:{target:centered(300,230,80,55,'LARGE BASIN · EXIT'),wind:8,current:.4,name:'Windy Dock Departure'},8:{wind:8},9:{wind:4},
 10:{boat:'Motoryacht-60',name:'Motor Yacht Med Arrival',target:medTarget('Motoryacht-60'),wind:4,anchorDropZone:null}
};
for(const l of LEVELS){Object.assign(l,baseChanges[l.number]||{});l.taskId=l.id;l.taskNumber=l.number;l.group=1;l.revision=2;l.gasNeighbours ||= l.number===2;l.objective=undefined;
 l.description=['','Approach the gas dock directly and secure alongside.','Walk sideways away from the crowded gas dock, then enter the nearby open-basin target.','Dock the single-outboard boat in a finger slip with a light crosswind.','Use an angled approach against opposing wind and current.','Use the bow thruster to depart the tight yacht berth and reach the large basin.','Dock precisely between neighbours at the gas dock.','Depart the fuel dock in wind without relying on a bow thruster.','Reverse to the Med quay with an anchor and both stern lines.','Release the Med mooring and depart safely between neighbouring boats.','Anchor and reverse the motor yacht to the Med quay; no precision anchor-drop zone.'][l.number];}
const weather={2:{wind:5,windDirection:0},3:{wind:10},4:{wind:10},5:{wind:14},6:{wind:15,current:1},7:{wind:14},8:{wind:15},9:{wind:10},10:{wind:10}};
const longSlot=slots.find(s=>s.id==='A-120-3-L');
const complications={1:{failures:{port:true}},2:{crossingTraffic:'basin'},
 3:{boat:'Express-33',wind:6,failures:{stbd:true},spawn:{x:longSlot.x,y:longSlot.y+100,a:270},target:centered(longSlot.x,longSlot.y,9,20,'A · LONG FINGER SLIP'),obstacles:[]},
 4:{crossingTraffic:'west'},5:{failures:{bowThruster:true}},6:{boat:'sportfisher-30',gasGap:40},7:{wind:20},
 8:{wind:8,failures:{port:true}},9:{wind:4,closeMed:true,requireFenders:true},10:{wind:4,closeMed:true,requireFenders:true}};
const base=LEVELS.slice();
for(let group=2;group<=3;group++)for(const l of base){const variant={...l,...weather[l.taskNumber],...(group===3?complications[l.taskNumber]:{}),id:l.taskId+'-g'+group,number:(group-1)*10+l.taskNumber,group,objective:undefined};variant.description=l.description+' '+(group===2?'Repeat the task in harder weather.':'Manage the specified advanced conditions, traffic or failure.');LEVELS.push(variant);}
// These adjustments apply only to the specified rounds, after variants are built.
for(const l of LEVELS){
 if([2,5,7].includes(l.taskNumber)||l.number===11)l.revision=3;
 if([7,17].includes(l.number))l.movingTraffic=false;
 if(l.number===11){l.wind=7;l.windDirection=45;l.description='Approach and secure at the gas dock in a 7 kt northeast wind.';}
}
LEVELS.find(l=>l.number===23).description='Dock the Express-33 in the longer finger slip with 6 kt wind and the starboard engine unavailable.';
LEVELS.find(l=>l.number===26).description='Dock the compact sportfisher in a 40-foot gap with opposing wind and current.';
function closeMedNeighbours(boat){
 const pose=medPose(boat),dx=qb.x-qa.x,dy=qb.y-qa.y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
 const player=hullAt({x:0,y:0,a:pose.a},FLEET[boat].outline,1).map(p=>p.x*ux+p.y*uy),shape=npcShape('motorYacht42'),other=hullAt({x:0,y:0,a:pose.a},shape.outline,1).map(p=>p.x*ux+p.y*uy);
 const width=Math.max(...other)-Math.min(...other),boats=[];
 for(const side of [-1,1])for(let i=0;i<2;i++){const offset=side>0?Math.max(...player)+5-Math.min(...other)+i*(width+5):Math.min(...player)-5-Math.max(...other)-i*(width+5);boats.push({id:'close-med-'+side+'-'+i,boatKey:'motorYacht42',x:pose.x+ux*offset,y:pose.y+uy*offset,a:pose.a});}
 return boats;
}
for(const l of LEVELS)if(l.closeMed)l.obstacles=closeMedNeighbours(l.boat);
for(const l of LEVELS){l.type??=l.taskNumber===2?'departure':'arrival';l.heading??=0;l.speed??=.75;l.objective??=l.type==='departure'?'Release every line, retrieve the anchor, and enter the exit zone.':(l.requireAnchor?(l.anchorDropZone?'Anchor in the orange zone; ':'Anchor deployed; ')+'both stern lines; ':'Two lines; ')+'align with the berth below '+l.speed+' kt and hold for 3 seconds.';if(l.gasGap)l.objective+=' Dock within a 40-foot gap.';if(l.requireFenders)l.objective+=' Both-side fenders required.';if(l.failures)l.objective+=' Equipment failure active from the start.';if(l.crossingTraffic)l.objective+=' Watch for crossing traffic and wait for a safe opening.';}
export const RACES=[
 ['workboat-race','racingSouth','race-south-west-2'],
 ['workboat-course-2','racing','race-west-2'],
 ['workboat-course-3','racing','race-south-west-2'],
 ['workboat-course-4','racingSouth','race-west-2'],
 ['workboat-course-5','racingBow','race-south-west-2']
].map(([id,spawnId,finishId],i)=>{
 const berth=RACING_BERTHS.find(b=>b.id===finishId),west=finishId==='race-west-2';
 return {id,number:i+1,name:'Course '+(i+1),boat:'deadrise-40',density:'none',type:'race',spawnId,spawn:SPAWNS[spawnId],target:centered(berth.x,berth.y,west?40:25,west?25:40,'FINISH · FOUR LINES'),heading:berth.a,requiredPilingIds:berth.pilingIds,contactPenalties:false,description:'Start at '+SPAWNS[spawnId].label+'. Race to the middle '+(west?'west-wall':'southwest')+' slip and finish stern-in with four lines. Contact adds no penalties.',objective:'Finish stern-in, aligned within 10°, with both bow and both stern lines attached to four separate destination pilings. Early throttle adds 5 seconds.'};
});
export function raceLight(run){if(run?.definition.type!=='race'||run.complete)return null;const t=run.startElapsed??2.5;return t<1?'red':t<1.5?'yellow':t<2.5?'green':null;}
export function registerRaceThrottle(sim){const run=sim.levelRun;if(run?.definition.type==='race'&&(run.startElapsed??1.5)<1.5&&!run.falseStart){run.falseStart=true;run.penalty+=5;}}
export function stepRaceStart(sim,dt){const run=sim.levelRun;if(run?.definition.type!=='race')return dt;const before=run.startElapsed??1.5;if(before<1.5&&(sim.state.port||sim.state.stbd))registerRaceThrottle(sim);run.startElapsed=before+dt;return Math.max(0,run.startElapsed-1.5)-Math.max(0,before-1.5);}
export function pointInZone(zone,x,y){if(!zone)return false;const a=-(zone.rotation||0)*Math.PI/180,cx=zone.x+zone.w/2,cy=zone.y+zone.h/2,dx=x-cx,dy=y-cy;return Math.abs(dx*Math.cos(a)-dy*Math.sin(a))<=zone.w/2&&Math.abs(dx*Math.sin(a)+dy*Math.cos(a))<=zone.h/2;}
function npc(spec){const shape=npcShape(spec.boatKey),points=hullAt({x:spec.x,y:spec.y,a:spec.a},shape.outline,1),px=points.map(p=>p.x),py=points.map(p=>p.y);return {...spec,heading:spec.a,xCenter:spec.x,yCenter:spec.y,x:Math.min(...px),y:Math.min(...py),w:Math.max(...px)-Math.min(...px),h:Math.max(...py)-Math.min(...py),points,kind:'boat'};}
function gasNeighbours(sim,spawn,gap){const xs=sim.outline.map(p=>p[0]),front=gap?gap/2:Math.max(...xs)+7,back=gap?-gap/2:Math.min(...xs)-7;return [['ahead',spawn.x+front+10.5],['astern',spawn.x+back-10.5]].map(([id,x])=>npc({id:'level-'+id,boatKey:'bowrider21',x,y:spawn.y,a:0}));}
export const IMPACT_PENALTIES={gentle:2,firm:10,hard:30,crash:60};
export function classifyImpact(knots){return knots<.3?'gentle':knots<.8?'firm':knots<1.5?'hard':'crash';}
export function formatTime(seconds){const ticks=Math.round(Math.max(0,seconds)*10);return Math.floor(ticks/600)+':'+((ticks%600)/10).toFixed(1).padStart(4,'0');}
function seeded(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function startLevel(sim,id){const definition=[...LEVELS,...RACES].find(l=>l.id===id);if(!definition)throw new Error('Unknown level: '+id);
 if(!sim.practiceSettings)sim.practiceSettings={boat:sim.model.id,spawn:sim.spawnId,density:sim.otherBoatsDensity,trafficDensity:sim.trafficDensity,environment:{...sim.environment}};
 selectBoat(sim,definition.boat,definition.spawnId);sim.failures={...(definition.failures||{})};Object.assign(sim.state,{x:definition.spawn.x/sim.scale,y:definition.spawn.y/sim.scale,a:definition.spawn.a});Object.assign(sim.environment,{wind:definition.wind||0,current:definition.current||0,windDirection:definition.windDirection??90,currentDirection:definition.currentDirection??180});setOtherBoats(sim,definition.density,seeded(100+definition.number));
 const t=definition.target,spawn=definition.spawn,curated=(definition.obstacles||[]).map(npc);
 if(definition.taskId==='gas-departure'||definition.gasNeighbours)curated.push(...gasNeighbours(sim,definition.taskId==='gas-squeeze'?{x:168.1,y:42.5,a:0}:spawn,definition.gasGap));
 const playerHull=hullAt(sim.state,sim.outline,sim.scale);
 for(const b of curated){if(SOLIDS.some(d=>overlap(b.points,d.points||rectPoly(d)))||overlap(b.points,playerHull))throw new Error('Blocked challenge boat: '+b.id);}
 sim.otherBoats=sim.otherBoats.filter(b=>Math.hypot(b.xCenter-spawn.x,b.yCenter-spawn.y)>50&&Math.hypot(b.xCenter-(t.x+t.w/2),b.yCenter-(t.y+t.h/2))>50&&!(b.x+b.w>t.x-15&&b.x<t.x+t.w+15&&b.y+b.h>t.y-15&&b.y<t.y+t.h+15)&&!curated.some(c=>overlap(b.points,c.points)));
 sim.otherBoats.push(...curated);sim.movingBoats=[];
 if(definition.movingTraffic)sim.movingBoats.push(npc({id:'departing-traffic',boatKey:'bowrider21',...feet(5.4,5.0,90),moving:true,route:[[5.4,5.0],[5.4,5.55],[6.35,6.4],[6.4,7.4],[6.4,8.5],[6.4,8.9]].map(([x,y])=>feet(x,y)),segment:0}));
 if(definition.crossingTraffic){const route=(definition.crossingTraffic==='basin'?[{x:220,y:190},{x:380,y:190}]:[{x:-20,y:-120},{x:48,y:-120}]);sim.movingBoats.push(npc({id:'crossing-traffic',boatKey:'bowrider21',x:route[0].x,y:route[0].y,a:0,moving:true,route,segment:0,loop:true,speedKt:2,startAt:3,dwell:0}));}
 if(definition.startFenders){sim.fenders.port=['port','both'].includes(definition.startFenders);sim.fenders.stbd=['stbd','both'].includes(definition.startFenders);}
 if(definition.startAnchor){const bow=anchorBowPoint(sim),target={x:bow.x+Math.cos(angle)*35,y:bow.y+Math.sin(angle)*35};sim.anchor={mode:'holding',target,lengthFt:Math.hypot(target.x-bow.x,target.y-bow.y)+2,tension:0,notice:''};}
 const startLines=definition.taskId==='gas-departure'?[['bow','port'],['stern','port']]:definition.startLines||[];
 for(const [type,side] of startLines){attachLine(sim,type,side);if(!sim.lines[side+':'+type])throw new Error('Starting line could not attach: '+definition.name+' '+type+' '+side);}
 sim.solids=[...SOLIDS,...sim.otherBoats,...sim.movingBoats];sim.fenderShapes=[...FENDER_SHAPES,...sim.otherBoats,...sim.movingBoats];sim.trafficRevision++;sim.contact=false;sim.collision=null;sim.mode='levels';sim.levelRevision=(sim.levelRevision||0)+1;sim.levelRun={definition,startElapsed:0,elapsed:0,penalty:0,impacts:[],hold:0,complete:false,contactTimes:new Map()};if(definition.type!=='race')sim.levelRun.score=createChallengeScore(sim);return sim.levelRun;
}
export function enterPractice(sim){const saved=sim.practiceSettings;sim.mode='practice';sim.failures={};sim.levelRun=null;sim.movingBoats=[];sim.levelRevision=(sim.levelRevision||0)+1;sim.practiceSettings=null;if(saved){sim.otherBoatsDensity=saved.density;sim.trafficDensity=saved.trafficDensity||'none';Object.assign(sim.environment,saved.environment);selectBoat(sim,saved.boat,saved.spawn);}sim.collision=null;}
export function stepLevel(sim,dt){const run=sim.levelRun;if(sim.mode!=='levels'||!run||run.complete)return;run.elapsed+=dt;
 const impact=sim.collision;if(impact){const key=impact.kind+':'+impact.id,last=run.contactTimes.get(key);if(last===undefined||run.elapsed-last>.7){const raw=impact.knots/(impact.protected?.45:1),severity=classifyImpact(run.score?raw:impact.knots),seconds=run.score||run.definition.contactPenalties===false?0:IMPACT_PENALTIES[severity];run.impacts.push({...impact,severity,seconds,at:run.elapsed});run.penalty+=seconds;if(run.score)recordImpact(run.score,impact);}run.contactTimes.set(key,run.elapsed);}
 stepChallengeScore(sim,dt);
 const s=sim.state,l=run.definition,t=l.target,x=s.x*sim.scale,y=s.y*sim.scale,inside=pointInZone(t,x,y),speed=Math.hypot(s.vx,s.vy)*110,lines=Object.keys(sim.lines).length,parallel=Math.abs(Math.sin((s.a-l.heading)*Math.PI/180))<=Math.sin(10*Math.PI/180),departure=l.type==='departure';
 // Racing requires the directed stern-in heading and four distinct destination pilings.
 if(l.type==='race'){
  const targets=['port:bow','stbd:bow','port:stern','stbd:stern'].map(key=>sim.lines[key]?.target?.id).filter(id=>l.requiredPilingIds.includes(id));
  const attached=new Set(targets).size;
  // Unlike ordinary parallel docking, the opposite (bow-in) heading cannot finish.
  const headingError=Math.abs(((s.a-l.heading)%360+540)%360-180),sternIn=headingError<=10;
  run.status=!inside?'Reach the marked middle slip':!sternIn?'Finish stern-in · within 10°':'Attach bow and stern lines · '+attached+' / 4';
  if(inside&&sternIn&&attached===4){run.complete=true;run.total=run.elapsed+run.penalty;s.port=0;s.stbd=0;s.bowThruster=0;}
  return;
 }
 const sternPair=!!sim.lines['port:stern']&&!!sim.lines['stbd:stern'],anchored=!l.requireAnchor||sim.anchor.mode!=='stowed',anchorInZone=!l.anchorDropZone||!!sim.anchor.target&&pointInZone(l.anchorDropZone,sim.anchor.target.x,sim.anchor.target.y);
 const fendersReady=!l.requireFenders||sim.fenders.port&&sim.fenders.stbd;
 const secured=fendersReady&&(departure?lines===0&&sim.anchor.mode==='stowed':lines>=2&&parallel&&anchored&&anchorInZone&&(!l.requireSternPair||sternPair));
 run.hold=!departure&&inside&&speed<=l.speed&&secured?run.hold+dt:0;
 if(run.score&&!departure){if(run.hold>0){run.score.finalSum+=finalControlQuality(sim)*dt;run.score.finalSeconds+=dt;}else{run.score.finalSum=0;run.score.finalSeconds=0;}}
 run.status=!fendersReady?'Deploy fenders on both sides':!inside?(departure?'Enter the gold exit zone':'Enter the docking zone'):departure?(lines>0?'Release every line':sim.anchor.mode!=='stowed'?'Retrieve the anchor':'Exit reached'):!anchored?'Deploy the anchor':!anchorInZone?'Anchor must be in orange zone':l.requireSternPair&&!sternPair?'Attach both stern lines':lines<2?'Attach two lines':!parallel?'Align with the berth':speed>l.speed?'Slow below '+l.speed+' kt':'Hold '+run.hold.toFixed(1)+' / 3s';
 if((departure&&inside&&secured)||(!departure&&run.hold+1e-9>=3)){if(run.score)run.result=scoreBreakdown(sim,true);run.complete=true;run.total=run.result?.total??run.elapsed+run.penalty;s.port=0;s.stbd=0;s.bowThruster=0;}
}
export function stepLevelTraffic(sim,dt){const run=sim.levelRun;if(!run||run.complete)return;for(const boat of sim.movingBoats||[]){if(boat.finished||run.elapsed<(boat.startAt??9))continue;if(boat.dwell>0){boat.dwell=Math.max(0,boat.dwell-dt);continue;}let travel=(boat.speedKt??2.4)/.592484*dt;while(travel>0&&!boat.finished){const end=boat.route[boat.segment+1];if(!end){if(boat.loop){boat.route.reverse();boat.segment=0;boat.dwell=8;break;}boat.finished=true;sim.solids=sim.solids.filter(s=>s!==boat);sim.fenderShapes=sim.fenderShapes.filter(s=>s!==boat);break;}const dx=end.x-boat.xCenter,dy=end.y-boat.yCenter,dist=Math.hypot(dx,dy),move=Math.min(travel,dist);if(dist>1e-8){boat.xCenter+=dx/dist*move;boat.yCenter+=dy/dist*move;boat.heading=Math.atan2(dy,dx)*180/Math.PI;}travel-=move;if(dist<=move+1e-8)boat.segment++;const fresh=npc({...boat,x:boat.xCenter,y:boat.yCenter,a:boat.heading});Object.assign(boat,fresh);}}}
