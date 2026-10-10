import {stepContacts} from './simulation/contacts.js?v=contacts-24';
import {stepLevel} from './simulation/levels.js?v=contacts-24';
import {bindGameTouch,bindTouchRanges} from './interface/touch.js?v=layout-10';
import {createMiniMap} from './interface/minimap.js?v=levels-23';
import {createSimulation} from './simulation/state.js?v=anchor-scenery-21';
import {stepPhysics} from './simulation/physics.js?v=levels-23';
import {createGraphics} from './graphics/scene.js?v=levels-23';
import {resetCamera,followCamera,bindCameraLook} from './graphics/camera.js?v=anchor-scenery-21';
import {bindControls} from './interface/controls.js?v=contacts-24';
const root=document.getElementById('dock3d');
try {
 const sim=createSimulation(),camera={};resetCamera(camera,sim.state,sim.scale);
 bindCameraLook(root.querySelector('#game-canvas'),camera);bindGameTouch(root);bindTouchRanges(root);
 const graphics=createGraphics(root.querySelector('#game-canvas'),sim,camera),controls=bindControls(root,sim,camera),map=createMiniMap(root.querySelector('#mini-map'),sim);
 new ResizeObserver(()=>{graphics.resize();graphics.paint();}).observe(root.querySelector('canvas'));
 let last=performance.now(),acc=0;
 function loop(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!root.querySelector('#setup-screen').open&&!document.hidden&&!sim.levelRun?.complete)acc+=dt;else acc=0;while(acc>=1/120){if(sim.levelRun?.complete){acc=0;break;}stepPhysics(sim,1/120);stepContacts(sim,1/120);stepLevel(sim,1/120);followCamera(camera,sim.state,sim.scale,1/120);acc-=1/120;}graphics.paint(dt);map.paint(now);controls.update();requestAnimationFrame(loop);}requestAnimationFrame(loop);
}catch(error){console.error(error);const message=root.querySelector('#startup-error');message.hidden=false;message.textContent='3D graphics could not start: '+error.message;}


