import {createOtherBoatGraphics} from './traffic.js?v=other-boats-16';
import {addLandmarks} from './landmarks.js?v=touch-9';
import {cameraPose} from './camera.js?v=helm-height-15';
import {DOCK_POLYGONS,LAND,ANCHOR_GUIDES,BOUNDS} from '../data/marina.js?v=touch-9';
import {createCruiser} from './boats.js?v=fleet-14';
import * as THREE from '../../vendor/three.module.js?v=touch-9';
import {createDockingGraphics} from './docking.js?v=fleet-14';
export function createGraphics(canvas,sim,camera){
const {state,docks,outline,scale}=sim;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();scene.background=new THREE.Color('#b8d3dd');scene.fog=new THREE.Fog('#b8d3dd',300,1200);
const viewCamera=new THREE.PerspectiveCamera(50,1,.3,2200);
scene.add(new THREE.HemisphereLight('#dceeff','#526d64',2.1));
const sun=new THREE.DirectionalLight('#fff1d6',3.1);sun.position.set(-70,100,30);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-95,right:95,top:95,bottom:-95,near:1,far:260});sun.shadow.bias=-.0004;sun.shadow.normalBias=.08;scene.add(sun);
const mat=(color,roughness=.6,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const ivory=mat('#f3f1e7',.32),hullWhite=mat('#e6e9e5',.33),trim=mat('#243849',.36),chrome=mat('#b8cad1',.21,.75),cushion=mat('#d8cabc',.82),teak=mat('#a48258',.8),rubber=mat('#273139',.85),windowMat=new THREE.MeshPhysicalMaterial({color:'#25566b',roughness:.13,metalness:.35,transparent:true,opacity:.8,side:THREE.DoubleSide});
function mesh(geometry,material,parent=scene){const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(x,y,z,w,h,d,material,parent=scene){const m=mesh(new THREE.BoxGeometry(w,h,d),material,parent);m.position.set(x,y,z);return m;}
function rod(a,b,r,material,parent){const v1=new THREE.Vector3(...a),v2=new THREE.Vector3(...b),delta=v2.clone().sub(v1);const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),8),material,parent);m.position.copy(v1).add(v2).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
function surface(points,material,parent){const g=new THREE.BufferGeometry();const verts=[];for(let i=1;i<points.length-1;i++)verts.push(...points[0],...points[i],...points[i+1]);g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.computeVertexNormals();return mesh(g,material,parent);}
function outlineDeck(poly,y,material,parent){const shape=new THREE.Shape();poly.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);g.translate(0,y,0);return mesh(g,material,parent);}
function loft(poly,rings,material,parent){const v=[],indices=[],n=poly.length;for(const [y,sx,sz] of rings)for(const [x,z] of poly)v.push(x*sx,y,z*sz);for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=b+n,d=a+n;indices.push(a,d,b,b,d,c);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(indices);g.computeVertexNormals();const m=mesh(g,material,parent);m.material.side=THREE.DoubleSide;return m;}
function pathTube(points,r,material,parent,closed=false){const c=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed,'centripetal');return mesh(new THREE.TubeGeometry(c,Math.max(20,points.length*5),r,6,closed),material,parent);}
let vessel=createCruiser(sim.model),modelId=sim.model.id;scene.add(vessel);
// Procedural wood texture: no image downloads.
const texCanvas=document.createElement('canvas');texCanvas.width=128;texCanvas.height=256;const tc=texCanvas.getContext('2d');tc.fillStyle='#a28c6a';tc.fillRect(0,0,128,256);
let seed=71;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
for(let i=0;i<750;i++){tc.strokeStyle=`rgba(55,37,20,${random()*.18})`;tc.beginPath();const x=random()*128,y=random()*256;tc.moveTo(x,y);tc.lineTo(x+(random()-.5)*2,y+15+random()*70);tc.stroke();}
for(let x=0;x<128;x+=32){tc.fillStyle='rgba(39,29,19,.45)';tc.fillRect(x,0,1,256);}
const woodTexture=new THREE.CanvasTexture(texCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;woodTexture.wrapS=woodTexture.wrapT=THREE.RepeatWrapping;woodTexture.repeat.set(2,5);woodTexture.anisotropy=4;
const dockWood=new THREE.MeshStandardMaterial({map:woodTexture,color:'#e0c19c',roughness:.9}),dockSides=mat('#756d5b',.95),postMat=mat('#74654e',.9);
for(const d of docks){const x=d.x+d.w/2,z=d.y+d.h/2;box(x,1.3,z,d.w,1.8,d.h,dockSides);box(x,2.25,z,d.w,.13,d.h,dockWood);}
function solidPolygon(p,height,material){const shape=new THREE.Shape();p.points.forEach((v,i)=>i?shape.lineTo(v.x,-v.y):shape.moveTo(v.x,-v.y));shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);const m=mesh(g,material);m.position.y=.05;return m;}
const stoneMat=mat('#777d77',.95),landMat=mat('#71845e',.96),quayMat=mat('#b1aa94',.91);
for(const p of DOCK_POLYGONS){if(p.kind==='piling'){const x=p.points.reduce((a,v)=>a+v.x,0)/p.points.length,z=p.points.reduce((a,v)=>a+v.y,0)/p.points.length;const post=mesh(new THREE.CylinderGeometry(.75,.8,5.5,8),postMat);post.position.set(x,2.5,z);}else solidPolygon(p,p.kind==='stone'?3.5:2.3,p.kind==='stone'?stoneMat:quayMat);}
for(const p of LAND)solidPolygon(p,2.7,landMat);
for(const p of ANCHOR_GUIDES){const buoy=mesh(new THREE.SphereGeometry(.7,8,6),mat('#eda850'));buoy.position.set(p.x,.55,p.y);}
// Quiet details stay on shore; no decorative structure obstructs a fairway.
box(-570,8,-480,32,12,22,mat('#d5c9b4'));box(-570,14,-480,35,1.2,25,mat('#475e66'));
addLandmarks(scene);
// Animated water normals, sky tint and sun glints. No reflection render pass.
const waterUniforms={uTime:{value:0},uEye:{value:new THREE.Vector3()},uWind:{value:0},uDir:{value:new THREE.Vector2(1,0)}};
const waterMat=new THREE.ShaderMaterial({uniforms:waterUniforms,vertexShader:`
 varying vec3 vWorld;uniform float uTime;uniform float uWind;uniform vec2 uDir;
 void main(){vec3 p=position;float t=uTime;
 float along=dot(p.xz,uDir),across=dot(p.xz,vec2(-uDir.y,uDir.x));float amp=.012+uWind*.12;float speed=.15+uWind*2.;// Water stays level; analytic normals carry the wind ripples.
 vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}
 `,fragmentShader:`
 varying vec3 vWorld;uniform float uTime;uniform float uWind;uniform vec2 uDir;uniform vec3 uEye;
 void main(){vec2 p=vWorld.xz;float t=uTime;
 float along=dot(p,uDir),across=dot(p,vec2(-uDir.y,uDir.x)),speed=.15+uWind*2.;float phase=along*.55-t*speed;
 float slope=(.007+uWind*.095)*cos(phase)+(.003+uWind*.04)*cos(along*1.1+across*.18-t*speed*1.4);vec2 normalSlope=uDir*slope+vec2(-uDir.y,uDir.x)*(.002+uWind*.012)*cos(across*.9+along*.3-t*.5);float dx=normalSlope.x,dz=normalSlope.y;
 vec3 n=normalize(vec3(-dx,1.,-dz));vec3 v=normalize(uEye-vWorld);vec3 l=normalize(vec3(-.6,.8,.3));
 float fres=pow(1.-max(dot(n,v),0.),3.);float glint=pow(max(dot(reflect(-l,n),v),0.),210.);
 float rip=.5+.5*sin(phase+sin(across*.3)*.3);
 vec3 c=mix(vec3(.035,.23,.27),vec3(.12,.36,.40),rip*(.03+uWind*.25));
 c=mix(c,vec3(.56,.72,.75),fres*.45);c+=vec3(1.,.88,.65)*glint*.45;
 float foam=smoothstep(.88,.99,sin(phase))*smoothstep(.45,.8,uWind)*smoothstep(.4,.85,sin(across*.7+along*.15));c=mix(c,vec3(.72,.82,.81),foam*.15);float fog=smoothstep(400.,1400.,length(uEye-vWorld));c=mix(c,vec3(.56,.68,.72),fog);
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
const waterGeo=new THREE.PlaneGeometry(3600,3600,1,1);waterGeo.rotateX(-Math.PI/2);const water=mesh(waterGeo,waterMat);water.position.set((BOUNDS.minX+BOUNDS.maxX)/2,0,(BOUNDS.minY+BOUNDS.maxY)/2);water.castShadow=false;water.receiveShadow=false;
const shadow=mesh(new THREE.PlaneGeometry(3600,3600),new THREE.ShadowMaterial({opacity:.22}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.14;shadow.castShadow=false;
// Lightweight foam particles, recycled rather than continually allocated.
const foamCanvas=document.createElement('canvas');foamCanvas.width=foamCanvas.height=32;const fc=foamCanvas.getContext('2d'),grad=fc.createRadialGradient(16,16,0,16,16,16);grad.addColorStop(0,'rgba(240,250,245,.65)');grad.addColorStop(.4,'rgba(221,239,231,.3)');grad.addColorStop(1,'rgba(221,239,231,0)');fc.fillStyle=grad;fc.fillRect(0,0,32,32);
const foamTex=new THREE.CanvasTexture(foamCanvas),foam=[];for(let i=0;i<120;i++){const m=new THREE.SpriteMaterial({map:foamTex,transparent:true,depthWrite:false,opacity:0});const s=new THREE.Sprite(m);s.position.y=.22;scene.add(s);foam.push({sprite:s,life:0,vx:0,vz:0});}let foamIndex=0,foamClock=0;
function updateFoam(dt){for(const f of foam){if(f.life<=0)continue;f.life-=dt;f.sprite.position.x+=f.vx*dt;f.sprite.position.z+=f.vz*dt;f.sprite.material.opacity=Math.max(0,f.life/5)*.7;const size=1.1+(5-f.life)*.4;f.sprite.scale.set(size,size,1);}
 foamClock+=dt;const power=Math.abs(state.port)+Math.abs(state.stbd),speed=Math.hypot(state.vx,state.vy)*110;
 if(foamClock>.05&&(power>.02||speed>.15)){foamClock=0;const a=state.a*Math.PI/180,c=Math.cos(a),s=Math.sin(a);for(const side of (sim.boat.propulsion.type==='singleOutboard'?[0]:[-1,1])){const f=foam[foamIndex++%foam.length],u=-(sim.geometryLength||31)/2,v=side*2.5+(random()-.5);f.life=5;f.sprite.position.set(state.x*scale+u*c-v*s,.23,state.y*scale+u*s+v*c);const engine=side<=0?state.port:state.stbd;f.vx=-c*engine*7+(random()-.5)*.3;f.vz=-s*engine*7+(random()-.5)*.3;}}
}
const otherBoats=createOtherBoatGraphics(scene,sim);
let elapsed=0;
function paint(dt=0){otherBoats.update();if(modelId!==sim.model.id){docking.dispose();vessel.removeFromParent();const materials=new Set();vessel.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material);});for(const m of materials)m.dispose();vessel=createCruiser(sim.model);scene.add(vessel);docking=createDockingGraphics(scene,vessel,sim);modelId=sim.model.id;}vessel.userData.updateSteering?.(state.steer);elapsed+=dt;vessel.position.set(state.x*scale,.07*Math.sin(elapsed*1.2),state.y*scale);vessel.rotation.set(.004*Math.sin(elapsed*.9),-state.a*Math.PI/180,.003*Math.sin(elapsed*1.1));
 sun.position.set(camera.x-70,100,camera.y+30);sun.target.position.set(camera.x,0,camera.y);sun.target.updateMatrixWorld();
 const pose=cameraPose(camera,state,scale,sim.helm);viewCamera.position.set(...pose.eye);viewCamera.lookAt(...pose.target);

 const windAngle=sim.environment.windDirection*Math.PI/180;waterUniforms.uWind.value=sim.environment.wind/20;waterUniforms.uDir.value.set(Math.sin(windAngle),-Math.cos(windAngle));waterUniforms.uTime.value=elapsed;waterUniforms.uEye.value.copy(viewCamera.position);updateFoam(dt);docking.update();renderer.render(scene,viewCamera);
}

let docking=createDockingGraphics(scene,vessel,sim);
const cleatMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(.9,.15,.24),chrome,sim.dockCleats.length),matrix=new THREE.Matrix4();sim.dockCleats.forEach((p,i)=>{matrix.makeTranslation(p.x,2.47,p.y);cleatMesh.setMatrixAt(i,matrix);});scene.add(cleatMesh);
function resize(){const width=canvas.clientWidth,height=canvas.clientHeight;renderer.setSize(width,height,false);viewCamera.aspect=width/height;viewCamera.updateProjectionMatrix();}
return {paint,resize,renderer};
}


