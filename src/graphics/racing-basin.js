import * as THREE from '../../vendor/three.module.js?v=touch-9';
import {RACING_BASIN} from '../data/marina.js?v=racing-basin-27';
export function addRacingBasinDetails(scene){
 const deck=RACING_BASIN.spectator,group=new THREE.Group();group.position.set(deck.x+deck.w/2,2.32,deck.y+deck.h/2);scene.add(group);
 const material=color=>new THREE.MeshStandardMaterial({color,roughness:.85,side:THREE.DoubleSide});
 const white=material('#f2eee0'),blue=material('#315574'),metal=material('#a1a8a8'),wood=material('#97704c');
 function box(x,y,z,w,h,d,mat){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;}
 for(const x of [-30,0,30])for(const z of [-16,16])box(x,4.5,z,.3,9,.3,metal);
 // Low polygon striped gable roof, with open sides facing the water.
 for(let i=0;i<10;i++)for(const side of [-1,1]){const x=-32+i*6.4,z=side*18,geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([x,15,0,x+6.4,15,0,x+6.4,9,z,x,15,0,x+6.4,9,z,x,9,z],3));geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,i%2?blue:white);mesh.castShadow=true;group.add(mesh);}
 for(const z of [-18,18])box(0,8.5,z,64,1,.15,blue);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#eae5cf';ctx.fillRect(0,0,512,128);ctx.fillStyle='#233e4f';ctx.font='bold 66px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('BEER TENT',256,68);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(22,5.5),new THREE.MeshStandardMaterial({map:texture,side:THREE.DoubleSide,roughness:.9}));sign.position.set(0,7,-18.15);sign.rotation.y=Math.PI;group.add(sign);
 box(0,2.2,9,25,4.4,3,blue);box(0,4.5,9,26,.3,4,wood);
 for(const x of [-53,53])for(const z of [-16,8]){box(x,2.7,z,13,.4,5,wood);for(const dz of [-4,4])box(x,1.5,z+dz,13,.35,1.8,wood);for(const dx of [-4,4])box(x+dx,1.3,z,.5,2.6,8,metal);}
 return group;
}
