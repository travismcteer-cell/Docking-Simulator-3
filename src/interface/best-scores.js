import {SCORE_VERSION} from '../simulation/scoring.js?v=traffic-padding-60';
const KEY='docking-trainer-best-scores-v1';
export function scoreKey(definition){return `${definition.type==='race'?'race':'challenge'}:${definition.id}:r${definition.revision??1}:s${definition.type==='race'?0:SCORE_VERSION}`;}
function valid(record,race){return record&&Number.isFinite(record.total)&&Number.isFinite(record.elapsed)&&record.elapsed>=0&&record.total>=0&&(race||record.total<=100);}
export function createBestScores(storage){
 let records={};try{const data=JSON.parse(storage?.getItem(KEY)||'{}');if(data&&typeof data==='object'&&!Array.isArray(data))records=data;}catch{}
 let persistent=!!storage;
 return {get(definition){const record=records[scoreKey(definition)];return valid(record,definition.type==='race')?record:null;},save(run){
  if(!run.complete)return {saved:false,persistent};const race=run.definition.type==='race',key=scoreKey(run.definition),candidate={total:race?run.total:run.result?.total,elapsed:run.elapsed,scoreVersion:race?0:SCORE_VERSION,challengeRevision:run.definition.revision??1,breakdown:race?null:{safety:run.result?.safety,finalControl:run.result?.finalControl,efficiency:run.result?.efficiency},date:new Date().toISOString()};
  if(!valid(candidate,race))return {saved:false,persistent};const old=records[key],better=!valid(old,race)||(race?candidate.total<old.total:candidate.total>old.total)||(candidate.total===old.total&&candidate.elapsed<old.elapsed);
  if(!better)return {saved:false,persistent,best:old};records[key]=candidate;try{if(!storage)throw Error('Unavailable');storage.setItem(KEY,JSON.stringify(records));}catch{persistent=false;}return {saved:true,persistent,best:candidate};
 }};
}
