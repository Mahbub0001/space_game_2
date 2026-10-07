export const DESTINATIONS = [
  {id:'earth', name:'EARTH', subtitle:'ORBITAL ECHOES', type:'Orbital recovery', color:'#75cdff', texture:'earth.jpg', radius:6371, gravity:9.81, distance:'408 km orbit', days:3, difficulty:1, intro:'A climate observatory has gone silent over the Pacific. Recover its memory before the orbit decays. Years of irreplaceable Earth observations are on board.', discovery:'The recovered archive reveals a moving boundary between warm and cold ocean currents. Its missing observations close a gap in the climate record.', science:'Multispectral instruments measure reflected and emitted energy to reveal changes invisible to the eye.', source:'https://science.nasa.gov/earth/', target:'AURORA OBSERVATORY', surface:false},
  {id:'moon', name:'MOON', subtitle:'BENEATH THE SILENCE', type:'Polar expedition', color:'#cdd8e9', texture:'moon.jpg', radius:1737.4, gravity:1.62, distance:'384,400 km', days:3, difficulty:2, intro:'A polar surveyor detected hydrogen inside a permanently shadowed crater, then lost contact. Follow its last transmission, land on the rim, and discover what lies beneath the silence.', discovery:'The samples contain water-bearing minerals. Together with the radar record, they provide evidence of a volatile reservoir near the crater. Further lab analysis is needed.', science:'Permanently shadowed polar craters can trap water ice because sunlight never reaches their floors.', source:'https://science.nasa.gov/moon/', target:'SHACKLETON RELAY', surface:true},
  {id:'mars', name:'MARS', subtitle:'THE LAST TRANSMISSION', type:'Search & discovery', color:'#efa678', texture:'mars.jpg', radius:3389.5, gravity:3.71, distance:'225 million km · mean', days:214, difficulty:3, intro:'Ares Station went dark 19 days ago. Last night, a repeating signal emerged from the canyon below it. You command the only vessel within range. Find the station. Recover its science. Bring the story home.', discovery:'The signal was an emergency beacon, powered by the station’s backup cell. Its archive links hydrated minerals to an ancient lakebed. No alien message—just a human voice asking that the science survive.', science:'Hydrated minerals preserve evidence of how water interacted with ancient Martian rocks. They do not, by themselves, establish that life existed.', source:'https://science.nasa.gov/mars/', target:'ARES STATION', surface:true},
  {id:'asteroid', name:'VESTA', subtitle:'BEFORE THE FIRST DAWN', type:'Ancient sample return', color:'#b4a995', texture:'moon.jpg', radius:262.7, gravity:0.25, distance:'2.36 AU · mean orbit', days:382, difficulty:4, intro:'A spectrometer has detected an unusual mineral signature near Vesta’s great southern impact basin. Retrieve a sample from the exposed interior before your return window closes.', discovery:'The sample records a world that melted and differentiated near the birth of the solar system. Its layers hold a fragment of the story of how rocky planets formed.', science:'NASA’s Dawn mission found that Vesta is a differentiated protoplanet with a crust, mantle, and core.', source:'https://science.nasa.gov/mission/dawn/', target:'RHEASILVIA OUTPOST', surface:true},
  {id:'jupiter', name:'JUPITER', subtitle:'THE EDGE OF LIGHT', type:'Deep-space flyby', color:'#dfc2a4', texture:'jupiter.jpg', radius:69911, gravity:24.79, distance:'5.2 AU · mean orbit', days:740, difficulty:5, intro:'A radiation-hardened probe carries a unique record of Jupiter’s magnetic environment. Its transmission system failed. Intercept it outside the strongest radiation belts and return its recorder.', discovery:'The recorder captures a sharp change in Jupiter’s magnetic environment. Your measurements connect the field structure to charged-particle observations made during the flyby.', science:'Jupiter has no solid surface to land on. This expedition remains in space and recovers a robotic probe.', source:'https://science.nasa.gov/jupiter/', target:'JOVE MAGNETOSPHERE PROBE', surface:false}
];
export const SYSTEMS = [
  {id:'engine', label:'01 / PROPULSION', icon:'↗', choices:[
    {name:'Chemical / LH₂',description:'Responsive thrust. Higher propellant consumption.',cost:55,mass:6,isp:450,thrust:1.15,efficiency:1,tag:'BALANCED'},
    {name:'Ion / Xenon',description:'Efficient cruise. Lower maneuvering thrust.',cost:85,mass:5,isp:1800,thrust:.8,efficiency:.58,tag:'ENDURANCE'},
    {name:'Advanced chemical',description:'High thrust. Expensive, responsive maneuvering.',cost:110,mass:8,isp:465,thrust:1.4,efficiency:1.12,tag:'PERFORMANCE'}]},
  {id:'power',label:'02 / POWER SYSTEM',icon:'ϟ',choices:[
    {name:'Solar + battery',description:'Lightweight. Output decreases farther from the Sun.',cost:28,mass:3,capacity:88,tag:'LIGHTWEIGHT'},
    {name:'Radioisotope',description:'Steady output in shadow and deep space.',cost:62,mass:5,capacity:110,tag:'RECOMMENDED'},
    {name:'Fission demonstrator',description:'High output, with a significant mass penalty.',cost:94,mass:9,capacity:138,tag:'HIGH OUTPUT'}]},
  {id:'shield',label:'03 / VEHICLE PROTECTION',icon:'◇',choices:[
    {name:'Whipple shielding',description:'Light protection against small debris.',cost:24,mass:4,armor:1,tag:'STANDARD'},
    {name:'Reinforced shelter',description:'Reduces collision and radiation damage.',cost:48,mass:8,armor:.55,tag:'RESILIENT'},
    {name:'Heavy protection',description:'Maximum survivability. Less acceleration.',cost:75,mass:13,armor:.32,tag:'EXPEDITION'}]},
  {id:'payload',label:'04 / SCIENCE PAYLOAD',icon:'⌬',choices:[
    {name:'Imaging spectrometer',description:'Fast remote scans and mineral identification.',cost:34,mass:3,scan:1.5,yield:1,tag:'REMOTE SENSING'},
    {name:'Radar + sample kit',description:'Balanced subsurface surveys and sample collection.',cost:52,mass:6,scan:1,yield:1.3,tag:'EXPLORER'},
    {name:'Return laboratory',description:'Slower scans. Higher value from recovered material.',cost:82,mass:10,scan:.8,yield:1.6,tag:'DEEP SCIENCE'}]},
  {id:'communications',label:'05 / COMMUNICATIONS',icon:'⌁',choices:[
    {name:'Patch antenna array',description:'Light radio package. Standard relay acquisition.',cost:8,mass:1,demand:.08,link:1,tag:'LIGHTWEIGHT'},
    {name:'High-gain dish',description:'Larger aperture. Relay acquisition 12% faster.',cost:14,mass:1.5,demand:.12,link:1.12,tag:'DEEP SPACE'},
    {name:'Dish + relay mast',description:'Redundant radio package. Relay acquisition 25% faster.',cost:22,mass:2,demand:.18,link:1.25,tag:'REDUNDANT'}]},
  {id:'thermal',label:'06 / THERMAL CONTROL',icon:'≋',choices:[
    {name:'Passive radiator fins',description:'Radiates waste heat. Standard cooling rate.',cost:8,mass:1.5,demand:.04,cooling:1,tag:'PASSIVE'},
    {name:'Deployable radiator wings',description:'More radiator area. Cooling rate increased by 30%.',cost:14,mass:2,demand:.07,cooling:1.3,tag:'HIGH AREA'},
    {name:'Pumped radiator loop',description:'Active circulation. Cooling rate increased by 60%.',cost:20,mass:3,demand:.16,cooling:1.6,tag:'ACTIVE COOLING'}]},
  {id:'guidance',label:'07 / ATTITUDE CONTROL',icon:'⊕',choices:[
    {name:'RCS thruster pack',description:'Baseline lateral control and attitude actuators.',cost:7,mass:.7,demand:.05,handling:1,tag:'RCS'},
    {name:'Reaction wheels + RCS',description:'Fine pointing package. Lateral response improved by 15%.',cost:13,mass:1.2,demand:.09,handling:1.15,tag:'PRECISION'},
    {name:'Redundant navigation suite',description:'Dual star trackers and actuators. Lateral response improved by 30%.',cost:20,mass:1.8,demand:.14,handling:1.3,tag:'REDUNDANT'}]},
  {id:'recovery',label:'08 / RECOVERY BAY',icon:'▣',choices:[
    {name:'Compact field vehicle',description:'Light rover/drone package. Standard recovered science yield.',cost:10,mass:2,demand:.03,recovery:1,tag:'SCOUT'},
    {name:'Sample handling bay',description:'Adds a manipulator and sealed canisters. Recovery yield +10%.',cost:18,mass:3,demand:.07,recovery:1.1,tag:'SAMPLE RETURN'},
    {name:'Protected archive vault',description:'Larger handling bay and record vault. Recovery yield +20%.',cost:26,mass:4,demand:.11,recovery:1.2,tag:'ARCHIVE'}]},
  {id:'tanks',label:'09 / PROPELLANT STORAGE',icon:'◉',choices:[
    {name:'Standard tank pair',description:'28 t propellant. Light storage structure.',cost:8,mass:2,demand:.02,fuelMass:28,tag:'STANDARD'},
    {name:'Extended tank cluster',description:'34 t propellant. More reserve, more launch mass.',cost:16,mass:3,demand:.03,fuelMass:34,tag:'ENDURANCE'},
    {name:'Long-range tank assembly',description:'40 t propellant. Highest reserve; watch the 85 t limit.',cost:24,mass:5,demand:.05,fuelMass:40,tag:'LONG RANGE'}]}
];
export const DEFAULT_LOADOUT=[0,1,1,1,0,0,0,0,0];
export function normalizeLoadout(loadout=DEFAULT_LOADOUT){return SYSTEMS.map((s,i)=>Number.isInteger(loadout[i])&&s.choices[loadout[i]]?loadout[i]:DEFAULT_LOADOUT[i]);}
export const STAGES = [
  {title:'LEAVE THE BLUE BEHIND',short:'Departure',verb:'Fly through the departure gates',kind:'gates',color:'#77d9e9',chapter:'01',commander:'Flight Director Imani',message:'Odyssey, this is Houston. You are clear to depart. W for thrust, A and D to steer, arrow keys to change altitude. Follow the illuminated gates. Take us out.',tip:'W thrust · S brake · A/D left/right · ↑/↓ altitude. G toggles optional guidance.',fact:'Inertia: in space, you keep moving after the engine stops. Braking requires thrust in the opposite direction.'},
  {title:'THE SPACE BETWEEN',short:'Transfer',verb:'Navigate the debris corridor',kind:'gates',color:'#e5b876',chapter:'02',commander:'Flight Engineer Reyes',message:'We have particulate debris crossing the transfer corridor. Keep your eyes on the proximity radar. Shields reduce impact damage; boost gets you through faster but burns propellant.',tip:'SPACE boost · 1 engines · 2 science · 3 shields · R use a repair kit.',fact:'The distances and journey time are compressed for play. The ship is not traveling faster than light.'},
  {title:'A VOICE IN THE STATIC',short:'Survey',verb:'Locate and scan three signal relays',kind:'scan',color:'#7ddec2',chapter:'03',commander:'Science Officer Sen',message:'The signal is fragmented across three relays. Approach each beacon, brake below 12 meters per second, and hold E within scanning range. Keep the ship steady.',tip:'Approach the marker · S brake · hold E to scan. Science power makes scans faster.',fact:'Remote sensing: different wavelengths reveal different materials. One measurement is a clue, not a complete explanation.'},
  {title:'THE POINT OF NO RETURN',short:'Approach',verb:'Make a controlled landing',kind:'land',color:'#e8b182',chapter:'04',commander:'Flight Director Imani',message:'We have a fix on the lost station. This is a precision approach. Brake early. The landing controller can capture your craft only below 10 meters per second. Hold E inside the landing zone.',tip:'The landing gate turns green below 10 m/s. Approach slowly, then hold E.',fact:'A safe landing depends on both position and velocity. Arriving at the right place too fast is still a collision.'},
  {title:'WHAT THE SILENCE KEPT',short:'Discovery',verb:'Recover three scientific records',kind:'explore',color:'#8adecc',chapter:'05',commander:'Science Officer Sen',message:'We made it. The survey vehicle is online. Follow the markers to the samples. W and S drive; A and D steer. Stop near each site and hold E to recover it. The last site has the station recorder.',tip:'W/S drive forward/reverse · A/D steer · E collect when stopped · G optional guidance.',fact:'Context matters: a sample is more useful when its location, surrounding geology, and collection method are recorded.'},
  {title:'BRING THE STORY HOME',short:'Return',verb:'Dock with the recovery station',kind:'dock',color:'#88ccec',chapter:'06',commander:'Flight Director Imani',message:'Welcome home, Odyssey. The recovery station is ahead. Align with the docking ring, slow below 8 meters per second, and hold E. Let’s bring that science home.',tip:'Final approach: less than 8 m/s · hold E within 35 m · don’t boost into the station.',fact:'Docking is a relative-motion problem. Two vehicles can move rapidly around Earth while moving slowly relative to each other.'}
];
export const EVENTS = {
  flare:{label:'PRIORITY TRANSMISSION',title:'A solar storm is coming.',speaker:'REYES / FLIGHT ENGINEER',body:'The radiation monitor is climbing. We have time for one response. A shielded coast preserves the vehicle; keeping the array deployed gives more power at greater risk.',choices:[{label:'Stow arrays. Shelter the vehicle.',detail:'−6 power · protection active for this leg',effect:'shelter'},{label:'Keep arrays deployed. Collect the event.',detail:'+12 science · radiation damages the hull',effect:'observe'}]},
  recorder:{label:'ARCHIVE RECOVERED',title:'“Please, bring the science home.”',speaker:'LAST RECORDED MESSAGE',body:'The station survived the storm, but its transmitter did not. Its final message repeats one request: preserve the data. You can spend reserves recovering the full archive, or depart with the validated samples.',choices:[{label:'Recover the complete archive.',detail:'−12 power · +22 science · full record ending',effect:'archive'},{label:'Preserve the return margin.',detail:'+8 fuel · +8 science · essential record ending',effect:'return'}]}
};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function designStats(loadout=DEFAULT_LOADOUT, destination="earth") {
  loadout=normalizeLoadout(loadout);
  const parts=SYSTEMS.map((s,i)=>s.choices[loadout[i]??0]);
  const cost=parts.reduce((n,p)=>n+p.cost,60);
  const dryMass=parts.reduce((n,p)=>n+p.mass,12), fuelMass=parts[8].fuelMass;
  const deltaV=parts[0].isp*9.80665*Math.log((dryMass+fuelMass)/dryMass)/1000;
  const sunDistance={earth:1,moon:1,mars:1.52,asteroid:2.36,jupiter:5.2}[destination]||1;
  // Illustrative concept specifications; these are not flight hardware ratings.
  const thrustN=[200000,.35,280000][loadout[0]??0];
  const generatedKW=loadout[1]===0?18/(sunDistance**2):loadout[1]===1?2.4:20;
  const propulsionKW=loadout[0]===1?thrustN*parts[0].isp*9.80665/(2*.6*1000):.15;
  const demandKW=.55+[.25,.45,.8][loadout[3]??0]+propulsionKW+parts.slice(4).reduce((n,p)=>n+p.demand,0);
  const powerMargin=generatedKW-demandKW,issues=[];
  if(cost>320)issues.push('Reduce cost below $320M');
  if(dryMass+fuelMass>85)issues.push('Reduce wet mass below 85 t');
  if(powerMargin<0)issues.push('Power deficit at destination: change power or propulsion');
  const acceleration=thrustN/((dryMass+fuelMass)*1000),massFlow=thrustN/(parts[0].isp*9.80665),burnSeconds=fuelMass*1000/massFlow;
  return {sunDistance,thrustN,generatedKW,demandKW,powerMargin,acceleration,massFlow,burnSeconds,issues,parts,cost,dryMass,fuelMass,mass:dryMass+fuelMass,deltaV,valid:issues.length===0,thrust:parts[0].thrust*(65/(dryMass+fuelMass)),efficiency:parts[0].efficiency*28/fuelMass,power:parts[1].capacity,armor:parts[2].armor,scan:parts[3].scan,yield:parts[3].yield,link:parts[4].link,cooling:parts[5].cooling,handling:parts[6].handling,recovery:parts[7].recovery};
}
