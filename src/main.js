import {bindPhoneLayout} from './interface/phone-layout.js?v=full-height-scroll-50';
import {bindEngineAudio} from './audio/engines.js?v=progression-52';
import {createRenderGate} from './graphics/performance.js?v=mobile-performance-41';
import {stepPracticeTraffic} from './simulation/moving-traffic.js?v=races-40';
import {stepContacts} from './simulation/contacts.js?v=progression-52';
import {stepLevel,stepLevelTraffic,stepRaceStart} from './simulation/levels.js?v=progression-52';
import {bindGameTouch,bindTouchRanges} from './interface/touch.js?v=native-scroll-49';
import {createMiniMap} from './interface/minimap.js?v=races-40';
import {createSimulation} from './simulation/state.js?v=progression-52';
import {stepPhysics} from './simulation/physics.js?v=staged-spin-56';
import {createGraphics} from './graphics/scene.js?v=staged-spin-56';
import {resetCamera,followCamera,bindCameraLook} from './graphics/camera.js?v=camera-pivot-55';
import {bindControls} from './interface/controls.js?v=camera-pivot-55';
const root=document.getElementById('dock3d');
try {
 const sim=createSimulation(),camera={};resetCamera(camera,sim.state,sim.scale);
 bindCameraLook(root.querySelector('#game-canvas'),camera);bindGameTouch(root);bindTouchRanges(root);
 const graphics=createGraphics(root.querySelector('#game-canvas'),sim,camera),controls=bindControls(root,sim,camera),map=createMiniMap(root.querySelector('#mini-map'),sim);
 bindPhoneLayout(root);
 const audio=bindEngineAudio(root,sim);
 const gate=createRenderGate(graphics.profile.fps);
 const shadowSelect=root.querySelector('#graphics-shadows'),statsToggle=root.querySelector('#graphics-stats'),stats=root.querySelector('#render-stats');
 shadowSelect.value=graphics.profile.mobile?'off':'soft';
 shadowSelect.addEventListener('change',()=>graphics.setShadows(shadowSelect.value));
 statsToggle.addEventListener('change',()=>{stats.hidden=!statsToggle.checked;statsFrames=0;statsStart=performance.now();});
 new ResizeObserver(()=>graphics.resize()).observe(root.querySelector('canvas'));
 let statsFrames=0,statsStart=performance.now();
 function updateStats(now){if(!statsToggle.checked)return;statsFrames++;const elapsed=now-statsStart;if(elapsed<1000)return;const r=graphics.renderer,info=r.info.render;stats.textContent=`${(statsFrames*1000/elapsed).toFixed(1)} FPS · ${graphics.profile.fps||'uncapped'} cap · DPR ${r.getPixelRatio()} · ${r.domElement.width} × ${r.domElement.height} px\n${info.calls} draw calls · ${info.triangles.toLocaleString()} triangles · shadows ${shadowSelect.value}`;statsFrames=0;statsStart=now;}

 let last=performance.now(),acc=0;
 function loop(now){const dt=Math.min((now-last)/1000,.05);last=now;if(sim.sessionActive&&!root.querySelector('#phone-rotate').open&&!root.querySelector('#settings-screen').open&&!root.querySelector('#setup-screen').open&&!root.querySelector('#home-screen').open&&!document.hidden&&!sim.levelRun?.complete)acc+=dt;else acc=0;while(acc>=1/120){if(sim.levelRun?.complete){acc=0;break;}const raceDt=stepRaceStart(sim,1/120);if(raceDt===0){acc-=1/120;continue;}stepPracticeTraffic(sim,raceDt);stepLevelTraffic(sim,raceDt);stepPhysics(sim,raceDt);stepContacts(sim,raceDt);stepLevel(sim,raceDt);followCamera(camera,sim.state,sim.scale,1/120);acc-=1/120;}const renderDt=gate(now,!document.hidden&&!root.querySelector('#phone-rotate').open&&!root.querySelector('#home-screen').open);if(renderDt!==null){graphics.paint(renderDt);map.paint(now);controls.update();updateStats(now);}audio.update(now);requestAnimationFrame(loop);}requestAnimationFrame(loop);
}catch(error){console.error(error);const message=root.querySelector('#startup-error');message.hidden=false;message.textContent='3D graphics could not start: '+error.message;}


