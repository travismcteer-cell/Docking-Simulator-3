import {attachLine} from './lines.js?v=navigation-handling-30';
import {fenderBeam,FENDER_TUNING} from './fenders.js?v=navigation-handling-30';
import {setPracticeTraffic} from './moving-traffic.js?v=races-40';
import {stowAnchor} from './anchor.js?v=navigation-handling-30';
import {setOtherBoats} from './traffic.js?v=races-40';
import {BOAT,SCALE,OUTLINE} from '../data/boats.js?v=anchor-scenery-21';
import {DOCKS,DOCK_CLEATS,SPAWNS,SOLIDS,FENDER_SHAPES,BOUNDS} from '../data/marina.js?v=races-40';
import {FLEET} from '../data/fleet.js?v=gas-helm-cockpit-39';
import {hullAt,overlap,rectPoly} from './collisions.js?v=navigation-handling-30';
export function createSimulation(){const sim={boat:BOAT,scale:SCALE,outline:OUTLINE,docks:DOCKS,solids:SOLIDS,fenderShapes:FENDER_SHAPES,bounds:BOUNDS,dockCleats:DOCK_CLEATS,environment:{wind:0,current:0,windDirection:90,currentDirection:180},state:{},lines:{},fenders:{port:false,stbd:false,contactPort:0,contactStbd:0},contact:false,otherBoatsDensity:'medium',trafficDensity:'none'};selectBoat(sim,'Express-33');return sim;}
export function selectBoat(sim,id,name='f'){const entry=FLEET[id];if(!entry)throw new Error('Unknown boat: '+id);if(entry.npcOnly)throw new Error('This boat is NPC-only: '+id);Object.assign(sim,{boat:entry.handling,model:entry,outline:entry.outline,lineDefs:entry.lineDefs,geometryLength:entry.geometryLength,helm:entry.helm});resetSimulation(sim,name);}
export function resetSimulation(sim,name='f'){sim.workboatDynamics=null;sim.spawnId=name;sim.movingBoats=[];sim.solids=SOLIDS;sim.fenderShapes=FENDER_SHAPES;let p=SPAWNS[name]||SPAWNS.f;
 if(name==='gasAlongside'){const dock=DOCKS.find(d=>d.id==='dock135'),beam=Math.max(...[-.3,-.1,.1,.3].map(station=>fenderBeam(sim,station)),...sim.outline.map(q=>Math.abs(q[1])));p={...p,x:168.1,y:dock.y+dock.h+beam+FENDER_TUNING.radiusFt+.15,a:0};}
Object.assign(sim.state,{x:p.x/sim.scale,y:p.y/sim.scale,a:p.a,vx:0,vy:0,omega:0,port:0,stbd:0,steer:0,bowThruster:0});sim.lines={};stowAnchor(sim);Object.assign(sim.fenders,{port:false,stbd:false,contactPort:0,contactStbd:0});sim.contact=false;
 if(sim.model?.id!=='Express-33'){
  const clear=(x,y)=>{const poly=hullAt({...sim.state,x:x/sim.scale,y:y/sim.scale},sim.outline,sim.scale),b=sim.bounds;if(poly.some(q=>q.x<b.minX||q.x>b.maxX||q.y<b.minY||q.y>b.maxY))return false;const radius=Math.max(...sim.outline.map(q=>Math.hypot(...q)));return !sim.solids.some(d=>{const pts=d.points||rectPoly(d);if(pts.every(q=>q.x<x-radius)||pts.every(q=>q.x>x+radius)||pts.every(q=>q.y<y-radius)||pts.every(q=>q.y>y+radius))return false;return overlap(poly,pts);});};
  let found=clear(p.x,p.y);for(let r=2;!found&&r<=80;r+=2)for(let i=0;i<24;i++){const a=i*Math.PI/12,x=p.x+r*Math.cos(a),y=p.y+r*Math.sin(a);if(clear(x,y)){sim.state.x=x/sim.scale;sim.state.y=y/sim.scale;found=true;break;}}
  if(!found){sim.state.a=SPAWNS.f.a;sim.state.x=SPAWNS.f.x/sim.scale;sim.state.y=SPAWNS.f.y/sim.scale;}
 }
 if(name==='gasAlongside'){sim.fenders.port=true;for(const type of ['bow','stern']){attachLine(sim,type,'port');if(!sim.lines['port:'+type])throw new Error('Gas dock starting '+type+' line could not attach');}}
 setOtherBoats(sim,sim.otherBoatsDensity||'none');setPracticeTraffic(sim,sim.trafficDensity||'none');
}
