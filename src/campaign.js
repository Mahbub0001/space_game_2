// Authored mission scenarios. Resource units are gameplay reserves, not joules or kg.
export const FLIGHT_PLANS=[
  {id:'reserve',name:'RESERVE FIRST',days:286,burn:.86,housekeeping:1.08,hazards:.7,description:'A longer coast with a lower propellant commitment and a quieter debris corridor.'},
  {id:'balanced',name:'BALANCED TRANSFER',days:224,burn:1,housekeeping:1,hazards:1,description:'Moderate transfer commitment. Keep room for scientific diversions.'},
  {id:'rapid',name:'RAPID RESPONSE',days:168,burn:1.18,housekeeping:.9,hazards:1.3,description:'Reach the station sooner, but spend more propellant and cross a denser debris corridor.'}
];
export const SCIENCE_SOURCE='https://www.nasa.gov/missions/mars-science-laboratory/curiosity-rover/cracks-in-ancient-martian-mud-surprise-nasas-curiosity-rover-team/';
export const SITES=[
  {id:'basin',name:'ANCIENT BASIN',clay:78,sulfate:19,slope:4,power:3,yield:8,x:-45,z:-75,description:'Strong clay signature. Accessible terrain; good evidence of water-altered minerals.'},
  {id:'boundary',name:'LAYER BOUNDARY',clay:56,sulfate:61,slope:11,power:7,yield:18,x:68,z:-110,description:'Both mineral groups near a layered contact. Best opportunity to investigate environmental change.'},
  {id:'ridge',name:'SALT RIDGE',clay:14,sulfate:86,slope:18,power:11,yield:11,x:-95,z:-150,description:'Strong sulfate signature. Rough terrain and a longer traverse; useful drying-environment context.'}
];
export function makeCampaign(plan='balanced'){
  return {plan:FLIGHT_PLANS.some(p=>p.id===plan)?plan:'balanced',site:null,repair:null,conclusion:null,evidence:[],decisions:[],completed:{}};
}
export function flightPlan(campaign){return FLIGHT_PLANS.find(p=>p.id===campaign?.plan)||FLIGHT_PLANS[1];}
export function projectedReserves(loadoutStats,plan){return {fuel:100-55*loadoutStats.efficiency*plan.burn,power:100-34*(110/loadoutStats.power)*plan.housekeeping};}
export function recordDecision(sim,title,detail){sim.campaign.decisions.push({title,detail});sim.log(title,detail);}
export function resolveOperation(sim,kind,value){
  const c=sim.campaign;if(!c||sim.mode!=='operation'||sim.operation!==kind||c.completed[kind])return false;
  if(kind==='repair'){
    if(!['bypass','isolate'].includes(value))return false;
    c.repair=value;
    if(value==='bypass'){sim.power=Math.max(0,sim.power-4);recordDecision(sim,'Power bus restored','Isolated the shorted science branch and cross-fed the redundant bus. −4 power; full instrument capability restored.');}
    else {sim.stats.scan*=.8;recordDecision(sim,'Instrument redundancy lost','Preserved reserves by isolating the failed branch. Scanning is 20% slower for the remaining expedition.');}
  }
  if(kind==='survey'){
    const site=SITES.find(s=>s.id===value);if(!site)return false;c.site=site.id;
    sim.power=Math.max(0,sim.power-site.power);sim.score+=site.yield;
    recordDecision(sim,'Landing site selected',`${site.name}: allocated ${site.power} power reserves to the traverse. Synthetic survey indices: clay ${site.clay}, sulfate ${site.sulfate}.`);
  }
  if(kind==='analysis'){
    if(!['water','life','ocean'].includes(value))return false;
    c.conclusion=value;const valid=value==='water';sim.score+=valid?20:4;
    recordDecision(sim,'Scientific interpretation',valid?'Evidence supports water-related mineral alteration and changing conditions. It does not establish life or the size of an ancient water body.':'Initial claim exceeded the evidence. Science review retained the observations and corrected the claim to water-related mineral alteration.');
  }
  c.completed[kind]=true;sim.operation=null;sim.mode='flight';sim.emit('operationResolved',{kind,value});
  if(kind==='survey')sim.finishStage();
  if(kind==='analysis'){sim.eventFlags.recorder=true;sim.mode='event';sim.emit('event',{id:'recorder'});}
  return true;
}
