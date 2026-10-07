export const DOCKS=[{x:-22,y:-20,w:44,h:5},{x:-22,y:-15,w:4,h:43},{x:18,y:-15,w:4,h:43}];
export const DOCK_CLEATS=[...[-12,-6,0,6,12,18,24].flatMap(y=>[{x:-18,y},{x:18,y}]),...[-12,-6,0,6,12].map(x=>({x,y:-15}))];
export const SPAWNS={approach:{x:0,y:49,a:-90},port:{x:-12.6,y:5,a:-90},stbd:{x:12.6,y:5,a:-90}};
