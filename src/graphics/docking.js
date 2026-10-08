import * as THREE from '../../vendor/three.module.js?v=overlay-6';
import {fenderBeam} from '../simulation/fenders.js?v=overlay-6';
import {LINE_DEFS,cleatPoint,lineKey} from '../simulation/lines.js?v=overlay-6';
export function createDockingGraphics(scene,vessel,sim){
 const ropes={},segments=16,sides=6,ropeMat=new THREE.MeshStandardMaterial({color:'#e2bc80',roughness:.95});
 for(const side of ['port','stbd'])for(const type of Object.keys(LINE_DEFS)){const positions=new Float32Array((segments+1)*sides*3),indices=[];for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*sides+j,b=i*sides+(j+1)%sides,c=b+sides,d=a+sides;indices.push(a,b,d,b,c,d);}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(indices);const mesh=new THREE.Mesh(geometry,ropeMat);mesh.frustumCulled=false;mesh.visible=false;scene.add(mesh);ropes[lineKey(type,side)]=mesh;}
 const fenders=[],fenderMat=new THREE.MeshStandardMaterial({color:'#e6edf0',roughness:.5});
 for(const side of [-1,1])for(const station of [-.3,-.1,.1,.3]){const m=new THREE.Mesh(new THREE.CapsuleGeometry(.3,.95,4,8),fenderMat);m.position.set(station*31,1.5,side*fenderBeam(sim,station));m.castShadow=true;vessel.add(m);fenders.push({mesh:m,side});}
 function update(){for(const [type,m] of Object.entries(ropes)){const line=sim.lines[type];m.visible=!!line;if(!line)continue;const p=cleatPoint(sim,line.type,line.side),dx=line.target.x-p.x,dz=line.target.y-p.y,dist=Math.hypot(dx,dz),length=line.lengthN*sim.scale,sag=Math.min(1.6,Math.sqrt(Math.max(0,length*length-dist*dist))*.25),nx=-dz/(dist||1),nz=dx/(dist||1),array=m.geometry.attributes.position.array;for(let i=0;i<=segments;i++){const t=i/segments,x=p.x+dx*t,z=p.y+dz*t,y=2.62+(2.5-2.62)*t-4*sag*t*(1-t);for(let j=0;j<sides;j++){const a=j/sides*Math.PI*2,k=(i*sides+j)*3;array[k]=x+.09*Math.cos(a)*nx;array[k+1]=y+.09*Math.sin(a);array[k+2]=z+.09*Math.cos(a)*nz;}}m.geometry.attributes.position.needsUpdate=true;m.geometry.computeVertexNormals();}
 for(const {mesh,side} of fenders)mesh.visible=side<0?sim.fenders.port:sim.fenders.stbd;}
 return {update};
}
