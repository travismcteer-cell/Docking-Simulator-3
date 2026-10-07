import {BOAT,SCALE,OUTLINE} from '../data/boats.js';
import {DOCKS,DOCK_CLEATS,SPAWNS} from '../data/marina.js';
export function createSimulation(){const sim={boat:BOAT,scale:SCALE,outline:OUTLINE,docks:DOCKS,dockCleats:DOCK_CLEATS,environment:{wind:0,current:0,windDirection:90,currentDirection:180},state:{},lines:{},fenders:{port:false,stbd:false,contactPort:0,contactStbd:0},contact:false};resetSimulation(sim);return sim;}
export function resetSimulation(sim,name='approach'){const p=SPAWNS[name]||SPAWNS.approach;Object.assign(sim.state,{x:p.x/sim.scale,y:p.y/sim.scale,a:p.a,vx:0,vy:0,omega:0,port:0,stbd:0,steer:0});sim.lines={};Object.assign(sim.fenders,{port:false,stbd:false,contactPort:0,contactStbd:0});sim.contact=false;}
