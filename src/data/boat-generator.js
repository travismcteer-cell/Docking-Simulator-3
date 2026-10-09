const FT=0.3048;
const presets={compact:{name:'Compact 30',aft:15,forward:15,beam:11,depth:4.5,rise:1.2,sheerStart:4,sheerLength:9,rake:2.2,flare:0.24,flareCurve:0.5,stern:0.89},carolina:{name:'Swept 50',aft:22,forward:28,beam:16,depth:6.7,rise:3.3,sheerStart:6,sheerLength:14,rake:5.8,flare:0.48,flareCurve:0.8,stern:0.85}};
function buildHull(p){
 const vertices=[],faces=[],groups=[],rings=[],N=64;
 const aft=p.aft*FT,front=p.forward*FT,B=p.beam*FT/2,D=p.depth*FT;
 const tmid=aft/(aft+front);
 function section(t){
  const u=Math.max(0,(t-tmid)/(1-tmid));
  const aftShape=t<tmid?1-(1-p.stern)*Math.pow(1-t/tmid,2):1;
  const beam=B*aftShape*(1-Math.pow(u,2.05));
  // Sheer transition is measured from the transom, independent of maximum beam.
  // Moving or extending the forebody does not reposition the sheer transition.
  const fromStern=t*(p.aft+p.forward);
  const start=p.sheerStart??4;
  const length=Math.max(.01,p.sheerLength??9);
  const su=Math.max(0,Math.min(1,(fromStern-start)/length));
  const sheerBlend=su*su*su*(10+su*(-15+6*su));
  const sheer=D*.61+p.rise*FT*sheerBlend;
  const keel=-D*.39+D*.57*Math.pow(u,5);
  const cw=beam*(0.94-p.flare*(.18+.82*Math.pow(u,.8)));
  const cy=keel+cw*Math.tan((19+15*u)*Math.PI/180);
  // Independent concavity: endpoints stay fixed while the middle pulls inward.
  // Smoothly fade in from the maximum-beam station; full effect in the bow.
  const bowMix=Math.min(1,u/.7);
  const curvatureFade=bowMix*bowMix*(3-2*bowMix);
  const sidePower=1+3.5*Math.max(0,p.flareCurve??0)*curvatureFade;
  const sx=-aft+t*(aft+front);
  const rake=p.rake*FT*Math.pow(u,4);
  function pt(z,y,h){return [sx-rake*(1-h),y,z];}
  const r=[];
  // Perimeter: keel -> starboard chine -> sheer -> port sheer -> chine -> keel.
  r.push(pt(0,keel,0));
  for(let j=1;j<=5;j++){const v=j/5;r.push(pt(cw*v,keel+(cy-keel)*v,.28*v));}
  for(let j=1;j<=10;j++){const v=j/10;const f=Math.pow(v,sidePower);r.push(pt(cw+(beam-cw)*f,cy+(sheer-cy)*v,.28+.72*v));}
  for(let j=1;j<=12;j++){const q=1-2*j/12;r.push(pt(beam*q,sheer+FT*.12*(1-q*q)*(beam/B),1));}
  for(let j=9;j>=0;j--){const v=j/10;const f=Math.pow(v,sidePower);r.push(pt(-(cw+(beam-cw)*f),cy+(sheer-cy)*v,.28+.72*v));}
  for(let j=4;j>=1;j--){const v=j/5;r.push(pt(-cw*v,keel+(cy-keel)*v,.28*v));}
  return r;
 }
 for(let i=0;i<=N;i++){const r=section(i/N);rings.push(r.map(v=>{vertices.push(v);return vertices.length-1;}));}
 const M=rings[0].length;
 function tri(a,b,c,g){const A=vertices[a],B=vertices[b],C=vertices[c];const ab=B.map((v,i)=>v-A[i]),ac=C.map((v,i)=>v-A[i]);const n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];if(Math.hypot(...n)>1e-10){faces.push([a,b,c]);groups.push(g);}}
 for(let i=0;i<N;i++)for(let j=0;j<M;j++){const k=(j+1)%M;let g=(j>=15&&j<27)?'deck':(j<5||j>=37)?'bottom':'side';tri(rings[i][j],rings[i+1][j],rings[i+1][k],g);tri(rings[i][j],rings[i+1][k],rings[i][k],g);}
 // Transom and stem caps; collinear stem triangles are removed.
 for(const end of [0]){const ring=rings[end],mean=[0,0,0];ring.forEach(i=>vertices[i].forEach((v,k)=>mean[k]+=v/M));const c=vertices.length;vertices.push(mean);for(let j=0;j<M;j++){if(end===0)tri(c,ring[j],ring[(j+1)%M],'transom');else tri(c,ring[(j+1)%M],ring[j],'stem');}}
 const rail=[rings.map(r=>r[15]),rings.map(r=>r[27])];
 const chine=[rings.map(r=>r[5]),rings.map(r=>r[37])];
 // Weld coincident stem vertices so exports have a closed, shared boundary.
 const clean=[],lookup=new Map(),remap=vertices.map(v=>{const key=v.map(x=>Math.round(x*1e8)).join(',');if(!lookup.has(key)){lookup.set(key,clean.length);clean.push(v);}return lookup.get(key);});
 const ff=[],gg=[];faces.forEach((f,i)=>{const r=f.map(j=>remap[j]);if(new Set(r).size===3){ff.push(r);gg.push(groups[i]);}});
 return {vertices:clean,faces:ff,groups:gg,rail:rail.map(r=>r.map(i=>remap[i])),chine:chine.map(r=>r.map(i=>remap[i])),rings:rings.map(r=>r.map(i=>remap[i])),params:{...p}};
}
function obj(mesh){let s='# Sportfishing hull study v4; metres; X forward, Y up, Z starboard\n';s+=mesh.vertices.map(v=>'v '+v.map(x=>x.toFixed(6)).join(' ')).join('\n')+'\n';let prev='';mesh.faces.forEach((f,i)=>{if(mesh.groups[i]!==prev){prev=mesh.groups[i];s+='g '+prev+'\n';}s+='f '+f.map(x=>x+1).join(' ')+'\n';});return s;}

