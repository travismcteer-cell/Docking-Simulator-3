export function mobileGraphicsProfile(nav,matchMedia){
 const mobile=nav.userAgentData?.mobile===true||/Android|iPhone|iPad|iPod/i.test(nav.userAgent)|| (nav.maxTouchPoints>1&&matchMedia('(pointer: coarse)').matches);
 return {mobile,fps:mobile?30:0,pixelRatio:mobile?1.25:1.75};
}

// Gate only visual work; fixed-step simulation continues on every RAF callback.
export function createRenderGate(fps){
 const interval=fps?1000/fps:0;
 let deadline=null,last=null;
 return (now,visible=true)=>{
  if(!visible){deadline=last=null;return null;}
  if(deadline!==null&&now+.01<deadline)return null;
  const dt=last===null?0:Math.min((now-last)/1000,.1);
  last=now;
  deadline=interval?(deadline===null?now+interval:deadline+(Math.floor((now-deadline+.01)/interval)+1)*interval):now;
  return dt;
 };
}
