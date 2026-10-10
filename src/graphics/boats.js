import * as THREE from '../../vendor/three.module.js?v=touch-9';
import {deckAt as sampleDeck,FLEET} from '../data/fleet.js?v=fleet-npcs-20';
export function createCruiser(entry=FLEET['Express-33'],details=true){
const {model:data,definition:def,p}=entry;
const vessel=new THREE.Group(),boat=new THREE.Group();boat.scale.setScalar(1/.3048);vessel.add(boat);
boat.position.x=-entry.originShift;
const mats={};const colors={side:def.colors.upperHull,bottom:def.colors.lowerHull,transom:def.colors.upperHull,deck:def.colors.deck,cabin:def.colors.superstructure,roof:def.colors.superstructure,bridge:def.colors.superstructure,'bridge-floor':def.colors.deck,door:def.colors.superstructure,'cockpit-wall':def.colors.superstructure,'cockpit-floor':entry.id==='Express-33'?'#b4a28a':def.colors.cockpit,arch:def.colors.accessory,mast:def.colors.accessory};
for(const [g,c] of Object.entries(colors))mats[g]=new THREE.MeshStandardMaterial({color:c,roughness:g==='bottom'?.3:.48,metalness:.08,side:THREE.DoubleSide});
mats.glass=new THREE.MeshPhysicalMaterial({color:def.colors.windows,transparent:true,opacity:.35,roughness:.12,metalness:.1,depthWrite:false,side:entry.id==='Motoryacht-60'?THREE.DoubleSide:THREE.FrontSide});
const groups={};data.faces.forEach((f,i)=>{const g=data.groups[i];(groups[g]??=[]).push(...f.flatMap(j=>data.vertices[j]));});
for(const [g,a] of Object.entries(groups)){const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(a,3));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mats[g]||mats.deck);mesh.castShadow=g!=='glass';mesh.receiveShadow=true;boat.add(mesh);}
const steel=new THREE.MeshStandardMaterial({color:'#b8c2c6',metalness:.8,roughness:.24}),rubber=new THREE.MeshStandardMaterial({color:'#343b40',roughness:.7}),cushion=new THREE.MeshStandardMaterial({color:'#d8cbb5',roughness:.9}),teak=new THREE.MeshStandardMaterial({color:'#a68d69',roughness:.85});
function box(x,y,z,a,b,c,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;boat.add(m);return m;}
function tube(points,r,mat){const curve=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(8,points.length*2),r,6,false),mat);boat.add(mesh);return mesh;}
const stern=-p.aft*.3048,platformLength=entry.platformLength*.3048,sternWidth=p.beam*.3048*p.stern;
if(platformLength){
box(stern-platformLength/2,.32,0,platformLength,.12,sternWidth*.92,mats.deck);box(stern-platformLength/2,.385,0,platformLength*.9,.014,sternWidth*.86,teak);
for(let z=-sternWidth*.4;z<sternWidth*.4;z+=.14)box(stern-platformLength/2,.394,z,platformLength*.9,.009,.009,rubber);
}
if(!details){
 if(def.handlingProfile==='twin-outboard')for(const sign of [-1,1]){const z=sign*sternWidth*.20;box(stern-.4,.98,z,.55,.75,.45,rubber);box(stern-.4,.3,z,.14,.65,.17,rubber);}
 return vessel;
}
for(const indices of data.rail){const pts=indices.map(i=>data.vertices[i]);tube(pts,.024,rubber);tube(pts.map(v=>[v[0],v[1]+.028,v[2]]),.008,steel);}
function deckAt(x){return sampleDeck(data,p,x);}
for(const d of Object.values(entry.lineDefs))for(const sign of [-1,1]){const x=(d.xFrac*entry.geometryLength+entry.originShift)*.3048,z=sign*d.beam*.3048,y=d.height*.3048;box(x,y-.018,z,.20,.025,.04,steel);box(x-.045,y-.045,z,.025,.06,.025,steel);box(x+.045,y-.045,z,.025,.06,.025,steel);}
if(entry.id==='Express-33'){
for(const s of [-1,1]){const pts=[1.05,1.8,2.8,3.8,4.65].map(x=>{const d=deckAt(x);return[x,d[1]+.36,s*(d[2]-.08)];});tube(pts,.012,steel);for(const v of pts.slice(0,-1))tube([[v[0],v[1]-.36,v[2]],v],.01,steel);}
const floorY=Math.min(deckAt((p.cockpitOffset-p.aft)*.3048)[1],deckAt((p.cockpitOffset+p.cockpit-p.aft)*.3048)[1])-p.cockpitDepth*.3048;
box(stern+.8,floorY+.22,0,.65,.45,1.65,mats.deck);box(stern+.8,floorY+.47,0,.65,.12,1.65,cushion);box(stern+.52,floorY+.72,0,.16,.5,1.65,cushion);
box(-.4,floorY+.25,.65,.62,.5,.53,mats.deck);box(-.4,floorY+.53,.65,.64,.14,.56,cushion);box(-.65,floorY+.84,.65,.12,.55,.56,cushion);
box(.3,floorY+.67,.65,.55,.22,.5,rubber);
const wheel=new THREE.Mesh(new THREE.TorusGeometry(.14,.018,6,24),steel);wheel.rotation.y=Math.PI/2;wheel.position.set(.05,floorY+.86,.65);boat.add(wheel);
for(let i=0;i<3;i++)box(.008+i*.08,floorY+.79,.55,.045,.045,.008,steel);
}else{
 const FT=.3048,large=entry.id==='Motoryacht-60',isBow=entry.id==='bowrider',twinOutboard=entry.definition.handlingProfile==='twin-outboard',hasOutboard=isBow||twinOutboard,size=large?1.3:1;
 const floorY=Math.min(deckAt((p.cockpitOffset-p.aft)*FT)[1],deckAt((p.cockpitOffset+p.cockpit-p.aft)*FT)[1])-p.cockpitDepth*FT;
 const aftSeatX=(p.cockpitOffset-p.aft)*FT+.48;
 if(isBow){
  // Low cushions sit just above the cockpit sole, without raised box bases.
  box(aftSeatX,floorY+.10,0,.62,.13,sternWidth*.68,cushion);box(aftSeatX-.23,floorY+.36,0,.14,.5,sternWidth*.68,cushion);
  // A full-width bulkhead supports the forward windscreen down to the cockpit floor.
  const screenX=(p.enclosureOffset+p.enclosureLength-p.aft)*FT,screenDeck=deckAt(screenX),screenBase=screenDeck[1]+p.enclosureLift*FT;
  box(screenX,(floorY+screenBase)/2,0,.10,Math.max(.02,screenBase-floorY),screenDeck[2]*2*p.enclosureWidth/100,mats.cabin);
  box(screenX,screenBase+.012,0,.12,.024,screenDeck[2]*2*p.enclosureWidth/100,rubber);
 }else{
  box(aftSeatX,floorY+.30,0,.65,.5,sternWidth*.60,mats.deck);box(aftSeatX,floorY+.58,0,.67,.14,sternWidth*.62,cushion);
  // Teak steps and stainless grab rails into the flybridge.
  const ladderX=((large?p.aftCabinOffset:p.cabinOffset)-p.aft)*FT-.14,z=-p.beam*FT*.30,top=large?Math.max(deckAt((p.aftCabinOffset-p.aft)*FT)[1],deckAt((p.aftCabinOffset+p.aftCabinLength-p.aft)*FT)[1])+(p.aftCabinLift+p.aftCabinHeight)*FT:entry.helmFloor;
  for(const dz of [-.20,.20])tube([[ladderX,floorY+.2,z+dz],[ladderX,top+.42,z+dz]],.022,steel);
  for(let y=floorY+.3;y<top;y+=.27)box(ladderX,y,z,.16,.035,.4,teak);
  // Paired rod holders on the aft gunwales, with short fishing rods.
  if(['sportfisher-30','CC-38','adventure-29'].includes(entry.id))for(const sign of [-1,1]){const x=stern+.65,d=deckAt(x),z=sign*(d[2]-.12);tube([[x,d[1]-.12,z],[x-.10,d[1]+.18,z]],.035,steel);tube([[x-.1,d[1]+.12,z],[x-.65,d[1]+1.25,z+sign*.15]],.012,rubber);}
 }
 // Rails follow each supplied hull instead of using Express-33 coordinates.
 for(const sign of [-1,1]){const pts=[.56,.68,.79,.90,.96].map(t=>{const x=(-p.aft+(p.aft+p.forward)*t)*FT,d=deckAt(x);return [x,d[1]+(isBow?.18:.42),sign*Math.max(.05,d[2]-.08)];});tube(pts,.014,steel);for(const v of pts.slice(0,-1))tube([[v[0],deckAt(v[0])[1],v[2]],v],.012,steel);}
 const hx=(entry.helm.forward+entry.originShift)*FT,hz=entry.helm.side*FT,hy=entry.helmFloor,helmScale=Math.min(size,(entry.helm.height*FT-hy-.12)/.80);
 box(hx+.24,hy+.58*helmScale,hz,.47*size,.30*size,.50*size,rubber);
 const wheel=new THREE.Mesh(new THREE.TorusGeometry(.14*size,.018,6,24),steel);wheel.rotation.y=Math.PI/2;wheel.position.set(hx,hy+.80*helmScale,hz);boat.add(wheel);
 if(isBow){box(hx-.63,floorY+.10,hz,.55,.13,.54,cushion);box(hx-.85,floorY+.34,hz,.13,.47,.54,cushion);}
 else{box(hx-.63*size,hy+.35*helmScale,hz,.5*size,.55*size,.48*size,mats.deck);box(hx-.63*size,hy+.64*helmScale,hz,.55*size,.13,.54*size,cushion);box(hx-.85*size,hy+.75*helmScale,hz,.13,.47*size,.54*size,cushion);}
 for(let i=0;i<3;i++){const gauge=new THREE.Mesh(new THREE.CylinderGeometry(.045*size,.045*size,.012,12),steel);gauge.rotation.z=Math.PI/2;gauge.position.set(hx+.001,hy+.63*helmScale,hz+(i-1)*.12*size);boat.add(gauge);}
 if(!isBow&&p.accessory!=='none'){const mountX=(p.enclosureOffset-p.aft+p.enclosureLength*p.accessoryPosition/100)*FT,ax=mountX-p.accessoryHeight*FT*(p.accessory==='mast'?.1:.18),ay=deckAt(mountX)[1]+p.accessoryHeight*FT;box(ax,ay+.13,0,.45,.24,.55,mats.arch);box(ax,ay+.29,0,.9*size,.08,.14,steel);tube([[ax,ay,0],[ax,ay+1.0*size,0]],.013,steel);}
 if(large){
  // Guardrails around the raised aft deck follow its independently raked roof.
  const x0=(p.aftCabinOffset-p.aft)*FT,x1=x0+p.aftCabinLength*FT,h=p.aftCabinHeight*FT,y=Math.max(deckAt(x0)[1],deckAt(x1)[1])+p.aftCabinLift*FT+h+.08,back=x0+h*Math.tan(p.aftCabinAftRake*Math.PI/180),front=x1-h*Math.tan(p.aftCabinRake*Math.PI/180),w0=deckAt(x0)[2]*p.aftCabinWidth/100*.94,w1=deckAt(x1)[2]*p.aftCabinWidth/100*.9;
  for(const sign of [-1,1]){const pts=[0,.33,.66,1].map(t=>[back+(front-back)*t,y+.30,sign*(w0+(w1-w0)*t)]);tube(pts,.012,steel);for(const v of pts)tube([[v[0],y,v[2]],v],.012,steel);}
  tube([[back,y+.3,-w0],[back,y+.3,w0]],.012,steel);
 }
 // Red port and green starboard sidelights, mounted on the sheer.
 for(const sign of [-1,1]){const x=hx+.6,d=deckAt(x),light=new THREE.MeshStandardMaterial({color:sign<0?'#ee3333':'#33db79',emissive:sign<0?'#ee2222':'#22bb55',emissiveIntensity:.5});box(x,d[1]+.05,sign*(d[2]-.02),.14,.06,.06,light);}
 if(hasOutboard){
  const motors=[];
  for(const engineZ of (twinOutboard?[-sternWidth*.20,sternWidth*.20]:[0])){
  // Transom bracket remains fixed; the entire outboard rotates about its vertical steering axis.
  box(stern-.08,.68,engineZ,.22,.52,.40,steel);
  const motor=new THREE.Group();motor.name='steerable-outboard';motor.position.set(stern-.20,0,engineZ);boat.add(motor);motors.push(motor);
  const motorMat=new THREE.MeshStandardMaterial({color:'#252d35',metalness:.35,roughness:.30});
  const part=(geometry,x,y,z,mat)=>{const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;motor.add(mesh);return mesh;};
  const cowling=part(new THREE.CapsuleGeometry(.23,.34,5,12),-.20,.98,0,motorMat);cowling.scale.set(1.10,1,.9);
  part(new THREE.BoxGeometry(.14,.65,.17),-.18,.38,0,motorMat);
  const gearcase=part(new THREE.CylinderGeometry(.09,.09,.42,12),-.28,-.04,0,motorMat);gearcase.rotation.z=Math.PI/2;
  part(new THREE.BoxGeometry(.28,.22,.025),-.24,-.17,0,motorMat);
  const prop=new THREE.Group();prop.position.set(-.53,-.04,0);motor.add(prop);
  for(let i=0;i<3;i++){const blade=new THREE.Mesh(new THREE.BoxGeometry(.04,.24,.08),steel);blade.position.y=.11;const pivot=new THREE.Group();pivot.rotation.x=i*Math.PI*2/3;pivot.add(blade);prop.add(pivot);}
  part(new THREE.BoxGeometry(.10,.015,.35),-.15,1.21,0,steel);
  }
  // Split swim steps keep the space immediately around the engine clear.
  for(const sign of [-1,1]){box(stern-.25,.38,sign*sternWidth*(twinOutboard?.42:.32),.50,.11,sternWidth*(twinOutboard?.12:.26),mats.deck);box(stern-.25,.443,sign*sternWidth*(twinOutboard?.42:.32),.44,.012,sternWidth*(twinOutboard?.10:.23),teak);}
  vessel.userData.updateSteering=degrees=>{for(const motor of motors)motor.rotation.y=degrees*Math.PI/180;};
 }
}

return vessel;
}


