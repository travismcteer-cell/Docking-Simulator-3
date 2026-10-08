export function resetCamera(camera,state,scale){camera.x=state.x*scale;camera.y=state.y*scale;camera.heading=state.a*Math.PI/180;camera.lookYaw=0;camera.lookPitch=0;camera.dragging=false;}
export function followCamera(camera,state,scale,dt){const blend=1-Math.exp(-dt/8);camera.x+=(state.x*scale-camera.x)*blend;camera.y+=(state.y*scale-camera.y)*blend;const error=Math.atan2(Math.sin(state.a*Math.PI/180-camera.heading),Math.cos(state.a*Math.PI/180-camera.heading));camera.heading+=error*blend;if(!camera.dragging){const spring=Math.exp(-dt/3);camera.lookYaw*=spring;camera.lookPitch*=spring;}}
export function bindCameraLook(canvas,camera){let pointer=null,x=0,y=0;const basePitch=Math.atan2(24,83);
 canvas.addEventListener('pointerdown',e=>{if(pointer!==null||(e.pointerType==='mouse'&&e.button!==0))return;e.preventDefault();pointer=e.pointerId;x=e.clientX;y=e.clientY;camera.dragging=true;canvas.setPointerCapture(pointer);canvas.style.cursor='grabbing';});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer)return;e.preventDefault();camera.lookYaw=Math.max(-Math.PI,Math.min(Math.PI,camera.lookYaw-(e.clientX-x)*.008));camera.lookPitch=Math.max(10*Math.PI/180-basePitch,Math.min(55*Math.PI/180-basePitch,camera.lookPitch+(e.clientY-y)*.006));x=e.clientX;y=e.clientY;});
 const release=e=>{if(e.pointerId!==pointer)return;pointer=null;camera.dragging=false;canvas.style.cursor='grab';};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,release);
 window.addEventListener('blur',()=>{pointer=null;camera.dragging=false;canvas.style.cursor='grab';});
 canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.style.cursor='grab';
}
