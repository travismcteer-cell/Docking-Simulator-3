export function effectivePower(sim,key){return sim.failures?.[key]?0:(sim.state[key]||0);}
export function failureText(failures={}){return [['port','Port engine unavailable'],['stbd','Starboard engine unavailable'],['bowThruster','Bow thruster unavailable']].filter(([key])=>failures[key]).map(([,text])=>text).join(' · ');}
