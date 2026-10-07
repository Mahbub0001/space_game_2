import * as T from 'three';

const mat=(c,e=0)=>new T.MeshStandardMaterial({color:c,metalness:.65,roughness:.35,emissive:e,emissiveIntensity:1.8});
function mesh(g,geo,m,x=0,y=0,z=0){const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
const box=(g,m,w,h,d,x=0,y=0,z=0)=>mesh(g,new T.BoxGeometry(w,h,d),m,x,y,z);
function cyl(g,m,r1,r2,l,x=0,y=0,z=0){const o=mesh(g,new T.CylinderGeometry(r1,r2,l,24),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
function ring(g,m,r,x,y,z){return mesh(g,new T.TorusGeometry(r,.09,8,48),m,x,y,z);}
export function disposeModel(g){g.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});}
export function vehicleBus(){
  const g=new T.Group(),white=mat(0xbac9d1),dark=mat(0x152937),gold=mat(0xb79355),cyan=mat(0x8edbff,0x258abd);
  cyl(g,white,1.45,1.45,8);cyl(g,white,.25,1.45,3,0,0,-5.5);
  box(g,dark,1.7,.4,2,0,1.3,-3.6);box(g,cyan,1.4,.06,1.25,0,1.52,-3.8);
  for(let z=-3;z<4;z+=1.3){ring(g,gold,1.48,0,0,z);for(const s of [-1,1])box(g,dark,.09,.09,7,s*1.12,.94,0);}
  for(const s of [-1,1]){cyl(g,white,.68,.68,6,s*2,0,.8);ring(g,gold,.71,s*2,0,2);ring(g,gold,.71,s*2,0,-1);}
  box(g,dark,2,.5,2,0,-1.5,0);g.userData.flames=[];g.userData.modules=[];return g;
}
export function vehicleModule(slot,choice){
  const g=new T.Group(),white=mat(0xc6d2d6),dark=mat(0x182c3a),gold=mat(0xa8874a),blue=mat(0x153b80),cyan=mat(0x76e8ff,0x157cb4);
  g.userData.slot=slot;g.userData.choice=choice;g.userData.flames=[];
  if(slot===0){
    for(const s of [-1,1]){
      cyl(g,white,.8,.7,2.3,s*2,0,4.6);
      const radius=choice===1?.8:choice===2?1.25:1;
      cyl(g,dark,.5,radius,choice===1?.6:1.6,s*2,0,6.1);ring(g,gold,radius,s*2,0,choice===1?6.45:6.93);
      cyl(g,cyan,radius*.8,radius*.8,.08,s*2,0,7);
      const flame=mesh(g,new T.ConeGeometry(radius*.6,4,20,1,true),new T.MeshBasicMaterial({color:choice===1?0x8c8aff:0x6be2ff,transparent:true,opacity:.5,depthWrite:false,blending:T.AdditiveBlending}),s*2,0,9);flame.rotation.x=Math.PI/2;g.userData.flames.push(flame);
      const light=mesh(g,new T.SphereGeometry(.3,8,8),cyan,s*2,0,7);g.userData.flames.push(light);
      if(choice===2)for(let a=0;a<6;a++)cyl(g,gold,.07,.07,2,s*2+Math.cos(a)*.73,Math.sin(a)*.73,4.9);
    }
  }else if(slot===1){
    for(const s of [-1,1]){
      box(g,gold,5,.14,.18,s*4,0,0);
      if(choice===0){for(let n=0;n<3;n++){box(g,blue,2.1,.1,5,s*(3.5+n*2.3),0,0);for(let k=-2;k<=2;k++)box(g,white,2.08,.025,.035,s*(3.5+n*2.3),.065,k);for(let k=0;k<4;k++)box(g,gold,.025,.025,5,s*(2.55+n*2.3+k*.6),.065,0);}}
      else if(choice===1){cyl(g,gold,.65,.65,3.5,s*3.5,0,0);for(let k=-1.5;k<=1.5;k+=.35)box(g,dark,1.8,1.8,.07,s*3.5,0,k);}
      else {box(g,dark,4,.15,4,s*4.7,0,1);for(let k=0;k<8;k++)box(g,gold,.045,.035,3.8,s*(3+k*.45),.1,1);cyl(g,white,.85,.85,2,0,2.2,1);ring(g,cyan,.9,0,2.2,1);}
    }
  }else if(slot===2){
    for(const s of [-1,1]){
      box(g,choice===2?gold:white,.2+choice*.18,2.3,4.5+choice,s*(1.7+choice*.13),0,-1);
      for(let j=-2;j<2;j++)box(g,dark,.05,2.1,.045,s*(1.84+choice*.31),0,j);
    }
    if(choice>0){box(g,white,2.8,.22+choice*.1,4,0,1.8,-1);box(g,white,2.8,.25,4,0,-1.8,-1);}
  }else{
    box(g,gold,1.8,1.3,2.5,0,2.2,-1);cyl(g,dark,.58,.58,1.8,0,2.2,-2.6);cyl(g,cyan,.49,.49,.06,0,2.2,-3.55);
    if(choice>=1){box(g,white,.12,2.5,.12,0,3.3,1);const dish=mesh(g,new T.SphereGeometry(1.25,24,12,0,Math.PI*2,0,Math.PI*.4),gold,0,4.5,1);dish.rotation.x=-.7;}
    if(choice===2)for(const s of [-1,1]){box(g,white,1.3,1.3,3,s*1.8,2.2,-.5);for(let z=-1;z<=1;z++)cyl(g,cyan,.2,.2,.1,s*1.8,2.2,z-1.1);}
  }
  return g;
}
export function assembledVehicle(loadout=[0,1,1,1]){const g=vehicleBus();loadout.forEach((n,i)=>{const m=vehicleModule(i,n);g.add(m);g.userData.modules.push(m);if(i===0)g.userData.flames=m.userData.flames;});return g;}
