import {createCruiser} from './boats.js';
import * as THREE from '../../vendor/three.module.js';
import {createDockingGraphics} from './docking.js';
export function createGraphics(canvas,sim,camera){
const {state,docks,outline,scale}=sim;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();scene.background=new THREE.Color('#b8d3dd');scene.fog=new THREE.Fog('#b8d3dd',190,540);
const viewCamera=new THREE.PerspectiveCamera(50,1,.3,1000);
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
const vessel=createCruiser(outline,{mesh,box,rod,surface,outlineDeck,loft,pathTube},{ivory,hullWhite,trim,chrome,cushion,teak,rubber,windowMat,mat});scene.add(vessel);
// Procedural wood texture: no image downloads.
const texCanvas=document.createElement('canvas');texCanvas.width=128;texCanvas.height=256;const tc=texCanvas.getContext('2d');tc.fillStyle='#a28c6a';tc.fillRect(0,0,128,256);
let seed=71;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
for(let i=0;i<750;i++){tc.strokeStyle=`rgba(55,37,20,${random()*.18})`;tc.beginPath();const x=random()*128,y=random()*256;tc.moveTo(x,y);tc.lineTo(x+(random()-.5)*2,y+15+random()*70);tc.stroke();}
for(let x=0;x<128;x+=32){tc.fillStyle='rgba(39,29,19,.45)';tc.fillRect(x,0,1,256);}
const woodTexture=new THREE.CanvasTexture(texCanvas);woodTexture.colorSpace=THREE.SRGBColorSpace;woodTexture.wrapS=woodTexture.wrapT=THREE.RepeatWrapping;woodTexture.repeat.set(2,5);woodTexture.anisotropy=4;
const dockWood=new THREE.MeshStandardMaterial({map:woodTexture,color:'#e0c19c',roughness:.9}),dockSides=mat('#756d5b',.95),postMat=mat('#74654e',.9);
for(const d of docks){
 const x=d.x+d.w/2,z=d.y+d.h/2;box(x,1.3,z,d.w,1.8,d.h,dockSides);
 const deck=box(x,2.25,z,d.w,.13,d.h,dockWood);
 // Plank seams and bumper strip emphasize scale.
 for(let zz=d.y;zz<d.y+d.h;zz+=1.05)box(x,2.323,zz,d.w,.015,.025,dockSides);
 for(const side of [-1,1])box(x+side*(d.w/2),1.85,z,.14,.26,d.h,rubber);
 const locations=d.h>10?[d.y+1,d.y+13,d.y+27,d.y+d.h-1]:[d.y+d.h/2];
 for(const zz of locations){const px=d.x+d.w/2;const post=mesh(new THREE.CylinderGeometry(.42,.48,5.5,10),postMat);post.position.set(px,2.2,zz);const cap=mesh(new THREE.CylinderGeometry(.5,.5,.12,10),ivory);cap.position.set(px,5,zz);box(px,2.47,zz+1.3,.9,.15,.2,chrome);}
}
// A quiet shore and a small marina building beyond the test berth.
box(0,-.2,-150,400,3,120,mat('#71845e'));box(0,1.2,-94,400,2,7,mat('#818780'));
box(-62,7,-110,28,12,20,mat('#d5c9b4'));box(-62,13.1,-110,31,1.2,23,mat('#475e66'));
for(let x=-73;x<-50;x+=5)box(x,8,-99.9,3,3,.15,windowMat);
for(let i=0;i<20;i++){const x=-165+i*17+random()*5,z=-110-random()*25;const trunk=mesh(new THREE.CylinderGeometry(.6,.8,9,6),mat('#76634a'));trunk.position.set(x,5,z);const tree=mesh(new THREE.ConeGeometry(5+random()*2,17+random()*4,7),mat(i%2?'#55725a':'#657d5c'));tree.position.set(x,17,z);}
// Animated water normals, sky tint and sun glints. No reflection render pass.
const waterUniforms={uTime:{value:0},uEye:{value:new THREE.Vector3()}};
const waterMat=new THREE.ShaderMaterial({uniforms:waterUniforms,vertexShader:`
 varying vec3 vWorld;uniform float uTime;
 void main(){vec3 p=position;float t=uTime;
 p.y+=.065*sin(p.x*.22+t*.7)+.04*sin(p.z*.31-t*.9);
 vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}
 `,fragmentShader:`
 varying vec3 vWorld;uniform float uTime;uniform vec3 uEye;
 void main(){vec2 p=vWorld.xz;float t=uTime;
 float dx=.0143*cos(p.x*.22+t*.7)+.016*cos(p.x*.83+p.y*.47+t*1.2);
 float dz=.0124*cos(p.y*.31-t*.9)+.011*cos(p.x*.83+p.y*.47+t*1.2);
 vec3 n=normalize(vec3(-dx,1.,-dz));vec3 v=normalize(uEye-vWorld);vec3 l=normalize(vec3(-.6,.8,.3));
 float fres=pow(1.-max(dot(n,v),0.),3.);float glint=pow(max(dot(reflect(-l,n),v),0.),210.);
 float rip=.5+.5*sin(p.x*.9+p.y*.65+sin(p.y*.38-t*.4)+t*.5);
 vec3 c=mix(vec3(.035,.23,.27),vec3(.12,.36,.40),rip*.15);
 c=mix(c,vec3(.56,.72,.75),fres*.45);c+=vec3(1.,.88,.65)*glint*.75;
 float fog=smoothstep(170.,460.,length(uEye-vWorld));c=mix(c,vec3(.56,.68,.72),fog);
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
const waterGeo=new THREE.PlaneGeometry(1600,1600,75,75);waterGeo.rotateX(-Math.PI/2);const water=mesh(waterGeo,waterMat);water.castShadow=false;water.receiveShadow=false;
const shadow=mesh(new THREE.PlaneGeometry(500,500),new THREE.ShadowMaterial({opacity:.22}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.14;shadow.castShadow=false;
// Lightweight foam particles, recycled rather than continually allocated.
const foamCanvas=document.createElement('canvas');foamCanvas.width=foamCanvas.height=32;const fc=foamCanvas.getContext('2d'),grad=fc.createRadialGradient(16,16,0,16,16,16);grad.addColorStop(0,'rgba(240,250,245,.65)');grad.addColorStop(.4,'rgba(221,239,231,.3)');grad.addColorStop(1,'rgba(221,239,231,0)');fc.fillStyle=grad;fc.fillRect(0,0,32,32);
const foamTex=new THREE.CanvasTexture(foamCanvas),foam=[];for(let i=0;i<120;i++){const m=new THREE.SpriteMaterial({map:foamTex,transparent:true,depthWrite:false,opacity:0});const s=new THREE.Sprite(m);s.position.y=.22;scene.add(s);foam.push({sprite:s,life:0,vx:0,vz:0});}let foamIndex=0,foamClock=0;
function updateFoam(dt){for(const f of foam){if(f.life<=0)continue;f.life-=dt;f.sprite.position.x+=f.vx*dt;f.sprite.position.z+=f.vz*dt;f.sprite.material.opacity=Math.max(0,f.life/5)*.7;const size=1.1+(5-f.life)*.4;f.sprite.scale.set(size,size,1);}
 foamClock+=dt;const power=Math.abs(state.port)+Math.abs(state.stbd),speed=Math.hypot(state.vx,state.vy)*110;
 if(foamClock>.05&&(power>.02||speed>.15)){foamClock=0;const a=state.a*Math.PI/180,c=Math.cos(a),s=Math.sin(a);for(const side of [-1,1]){const f=foam[foamIndex++%foam.length],u=-14.5,v=side*2.5+(random()-.5);f.life=5;f.sprite.position.set(state.x*scale+u*c-v*s,.23,state.y*scale+u*s+v*c);const engine=side<0?state.port:state.stbd;f.vx=-c*engine*7+(random()-.5)*.3;f.vz=-s*engine*7+(random()-.5)*.3;}}
}
let elapsed=0;
function paint(dt=0){elapsed+=dt;vessel.position.set(state.x*scale,.07*Math.sin(elapsed*1.2),state.y*scale);vessel.rotation.set(.004*Math.sin(elapsed*.9),-state.a*Math.PI/180,.003*Math.sin(elapsed*1.1));
 const h=camera.heading,look=h+(camera.lookYaw||0),pitch=Math.atan2(24,83)+(camera.lookPitch||0),tx=camera.x+18*Math.cos(h),tz=camera.y+18*Math.sin(h);viewCamera.position.set(tx-83*Math.cos(look),1+83*Math.tan(pitch),tz-83*Math.sin(look));viewCamera.lookAt(tx,1,tz);
 waterUniforms.uTime.value=elapsed;waterUniforms.uEye.value.copy(viewCamera.position);updateFoam(dt);docking.update();renderer.render(scene,viewCamera);
}

const docking=createDockingGraphics(scene,vessel,sim);
for(const p of sim.dockCleats){box(p.x,2.47,p.y,.9,.15,.24,chrome);}
function resize(){const width=canvas.clientWidth,height=440;renderer.setSize(width,height,false);viewCamera.aspect=width/height;viewCamera.updateProjectionMatrix();}
return {paint,resize,renderer};
}
