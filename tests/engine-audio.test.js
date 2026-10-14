import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {engineFamily,engineCount,targetRPM,loopMix,engineLoudness,throttleMix,workboatAudioRPM} from '../src/audio/mix.js';
const manifest=JSON.parse(readFileSync(new URL('../assets/audio/engines/manifest.json',import.meta.url)));
test('automatic sound families and single/twin engines match playable boats',()=>{
 for(const [id,propulsion,family,count] of [['Express-33','twinSterndrive','gas-inboard',2],['sportfisher-30','twinInboardRudder','gas-inboard',2],['Motoryacht-60','twinInboardRudder','diesel-inboard',2],['bowrider','singleOutboard','outboard',1],['deadrise-40','singleInboardRudder','gas-inboard',1]]){const sim={model:{id},boat:{propulsion:{type:propulsion}}};assert.equal(engineFamily(sim),family);assert.equal(engineCount(sim),count);assert.equal(engineFamily(sim,'diesel-inboard'),'diesel-inboard');}
});
test('forward and reverse have equal RPM; neutral idles and recordings bound full power',()=>{
 for(const {clips} of Object.values(manifest.engines)){const idle=clips[0].rpm;assert.equal(targetRPM(0,idle),idle);assert.equal(targetRPM(.25,idle),targetRPM(-.25,idle));assert.equal(targetRPM(1,idle),3000);assert.equal(targetRPM(2,idle),3000);}
});
test('blend is continuous and preserves squared gain across recording anchors',()=>{
 for(const {clips} of Object.values(manifest.engines)){
  clips.forEach((clip,i)=>{const mix=loopMix(clips,clip.rpm);assert(Math.abs(mix[i].gain-1)<1e-9);assert.equal(mix[i].rate,1);});
  for(let rpm=clips[0].rpm;rpm<=3000;rpm+=37){const mix=loopMix(clips,rpm);assert(Math.abs(mix.reduce((s,m)=>s+m.gain*m.gain,0)-1)<1e-9);assert(mix.filter(m=>m.gain>1e-9).length<=2);}
  const before=loopMix(clips,1799.999),after=loopMix(clips,1800.001);before.forEach((m,i)=>assert(Math.abs(m.gain-after[i].gain)<1e-5));
 }
});
test('manifest loops match actual mono PCM WAV assets',()=>{
 for(const {clips} of Object.values(manifest.engines))for(const clip of clips){const wav=readFileSync(new URL('../assets/audio/engines/'+clip.file,import.meta.url));assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt16LE(20),1);assert.equal(wav.readUInt16LE(22),1);assert.equal(wav.readUInt32LE(24),44100);assert.equal(wav.readUInt16LE(34),16);assert.equal((wav.length-44)/88200,clip.duration);assert.equal(clip.loopEnd,clip.duration);}
});

test('docking buttons select idle and working; full racing power selects high',()=>{
 for(const {clips} of Object.values(manifest.engines)){
  const idle=clips[0].rpm;
  for(const sign of [-1,1]){
   assert.equal(targetRPM(sign*.1,idle),idle+200);
   assert(Math.abs(targetRPM(sign*.25,idle)-1200)<1e-9);
   assert.equal(targetRPM(sign,idle),3000);
   const idleMix=throttleMix(clips,sign*.1);
   assert.equal(idleMix[0].gain,1);assert.equal(idleMix[0].rate,(idle+200)/idle);assert.equal(idleMix[1].gain,0);assert.equal(idleMix[2].gain,0);
   const workingMix=throttleMix(clips,sign*.25);
   assert.equal(workingMix[1].gain,1);assert.equal(workingMix[1].rate,1200/1800);
  }
  assert(targetRPM(.5,idle)>1200&&targetRPM(.5,idle)<3000);
  assert(Math.abs(targetRPM(.100001,idle)-(idle+200))<.02);
  assert(Math.abs(targetRPM(.250001,idle)-1200)<.02);
 }
 assert(engineLoudness(.1)>engineLoudness(0));
 assert(engineLoudness(.1)/engineLoudness(0)<1.15);
 assert.equal(engineLoudness(.1),engineLoudness(-.1));
});

test('neutral stays at original idle pitch while 10% shifts idle only',()=>{
 for(const {clips} of Object.values(manifest.engines)){
  assert.equal(throttleMix(clips,0)[0].rate,1);
  assert.equal(targetRPM(.05,clips[0].rpm),clips[0].rpm+100);
  for(const threshold of [.1,.25]){const before=throttleMix(clips,threshold-.000001),after=throttleMix(clips,threshold+.000001);before.forEach((m,i)=>assert(Math.abs(m.gain-after[i].gain)<.0001));}
 }
});

test('workboat RPM follows throttle gradually with bounded speed influence',()=>{
 const idle=900;
 const settle=(power,speed,start=idle)=>{let rpm=start;for(let i=0;i<200;i++)rpm=workboatAudioRPM(rpm,power,speed,idle,.05);return rpm;};
 assert(workboatAudioRPM(idle,1,0,idle,.05)>idle);
 assert(workboatAudioRPM(idle,1,0,idle,.05)<1200);
 const stationary=settle(1,0),moving=settle(1,20);
 assert(stationary>2500&&stationary<2600);assert(moving>2999&&moving<=3000);
 assert(Math.abs(settle(1,40)-moving)<1e-9);
 assert(Math.abs(settle(-1,20)-moving)<1e-9);
 assert(settle(0,20,3000)<901);
 assert(settle(.5,20)<moving);
 const down=3000-workboatAudioRPM(3000,0,20,idle,.05),up=workboatAudioRPM(idle,1,20,idle,.05)-idle;assert(down>up);
 assert.equal(workboatAudioRPM(idle,1,20,idle,0),idle);
});

test('workboat retains its original 50% RPM target',()=>{
 const idle=900;let rpm=idle;for(let i=0;i<400;i++)rpm=workboatAudioRPM(rpm,.5,20,idle,.05);
 assert(Math.abs(rpm-2200)<.001);
});
