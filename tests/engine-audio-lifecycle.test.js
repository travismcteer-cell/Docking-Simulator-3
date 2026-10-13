import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {bindEngineAudio} from '../src/audio/engines.js';
class Element extends EventTarget {checked=false;value='';open=false;textContent='';}
const settle=()=>new Promise(r=>setTimeout(r,20));
test('audio loads once per family, twins respond separately, and menus/mute suspend playback',async()=>{
 const original={window:globalThis.window,document:globalThis.document,fetch:globalThis.fetch};
 const contexts=[],sources=[],downloads=[];
 const param=()=>({value:0,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}});
 class Context {state='suspended';currentTime=0;destination={};constructor(){contexts.push(this);}createGain(){return {gain:param(),connect(){},disconnect(){}};}createBufferSource(){const s={playbackRate:param(),connect(){},disconnect(){},start(){s.started=true;},stop(){s.stopped=true;}};sources.push(s);return s;}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}decodeAudioData(){return Promise.resolve({duration:6});}}
 const root=new Element(),elements={};for(const id of ['audio-enabled','audio-volume','audio-family','audio-status','home-screen','settings-screen','setup-screen','level-result'])elements[id]=new Element();
 root.querySelector=s=>elements[s.slice(1)];elements['audio-volume'].value='50';elements['audio-family'].value='auto';
 const doc=new Element();doc.hidden=false;globalThis.document=doc;globalThis.window={AudioContext:Context};
 globalThis.fetch=async url=>{downloads.push(String(url));const data=await readFile(url);return {ok:true,json:async()=>JSON.parse(data),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)};};
 const sim={model:{id:'Express-33'},boat:{propulsion:{type:'twinSterndrive'}},state:{port:0,stbd:0},sessionActive:true};
 try {
  const audio=bindEngineAudio(root,sim);audio.update(0);assert.equal(contexts.length,0);
  elements['audio-enabled'].checked=true;elements['audio-enabled'].dispatchEvent(new Event('change'));audio.update(1);
  for(let i=0;i<30&&sources.length===0;i++)await settle();audio.update(100);
  assert.equal(sources.length,6);assert.equal(downloads.length,4);assert(sources.every(s=>s.loop&&s.loopStart===0&&s.loopEnd===6));
  sim.state.port=.25;audio.update(200);assert(sources[0].playbackRate.value>sources[3].playbackRate.value);
  sim.state.port=-.25;audio.update(300);assert(sources[0].playbackRate.value>sources[3].playbackRate.value);
  elements['settings-screen'].open=true;audio.update(400);await settle();assert.equal(contexts[0].state,'suspended');assert(sources.every(s=>s.stopped));
  elements['settings-screen'].open=false;audio.update(500);await settle();audio.update(600);assert.equal(downloads.length,4);assert.equal(contexts[0].state,'running');
  sim.model.id='bowrider';sim.boat.propulsion.type='singleOutboard';audio.update(700);for(let i=0;i<30&&sources.length<15;i++)await settle();audio.update(800);assert.equal(sources.length,15);assert.equal(downloads.length,7);
  doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));await settle();assert.equal(contexts[0].state,'suspended');assert(sources.every(s=>s.stopped));
  doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));await settle();audio.update(900);
  elements['audio-enabled'].checked=false;elements['audio-enabled'].dispatchEvent(new Event('change'));await settle();assert.equal(contexts[0].state,'suspended');assert(sources.every(s=>s.stopped));
 }finally {Object.assign(globalThis,original);}
});
