// Contact feedback runs in Practice and Levels; resting contact is one event.
import {classifyImpact,IMPACT_PENALTIES} from './levels.js?v=contacts-24';
export function stepContacts(sim,dt,now=performance.now()){
 if(!sim.contactFeedback||sim.contactFeedback.revision!==sim.trafficRevision)sim.contactFeedback={revision:sim.trafficRevision,clock:0,lastSeen:new Map(),notice:null,sequence:0};
 const feedback=sim.contactFeedback;feedback.clock+=dt;const impact=sim.collision;if(!impact)return;
 const key=impact.kind+':'+impact.id,last=feedback.lastSeen.get(key);feedback.lastSeen.set(key,feedback.clock);if(last!==undefined&&feedback.clock-last<=.7)return;
 const severity=classifyImpact(impact.knots),boat=impact.kind==='boat';const label=severity==='gentle'?'Gentle '+(boat?'boat contact':'contact'):severity==='firm'?'Firm '+(boat?'boat contact':'contact'):severity==='hard'?'HARD '+(boat?'BOAT':'DOCK')+' IMPACT':'CRASH — HEAVY IMPACT';
 feedback.notice={...impact,severity,label,seconds:IMPACT_PENALTIES[severity],sequence:++feedback.sequence,expiresAt:now+(severity==='gentle'?850:1500)};
}
export function contactNotice(sim,now=performance.now()){const notice=sim.contactFeedback?.notice;return notice&&now<notice.expiresAt?notice:null;}
