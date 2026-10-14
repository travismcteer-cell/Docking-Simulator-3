import {engineFamily,engineCount,throttleMix,engineLoudness,loopMix,workboatAudioRPM} from './mix.js?v=audio-clicks-47';
const assetRoot=new URL('../../assets/audio/engines/',import.meta.url);
export function bindEngineAudio(root,sim){
 const enable=root.querySelector('#audio-enabled'),volume=root.querySelector('#audio-volume'),family=root.querySelector('#audio-family'),status=root.querySelector('#audio-status');
 let context,master,manifest,group=null,wanted='',loading=null,lastUpdate=-Infinity,desiredRunning=false,transition=Promise.resolve(),unlocked=false;
 const buffers=new Map();
 function report(message){status.textContent=message;}
 function active(){return enable.checked&&Number(volume.value)>0&&sim.sessionActive&&!sim.levelRun?.complete&&!document.hidden&&!['home-screen','settings-screen','setup-screen','level-result','phone-rotate'].some(id=>root.querySelector('#'+id)?.open);}
 function running(value){if(!context||desiredRunning===value)return;desiredRunning=value;transition=transition.catch(()=>{}).then(async()=>{if(!desiredRunning)await new Promise(resolve=>setTimeout(resolve,80));return desiredRunning?context.resume():context.suspend();}).catch(()=>report('Tap an engine control to resume sound.'));}
 function unlock(){if(!enable.checked||(context&&!active()))return;try{if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio is unavailable in this browser');context=new Audio({latencyHint:'interactive'});master=context.createGain();master.gain.value=0;master.connect(context.destination);}unlocked=true;desiredRunning=true;if(context.state!=='running')context.resume().catch(()=>report('Tap an engine control to resume sound.'));}catch(error){enable.checked=false;report(error.message);}}
 function stop(){if(!group)return;const retired=group;group=null;retired.bus.gain.setTargetAtTime(0,context.currentTime,.008);
  // Let the waveform fade to silence before stopping sources or the context.
  setTimeout(()=>{for(const engine of retired.engines)for(const voice of engine){voice.source.stop();voice.source.disconnect();voice.gain.disconnect();}retired.bus.disconnect();},70);
 }
 async function load(type){
  if(!manifest){const response=await fetch(new URL('manifest.json',assetRoot));if(!response.ok)throw new Error('Audio manifest could not load');manifest=await response.json();}
  const clips=manifest.engines[type].clips;
  if(!buffers.has(type)){const decoded=await Promise.all(clips.map(async clip=>{const r=await fetch(new URL(clip.file,assetRoot));if(!r.ok)throw new Error('Engine recording could not load');return context.decodeAudioData(await r.arrayBuffer());}));buffers.set(type,decoded);}
  return clips;
 }
 function start(key,type,count,clips){stop();const engines=[],bus=context.createGain();bus.gain.value=0;bus.connect(master);bus.gain.setTargetAtTime(1,context.currentTime,.025);
  for(let i=0;i<count;i++){const voices=clips.map((clip,j)=>{const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers.get(type)[j];source.loop=true;source.loopStart=clip.loopStart;source.loopEnd=clip.loopEnd;gain.gain.value=0;source.connect(gain);gain.connect(bus);source.start(0,i*.137);return {source,gain};});engines.push(voices);}
  group={key,clips,engines,bus,rpms:engines.map(()=>clips[0].rpm)};
 }
 function update(now=performance.now()){
  const playing=active();if(!playing||!unlocked){wanted='';stop();running(false);lastUpdate=-Infinity;return;}
  running(true);const type=engineFamily(sim,family.value),count=engineCount(sim),key=type+':'+count+':'+sim.model.id;wanted=key;
  if(group?.key!==key){stop();if(!loading){report('Loading engine sound…');loading=load(type).then(clips=>{if(wanted===key&&active())start(key,type,count,clips);}).catch(error=>{enable.checked=false;report(error.message+'; sound disabled.');}).finally(()=>{loading=null;});}return;}
  if(now-lastUpdate<50)return;const dt=Number.isFinite(lastUpdate)?(now-lastUpdate)/1000:.05;lastUpdate=now;const t=context.currentTime;
  const workboat=sim.model.id==='deadrise-40',speedKnots=workboat?Math.hypot(sim.state.vx||0,sim.state.vy||0)*110:0;
  master.gain.setTargetAtTime(Number(volume.value)/100*(count===2?.25:.4),t,.08);
  group.engines.forEach((engine,i)=>{const power=Math.abs(i===0?sim.state.port:sim.state.stbd),loudness=sim.failures?.[i===0?'port':'stbd']?0:engineLoudness(power);let mix;
   if(workboat){group.rpms[i]=workboatAudioRPM(group.rpms[i],power,speedKnots,group.clips[0].rpm,dt);mix=loopMix(group.clips,group.rpms[i]);}else mix=throttleMix(group.clips,power);engine.forEach((voice,j)=>{voice.source.playbackRate.setTargetAtTime(mix[j].rate,t,.15);voice.gain.gain.setTargetAtTime(mix[j].gain*loudness,t,.12);});});
  report((type==='gas-inboard'?'Gas inboard':type==='diesel-inboard'?'Diesel inboard':'Outboard')+' · '+(count===2?'twin engines':'single engine'));
 }
 enable.addEventListener('change',()=>{if(enable.checked){unlock();report('Sound enabled · starts when you return to the game.');}else{report('Sound off');update();}});
 family.addEventListener('change',()=>{wanted='';stop();report('Engine type selected · starts when you return to the game.');});
 root.addEventListener('pointerdown',unlock,{passive:true});root.addEventListener('keydown',unlock);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){wanted='';stop();running(false);}else update();});
 report('Sound off');return {update};
}
