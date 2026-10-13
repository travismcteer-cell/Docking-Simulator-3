import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {engineFamily,engineCount,targetRPM,loopMix} from '../src/audio/mix.js';
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
