import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {seeded} from './simulation.js';

const CYAN=0x81e6ff;
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
export const groundHeight=(x,z)=>Math.sin(x*.017)*Math.cos(z*.011)*5+Math.sin(z*.023+x*.008)*2+Math.max(0,Math.abs(x)-170)*.14*(.7+Math.sin(z*.009+x*.004)*.3)+Math.max(0,-z-620)*.1*(.6+Math.cos(x*.01)*.3);
function detailTexture(kind='rock'){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d'),random=seeded(kind==='hull'?121:925);
  if(kind==='hull'){
    c.fillStyle='#8b999e';c.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=64)for(let x=0;x<512;x+=128){const v=130+Math.floor(random()*60);c.fillStyle=`rgb(${v},${v+5},${v+8})`;c.fillRect(x+2,y+2,123,59);c.fillStyle='#4a6068';c.fillRect(x+7,y+8,23,3);c.fillStyle='#d2d8d8';c.fillRect(x+91,y+48,23,1);for(let j=0;j<4;j++){c.fillStyle='#445963';c.fillRect(x+8+j*7,y+48,3,5);}}
  }else{
    const data=c.createImageData(512,512);
    for(let y=0;y<512;y++)for(let x=0;x<512;x++){const i=(y*512+x)*4;const wave=Math.sin(x*.17+Math.sin(y*.031)*8)*7+Math.sin(y*.052+x*.07)*9;const n=128+wave+(random()-.5)*70;data.data[i]=n;data.data[i+1]=n;data.data[i+2]=n;data.data[i+3]=255;}c.putImageData(data,0,0);
    for(let i=0;i<250;i++){const x=random()*512,y=random()*512,r=1+random()*5;c.fillStyle=`rgba(18,20,20,${random()*.3})`;c.beginPath();c.ellipse(x,y,r,r*.6,random()*6,0,7);c.fill();}
  }
  const texture=new THREE.CanvasTexture(canvas);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function material(color,metalness=.5,roughness=.55){return new THREE.MeshStandardMaterial({color,metalness,roughness});}
