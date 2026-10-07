import {makeCampaign,flightPlan,SITES} from './campaign.js';
import {plannerMarkup,bindPlanner,operationMarkup,bindOperation,campaignDebrief} from './mission-ui.js';
let committedPlan=null;
import '@fontsource/rajdhani/latin-400.css';
import '@fontsource/rajdhani/latin-500.css';
import '@fontsource/rajdhani/latin-600.css';
import '@fontsource/rajdhani/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/inter/latin-400.css';
import './style.css';
import {DESTINATIONS,SYSTEMS,STAGES,EVENTS,designStats,clamp} from './data.js';
import {Simulation} from './simulation.js';
import {SpaceWorld} from './world.js';
import {FlightAudio} from './audio.js';
import {AssemblyHangar} from './assembly.js';
let assembly=null;

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getSaved=(key,fallback=null)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const save=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{notify('Storage unavailable. This expedition can still be completed.','warning');}};
let selected=2,loadout=[0,1,1,1],difficulty='explorer',sim=null,world,view='menu',dialogKind=null,restoreFocus=null,extraPaused=false;
let lastJournal=getSaved('odyssey-journal',[]),records=getSaved('odyssey-records',{}),savedCheckpoint=getSaved('odyssey-checkpoint');
const audio=new FlightAudio();let keys={},transcript='',typed=0,accumulator=0,lastFrame=performance.now(),lastHud=0,scanSound=0;
const settings=getSaved('odyssey-settings',{voice:true,quality:true,muted:false});audio.voice=settings.voice;audio.muted=settings.muted;
const radar=$('#radar').getContext('2d');

