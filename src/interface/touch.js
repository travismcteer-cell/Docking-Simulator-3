// Keep independent pointers; never treat a second finger as a pinch in play areas.
export function bindGameTouch(root){const regions='.scene-frame,.helm-panel,.status-bar';let lastTouchButton=null,lastTouchAt=0;const belongs=e=>e.target.closest?.(regions);const block=e=>{if(belongs(e)&&e.cancelable)e.preventDefault();};
 for(const type of ['touchstart','touchmove','gesturestart','gesturechange','gestureend'])root.addEventListener(type,block,{passive:false});
 // Touchstart cancellation suppresses compatibility clicks in Safari. Execute
 // discrete button actions on pointerdown, while engine holds retain their IDs.
 root.addEventListener('pointerdown',e=>{const b=e.target.closest?.('button');if(e.pointerType==='touch'&&b&&belongs(e)&&!b.classList.contains('engine-button')){e.preventDefault();lastTouchButton=b;lastTouchAt=performance.now();b.click();}});
 root.addEventListener('click',e=>{if(e.isTrusted&&e.target.closest?.('button')===lastTouchButton&&performance.now()-lastTouchAt<800){e.preventDefault();e.stopImmediatePropagation();}},true);
}