function buildBoat(p){
 const m=buildHull(p),V=m.vertices,F=m.faces,G=m.groups,L=(p.aft+p.forward)*FT;
 const lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
 const cross=(a,b,c)=>{const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);return[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];};
 // Tessellated panels render correctly with the lightweight depth-sorted preview.
 function panel(a,b,c,d,group,normal,steps=5){
  if(cross(a,b,c).reduce((s,v,i)=>s+v*normal[i],0)<0)[b,d]=[d,b];
  const ids=[];for(let i=0;i<=steps;i++){const row=[];for(let j=0;j<=steps;j++){const u=i/steps,v=j/steps;row.push(V.length);V.push(lerp(lerp(a,b,u),lerp(d,c,u),v));}ids.push(row);}
  for(let i=0;i<steps;i++)for(let j=0;j<steps;j++){F.push([ids[i][j],ids[i+1][j],ids[i+1][j+1]],[ids[i][j],ids[i+1][j+1],ids[i][j+1]]);G.push(group,group);}
 }
 function sub(a,b,c,d,u0,u1,v0,v1,group,normal){const point=(u,v)=>lerp(lerp(a,b,u),lerp(d,c,u),v).map((x,i)=>x+normal[i]*(group==='glass'?.025:.012));panel(point(u0,v0),point(u1,v0),point(u1,v1),point(u0,v1),group,normal,4);}
 const back=(p.cabinOffset-p.aft)*FT,front=back+p.cabinLength*FT;
 function deck(x){const t=Math.max(0,Math.min(64,(x+p.aft*FT)/L*64)),i=Math.min(63,Math.floor(t)),f=t-i;return lerp(V[m.rings[i][15]],V[m.rings[i+1][15]],f);}
 // The opening intersects the actual deck; offset and length remain independent.
 const i0=Math.max(1,Math.min(63,Math.round(p.cockpitOffset*FT/L*64))),i1=Math.max(1,Math.min(63,Math.round((p.cockpitOffset+p.cockpit)*FT/L*64)));
 const opening=p.cockpit>0&&p.cockpitWidth>0&&p.cockpitDepth>0&&i1>i0&&(p.cockpitOffset+p.cockpit)>0&&p.cockpitOffset<L/FT;
 const openingRatio=p.cockpitWidth/100;
 // Retain the outer sheer vertices but move the inner deck grid to the chosen width.
 for(let i=0;i<65;i++){const rail=V[m.rings[i][15]],w=rail[2];for(let j=16;j<27;j++){let q;if(j<=17)q=1-(1-openingRatio)*(j-15)/2;else if(j<=25)q=openingRatio*(1-2*(j-17)/8);else q=-openingRatio-(1-openingRatio)*(j-25)/2;const v=V[m.rings[i][j]];v[2]=w*q;v[1]=rail[1]+FT*.12*(1-q*q)*(w/(p.beam*FT/2));}}
 const floorY=Math.min(deck((p.cockpitOffset-p.aft)*FT)[1],deck((p.cockpitOffset+p.cockpit-p.aft)*FT)[1])-p.cockpitDepth*FT;
 function floorPoint(v){
  const i=Math.max(0,Math.min(64,Math.round((v[0]+p.aft*FT)/L*64)));let half=0;
  for(let j=0;j<15;j++){const a=V[m.rings[i][j]],b=V[m.rings[i][j+1]];if(floorY>=Math.min(a[1],b[1])&&floorY<=Math.max(a[1],b[1])&&Math.abs(b[1]-a[1])>1e-9){const z=a[2]+(b[2]-a[2])*(floorY-a[1])/(b[1]-a[1]);half=Math.max(half,z);}}
  const topHalf=deck(v[0])[2]*openingRatio,ratio=openingRatio<=1&&topHalf>1e-8?Math.min(1,half*.94/topHalf):1;
  return[v[0],floorY,v[2]*ratio];
 }
 if(opening){
  const faces=[],groups=[];
  for(let f=0;f<F.length;f++){const face=F[f];let remove=false;if(G[f]==='deck'){const pts=face.map(i=>V[i]),x=pts.reduce((s,v)=>s+v[0],0)/3,z=pts.reduce((s,v)=>s+v[2],0)/3,idx=(x+p.aft*FT)/L*64,w=deck(x)[2];remove=idx>i0&&idx<i1&&Math.abs(z)<w*openingRatio-1e-7;}if(!remove){faces.push(face);groups.push(G[f]);}}
  F.splice(0,F.length,...faces);G.splice(0,G.length,...groups);
  const outline=[];for(let i=i0;i<=i1;i++)outline.push(V[m.rings[i][17]]);for(let j=18;j<=25;j++)outline.push(V[m.rings[i1][j]]);for(let i=i1-1;i>=i0;i--)outline.push(V[m.rings[i][25]]);for(let j=24;j>17;j--)outline.push(V[m.rings[i0][j]]);
  for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],c=floorPoint(b),d=floorPoint(a),mid=lerp(a,b,.5);panel(a,b,c,d,'cockpit-wall',[-mid[0]+(V[m.rings[i1][15]][0]+V[m.rings[i0][15]][0])/2,0,-mid[2]],2);}
  for(let i=i0;i<i1;i++){const a=V[m.rings[i][17]],b=V[m.rings[i+1][17]],c=V[m.rings[i+1][25]],d=V[m.rings[i][25]];panel(floorPoint(a),floorPoint(b),floorPoint(c),floorPoint(d),'cockpit-floor',[0,1,0],2);}
 }
 const onFloor=x=>opening&&x>V[m.rings[i0][15]][0]&&x<V[m.rings[i1][15]][0];
 const width=p.cabinWidth/100,wb=deck(back)[2]*width,wf=deck(front)[2]*width;
 const cabinInWell=onFloor(back)&&onFloor(front);
 const baseB=(cabinInWell?floorY:Math.min(deck(back)[1],deck(front)[1]))+.025,baseF=baseB;
 const roofY=Math.max(baseB,(cabinInWell?floorY:deck(front)[1])+.025)+p.cabinHeight*FT;
 const rake=p.cabinHeight*FT*Math.tan(p.windshieldRake*Math.PI/180);
 const rt=back+.12,ft=front-rake,twb=wb*.94,twf=wf*.9;
 if(p.cabinHeight>0&&p.cabinLength>0&&p.cabinWidth>0){
 for(const sign of [-1,1]){const a=[back,baseB,sign*wb],b=[front,baseF,sign*wf],c=[ft,roofY,sign*twf],d=[rt,roofY,sign*twb];panel(a,b,c,d,'cabin',[0,0,sign],8);sub(a,b,c,d,.07,.48,.46,.88,'glass',[0,0,sign]);sub(a,b,c,d,.53,.93,.46,.88,'glass',[0,0,sign]);}
 const fa=[front,baseF,-wf],fb=[front,baseF,wf],fc=[ft,roofY,twf],fd=[ft,roofY,-twf];panel(fa,fb,fc,fd,'cabin',[1,0,0],8);sub(fa,fb,fc,fd,.06,.48,.4,.89,'glass',[1,0,0]);sub(fa,fb,fc,fd,.52,.94,.4,.89,'glass',[1,0,0]);
 const ba=[back,baseB,wb],bb=[back,baseB,-wb],bc=[rt,roofY,-twb],bd=[rt,roofY,twb];panel(ba,bb,bc,bd,'cabin',[-1,0,0],6);sub(ba,bb,bc,bd,.33,.67,.02,.88,'door',[-1,0,0]);sub(ba,bb,bc,bd,.36,.64,.46,.83,'glass',[-1,0,0]);sub(ba,bb,bc,bd,.06,.29,.5,.84,'glass',[-1,0,0]);sub(ba,bb,bc,bd,.71,.94,.5,.84,'glass',[-1,0,0]);
 }
 // A slim roof slab follows cabin taper and moves with the whole assembly.
 const ov=p.roofOverhang*FT,rx0=rt-ov,rx1=ft+ov,rw0=twb+ov,rw1=twf+ov;
 function slab(x0,x1,y,w0,w1,thick,group){const a=[x0,y,-w0],b=[x1,y,-w1],c=[x1,y,w1],d=[x0,y,w0],up=v=>[v[0],y+thick,v[2]];panel(up(a),up(b),up(c),up(d),group,[0,1,0],8);panel(a,b,up(b),up(a),group,[0,0,-1],5);panel(d,c,up(c),up(d),group,[0,0,1],5);panel(b,c,up(c),up(b),group,[1,0,0],3);panel(d,a,up(a),up(d),group,[-1,0,0],3);panel(a,b,c,d,group,[0,-1,0],4);}
 if(p.cabinHeight>0&&p.cabinLength>0&&p.cabinWidth>0)slab(rx0,rx1,roofY,rw0,rw1,.10,'roof');
 // Independent enclosure: no automatic resizing or connection to cabin length.
 if(p.enclosure&&p.enclosureLength>0&&p.enclosureWidth>0){
  const x0=(p.enclosureOffset-p.aft)*FT,x1=x0+p.enclosureLength*FT;
  const hasRoof=p.enclosureMount==='roof'&&p.cabinHeight>0&&p.cabinLength>0;
  const mountY=x=>(hasRoof?roofY+.11:p.enclosureMount==='floor'&&opening?floorY:deck(x)[1]) + p.enclosureLift*FT;
  const w0=deck(x0)[2]*p.enclosureWidth/100,w1=deck(x1)[2]*p.enclosureWidth/100;
  const h=p.enclosureHeight*FT,y0=mountY(x0),y1=mountY(x1),top=Math.max(y0,y1)+h;
  const topFront=x1-h*Math.tan(p.enclosureRake*Math.PI/180);
  const topBack=x0+(top-y0)*Math.tan((p.enclosureAftRake??0)*Math.PI/180);
  if(hasRoof)slab(x0,x1,y0-.06,w0,w1,.06,'bridge-floor');
  const wall=1-p.glassPercent/100;
  function enclosurePanel(a,b,c,d,normal){
   const aa=lerp(a,d,wall),bb=lerp(b,c,wall);
   if(wall>0){panel(a,b,bb,aa,'bridge',normal,5);panel(a,b,bb,aa,'bridge',normal.map(x=>-x),5);}
   if(wall<1){panel(aa,bb,c,d,'glass',normal,5);panel(aa,bb,c,d,'glass',normal.map(x=>-x),5);}
  }
  // Sample the lower edge along the local sheer while leaving the top controlled separately.
  for(const sign of [-1,1]){for(let j=0;j<12;j++){const u=j/12,v=(j+1)/12,xa=x0+(x1-x0)*u,xb=x0+(x1-x0)*v;
   const a=[xa,mountY(xa),sign*deck(xa)[2]*p.enclosureWidth/100],b=[xb,mountY(xb),sign*deck(xb)[2]*p.enclosureWidth/100];
   const c=[topBack+(topFront-topBack)*v,top,sign*(w0+(w1*.9-w0)*v)],d=[topBack+(topFront-topBack)*u,top,sign*(w0+(w1*.9-w0)*u)];
   enclosurePanel(a,b,c,d,[0,0,sign]);
  }}
  enclosurePanel([x1,y1,-w1],[x1,y1,w1],[topFront,top,w1*.9],[topFront,top,-w1*.9],[1,0,0]);
  // Independent accessory follows the enclosure, not the cabin.
  const ax=x0+(x1-x0)*p.accessoryPosition/100;
  const floorMount=p.accessoryMount==='floor'&&onFloor(ax);
  const ay=floorMount?floorY:deck(ax)[1];
  const mountingHalfWidth=floorMount?Math.abs(floorPoint([ax,floorY,deck(ax)[2]*openingRatio])[2]):deck(ax)[2];
  const aw=mountingHalfWidth*(p.accessoryWidth??100)/100;
  const ah=p.accessoryHeight*FT;
  function bar(a,b,r,group){const dir=b.map((v,i)=>v-a[i]),len=Math.hypot(...dir);if(len<1e-7||r<=0)return;const d=dir.map(v=>v/len),ref=Math.abs(d[1])<.9?[0,1,0]:[1,0,0],u=[d[1]*ref[2]-d[2]*ref[1],d[2]*ref[0]-d[0]*ref[2],d[0]*ref[1]-d[1]*ref[0]],ul=Math.hypot(...u);u.forEach((v,i)=>u[i]=v/ul);const vv=[d[1]*u[2]-d[2]*u[1],d[2]*u[0]-d[0]*u[2],d[0]*u[1]-d[1]*u[0]];
   for(let j=0;j<8;j++){const q=j*Math.PI/4,qq=(j+1)*Math.PI/4,n=u.map((x,i)=>x*Math.cos(q)+vv[i]*Math.sin(q)),nn=u.map((x,i)=>x*Math.cos(qq)+vv[i]*Math.sin(qq)),at=(p,n)=>p.map((x,i)=>x+n[i]*r);panel(at(a,n),at(b,n),at(b,nn),at(a,nn),group,n,1);}
  }
  if(p.accessory==='arch'&&ah>0){const radius=Math.max(.03,p.beam*FT*.012),xt=ax-ah*.18;bar([ax,ay,-aw],[xt,ay+ah,-aw*.88],radius,'arch');bar([ax,ay,aw],[xt,ay+ah,aw*.88],radius,'arch');bar([xt,ay+ah,-aw*.88],[xt,ay+ah,aw*.88],radius*1.4,'arch');}
  if(p.accessory==='mast'&&ah>0){bar([ax,ay,0],[ax-ah*.1,ay+ah,0],.045,'mast');bar([ax-ah*.075,ay+ah*.75,-aw*.45],[ax-ah*.075,ay+ah*.75,aw*.45],.03,'mast');}
 }
 m.fit={cockpitOffset:i0*L/64/FT,cockpitLength:opening?(i1-i0)*L/64/FT:0,cabinLength:p.cabinLength,cabinRearWidth:wb*2/FT,cabinFrontWidth:wf*2/FT};
 return m;
}

export {buildHull,buildBoat};
