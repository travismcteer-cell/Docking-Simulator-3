export function resetCamera(camera,state,scale){camera.x=state.x*scale;camera.y=state.y*scale;camera.heading=state.a*Math.PI/180;camera.lookYaw=0;camera.lookPitch=0;camera.dragging=false;camera.catchup??=8;camera.mode??='medium';}
export function followCamera(camera,state,scale,dt){const delay=camera.mode==='helm'?0:(camera.catchup??8);const blend=delay<=0?1:1-Math.exp(-dt/delay);camera.x+=(state.x*scale-camera.x)*blend;camera.y+=(state.y*scale-camera.y)*blend;const error=Math.atan2(Math.sin(state.a*Math.PI/180-camera.heading),Math.cos(state.a*Math.PI/180-camera.heading));camera.heading+=error*blend;if(!camera.dragging&&camera.mode!=='helm'){const spring=Math.exp(-dt/3);camera.lookYaw*=spring;camera.lookPitch*=spring;}}
export function bindCameraLook(canvas,camera){let pointer=null,x=0,y=0;
 canvas.addEventListener('pointerdown',e=>{if(pointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();pointer=e.pointerId;x=e.clientX;y=e.clientY;camera.dragging=true;canvas.setPointerCapture(pointer);canvas.style.cursor='grabbing';});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();camera.lookYaw=Math.max(-Math.PI,Math.min(Math.PI,camera.lookYaw+(e.clientX-x)*.008*(camera.mode==='helm'?-1:1)));const basePitch=camera.mode==='helm'?0:camera.mode==='far'?Math.atan2(54,135):Math.atan2(24,83),minPitch=camera.mode==='helm'?-45*Math.PI/180:10*Math.PI/180;camera.lookPitch=Math.max(minPitch-basePitch,Math.min(55*Math.PI/180-basePitch,camera.lookPitch+(e.clientY-y)*.006));x=e.clientX;y=e.clientY;});
 const release=e=>{if(e.pointerId!==pointer)return;pointer=null;camera.dragging=false;canvas.style.cursor='grab';};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,release);
 window.addEventListener('blur',()=>{pointer=null;camera.dragging=false;canvas.style.cursor='grab';});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.style.cursor='grab';
}

export function cameraPose(camera,state,scale,helm){const h=camera.mode==='helm'?state.a*Math.PI/180:camera.heading,yaw=camera.lookYaw||0,pitch=camera.lookPitch||0;
 if(camera.mode==='helm'){const forward=helm?.forward??.05/.3048,side=helm?.side??.65/.3048,height=helm?.height??1.9086576/.3048;const x=state.x*scale+forward*Math.cos(h)-side*Math.sin(h),z=state.y*scale+forward*Math.sin(h)+side*Math.cos(h);return {eye:[x,height,z],target:[x+40*Math.cos(h+yaw),height+40*Math.tan(pitch),z+40*Math.sin(h+yaw)]};}
 const far=camera.mode==='far',distance=far?135:83,height=far?54:24,ahead=far?20:18,tx=camera.x+ahead*Math.cos(h),tz=camera.y+ahead*Math.sin(h);return {eye:[tx-distance*Math.cos(h+yaw),1+distance*Math.tan(Math.atan2(height,distance)+pitch),tz-distance*Math.sin(h+yaw)],target:[tx,1,tz]};
}

