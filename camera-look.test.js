import test from 'node:test';
import assert from 'node:assert/strict';
import {resetCamera,followCamera,bindCameraLook} from '../src/graphics/camera.js';
test('drag holds camera offset; release and cancellation spring back independently of chase',()=>{
 globalThis.window=new EventTarget();const canvas=new EventTarget();canvas.style={};canvas.setPointerCapture=()=>{};const camera={},state={x:0,y:0,a:0};resetCamera(camera,state,1);bindCameraLook(canvas,camera);
 const send=(type,id,x=0,y=0)=>{const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:y,pointerType:'touch',button:0});canvas.dispatchEvent(e);};
 send('pointerdown',1,100,100);send('pointermove',1,200,140);assert.equal(camera.lookYaw,-.8);assert.equal(camera.lookPitch,.24);
 send('pointerdown',2,0,0);send('pointermove',2,50,50);assert.equal(camera.lookYaw,-.8);
 state.x=80;followCamera(camera,state,1,8);assert.equal(camera.lookYaw,-.8);assert(Math.abs(camera.x-80*(1-Math.exp(-1)))<1e-9);
 send('pointerup',1);followCamera(camera,state,1,3);assert(Math.abs(camera.lookYaw+.8/Math.E)<1e-9);assert(Math.abs(camera.lookPitch-.24/Math.E)<1e-9);
 send('pointerdown',3);send('pointermove',3,10000,10000);assert.equal(camera.lookYaw,-Math.PI);assert(camera.lookPitch<1);send('pointercancel',3);assert.equal(camera.dragging,false);
 resetCamera(camera,state,1);assert.equal(camera.lookYaw,0);assert.equal(camera.lookPitch,0);
});
