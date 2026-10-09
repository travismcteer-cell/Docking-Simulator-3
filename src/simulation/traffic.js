import {DOCKS,DOCK_POLYGONS,SPAWNS,SOLIDS,FENDER_SHAPES} from '../data/marina.js?v=touch-9';
import {FLEET} from '../data/fleet.js?v=fleet-14';
import {hullAt,overlap,rectPoly} from './collisions.js?v=fleet-14';
// NPC dimensions and berth weighting preserved from the supplied 2D game.
export const NPC_BOATS={bowrider21:{model:'bowrider',length:21,beam:8.5},inboard30:{model:'sportfisher-30',length:30,beam:10.5},cruiser31:{model:'Express-33',length:31,beam:10.4},motorYacht42:{model:'sportfisher-50',length:55,beam:17.7},runabout18:{model:'bowrider',length:18,beam:7.3}};
export function npcShape(key){const spec=NPC_BOATS[key],entry=FLEET[spec.model],xs=entry.outline.map(p=>p[0]),ys=entry.outline.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,sx=spec.length/(Math.max(...xs)-Math.min(...xs)),sz=spec.beam/(Math.max(...ys)-Math.min(...ys));return {entry,cx,cy,sx,sz,outline:entry.outline.map(([x,y])=>[(x-cx)*sx,(y-cy)*sz])};}
  export function buildBerthSlots(){
    const m={docks:DOCKS,world:{widthFt:1,heightFt:1},dockPolygons:DOCK_POLYGONS.map(p=>({...p,points:p.points.map(q=>[q.x,q.y])}))};
    if(!m) return [];
    const docks=m.docks||[];
    const byId=id=>docks.find(d=>d.id===id);
    const slots=[];
    const add=(section,id,x,y,heading,maxLengthFt,maxBeamFt,preferredBoatKey=null)=>{
      if(!Number.isFinite(x)||!Number.isFinite(y)) return;
      slots.push({section,id,x,y,heading,maxLengthFt,maxBeamFt,preferredBoatKey});
    };

    // Utility: slips between parallel vertical fingers. Boats lie vertically.
    // When splitAtPiling=true, each clear gap contains a midpoint piling and
    // therefore TWO real slips: finger-to-piling and piling-to-next-finger.
    const verticalFingerRow=(section,prefix,rowCode,heading,boundaryDockId=null,includeEnds=false,splitAtPiling=false)=>{
      const row=docks.filter(d=>d.id.startsWith(prefix) && d.id.endsWith('-'+rowCode)).sort((a,b)=>a.x-b.x);
      if(row.length<2) return;
      const sample=row[0];
      const y=sample.y+sample.h/2;
      const maxLengthFt=sample.h*(m.world.heightFt||1);
      for(let i=0;i<row.length-1;i++){
        const left=row[i],right=row[i+1];
        const gapL=left.x+left.w,gapR=right.x;
        if(splitAtPiling){
          const pileX=(gapL+gapR)/2;
          const beamLeft=(pileX-gapL)*(m.world.widthFt||1);
          const beamRight=(gapR-pileX)*(m.world.widthFt||1);
          if(beamLeft>=8) add(section,`${section}-${rowCode}-${i}-L`,(gapL+pileX)/2,y,heading,maxLengthFt,beamLeft);
          if(beamRight>=8) add(section,`${section}-${rowCode}-${i}-R`,(pileX+gapR)/2,y,heading,maxLengthFt,beamRight);
        } else {
          const maxBeamFt=(gapR-gapL)*(m.world.widthFt||1);
          if(maxBeamFt>=8) add(section,`${section}-${rowCode}-${i}`,(gapL+gapR)/2,y,heading,maxLengthFt,maxBeamFt);
        }
      }
      if(includeEnds && boundaryDockId){
        const boundary=byId(boundaryDockId);
        if(boundary){
          const first=row[0],last=row[row.length-1];
          const leftGapL=boundary.x,leftGapR=first.x;
          const leftBeam=(leftGapR-leftGapL)*(m.world.widthFt||1);
          if(leftBeam>=8) add(section,`${section}-${rowCode}-edgeL`,(leftGapL+leftGapR)/2,y,heading,maxLengthFt,leftBeam);
          const rightGapL=last.x+last.w,rightGapR=boundary.x+boundary.w;
          const rightBeam=(rightGapR-rightGapL)*(m.world.widthFt||1);
          if(rightBeam>=8) add(section,`${section}-${rowCode}-edgeR`,(rightGapL+rightGapR)/2,y,heading,maxLengthFt,rightBeam);
        }
      }
    };

    // Utility: slips between parallel horizontal fingers. Boats lie horizontally.
    const horizontalFingerLane=(section,prefix,heading)=>{
      const lane=docks.filter(d=>d.id.startsWith(prefix)).sort((a,b)=>a.y-b.y);
      if(lane.length<2) return;
      const sample=lane[0];
      const x=sample.x+sample.w/2;
      const maxLengthFt=sample.w*(m.world.widthFt||1);
      for(let i=0;i<lane.length-1;i++){
        const top=lane[i],bottom=lane[i+1];
        const gapT=top.y+top.h,gapB=bottom.y;
        const maxBeamFt=(gapB-gapT)*(m.world.heightFt||1);
        if(maxBeamFt>=8) add(section,`${section}-${prefix}-${i}`,x,(gapT+gapB)/2,heading,maxLengthFt,maxBeamFt);
      }
    };

    // A — wide double-occupancy slips. Each space between adjacent finger
    // docks has a piling down the middle, creating TWO berths: one boat on
    // each side of that piling.
    verticalFingerRow('A','A-finger-','71',270,'dock1',true,true);
    verticalFingerRow('A','A-finger-','89',90,'dock1',true,true);
    verticalFingerRow('A','A-finger-','120',270,'dock2',true,true);
    verticalFingerRow('A','A-finger-','138',90,'dock2',true,true);
    const aSea=docks.filter(d=>d.id.startsWith('A-seawall-')).sort((a,b)=>a.x-b.x);
    if(aSea.length>1){
      const sample=aSea[0], y=sample.y+sample.h/2;
      for(let i=0;i<aSea.length-1;i++){
        const gapL=aSea[i].x+aSea[i].w,gapR=aSea[i+1].x;
        const beam=(gapR-gapL)*(m.world.widthFt||1);
        if(beam>=8) add('A',`A-seawall-${i}`,(gapL+gapR)/2,y,90,20,beam,'runabout18');
      }
    }

    // B — narrower single-occupancy slips. Each space between adjacent finger
    // docks is ONE berth, so the boat belongs on the centreline of the clear
    // water gap rather than being split to either side of a piling.
    for(const code of ['269','285','327','343']){
      const lane=docks.filter(d=>/^B-finger-\d+-/.test(d.id) && d.id.endsWith('-'+code)).sort((a,b)=>a.y-b.y);
      if(lane.length>1){
        const sample=lane[0],x=sample.x+sample.w/2;
        const heading=(code==='269'||code==='327')?180:0;
        const maxLengthFt=sample.w*(m.world.widthFt||1);
        for(let i=0;i<lane.length-1;i++){
          const gapT=lane[i].y+lane[i].h,gapB=lane[i+1].y;
          const maxBeamFt=(gapB-gapT)*(m.world.heightFt||1);
          if(maxBeamFt>=8) add('B',`B-${code}-${i}`,x,(gapT+gapB)/2,heading,maxLengthFt,maxBeamFt);
        }
      }
    }
    const bSea=docks.filter(d=>d.id.startsWith('B-seawall-')).sort((a,b)=>a.y-b.y);
    if(bSea.length>1){
      const sample=bSea[0],x=sample.x+sample.w/2;
      for(let i=0;i<bSea.length-1;i++){
        const gapT=bSea[i].y+bSea[i].h,gapB=bSea[i+1].y;
        const beam=(gapB-gapT)*(m.world.heightFt||1);
        if(beam>=8) add('B',`B-seawall-${i}`,x,(gapT+gapB)/2,180,20,beam,'runabout18');
      }
    }

    // C — slips on the east side of the long pier and on both sides of the
    // shorter fuel-pier finger. No boats are placed in the fairway itself.
    horizontalFingerLane('C','C-east-finger-',0);
    horizontalFingerLane('C','C-short-west-',180);
    horizontalFingerLane('C','C-short-east-',0);

    // E — the 60 ft slips along the north side of the tight basin.
    const eNorth=docks.filter(d=>d.id.startsWith('E-north-finger-')).sort((a,b)=>a.x-b.x);
    if(eNorth.length>1){
      const sample=eNorth[0],y=sample.y+sample.h/2;
      const maxLengthFt=sample.h*(m.world.heightFt||1);
      for(let i=0;i<eNorth.length-1;i++){
        const gapL=eNorth[i].x+eNorth[i].w,gapR=eNorth[i+1].x;
        const beam=(gapR-gapL)*(m.world.widthFt||1);
        if(beam>=8) add('E',`E-north-${i}`,(gapL+gapR)/2,y,270,maxLengthFt,beam);
      }
    }

    // D — stern-to Med berths along the diagonal quay. The inner edge of poly0
    // is the usable quay face; centres are offset into the basin perpendicular
    // to it so the stern sits close to the wall.
    const med=(m.dockPolygons||[]).find(p=>p.id==='poly0');
    if(med && med.points?.length>=4){
      const a=med.points[3],b=med.points[2];
      const dxFt=(b[0]-a[0])*(m.world.widthFt||1);
      const dyFt=(b[1]-a[1])*(m.world.heightFt||1);
      const quayLenFt=Math.hypot(dxFt,dyFt);
      const count=Math.max(6,Math.floor(quayLenFt/20));
      const heading=285;
      const h=heading*Math.PI/180;
      const centreOffsetFt=16;
      for(let i=0;i<count;i++){
        const t=(i+.5)/count;
        const qx=a[0]+(b[0]-a[0])*t;
        const qy=a[1]+(b[1]-a[1])*t;
        add('D',`D-med-${i}`,
          qx+Math.cos(h)*centreOffsetFt/(m.world.widthFt||1),
          qy+Math.sin(h)*centreOffsetFt/(m.world.heightFt||1),
          heading,60,22);
      }
    }

    return slots;
  }


