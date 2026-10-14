export function engineFamily(sim,override='auto'){
 if(override!=='auto')return override;
 if(sim.boat.propulsion.type==='singleOutboard')return 'outboard';
 return sim.model.id==='Motoryacht-60'?'diesel-inboard':'gas-inboard';
}
export function engineCount(sim){return ['singleOutboard','singleInboardRudder'].includes(sim.boat.propulsion.type)?1:2;}
export function targetRPM(power,idle,working=1200){
 const load=Math.min(1,Math.abs(power||0));
 if(load<=.1)return idle+200*load/.1;
 if(load<=.25)return idle+200+(working-idle-200)*(load-.1)/.15;
 return working+(3000-working)*(load-.25)/.75;
}
export function engineLoudness(power){
 const load=Math.min(1,Math.abs(power||0));
 return .55+.07*Math.min(load/.1,1)+.38*Math.max(0,load-.1)/.9;
}
export function loopMix(clips,rpm){
 const weights=clips.map(()=>0),target=Math.max(clips[0].rpm,Math.min(clips.at(-1).rpm,rpm));
 let low=0;while(low<clips.length-2&&target>clips[low+1].rpm)low++;
 const blend=(target-clips[low].rpm)/(clips[low+1].rpm-clips[low].rpm);
 weights[low]=Math.cos(blend*Math.PI/2);weights[low+1]=Math.sin(blend*Math.PI/2);
 return clips.map((clip,i)=>({gain:weights[i],rate:target/clip.rpm}));
}

export function throttleMix(clips,power){
 const rpm=targetRPM(power,clips[0].rpm);
 const load=Math.min(1,Math.abs(power||0));
 if(load<=.25){const blend=Math.max(0,(load-.1)/.15);return clips.map((clip,i)=>({gain:i===0?Math.cos(blend*Math.PI/2):i===1?Math.sin(blend*Math.PI/2):0,rate:rpm/clip.rpm}));}
 const blend=(load-.25)/.75;
 return clips.map((clip,i)=>({gain:i===1?Math.cos(blend*Math.PI/2):i===2?Math.sin(blend*Math.PI/2):0,rate:rpm/clip.rpm}));
}

// Audio-only response: throttle leads, with speed contributing at most 22% of
// the revs above idle. Coasting in neutral still returns to idle.
export function workboatAudioRPM(previous,power,speedKnots,idle,dt){
 const throttle=targetRPM(power,idle,1800),speed=Math.max(0,Math.min(1,speedKnots/20));
 const target=idle+(throttle-idle)*(.78+.22*speed);
 const tau=target>previous?.9:.35;
 return previous+(target-previous)*(1-Math.exp(-Math.max(0,Math.min(.1,dt))/tau));
}
