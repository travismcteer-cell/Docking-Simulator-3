import * as THREE from '../../vendor/three.module.js?v=touch-9';
export function createLevelGraphics(scene,sim){
 function marker(){const group=new THREE.Group(),fill=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#ffd45c',transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}));fill.rotation.x=-Math.PI/2;group.add(fill);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,-.5,.5,0,-.5,.5,0,.5,-.5,0,.5],3));const border=new THREE.LineLoop(geometry,new THREE.LineBasicMaterial({color:'#ffd45c'}));group.add(border);scene.add(group);return {group,fill,border};}
 const docking=marker(),anchor=marker();function show(marker,t,color){marker.group.visible=!!t;if(!t)return;marker.group.position.set(t.x+t.w/2,.3,t.y+t.h/2);marker.group.scale.set(t.w,1,t.h);marker.group.rotation.y=-(t.rotation||0)*Math.PI/180;marker.fill.material.color.set(color);marker.border.material.color.set(color);}
 return {update(){const run=sim.mode==='levels'?sim.levelRun:null;show(docking,run?.definition.target,run?.complete?'#91e6ad':'#ffd45c');show(anchor,run?.definition.anchorDropZone,'#ff9959');}};
}
