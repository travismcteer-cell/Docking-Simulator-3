import {bindDirectionDial} from './setup.js?v=setup-7';
import {SPAWNS} from '../data/marina.js?v=setup-7';
import {resetSimulation} from '../simulation/state.js?v=setup-7';
import {attachLine,LINE_DEFS,lineKey} from '../simulation/lines.js?v=setup-7';
import {resetCamera} from '../graphics/camera.js?v=setup-7';
export function bindControls(root,sim,camera){const q=s=>root.querySelector(s);let notice='',noticeUntil=0;const holds=new Map();let sequence=0;
 q('#spawn').replaceChildren(...Object.entries(SPAWNS).map(([key,p])=>{const o=document.createElement('option');o.value=key;o.textContent=p.label;if(key==='f')o.selected=true;return o;}));
 const windDial=bindDirectionDial(root,'wind'),currentDial=bindDirectionDial(root,'current');
 const buttons=[...root.querySelectorAll('.engine-button[data-engine]')];
 function applyHolds(){for(const side of ['port','stbd']){const active=[...holds.values()].filter(h=>h.engine===side||h.engine==='both').sort((a,b)=>b.order-a.order)[0];sim.state[side]=active?active.power:0;}for(const button of buttons){const held=[...holds.values()].some(h=>h.button===button);button.classList.toggle('held',held);button.setAttribute('aria-pressed',String(held));}update();}
 function begin(token,button){holds.set(token,{button,engine:button.dataset.engine,power:+button.dataset.power/100,order:++sequence});applyHolds();}
 function end(token){if(holds.delete(token))applyHolds();}
 const neutral=()=>{holds.clear();applyHolds();};
 for(const button of buttons){button.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();button.setPointerCapture(e.pointerId);begin('pointer:'+e.pointerId,button);});for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,e=>end('pointer:'+e.pointerId));button.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)begin('key:'+button.dataset.engine+button.dataset.power,button);}});button.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();end('key:'+button.dataset.engine+button.dataset.power);}});button.addEventListener('blur',()=>end('key:'+button.dataset.engine+button.dataset.power));button.addEventListener('contextmenu',e=>e.preventDefault());}
 for(const name of ['pointerup','pointercancel'])window.addEventListener(name,e=>end('pointer:'+e.pointerId));
 function update(){const s=sim.state;for(const [key,id] of [['port','pv'],['stbd','sv']])q('#'+id).textContent=s[key]===0?'N':(s[key]>0?'Ahead ':'Reverse ')+Math.round(Math.abs(s[key])*100)+'%';q('#bv').textContent=s.port===s.stbd?(s.port===0?'N':(s.port>0?'Ahead ':'Reverse ')+Math.round(Math.abs(s.port)*100)+'%'):'Mixed';q('#av').textContent=s.steer+'°';q('#cv').textContent=(camera.catchup??8)+' s';q('#view').textContent='View · '+({far:'Far',medium:'Medium',helm:'Helm'}[camera.mode]);q('#catchup-note').textContent=camera.mode==='helm'?'Helm stays aligned with the boat':'Far / Medium follow delay · 0 = immediate';q('#wv').textContent=sim.environment.wind+' kt';q('#uv').textContent=sim.environment.current.toFixed(1)+' kt';const degrees=sim.environment.windDirection,directions=['N','NE','E','SE','S','SW','W','NW'];q('#dv').textContent=directions[Math.round(degrees/45)%8]+' · '+degrees+'°';q('#ud').textContent=directions[Math.round(sim.environment.currentDirection/45)%8]+' · '+sim.environment.currentDirection+'°';q('#environment-status').textContent='Wind '+sim.environment.wind+' kt · Current '+sim.environment.current.toFixed(1)+' kt';windDial.update();currentDial.update();q('.scene-hint').textContent=camera.mode==='helm'?'Drag to look · Recenter to face forward':'Drag to look · release to return';q('#wind-arrow').textContent='Wind → '+directions[Math.round(degrees/45)%8]+' · waves travel downwind';q('#readout').textContent=(Math.hypot(s.vx,s.vy)*110).toFixed(1)+' kt';
 for(const side of ['port','stbd'])for(const type of Object.keys(LINE_DEFS)){const line=sim.lines[lineKey(type,side)],button=q('#line-'+side+'-'+type),status=line?(line.tension>.0005?'Taut':'Slack'):'Released';button.setAttribute('aria-pressed',String(!!line));button.dataset.state=status.toLowerCase();button.querySelector('small').textContent=status;}
 for(const side of ['port','stbd']){const b=q('#fender-'+side);b.setAttribute('aria-pressed',String(sim.fenders[side]));b.querySelector('small').textContent=sim.fenders[side]?'Deployed':'Stowed';}
 const names=Object.entries(sim.lines).map(([type,line])=>(line.sideName==='port'?'Port ':line.sideName==='stbd'?'Stbd ':'')+LINE_DEFS[line.type||type].label+' '+(line.tension>.0005?'taut':'slack'));q('#line-status').textContent=names.length?names.join(' · '):'No lines attached';const status=performance.now()<noticeUntil?notice:(sim.contact?'Hull contact':sim.fenders.contactPort||sim.fenders.contactStbd?'Fender contact':'Open water');if(q('#contact').textContent!==status)q('#contact').textContent=status;}
 function sync(){sim.state.steer=+q('#steer').value;sim.environment.wind=+q('#wind').value;sim.environment.windDirection=+q('#wind-direction').value;sim.environment.current=+q('#current').value;sim.environment.currentDirection=+q('#current-direction').value;update();}
 for(const key of ['steer','wind','wind-direction','current','current-direction'])q('#'+key).oninput=sync;
 q('#stop').onclick=neutral;
 q('#setup-open').onclick=()=>{neutral();q('#setup-screen').showModal();};q('#setup-close').onclick=()=>q('#setup-screen').close();
 q('#catchup').oninput=()=>{camera.catchup=+q('#catchup').value;update();};
 q('#view').onclick=()=>{const modes=['far','medium','helm'];camera.mode=modes[(modes.indexOf(camera.mode)+1)%3];resetCamera(camera,sim.state,sim.scale);update();};
 q('#recenter').onclick=()=>{resetCamera(camera,sim.state,sim.scale);update();};
 q('#map-toggle').onclick=()=>{const b=q('#map-toggle'),expanded=b.classList.toggle('expanded');b.setAttribute('aria-expanded',String(expanded));};
 for(const b of root.querySelectorAll('[data-steer]'))b.onclick=()=>{q('#steer').value=b.dataset.steer;sync();};
 function reset(){neutral();resetSimulation(sim,q('#spawn').value);resetCamera(camera,sim.state,sim.scale);q('#steer').value=0;notice='';noticeUntil=0;update();}
 q('#reset').onclick=reset;q('#spawn').onchange=reset;
 for(const side of ['port','stbd'])for(const type of Object.keys(LINE_DEFS))q('#line-'+side+'-'+type).onclick=()=>{notice=attachLine(sim,type,side);noticeUntil=performance.now()+2500;update();};
 q('#release').onclick=()=>{sim.lines={};notice='All lines released';noticeUntil=performance.now()+2000;update();};
 for(const side of ['port','stbd'])q('#fender-'+side).onclick=()=>{sim.fenders[side]=!sim.fenders[side];update();};
 // Switching tabs always puts both engines into neutral.

 window.addEventListener('blur',neutral);document.addEventListener('visibilitychange',()=>{if(document.hidden)neutral();});
 update();return {update,reset};
}
