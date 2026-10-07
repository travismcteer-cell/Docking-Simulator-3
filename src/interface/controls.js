import {resetSimulation} from '../simulation/state.js';
import {attachLine,LINE_DEFS} from '../simulation/lines.js';
import {resetCamera} from '../graphics/camera.js';
export function bindControls(root,sim,camera){const q=s=>root.querySelector(s);let notice='',noticeUntil=0;
 function update(){const s=sim.state;for(const [key,id] of [['port','pv'],['stbd','sv']])q('#'+id).textContent=s[key]===0?'N':(s[key]>0?'Ahead ':'Reverse ')+Math.round(Math.abs(s[key])*100)+'%';q('#av').textContent=s.steer+'°';q('#wv').textContent=sim.environment.wind+' kt';q('#readout').textContent=(Math.hypot(s.vx,s.vy)*110).toFixed(1)+' kt';
 for(const type of Object.keys(LINE_DEFS)){const line=sim.lines[type],button=q('#line-'+type);button.setAttribute('aria-pressed',String(!!line));button.textContent=LINE_DEFS[type].label+(line?' · attached':'');}
 for(const side of ['port','stbd'])q('#fender-'+side).setAttribute('aria-pressed',String(sim.fenders[side]));
 const names=Object.entries(sim.lines).map(([type,line])=>LINE_DEFS[type].label+' '+(line.tension>.0005?'taut':'slack'));q('#line-status').textContent=names.length?names.join(' · '):'No lines attached';const status=performance.now()<noticeUntil?notice:(sim.contact?'Hull contact':sim.fenders.contactPort||sim.fenders.contactStbd?'Fender contact':'Open water');if(q('#contact').textContent!==status)q('#contact').textContent=status;}
 function sync(){for(const key of ['port','stbd'])sim.state[key]=+q('#'+key).value/100;sim.state.steer=+q('#steer').value;sim.environment.wind=+q('#wind').value;update();}
 for(const key of ['port','stbd','steer','wind'])q('#'+key).oninput=sync;
 q('#stop').onclick=()=>{q('#port').value=q('#stbd').value=0;sync();};
 function reset(){resetSimulation(sim,q('#spawn').value);resetCamera(camera,sim.state,sim.scale);for(const key of ['port','stbd','steer'])q('#'+key).value=0;notice='';noticeUntil=0;update();}
 q('#reset').onclick=reset;q('#spawn').onchange=reset;
 for(const type of Object.keys(LINE_DEFS))q('#line-'+type).onclick=()=>{notice=attachLine(sim,type);noticeUntil=performance.now()+2500;update();};
 q('#release').onclick=()=>{sim.lines={};notice='All lines released';noticeUntil=performance.now()+2000;update();};
 for(const side of ['port','stbd'])q('#fender-'+side).onclick=()=>{sim.fenders[side]=!sim.fenders[side];update();};
 // Switching tabs always puts both engines into neutral.
 const neutral=()=>{q('#port').value=q('#stbd').value=0;sim.state.port=sim.state.stbd=0;update();};
 window.addEventListener('blur',neutral);document.addEventListener('visibilitychange',()=>{if(document.hidden)neutral();});
 update();return {update,reset};
}
