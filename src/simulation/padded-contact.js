export function paddedWallContact(sim,x,y,nx,ny){return (sim.racePadding||[]).some(p=>nx*p.nx+ny*p.ny>.9&&Math.abs((x-p.x)*p.nx+(y-p.y)*p.ny)<2&&Math.abs(-(x-p.x)*p.ny+(y-p.y)*p.nx)<=p.halfWidth);}
