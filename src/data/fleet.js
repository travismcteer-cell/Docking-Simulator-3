import {definitions} from './fleet-definitions.js?v=fleet-npcs-20';
import {buildBoat} from './boat-generator.js?v=fleet-npcs-20';
import {model,definition,p} from './express-33.js?v=express-13';
import {BOAT,OUTLINE} from './boats.js?v=fleet-npcs-20';
const FT=.3048;
// Handling calibration copied from the old 2D game's named boat profiles.
const profiles={
 bowrider:{dimensions:{lengthFt:21,beamFt:8.5},propulsion:{type:'singleOutboard',maxSteerDeg:35,thrust:.070,reverseEfficiency:.92,reverseSteerGain:1.22,driveX:-.47,engineY:0,steeringYawGain:1.10,flowSteerGain:.20,reverseFlowSteerGain:.72},hydrodynamics:{waterCenterX:-.16,airCenterX:.12,forwardLinearDrag:.050,forwardQuadraticDrag:.25,lateralLinearDrag:.46,lateralQuadraticDrag:.78,yawDampingBase:.14,yawDampingSpeedGain:8.5,yawDampingSpeedMax:.18},maneuvering:{fullPowerTurnRadiusFt:15,turnCalibrationResponse:2.25}},
 'sportfisher-30':{dimensions:{lengthFt:30,beamFt:10.5},propulsion:{type:'twinInboardRudder',maxSteerDeg:35,thrust:.064,reverseEfficiency:.88,driveX:-.38,engineY:.16,rudderX:-.47,rudderWashGain:.62,reverseRudderGain:.08,flowRudderGain:.58,reverseFlowRudderGain:.45,propWalkYawGainAhead:8,propWalkYawGainReverse:16},hydrodynamics:{waterCenterX:-.20,airCenterX:.08,forwardLinearDrag:.058,forwardQuadraticDrag:.31,lateralLinearDrag:.58,lateralQuadraticDrag:1,yawDampingBase:.19,yawDampingSpeedGain:10,yawDampingSpeedMax:.23},maneuvering:{fullPowerTurnRadiusFt:24,turnCalibrationResponse:1.7}},
 'Motoryacht-60':{dimensions:{lengthFt:55,beamFt:17.7},propulsion:{type:'twinInboardRudder',maxSteerDeg:35,thrust:.058,reverseEfficiency:.88,driveX:-.39,engineY:.17,rudderX:-.47,rudderWashGain:.58,reverseRudderGain:.07,flowRudderGain:.54,reverseFlowRudderGain:.42,propWalkYawGainAhead:6.8,propWalkYawGainReverse:13,bowThruster:{force:.007,xBody:.42}},hydrodynamics:{waterCenterX:-.18,airCenterX:.10,forwardLinearDrag:.064,forwardQuadraticDrag:.34,lateralLinearDrag:.64,lateralQuadraticDrag:1.10,yawDampingBase:.22,yawDampingSpeedGain:11,yawDampingSpeedMax:.27},maneuvering:{fullPowerTurnRadiusFt:30,turnCalibrationResponse:1.45}}
};
export function deckAt(data,p,x){const t=Math.max(0,Math.min(64,(x+p.aft*FT)/((p.aft+p.forward)*FT)*64)),i=Math.min(63,Math.floor(t)),u=t-i;const a=data.vertices[data.rings[i][15]],b=data.vertices[data.rings[i+1][15]];return a.map((v,j)=>v+(b[j]-v)*u);}
function convexHull(points){const sorted=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const chain=ps=>{const h=[];for(const q of ps){while(h.length>1&&cross(h[h.length-2],h[h.length-1],q)<=0)h.pop();h.push(q);}h.pop();return h;};return [...chain(sorted),...chain(sorted.slice().reverse())];}
const expressLines={bow:{xFrac:41/108,xBody:.4,beam:2.3212,height:4.2917,label:'Bow'},fwdSpring:{xFrac:18/108,xBody:.18,beam:4.5645,height:4.2917,label:'Forward spring'},aftSpring:{xFrac:-18/108,xBody:-.18,beam:5.0017,height:4.2917,label:'Aft spring'},stern:{xFrac:-45/108,xBody:-.42,beam:4.6248,height:3.15,label:'Stern'}};
export const FLEET={'Express-33':{id:'Express-33',name:'Express-33 · Twin sterndrive',definition,model,p,handling:BOAT,outline:OUTLINE,geometryLength:31,originShift:0,lineDefs:expressLines,helm:{forward:.05/FT,side:.65/FT,height:1.9086576/FT},platformLength:2}};
for(const def of definitions){
 const p={...def.hull};for(const c of Object.values(def.components))Object.assign(p,c);p.enclosure=1;p.enclosureMount=def.components.enclosure.mount;p.accessory=def.components.accessory.type;p.accessoryMount=def.components.accessory.mount;
 const model=buildBoat(p),length=p.aft+p.forward,shift=(p.forward-p.aft)/2,platform=def.id==='bowrider'||def.handlingProfile==='twin-outboard'?0:2;
 const points=model.rail.flatMap(r=>r.map(i=>{const v=model.vertices[i];return [v[0]/FT-shift,v[2]/FT];}));
 if(platform)for(const sign of [-1,1])points.push([-p.aft-shift-platform,sign*p.beam*p.stern*.46]);
 // Include the outboard's swept footprint in the plan-view collision envelope.
 if(def.id==='bowrider'||def.handlingProfile==='twin-outboard')for(const sign of [-1,1])points.push([-p.aft-shift-3.2,sign*1.8]);
 const lineDefs={};for(const [type,frac,label] of [['bow',.38,'Bow'],['fwdSpring',.18,'Forward spring'],['aftSpring',-.18,'Aft spring'],['stern',-.42,'Stern']]){const x=frac*length+shift,d=deckAt(model,p,x*FT);lineDefs[type]={xFrac:frac,xBody:frac,beam:Math.max(.2,d[2]/FT-.2),height:d[1]/FT+.06,label};}
 const x0=(p.enclosureOffset-p.aft)*FT,x1=x0+p.enclosureLength*FT,hasRoof=p.enclosureMount==='roof'&&p.cabinHeight>0;
 const back=(p.cabinOffset-p.aft)*FT,front=back+p.cabinLength*FT,cockpitFloor=Math.min(deckAt(model,p,(p.cockpitOffset-p.aft)*FT)[1],deckAt(model,p,(p.cockpitOffset+p.cockpit-p.aft)*FT)[1])-p.cockpitDepth*FT;
 const roofBase=Math.max(cockpitFloor,deckAt(model,p,front)[1])+.025+p.cabinHeight*FT+.11;
 const mount=hasRoof?roofBase:p.enclosureMount==='floor'?cockpitFloor:Math.max(deckAt(model,p,x0)[1],deckAt(model,p,x1)[1]);
 const top=mount+(p.enclosureLift+p.enclosureHeight)*FT,wheelX=x1-p.enclosureHeight*FT*Math.tan(p.enclosureRake*Math.PI/180)-.38;
 let helm={forward:wheelX/FT-shift,side:deckAt(model,p,wheelX)[2]*p.enclosureWidth/100*.55/FT,height:top/FT};
 let helmFloor=hasRoof?mount:cockpitFloor;
 // The motor yacht is driven from inside its independent pilot house.
 if(p.pilotHouseHeight>1){const a=(p.pilotHouseOffset-p.aft)*FT,b=a+p.pilotHouseLength*FT,baseA=deckAt(model,p,a)[1]+p.pilotHouseLift*FT,baseB=deckAt(model,p,b)[1]+p.pilotHouseLift*FT,eye=Math.max(baseA,baseB)+p.pilotHouseHeight*FT,hx=b-p.pilotHouseHeight*FT*Math.tan(p.pilotHouseRake*Math.PI/180)-.38;helmFloor=baseA+(baseB-baseA)*(hx-a)/(b-a);helm={forward:hx/FT-shift,side:deckAt(model,p,hx)[2]*p.pilotHouseWidth/100*.55/FT,height:(baseB+(eye-baseB)*.86)/FT};}
 FLEET[def.id]={id:def.id,name:def.name+(def.id==='bowrider'?' · Single outboard':def.handlingProfile==='twin-outboard'?' · Twin outboard':def.handlingProfile==='twin-sterndrive'?' · Twin sterndrive':def.handlingProfile==='unspecified'?'':' · Twin inboard'),definition:def,model,p,npcOnly:!!def.npcOnly,handling:profiles[def.id]||null,geometryLength:length,originShift:shift,outline:convexHull(points),lineDefs,helm,helmFloor,platformLength:platform};
}
