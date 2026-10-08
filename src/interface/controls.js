import {resetSimulation} from '../simulation/state.js';
import {attachLine,LINE_DEFS} from '../simulation/lines.js';
import {resetCamera} from '../graphics/camera.js';
export function bindControls(root,sim,camera){const q=s=>root.querySelector(s);let notice='',noticeUntil=0;const holds=new Map();let sequence=0;
 const buttons=[...root.querySelectorAll('.engine-button[data-engine]')];
 function applyHolds(){for(const side of ['port','stbd']){const active=[...holds.values()].filter(h=>h.engine===side||h.engine==='both').sort((a,b)=>b.order-a.order)[0];sim.state[side]=active?active.power:0;}for(const button of buttons){const held=[...holds.values()].some(h=>h.button===button);button.classList.toggle('held',held);button.setAttribute('aria-pressed',String(held));}update();}
 function begin(token,button){holds.set(token,{button,engine:button.dataset.engine,power:+button.dataset.power/100,order:++sequence});applyHolds();}
 function end(token){if(holds.delete(token))applyHolds();}
 const neutral=()=>{holds.clear();applyHolds();};
 for(const button of buttons){button.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();button.setPointerCapture(e.pointerId);begin('pointer:'+e.pointerId,button);});for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,e=>end('pointer:'+e.pointerId));button.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)begin('key:'+button.dataset.engine+button.dataset.power,button);}});button.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();end('key:'+button.dataset.engine+button.dataset.power);}});button.addEventListener('blur',()=>end('key:'+button.dataset.engine+button.dataset.power));button.addEventListener('contextmenu',e=>e.preventDefault());}
 for(const name of ['pointerup','pointercancel'])window.addEventListener(name,e=>end('pointer:'+e.pointerId));
 function update(){const s=sim.state;for(const [key,id] of [['port','pv'],['stbd','sv']])q('#'+id).textContent=s[key]===0?'N':(s[key]>0?'Ahead ':'Reverse ')+Math.round(Math.abs(s[key])*100)+'%';q('#bv').textContent=s.port===s.stbd?(s.port===0?'N':(s.port>0?'Ahead ':'Reverse ')+Math.round(Math.abs(s.port)*100)+'%'):'Mixed';q('#av').textContent=s.steer+'°';q('#wv').textContent=sim.environment.wind+' kt';q('#readout').textContent=(Math.hypot(s.vx,s.vy)*110).toFixed(1)+' kt';
 for(const type of Object.keys(LINE_DEFS)){const line=sim.lines[type],button=q('#line-'+type);button.setAttribute('aria-pressed',String(!!line));button.textContent=LINE_DEFS[type].label+(line?' · attached':'');}
 for(const side of ['port','stbd'])q('#fender-'+side).setAttribute('aria-pressed',String(sim.fenders[side]));
 const names=Object.entries(sim.lines).map(([type,line])=>LINE_DEFS[type].label+' '+(line.tension>.0005?'taut':'slack'));q('#line-status').textContent=names.length?names.join(' · '):'No lines attached';const status=performance.now()<noticeUntil?notice:(sim.contact?'Hull contact':sim.fenders.contactPort||sim.fenders.contactStbd?'Fender contact':'Open water');if(q('#contact').textContent!==status)q('#contact').textContent=status;}
 function sync(){sim.state.steer=+q('#steer').value;sim.environment.wind=+q('#wind').value;update();}
 for(const key of ['steer','wind'])q('#'+key).oninput=sync;
 q('#stop').onclick=neutral;
 for(const b of root.querySelectorAll('[data-steer]'))b.onclick=()=>{q('#steer').value=b.dataset.steer;sync();};
 function reset(){neutral();resetSimulation(sim,q('#spawn').value);resetCamera(camera,sim.state,sim.scale);q('#steer').value=0;notice='';noticeUntil=0;update();}
 q('#reset').onclick=reset;q('#spawn').onchange=reset;
 for(const type of Object.keys(LINE_DEFS))q('#line-'+type).onclick=()=>{notice=attachLine(sim,type);noticeUntil=performance.now()+2500;update();};
 q('#release').onclick=()=>{sim.lines={};notice='All lines released';noticeUntil=performance.now()+2000;update();};
 for(const side of ['port','stbd'])q('#fender-'+side).onclick=()=>{sim.fenders[side]=!sim.fenders[side];update();};
 // Switching tabs always puts both engines into neutral.

 window.addEventListener('blur',neutral);document.addEventListener('visibilitychange',()=>{if(document.hidden)neutral();});
 update();return {update,reset};
}
