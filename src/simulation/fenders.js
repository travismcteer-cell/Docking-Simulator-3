import {bodyPoint,nearestShape,hullAt} from './collisions.js?v=traffic-padding-60';
export const FENDER_TUNING={radiusFt:.72,stiffness:.038,damping:.030,friction:.015,maxForce:.075};
export function fenderBeam(sim,station){const x=station*(sim.geometryLength||31),edge=sim.outline.filter(p=>p[1]>=0).sort((a,b)=>a[0]-b[0]);for(let i=1;i<edge.length;i++){if(x<=edge[i][0]){const [ax,ay]=edge[i-1],[bx,by]=edge[i];return ay+(by-ay)*(x-ax)/(bx-ax)+.25;}}return .25;}
export function applyFenders(sim,dt,addForce){const {state:s,scale,docks,fenders}=sim,a=s.a*Math.PI/180,omega=s.omega*Math.PI/180;fenders.contactPort=fenders.contactStbd=0;applyRacePadding(sim,addForce);
 for(const [name,sign] of [['port',-1],['stbd',1]]){if(!fenders[name])continue;for(const station of [-.3,-.1,.1,.3]){const p=bodyPoint(s,station*(sim.geometryLength||31),sign*fenderBeam(sim,station),scale);let near=null;for(const d of (sim.fenderShapes||docks)){if(!d.points&&(p.x<d.x-2||p.x>d.x+d.w+2||p.y<d.y-2||p.y>d.y+d.h+2))continue;const n=nearestShape(p,d);if(!near||n.dist<near.dist)near=n;}if(!near||near.dist>=FENDER_TUNING.radiusFt)continue;const compression=FENDER_TUNING.radiusFt-near.dist,rx=p.x-s.x*scale,ry=p.y-s.y*scale,vx=s.vx*scale-omega*ry,vy=s.vy*scale+omega*rx,closing=Math.max(0,-(vx*near.nx+vy*near.ny));const force=Math.min(.075,.038*compression+.030*closing),tx=-near.ny,ty=near.nx,friction=Math.max(-force*FENDER_TUNING.friction,Math.min(force*FENDER_TUNING.friction,-(vx*tx+vy*ty)*.0035));addForce(near.nx*force+tx*friction,near.ny*force+ty*friction,station,sign*fenderBeam(sim,station)/(sim.geometryLength||31));fenders[name==='port'?'contactPort':'contactStbd']=Math.max(fenders[name==='port'?'contactPort':'contactStbd'],compression/.72);}}
}


export function applyRacePadding(sim,addForce){
 const {state:s,scale}=sim,omega=s.omega*Math.PI/180,a=s.a*Math.PI/180;
 for(const pad of sim.racePadding||[]){
  if(Math.hypot(s.x*scale-pad.x,s.y*scale-pad.y)>(sim.geometryLength||40)+16)continue;
  const hull=hullAt(s,sim.outline,scale),points=[];
  // Sample every edge so the complete board works even between hull vertices.
  for(let i=0;i<hull.length;i++){const p=hull[i],q=hull[(i+1)%hull.length],steps=Math.max(1,Math.ceil(Math.hypot(q.x-p.x,q.y-p.y)/2));for(let j=0;j<steps;j++){const t=j/steps,x=p.x+(q.x-p.x)*t,y=p.y+(q.y-p.y)*t,across=-(x-pad.x)*pad.ny+(y-pad.y)*pad.nx,dist=(x-pad.x)*pad.nx+(y-pad.y)*pad.ny-pad.face;if(Math.abs(across)<=pad.halfWidth&&dist>=-.6&&dist<FENDER_TUNING.radiusFt)points.push({x,y,dist});}}
  if(!points.length)continue;const min=Math.min(...points.map(p=>p.dist)),support=points.filter(p=>p.dist<min+.05),x=support.reduce((v,p)=>v+p.x,0)/support.length,y=support.reduce((v,p)=>v+p.y,0)/support.length;
  const rx=x-s.x*scale,ry=y-s.y*scale,vx=s.vx*scale-omega*ry,vy=s.vy*scale+omega*rx,closing=Math.max(0,-vx*pad.nx-vy*pad.ny);
  const force=Math.min(FENDER_TUNING.maxForce,FENDER_TUNING.stiffness*(FENDER_TUNING.radiusFt-min)+FENDER_TUNING.damping*closing);
  const tx=-pad.ny,ty=pad.nx,friction=Math.max(-force*FENDER_TUNING.friction,Math.min(force*FENDER_TUNING.friction,-(vx*tx+vy*ty)*.0035));
  addForce(pad.nx*force+tx*friction,pad.ny*force+ty*friction,(rx*Math.cos(a)+ry*Math.sin(a))/(sim.geometryLength||40),(-rx*Math.sin(a)+ry*Math.cos(a))/(sim.geometryLength||40));
 }
}
