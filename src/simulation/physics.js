import {integrate} from './collisions.js?v=fleet-14';
import {applyLines} from './lines.js?v=fleet-14';
import {applyFenders} from './fenders.js?v=fleet-14';
  export function stepPhysics(sim,dt){


    const {state,environment}=sim;
    const activeBoat=()=>sim.boat;
    const bowThrusterInput=state.bowThruster||0;
    const ang=state.a*Math.PI/180;
    const steerRad=state.steer*Math.PI/180;

    // Boat-fixed unit vectors in world coordinates.
    const fwdx=Math.cos(ang), fwdy=Math.sin(ang);
    const rightx=-Math.sin(ang), righty=Math.cos(ang);

    const boat=activeBoat();
    const propulsion=boat.propulsion;

    // Sterndrives vector the entire propeller thrust with steering. Fixed
    // inboards do not: their propellers always push along the keel and the
    // rudders create a separate lateral force behind the props.
    function sterndriveThrustDirection(setting){
      const reverseSteerGain = propulsion.reverseSteerGain ?? 1;
      const effectiveSteer = setting < 0
        ? Math.max(-50, Math.min(50, state.steer * reverseSteerGain)) * Math.PI/180
        : steerRad;
      return {
        x: fwdx*Math.cos(effectiveSteer)-rightx*Math.sin(effectiveSteer),
        y: fwdy*Math.cos(effectiveSteer)-righty*Math.sin(effectiveSteer)
      };
    }

    // Arbitrary simulator units, tuned for low-speed docking.
    const thrust=propulsion.thrust;

    // Longitudinal locations are fractions of boat length relative to midships.
    // -0.50 = transom, +0.50 = bow.
    const DRIVE_X=propulsion.driveX;
    const WATER_COR_X=boat.hydrodynamics.waterCenterX;
    const AIR_COE_X=boat.hydrodynamics.airCenterX;
    const ENGINE_Y=propulsion.engineY;

    // Converts our normalized force/lever units into visible yaw acceleration.
    const yawScale=1850;

    function addForce(Fx,Fy,xBody=0,yBody=0){
      state.vx += Fx*dt;
      state.vy += Fy*dt;

      // Convert the body-fixed application point to world coordinates.
      const rx=xBody*fwdx+yBody*rightx;
      const ry=xBody*fwdy+yBody*righty;

      // 2-D moment r x F. state.omega is in degrees/sec.
      state.omega += (rx*Fy-ry*Fx)*yawScale*dt;
    }

    function engineForce(setting,side){
      if(!setting) return;

      const T=thrust*setting*(setting<0 ? propulsion.reverseEfficiency : 1);

      if(propulsion.type==='twinInboardRudder'){
        // Ahead prop wash is redirected by the rudder. Astern thrust follows
        // the fixed shaft and is not steered by the rudder.
        if(setting>0){
          const effectiveRudder=steerRad*(propulsion.aheadRudderDeflectionGain??1.8);
          const forward=T*Math.cos(effectiveRudder);
          const lateral=-T*Math.sin(effectiveRudder);
          addForce(fwdx*forward+rightx*lateral,fwdy*forward+righty*lateral,
            propulsion.rudderX,side*ENGINE_Y);
        }else{
          addForce(fwdx*T,fwdy*T,DRIVE_X,side*ENGINE_Y);
        }
        // Counter-rotating shaft walk reinforces differential engine torque.
        const walkGain=setting<0?propulsion.propWalkYawGainReverse:propulsion.propWalkYawGainAhead;
        state.omega-=side*setting*walkGain*dt;
        return;
      }

      // Bravo 3 sterndrive baseline: thrust itself follows the drive angle.
      const dir=sterndriveThrustDirection(setting);
      const Fx=dir.x*T;
      const Fy=dir.y*T;
      addForce(Fx,Fy,DRIVE_X,side*ENGINE_Y);

      // Extra low-speed pivot authority calibrated for the sterndrive cruiser.
      const lateralThrust = Fx*rightx + Fy*righty;
      const steeringAmount = Math.min(1,Math.abs(state.steer)/propulsion.maxSteerDeg);
      const STEERING_YAW_GAIN = propulsion.steeringYawGain;
      const extraLever = (WATER_COR_X - DRIVE_X) * STEERING_YAW_GAIN * steeringAmount;
      state.omega += (-extraLever * lateralThrust) * yawScale * dt;
    }

    const singleEngine=propulsion.type==='singleSterndrive'||propulsion.type==='singleOutboard';
    if(singleEngine){
      engineForce(state.port,0);
    } else {
      engineForce(state.port,-1);
      engineForce(state.stbd,1);
    }

    // Bow thruster: pure transverse thrust applied near the bow. Positive input
    // pushes the bow to starboard; negative input pushes it to port.
    if(propulsion.bowThruster && bowThrusterInput){
      const bt=propulsion.bowThruster;
      const lateral=bt.force*bowThrusterInput;
      addForce(rightx*lateral,righty*lateral,bt.xBody??0.42,0);
    }

    // Resolve boat velocity into fore/aft and lateral components.
    const vf=state.vx*fwdx+state.vy*fwdy;
    const vl=state.vx*rightx+state.vy*righty;

    // Hydrodynamic steering while the boat is moving through the water, even
    // with both engines in neutral. This is separate from prop-wash steering:
    // as speed falls toward zero, this effect naturally disappears.
    if(Math.abs(vf)>.002 && Math.abs(state.steer)>.05){
      const steerSin=Math.sin(steerRad);

      if(propulsion.type==='twinInboardRudder'){
        // Rudders remain quite effective while coasting ahead and retain a
        // meaningful, though reduced, effect while moving astern.
        const directionGain=vf>=0 ? 1 : (propulsion.reverseFlowRudderGain ?? 0.45);
        const flowLateral=-Math.abs(vf)*vf*steerSin*propulsion.flowRudderGain*directionGain;
        addForce(rightx*flowLateral,righty*flowLateral,propulsion.rudderX,0);
      } else if(propulsion.type==='twinSterndrive' || propulsion.type==='singleSterndrive' || propulsion.type==='singleOutboard'){
        // Turned sterndrive gearcases/lower units also act like small foils
        // while coasting, but with less authority than dedicated rudders.
        const directionGain=vf>=0 ? 1 : (propulsion.reverseFlowSteerGain ?? 0.7);
        const flowLateral=-Math.abs(vf)*vf*steerSin*(propulsion.flowSteerGain ?? 0.18)*directionGain;
        addForce(rightx*flowLateral,righty*flowLateral,propulsion.driveX,0);
      }
    }

    // Hydrodynamic resistance acts primarily around an aft centre of resistance.
    // Use a small linear term plus quadratic drag. This lets a heavy cruiser
    // carry momentum at low speed without allowing unlimited acceleration.
    const forwardLinearDrag=activeBoat().hydrodynamics.forwardLinearDrag;
    const forwardQuadraticDrag=activeBoat().hydrodynamics.forwardQuadraticDrag;
    const lateralLinearDrag=activeBoat().hydrodynamics.lateralLinearDrag;
    const lateralQuadraticDrag=activeBoat().hydrodynamics.lateralQuadraticDrag;

    // Dock mode: add rapidly rising wave-making resistance as the boat approaches
    // displacement hull speed. It is based on water-relative forward speed, so
    // currents do not change the hull's speed through the water. The extra drag
    // still stays near-zero at ordinary docking speed, but now builds earlier and
    // harder so the sim behaves more like a real boat in dock mode.
    function forwardHullResistance(v){
      let resistance=forwardLinearDrag*v + forwardQuadraticDrag*v*Math.abs(v);
      if(v<=0) return resistance;
      const hullSpeedKt=1.34*Math.sqrt(boat.dimensions.lengthFt*0.90);
      const ratio=(v*110)/hullSpeedKt;
      if(ratio<=0.60) return resistance;
      const engines=singleEngine ? 1 : 2;
      const dockModeMaxThrust=propulsion.thrust*0.25*engines;
      const t=Math.min(1,(ratio-0.60)/0.25);
      const smooth=t*t*(3-2*t);
      let wave=dockModeMaxThrust*1.05*smooth*smooth;
      if(ratio>0.90) {
        const over=ratio-0.90;
        wave+=dockModeMaxThrust*(2.8*over+8.5*over*over);
      }
      return resistance+wave;
    }

    const forwardResistance=forwardHullResistance(vf);
    const lateralResistance =
      lateralLinearDrag*vl + lateralQuadraticDrag*vl*Math.abs(vl);

    const waterDragX=-(forwardResistance*fwdx + lateralResistance*rightx);
    const waterDragY=-(forwardResistance*fwdy + lateralResistance*righty);
    addForce(waterDragX,waterDragY,WATER_COR_X,0);

    // Environment.
    const wind=environment.wind;
    const cur=environment.current;

    // Screen/world direction: 0°=up, 90°=right, 180°=down, 270°=left.
    function screenDir(deg){
      const a=deg*Math.PI/180;
      return {x:Math.sin(a), y:-Math.cos(a)};
    }

    // WIND:
    // Approximate aerodynamic force. This is intentionally strong enough to be
    // meaningful during low-speed docking: 10-15 kt should visibly translate and
    // yaw the boat, especially when the hull is near stopped.
    //
    // Force grows roughly with wind speed squared. It acts forward of midships,
    // preserving the weathercock tendency around the aft underwater resistance.
    const wd=screenDir(environment.windDirection);
    const windForceMag=wind*wind*0.0000065;
    const windForceX=wd.x*windForceMag;
    const windForceY=wd.y*windForceMag;
    addForce(windForceX,windForceY,AIR_COE_X,0);

    // CURRENT:
    // Treat current as relative flow rather than a tiny direct shove. The target
    // water velocity is scaled into simulator units, then the hull is accelerated
    // toward that moving-water velocity at the underwater centre of resistance.
    // This lets current carry the boat bodily while also producing realistic yaw
    // when the hull is not aligned with the flow.
    const cd=screenDir(environment.currentDirection);
    const currentTargetSpeed=cur*0.0065;
    const waterRelX=state.vx-cd.x*currentTargetSpeed;
    const waterRelY=state.vy-cd.y*currentTargetSpeed;

    const relF=waterRelX*fwdx+waterRelY*fwdy;
    const relL=waterRelX*rightx+waterRelY*righty;

    const currentForwardResistance=forwardHullResistance(relF);
    const currentLateralResistance =
      lateralLinearDrag*relL + lateralQuadraticDrag*relL*Math.abs(relL);

    // Remove the stationary-water drag already applied above, then apply drag
    // relative to moving water. This makes "current" physically behave as water flow.
    state.vx -= waterDragX*dt;
    state.vy -= waterDragY*dt;
    // Also approximately remove the yaw impulse contributed by stationary-water drag.
    const wrx=WATER_COR_X*fwdx, wry=WATER_COR_X*fwdy;
    state.omega -= (wrx*waterDragY-wry*waterDragX)*yawScale*dt;

    const movingWaterDragX=-(currentForwardResistance*fwdx + currentLateralResistance*rightx);
    const movingWaterDragY=-(currentForwardResistance*fwdy + currentLateralResistance*righty);
    addForce(movingWaterDragX,movingWaterDragY,WATER_COR_X,0);


    applyLines(sim,dt,addForce);
    applyFenders(sim,dt,addForce);

    // REAL-WORLD TURNING-RADIUS CALIBRATION
    // Sea Ray 310 reference: both engines ahead, hard-over steering, idle/docking
    // speed -> approximately 40 ft turning DIAMETER, i.e. ~20 ft radius.
    //
    // Apply this AFTER engine, hull-drag, wind/current and line forces. That way
    // the calibration represents the resulting steady low-speed curvature rather
    // than being immediately cancelled by the hydrodynamic resistance model.
    const speedKt=Math.hypot(state.vx,state.vy)*110;
    const bothAhead=state.port>0.02 && (singleEngine||state.stbd>0.02);
    const steerFrac=Math.min(1,Math.abs(state.steer)/activeBoat().propulsion.maxSteerDeg);

    if(bothAhead && steerFrac>0.35 && speedKt>0.10){
      const TURN_RADIUS_FT=activeBoat().maneuvering.fullPowerTurnRadiusFt;
      const ftPerSec=speedKt*1.68781;
      const targetYawDegPerSec=(ftPerSec/TURN_RADIUS_FT)*(180/Math.PI);

      // IMPORTANT: positive steering produces positive omega in the existing
      // force model. The previous version incorrectly negated this sign, causing
      // the radius calibration to cancel the engine-generated yaw over time.
      const signedTarget=Math.sign(state.steer)*targetYawDegPerSec*steerFrac;

      // Converge smoothly toward the measured curvature while preserving transient
      // response from throttle blips and external forces.
      const TURN_CALIBRATION_RESPONSE=activeBoat().maneuvering.turnCalibrationResponse;
      const blend=1-Math.exp(-TURN_CALIBRATION_RESPONSE*dt);
      state.omega += (signedTarget-state.omega)*blend;
    }

    // Rotational damping:
    // A 31-foot cruiser should continue to carry a low-speed pivot after a
    // steering/throttle blip rather than immediately losing its yaw while
    // retaining linear momentum. Keep baseline yaw damping quite low, then let
    // translational water flow add a little extra damping as hull speed rises.
    const translationalSpeed=Math.hypot(state.vx,state.vy);
    const hydro=activeBoat().hydrodynamics;
    const yawDamping=hydro.yawDampingBase + Math.min(hydro.yawDampingSpeedMax,translationalSpeed*hydro.yawDampingSpeedGain);
    state.omega *= Math.exp(-yawDamping*dt);


    integrate(sim,dt);
  }

