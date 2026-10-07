// World geometry is measured in feet; the physics retains its original units.
export function bodyPoint(state,x,y,scale){const a=state.a*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return {x:state.x*scale+x*c-y*s,y:state.y*scale+x*s+y*c};}
export function hullAt(state,outline,scale){return outline.map(([x,y])=>bodyPoint(state,x,y,scale));}
export function rectPoly(d){return [{x:d.x,y:d.y},{x:d.x+d.w,y:d.y},{x:d.x+d.w,y:d.y+d.h},{x:d.x,y:d.y+d.h}];}
export function overlap(A,B){let depth=Infinity,normal=null;const center=p=>({x:p.reduce((s,v)=>s+v.x,0)/p.length,y:p.reduce((s,v)=>s+v.y,0)/p.length});const ca=center(A),cb=center(B);
 for(const poly of [A,B])for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],len=Math.hypot(b.x-a.x,b.y-a.y);let nx=-(b.y-a.y)/len,ny=(b.x-a.x)/len;const aa=A.map(p=>p.x*nx+p.y*ny),bb=B.map(p=>p.x*nx+p.y*ny),d=Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb));if(d<=0)return null;if(d<depth){depth=d;if((ca.x-cb.x)*nx+(ca.y-cb.y)*ny<0){nx=-nx;ny=-ny;}normal={x:nx,y:ny};}}
 return {depth,normal};}
export function nearestRect(p,d){const x=Math.max(d.x,Math.min(d.x+d.w,p.x)),y=Math.max(d.y,Math.min(d.y+d.h,p.y));const dx=p.x-x,dy=p.y-y,dist=Math.hypot(dx,dy);if(dist>1e-8)return {dist,nx:dx/dist,ny:dy/dist};const sides=[{dist:p.x-d.x,nx:-1,ny:0},{dist:d.x+d.w-p.x,nx:1,ny:0},{dist:p.y-d.y,nx:0,ny:-1},{dist:d.y+d.h-p.y,nx:0,ny:1}].sort((a,b)=>a.dist-b.dist);return {...sides[0],dist:-sides[0].dist};}
export function integrate(sim,dt){const {state,scale,outline,docks,fenders}=sim;const old={...state};sim.contact=false;
 for(let i=1;i<=10;i++){const pose={...state,x:old.x+state.vx*dt*i/10,y:old.y+state.vy*dt*i/10,a:old.a+state.omega*dt*i/10};const hull=hullAt(pose,outline,scale);let hit=null;for(const d of docks){hit=overlap(hull,rectPoly(d));if(hit)break;}if(hit){sim.contact=true;const n=hit.normal,a=state.a*Math.PI/180;const sideDot=n.x*(-Math.sin(a))+n.y*Math.cos(a);const protectedSide=Math.abs(sideDot)>.42&&(sideDot>0?fenders.port:fenders.stbd);
 if(protectedSide){const vn=state.vx*n.x+state.vy*n.y;if(vn<0){state.vx-=vn*n.x;state.vy-=vn*n.y;}state.omega*=.82;}else{state.vx*=-.03;state.vy*=-.03;state.omega*=.12;}break;}Object.assign(state,{x:pose.x,y:pose.y,a:pose.a});}
 if(Math.abs(state.x*scale)>105||Math.abs(state.y*scale)>125){state.vx*=-.1;state.vy*=-.1;state.x=Math.max(-105/scale,Math.min(105/scale,state.x));state.y=Math.max(-125/scale,Math.min(125/scale,state.y));}
}
