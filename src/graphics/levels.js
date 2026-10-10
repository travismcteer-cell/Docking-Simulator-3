import * as THREE from '../../vendor/three.module.js?v=touch-9';
export function createLevelGraphics(scene,sim){
 const group=new THREE.Group(),fill=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({color:'#ffd45c',transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide}));fill.rotation.x=-Math.PI/2;group.add(fill);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([- .5,0,-.5,.5,0,-.5,.5,0,.5,-.5,0,.5],3));const border=new THREE.LineLoop(geometry,new THREE.LineBasicMaterial({color:'#ffd45c'}));group.add(border);scene.add(group);
 return {update(){const run=sim.levelRun;group.visible=sim.mode==='levels'&&!!run;if(!group.visible)return;const t=run.definition.target;group.position.set(t.x+t.w/2,.3,t.y+t.h/2);group.scale.set(t.w,1,t.h);const color=run.complete?'#91e6ad':'#ffd45c';fill.material.color.set(color);border.material.color.set(color);}};
}
