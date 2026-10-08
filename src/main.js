import {createSimulation} from './simulation/state.js';
import {stepPhysics} from './simulation/physics.js';
import {createGraphics} from './graphics/scene.js?v=look-3';
import {resetCamera,followCamera,bindCameraLook} from './graphics/camera.js?v=look-3';
import {bindControls} from './interface/controls.js?v=momentary-2';
const root=document.getElementById('dock3d');
try {
 const sim=createSimulation(),camera={};resetCamera(camera,sim.state,sim.scale);
 bindCameraLook(root.querySelector('canvas'),camera);
 const graphics=createGraphics(root.querySelector('canvas'),sim,camera),controls=bindControls(root,sim,camera);
 new ResizeObserver(()=>{graphics.resize();graphics.paint();}).observe(root.querySelector('canvas'));
 let last=performance.now(),acc=0;
 function loop(now){const dt=Math.min((now-last)/1000,.05);last=now;acc+=dt;while(acc>=1/120){stepPhysics(sim,1/120);followCamera(camera,sim.state,sim.scale,1/120);acc-=1/120;}graphics.paint(dt);controls.update();requestAnimationFrame(loop);}requestAnimationFrame(loop);
}catch(error){console.error(error);root.querySelector('#contact').textContent='3D graphics could not start: '+error.message;root.querySelector('#contact').setAttribute('role','alert');}