function shuffled(items,random){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function boatForBerth(slot,random=Math.random){if(slot.preferredBoatKey)return slot.preferredBoatKey;const weighted=['D','E'].includes(slot.section)?['motorYacht42','motorYacht42','motorYacht42','motorYacht42','motorYacht42','cruiser31','cruiser31','cruiser31','inboard30','bowrider21']:['bowrider21','bowrider21','inboard30','inboard30','cruiser31','cruiser31','motorYacht42'];let choices=weighted.filter(k=>NPC_BOATS[k].length<=slot.maxLengthFt+1.5&&NPC_BOATS[k].beam<=slot.maxBeamFt-.5);if(!choices.length)choices=['bowrider21'];return choices[Math.floor(random()*choices.length)];}
export function plannedSlots(spawnId,density,random=Math.random){if(!['low','medium','high'].includes(density))return [];const spawn=SPAWNS[spawnId]||SPAWNS.f,fraction={low:.3,medium:.6,high:1}[density],target={low:28,medium:58,high:95}[density],candidates=buildBerthSlots().filter(p=>Math.hypot(p.x-spawn.x,p.y-spawn.y)>16),selected=[];for(const section of new Set(candidates.map(s=>s.section))){const slots=shuffled(candidates.filter(s=>s.section===section),random),count=Math.min(slots.length,['A','B'].includes(section)?target:Math.round(slots.length*fraction));selected.push(...slots.slice(0,count));}return selected.map(s=>({...s,boatKey:boatForBerth(s,random)}));}
function shapeBounds(points){const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y));return {x,y,w:Math.max(...points.map(p=>p.x))-x,h:Math.max(...points.map(p=>p.y))-y,points};}
function intersects(a,b){return a.x+a.w>b.x&&a.x<b.x+b.w&&a.y+a.h>b.y&&a.y<b.y+b.h&&overlap(a.points,b.points||rectPoly(b));}
export function setOtherBoats(sim,density,random=Math.random){sim.otherBoatsDensity=['none','low','medium','high'].includes(density)?density:'none';const player=shapeBounds(hullAt(sim.state,sim.outline,sim.scale)),boats=[];for(const slot of plannedSlots(sim.spawnId,sim.otherBoatsDensity,random)){const shape=npcShape(slot.boatKey),a=slot.heading*Math.PI/180;let placed=null;
 // Preserve slip centrelines, sliding outward when a 3D stern or platform
 // would intersect the quay, especially for the larger Med boats.
 for(let offset=0;offset<=18;offset+=.5){const x=slot.x+Math.cos(a)*offset,y=slot.y+Math.sin(a)*offset,points=hullAt({x,y,a:slot.heading},shape.outline,1),bounds=shapeBounds(points);if(points.some(p=>p.x<sim.bounds.minX||p.x>sim.bounds.maxX||p.y<sim.bounds.minY||p.y>sim.bounds.maxY))continue;if(SOLIDS.some(s=>intersects(bounds,s))||boats.some(s=>intersects(bounds,s))||intersects(bounds,player))continue;if(Math.hypot(x-sim.state.x*sim.scale,y-sim.state.y*sim.scale)<16)continue;placed={...slot,...bounds,xCenter:x,yCenter:y,kind:'boat'};break;}if(placed)boats.push(placed);}
 sim.otherBoats=boats;sim.solids=[...SOLIDS,...boats];sim.fenderShapes=[...FENDER_SHAPES,...boats];sim.trafficRevision=(sim.trafficRevision||0)+1;
}