function box(group,w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);group.add(m);return m;}
function cylinder(group,r1,r2,h,x,y,z,mat,axis='z',segments=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat);if(axis==='z')m.rotation.x=Math.PI/2;m.position.set(x,y,z);group.add(m);return m;}
function ring(group,r,t,x,y,z,mat){const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,64),mat);m.position.set(x,y,z);group.add(m);return m;}
function glowTexture(){const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(220,255,255,1)');g.addColorStop(.12,'rgba(100,225,255,.9)');g.addColorStop(.35,'rgba(40,150,255,.25)');g.addColorStop(1,'rgba(10,60,170,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);}
const EMISSIVE=new THREE.MeshStandardMaterial({color:CYAN,emissive:CYAN,emissiveIntensity:3,roughness:.2});
export function spacecraft(){
  const g=new THREE.Group(),white=material(0xc1ccd0,.55,.45),dark=material(0x152635,.8,.35),silver=material(0x627985,.8,.35),gold=material(0x9e7640,.75,.38),blue=material(0x113e65,.68,.4);
  white.map=detailTexture('hull');white.bumpMap=white.map;white.bumpScale=.025;
  cylinder(g,1.75,1.55,10,0,0,0,white);cylinder(g,1.6,.2,3.4,0,0,-6.4,white);
  box(g,2.4,1,2.2,0,1.4,-3.7,dark);box(g,1.95,.12,1.5,0,1.94,-3.7,blue);
  for(let z=-3;z<=4;z+=1.65){const band=ring(g,1.77,.095,0,0,z,silver);band.rotation.z=.2;}
  for(let side of [-1,1]){
    box(g,3.2,.4,2,side*2.8,-.15,1,silver);
    cylinder(g,.95,.95,7.7,side*3.25,-.05,1.2,silver);cylinder(g,.9,1.1,1.2,side*3.25,-.05,5.2,dark);
    for(let z=-1;z<=3.5;z+=2){cylinder(g,1,1,.32,side*3.25,-.05,z,gold);box(g,.6,.55,1.1,side*1.65,.9,z,dark);}
    cylinder(g,.9,.94,.4,side*3.25,-.05,5.9,dark);ring(g,.87,.08,side*3.25,-.05,6.12,silver);cylinder(g,.52,.65,.15,side*3.25,-.05,6.13,EMISSIVE);
    const wing=box(g,4.2,.13,4.8,side*6.25,0,.4,blue);wing.rotation.z=side*.08;
    for(let i=0;i<6;i++)box(g,.055,.16,4.8,side*(4.25+i*.78),.02,.4,gold);
    for(let i=0;i<5;i++)box(g,4.2,.16,.055,side*6.25,.02,-1.9+i*1.15,silver);
    box(g,.5,.55,2.6,side*2,-.9,-3.2,white);
    const nav=new THREE.Mesh(new THREE.SphereGeometry(.11,8,8),new THREE.MeshBasicMaterial({color:side>0?0x59f3b8:0xff625b}));nav.position.set(side*8.3,.2,-1.6);g.add(nav);
    for(let j=0;j<3;j++)box(g,.05,.16,.37,side*.62,1.54,-3.7+j*.42,EMISSIVE);
  }
  box(g,1.6,1.1,2.7,0,1.7,1.4,white);box(g,1.1,.1,2.1,0,2.3,1.4,gold);
  cylinder(g,.12,.12,3,0,3.4,2,silver,'y');const dish=new THREE.Mesh(new THREE.SphereGeometry(.9,16,8,0,Math.PI*2,0,Math.PI*.5),silver);dish.rotation.x=-Math.PI*.33;dish.position.set(0,4.8,2);g.add(dish);
  box(g,1.3,.7,1.8,0,-1.85,-.7,dark);
  const decalCanvas=document.createElement('canvas');decalCanvas.width=512;decalCanvas.height=128;const ctx=decalCanvas.getContext('2d');ctx.fillStyle='#d2dce0';ctx.fillRect(0,0,512,128);ctx.fillStyle='#152632';ctx.font='bold 48px monospace';ctx.fillText('ODYSSEY  07',32,75);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(3.1,.78),new THREE.MeshStandardMaterial({map:new THREE.CanvasTexture(decalCanvas)}));label.position.set(1.69,.3,-.8);label.rotation.y=Math.PI/2;g.add(label);
  const flames=[];const glow=glowTexture();
  for(let x of [-3.25,3.25]){
    const core=new THREE.Mesh(new THREE.ConeGeometry(.7,6,20,1,true),new THREE.MeshBasicMaterial({color:0x62d7ff,transparent:true,opacity:.44,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));core.rotation.x=Math.PI/2;core.position.set(x,-.05,8.8);g.add(core);flames.push(core);
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glow,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));sprite.position.set(x,0,6);sprite.scale.set(5,5,1);g.add(sprite);flames.push(sprite);
  }
  for(let side of [-1,1])for(let j=0;j<5;j++){box(g,.16,.09,.7,side*1.4,1.06,-2+j*1.2,silver);box(g,.42,.11,.17,side*.66,1.69,-1+j*.58,dark);}
  g.userData.flames=flames;g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;
}
function rover(){
  const g=new THREE.Group(),white=material(0xc2c6bc),dark=material(0x151d21),gold=material(0x9e793f),blue=material(0x113553);g.userData.wheels=[];
  box(g,4,1.2,5,0,1.6,0,white);box(g,3.8,.18,4.8,0,2.3,.2,gold);
  for(const side of [-1,1])for(let i=0;i<3;i++){const tire=cylinder(g,.87,.87,.65,side*2.5,.85,-1.8+i*1.8,dark,'y');tire.rotation.z=Math.PI/2;g.userData.wheels.push(tire);const hub=cylinder(g,.45,.45,.7,side*2.5,.85,-1.8+i*1.8,white,'y');hub.rotation.z=Math.PI/2;box(g,1.8,.15,.16,side*1.9,1.3,-1.8+i*1.8,gold);}
  cylinder(g,.1,.1,2.6,0,3.55,-1.3,white,'y');box(g,1.6,.65,.7,0,4.8,-1.3,white);box(g,1.25,.28,.08,0,4.86,-1.69,blue);
  box(g,4.7,.09,2,0,2.4,1.4,blue);for(let i=-2;i<=2;i++)box(g,.04,.1,2,i,2.46,1.4,gold);
  const sensor=new THREE.Mesh(new THREE.SphereGeometry(.12,8,8),EMISSIVE);sensor.position.set(-.5,4.8,-1.7);g.add(sensor);
  for(let side of [-1,1]){box(g,.6,.55,1.1,side*1.65,2.2,-1.7,gold);for(let j=0;j<6;j++)box(g,.06,.6,.06,side*2.86,.82,-1.8+(j%3)*1.8,dark);}
  g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return g;
}
function station(){const g=new THREE.Group(),white=material(0xb0c4ca),dark=material(0x243b4c),blue=material(0x173e62),gold=material(0xb09255);cylinder(g,5,5,18,0,0,0,white);const habitat=ring(g,21,2.2,0,0,4,white);for(let i=0;i<6;i++){const a=i*Math.PI/3;const arm=box(g,23,1.2,1.2,Math.cos(a)*10,Math.sin(a)*10,4,dark);arm.rotation.z=a;}ring(g,8,.5,0,0,13,EMISSIVE);for(const side of [-1,1]){box(g,30,.4,1,side*25,0,-3,dark);for(let j=0;j<3;j++){box(g,12,.16,19,side*(19+j*14),0,-3,blue);for(let k=-8;k<10;k+=3)box(g,12,.2,.07,side*(19+j*14),0,k-3,gold);}}return g;}
function satellite(){const g=new THREE.Group(),gold=material(0xb39459),blue=material(0x184b7a);box(g,4,3,4,0,0,0,gold);for(const side of [-1,1])box(g,9,.15,5,side*7,0,0,blue);cylinder(g,.08,.08,5,0,4,0,EMISSIVE,'y');return g;}
function outpost(){const g=new THREE.Group(),white=material(0xb5b5ac),dark=material(0x303333),blue=material(0x183454);for(let x of [-12,12]){cylinder(g,4,4,17,x,3,0,white);box(g,7,1,18,x,0,0,dark);box(g,7,.15,4,x,5,12,blue);}box(g,18,3,4,0,2,0,white);cylinder(g,.15,.2,13,18,7,-2,white,'y');const beacon=new THREE.Mesh(new THREE.SphereGeometry(.65,12,12),EMISSIVE);beacon.position.set(18,14,-2);g.add(beacon);return g;}

