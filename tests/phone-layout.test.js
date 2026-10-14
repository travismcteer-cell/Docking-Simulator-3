import test from 'node:test';
import assert from 'node:assert/strict';
import {isPhoneLayout,bindPhoneLayout} from '../src/interface/phone-layout.js';
import {bindScrollGrip} from '../src/interface/touch.js';
test('phone layout is stable across rotation and excludes tablets and desktop',()=>{
 for(const [w,h] of [[375,667],[390,844],[430,932]]){assert(isPhoneLayout(true,w,h));assert(isPhoneLayout(true,h,w));assert(!isPhoneLayout(false,w,h));}
 for(const [w,h] of [[744,1133],[768,1024],[820,1180],[1024,1366]]){assert(!isPhoneLayout(true,w,h));assert(!isPhoneLayout(true,h,w));}
});
test('scroll strip scrolls by pointer movement and supports keyboard access',()=>{
 const prior=globalThis.window,calls=[],grip=new EventTarget();grip.setPointerCapture=()=>{};grip.classList={add(){},remove(){}};globalThis.window={scrollBy:(x,y)=>calls.push([x,y])};
 const emit=(type,fields)=>{const e=new Event(type,{cancelable:true});Object.assign(e,fields);grip.dispatchEvent(e);};
 try{bindScrollGrip(grip);emit('pointerdown',{pointerId:1,pointerType:'touch',clientY:400});emit('pointermove',{pointerId:2,clientY:200});assert.equal(calls.length,0);emit('pointermove',{pointerId:1,clientY:330});assert.deepEqual(calls,[[0,70]]);emit('pointercancel',{pointerId:1});emit('pointermove',{pointerId:1,clientY:300});assert.equal(calls.length,1);emit('keydown',{key:'ArrowDown'});assert.deepEqual(calls[1],[0,80]);}finally{globalThis.window=prior;}
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
