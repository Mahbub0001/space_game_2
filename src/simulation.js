import {DESTINATIONS,STAGES,designStats,clamp} from './data.js';

export function seeded(seed=1287){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const point=(x,y,z)=>({x,y,z});
export class Simulation {
  constructor({destination='mars',loadout=[0,1,1,1],difficulty='explorer',onEvent=()=>{}}={}) {
    this.destination=DESTINATIONS.find(d=>d.id===destination)||DESTINATIONS[2];
    this.loadout=[...loadout]; this.stats=designStats(loadout); this.difficulty=difficulty; this.onEvent=onEvent;
    this.stage=0; this.mode='briefing';this.time=0;this.stageTime=0;this.score=0;this.hull=100;this.fuel=100;
    this.power=100;this.repairs=2;this.route='balanced';this.assist=false;this.eventFlags={};this.journal=[];this.collisions=0;
    this.scan=0;this.targetIndex=0;this.heat=0;this.immunity=0;this.pulse=0;this.fullArchive=false;
    this.setupStage();
  }
  emit(type,data={}){this.onEvent({type,...data});}
  get isSurface(){return this.stage===4&&this.destination.surface;}
  get target(){return this.targets[this.targetIndex];}
  get range(){return this.target?distance(this.position,this.target):0;}
  get speed(){return Math.hypot(this.velocity.x,this.velocity.y,this.velocity.z);}
  get missionProgress(){return (this.stage+this.targetIndex/Math.max(1,this.targets.length))/6;}
  setupStage(){
    this.stageTime=0;this.targetIndex=0;this.scan=0;this.canInteract=false;this.speedCommand=0;this.heat=0;this.heading=0;this.stranded=0;
    this.position=point(0,this.isSurface?0:8,60);this.velocity=point(0,0,0);this.immunity=2;
    const names=['NAVIGATION GATE 01','NAVIGATION GATE 02','DEPARTURE VECTOR'];
    const make=(p,i,name)=>({...point(...p),name:name||names[i],done:false});
    if(this.stage===0) this.targets=[[0,8,-160],[30,24,-390],[-18,8,-680]].map((p,i)=>make(p,i));
    if(this.stage===1) this.targets=[[-28,25,-240],[32,-8,-570],[0,15,-940]].map((p,i)=>make(p,i,['DEBRIS CORRIDOR A','DEBRIS CORRIDOR B','TRANSFER EXIT'][i]));
    if(this.stage===2) this.targets=[[-28,14,-230],[40,30,-490],[-12,-5,-780]].map((p,i)=>make(p,i,['RELAY ALPHA','RELAY BRAVO','SOURCE TRIANGULATION'][i]));
    if(this.stage===3) this.targets=[make([0,-10,-540],0,this.destination.surface?'LANDING ZONE / LZ-01':'PROBE CAPTURE ZONE')];
    if(this.stage===4) this.targets=(this.isSurface?[[-45,0,-75],[50,0,-170],[-10,0,-295]]:[[-35,15,-190],[35,-10,-420],[0,5,-650]]).map((p,i)=>make(p,i,['MINERAL SURVEY','CONTEXT SAMPLE','STATION RECORDER'][i]));
    if(this.stage===5) this.targets=[make([0,8,-610],0,'KEPLER RECOVERY STATION')];
    this.hazards=[];const random=seeded(2801+this.stage*37+this.destination.difficulty);
    const count=this.stage===1?70:this.stage===0?8:this.stage===2?18:this.stage===5?10:0;
    for(let i=0;i<count;i++){
      const z=-80-random()*(this.stage===1?920:760),x=(random()-.5)*310,y=(random()-.5)*160;
      // Keep some clear space around survey targets; the debris corridor is deliberately navigable.
      const safe=this.targets.every(t=>Math.hypot(t.x-x,t.y-y,t.z-z)>60);
      if(safe)this.hazards.push({x,y,z,radius:3+random()*9,rotation:random()*Math.PI,spin:(random()-.5)*.3});
    }
    if(this.stage===1)this.hazards.push({x:0,y:8,z:-110,radius:11,rotation:0,spin:.1});
    if(this.isSurface)for(let i=0;i<20;i++){const x=(random()-.5)*270,z=-random()*350;const p={x,y:0,z,radius:2+random()*3,rotation:random()*6,spin:0};if(this.targets.every(t=>distance(t,p)>32))this.hazards.push(p);}
    this.checkpoint=this.serialize();
  }
  begin(){if(this.mode==='briefing'){this.mode='flight';this.emit('begin');}}
  setRoute(route){this.route=route;this.emit('route',{route});}
  toggleAssist(){this.assist=!this.assist;this.emit('assist',{active:this.assist});}
  repair(){if(this.mode!=='flight'||this.repairs<=0||this.hull>=99)return false;this.repairs--;this.hull=clamp(this.hull+30,0,100);this.power=clamp(this.power-4,0,100);this.emit('repair');return true;}
  scannerPulse(){if(this.mode!=='flight'||this.pulse>0||this.power<2)return false;this.pulse=4;this.power-=1.5;this.emit('pulse');return true;}
  pause(){if(this.mode==='flight'){this.mode='paused';return true;}return false;}
  resume(){if(this.mode==='paused')this.mode='flight';}
  choose(effect){
    if(this.mode!=='event')return;
    if(effect==='shelter'){this.power-=6;this.eventFlags.shelter=true;this.log('Solar event','Arrays stowed. A shielded coast preserved the vehicle.');}
    if(effect==='observe'){this.damage(16,false);this.score+=12;this.log('Solar event','Particle data recorded; the vehicle absorbed additional radiation damage.');}
    if(effect==='archive'){this.power-=12;this.score+=22;this.fullArchive=true;this.log('The last transmission','The complete archive was recovered.');}
    if(effect==='return'){this.fuel=clamp(this.fuel+8,0,100);this.score+=8;this.log('Return margin','Essential samples secured; reserves preserved for the return.');}
    if(this.mode==='failed')return;
    this.power=clamp(this.power,0,100);this.mode='flight';this.emit('choice',{effect});
    if(effect==='archive'||effect==='return')this.finishStage();
  }
  log(title,text){const entry={title,text,stage:this.stage,time:this.time};this.journal.push(entry);this.emit('log',{entry});}
  damage(amount,collision=true){
    const shield=this.route==='shield'?.45:1;
    this.hull=clamp(this.hull-amount*this.stats.armor*shield*(this.difficulty==='explorer'?.7:1),0,100);
    if(collision){this.collisions++;this.immunity=2;this.velocity.x*=-.7;this.velocity.y*=-.7;this.velocity.z*=.55;this.speedCommand*=.55;this.emit('impact',{amount});}
    if(this.hull<=0)this.fail('HULL INTEGRITY LOST','The vehicle can no longer maintain a safe flight. Return to the stage checkpoint and approach more carefully.');
  }
  fail(title,message){if(this.mode==='failed')return;this.mode='failed';this.emit('failed',{title,message});}
  finishStage(){
    this.score+=8;this.mode=this.stage===5?'complete':'transition';
    if(this.stage===5)this.emit('complete');else this.emit('stageComplete',{stage:this.stage});
  }
  advance(){
    if(this.mode!=='transition')return;this.stage++;
    // Macro burns represent the off-screen transfer/insertion/ascent legs, not local input alone.
    const burn=[0,18,7,10,2,18][this.stage];const housekeeping=[0,8,7,4,6,9][this.stage];
    this.fuel=clamp(this.fuel-burn*this.stats.efficiency,0,100);
    this.power=clamp(this.power-housekeeping*(110/this.stats.power),0,100);
    this.setupStage();this.mode='briefing';this.emit('stage',{stage:this.stage});
  }
  completeTarget(){
    const target=this.target;target.done=true;this.score+=this.stage<2?4:Math.round(10*this.stats.yield);
    this.scan=0;this.targetIndex++;this.emit('target',{name:target.name});
    if(this.stage===2)this.log(target.name,['Carrier isolated. Signal strength measured at a known position.','Second bearing acquired. The intersection constrains the source.','Third bearing confirms the lost station. Landing coordinates resolved.'][this.targetIndex-1]);
    if(this.stage===4)this.log(target.name,['Mineral spectrum and sample position recorded.','Context documented. Sample sealed for later analysis.',this.destination.discovery][this.targetIndex-1]);
    if(this.targetIndex>=this.targets.length){
      if(this.stage===4&&!this.eventFlags.recorder){this.eventFlags.recorder=true;this.mode='event';this.emit('event',{id:'recorder'});}else this.finishStage();
    }
  }
  step(rawDt,keys={}){
    if(this.mode!=='flight')return;
    const dt=clamp(rawDt,0,.06);this.time+=dt;this.stageTime+=dt;this.immunity=Math.max(0,this.immunity-dt);this.pulse=Math.max(0,this.pulse-dt);
    if(this.stage===1&&this.stageTime>12&&!this.eventFlags.flare){this.eventFlags.flare=true;this.mode='event';this.emit('event',{id:'flare'});return;}
    const t=this.target;if(!t)return;
    const beforeZ=this.position.z;const surface=this.isSurface;
    const boost=keys.boost&&this.fuel>0&&this.heat<98&&!surface;
    const thrust=this.stats.thrust*(this.route==='engine'?1.25:1)*(this.hull<25?.65:1);
    this.heat=clamp(this.heat+(boost?24:-17)*dt,0,100);
    if(surface){
      let drive=(keys.forward?1:0)-(keys.brake?1:0),turn=(keys.right?1:0)-(keys.left?1:0);
      if(this.assist){const desired=Math.atan2(t.x-this.position.x,-(t.z-this.position.z));let difference=((desired-this.heading+Math.PI*3)%(Math.PI*2))-Math.PI;turn=clamp(difference*2,-1,1);drive=this.range>17?1:0;}
      const traction=clamp(Math.sqrt(this.destination.gravity/3.71),.35,1.3);
      this.heading+=turn*dt*1.45*(.7+.3*traction);
      this.speedCommand=clamp(this.speedCommand+drive*dt*12*traction,-7,19);
      if(!drive)this.speedCommand*=Math.exp(-dt*3*traction);
      if(keys.interact&&this.range<24)this.speedCommand*=Math.exp(-dt*7);
      this.velocity.x=Math.sin(this.heading)*this.speedCommand;this.velocity.z=-Math.cos(this.heading)*this.speedCommand;this.velocity.y=0;
    }else{
      let forward=(keys.forward?1:0),brake=(keys.brake?1:0),sx=(keys.right?1:0)-(keys.left?1:0),sy=(keys.up?1:0)-(keys.down?1:0);
      if(this.assist){
        sx=clamp((t.x-this.position.x)*.07-this.velocity.x*.11,-1,1);sy=clamp((t.y-this.position.y)*.07-this.velocity.y*.11,-1,1);
        const desired=this.stage<2?43:clamp((this.range-27)*.38,0,43);
        const direction=t.z<this.position.z?1:-1;
        const diff=desired*direction-this.speedCommand;
        forward=diff>1?1:0;brake=diff<-.8?1:0;
      }
      const accel=16*thrust;
      if(forward&&this.fuel>0)this.speedCommand+=accel*dt;
      if(brake)this.speedCommand-=accel*1.8*dt;
      if(boost)this.speedCommand+=accel*2.3*dt;
      this.speedCommand=clamp(this.speedCommand,-18,boost?100:62);
      if(!boost&&this.speedCommand>62)this.speedCommand-=18*dt;
      this.velocity.x=(this.velocity.x+sx*27*thrust*dt)*Math.exp(-dt*1.7);
      this.velocity.y=(this.velocity.y+sy*25*thrust*dt)*Math.exp(-dt*1.7);
      this.velocity.z=-this.speedCommand;
      if(forward||brake||boost||sx||sy)this.fuel=clamp(this.fuel-dt*this.stats.efficiency*(boost?1.05:.075),0,100);
    }
    for(const axis of ['x','y','z'])this.position[axis]+=this.velocity[axis]*dt;
    if(surface)this.position.y=0;
    else{this.position.x=clamp(this.position.x,-360,360);this.position.y=clamp(this.position.y,-150,220);}
    let powerDrain=(surface?.035:.019)+(this.route==='shield'?.05:this.route==='science'?.035:0);
    if(this.loadout[1]===0&&this.destination.id==='jupiter')powerDrain*=3;
    this.power=clamp(this.power-powerDrain*dt*(110/this.stats.power),0,100);
    if(this.power<=0){this.fail('BATTERY EXHAUSTED','All operating reserves have been used. Choose a stronger power system or conserve scanning power.');return;}
    if(this.fuel<=0&&!surface){this.stranded=(this.stranded||0)+dt;if(this.stranded>12){this.fail('PROPELLANT DEPLETED','You can coast, but cannot control the approach. Restart from the last checkpoint and reduce boost usage.');return;}}
    if(this.immunity<=0)for(const h of this.hazards){if(distance(this.position,h)<h.radius+4){this.damage(18+this.speed*.15);break;}}
    if(this.mode!=='flight')return;
    const range=this.range;
    if(this.stage<2){
      const crossed=beforeZ>=t.z&&this.position.z<=t.z;
      if((range<25)||(crossed&&Math.hypot(this.position.x-t.x,this.position.y-t.y)<30))this.completeTarget();
      else if(this.position.z<t.z-55){t.z=this.position.z-200;this.score=Math.max(0,this.score-2);this.emit('miss');}
    }else{
      const maxRange=surface?24:this.stage===2||this.stage===4?65:35;
      const maxSpeed=surface?4:this.stage===5?8:this.stage===3?10:12;
      this.canInteract=range<maxRange&&this.speed<maxSpeed;
      if(keys.interact&&this.canInteract){
        const scanRate=this.stage===2||this.stage===4?this.stats.scan:1;
        this.scan+=dt/(surface?3.4:4)*scanRate*(this.route==='science'?1.55:1);
        this.power=clamp(this.power-dt*.16,0,100);
        if(this.scan>=1)this.completeTarget();
      }else this.scan=Math.max(0,this.scan-dt*.11);
      if(!surface&&this.position.z<t.z-100){t.z=this.position.z-180;this.emit('miss');}
    }
  }
  serialize(){return {version:2,destination:this.destination.id,loadout:[...this.loadout],difficulty:this.difficulty,stage:this.stage,hull:this.hull,fuel:this.fuel,power:this.power,score:this.score,repairs:this.repairs,time:this.time,collisions:this.collisions,eventFlags:{...this.eventFlags},journal:[...this.journal],fullArchive:this.fullArchive};}
  static restore(saved,onEvent){
    if(!saved||saved.version!==2||!Number.isInteger(saved.stage)||saved.stage<0||saved.stage>5||!Array.isArray(saved.loadout)||saved.loadout.length!==4||saved.loadout.some(x=>!Number.isInteger(x)||x<0||x>2))throw new Error('Invalid checkpoint');
    const sim=new Simulation({...saved,onEvent});
    for(const key of ['stage','hull','fuel','power','score','repairs','time','collisions','fullArchive'])if(saved[key]!==undefined)sim[key]=saved[key];
    sim.eventFlags={...saved.eventFlags};sim.journal=[...(saved.journal||[])];sim.setupStage();sim.mode='briefing';return sim;
  }
}
