import * as THREE from 'three';
import {Builder} from './builder.js';
import {createPumpkin,createCobweb,createFloatingCandle} from '../../client/src/environment.js';

export function decorateHalloween(scene,world,m,controller){
  const b=new Builder(scene,m),animated=[],lights=[],root=new THREE.Group();root.name='Halloween_in_Bauman';scene.add(root);
  const orange=new THREE.MeshBasicMaterial({color:'#ffd093'}),violet=new THREE.MeshBasicMaterial({color:'#c3a7e0'});
  const cable=new THREE.MeshStandardMaterial({color:'#433a38',roughness:.9});
  const bulb=new THREE.SphereGeometry(.043,8,6),wire=new THREE.CylinderGeometry(.006,.006,1,5);
  function register(group){
    root.add(group);group.traverse(obj=>{if(obj.isLight){obj.intensity*=1.4;obj.userData.originalIntensity=obj.intensity;obj.userData.shadowEligible=false;world.lights.push(obj);lights.push(obj);}});
    return group;
  }
  function pumpkin(x,z,s=.58,rot=0){
    const floor=controller.floorAt(x,z)??0,p=register(createPumpkin(x,floor+.44*s,z,true));p.scale.setScalar(s);p.rotation.y=rot;
    p.userData.phase=x+z;animated.push(p);
    world.obstacles.push({x1:x-.48*s,x2:x+.48*s,z1:z-.48*s,z2:z+.48*s});
    return p;
  }
  // Clusters live against walls; the centre of every corridor stays open.
  for(const [x,z,s,r]of [[29.7,-2.45,.72,-.7],[29.1,-2.85,.42,-.5],[24.05,2.6,.48,.8],[-29.75,2.6,.52,.4],[-24.1,-2.6,.6,-.8],[-29.7,-2.7,.4,.6],[-30.9,56,.7,.8],[-30.2,55.7,.44,.6],[-23.1,63.6,.52,-1],[-28.48,25,.47,Math.PI/2],[28.48,11,.48,-Math.PI/2],[28.48,32,.52,-Math.PI/2],[14,-6.5,.42,.5]])pumpkin(x,z,s,r);
  for(const x of [-17,-8,9,20])pumpkin(x,1.28,.43,Math.PI);
  function garland(x1,z1,x2,z2,y=3.56){
    const length=Math.hypot(x2-x1,z2-z1),count=Math.ceil(length/.34);
    const points=[];
    for(let i=0;i<=count;i++){
      const t=i/count,x=THREE.MathUtils.lerp(x1,x2,t),z=THREE.MathUtils.lerp(z1,z2,t),yy=y-Math.sin(t*Math.PI)*.24;
      points.push(new THREE.Vector3(x,yy,z));
      b.put(bulb,i%4===0?violet:orange,x,yy-.08,z);
      b.put(wire,cable,x,yy-.035,z,1,.07,1);
    }
    b.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),count,.008,4,false),cable,0,0,0);
  }
  for(let x=-22;x<23;x+=4.7)garland(x,-1.62,x+4.4,-1.62);
  for(const x of [-27,27])for(let z=5;z<51;z+=7)garland(x-1.53,z,x+1.53,z,3.72);
  garland(23.8,-3.12,30.25,-3.12,3.8);garland(-30.15,2.95,-23.85,2.95,3.8);
  for(const [x,z,ry]of [[23.65,-3.05,0],[-30.3,3.15,Math.PI/2],[-28.7,29.7,0],[28.7,40,Math.PI]]){
    const web=createCobweb(x,(controller.floorAt(x,z)??0)+3.55,z,ry);web.scale.setScalar(.65);root.add(web);
  }
  for(const [x,z]of [[26.5,-2.3],[-29,0],[-26,26],[26,35],[-29.9,62]]){
    const candle=register(createFloatingCandle(x,(controller.floorAt(x,z)??0)+2.25,z));
    candle.userData.baseY=candle.position.y;animated.push(candle);
  }
  b.flush();
  const textureCanvas=document.createElement('canvas');textureCanvas.width=textureCanvas.height=64;
  const ctx=textureCanvas.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'#fff7d9');g.addColorStop(.15,'#ffe1a2');g.addColorStop(.4,'#ffbd5d88');g.addColorStop(1,'#ffbd5d00');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
  const map=new THREE.CanvasTexture(textureCanvas),count=230,positions=new Float32Array(count*3),base=new Float32Array(count*3),colors=new Float32Array(count*3);
  const palette=['#ffc788','#e5d5a1','#bca6de'].map(c=>new THREE.Color(c));
  for(let i=0;i<count;i++){
    let x,z,floor;do{x=-31+Math.random()*61;z=-3+Math.random()*68;floor=controller.floorAt(x,z);}while(floor===null);
    base.set([x,floor+.5+Math.random()*2.8,z],i*3);positions.set(base.subarray(i*3,i*3+3),i*3);palette[i%3].toArray(colors,i*3);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const fireflies=new THREE.Points(geo,new THREE.PointsMaterial({map,size:.12,transparent:true,opacity:.84,vertexColors:true,depthWrite:false,blending:THREE.AdditiveBlending}));fireflies.name='Fireflies';root.add(fireflies);
  const lantern=new THREE.Group();lantern.name='Handheld_lantern';
  const brass=new THREE.MeshStandardMaterial({color:'#b08b50',metalness:.65,roughness:.35}),dark=new THREE.MeshStandardMaterial({color:'#3c3531',metalness:.6,roughness:.4});
  const mesh=(geo,mat,x,y,z)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);lantern.add(o);return o;};
  for(const y of [-.14,.13])mesh(new THREE.CylinderGeometry(.085,.1,.035,12),brass,0,y,0);
  for(const x of [-.065,.065])for(const z of [-.065,.065])mesh(new THREE.CylinderGeometry(.008,.008,.27,5),dark,x,0,z);
  mesh(new THREE.CylinderGeometry(.021,.027,.1,8),m.ivory,0,-.07,0);mesh(new THREE.SphereGeometry(.018,8,6),orange,0,0,0);
  const handle=mesh(new THREE.TorusGeometry(.065,.009,6,16,Math.PI),brass,0,.2,0);
  const lamp=new THREE.PointLight('#ffcc87',3.8,7,1.6);lamp.position.y=.02;lantern.add(lamp);
  lantern.position.set(.3,-.3,-.53);lantern.rotation.z=.08;lantern.visible=false;scene.add(controller.camera);controller.camera.add(lantern);
  let enabled=true,particles=true;
  return {root,lantern,lights,setParticles(value){particles=value;fireflies.visible=value;},toggleLantern(){lantern.visible=!lantern.visible;return lantern.visible;},
    update(time){
      for(const obj of animated){
        if(obj.userData.baseY!==undefined)obj.position.y=obj.userData.baseY+Math.sin(time*1.2+obj.position.x)*.07;
        if(obj.userData.light)obj.userData.light.intensity=obj.userData.light.userData.originalIntensity*(.92+Math.sin(time*4+obj.position.x)*.08);
      }
      if(particles){for(let i=0;i<count;i++){positions[i*3]=base[i*3]+Math.sin(time*.4+i)*.15;positions[i*3+1]=base[i*3+1]+Math.sin(time*.65+i*2)*.14;positions[i*3+2]=base[i*3+2]+Math.cos(time*.3+i)*.15;}geo.attributes.position.needsUpdate=true;}
      lantern.rotation.z=.08+Math.sin(time*2)*.015;
    }
  };
}
