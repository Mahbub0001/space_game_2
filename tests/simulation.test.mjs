import test from 'node:test';
import assert from 'node:assert/strict';
import {Simulation} from '../src/simulation.js';
import {designStats,DESTINATIONS} from '../src/data.js';

test('Mission design enforces mass and budget limits and uses rocket equation',()=>{
  const nominal=designStats([0,1,1,1]);assert.equal(nominal.valid,true);assert.equal(nominal.mass,65);
  assert.ok(nominal.deltaV>2&&nominal.deltaV<3);assert.equal(designStats([2,2,2,2]).valid,false);
});
test('Thrust, inertial coast, and counter-thrust change the actual vehicle velocity',()=>{
  const s=new Simulation();s.begin();for(let i=0;i<120;i++)s.step(1/60,{forward:true});const velocity=s.speed;const z=s.position.z;
  for(let i=0;i<60;i++)s.step(1/60,{});assert.ok(s.position.z<z-velocity*.9);
  for(let i=0;i<30;i++)s.step(1/60,{brake:true});assert.ok(s.speed<velocity);
});
test('Scanning requires proximity, low velocity, and sustained interaction',()=>{
  const s=new Simulation();s.stage=2;s.setupStage();s.begin();s.position={...s.target,x:s.target.x+10};
  for(let i=0;i<180;i++)s.step(1/60,{});assert.equal(s.targetIndex,0);
  s.speedCommand=30;s.step(1/60,{interact:true});assert.equal(s.scan,0);
  s.speedCommand=0;s.velocity={x:0,y:0,z:0};for(let i=0;i<280;i++)s.step(1/60,{interact:true});assert.equal(s.targetIndex,1);
});
test('Collision, shield allocation and repairs have measurable consequences',()=>{
  const a=new Simulation(),b=new Simulation();b.route='shield';a.damage(30);b.damage(30);assert.ok(b.hull>a.hull);a.begin();assert.ok(a.repair());assert.equal(a.repairs,1);assert.ok(a.hull>90);
});
test('Pause freezes the simulation and checkpoints retain stage resources',()=>{
  const s=new Simulation();s.begin();s.step(1/60,{forward:true});s.pause();const p={...s.position},time=s.time;s.step(.05,{forward:true});assert.deepEqual(s.position,p);assert.equal(s.time,time);
  s.stage=3;s.hull=73;s.setupStage();const restored=Simulation.restore(s.serialize());assert.equal(restored.stage,3);assert.equal(restored.hull,73);assert.equal(restored.mode,'briefing');assert.throws(()=>Simulation.restore({version:1}));
});
test('Interplanetary burns consume reserves and propulsion choice changes the margin',()=>{
  const chemical=new Simulation({loadout:[0,1,1,1]}),ion=new Simulation({loadout:[1,1,1,1]});
  for(const s of [chemical,ion]){s.mode='transition';s.advance();}
  assert.equal(chemical.fuel,82);assert.ok(ion.fuel>chemical.fuel+7);assert.equal(chemical.power,92);
});
test('Depleted power and destroyed hull lead to recoverable mission failure',()=>{
  const a=new Simulation();a.begin();a.power=.00001;a.step(1/60,{});assert.equal(a.mode,'failed');
  const b=new Simulation();b.damage(10000);assert.equal(b.mode,'failed');assert.equal(b.hull,0);
  const checkpoint=Simulation.restore(b.checkpoint);assert.equal(checkpoint.hull,100);assert.equal(checkpoint.mode,'briefing');
});
for(const destination of DESTINATIONS){test(`${destination.name}: all six stages, narrative choices, and return can be completed`,()=>{
  const s=new Simulation({destination:destination.id});s.assist=true;let ticks=0;
  while(s.mode!=='complete'&&s.mode!=='failed'&&ticks++<65000){
    if(s.mode==='briefing')s.begin();
    else if(s.mode==='transition')s.advance();
    else if(s.mode==='event')s.choose(s.stage===1?'shelter':'archive');
    else s.step(1/60,{interact:true});
  }
  assert.equal(s.mode,'complete',`Stuck in stage ${s.stage}, target ${s.targetIndex}, range ${s.range}, speed ${s.speed}, mode ${s.mode}`);
  assert.ok(s.score>130);assert.equal(s.journal.length,8);assert.equal(s.fullArchive,true);assert.ok(s.hull>0);
});}

test('Re-entry intensity triggers on high descent speed in atmospheric stage', () => {
  const sim = new Simulation({destination: 'mars'});
  sim.stage = 3;
  sim.position = {x: 0, y: 40, z: -200};
  sim.velocity = {x: 0, y: -26, z: 0}; // 26 m/s descent
  sim.update(0.5);
  assert.ok(sim.reentryIntensity > 0.2, 'Re-entry intensity should be active above 18 m/s in stage 3');
});

test('Martian surface triggers dynamic dust storm and battery drain', () => {
  const sim = new Simulation({destination: 'mars'});
  sim.stage = 4;
  sim.stageTime = 25; // 25 seconds into surface traversal
  sim.update(0.5);
  assert.strictEqual(sim.stormActive, true, 'Storm should become active after 20s');
  assert.ok(sim.stormIntensity > 0, 'Storm intensity should ramp up');
});

test('Alert state escalates to critical when hull or heat reaches dangerous threshold', () => {
  const sim = new Simulation();
  sim.hull = 20; // Critical threshold
  sim.update(0.1);
  assert.strictEqual(sim.alertLevel, 'critical');
});

test('Alert and storm state changes emit events', () => {
  const events = [];
  const sim = new Simulation({destination: 'mars', onEvent: e => events.push(e)});
  sim.hull = 20;
  sim.update(0.1);
  assert.ok(events.some(e => e.type === 'alertStateChange' && e.level === 'critical'));

  sim.stage = 4;
  sim.stageTime = 25;
  sim.update(0.5);
  assert.ok(events.some(e => e.type === 'stormStateChange' && e.active === true));
});

