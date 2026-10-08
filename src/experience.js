import {SYSTEMS,DEFAULT_LOADOUT,normalizeLoadout,designStats} from './data.js';

export function componentPreview(loadout,destination,slot,choice){
  const selected=normalizeLoadout(loadout),before=designStats(selected,destination);selected[slot]=choice;
  const after=designStats(selected,destination),part=after.parts[slot];
  const specs=[['Power draw',part.demand.toFixed(3)+' kW']];
  if(slot===0)specs.push(['Thrust',part.thrustN>=1000?(part.thrustN/1000).toFixed(0)+' kN':part.thrustN+' N'],['Specific impulse',part.isp+' s']);
  if(slot===1)specs.splice(0,1,['Output at destination',after.generatedKW.toFixed(2)+' kW'],['Game reserve capacity',part.capacity+' units']);
  if(slot===2)specs.push(['Game damage received',Math.round(part.armor*100)+'% of baseline']);
  if(slot===3)specs.push(['Scan rate','×'+part.scan],['Science yield','×'+part.yield]);
  if(slot===4)specs.push(['Relay scan rate','×'+part.link]);
  if(slot===5)specs.push(['Cooling rate','×'+part.cooling]);
  if(slot===6)specs.push(['Lateral response','×'+part.handling]);
  if(slot===7)specs.push(['Recovery yield','×'+part.recovery]);
  if(slot===8)specs.push(['Propellant',part.fuelMass+' t'],['Structure + propellant',(part.mass+part.fuelMass)+' t']);
  return {part,specs,before,after,delta:{mass:after.mass-before.mass,cost:after.cost-before.cost,deltaV:after.deltaV-before.deltaV,power:after.powerMargin-before.powerMargin}};
}
export function suggestedBuild(destination){return {loadout:[...DEFAULT_LOADOUT],stats:designStats(DEFAULT_LOADOUT,destination)};}
export function interactionLimits(sim){return {range:sim.isSurface?24:sim.stage===2||sim.stage===4?65:35,speed:sim.isSurface?4:sim.stage===5?8:sim.stage===3?10:12};}
export function missionGuidance(sim){
  if(!sim.target)return {title:sim.canDepartSurface?'Evidence aboard · press X to depart':'All objectives recovered',detail:'Review your findings and continue the journey.',state:'ready'};
  const name=sim.target.name,limits=interactionLimits(sim);
  if(sim.stage<2){const dx=sim.target.x-sim.position.x,dy=sim.target.y-sim.position.y,offset=Math.hypot(dx,dy);
    return {title:(offset>25?'Align with ':'Fly through ')+name,detail:offset>25?`${Math.abs(dx).toFixed(0)} m sideways · ${Math.abs(dy).toFixed(0)} m vertical. A/D and ↑/↓ align; W moves forward. E is not required.`:'Hold W, then coast through the bright ring. Press G for guidance. E is not required.',state:'navigate'};
  }
  if(sim.scan>0&&sim.range<limits.range&&sim.speed<limits.speed)return {title:`${Math.round(sim.scan*100)}% · ${sim.isSurface?'Collecting':'Operation in progress'}`,detail:'Stay in the green capture zone until the progress bar finishes.',state:'working'};
  if(sim.range>=limits.range)return {title:'Approach '+name,detail:`Target ${Math.round(sim.range)} m away. Get inside ${limits.range} m. ${sim.isSurface?'W/S drive · A/D steer · Z chooses a site.':'W thrust · A/D sideways · ↑/↓ altitude · G guidance.'}`,state:'navigate'};
  if(sim.speed>=limits.speed)return {title:'Brake to stabilize',detail:`Current ${sim.speed.toFixed(1)} m/s · required below ${limits.speed} m/s. Hold S to brake, or press E to arm final stabilization.`,state:'blocked'};
  return {title:'Ready · press E once',detail:`${name}: ${Math.round(sim.range)} m away, ${sim.speed.toFixed(1)} m/s. ${sim.canDepartSurface?'You can also press X to return with the evidence already aboard.':'Press E, then watch the progress bar.'}`,state:'ready'};
}
export class FlightCoach{
  constructor(completed=false){this.step=0;this.practice=0;this.basicComplete=completed;this.scanComplete=completed;}
  update(sim,keys,dt){
    if(sim.mode!=='flight')return;
    if(!this.basicComplete&&sim.stage===0){
      const action=[keys.forward&&!sim.assist&&sim.speed>1,keys.brake&&!sim.assist, (keys.left||keys.right||keys.up||keys.down)&&!sim.assist][this.step];
      if(action)this.practice+=dt;
      if(this.practice>=.5){this.practice=0;this.step++;if(this.step>=3)this.basicComplete=true;}
    }
    if(sim.stage===2&&sim.scan>0)this.scanComplete=true;
  }
  prompt(sim){
    if(!this.basicComplete&&sim.stage===0)return {title:'PILOT PRACTICE '+(this.step+1)+'/3',detail:sim.assist?'Guidance is flying. Press G to take control and practice.':['Hold W to accelerate toward the first gate.','Release W. Hold S to brake; watch velocity fall.','Use A/D or ↑/↓ briefly to align with the gate.'][this.step]};
    if(!this.scanComplete&&sim.stage===2)return {title:'INSTRUMENT PRACTICE',detail:'Approach a relay inside 65 m, brake below 12 m/s, then press E once. A green marker and progress bar confirm the scan.'};
    return null;
  }
}
