import * as THREE from '../../vendor/three.module.js?v=touch-9';
import {model as data,definition as def,p} from '../data/express-33.js?v=express-13';
import {LINE_DEFS} from '../simulation/lines.js?v=express-13';
export function createCruiser(){
const vessel=new THREE.Group(),boat=new THREE.Group();boat.scale.setScalar(1/.3048);vessel.add(boat);
const mats={};const colors={side:def.colors.upperHull,bottom:def.colors.lowerHull,transom:def.colors.upperHull,deck:def.colors.deck,cabin:def.colors.superstructure,roof:def.colors.superstructure,bridge:def.colors.superstructure,'cockpit-wall':def.colors.superstructure,'cockpit-floor':'#b4a28a',arch:def.colors.accessory};
for(const [g,c] of Object.entries(colors))mats[g]=new THREE.MeshStandardMaterial({color:c,roughness:g==='bottom'?.3:.48,metalness:.08,side:THREE.DoubleSide});
mats.glass=new THREE.MeshPhysicalMaterial({color:def.colors.windows,transparent:true,opacity:.35,roughness:.12,metalness:.1,depthWrite:false,side:THREE.FrontSide});
const groups={};data.faces.forEach((f,i)=>{const g=data.groups[i];(groups[g]??=[]).push(...f.flatMap(j=>data.vertices[j]));});
for(const [g,a] of Object.entries(groups)){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(a,3));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mats[g]||mats.deck);mesh.castShadow=g!=='glass';mesh.receiveShadow=true;boat.add(mesh);}
const steel=new THREE.MeshStandardMaterial({color:'#b8c2c6',metalness:.8,roughness:.24}),rubber=new THREE.MeshStandardMaterial({color:'#343b40',roughness:.7}),cushion=new THREE.MeshStandardMaterial({color:'#d8cbb5',roughness:.9}),teak=new THREE.MeshStandardMaterial({color:'#a68d69',roughness:.85});
function box(x,y,z,a,b,c,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;boat.add(m);return m;}
function tube(points,r,mat){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*2),r,6,false),mat);boat.add(mesh);return mesh;}
const stern=-p.aft*.3048,platformLength=.6096,sternWidth=p.beam*.3048*p.stern;
box(stern-platformLength/2,.32,0,platformLength,.12,sternWidth*.92,mats.deck);box(stern-platformLength/2,.385,0,platformLength*.9,.014,sternWidth*.86,teak);
for(let z=-sternWidth*.4;z<sternWidth*.4;z+=.14)box(stern-platformLength/2,.394,z,platformLength*.9,.009,.009,rubber);
for(const indices of data.rail){const pts=indices.map(i=>data.vertices[i]);tube(pts,.024,rubber);tube(pts.map(v=>[v[0],v[1]+.028,v[2]]),.008,steel);}
function deckAt(x){const t=Math.max(0,Math.min(63,(x+p.aft*.3048)/((p.aft+p.forward)*.3048)*64));const i=Math.floor(t),u=t-i;const a=data.vertices[data.rings[i][15]],b=data.vertices[data.rings[i+1][15]];return a.map((v,j)=>v+(b[j]-v)*u);}
for(const d of Object.values(LINE_DEFS))for(const sign of [-1,1]){const x=d.xFrac*31*.3048,z=sign*d.beam*.3048,y=d.height*.3048;box(x,y-.018,z,.20,.025,.04,steel);box(x-.045,y-.045,z,.025,.06,.025,steel);box(x+.045,y-.045,z,.025,.06,.025,steel);}
for(const s of [-1,1]){const pts=[1.05,1.8,2.8,3.8,4.65].map(x=>{const d=deckAt(x);return[x,d[1]+.36,s*(d[2]-.08)];});tube(pts,.012,steel);for(const v of pts.slice(0,-1))tube([[v[0],v[1]-.36,v[2]],v],.01,steel);}
const floorY=Math.min(deckAt((p.cockpitOffset-p.aft)*.3048)[1],deckAt((p.cockpitOffset+p.cockpit-p.aft)*.3048)[1])-p.cockpitDepth*.3048;
box(stern+.8,floorY+.22,0,.65,.45,1.65,mats.deck);box(stern+.8,floorY+.47,0,.65,.12,1.65,cushion);box(stern+.52,floorY+.72,0,.16,.5,1.65,cushion);
box(-.4,floorY+.25,.65,.62,.5,.53,mats.deck);box(-.4,floorY+.53,.65,.64,.14,.56,cushion);box(-.65,floorY+.84,.65,.12,.55,.56,cushion);
box(.3,floorY+.67,.65,.55,.22,.5,rubber);
const wheel=new THREE.Mesh(new THREE.TorusGeometry(.14,.018,6,24),steel);wheel.rotation.y=Math.PI/2;wheel.position.set(.05,floorY+.86,.65);boat.add(wheel);
for(let i=0;i<3;i++)box(.008+i*.08,floorY+.79,.55,.045,.045,.008,steel);

return vessel;
}
