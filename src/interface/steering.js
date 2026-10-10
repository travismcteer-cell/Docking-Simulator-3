// Steering owns its pointer independently of the momentary throttle buttons.
export function bindMomentarySteering(inputs,onChange){
 let owner=null;
 const set=value=>{for(const input of inputs)input.value=value;onChange(value);};
 const reset=()=>{const old=owner;owner=null;if(old&&old.input.hasPointerCapture?.(old.id))old.input.releasePointerCapture(old.id);set(0);};
 const move=(input,e)=>{const r=input.getBoundingClientRect(),min=Number(input.min),max=Number(input.max),step=Number(input.step)||1,pad=Math.min(10,r.width/4),t=Math.max(0,Math.min(1,(e.clientX-r.left-pad)/Math.max(1,r.width-2*pad)));set(Math.max(min,Math.min(max,min+Math.round(t*(max-min)/step)*step)));};
 for(const input of inputs){
  input.addEventListener('pointerdown',e=>{if(owner||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();owner={input,id:e.pointerId};input.setPointerCapture(e.pointerId);move(input,e);});
  input.addEventListener('pointermove',e=>{if(owner?.input===input&&owner.id===e.pointerId){e.preventDefault();move(input,e);}});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])input.addEventListener(event,e=>{if(owner?.input===input&&owner.id===e.pointerId)reset();});
  input.addEventListener('input',()=>set(Number(input.value)));
  input.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))reset();});
  input.addEventListener('blur',reset);
 }
 for(const event of ['pointerup','pointercancel'])window.addEventListener(event,e=>{if(owner?.id===e.pointerId)reset();});
 window.addEventListener('blur',reset);window.addEventListener('orientationchange',reset);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 return reset;
}
