import * as THREE from '../../vendor/three.module.js?v=touch-9';
import {deckAt} from '../data/fleet.js?v=workboat-28';
import {workboatMotion} from '../simulation/workboat.js?v=workboat-28';
export function addWorkboatDetails(boat,entry,mats){
 const FT=.3048,p=entry.p,deck=x=>deckAt(entry.model,p,x),stern=-p.aft*FT;
 const steel=new THREE.MeshStandardMaterial({color:'#aeb9b9',metalness:.75,roughness:.3}),dark=new THREE.MeshStandardMaterial({color:'#30393a',roughness:.7}),bronze=new THREE.MeshStandardMaterial({color:'#a68b51',metalness:.7,roughness:.4});
 function box(x,y,z,w,h,d,mat=steel){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;boat.add(m);return m;}
 function rod(a,b,r,mat=steel){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),mat);m.position.copy(start).add(end).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());boat.add(m);return m;}
 const hx=(entry.helm.forward+entry.originShift)*FT,hz=entry.helm.side*FT,hy=entry.helmFloor;
 // Standing working helm, with a wheel, gauges and a single throttle lever.
 box(hx+.20,hy+.69,hz,.38,.28,.52,dark);
 const wheel=new THREE.Mesh(new THREE.TorusGeometry(.17,.019,6,24),steel);wheel.rotation.y=Math.PI/2;wheel.position.set(hx,hy+.89,hz);boat.add(wheel);
 for(let i=0;i<3;i++){const angle=i*Math.PI*2/3;rod([hx,hy+.89,hz],[hx,hy+.89+Math.cos(angle)*.15,hz+Math.sin(angle)*.15],.009);}
 for(let i=0;i<3;i++)box(hx-.005,hy+.71,hz+(i-1)*.12,.012,.085,.085,steel);
 rod([hx+.14,hy+.80,hz+.34],[hx+.06,hy+1,hz+.34],.014);box(hx+.06,hy+1,hz+.34,.065,.045,.065,dark);
 // Engine-box fittings retain the supplied aft-cabin geometry as its cover.
 const ex=(p.aftCabinOffset-p.aft+p.aftCabinLength/2)*FT,ey=Math.max(deck((p.aftCabinOffset-p.aft)*FT)[1],deck((p.aftCabinOffset+p.aftCabinLength-p.aft)*FT)[1])+(p.aftCabinLift+p.aftCabinHeight)*FT+.025;
 for(const dx of [-.35,.35]){rod([ex+dx,ey, -.12],[ex+dx,ey+.05,-.12],.012);rod([ex+dx,ey+.05,-.12],[ex+dx,ey+.05,.12],.012);}
 // Practical deck hatches, low forward rails and grab handles, no lounge seats.
 const floor=entry.helmFloor;for(const x of [stern+1.2,stern+2.6]){box(x,floor+.02,0,.72,.035,.82,dark);box(x,floor+.043,0,.66,.01,.76,mats.deck);box(x,floor+.058,0,.13,.02,.025,steel);}
 for(const sign of [-1,1]){let prev;for(const t of [.79,.86,.93,.98]){const x=(-p.aft+40*t)*FT,d=deck(x),v=[x,d[1]+.27,sign*(d[2]-.09)];rod([x,d[1],v[2]],v,.012);if(prev)rod(prev,v,.014);prev=v;}const x=hx+.6,d=deck(x);box(x,d[1]+.055,sign*(d[2]-.035),.14,.075,.065,new THREE.MeshStandardMaterial({color:sign<0?'#c83632':'#329c61',emissive:sign<0?'#c83632':'#329c61',emissiveIntensity:.25}));}
 // A short exhaust outlet and the submerged centerline shaft / large rudder.
 rod([stern+.18,.10,-.8],[stern-.04,.10,-.8],.065,dark);
 rod([stern+1.9,-.35,0],[stern+.5,-.60,0],.035,steel);
 const prop=new THREE.Group();prop.position.set(stern+.52,-.60,0);boat.add(prop);
 for(let i=0;i<4;i++){const pivot=new THREE.Group(),blade=new THREE.Mesh(new THREE.BoxGeometry(.055,.27,.11),bronze);blade.position.y=.12;pivot.rotation.x=i*Math.PI/2;pivot.add(blade);prop.add(pivot);}
 const rudder=new THREE.Group();rudder.position.set(stern+.20,-.58,0);boat.add(rudder);const blade=new THREE.Mesh(new THREE.BoxGeometry(.40,.50,.035),bronze);rudder.add(blade);
 const mastX=(p.enclosureOffset-p.aft+p.enclosureLength*p.accessoryPosition/100)*FT,mastY=deck(mastX)[1]+p.accessoryHeight*FT;
 rod([mastX-.05,mastY,0],[mastX-.05,mastY+.5,0],.009);box(mastX-.05,mastY+.18,0,.09,.12,.09,mats.deck);
 return degrees=>{rudder.rotation.y=-degrees*Math.PI/180;};
}
export function workboatVisualPose(sim,time){const {knots,plane}=workboatMotion(sim),wave=1+Math.min(1,sim.environment.wind/20),s=sim.state;
 // Cosmetic motion only: collision hull and helm camera remain stable.
 return {heave:plane*.32+wave*(.14*Math.sin(time*1.9)+.065*Math.sin(time*3.1))*(1+plane*.5),pitch:(.045*Math.exp(-Math.pow((knots-11)/5,2))+plane*.022)+wave*(.010+plane*.006)*Math.sin(time*2.7),roll:wave*.014*Math.sin(time*1.55)-Math.max(-.055,Math.min(.055,s.omega*.0015))*plane};
}
export function createWorkboatWake(scene,texture){
 const pool=[],material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,opacity:0});
 for(let i=0;i<180;i++){const sprite=new THREE.Sprite(material.clone());sprite.visible=false;scene.add(sprite);pool.push({sprite,life:0,maxLife:1,vx:0,vy:0,size:1});}material.dispose();let cursor=0,clock=0,lastX=null,lastY=null;
 const clear=()=>{for(const p of pool){p.life=0;p.sprite.material.opacity=0;p.sprite.visible=false;}clock=0;lastX=lastY=null;};
 function emit(x,y,vx,vy,size,life){const p=pool[cursor++%pool.length];Object.assign(p,{life,maxLife:life,vx,vy,size});p.sprite.visible=true;p.sprite.position.set(x,.27,y);p.sprite.scale.set(size,size,1);p.sprite.material.opacity=.7;}
 return {clear,update(sim,dt){if(dt<=0)return;const s=sim.state,x=s.x*sim.scale,y=s.y*sim.scale;if(lastX!==null&&Math.hypot(x-lastX,y-lastY)>25)clear();lastX=x;lastY=y;
 for(const p of pool){if(p.life<=0)continue;p.life=Math.max(0,p.life-dt);p.sprite.visible=p.life>0;p.sprite.position.x+=p.vx*dt;p.sprite.position.z+=p.vy*dt;const t=1-p.life/p.maxLife,size=p.size*(1+t*1.6);p.sprite.scale.set(size,size,1);p.sprite.material.opacity=(1-t)*.72;}
 clock+=dt;if(clock<.055)return;clock=0;const {knots,plane,forward}=workboatMotion(sim),a=s.a*Math.PI/180,c=Math.cos(a),sn=Math.sin(a),power=s.port;
 const point=(u,v)=>[x+u*c-v*sn,y+u*sn+v*c];
 if(Math.abs(power)>.01||knots>.5){const [px,py]=point(-19,0);emit(px,py,-c*power*9,-sn*power*9,2.8+plane*3,3.2);}
 if(forward>0&&knots>2)for(const side of [-1,1]){const [px,py]=point(-15,side*5.8),spread=side*(1.1+plane*2.5);emit(px,py,-c*1.2-sn*spread,-sn*1.2+c*spread,2+plane*3,4.5);if(plane>.1){const [bx,by]=point(7,side*4.5);emit(bx,by,-c*3-sn*side*4,-sn*3+c*side*4,1.2+plane,1.1);}}
 }};
}
