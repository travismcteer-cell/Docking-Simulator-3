export function engineFamily(sim,override='auto'){
 if(override!=='auto')return override;
 if(sim.boat.propulsion.type==='singleOutboard')return 'outboard';
 return sim.model.id==='Motoryacht-60'?'diesel-inboard':'gas-inboard';
}
export function engineCount(sim){return ['singleOutboard','singleInboardRudder'].includes(sim.boat.propulsion.type)?1:2;}
export function targetRPM(power,idle){
 const load=Math.min(1,Math.abs(power||0));
 if(load<=.1)return idle+200*load/.1;
 if(load<=.25)return idle+200+(1800-idle-200)*(load-.1)/.15;
 return 1800+(3000-1800)*(load-.25)/.75;
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
 return loopMix(clips,rpm);
}