function notify(message,type='info'){const item=document.createElement('div');item.className='notification'+(type==='warning'?' warning':'');item.textContent=message;$('#notifications').append(item);setTimeout(()=>item.remove(),3600);}
function persistSettings(){save('odyssey-settings',{voice:audio.voice,quality:world?.highQuality??true,muted:audio.muted});}
function updateAudioButton(){const b=$('#sound-button');b.textContent=audio.muted?'♪':'♫';b.setAttribute('aria-pressed',String(!audio.muted));b.title=audio.muted?'Enable audio (M)':'Mute audio (M)';}
function soundToggle(){audio.start();audio.toggle();updateAudioButton();persistSettings();}
function showDialog(kind,html,wide=false){
  restoreFocus=document.activeElement;keys={};dialogKind=kind;$('#dialog').className='dialog'+(wide?' wide':'');$('#dialog').classList.add(kind+'-dialog');$('#dialog').innerHTML=html;$('#modal-layer').hidden=false;
  requestAnimationFrame(()=>$('#dialog').querySelector('button:not(:disabled),select,a')?.focus({preventScroll:true}));
}
function closeDialog(){
  assembly?.dispose();assembly=null;
  $('#modal-layer').hidden=true;dialogKind=null;keys={};if(extraPaused){sim?.resume();extraPaused=false;}
  if(restoreFocus?.isConnected)restoreFocus.focus({preventScroll:true});
}
function pauseForDialog(){extraPaused=sim?.pause()||false;}
function header(kicker,title,close=false){return `<span class="eyebrow">${kicker}</span><h2 id="dialog-title">${title}</h2>${close?'<button class="close-dialog" data-close aria-label="Close dialog">×</button>':''}`;}
function selectDestination(index){
  selected=(index+DESTINATIONS.length)%DESTINATIONS.length;const d=DESTINATIONS[selected];world?.setDestination(d);
  $('#planet-name').textContent=d.name;$('#mission-subtitle').textContent=d.subtitle;$('#mission-type').textContent=d.type.toUpperCase();$('#mission-code').textContent=`0${selected+1}—05`;
  $('#risk-label').textContent='CLASS '+['I','II','III','IV','V'][d.difficulty-1];$('#mission-description').textContent=d.intro;
  $('#destination-range').textContent=d.distance;$('#transfer-time').textContent=d.days+' DAYS';$('#primary-goal').textContent='LOCATE '+d.target;$('#trajectory-target').textContent=d.name;
  $$('.destination-card').forEach((b,i)=>{b.classList.toggle('selected',i===selected);b.setAttribute('aria-pressed',String(i===selected));});
  $('#record-label').textContent=records[d.id]?`BEST EXPEDITION: ${records[d.id].score} SCIENCE · RANK ${records[d.id].rank}`:'THE NEXT FRONTIER IS YOURS TO EXPLORE.';
}
function buildCards(){
  $('#destination-cards').innerHTML=DESTINATIONS.map((d,i)=>`<button class="destination-card ${i===selected?'selected':''}" data-destination="${i}" aria-pressed="${i===selected}" aria-label="Select ${d.name} mission"><span class="card-index">0${i+1} / ${d.id==='earth'?'LOW ORBIT':d.id==='jupiter'?'DEEP SPACE':'EXPEDITION'}</span><span class="card-planet" style="background-image:url('./textures/${d.id==='earth'?'earth.jpg':d.texture}')"></span><span class="card-text">${d.name}<small>${d.subtitle}</small></span><span class="card-corner">${records[d.id]?'✓':'↗'}</span></button>`).join('');
}
function designDialog(){
  assembly?.dispose();assembly=null;
  const d=DESTINATIONS[selected];
  showDialog('design',`${header('MISSION DESIGN / '+d.name,'BUILD YOUR ODYSSEY.',true)}<div id="assembly-root"></div>`,true);
  $('#dialog').classList.add('assembly-dialog');
  assembly=new AssemblyHangar($('#assembly-root'),loadout,d,value=>{loadout=value;},()=>audio.cue('success'));
  $('#difficulty-select').value=difficulty;
  $('#difficulty-select').onchange=e=>{difficulty=e.target.value;};
}
function flightPlanDialog(){
  closeDialog();
  if(DESTINATIONS[selected].id!=='mars'){committedPlan=null;initializeFlight();return;}
  showDialog('planning',`${header('MISSION PLANNING / MARS','PLAN FOR THE WAY HOME.',true)}${plannerMarkup(designStats(loadout,'mars'))}`,true);
  bindPlanner($('#dialog'),plan=>{committedPlan=makeCampaign(plan);initializeFlight();});
}
function operationDialog(kind){
  keys={};audio.stopVoice();audio.cue('alert');
  const title={repair:'THE SCIENCE BUS IS DOWN.',survey:'FOLLOW THE EVIDENCE.',analysis:'WHAT CAN WE ACTUALLY CLAIM?'}[kind];
  showDialog('operation',`${header('FIELD OPERATIONS / '+kind.toUpperCase(),title)}${operationMarkup(sim,kind)}`,true);
  bindOperation($('#dialog'),sim,kind,value=>{closeDialog();sim.resolveOperation(kind,value);},name=>audio.cue(name));
}
function initializeFlight(checkpoint=null){
  closeDialog();audio.start();sim=checkpoint?Simulation.restore(checkpoint,handleEvent):new Simulation({destination:DESTINATIONS[selected].id,loadout,difficulty,campaign:committedPlan,onEvent:handleEvent});
  view='flight';$('#menu-view').hidden=true;$('#flight-view').hidden=false;document.body.classList.add('in-flight');
  $('#touch-controls').hidden=!matchMedia('(pointer: coarse)').matches;world.setupStage(sim);saveCheckpoint();buildFlightHud();showBriefing();
}
function saveCheckpoint(){savedCheckpoint=sim.checkpoint;save('odyssey-checkpoint',savedCheckpoint);$('#resume-button').hidden=false;}
function returnMenu(){
  if(sim){lastJournal=sim.journal;save('odyssey-journal',lastJournal);selected=DESTINATIONS.findIndex(d=>d.id===sim.destination.id);}
  closeDialog();audio.stopVoice();sim=null;view='menu';keys={};$('#menu-view').hidden=false;$('#flight-view').hidden=true;$('#touch-controls').hidden=true;document.body.classList.remove('in-flight');buildCards();selectDestination(selected);$('#resume-button').hidden=!savedCheckpoint;
}
function stageInfo(){const stage={...STAGES[sim.stage]};if(!sim.destination.surface&&sim.stage===3){stage.title='RENDEZVOUS IN THE DARK';stage.verb='Rendezvous with the disabled probe';stage.message='The probe is ahead. Match its relative motion, slow below 10 meters per second, and hold E inside the capture zone. We will deploy a recovery drone from here.';stage.fact='A gas giant has no solid surface. This recovery operation takes place in space.';if(sim.destination.id==='earth')stage.fact='Docking and capture require matching relative velocity, not stopping in an absolute frame.';}if(!sim.destination.surface&&sim.stage===4){stage.title='THE RECOVERY OPERATION';stage.message='The recovery drone is away. Approach each marked record package, brake, and hold E to retrieve it. The last package is the primary science recorder.';stage.tip='W thrust · S brake · A/D translate · ↑/↓ altitude · E recover';}return stage;}
function campaignBriefing(stage){
  if(!sim.campaign)return stage;
  const site=SITES.find(s=>s.id===sim.campaign.site)?.name||'the selected site';
  if(sim.stage===0)stage.message='Ares Station has been silent for nineteen days. You built this vehicle; now fly it. Hold W to accelerate, release to coast, and use S to brake. Follow the three departure gates. G enables optional guidance. Your transfer plan is '+flightPlan(sim.campaign).name.toLowerCase()+'.';
  if(sim.stage===2)stage.message='The relays hold mineral surveys of the terrain around Ares. Recover all three packets, then use the instrument console to compare candidate landing sites. Your choice determines the rover traverse.';
  if(sim.stage===3)stage.message='Approaching '+site+'. Watch lateral offset and relative speed on the approach guide. Brake below 10 meters per second, then hold E inside the capture corridor. The auxiliary landing system handles final descent.';
  if(sim.stage===4)stage.message='The rover is deployed near '+site+'. Collect a mineral core, document its geological context, and retrieve the recorder. Then submit a scientific interpretation. Interesting rocks alone cannot establish that life existed.';
  return stage;
}
function showBriefing(){
  const s=campaignBriefing(stageInfo());showDialog('briefing',`${header('CHAPTER '+s.chapter+' / '+sim.destination.name,s.title)}<div class="stage-preview">${STAGES.map((_,i)=>`<span class="${i<=sim.stage?'active':''}"></span>`).join('')}</div><p class="dialog-lead">${s.message}</p><div class="briefing-fact"><span>⌬</span><p><b>THE SCIENCE BEHIND THE FLIGHT</b><br>${s.fact}</p></div><p class="briefing-tip">${s.tip}</p><div class="dialog-footer"><span>CHECKPOINT SAVED · H CONTROLS · ESC PAUSE</span><button class="primary-button" id="begin-stage"><span>${sim.stage===0?'TAKE THE CONTROLS':sim.isSurface?'DEPLOY THE ROVER':'CONTINUE EXPEDITION'}</span><b>↗</b></button></div>`);
}
function buildFlightHud(){
  const s=stageInfo();$('#flight-chapter').textContent=`${s.chapter} / ${s.short.toUpperCase()} · ${sim.destination.name}`;$('#flight-title').textContent=s.title;$('#objective-main').textContent=s.verb;
  $('#resource-bars').innerHTML=[['hull','HULL INTEGRITY','#a0dbd7'],['fuel','PROPELLANT','#e4bb82'],['power','POWER RESERVE','#87bedb']].map(([key,name,color])=>`<div class="resource-row" id="resource-${key}" style="--bar-color:${color}"><div><span>${name}</span><b><span id="value-${key}">100</span><small>%</small></b></div><span class="resource-track"><i id="bar-${key}" style="width:100%"></i></span></div>`).join('');
  $('#resource-bars').insertAdjacentHTML('beforeend','<div class="resource-row" style="--bar-color:#a8abdf"><div><span>COMMS LINK</span><b><span id="value-comms">82</span><small>%</small></b></div><span class="resource-track"><i id="bar-comms" style="width:82%"></i></span></div>');
  $('#flight-progress').innerHTML=STAGES.map((s,i)=>`<span class="${i===sim.stage?'active':i<sim.stage?'done':''}"><b>0${i+1}</b>${s.short.toUpperCase()}</span>`).join('');
  $('#flight-tip').innerHTML=sim.isSurface?'DRIVE <kbd>W</kbd><kbd>S</kbd> &nbsp; STEER <kbd>A</kbd><kbd>D</kbd> &nbsp; STOP & COLLECT <kbd>E</kbd>':'THRUST <kbd>W</kbd> &nbsp; BRAKE <kbd>S</kbd> &nbsp; STEER <kbd>A</kbd><kbd>D</kbd> &nbsp; ALTITUDE <kbd>↑</kbd><kbd>↓</kbd>';
  $('#bottom-context').textContent=sim.isSurface?'SURFACE OPERATIONS · TIME & DISTANCE SCALED':'FLIGHT OPERATIONS · TIME & DISTANCE SCALED';updateObjectives();updateHud();
}
function updateObjectives(){if(!sim)return;$('#objective-list').innerHTML=sim.targets.map((t,i)=>`<li class="${i<sim.targetIndex?'done':i===sim.targetIndex?'active':''}">${t.name}</li>`).join('');$('#objective-fraction').textContent=`${String(Math.min(sim.targetIndex+1,sim.targets.length)).padStart(2,'0')} / ${String(sim.targets.length).padStart(2,'0')}`;}
function communicate(speaker,message,speak=true){transcript=message;typed=0;$('#comm-speaker').textContent=speaker.toUpperCase();$('#comm-state').textContent='INCOMING TRANSMISSION';if(speak)audio.speak(message);}
function handleEvent(event){
  if(event.type==='operation')operationDialog(event.kind);
  if(event.type==='operationResolved'){audio.cue('success');notify('DECISION LOGGED · YOUR MISSION HAS CHANGED');}
  if(event.type==='begin'){const s=stageInfo();communicate(s.commander,s.message);audio.cue('success');}
  if(event.type==='target'){audio.cue('success');notify('✓ '+event.name+' COMPLETE');updateObjectives();}
  if(event.type==='impact'){audio.cue('impact');world.impact();const flash=$('#impact-flash');flash.classList.remove('flash');void flash.offsetWidth;flash.classList.add('flash');notify('IMPACT · Hull damage. Steer clear or press R to repair.','warning');}
  if(event.type==='miss'){notify('TARGET OVERSHOT · Approach re-vectored ahead. Brake earlier.','warning');communicate('Navigation','We passed the approach window. A new intercept is marked ahead. Reduce speed.');}
  if(event.type==='repair'){audio.cue('success');notify('FIELD REPAIR COMPLETE · +30 HULL');}
  if(event.type==='pulse')audio.cue('scan');
  if(event.type==='route'){audio.cue('click');notify('POWER ROUTED TO '+event.route.toUpperCase());updateHud();}
  if(event.type==='assist'){audio.cue('click');notify(event.active?'GUIDANCE ON · Flight computer tracks the target. You handle scanning.':'MANUAL FLIGHT · You have control.');updateHud();}
  if(event.type==='log'){lastJournal=sim.journal;save('odyssey-journal',lastJournal);}
  if(event.type==='event'){keys={};audio.cue('alert');const e=EVENTS[event.id];audio.speak(e.body);showDialog('event',`${header(e.label,e.title)}<p class="eyebrow event-warning">${e.speaker}</p><p class="dialog-lead">${e.body}</p><div class="event-choices">${e.choices.map((c,i)=>`<button class="event-choice" data-effect="${c.effect}"><kbd>${i+1}</kbd><span><strong>${c.label}</strong><small>${c.detail}</small></span><span>→</span></button>`).join('')}</div>`);}
  if(event.type==='choice'){audio.cue('click');communicate('Mission control','Decision logged. Your flight profile has been updated.',false);}
  if(event.type==='stageComplete'){
    keys={};audio.stopVoice();audio.cue('transition');$('#cinematic-kicker').textContent='CHAPTER '+String(sim.stage+1).padStart(2,'0')+' COMPLETE';$('#cinematic-title').textContent=STAGES[sim.stage+1].title;
    $('#cinematic-copy').textContent=sim.stage===0?`${sim.campaign?flightPlan(sim.campaign).days:sim.destination.days} days of coast, compressed into the next chapter.`:sim.stage===3?(sim.destination.surface?'Touchdown confirmed. Deploying the surface rover.':'Rendezvous confirmed. Deploying the recovery vehicle.'):sim.stage===4?'Departure burn complete. The long journey home begins.':'Trajectory confirmed. Reconfiguring flight systems.';
    $('#cinematic').hidden=false;setTimeout(()=>{if(sim?.mode==='transition'){sim.advance();}$('#cinematic').hidden=true;},3900);
  }
  if(event.type==='stage'){world.setupStage(sim);saveCheckpoint();buildFlightHud();showBriefing();}
  if(event.type==='complete')completeMission();
  if(event.type==='failed'){audio.cue('alert');keys={};showDialog('failed',`${header('MISSION INTERRUPTED',event.title)}<p>${event.message}</p><div class="dialog-actions"><button class="primary-button" id="retry-button"><span>RETRY STAGE CHECKPOINT</span><b>↗</b></button><button class="outline-button" data-menu>MISSION SELECTION</button></div>`);}
}
function completeMission(){
  keys={};audio.cue('success');audio.stopVoice();const rank=sim.score>=185&&sim.hull>=65?'S':sim.score>=155?'A':sim.score>=115?'B':'C';
  const result={score:Math.round(sim.score),rank,time:sim.time,hull:Math.round(sim.hull),fullArchive:sim.fullArchive,destination:sim.destination.name,journal:sim.journal,campaign:sim.campaign,loadout:sim.loadout,date:new Date().toISOString()};
  if(!records[sim.destination.id]||records[sim.destination.id].score<result.score){records[sim.destination.id]=result;save('odyssey-records',records);}
  savedCheckpoint=null;try{localStorage.removeItem('odyssey-checkpoint');}catch{}$('#resume-button').hidden=true;lastJournal=sim.journal;save('odyssey-journal',lastJournal);
  showDialog('complete',`<div class="rank-badge">${rank}</div>${header('EXPEDITION COMPLETE / '+sim.destination.name,'YOU BROUGHT THE STORY HOME.')}<p class="dialog-lead">${sim.destination.discovery}</p><p>${sim.fullArchive?'The complete archive survived the journey. Every measurement and every recorded voice is now safely on Earth.':'The validated samples reached Earth. Your team preserved the essential record and a larger return reserve.'}</p><div class="debrief-stats"><div><b>${result.score}</b><span>SCIENCE RETURN</span></div><div><b>${Math.round(sim.hull)}%</b><span>VEHICLE INTEGRITY</span></div><div><b>${formatTime(sim.time)}</b><span>FLIGHT TIME</span></div><div><b>${sim.collisions}</b><span>COLLISIONS</span></div></div><div class="briefing-fact"><span>⌬</span><p>${sim.destination.science}<br><a href="${sim.destination.source}" target="_blank" rel="noopener" style="color:var(--cyan)">Explore the NASA science ↗</a></p></div>${campaignDebrief(sim)}<div class="dialog-actions"><button class="primary-button" data-menu><span>CHOOSE THE NEXT FRONTIER</span><b>↗</b></button><button class="outline-button" id="export-button">EXPORT MISSION LOG ↓</button></div>`);
  $('#export-button').onclick=()=>{const blob=new Blob([JSON.stringify(result,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`odyssey-${sim.destination.id}-mission.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
}
function pauseMenu(){
  if(!sim||!['flight','paused'].includes(sim.mode))return;sim.pause();audio.stopVoice();keys={};
  showDialog('pause',`${header('FLIGHT COMPUTER / PAUSED','HOLDING POSITION.')}<p>Your expedition is paused. Your last stage checkpoint is saved locally.</p><div class="dialog-actions"><button class="primary-button" id="resume-flight"><span>RESUME FLIGHT</span><b>↗</b></button><button class="outline-button" id="pause-controls">CONTROLS</button><button class="outline-button" id="retry-button">RETRY STAGE</button><button class="outline-button" data-menu>MISSION SELECTION</button></div>`);
}
function controlsDialog(){
  if(dialogKind==='briefing'||dialogKind==='event'||dialogKind==='complete'||dialogKind==='failed')return;
  pauseForDialog();showDialog('controls',`${header('PILOT FIELD MANUAL','YOU HAVE THE CONTROLS.',true)}<div class="controls-grid">${[
    ['Thrust / rover forward','W'],['Brake / reverse','S'],['Translate / rover steering','A D'],['Altitude / rover drive','↑ ↓'],['Boost (uses fuel & generates heat)','SPACE'],['Hold to scan, recover, land or dock','E'],['Toggle guidance assistance','G'],['Change camera','C'],['Engine / science / shield power','1 2 3'],['Use repair kit','R'],['Sensor pulse','Q'],['Pause / resume','ESC'],['Controls / flight log','H L'],['Mute / fullscreen','M F']].map(([label,key])=>`<div class="control-row"><span>${label}</span><span>${key.split(' ').map(k=>`<kbd>${k}</kbd>`).join('')}</span></div>`).join('')}</div><p>Flight is relative to the forward corridor: A/D use lateral thrusters and arrow keys change altitude. Space flight preserves forward momentum. On the surface, A/D turn the rover. Guidance is optional; it tracks the marked target and brakes for you, but you still choose actions and operate the instruments.</p><div class="settings-row"><button class="outline-button" id="voice-toggle">VOICE ${audio.voice?'ON':'OFF'}</button><button class="outline-button" id="quality-toggle">GRAPHICS ${world.highQuality?'HIGH':'LOW'}</button><button class="primary-button" data-close><span>RETURN TO FLIGHT DECK</span><b>↗</b></button></div>`);
  $('#voice-toggle').onclick=e=>{audio.voice=!audio.voice;if(!audio.voice)audio.stopVoice();e.currentTarget.textContent='VOICE '+(audio.voice?'ON':'OFF');persistSettings();};
  $('#quality-toggle').onclick=e=>{world.setQuality(!world.highQuality);e.currentTarget.textContent='GRAPHICS '+(world.highQuality?'HIGH':'LOW');persistSettings();};
}
function journalDialog(){
  if(dialogKind&&dialogKind!=='pause')return;pauseForDialog();const entries=sim?.journal||lastJournal;
  showDialog('journal',`${header('EXPEDITION ARCHIVE','THE FLIGHT LOG.',true)}<div class="journal-list">${entries.length?entries.map(entry=>`<article class="journal-entry"><small>CHAPTER ${entry.stage+1} · ${formatTime(entry.time)}</small><h3>${escape(entry.title)}</h3><p>${escape(entry.text)}</p></article>`).join(''):'<p>Your mission log is empty. Relay scans and recovered samples will write the story of your expedition here.</p>'}</div><div class="dialog-footer"><span>RECORDS STORED ON THIS DEVICE</span><button class="outline-button" data-close>RETURN TO FLIGHT DECK</button></div>`);
}
function creditsDialog(){
  if(dialogKind)return;pauseForDialog();showDialog('credits',`${header('SCIENCE / ASSETS / MODEL','BUILT ON REAL CURIOSITY.',true)}<p>ODYSSEY is an independent Space Apps game. Planet imagery is based on space-agency observations. The expedition, station, dialogue, and discoveries are authored fiction. This game does not imply NASA endorsement.</p><div class="source-list"><a href="https://science.nasa.gov/3d-resources/mars/" target="_blank" rel="noopener">MARS TEXTURE · NASA / JPL / Caltech · Viking imagery, USGS processing ↗</a><a href="https://science.nasa.gov/3d-resources/jupiter/" target="_blank" rel="noopener">JUPITER TEXTURE · NASA 3D Resources ↗</a><a href="https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets" target="_blank" rel="noopener">EARTH & MOON TEXTURES · Three.js examples asset collection ↗</a><a href="${DESTINATIONS[selected].source}" target="_blank" rel="noopener">NASA PLANETARY SCIENCE · ${DESTINATIONS[selected].name} ↗</a><a href="https://www.spaceappschallenge.org/2026/" target="_blank" rel="noopener">NASA SPACE APPS CHALLENGE ↗</a></div><p>Simulation: local flight uses acceleration, inertial coasting, braking, collision spheres, and resource consumption. Journey distances and time are compressed. This is an arcade mission simulator, not an ephemeris, N-body solver, or certified trajectory planner. Vesta’s illustrative texture reuses lunar terrain. The ideal Δv display uses Tsiolkovsky’s rocket equation; ion-engine acceleration is intentionally exaggerated for play.</p><p>Three.js (MIT), Vite (MIT), bundled fonts (SIL OFL). Spacecraft, stations, terrain, interface, procedural soundscape, and mission narrative were created for this project. Optional browser speech synthesis provides crew voice, with captions always available.</p><button class="outline-button" data-close>BACK TO THE MISSION</button>`);
}
function formatTime(seconds){const n=Math.floor(seconds);return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function updateHud(){
  if(!sim)return;
  for(const key of ['hull','fuel','power']){$('#value-'+key).textContent=Math.round(sim[key]);$('#bar-'+key).style.width=sim[key]+'%';$('#resource-'+key).classList.toggle('warning',sim[key]<25);}
  $('#repair-count').textContent=String(sim.repairs).padStart(2,'0');$('#repair-button').disabled=sim.repairs===0||sim.hull>=99;
  const linkQuality=clamp(Math.round(100-sim.range*.055+(sim.route==='science'?5:0)),18,99);$('#value-comms').textContent=linkQuality;$('#bar-comms').style.width=linkQuality+'%';
  $('#speed-value').textContent=sim.speed.toFixed(1);$('#heat-value').textContent=Math.round(sim.heat)+'%';$('#heat-value').style.color=sim.heat>80?'var(--red)':'';
  $('#range-value').innerHTML=Math.round(sim.range)+' <small>m</small>';$('#science-value').textContent=String(Math.round(sim.score)).padStart(3,'0');$('#elapsed').textContent=formatTime(sim.time);
  $('#assist-button').innerHTML=`GUIDANCE <b>${sim.assist?'ON':'OFF'}</b> <kbd>G</kbd>`;$('#assist-button').classList.toggle('active',sim.assist);
  $$('[data-route]').forEach(b=>b.classList.toggle('active',b.dataset.route===sim.route));$('#route-description').textContent={balanced:'Balanced allocation. Select a priority.',engine:'More thrust. Responsive maneuvering.',science:'Scanner speed increased by 55%.',shield:'Impact damage reduced by 55%.'}[sim.route];
  const guide=$('#approach-guide');guide.hidden=![3,5].includes(sim.stage)||sim.range>220||sim.mode!=='flight';
  if(!guide.hidden&&sim.target){const dx=sim.target.x-sim.position.x,dy=sim.target.y-sim.position.y;$('#approach-name').textContent=sim.stage===5?'DOCKING / RELATIVE MOTION':'LANDING / CAPTURE CORRIDOR';$('#approach-state').textContent=sim.canInteract?'CAPTURE READY':sim.speed>10?'BRAKE':'ALIGN';guide.classList.toggle('ready',sim.canInteract);$('#approach-dot').setAttribute('cx',80+clamp(dx,-65,65));$('#approach-dot').setAttribute('cy',50-clamp(dy,-40,40));$('#approach-values').textContent=`LATERAL ${Math.hypot(dx,dy).toFixed(1)} m · SPEED ${sim.speed.toFixed(1)} m/s`;}
  const prompt=$('#interact-prompt');prompt.hidden=sim.stage<2||!sim.target||sim.range>110;
  $('#interact-label').textContent=sim.canInteract?(sim.stage===5?'HOLD TO DOCK':sim.stage===3?'HOLD TO '+(sim.destination.surface?'LAND':'CAPTURE'):sim.isSurface?'HOLD TO COLLECT':'HOLD TO SCAN'):(sim.range>(sim.isSurface?24:sim.stage===2||sim.stage===4?65:35)?'MOVE CLOSER':'BRAKE TO STABILIZE');
  $('#scan-progress').style.width=clamp(sim.scan,0,1)*100+'%';
  if(sim.target){$('#marker-label').textContent=sim.target.name;$('#marker-range').textContent=Math.round(sim.range)+' M';$('#target-marker').classList.toggle('ready',!!sim.canInteract);}
}
function drawRadar(time){
  const c=radar,w=240,h=170,cx=120,cy=85;c.clearRect(0,0,w,h);c.strokeStyle='#709ea339';c.lineWidth=.7;
  for(const r of [23,46,69]){c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();}c.beginPath();c.moveTo(cx-78,cy);c.lineTo(cx+78,cy);c.moveTo(cx,cy-78);c.lineTo(cx,cy+78);c.stroke();
  c.save();c.translate(cx,cy);c.rotate(time*.65);const grad=c.createLinearGradient(0,0,70,0);grad.addColorStop(0,'#91dacc30');grad.addColorStop(1,'#91dacc02');c.fillStyle=grad;c.beginPath();c.moveTo(0,0);c.arc(0,0,69,-.35,0);c.closePath();c.fill();c.strokeStyle='#a3e0dc70';c.beginPath();c.moveTo(0,0);c.lineTo(69,0);c.stroke();c.restore();
  if(sim){const draw=(p,color,size)=>{let x=(p.x-sim.position.x)*.22,y=(p.z-sim.position.z)*.13;const len=Math.hypot(x,y);if(len>67){x=x/len*67;y=y/len*67;}c.fillStyle=color;c.shadowColor=color;c.shadowBlur=7;c.beginPath();c.arc(cx+x,cy+y,size,0,Math.PI*2);c.fill();c.shadowBlur=0;};sim.hazards.filter(h=>Math.abs(h.z-sim.position.z)<260).forEach(h=>draw(h,'#e7ad74',2));if(sim.target)draw(sim.target,'#baffdf',3);}
  c.fillStyle='#d6f4ef';c.beginPath();c.moveTo(cx,cy-5);c.lineTo(cx-3,cy+4);c.lineTo(cx+3,cy+4);c.closePath();c.fill();
}
function action(action){
  if(!sim||sim.mode!=='flight')return;
  if(action==='assist')sim.toggleAssist();if(action==='repair'&&!sim.repair())notify(sim.repairs?'HULL NOMINAL · No repair needed.':'NO REPAIR KITS REMAIN','warning');
  if(action==='pulse'&&!sim.scannerPulse())notify('SENSOR PULSE RECHARGING');
  if(action==='camera'){world.cameraMode=(world.cameraMode+1)%3;$('#camera-button').innerHTML=['CHASE CAM','COCKPIT','ORBIT CAM'][world.cameraMode]+' <kbd>C</kbd>';audio.cue('click');}
}
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{notify('Fullscreen is unavailable in this preview. Open the game in a browser.');}}

document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;audio.start();
  if(b.matches('[data-destination]')){selectDestination(Number(b.dataset.destination));audio.cue('click');}

  if(b.matches('[data-close]')){closeDialog();if(sim?.mode==='paused')sim.resume();}
  if(b.matches('[data-effect]')){const effect=b.dataset.effect;closeDialog();audio.stopVoice();sim.choose(effect);}
  if(b.matches('[data-route]')&&sim?.mode==='flight')sim.setRoute(b.dataset.route);
  if(b.matches('[data-menu]'))returnMenu();
  if(b.id==='launch-button'&&assembly?.ready)flightPlanDialog();
  if(b.id==='begin-stage'){closeDialog();sim.begin();}
  if(b.id==='resume-flight'){closeDialog();sim.resume();}
  if(b.id==='retry-button'){const checkpoint=sim.checkpoint;initializeFlight(checkpoint);}
  if(b.id==='pause-controls'){closeDialog();controlsDialog();}
});
$('#design-button').onclick=designDialog;
$('#resume-button').onclick=()=>{try{initializeFlight(savedCheckpoint);}catch{notify('The saved checkpoint could not be loaded. Start a new expedition.','warning');savedCheckpoint=null;$('#resume-button').hidden=true;}};
$('#home-button').onclick=$('#mission-nav').onclick=()=>{if(view==='flight'){if(!dialogKind)pauseMenu();}else if(dialogKind)closeDialog();};
$('#sound-button').onclick=soundToggle;$('#fullscreen-button').onclick=fullscreen;$('#pause-button').onclick=pauseMenu;
$('#controls-button').onclick=controlsDialog;$('#journal-button').onclick=journalDialog;$('#credits-button').onclick=creditsDialog;
$('#assist-button').onclick=()=>action('assist');$('#camera-button').onclick=()=>action('camera');$('#repair-button').onclick=()=>action('repair');$('#pulse-button').onclick=()=>action('pulse');

const keymap={KeyW:'forward',KeyS:'brake',KeyA:'left',KeyD:'right',ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Space:'boost',KeyE:'interact'};
document.addEventListener('keydown',e=>{
  if(e.code==='KeyM'&&!e.repeat&&!e.target.matches('input,select,textarea')){e.preventDefault();soundToggle();return;}
  if(dialogKind==='design'&&/^Digit[1-4]$/.test(e.code)&&!e.target.matches('input,select,textarea')){e.preventDefault();const slot=Number(e.code.slice(-1))-1;assembly?.selectSlot(slot);$(`[data-slot="${slot}"]`)?.focus();return;}
  if(e.code==='Tab'&&dialogKind){const buttons=[...$('#dialog').querySelectorAll('button:not(:disabled),select,a[href],summary,input')].filter(el=>el.getClientRects().length>0);const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}return;}
  if(e.code==='Escape'){e.preventDefault();if(dialogKind==='pause'){closeDialog();sim?.resume();}else if(['controls','journal','credits','design','planning'].includes(dialogKind)){closeDialog();if(sim?.mode==='paused')sim.resume();}else if(!dialogKind&&view==='flight')pauseMenu();return;}
  if(dialogKind){if(dialogKind==='event'&&['Digit1','Digit2'].includes(e.code)&&!e.repeat){e.preventDefault();$$('[data-effect]')[e.code==='Digit1'?0:1]?.click();}return;}
  if(e.target.matches('input,select,textarea'))return;
  if(!e.repeat){
    if(e.code==='KeyM'){e.preventDefault();soundToggle();return;}
    if(e.code==='KeyF'){e.preventDefault();fullscreen();return;}
    if(e.code==='KeyH'){e.preventDefault();controlsDialog();return;}
    if(e.code==='KeyL'){e.preventDefault();journalDialog();return;}
  }
  if(view==='menu'){
    if(['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();selectDestination(selected+(e.code==='ArrowRight'?1:-1));audio.cue('click');}
    if(e.code==='Enter'&&(e.target===document.body||e.target.matches('.destination-card,#design-button'))){e.preventDefault();designDialog();}return;
  }
  if(sim?.mode==='flight'){
    if(keymap[e.code]){e.preventDefault();let mapped=keymap[e.code];if(sim.isSurface&&e.code==='ArrowUp')mapped='forward';if(sim.isSurface&&e.code==='ArrowDown')mapped='brake';keys[mapped]=true;}
    if(!e.repeat){const map={KeyG:'assist',KeyC:'camera',KeyR:'repair',KeyQ:'pulse'};if(map[e.code]){e.preventDefault();action(map[e.code]);}if(['Digit1','Digit2','Digit3'].includes(e.code)){e.preventDefault();sim.setRoute(['engine','science','shield'][Number(e.code.slice(-1))-1]);}}
  }
});
document.addEventListener('keyup',e=>{if(keymap[e.code]){keys[keymap[e.code]]=false;if(e.code==='ArrowUp')keys.forward=false;if(e.code==='ArrowDown')keys.brake=false;}});
addEventListener('blur',()=>{keys={};if(sim?.mode==='flight'&&!dialogKind)pauseMenu();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys={};audio.stopVoice();if(sim?.mode==='flight'&&!dialogKind)pauseMenu();}});
$$('[data-key]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();audio.start();b.setPointerCapture(e.pointerId);let key=b.dataset.key;if(sim?.isSurface&&key==='up')key='forward';if(sim?.isSurface&&key==='down')key='brake';b.activeKey=key;keys[key]=true;};b.onpointerup=b.onpointercancel=()=>{keys[b.activeKey||b.dataset.key]=false;};});

function tick(now){
  const dt=Math.min((now-lastFrame)/1000,.1);lastFrame=now;accumulator+=dt;
  while(accumulator>=1/60){sim?.step(1/60,keys);accumulator-=1/60;}
  assembly?.update(dt);if(!assembly)world.update(dt,view==='flight'?sim:null);audio.update(dt,sim);
  if(view==='menu')$('#planet-rotation').textContent=(world.planet.rotation.y*180/Math.PI%360).toFixed(1).padStart(5,'0')+'°';
  else if(sim){
    if(now-lastHud>90){updateHud();drawRadar(now/1000);lastHud=now;}
    const p=world.projectTarget(sim);const marker=$('#target-marker');marker.hidden=!p||sim.mode!=='flight';
    if(p){marker.style.left=clamp(p.x,innerWidth<800?35:260,innerWidth-(innerWidth<800?35:275))+'px';marker.style.top=clamp(p.y,150,innerHeight-230)+'px';marker.style.opacity=p.behind?'.3':'1';}
    typed=Math.min(transcript.length,typed+dt*48);$('#comm-text').textContent=transcript.slice(0,Math.floor(typed));if(typed>=transcript.length)$('#comm-state').textContent='TRANSMISSION RECEIVED';
    if(sim.mode==='flight'&&sim.stage===0&&sim.campaign){$('#flight-tip').innerHTML=sim.assist?'GUIDANCE ENGAGED · Watch the ship track gates. Press <kbd>G</kbd> to take control.':sim.stageTime<8?'FIRST MANEUVER · Hold <kbd>W</kbd> to thrust toward the navigation gate.':sim.stageTime<16?'INERTIA · Release <kbd>W</kbd> to coast. Hold <kbd>S</kbd> to brake.':'ALIGN WITH THE GATE · <kbd>A</kbd><kbd>D</kbd> lateral · <kbd>↑</kbd><kbd>↓</kbd> altitude · <kbd>G</kbd> guidance';}
    if(sim.mode==='flight'&&sim.scan>0&&keys.interact){scanSound+=dt;if(scanSound>.5){audio.cue('scan');scanSound=0;}}
  }
  requestAnimationFrame(tick);
}
try{
  world=new SpaceWorld($('#world'));world.setQuality(settings.quality!==false);buildCards();selectDestination(2);updateAudioButton();$('#resume-button').hidden=!savedCheckpoint;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)world.mouse={x:0,y:0};
  world.ready.then(()=>{setTimeout(()=>{$('#loading').classList.add('done');setTimeout(()=>{$('#loading').hidden=true;},850);},400);});
  requestAnimationFrame(tick);
}catch(error){$('#loading-text').textContent='3D INITIALIZATION FAILED';const details=document.createElement('pre');details.className='error-detail';details.textContent='This game needs WebGL 2 and a current Chrome, Edge, or Firefox browser. Enable hardware acceleration and reload.\n\n'+error.message;$('#loading').append(details);console.error(error);}
