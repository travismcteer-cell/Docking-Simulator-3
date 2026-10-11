export function densifyDockCleats(docks,polygons,cleats){
 const existing=new Set(cleats.map(p=>p.x.toFixed(2)+':'+p.y.toFixed(2)));
 const add=(a,b,id)=>{const count=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/5.5);for(let i=0;i<count;i++){const t=(i+.5)/count,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,key=x.toFixed(2)+':'+y.toFixed(2);if(existing.has(key))continue;existing.add(key);cleats.push({id:'dense-'+id+'-'+i,x,y});}};
 for(const d of docks){if(d.id.startsWith('race-')||['dock137','dock138','dock139'].includes(d.id))continue;const ps=[{x:d.x,y:d.y},{x:d.x+d.w,y:d.y},{x:d.x+d.w,y:d.y+d.h},{x:d.x,y:d.y+d.h}];for(let i=0;i<4;i++){if(d.id==='dock136'&&i===2)continue;add(ps[i],ps[(i+1)%4],d.id+'-'+i);}}
 for(const p of polygons){if(p.kind==='piling'||p.id.startsWith('race-'))continue;for(let i=0;i<p.points.length;i++)add(p.points[i],p.points[(i+1)%p.points.length],p.id+'-'+i);}
}
