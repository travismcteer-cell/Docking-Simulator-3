import {integrate} from './collisions.js?v=navigation-handling-30';
import {applyLines} from './lines.js?v=navigation-handling-30';
import {applyAnchor} from './anchor.js?v=navigation-handling-30';
import {applyFenders} from './fenders.js?v=navigation-handling-30';
export const smoothstep=(lo,hi,x)=>{const t=Math.max(0,Math.min(1,(x-lo)/(hi-lo)));return t*t*(3-2*t);};
export function workboatMotion(sim){const a=sim.state.a*Math.PI/180,c=sim.environment.currentDirection*Math.PI/180,u=sim.environment.current*.0065;const forward=(sim.state.vx-Math.sin(c)*u)*Math.cos(a)+(sim.state.vy+Math.cos(c)*u)*Math.sin(a);return {forward,knots:Math.abs(forward)*110,plane:sim.workboatDynamics?.plane??smoothstep(10,19,forward*110)};}
// Fixed shaft, one large rudder. Astern wash does not rotate with the rudder:
// reverse steering comes from actual sternway; prop walk nudges the stern port.
export function stepWorkboat(sim,dt){
 const s=sim.state,p=sim.boat.propulsion,a=s.a*Math.PI/180,fx=Math.cos(a),fy=Math.sin(a),rx=-fy,ry=fx,rudder=s.steer*Math.PI/180;
 const current=sim.environment.currentDirection*Math.PI/180,u=sim.environment.current*.0065,vx=s.vx-Math.sin(current)*u,vy=s.vy+Math.cos(current)*u;
 const vf=vx*fx+vy*fy,vl=vx*rx+vy*ry,knots=Math.abs(vf)*110,targetPlane=smoothstep(10,19,vf*110);
 function addForce(x,y,bx=0,by=0){s.vx+=x*dt;s.vy+=y*dt;s.omega+=((bx*fx+by*rx)*y-(bx*fy+by*ry)*x)*1100*dt;}
 const setting=Math.max(-1,Math.min(1,s.port)),power=Math.sign(setting)*Math.pow(Math.abs(setting),1.6),thrust=p.thrust*power*(setting<0?p.reverseEfficiency:1);
 addForce(fx*thrust,fy*thrust,p.driveX,0);
 const response=sim.workboatDynamics??={plane:targetPlane,trim:0,breakaway:0};
 const accelerationLoad=Math.max(0,Math.min(1,(thrust-(.12*vf+1.7*vf*Math.abs(vf))*(.075/.14))/.06));
 const approach=(value,target,seconds)=>Math.abs(target-value)<1e-6?target:value+(target-value)*(1-Math.exp(-dt/seconds));
 response.trim=approach(response.trim,accelerationLoad,.65);
 response.plane=approach(response.plane,targetPlane,.8);
 const plane=response.plane,lowSpeed=1-plane;
 const breakDemand=plane*smoothstep(12,30,Math.abs(s.steer))*(1-response.trim*.85);
 response.breakaway=approach(response.breakaway,breakDemand,.35);
 const gripBreak=response.breakaway;
 const wash=Math.max(0,thrust)*1.15*(1+lowSpeed*.35+response.trim*.7);
 // Large rudder responds to water flow in neutral and astern as well as propwash.
 const flow=Math.abs(vf)*vf*(vf<0?4.2:.75*(1+lowSpeed*1.8));
 // On plane, the fine bow grips while the flatter stern can break sideways.
 // Blend out below planing speed so docking and reverse keep their old tune.
 const turnGain=1+gripBreak*4;
 const lateral=-(wash+flow)*Math.sin(rudder)*turnGain;
 addForce(rx*lateral,ry*lateral,p.rudderX,0);
 // Loaded-hull carving lift turns the bow into the curve while the stern tracks.
 const carvingLift=Math.max(0,thrust)*response.trim*Math.sin(rudder)*2.8;
 addForce(rx*carvingLift,ry*carvingLift,.32,0);
 // Right-handed propeller: reverse pushes stern to port (clockwise bow swing).
 const walk=-p.propWalk*Math.max(0,-power)/(1+knots/8);
 addForce(rx*walk,ry*walk,p.driveX,0);
 // Displacement hump fades as the hull rises onto plane; quadratic drag then
 // sets the top speed, instead of the existing boats' displacement limiter.
 const hump=vf>0?.011*Math.exp(-Math.pow((knots-8)/3,2))*(1-plane):0;
 const resistance=(.12*vf+(vf>=0?1.7:5.8)*vf*Math.abs(vf)+hump)*(.075/.14);
 const steeringDrag=Math.abs(lateral*Math.sin(rudder))*.5;
 addForce(-fx*(resistance+Math.sign(vf)*steeringDrag),-fy*(resistance+Math.sign(vf)*steeringDrag),0,0);
 // Separate hull stations sense translation AND rotation through the water.
 // Loaded stern tracks during acceleration; on-plane breakaway releases its grip.
 const bowGrip=.30+plane*.65-response.trim*.18;
 const sternGrip=(.60+response.trim*1.3)*(1-gripBreak*.78);
 const omega=s.omega*Math.PI/180,length=sim.geometryLength||40;
 for(const [station,grip] of [[.32,bowGrip],[-.36,sternGrip]]){
  const localFlow=vl+omega*station*length/sim.scale;
  const drag=grip*(localFlow+1.6*localFlow*Math.abs(localFlow));
  addForce(-rx*drag,-ry*drag,station,0);
 }
 const wind=sim.environment.windDirection*Math.PI/180,windForce=sim.environment.wind**2*.000005;
 addForce(Math.sin(wind)*windForce,-Math.cos(wind)*windForce,.08,0);
 applyLines(sim,dt,addForce);applyAnchor(sim,dt,addForce);applyFenders(sim,dt,addForce);
 s.omega*=Math.exp(-(.38+Math.min(2.2,Math.abs(vf)*8)*(1-plane*.35))*dt);
 s.stbd=0;
 integrate(sim,dt);
}
