// Classify layout independently from the mobile graphics-quality profile.
export function isPhoneLayout(coarse,width,height){return coarse&&Math.min(width,height)<=600;}
export function bindPhoneLayout(root){
 const phone=isPhoneLayout(matchMedia('(pointer: coarse)').matches,screen.width||innerWidth,screen.height||innerHeight);
 root.classList.toggle('phone-ui',phone);
 const prompt=root.querySelector('#phone-rotate'),grip=root.querySelector('#scroll-grip');
 prompt.addEventListener('cancel',e=>e.preventDefault());
 if(!phone)return;
 root.querySelector('.right-controls').append(grip);
 grip.textContent='↕ Swipe to scroll';grip.setAttribute('aria-label','Swipe vertically here to scroll the page');
 const landscape=matchMedia('(orientation: landscape)');
 function update(){
  if(landscape.matches&&!prompt.open)prompt.showModal();
  else if(!landscape.matches&&prompt.open)prompt.close();
 }
 landscape.addEventListener('change',update);window.addEventListener('resize',update);update();
}
