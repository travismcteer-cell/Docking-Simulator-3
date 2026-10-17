import {failureText} from '../simulation/faults.js?v=progression-52';
const directions=['N','NE','E','SE','S','SW','W','NW'];
const bearing=degrees=>directions[Math.round((((degrees??0)%360)+360)%360/45)%8];
export function challengeDescription(level){
 const parts=[level.type==='departure'?'Departure':'Arrival',level.target.label,
  'Wind '+(level.wind||0)+' kt'+(level.wind?' '+bearing(level.windDirection??90):''),
  'Current '+(level.current||0)+' kt'+(level.current?' '+bearing(level.currentDirection??180):'')];
 const failures=failureText(level.failures);if(failures)parts.push(failures);
 if(level.requireAnchor||level.startAnchor)parts.push(level.startAnchor?'Retrieve anchor':'Anchor required');
 if(level.requireFenders)parts.push('Fenders required on both sides');
 if(level.trafficScenario==='fuel-two-pass')parts.push('Two southbound boats: wait for the first, then leave in the gap');
 if(level.trafficScenario==='west-departure')parts.push('Slow boat departing the target wharf');
 return parts.join(' · ');
}
