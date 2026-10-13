export function engineFamily(sim,override='auto'){
 if(override!=='auto')return override;
 if(sim.boat.propulsion.type==='singleOutboard')return 'outboard';
 return sim.model.id==='Motoryacht-60'?'diesel-inboard':'gas-inboard';
}
export function engineCount(sim){return ['singleOutboard','singleInboardRudder'].includes(sim.boat.propulsion.type)?1:2;}
export function targetRPM(power,idle){return idle+(3000-idle)*Math.sqrt(Math.min(1,Math.abs(power||0)));}
export function loopMix(clips,rpm){
 const weights=clips.map(()=>0),target=Math.max(clips[0].rpm,Math.min(clips.at(-1).rpm,rpm));
 let low=0;while(low<clips.length-2&&target>clips[low+1].rpm)low++;
 const blend=(target-clips[low].rpm)/(clips[low+1].rpm-clips[low].rpm);
 weights[low]=Math.cos(blend*Math.PI/2);weights[low+1]=Math.sin(blend*Math.PI/2);
 return clips.map((clip,i)=>({gain:weights[i],rate:target/clip.rpm}));
}
