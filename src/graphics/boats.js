import * as THREE from '../../vendor/three.module.js?v=marina-5';
import {LINE_DEFS} from '../simulation/lines.js?v=marina-5';
export function createCruiser(outline,helpers,materials){
const {mesh,box,rod,surface,outlineDeck,loft,pathTube}=helpers;
const {ivory,hullWhite,trim,chrome,cushion,teak,rubber,windowMat,mat}=materials;
const vessel=new THREE.Group();
loft(outline,[[-.7,.7,.55],[.3,.92,.85],[2.4,1,1]],hullWhite,vessel);
loft(outline,[[1.85,.99,.99],[2.08,1.002,1.002]],trim,vessel);
outlineDeck(outline,2.42,ivory,vessel);
pathTube(outline.map(([x,z])=>[x,2.48,z]),.075,rubber,vessel,true);
// Raised foredeck and rounded cabin, leaving an open aft cockpit.
const cabinPoly=[[-3,-3.3],[3,-3.6],[8,-2.7],[10,0],[8,2.7],[3,3.6],[-3,3.3]];
loft(cabinPoly,[[2.45,1,1],[4.2,.94,.87]],ivory,vessel);outlineDeck(cabinPoly.map(([x,z])=>[x*.94,z*.87]),4.2,ivory,vessel);
box(5.3,4.25,0,2.6,.12,2.4,windowMat,vessel);
for(const side of [-1,1]){
 surface([[.5,3.1,side*3.49],[5.8,3.1,side*2.95],[5.8,3.7,side*2.95],[.5,3.8,side*3.49]],windowMat,vessel);
 // Stainless bow rails with discrete stanchions.
 const rail=[[0,3.7,side*4.45],[5,3.65,side*3.9],[10,3.55,side*2.6],[14.8,3.45,side*.35]];
 pathTube(rail,.055,chrome,vessel);
 for(const [x,y,z] of rail.slice(0,3))rod([x,2.48,z],[x,y,z],.055,chrome,vessel);
 box(-8,2.85,side*4.2,10,.8,.7,ivory,vessel);
 box(-8.5,3.33,side*3.95,7,.28,.8,cushion,vessel);
}
// Cockpit sole, aft bench and swim platform.
box(-8,2.52,0,11,.10,6.9,teak,vessel);
for(let x=-13;x<-3;x+=.55)box(x,2.58,0,.024,.014,6.7,trim,vessel);
box(-12,3.05,0,1.7,1.05,7.1,ivory,vessel);box(-11.85,3.6,0,1.7,.3,6.7,cushion,vessel);
box(-14.7,1.2,0,2.4,.3,8.1,teak,vessel);
box(-3.9,3.35,-1.8,1.4,1.1,2.6,ivory,vessel);
box(-5,3.7,-1.8,1.8,.35,1.9,cushion,vessel);box(-5.75,4.25,-1.8,.28,1.1,1.9,cushion,vessel);
const wheel=mesh(new THREE.TorusGeometry(.4,.055,6,20),trim,vessel);wheel.position.set(-3.25,4.3,-1.8);wheel.rotation.y=Math.PI/2;
// Sloping wraparound windshield and a light radar arch.
const ws=[[-2.1,4.15,-3.2],[-.3,5.65,-3.0],[-.3,5.65,3.0],[-2.1,4.15,3.2]];
surface(ws,windowMat,vessel);pathTube([...ws,ws[0]],.06,chrome,vessel);
for(const side of [-1,1]){surface([[-2.1,4.15,side*3.2],[-.3,5.65,side*3],[-4,5.4,side*3.3],[-5.3,4.0,side*3.5]],windowMat,vessel);rod([-7,3.1,side*3.7],[-6,6.9,side*3.3],.16,ivory,vessel);}
rod([-6,6.9,-3.3],[-6,6.9,3.3],.2,ivory,vessel);box(-6,7.15,0,1.1,.25,1.4,ivory,vessel);
rod([-5.8,7.2,1.1],[-5.8,9,1.1],.025,chrome,vessel);
// Navigation lights and cleats.
for(const [side,color] of [[-1,'#df6f5d'],[1,'#70a582']])box(-.3,4.3,side*3.5,.45,.18,.15,mat(color),vessel);
for(const def of Object.values(LINE_DEFS))for(const side of [-1,1]){const x=def.xFrac*31,z=side*def.beam;rod([x-.35,2.62,z],[x+.35,2.62,z],.07,chrome,vessel);}

return vessel;
}
