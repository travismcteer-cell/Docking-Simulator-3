import {SOLIDS,FENDER_SHAPES} from '../data/marina.js?v=traffic-padding-60';
import {buildTrafficRoutes,trafficBerthEnvelope} from '../data/traffic-routes.js?v=traffic-padding-60';
import {buildBerthSlots,npcShape} from './traffic.js?v=traffic-padding-60';
import {hullAt,overlap,rectPoly} from './collisions.js?v=traffic-padding-60';
export const TRAFFIC_ROUTES=buildTrafficRoutes(buildBerthSlots());
const angleTo=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
const difference=(a,b)=>((a-b)%360+540)%360-180;
export function updateMovingHull(boat){
 const shape=boat.shape??npcShape(boat.boatKey),points=hullAt({x:boat.xCenter,y:boat.yCenter,a:boat.heading},shape.outline,1);
 const xs=points.map(p=>p.x),ys=points.map(p=>p.y);Object.assign(boat,{points,x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)});
}
function refreshSolids(sim){const active=(sim.movingBoats||[]).filter(b=>!b.finished&&!b.scheduled);sim.solids=[...SOLIDS,...(sim.otherBoats||[]),...active];sim.fenderShapes=[...FENDER_SHAPES,...(sim.otherBoats||[]),...active];}
export function setPracticeTraffic(sim,density='none'){
 sim.trafficDensity=['medium','high'].includes(density)?density:'none';sim.trafficClock=0;sim.trafficRouteCursor=0;
 const count={none:0,medium:5,high:10}[sim.trafficDensity];sim.movingBoats=[];
 for(let i=0;i<count;i++){const route=TRAFFIC_ROUTES[i],first=route.points[0],shape=npcShape(route.boatKey),boat={id:'practice-traffic-'+i,kind:'boat',moving:true,practiceTraffic:true,boatKey:route.boatKey,shape,routeDefinition:route,route:route.points,segment:0,xCenter:first.x,yCenter:first.y,heading:first.heading??angleTo(first,route.points[1]),scheduled:true,finished:false,readyAt:i*6,waiting:false,dwell:0};updateMovingHull(boat);sim.movingBoats.push(boat);}
 sim.trafficRouteCursor=count%TRAFFIC_ROUTES.length;sim.movingRevision=(sim.movingRevision||0)+1;refreshSolids(sim);
}
export function berthOccupied(sim,boat,berth){
 if(!berth)return false;const outline=(boat.shape??npcShape(boat.boatKey)).outline,length=Math.max(...outline.map(p=>p[0]))-Math.min(...outline.map(p=>p[0]))+6,beam=Math.max(...outline.map(p=>p[1]))-Math.min(...outline.map(p=>p[1]))+4;const zone=trafficBerthEnvelope(berth,length,beam),player=sim.trafficPlayerHull??hullAt(sim.state,sim.outline,sim.scale);
 const xs=zone.map(p=>p.x),ys=zone.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const touches=points=>points.some(p=>p.x>=minX&&p.x<=maxX&&p.y>=minY&&p.y<=maxY)||!(points.every(p=>p.x<minX)||points.every(p=>p.x>maxX)||points.every(p=>p.y<minY)||points.every(p=>p.y>maxY));
 if(touches(player)&&overlap(zone,player))return true;
 return [...(sim.otherBoats||[]),...(sim.movingBoats||[])].some(b=>b!==boat&&!b.finished&&!b.scheduled&&b.x<maxX&&b.x+b.w>minX&&b.y<maxY&&b.y+b.h>minY&&overlap(zone,b.points||rectPoly(b)));
}
function resetRoute(sim,boat){let route;for(let i=0;i<TRAFFIC_ROUTES.length;i++){const candidate=TRAFFIC_ROUTES[sim.trafficRouteCursor++%TRAFFIC_ROUTES.length];if(!sim.movingBoats.some(b=>b!==boat&&b.routeDefinition.id===candidate.id)){route=candidate;break;}}route??=boat.routeDefinition;const first=route.points[0];Object.assign(boat,{routeDefinition:route,boatKey:route.boatKey,shape:npcShape(route.boatKey),route:route.points,segment:0,xCenter:first.x,yCenter:first.y,heading:first.heading??angleTo(first,route.points[1]),finished:false,scheduled:true,readyAt:sim.trafficClock+12,dwell:0,waiting:false});updateMovingHull(boat);}
export function stepPracticeTraffic(sim,dt){
 if(sim.mode==='levels'||!sim.movingBoats?.some(b=>b.practiceTraffic))return;
 sim.trafficPlayerHull=hullAt(sim.state,sim.outline,sim.scale);sim.trafficClock+=dt;let membershipChanged=false;
 for(const boat of sim.movingBoats){
  const route=boat.routeDefinition;
  if(boat.scheduled){
   if(sim.trafficClock<boat.readyAt||berthOccupied(sim,boat,route.start))continue;
   // Stagger entrance spawns against other NPCs; underway traffic ignores the player.
   if(sim.movingBoats.some(b=>b!==boat&&!b.scheduled&&!b.finished&&Math.hypot(b.xCenter-boat.xCenter,b.yCenter-boat.yCenter)<45))continue;
   boat.scheduled=false;membershipChanged=true;
  }
  if(boat.segment>=boat.route.length-1){
   boat.dwell+=dt;
   if(boat.dwell>route.dwellSeconds&&route.departurePoints){
    const points=route.departurePoints;
    boat.routeDefinition={...route,start:route.end,end:null,points,departurePoints:null};
    boat.route=points;boat.segment=0;boat.dwell=0;boat.waiting=false;
   }
   continue;
  }
  const next=boat.route[boat.segment+1],targetHeading=next.heading??angleTo({x:boat.xCenter,y:boat.yCenter},next);
  // At about 50 ft from the destination, stop advancing until its envelope clears.
  const remaining=route.end?Math.hypot(boat.xCenter-route.end.x,boat.yCenter-route.end.y):Infinity;
  boat.waiting=!!route.end&&remaining<=50.05&&berthOccupied(sim,boat,route.end);
  if(boat.waiting)continue;
  const turn=difference(targetHeading,boat.heading),maxTurn=24*dt;
  boat.heading+=Math.max(-maxTurn,Math.min(maxTurn,turn));
  // Turn at the defined clear-water waypoints before advancing down the next leg.
  if(Math.abs(turn)>.2){updateMovingHull(boat);continue;}
  const dx=next.x-boat.xCenter,dy=next.y-boat.yCenter,dist=Math.hypot(dx,dy),docking=remaining<65;
  let travel=Math.min(dist,(docking?1.2:route.speedKt)*1.68781*dt);
  if(route.end&&remaining>50&&remaining<70&&berthOccupied(sim,boat,route.end)){
   // Solve the 50 ft circle intersection to avoid overshooting the holding point.
   const ux=dx/(dist||1),uy=dy/(dist||1),ex=boat.xCenter-route.end.x,ey=boat.yCenter-route.end.y,b=ex*ux+ey*uy,disc=b*b-(ex*ex+ey*ey-2500);
   if(disc>=0){const hit=-b-Math.sqrt(disc);if(hit>=0)travel=Math.min(travel,hit);}
  }
  if(dist>1e-9){boat.xCenter+=dx/dist*travel;boat.yCenter+=dy/dist*travel;}
  if(dist<=travel+1e-8){boat.xCenter=next.x;boat.yCenter=next.y;boat.segment++;if(boat.segment===boat.route.length-1&&!route.end){boat.finished=true;resetRoute(sim,boat);membershipChanged=true;}}
  updateMovingHull(boat);
 }
 delete sim.trafficPlayerHull;if(membershipChanged)refreshSolids(sim);
}
