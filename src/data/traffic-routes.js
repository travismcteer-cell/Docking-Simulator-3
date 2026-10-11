import {DOCKS,BOUNDS,RACING_BERTHS} from './marina.js?v=races-40';
// Permanent reservations: never parked NPC berths or challenge targets.
export const TRAFFIC_BERTH_IDS=new Set(['B-269-7','B-327-7','A-138-7-L','A-138-6-L','D-med-1','D-med-2','E-north-6','race-west-1']);
const fuel=DOCKS.find(d=>d.id==='dock135');
export const GAS_TRAFFIC_BERTHS=[
 {id:'traffic-gas-southeast',x:fuel.x+fuel.w-29.5,y:fuel.y+fuel.h+7,a:180},
 {id:'traffic-gas-north',x:fuel.x+151.5,y:fuel.y-8,a:0},
 {id:'traffic-gas-west-upper',x:fuel.x-8,y:fuel.y+31.5,a:90},
 {id:'traffic-gas-west-lower',x:fuel.x-8,y:fuel.y+86.5,a:270},
 {id:'traffic-gas-southwest',x:fuel.x+41.5,y:fuel.y+fuel.h+7,a:0}
];
export const TRAFFIC_ENTRANCE={x:BOUNDS.maxX-70,y:BOUNDS.maxY-55};
export const TRAFFIC_EXIT={x:BOUNDS.minX+50,y:BOUNDS.maxY-55};
const point=(x,y,heading)=>({x,y,...(heading===undefined?{}:{heading})});
export function buildTrafficRoutes(slots){
 const berth=id=>{const s=slots.find(b=>b.id===id);if(!s)throw new Error('Missing traffic berth '+id);return {...s,a:s.heading};};
 const crossOut=berth('B-269-7'),crossIn=berth('B-327-7'),fingerOut=berth('A-138-7-L'),fingerIn=berth('A-138-6-L'),medGas=berth('D-med-1'),medExit=berth('D-med-2'),north=berth('E-north-6'),race=RACING_BERTHS.find(b=>b.id==='race-west-1');
 const p=b=>point(b.x,b.y,b.a);
 const outbound=[point(510,340),point(510,440),point(510,565),point(200,TRAFFIC_EXIT.y),p(TRAFFIC_EXIT)];
 const inbound=[p(TRAFFIC_ENTRANCE),point(535,565),point(535,440),point(535,340),point(490,145)];
 const gas=GAS_TRAFFIC_BERTHS;
 const make=(id,name,start,end,points,boatKey='bowrider21')=>({id,name,start,end,points,boatKey,speedKt:2.4,dwellSeconds:30});
 const routes=[
 make('cross-gas','Cross slips → gas dock',crossOut,gas[0],[p(crossOut),point(295,crossOut.y,180),point(295,100),point(300,60),p(gas[0])]),
 make('fuel-exit','Fuel pier → entrance',gas[1],null,[p(gas[1]),point(290,gas[1].y,0),point(290,145),...outbound]),
 make('finger-exit','Finger slips → entrance',fingerOut,null,[p(fingerOut),point(fingerOut.x,-65,90),point(-100,-65),point(0,0),point(0,80),point(300,145),...outbound]),
 make('med-gas','Med quay → gas dock',medGas,gas[2],[p(medGas),point(0,300,285),point(0,130),point(0,0),point(30,-140),point(gas[2].x,-140,90),p(gas[2])]),
 make('med-exit','Med quay → entrance',medExit,null,[p(medExit),point(30,305,285),point(250,300),...outbound]),
 make('entrance-cross','Entrance → cross slips',null,crossIn,[...inbound,point(465,145),point(465,crossIn.y),p(crossIn)]),
 make('entrance-finger','Entrance → finger slips',null,fingerIn,[...inbound,point(300,145),point(0,80),point(0,0),point(-100,-65),point(fingerIn.x,-65),point(fingerIn.x,fingerIn.y,270)]),
 make('entrance-north','Entrance → north-wall large slip',null,north,[...inbound,point(300,145),point(0,80),point(0,0),point(north.x,0),point(north.x,north.y,90)],'inboard30'),
 make('entrance-gas','Entrance → gas dock',null,gas[3],[...inbound,point(300,145),point(0,60),point(gas[3].x,60,270),p(gas[3])]),
 make('race-gas','Racing basin → gas dock',race,gas[4],[p(race),point(-440,race.y,0),point(-440,290),point(-200,290),point(-200,120),point(-150,50),point(0,60),point(70,60),p(gas[4])])
 ];
 // After a short visit, leave the destination and head out through the entrance.
 // Preserve the docking heading while backing clear of each berth.
 const departures={
  'cross-gas':[p(gas[0]),point(300,60,180),point(300,145),...outbound],
  'med-gas':[p(gas[2]),point(gas[2].x,-140,90),point(30,-140,90),point(0,0),point(0,80),point(300,145),...outbound],
  'entrance-cross':[point(crossIn.x,crossIn.y,0),point(465,crossIn.y,0),point(465,145),...outbound],
  'entrance-finger':[point(fingerIn.x,fingerIn.y,270),point(fingerIn.x,-65,270),point(-100,-65),point(0,0),point(0,80),point(300,145),...outbound],
  'entrance-north':[point(north.x,north.y,90),point(north.x,0,90),point(0,0),point(0,80),point(300,145),...outbound],
  'entrance-gas':[p(gas[3]),point(gas[3].x,60,270),point(0,60),point(0,80),point(300,145),...outbound],
  'race-gas':[p(gas[4]),point(70,60,0),point(0,60),point(0,80),point(300,145),...outbound]
 };
 for(const r of routes)r.departurePoints=departures[r.id]||null;
 return routes;
}
// A small envelope reserves each actual stop, without reserving whole marina sections.
export function trafficBerthEnvelope(b,length=32,beam=14){const a=(b.a??b.heading)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [[-length/2,-beam/2],[length/2,-beam/2],[length/2,beam/2],[-length/2,beam/2]].map(([u,v])=>({x:b.x+u*c-v*s,y:b.y+u*s+v*c}));}
