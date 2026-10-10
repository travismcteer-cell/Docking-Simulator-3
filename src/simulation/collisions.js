// World geometry is measured in feet; the physics retains its original units.
export function bodyPoint(state,x,y,scale){const a=state.a*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return {x:state.x*scale+x*c-y*s,y:state.y*scale+x*s+y*c};}
export function hullAt(state,outline,scale){return outline.map(([x,y])=>bodyPoint(state,x,y,scale));}
export function rectPoly(d){return [{x:d.x,y:d.y},{x:d.x+d.w,y:d.y},{x:d.x+d.w,y:d.y+d.h},{x:d.x,y:d.y+d.h}];}
export function overlap(A,B){let depth=Infinity,normal=null;const center=p=>({x:p.reduce((s,v)=>s+v.x,0)/p.length,y:p.reduce((s,v)=>s+v.y,0)/p.length});const ca=center(A),cb=center(B);
 for(const poly of [A,B])for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],len=Math.hypot(b.x-a.x,b.y-a.y);if(len<1e-10)continue;let nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;if((ca.x-cb.x)*nx+(ca.y-cb.y)*ny<0){nx=-nx;ny=-ny;}const aa=A.map(p=>p.x*nx+p.y*ny),bb=B.map(p=>p.x*nx+p.y*ny),minA=Math.min(...aa),maxA=Math.max(...aa),minB=Math.min(...bb),maxB=Math.max(...bb);if(maxA<=minB||maxB<=minA)return null;const d=maxB-minA;if(d<depth){depth=d;normal={x:nx,y:ny};}}
 return normal?{depth,normal}:null;}
export function nearestRect(p,d){const x=Math.max(d.x,Math.min(d.x+d.w,p.x)),y=Math.max(d.y,Math.min(d.y+d.h,p.y));const dx=p.x-x,dy=p.y-y,dist=Math.hypot(dx,dy);if(dist>1e-8)return {dist,nx:dx/dist,ny:dy/dist};const sides=[{dist:p.x-d.x,nx:-1,ny:0},{dist:d.x+d.w-p.x,nx:1,ny:0},{dist:p.y-d.y,nx:0,ny:-1},{dist:d.y+d.h-p.y,nx:0,ny:1}].sort((a,b)=>a.dist-b.dist);return {...sides[0],dist:-sides[0].dist};}
export function integrate(sim,dt){
 const {state:s,scale,outline,docks,fenders}=sim;
 sim.contact=false;sim.collision=null;
 const radius=Math.max(20,...outline.map(p=>Math.hypot(...p))),reach=radius+Math.hypot(s.vx,s.vy)*scale*dt+2,cx=s.x*scale,cy=s.y*scale;
 const candidates=(sim.solids||docks).filter(d=>cx+reach>d.x&&cx-reach<d.x+d.w&&cy+reach>d.y&&cy-reach<d.y+d.h).map(d=>({object:d,points:d.points||rectPoly(d)}));
 const xs=outline.map(p=>p[0]),ys=outline.map(p=>p[1]),length=Math.max(...xs)-Math.min(...xs),beam=Math.max(...ys)-Math.min(...ys),inertia=(length*length+beam*beam)/12;
 // Short swept steps prevent a fast hull from skipping a narrow piling.
 const steps=Math.max(10,Math.ceil((Math.hypot(s.vx,s.vy)*scale+Math.abs(s.omega)*Math.PI/180*radius)*dt/.35)),h=dt/steps;
 for(let i=0;i<steps;i++){
  s.x+=s.vx*h;s.y+=s.vy*h;s.a+=s.omega*h;
  for(let iteration=0;iteration<8;iteration++){
   let corrected=false,hull=hullAt(s,outline,scale);
   for(const {object,points} of candidates){
    const hit=overlap(hull,points);if(!hit)continue;
    corrected=true;sim.contact=true;const n=hit.normal,tx=-n.y,ty=n.x;
    // Contact on the hull's supporting face, restricted to the obstacle's span.
    // A side-on piling thus acts at the piling, not an arbitrary bow vertex.
    const minN=Math.min(...hull.map(p=>p.x*n.x+p.y*n.y));
    const support=hull.filter(p=>p.x*n.x+p.y*n.y<=minN+.02),along=support.map(p=>p.x*tx+p.y*ty),other=points.map(p=>p.x*tx+p.y*ty);
    const lo=Math.max(Math.min(...along),Math.min(...other)),hi=Math.min(Math.max(...along),Math.max(...other)),t=lo<=hi?(lo+hi)/2:(Math.min(...along)+Math.max(...along))/2;
    const px=n.x*minN+tx*t,py=n.y*minN+ty*t,rx=px-s.x*scale,ry=py-s.y*scale,arm=rx*n.y-ry*n.x;
    const omega=s.omega*Math.PI/180,normalSpeed=s.vx*scale*n.x+s.vy*scale*n.y+omega*arm;
    const a=s.a*Math.PI/180,sideDot=n.x*(-Math.sin(a))+n.y*Math.cos(a),protectedSide=Math.abs(sideDot)>.42&&(sideDot>0?fenders.port:fenders.stbd);
    const impact=Math.max(0,-normalSpeed)*.592484*(protectedSide?.45:1);
    if(!sim.collision||impact>sim.collision.knots)sim.collision={id:object.id,kind:object.kind||'dock',knots:impact,protected:!!protectedSide};
    // Resolve penetration geometrically, then apply only a normal impulse.
    // Preserve tangent velocity and allow natural rotation around the contact.
    s.x+=n.x*(hit.depth+.001)/scale;s.y+=n.y*(hit.depth+.001)/scale;
    if(normalSpeed<0){const impulse=-normalSpeed/(1+arm*arm/inertia);s.vx+=n.x*impulse/scale;s.vy+=n.y*impulse/scale;s.omega+=arm*impulse/inertia*180/Math.PI;}
    hull=hullAt(s,outline,scale);
   }
   if(!corrected)break;
  }
 }
 const b=sim.bounds||{minX:-105,maxX:105,minY:-125,maxY:125};
 if(s.x*scale<b.minX){s.x=b.minX/scale;s.vx=Math.max(0,s.vx);}if(s.x*scale>b.maxX){s.x=b.maxX/scale;s.vx=Math.min(0,s.vx);}
 if(s.y*scale<b.minY){s.y=b.minY/scale;s.vy=Math.max(0,s.vy);}if(s.y*scale>b.maxY){s.y=b.maxY/scale;s.vy=Math.min(0,s.vy);}
}
export function nearestShape(p,d){if(!d.points)return nearestRect(p,d);let best=null,inside=false;const v=d.points;for(let i=0,j=v.length-1;i<v.length;j=i++){const a=v[j],b=v[i];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy))),qx=a.x+t*dx,qy=a.y+t*dy,dist=Math.hypot(p.x-qx,p.y-qy);if(!best||dist<best.dist)best={dist,nx:(p.x-qx)/(dist||1),ny:(p.y-qy)/(dist||1)};}if(inside){best.dist=-best.dist;best.nx=-best.nx;best.ny=-best.ny;}return best;}

