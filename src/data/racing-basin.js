// Racing geometry uses the same feet/map coordinates as the connected marina.
// Three 25 ft clear berths plus four shared 6 ft fingers occupy 99 ft of wall.
export function buildRacingBasin({DOCKS,DOCK_POLYGONS,DOCK_CLEATS,SOLIDS,FENDER_SHAPES,SPAWNS}){
 const west=DOCKS.find(d=>d.id==='dock137'),north=DOCKS.find(d=>d.id==='dock136'),south=DOCKS.find(d=>d.id==='dock138'),east=DOCKS.find(d=>d.id==='dock139');
 const x=west.x+west.w,y=north.y+north.h,width=380,depth=south.y-y,right=x+width,bottom=south.y,wallWidth=east.w;
 const removed=DOCKS.filter(d=>['dock138','dock139','dock140'].includes(d.id)).map(d=>({...d}));
 for(const array of [DOCKS,SOLIDS,FENDER_SHAPES])for(let i=array.length-1;i>=0;i--)if(removed.some(d=>d.id===array[i].id))array.splice(i,1);
 for(let i=DOCK_CLEATS.length-1;i>=0;i--){const p=DOCK_CLEATS[i];if(removed.some(d=>p.x>=d.x-.001&&p.x<=d.x+d.w+.001&&p.y>=d.y-.001&&p.y<=d.y+d.h+.001))DOCK_CLEATS.splice(i,1);}
 function dock(d,cleats=true){DOCKS.push(d);SOLIDS.push({...d});FENDER_SHAPES.push({...d});if(cleats){const corners=[[d.x,d.y],[d.x+d.w,d.y],[d.x+d.w,d.y+d.h],[d.x,d.y+d.h]];corners.forEach((a,i)=>{const b=corners[(i+1)%4],count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/18));for(let j=0;j<count;j++){const t=(j+.5)/count;DOCK_CLEATS.push({id:d.id+'-cleat-'+i+'-'+j,x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t});}});}}
 dock({...south,w:width+wallWidth});dock({...east,x:right,h:depth});
 dock({id:'race-east-cap',x:right-16,y:y-24,w:32,h:24});
 const spectator={id:'race-spectator',x:x+115,y:bottom-60,w:150,h:60,surface:'concrete'};dock(spectator);
 const berths=[],pilings=[];
 function group(id,wallX,wallY,angle){const a=angle*Math.PI/180,fx=Math.cos(a),fy=Math.sin(a),tx=-fy,ty=fx;
  const point=(across,into)=>({x:wallX+tx*across+fx*into,y:wallY+ty*across+fy*into});
  for(let i=0;i<4;i++){const across=i*31,center=point(across,7.5);dock({id:id+'-finger-'+i,x:center.x-(Math.abs(fx)*15+Math.abs(tx)*6)/2,y:center.y-(Math.abs(fy)*15+Math.abs(ty)*6)/2,w:Math.abs(fx)*15+Math.abs(tx)*6,h:Math.abs(fy)*15+Math.abs(ty)*6},false);
   for(const [end,into]of [['wall',0],['mouth',40]]){const p=point(across,into),piling={id:id+'-piling-'+i+'-'+end,kind:'piling',racePiling:true,height:5.35,x:p.x,y:p.y};const points=Array.from({length:12},(_,j)=>({x:p.x+.75*Math.cos(j*Math.PI/6),y:p.y+.75*Math.sin(j*Math.PI/6)}));DOCK_POLYGONS.push({id:piling.id,kind:'piling',points});const solid={id:piling.id,kind:'piling',x:p.x-.75,y:p.y-.75,w:1.5,h:1.5,points};SOLIDS.push(solid);FENDER_SHAPES.push(solid);DOCK_CLEATS.push(piling);pilings.push(piling);}}
  for(let i=0;i<3;i++){const p=point(i*31+15.5,20);berths.push({id:id+'-'+(i+1),x:p.x,y:p.y,a:angle,width:25,depth:40,pilingIds:[id+'-piling-'+i+'-wall',id+'-piling-'+i+'-mouth',id+'-piling-'+(i+1)+'-wall',id+'-piling-'+(i+1)+'-mouth']});}
 }
 group('race-south-west',x+19,bottom,270);group('race-south-east',right-112,bottom,270);
 group('race-west',x,y+19,0);group('race-east',right,y+112,180);
 SPAWNS.racing={x:x+width/2,y:y+100,a:0,label:'R · Workboat racing basin'};
 return {basin:{x,y,w:width,h:depth,openRunFt:width-80,spectator,pilings},berths};
}
