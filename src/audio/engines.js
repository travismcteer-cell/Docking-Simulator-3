import {engineFamily,engineCount,targetRPM,loopMix,engineLoudness} from './mix.js?v=docking-audio-44';
const assetRoot=new URL('../../assets/audio/engines/',import.meta.url);
export function bindEngineAudio(root,sim){
 const enable=root.querySelector('#audio-enabled'),volume=root.querySelector('#audio-volume'),family=root.querySelector('#audio-family'),status=root.querySelector('#audio-status');
 let context,master,manifest,group=null,wanted='',loading=null,lastUpdate=-Infinity,desiredRunning=false,transition=Promise.resolve(),unlocked=false;
 const buffers=new Map();
 function report(message){status.textContent=message;}
 function active(){return enable.checked&&Number(volume.value)>0&&sim.sessionActive&&!sim.levelRun?.complete&&!document.hidden&&!['home-screen','settings-screen','setup-screen','level-result'].some(id=>root.querySelector('#'+id)?.open);}
 function running(value){if(!context||desiredRunning===value)return;desiredRunning=value;transition=transition.catch(()=>{}).then(()=>desiredRunning?context.resume():context.suspend()).catch(()=>report('Tap an engine control to resume sound.'));}
 function unlock(){if(!enable.checked)return;try{if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio is unavailable in this browser');context=new Audio({latencyHint:'interactive'});master=context.createGain();master.gain.value=0;master.connect(context.destination);}unlocked=true;desiredRunning=true;if(context.state!=='running')context.resume().catch(()=>report('Tap an engine control to resume sound.'));}catch(error){enable.checked=false;report(error.message);}}
 function stop(){if(!group)return;for(const engine of group.engines)for(const voice of engine){voice.source.stop();voice.source.disconnect();voice.gain.disconnect();}group=null;}
 async function load(type){
  if(!manifest){const response=await fetch(new URL('manifest.json',assetRoot));if(!response.ok)throw new Error('Audio manifest could not load');manifest=await response.json();}
  const clips=manifest.engines[type].clips;
  if(!buffers.has(type)){const decoded=await Promise.all(clips.map(async clip=>{const r=await fetch(new URL(clip.file,assetRoot));if(!r.ok)throw new Error('Engine recording could not load');return context.decodeAudioData(await r.arrayBuffer());}));buffers.set(type,decoded);}
  return clips;
 }
 function start(key,type,count,clips){stop();master.gain.setValueAtTime(0,context.currentTime);const engines=[];
  for(let i=0;i<count;i++){const voices=clips.map((clip,j)=>{const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffers.get(type)[j];source.loop=true;source.loopStart=clip.loopStart;source.loopEnd=clip.loopEnd;gain.gain.value=0;source.connect(gain);gain.connect(master);source.start(0,i*.137);return {source,gain};});engines.push(voices);}
  group={key,clips,engines};
 }
 function update(now=performance.now()){
  const playing=active();if(!playing||!unlocked){wanted='';stop();running(false);lastUpdate=-Infinity;return;}
  running(true);const type=engineFamily(sim,family.value),count=engineCount(sim),key=type+':'+count;wanted=key;
  if(group?.key!==key){stop();if(!loading){report('Loading engine sound…');loading=load(type).then(clips=>{if(wanted===key&&active())start(key,type,count,clips);}).catch(error=>{enable.checked=false;report(error.message+'; sound disabled.');}).finally(()=>{loading=null;});}return;}
  if(now-lastUpdate<50)return;lastUpdate=now;const t=context.currentTime;
  master.gain.setTargetAtTime(Number(volume.value)/100*(count===2?.25:.4),t,.08);
  group.engines.forEach((engine,i)=>{const power=Math.abs(i===0?sim.state.port:sim.state.stbd),rpm=targetRPM(power,group.clips[0].rpm),mix=loopMix(group.clips,rpm),loudness=engineLoudness(power);engine.forEach((voice,j)=>{voice.source.playbackRate.setTargetAtTime(mix[j].rate,t,.15);voice.gain.gain.setTargetAtTime(mix[j].gain*loudness,t,.12);});});
  report((type==='gas-inboard'?'Gas inboard':type==='diesel-inboard'?'Diesel inboard':'Outboard')+' · '+(count===2?'twin engines':'single engine'));
 }
 enable.addEventListener('change',()=>{if(enable.checked){unlock();report('Sound enabled · starts when you return to the game.');}else{report('Sound off');update();}});
 family.addEventListener('change',()=>{wanted='';stop();report('Engine type selected · starts when you return to the game.');});
 root.addEventListener('pointerdown',unlock,{passive:true});root.addEventListener('keydown',unlock);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){wanted='';stop();running(false);}else update();});
 report('Sound off');return {update};
}
