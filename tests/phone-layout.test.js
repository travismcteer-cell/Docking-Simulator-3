import test from 'node:test';
import assert from 'node:assert/strict';
import {isPhoneLayout,bindPhoneLayout} from '../src/interface/phone-layout.js';
import {bindGameTouch} from '../src/interface/touch.js';
test('phone layout is stable across rotation and excludes tablets and desktop',()=>{
 for(const [w,h] of [[375,667],[390,844],[430,932]]){assert(isPhoneLayout(true,w,h));assert(isPhoneLayout(true,h,w));assert(!isPhoneLayout(false,w,h));}
 for(const [w,h] of [[744,1133],[768,1024],[820,1180],[1024,1366]]){assert(!isPhoneLayout(true,w,h));assert(!isPhoneLayout(true,h,w));}
});
test('native scrolling gestures on the strip bypass game touch cancellation',()=>{
 const root=new EventTarget();bindGameTouch(root);
 for(const type of ['touchstart','touchmove'])for(const strip of [true,false]){
  const e=new Event(type,{cancelable:true});
  Object.defineProperty(e,'target',{value:{closest:s=>s==='#scroll-grip'?(strip?{}:null):s==='.scene-frame,.helm-panel'?{}:null}});
  root.dispatchEvent(e);assert.equal(e.defaultPrevented,!strip);
 }
});

test('phone landscape prompt closes on portrait without moving the scroll strip again',()=>{
 const prior={window:globalThis.window,screen:globalThis.screen,matchMedia:globalThis.matchMedia};
 const orientation=new EventTarget();orientation.matches=true;
 const prompt=new EventTarget();prompt.open=false;prompt.showModal=()=>prompt.open=true;prompt.close=()=>prompt.open=false;
 const grip=new EventTarget();grip.setAttribute=()=>{};const mount={append(node){assert.equal(node,grip);this.count=(this.count||0)+1;}};
 const root={classList:{toggle(name,on){assert.equal(name,'phone-ui');assert(on);}},querySelector:s=>({'#phone-rotate':prompt,'#scroll-grip':grip,'.right-controls':mount})[s]};
 globalThis.window=new EventTarget();globalThis.screen={width:844,height:390};globalThis.matchMedia=s=>s.includes('pointer')?{matches:true}:orientation;
 try{bindPhoneLayout(root);assert(prompt.open);const cancel=new Event('cancel',{cancelable:true});prompt.dispatchEvent(cancel);assert(cancel.defaultPrevented);orientation.matches=false;orientation.dispatchEvent(new Event('change'));assert(!prompt.open);assert.equal(mount.count,1);}finally{Object.assign(globalThis,prior);}
});
