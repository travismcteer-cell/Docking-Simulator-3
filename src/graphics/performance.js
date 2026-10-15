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

export const GRAPHICS_OPTIONS={fps:['default','24','30','60'],resolution:['default','1','1.25','1.75'],distance:['full','medium','short'],water:['detailed','simple'],boats:['normal','reduced'],ui:['frame','10'],shadows:['off','basic','soft']};
export function graphicsDefaults(profile){return {fps:'default',resolution:'default',distance:'full',water:'detailed',boats:'normal',ui:'frame',shadows:profile.mobile?'off':'soft'};}
export function validateGraphicsSettings(value,profile){const settings=graphicsDefaults(profile);for(const key of Object.keys(settings))if(GRAPHICS_OPTIONS[key].includes(value?.[key]))settings[key]=value[key];return settings;}
export function resolveGraphicsSettings(settings,profile){
 const range={full:{far:2200,fogNear:300,fogFar:1200},medium:{far:750,fogNear:350,fogFar:700},short:{far:500,fogNear:220,fogFar:450}}[settings.distance];
 return {...range,fps:settings.fps==='default'?profile.fps:Number(settings.fps),pixelRatio:settings.resolution==='default'?profile.pixelRatio:Number(settings.resolution),simpleWater:settings.water==='simple',boatDetailDistance:settings.boats==='reduced'?100:220,uiInterval:settings.ui==='10'?100:0};
}
