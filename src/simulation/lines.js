import {bodyPoint} from './collisions.js?v=marina-5';
export const LINE_DEFS={bow:{xFrac:41/108,xBody:.4,beam:2.35,label:'Bow'},fwdSpring:{xFrac:18/108,xBody:.18,beam:4.05,label:'Forward spring'},aftSpring:{xFrac:-18/108,xBody:-.18,beam:4.05,label:'Aft spring'},stern:{xFrac:-45/108,xBody:-.42,beam:3.5,label:'Stern'}};
// Same spring/damping model as the 2D app; lengths convert feet to simulator units.
export const LINE_TUNING={stiffness:2.8,damping:.44,maxTension:.08,attachSlack:.00015};
export function cleatPoint(sim,type,side){const d=LINE_DEFS[type];return bodyPoint(sim.state,d.xFrac*31,side*d.beam,sim.scale);}
export function attachLine(sim,type){if(sim.lines[type]){delete sim.lines[type];return `${LINE_DEFS[type].label} released`;}
 const a=sim.state.a*Math.PI/180;let best=null;
 for(const side of [-1,1]){const cleat=cleatPoint(sim,type,side);for(const target of sim.dockCleats){const dx=target.x-cleat.x,dy=target.y-cleat.y,dist=Math.hypot(dx,dy);if(dist>12)continue;const along=dx*Math.cos(a)+dy*Math.sin(a);if(type==='fwdSpring'&&along>-4)continue;if(type==='aftSpring'&&along<4)continue;const score=dist;if(!best||score<best.score)best={side,target,score,lengthN:dist/sim.scale+LINE_TUNING.attachSlack,tension:0};}}
 if(!best)return `Move closer to a suitable dock cleat for the ${LINE_DEFS[type].label.toLowerCase()}`;
 sim.lines[type]=best;return `${LINE_DEFS[type].label} attached`;
}
export function applyLines(sim,dt,addForce){const s=sim.state,omega=s.omega*Math.PI/180;for(const [type,line] of Object.entries(sim.lines)){const def=LINE_DEFS[type],p=cleatPoint(sim,type,line.side),dx=(line.target.x-p.x)/sim.scale,dy=(line.target.y-p.y)/sim.scale,dist=Math.hypot(dx,dy),stretch=dist-line.lengthN;line.tension=0;if(stretch<=0||dist<1e-8)continue;const ux=dx/dist,uy=dy/dist,rx=p.x/sim.scale-s.x,ry=p.y/sim.scale-s.y;const vx=s.vx-omega*ry,vy=s.vy+omega*rx,outward=-(vx*ux+vy*uy);line.tension=Math.min(LINE_TUNING.maxTension,Math.max(0,LINE_TUNING.stiffness*stretch+LINE_TUNING.damping*Math.max(0,outward)));addForce(ux*line.tension,uy*line.tension,def.xBody,line.side*def.beam/31);}}
