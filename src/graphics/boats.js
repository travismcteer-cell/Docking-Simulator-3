import * as THREE from '../../vendor/three.module.js?v=touch-9';
import {LINE_DEFS} from '../simulation/lines.js?v=touch-9';
// A simple contemporary dayboat, inspired by the VanDutch silhouette.
// The rub rail follows the existing simulation outline exactly.
export function createCruiser(outline,helpers,materials){
 const {mesh,box,rod,surface,outlineDeck,loft,pathTube}=helpers;
 const {ivory,hullWhite,chrome,teak,rubber,mat}=materials;
 const vessel=new THREE.Group();
 const upholstery=mat('#d5c6ac',.85),seams=mat('#b4a58c',.95),glass=new THREE.MeshStandardMaterial({color:'#163c48',roughness:.18,metalness:.12,transparent:true,opacity:.64,side:THREE.DoubleSide}),dark=mat('#23313a',.5);
 loft(outline,[[-.7,.70,.56],[.15,.88,.80],[1.35,.97,.95],[2.35,1,1]],hullWhite,vessel);
 loft(outline,[[.05,.877,.797],[.24,.895,.817]],dark,vessel);
 outlineDeck(outline,2.42,ivory,vessel);
 pathTube(outline.map(([x,z])=>[x,2.48,z]),.085,rubber,vessel,true);
 // Quiet, broad foredeck. A tapered lounge echoes the shape of the bow.
 const lounge=[[1.6,-2.65],[7.8,-2.5],[10.7,-1.5],[11.4,0],[10.7,1.5],[7.8,2.5],[1.6,2.65]];
 loft(lounge,[[2.44,1,1],[2.65,1,1],[2.74,.98,.98]],upholstery,vessel);
 outlineDeck(lounge.map(([x,z])=>[x*.98,z*.98]),2.74,upholstery,vessel);
 for(const z of [-.85,.85])rod([2,2.755,z],[9.9,2.755,z],.012,seams,vessel);
 // Recessed cockpit and slim side coamings, without a cabin or radar arch.
 box(-7.1,2.46,0,12.9,.08,7.1,teak,vessel);
 for(let z=-3.35;z<=3.35;z+=.48)box(-7.1,2.505,z,12.5,.012,.018,seams,vessel);
 for(const side of [-1,1]){
  const wall=[[-13.1,side*3.5],[-12.4,side*4.25],[-1.1,side*4.58],[-1.1,side*3.88],[-12.4,side*3.45]];
  loft(wall,[[2.43,1,1],[3.05,1,1]],ivory,vessel);outlineDeck(wall,3.05,ivory,vessel);
  rod([-11.2,3.10,side*4.02],[-7.8,3.10,side*4.10],.035,chrome,vessel);
 }
 function seat(x,z,w,d){
  // Chamfered cushion edges catch light without adding heavy geometry.
  const g=new THREE.BoxGeometry(w,.25,d);const m=mesh(g,upholstery,vessel);m.position.set(x,3.12,z);
  box(x,2.77,z,w,.45,d,ivory,vessel);
 }
 seat(-11.6,0,2.4,6.6);box(-12.7,3.47,0,.36,.72,6.6,upholstery,vessel);
 // Two compact helm seats and a dark instrument panel.
 for(const z of [-1.65,1.65]){seat(-4.5,z,1.8,1.7);box(-5.3,3.62,z,.26,1.05,1.7,upholstery,vessel);}
 box(-1.8,3.15,0,2.05,1.25,5.8,ivory,vessel);
 surface([[-2.87,3.55,-2.6],[-1.2,3.9,-2.6],[-1.2,3.9,2.6],[-2.87,3.55,2.6]],dark,vessel);
 for(const z of [-2.1,-1.35])box(-2.3,3.75,z,.65,.025,.5,mat('#4a7884'),vessel);
 const wheel=mesh(new THREE.TorusGeometry(.36,.04,6,20),chrome,vessel);wheel.position.set(-2.95,3.93,-1.65);wheel.rotation.y=Math.PI/2;
 for(const a of [0,2*Math.PI/3,4*Math.PI/3])rod([-2.95,3.93,-1.65],[-2.95,3.93+.32*Math.sin(a),-1.65+.32*Math.cos(a)],.023,chrome,vessel);
 // Low wraparound windshield: no roof, antennas or tall rails.
 const front=[[-.6,3.1,-3.8],[.65,4.65,-3.25],[.65,4.65,3.25],[-.6,3.1,3.8]];
 surface(front,glass,vessel);pathTube([front[1],front[2]],.035,chrome,vessel);
 for(const side of [-1,1]){surface([[-.6,3.1,side*3.8],[.65,4.65,side*3.25],[-2.5,4.35,side*3.6],[-3.4,3.07,side*4.1]],glass,vessel);pathTube([[.65,4.65,side*3.25],[-2.5,4.35,side*3.6],[-3.4,3.07,side*4.1]],.035,chrome,vessel);}
 // Slim integrated swim platform and clear stern edge.
 box(-14.6,1.67,0,2.1,.22,7.2,ivory,vessel);box(-14.6,1.80,0,1.9,.025,6.8,teak,vessel);
 for(let z=-3;z<=3;z+=.5)box(-14.6,1.818,z,1.8,.01,.018,seams,vessel);
 for(const [side,color] of [[-1,'#df6f5d'],[1,'#70a582']])box(-.5,3.12,side*4.25,.42,.13,.14,mat(color),vessel);
 // Cleats use precisely the rope attachment stations, at rope height.
 for(const def of Object.values(LINE_DEFS))for(const side of [-1,1]){const x=def.xFrac*31,z=side*def.beam;box(x,2.51,z,.46,.055,.22,chrome,vessel);for(const dx of [-.17,.17])rod([x+dx,2.52,z],[x+dx,2.62,z],.035,chrome,vessel);rod([x-.37,2.62,z],[x+.37,2.62,z],.065,chrome,vessel);}
 return vessel;
}
