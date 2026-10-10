import * as THREE from '../../vendor/three.module.js?v=touch-9';
import {DOCKS,LAND,BOUNDS} from '../data/marina.js?v=basin-slips-18';
export function addLandmarks(scene){const material=color=>new THREE.MeshStandardMaterial({color,roughness:.86}),trunkMat=material('#725340'),leafMat=material('#416446'),wall=material('#dfd5bc'),roof=material('#384d5a'),red=material('#b83232'),white=material('#e8e9e1'),black=material('#162732');
 const inside=(x,y,p)=>{let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[j],b=p[i];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;};const trees=[];for(let x=-630;x<710;x+=43)for(let z=-503;z<515;z+=43){const px=x+Math.sin(x*3+z)*7,pz=z+Math.cos(z*2-x)*7;if(LAND.some(p=>inside(px,pz,p.points)))trees.push([px,pz]);}
 const instances=(geo,mat,position)=>{const m=new THREE.InstancedMesh(geo,mat,trees.length),matrix=new THREE.Matrix4();trees.forEach(([x,z],i)=>{const [y,s]=position(i);matrix.compose(new THREE.Vector3(x,y,z),new THREE.Quaternion(),new THREE.Vector3(s,s,s));m.setMatrixAt(i,matrix);});m.castShadow=true;m.receiveShadow=true;scene.add(m);};instances(new THREE.CylinderGeometry(.65,.9,11,6),trunkMat,()=>[8,1]);instances(new THREE.IcosahedronGeometry(7,0),leafMat,i=>[18,1+(i%4)*.1]);
 const box=(x,y,z,w,h,d,mat)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);return m;};
 function building(x,z,w,d){box(x,10,z,w,15,d,wall);box(x,18,z,w+3,1.8,d+3,roof);for(let q=x-w/2+5;q<x+w/2-3;q+=9)box(q,10,z+d/2+.1,5,5,.3,black);box(x,6,z+d/2+.3,4,7,.4,black);}
 const gas=DOCKS.reduce((a,b)=>a.w*a.h>b.w*b.h?a:b),gx=gas.x+gas.w/2,gz=gas.y+gas.h*.35;building(gx,gz,48,32);
 for(const z of [gas.y+gas.h*.62,gas.y+gas.h*.79]){const x=gas.x+gas.w-25;box(x,3,z,10,1,7,white);box(x,5.4,z,3,4.5,2.8,red);box(x,7,z,3.2,2.2,3,white);box(x,7,z+1.56,2,1,.12,black);box(x+2,5.6,z,.3,3,.4,black);}
 box(gas.x+gas.w-25,14,gas.y+gas.h*.7,24,1.3,40,roof);for(const dz of [-17,17])for(const dx of [-9,9])box(gas.x+gas.w-25+dx,8,gas.y+gas.h*.7+dz,.7,11,.7,white);
 const signCanvas=document.createElement('canvas');signCanvas.width=256;signCanvas.height=80;const ctx=signCanvas.getContext('2d');ctx.fillStyle='#193c53';ctx.fillRect(0,0,256,80);ctx.fillStyle='#fff';ctx.font='bold 44px sans-serif';ctx.textAlign='center';ctx.fillText('MARINA FUEL',128,56);const texture=new THREE.CanvasTexture(signCanvas);texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(34,9),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));sign.position.set(gx,15,gz+16.25);scene.add(sign);

 // Distant scenery is outside the navigable bounds and shares the scene fog.
 const mountainMat=material('#788d8c'),sandMat=material('#c9b998'),grassMat=material('#8c9975');
 box(0,1,-1050,3000,2,800,grassMat);
 for(let i=0;i<17;i++){const x=-1250+i*165,z=-1170-(i%4)*65,height=100+(Math.sin(i*2.1)+1)*65,m=new THREE.Mesh(new THREE.ConeGeometry(120+(i%3)*35,height,7),mountainMat);m.position.set(x,height/2-10,z);m.rotation.y=i*.8;scene.add(m);}
 for(let i=0;i<19;i++){const x=-680+i*75,z=-760-(i%3)*34,h=18+(i%5)*8;box(x,h/2,z,28+(i%3)*8,h,24+(i%4)*7,wall);box(x,h+.8,z,31+(i%3)*8,1.6,27+(i%4)*7,roof);}
 function coast(side){const edge=side<0?BOUNDS.minX-35:BOUNDS.maxX+35,outer=edge+side*310,points=[];for(let i=0;i<=20;i++){const z=BOUNDS.minY-140+i*(BOUNDS.maxY-BOUNDS.minY+280)/20,x=edge+side*(Math.sin(i*.65)*25+20);points.push([x,z]);}points.push([outer,BOUNDS.maxY+140],[outer,BOUNDS.minY-140]);const shape=new THREE.Shape();points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);const beach=new THREE.Mesh(geo,sandMat);beach.position.y=.35;scene.add(beach);box(outer,1,0,140,1,BOUNDS.maxY-BOUNDS.minY+280,grassMat);}
 coast(-1);coast(1);
 building(-360,-483,46,28);building(470,-480,38,26);building(-610,220,28,42);return {treeCount:trees.length,gasDockId:gas.id};
}
