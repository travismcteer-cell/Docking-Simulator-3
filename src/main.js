import {bindGameTouch} from './interface/touch.js?v=setup-7';
import {createMiniMap} from './interface/minimap.js?v=setup-7';
import {createSimulation} from './simulation/state.js?v=setup-7';
import {stepPhysics} from './simulation/physics.js?v=setup-7';
import {createGraphics} from './graphics/scene.js?v=setup-7';
import {resetCamera,followCamera,bindCameraLook} from './graphics/camera.js?v=setup-7';
import {bindControls} from './interface/controls.js?v=setup-7';
const root=document.getElementById('dock3d');
try {
 const sim=createSimulation(),camera={};resetCamera(camera,sim.state,sim.scale);
 bindCameraLook(root.querySelector('#game-canvas'),camera);bindGameTouch(root);
 const graphics=createGraphics(root.querySelector('#game-canvas'),sim,camera),controls=bindControls(root,sim,camera),map=createMiniMap(root.querySelector('#mini-map'),sim);
 new ResizeObserver(()=>{graphics.resize();graphics.paint();}).observe(root.querySelector('canvas'));
 let last=performance.now(),acc=0;
 function loop(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!root.querySelector('#setup-screen').open)acc+=dt;while(acc>=1/120){stepPhysics(sim,1/120);followCamera(camera,sim.state,sim.scale,1/120);acc-=1/120;}graphics.paint(dt);map.paint(now);controls.update();requestAnimationFrame(loop);}requestAnimationFrame(loop);
}catch(error){console.error(error);root.querySelector('#contact').textContent='3D graphics could not start: '+error.message;root.querySelector('#contact').setAttribute('role','alert');}