export class SpaceWorld {
  constructor(container){
    this.container=container;this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x02060d);
    this.camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,.1,18000);this.camera.position.set(15,9,88);
    this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.setSize(innerWidth,innerHeight);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.16;container.appendChild(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-label','Interactive 3D spacecraft and planetary simulation');
    this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));this.bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.4,.55,.91);this.composer.addPass(this.bloom);this.composer.addPass(new OutputPass());
    this.highQuality=true;this.time=0;this.cameraMode=0;this.mouse={x:0,y:0};this.shake=0;this.transitions=0;this.textures={};this.particles=[];
    this.ambient=new THREE.AmbientLight(0x7ea7c9,1.1);this.scene.add(this.ambient);
    this.sun=new THREE.DirectionalLight(0xffe4c6,3.6);this.sun.position.set(-60,55,90);this.scene.add(this.sun);this.scene.add(this.sun.target);
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.sun.shadow.mapSize.set(2048,2048);Object.assign(this.sun.shadow.camera,{left:-100,right:100,top:100,bottom:-100,near:1,far:500});this.sun.shadow.bias=-.00015;this.sun.shadow.normalBias=.08;
    this.rim=new THREE.DirectionalLight(0x659fc8,1.5);this.rim.position.set(40,-10,20);this.scene.add(this.rim);
    this.space=new THREE.Group();this.scene.add(this.space);this.createStars();
    this.planet=new THREE.Mesh(new THREE.SphereGeometry(1,96,64),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.94,metalness:0}));this.space.add(this.planet);
    this.atmosphere=new THREE.Mesh(new THREE.SphereGeometry(1.025,64,48),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.FrontSide,uniforms:{glowColor:{value:new THREE.Color(0x6996b7)}},vertexShader:'varying vec3 vN; varying vec3 vV; void main(){vec4 p=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'varying vec3 vN; varying vec3 vV; uniform vec3 glowColor; void main(){float f=pow(1.0-max(dot(vN,vV),0.0),4.5);gl_FragColor=vec4(glowColor,f*.55);}' }));this.space.add(this.atmosphere);
    this.orbits=new THREE.Group();this.space.add(this.orbits);for(let i=0;i<2;i++){const points=[];for(let j=0;j<=160;j++){const a=j/160*Math.PI*2;points.push(V(Math.cos(a)*(47+i*5),Math.sin(a)*11,Math.sin(a)*42));}const orbit=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x63949f,transparent:true,opacity:i?.12:.4}));orbit.rotation.z=i?.4:-.22;this.orbits.add(orbit);}
    this.ship=spacecraft();this.scene.add(this.ship);this.rover=rover();this.rover.visible=false;this.scene.add(this.rover);
    this.stageGroup=new THREE.Group();this.scene.add(this.stageGroup);this.targets=[];this.debris=[];
    this.scanWave=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:CYAN,wireframe:true,transparent:true,opacity:0,depthWrite:false}));this.scene.add(this.scanWave);
    this.loadTextures();this.menu=true;this.destination={id:'mars',color:'#efa678'};this.setDestination(this.destination);
    addEventListener('resize',()=>this.resize());addEventListener('pointermove',e=>{this.mouse.x=(e.clientX/innerWidth-.5)*2;this.mouse.y=(e.clientY/innerHeight-.5)*2;});
  }
  loadTextures(){let remaining=5;this.ready=new Promise(resolve=>{const done=()=>{if(--remaining===0)resolve();};const loader=new THREE.TextureLoader();for(const [key,file] of Object.entries({earth:'earth.jpg',mars:'mars.jpg',moon:'moon.jpg',asteroid:'moon.jpg',jupiter:'jupiter.jpg'})){loader.load(`./textures/${file}`,texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,this.renderer.capabilities.getMaxAnisotropy());this.textures[key]=texture;if(this.planetKey===key){this.planet.material.map=texture;this.planet.material.color.set(key==='mars'?0xecc6a1:0xffffff);this.planet.material.needsUpdate=true;}done();},undefined,()=>{console.warn('Texture unavailable:',file);done();});}});}
  createStars(){
    const random=seeded(4086),positions=[],colors=[];
    for(let i=0;i<4200;i++){const theta=random()*Math.PI*2,u=random()*2-1,r=6000+random()*5000;positions.push(r*Math.sqrt(1-u*u)*Math.cos(theta),r*u,r*Math.sqrt(1-u*u)*Math.sin(theta));const c=new THREE.Color().setHSL(.55+random()*.15,.12+random()*.3,.45+random()*.5);colors.push(c.r,c.g,c.b);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));this.stars=new THREE.Points(geo,new THREE.PointsMaterial({size:9,vertexColors:true,transparent:true,opacity:.82,sizeAttenuation:true}));this.scene.add(this.stars);
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#02050c';ctx.fillRect(0,0,1024,512);
    for(let i=0;i<40;i++){const x=random()*1024,y=210+Math.sin(x*.009)*85+(random()-.5)*80,r=40+random()*140;const grad=ctx.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,i%3?'rgba(21,42,64,.16)':'rgba(60,38,60,.13)');grad.addColorStop(1,'transparent');ctx.fillStyle=grad;ctx.fillRect(x-r,y-r,r*2,r*2);}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sky=new THREE.Mesh(new THREE.SphereGeometry(14000,32,16),new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide,depthWrite:false}));this.scene.add(sky);this.sky=sky;
  }
  setDestination(destination){this.destination=destination;this.setPlanet(destination.id);this.orbits.visible=true;this.menu=true;this.stageGroup.visible=false;this.rover.visible=false;this.ship.visible=true;this.scene.fog=null;this.ambient.intensity=.65;this.sun.intensity=3.5;this.renderer.shadowMap.enabled=false;this.sun.target.position.set(0,0,0);this.sun.position.set(-60,55,90);}
  setPlanet(id){this.planetKey=id;this.planet.material.map=this.textures[id]||null;this.planet.material.color.set(this.textures[id]?(id==='mars'?0xecc6a1:0xffffff):id==='mars'?0xba7753:0x819daa);this.planet.material.needsUpdate=true;this.atmosphere.material.uniforms.glowColor.value.set(id==='mars'?0xc68d60:id==='earth'?0x3e9de8:0x7392a2);}
  clearStage(){this.stageGroup.traverse(o=>{if(o.isMesh){o.geometry?.dispose();if(o.material!==EMISSIVE){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();}}});this.stageGroup.clear();this.targets=[];this.debris=[];}
  setupStage(sim){
    this.menu=false;this.clearStage();this.stageGroup.visible=true;this.orbits.visible=false;this.ship.visible=!sim.isSurface;this.rover.visible=sim.isSurface;this.scene.fog=null;this.planet.visible=true;this.atmosphere.visible=true;
    const surface=(sim.stage===3||sim.stage===4)&&sim.destination.surface;
    this.surfaceScene=surface;this.terrainBase=sim.stage===3?-48:0;
    this.setPlanet(sim.stage===0||sim.stage===5?'earth':sim.destination.id);
    this.ambient.intensity=surface?1.05:.75;this.sun.intensity=surface?3:3.5;
    this.renderer.shadowMap.enabled=surface&&this.highQuality;this.sun.castShadow=surface;
    if(surface){this.buildTerrain(sim);this.planet.visible=false;this.atmosphere.visible=false;this.scene.fog=new THREE.FogExp2(sim.destination.id==='mars'?0x8a6753:0x0b131c,sim.destination.id==='mars'?.00065:.0001);}
    sim.targets.forEach((t,i)=>{
      const group=new THREE.Group();group.position.set(t.x,t.y,t.z);
      const color=new THREE.MeshBasicMaterial({color:i?0x4b8999:0x92e9e8,transparent:true,opacity:i?.34:.87});
      let mark;
      if(sim.stage<2){mark=ring(group,25,.22,0,0,0,color);for(let j=0;j<4;j++){const arm=box(group,2.5,.45,.4,Math.cos(j*Math.PI/2)*25,Math.sin(j*Math.PI/2)*25,0,EMISSIVE);arm.rotation.z=j*Math.PI/2;}}
      else if(sim.isSurface){group.position.y=groundHeight(t.x,t.z);mark=ring(group,11,.14,0,.3,0,color);mark.rotation.x=-Math.PI/2;const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(i===2?2.5:1.8,1),material(i===2?0x688085:0x957a58));rock.position.y=1.3;group.add(rock);cylinder(group,.055,.055,13,0,7,0,EMISSIVE,'y');}
      else if(sim.stage===3&&surface){group.position.y=-10;cylinder(group,20,21,1.2,0,-11,0,material(0x4c5050),'y',48);for(const x of [-12,12])for(const z of [-12,12])cylinder(group,.6,.9,23,x,-23,z,material(0x656c69),'y');mark=ring(group,22,.23,0,0,0,color);const base=outpost();base.position.set(34,-28,-12);group.add(base);}
      else if(sim.stage===5){const dock=station();dock.position.z=-20;group.add(dock);mark=ring(group,14,.23,0,0,0,color);}
      else{group.add(satellite());mark=ring(group,15,.17,0,0,0,color);}
      group.userData.mark=mark;this.stageGroup.add(group);this.targets.push(group);
    });
    const rockGeo=new THREE.IcosahedronGeometry(1,2),rockMat=material(0x686964,.05,1);rockMat.map=detailTexture();rockMat.bumpMap=rockMat.map;rockMat.bumpScale=.18;
    const rp=rockGeo.attributes.position;for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),n=1+.14*Math.sin(x*12+y*4)*Math.cos(z*7)+.1*Math.sin(y*13+z*3);rp.setXYZ(i,x*n,y*n,z*n);}rockGeo.computeVertexNormals();
    for(const h of sim.hazards){const rock=new THREE.Mesh(rockGeo,rockMat);rock.position.set(h.x,surface?groundHeight(h.x,h.z)+h.radius*.4:h.y,h.z);rock.scale.set(h.radius,h.radius*.8,h.radius*1.18);rock.rotation.set(h.rotation,h.rotation*.7,h.rotation*1.3);rock.castShadow=surface;rock.receiveShadow=surface;this.stageGroup.add(rock);this.debris.push(rock);}
    this.camera.position.set(sim.position.x,sim.position.y+7,sim.position.z+30);this.camera.lookAt(sim.position.x,sim.position.y,sim.position.z-40);
  }
  buildTerrain(sim){
    const geo=new THREE.PlaneGeometry(2400,2400,120,120);geo.rotateX(-Math.PI/2);const a=geo.attributes.position;const colors=[];const base=new THREE.Color(sim.destination.id==='mars'?0x85604a:sim.destination.id==='moon'?0x626361:0x5f5c55);
    for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i)-450,y=groundHeight(x,z);a.setY(i,y+this.terrainBase);a.setZ(i,z);const c=base.clone().multiplyScalar(.7+(y+7)/20);colors.push(c.r,c.g,c.b);}geo.computeVertexNormals();geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const terrainTexture=detailTexture();terrainTexture.repeat.set(100,100);terrainTexture.anisotropy=8;
    const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,map:terrainTexture,bumpMap:terrainTexture,bumpScale:.6}));ground.receiveShadow=true;this.stageGroup.add(ground);
    const sky=new THREE.Mesh(new THREE.SphereGeometry(12000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color(sim.destination.id==='mars'?0x122032:0x01040a)},horizon:{value:new THREE.Color(sim.destination.id==='mars'?0x9a755d:0x06101a)}},vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vP;uniform vec3 top;uniform vec3 horizon;void main(){vec3 d=normalize(vP);float h=clamp(d.y*2.,0.,1.);vec3 c=mix(horizon,top,pow(h,.65));float s=max(dot(d,normalize(vec3(-.5,.24,-1.))),0.);c+=vec3(1.,.75,.48)*(pow(s,2000.)*2.+pow(s,35.)*.15);gl_FragColor=vec4(c,1.);}'}));this.stageGroup.add(sky);
    const random=seeded(8802),rockGeo=new THREE.DodecahedronGeometry(1,0),rockMat=material(sim.destination.id==='mars'?0x665348:0x5d6061,0,1);const rocks=new THREE.InstancedMesh(rockGeo,rockMat,260);const dummy=new THREE.Object3D();
    rockMat.map=detailTexture();rockMat.bumpMap=rockMat.map;rockMat.bumpScale=.35;
    for(let i=0;i<260;i++){const x=(random()-.5)*2000,z=(random()-.7)*2000,s=1+random()*9;dummy.position.set(x,groundHeight(x,z)+this.terrainBase+s*.2,z);dummy.scale.set(s,s*.7,s*1.15);dummy.rotation.set(random(),random()*6,random());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}rocks.castShadow=true;rocks.receiveShadow=true;this.stageGroup.add(rocks);
    if(sim.stage===4){const base=outpost();base.position.set(34,groundHeight(34,50),50);this.stageGroup.add(base);}
  }
  impact(){this.shake=1;const geometry=new THREE.BufferGeometry(),pos=[],vel=[];for(let i=0;i<55;i++){pos.push(this.ship.position.x,this.ship.position.y,this.ship.position.z);vel.push((Math.random()-.5)*30,(Math.random()-.5)*30,(Math.random()-.5)*30);}geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));const p=new THREE.Points(geometry,new THREE.PointsMaterial({color:0xffbf72,size:.25,transparent:true,blending:THREE.AdditiveBlending}));this.scene.add(p);this.particles.push({object:p,velocity:vel,life:1.2});}
  setQuality(high){this.highQuality=high;this.renderer.shadowMap.enabled=high&&!!this.surfaceScene;this.renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.6:1));this.resize();}
  resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.composer.setSize(innerWidth,innerHeight);}
  projectTarget(sim){if(!sim?.target)return null;const t=sim.target;const p=V(t.x,sim.isSurface?groundHeight(t.x,t.z)+10:t.y,t.z).project(this.camera);return {x:(p.x*.5+.5)*innerWidth,y:(-.5*p.y+.5)*innerHeight,behind:p.z>1};}
  update(dt,sim){
    this.time+=dt;const t=this.time;this.stars.rotation.y=t*.0007;this.planet.rotation.y+=dt*.018;
    if(this.menu){
      this.planet.position.set(0,0,-45);this.planet.scale.setScalar(this.destination.id==='asteroid'?29:36);this.planet.scale.y=this.destination.id==='asteroid'?26:36;this.atmosphere.position.copy(this.planet.position);this.atmosphere.scale.copy(this.planet.scale);this.planet.visible=true;this.atmosphere.visible=this.destination.id!=='asteroid';
      this.orbits.position.copy(this.planet.position);
      this.ship.position.set(14+Math.sin(t*.17)*1.2,-10+Math.sin(t*.65)*.5,4);this.ship.rotation.set(.12,1.05+Math.sin(t*.15)*.06,-.08);
      const destination=V(8+this.mouse.x*2,7-this.mouse.y*1.4,94);this.camera.position.lerp(destination,1-Math.exp(-dt*1.3));this.camera.lookAt(0,-1,-38);
    }else if(sim){
      const p=sim.position,surface=sim.isSurface;
      this.ship.position.set(p.x,p.y,p.z);this.ship.rotation.set(-sim.velocity.y*.007,-sim.velocity.x*.012,-sim.velocity.x*.025);
      if(surface){this.rover.position.set(p.x,groundHeight(p.x,p.z),p.z);this.rover.rotation.y=-sim.heading;this.rover.rotation.z=Math.sin(t*12)*Math.min(sim.speed*.0015,.025);if(sim.mode==='flight')this.rover.userData.wheels.forEach(w=>w.rotateY(sim.speed*dt/.87));}
      if(this.surfaceScene){this.sun.position.set(p.x-100,160,p.z+80);this.sun.target.position.set(p.x,0,p.z);if(sim.stage===3&&sim.scan>0&&sim.target){this.ship.position.lerp(V(sim.target.x,sim.target.y-8,sim.target.z),sim.scan);}}
      this.ship.visible=!surface&&this.cameraMode!==1;this.rover.visible=surface;
      const focal=V(p.x,p.y,p.z);const cam=V();
      if(surface){focal.y=groundHeight(p.x,p.z)+2;cam.set(p.x-Math.sin(sim.heading)*26,focal.y+7,p.z+Math.cos(sim.heading)*26);focal.add(V(Math.sin(sim.heading)*16,0,-Math.cos(sim.heading)*16));}
      else if(this.cameraMode===1){cam.set(p.x,p.y+1.7,p.z-6.5);focal.z-=90;}
      else if(this.cameraMode===2){cam.set(p.x+23,p.y+9,p.z+14);focal.z-=15;}
      else{cam.set(p.x*.98,p.y+8,p.z+35);focal.z-=28;focal.y+=2;}
      this.camera.position.lerp(cam,1-Math.exp(-dt*(this.cameraMode===1?18:5)));this.camera.lookAt(focal);
      if(this.shake>0){this.camera.position.add(V((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake,0));this.shake=Math.max(0,this.shake-dt*2);}
      this.camera.fov=THREE.MathUtils.lerp(this.camera.fov,sim.speed>65?59:46,dt*2);this.camera.updateProjectionMatrix();
      this.stars.position.copy(this.camera.position);this.sky.position.copy(this.camera.position);
      if(sim.stage===0){this.planet.position.set(0,-1250,-1300);this.planet.scale.setScalar(1130);}
      else if(sim.stage===1){this.planet.position.set(750,180,-2600);this.planet.scale.setScalar(260);}
      else if(sim.stage===5){this.planet.position.set(-550,-830,-1800);this.planet.scale.setScalar(920);}
      else{this.planet.position.set(350,-180,-1850);this.planet.scale.setScalar(790);}
      this.atmosphere.position.copy(this.planet.position);this.atmosphere.scale.copy(this.planet.scale);
      this.targets.forEach((group,i)=>{group.visible=i>=sim.targetIndex;const mark=group.userData.mark;if(mark){if(!surface)mark.rotation.z=t*.1;mark.material.opacity=i===sim.targetIndex?.85:.22;mark.material.color.set(i===sim.targetIndex?(sim.canInteract?0x8cffcd:CYAN):0x426270);}});
      if(!surface)this.debris.forEach((rock,i)=>{rock.rotation.x+=dt*sim.hazards[i].spin;rock.rotation.y+=dt*.05;});
      this.scanWave.position.copy(surface?this.rover.position:this.ship.position);if(sim.pulse>0){this.scanWave.visible=true;this.scanWave.scale.setScalar((4-sim.pulse)*48);this.scanWave.material.opacity=sim.pulse/12;}else this.scanWave.visible=false;
    }
    const engineScale=this.menu?1:sim?.speed?(.35+sim.speed/45):.14;this.ship.userData.flames.forEach((flame,i)=>{if(i%2===0)flame.scale.set(1,engineScale*(.9+Math.sin(t*42)*.1),1);else flame.material.opacity=.45+Math.sin(t*22)*.12;});
    for(let i=this.particles.length-1;i>=0;i--){const particle=this.particles[i];particle.life-=dt;const a=particle.object.geometry.attributes.position;for(let j=0;j<a.count;j++){a.setXYZ(j,a.getX(j)+particle.velocity[j*3]*dt,a.getY(j)+particle.velocity[j*3+1]*dt,a.getZ(j)+particle.velocity[j*3+2]*dt);}a.needsUpdate=true;particle.object.material.opacity=particle.life/1.2;if(particle.life<=0){this.scene.remove(particle.object);particle.object.geometry.dispose();particle.object.material.dispose();this.particles.splice(i,1);}}
    if(this.highQuality)this.composer.render();else this.renderer.render(this.scene,this.camera);
  }
}
