import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeMaterials } from './materials.js';
import { makeWorld, START } from './world.js';
import { WalkController } from './controller.js';

import { decorateHalloween } from './halloween.js';
import { createCampusGame } from './campus-game.js';

const $=id=>document.getElementById(id);
document.body.classList.add('before-start');

function start(){
  const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.83;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;
  renderer.setClearColor('#333344');$('scene').append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#333344');scene.fog=new THREE.Fog('#484458',28,95);
  const pmrem=new THREE.PMREMGenerator(renderer),environment=new RoomEnvironment();
  const environmentTarget=pmrem.fromScene(environment,.04);scene.environment=environmentTarget.texture;scene.environmentIntensity=.18;
  environment.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#b9c5df','#9b765b',.85));
  const fill=new THREE.DirectionalLight('#ffd3a0',.34);fill.position.set(8,20,12);scene.add(fill);
  const coolFill=new THREE.DirectionalLight('#b6c6e8',.44);coolFill.position.set(-15,10,-5);scene.add(coolFill);
  const camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.055,160);
  const materials=makeMaterials();const world=makeWorld(scene,materials);const controller=new WalkController(camera,renderer.domElement,world);
  materials.daylight.color.set('#8b9fb9');
  for(const light of world.lights){light.intensity*=.66;light.userData.originalIntensity=light.intensity;}
  const effects=decorateHalloween(scene,world,materials,controller);
  const teacher={group:new THREE.Group(),update(){}};
  controller.teleport(START.x,START.z,START.yaw);
  let mapOpen=false,started=false,lastUI=0,lastLightUpdate=-1,audioContext=null,sound=false;

  let shadowLight=null;
  const lightPosition=new THREE.Vector3();
  function nearestLights(){
    const ordered=world.lights.map(light=>({light,distance:light.getWorldPosition(lightPosition).distanceToSquared(camera.position)})).sort((a,b)=>a.distance-b.distance);
    let architecture=0,decor=0;
    for(const {light}of ordered){const decoration=light.userData.shadowEligible===false;light.visible=!light.userData.inactive&&(decoration?decor++<3:architecture++<7);}
    const closest=ordered.find(o=>o.light.userData.shadowEligible!==false)?.light;
    if(closest!==shadowLight){
      if(shadowLight)shadowLight.castShadow=false;
      shadowLight=closest;
      if(shadowLight){shadowLight.castShadow=true;shadowLight.shadow.mapSize.set(1024,1024);shadowLight.shadow.camera.near=.05;shadowLight.shadow.camera.far=18;shadowLight.shadow.bias=-.001;shadowLight.shadow.normalBias=.015;}
      renderer.shadowMap.needsUpdate=true;
    }
  }
  nearestLights();
  const welcome=$('welcome');
  function begin(){
    started=true;controller.enabled=true;welcome.classList.add('hidden');document.body.classList.remove('before-start');
    game.begin();
    $('start-button').blur();controller.lock();
  }
  $('start-button').onclick=begin;
  renderer.domElement.addEventListener('click',()=>{if(started)controller.lock();});
  $('resume').onclick=()=>controller.lock();
  function toggleMap(open=!mapOpen){
    mapOpen=open;controller.mapOpen=open;controller.stop();$('map-overlay').classList.toggle('hidden',!open);document.body.classList.toggle('map-open',open);
    if(open){document.exitPointerLock?.();$('map-close').focus();}else document.activeElement?.blur();
    updateUI();
  }
  $('map-button').onclick=()=>toggleMap();$('map-close').onclick=()=>toggleMap(false);
  $('map-overlay').addEventListener('click',e=>{if(e.target===$('map-overlay'))toggleMap(false);});
  function reset(){controller.teleport(START.x,START.z,START.yaw);toggleMap(false);nearestLights();}
  $('reset-button').onclick=reset;$('brand').onclick=e=>{e.preventDefault();reset();};
  window.addEventListener('keydown',e=>{
    if(e.repeat||document.activeElement?.matches('input,textarea,select')||game.isModalOpen())return;
    if(e.code==='KeyM'&&started){e.preventDefault();toggleMap();}
    if(e.code==='Escape'&&mapOpen)toggleMap(false);
    if(e.code==='KeyR'&&started)reset();
  });
  $('sound-button').onclick=()=>{
    sound=!sound;$('sound-button').textContent=sound?'Звук включён':'Звук выключен';$('sound-button').setAttribute('aria-pressed',String(sound));
    if(sound){audioContext??=new AudioContext();audioContext.resume();}
    game.setSound(sound);
  };
  controller.onStep=()=>{
    if(!sound||!audioContext)return;
    const buffer=audioContext.createBuffer(1,Math.floor(audioContext.sampleRate*.065),audioContext.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*7);
    const source=audioContext.createBufferSource();source.buffer=buffer;
    const lowpass=audioContext.createBiquadFilter();lowpass.type='lowpass';lowpass.frequency.value=650;
    const gain=audioContext.createGain();gain.gain.value=.025;source.connect(lowpass).connect(gain).connect(audioContext.destination);source.start();
  };

  function updateUI(){
    let landmark=world.landmarks.find(l=>Math.hypot(controller.x-l.x,controller.z-l.z)<l.radius);
    if(controller.x < -32)landmark={number:'12',title:'Проход к столовой',description:'Западное продолжение Красной площади'};
    if(controller.x>20&&controller.z>7)landmark={number:'02',title:controller.z>68?'Правая лестница у выхода':'Правый коридор',description:'Первый этаж · правое крыло'};
    if(Math.abs(controller.x)<4.4&&controller.z>1.9&&controller.z<8.7)landmark={number:'10',title:'Центральная лестница',description:'Широкий марш · площадка у большого окна'};
    if(controller.x>13.2&&controller.x<18.2&&controller.z<-1.9)landmark={number:'227',title:'Учебная аудитория',description:'Сети · интерактивные предметы · последняя подсказка'};
    landmark??={number:'04',title:'Главный коридор',description:'От правой лестницы к портретной галерее'};
    for(const [id,text] of [['location-number',landmark.number],['location-title',landmark.title],['location-description',landmark.description]])if($(id).textContent!==text)$(id).textContent=text;
    const mapX=195+(controller.x+27)*340/54,mapY=76+controller.z*434/60;
    $('map-player').setAttribute('transform',`translate(${mapX} ${mapY}) rotate(${-controller.yaw*180/Math.PI})`);
  }

  window.addEventListener('resize',()=>{
    camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
  });
  const game=createCampusGame({scene,camera,renderer,world,materials,controller,teacher,effects,onMap:()=>toggleMap(true),onBegin:begin,
    onPause:paused=>{if(paused&&mapOpen)toggleMap(false);controller.enabled=started&&!paused;controller.mapOpen=mapOpen||paused;},
    onBrightness:value=>{renderer.toneMappingExposure=.68*value;},
  });
  let previous=performance.now();
  function frame(now){
    const dt=Math.min((now-previous)/1000,.04);previous=now;controller.update(dt);
    teacher.update(now/1000,camera.position);
    game.update(dt,now/1000);
    if(now-lastLightUpdate>250){lastLightUpdate=now;nearestLights();}
    if(now-lastUI>150){lastUI=now;updateUI();}
    renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if(import.meta.env.DEV)window.__campus={scene,camera,renderer,controller,world,teacher,game,effects,begin,reset,toggleMap,landmarks:world.landmarks};
}

try{start();}catch(error){
  console.error(error);$('fatal-error').textContent='Не удалось запустить 3D-сцену. Откройте страницу в актуальном Chrome или Edge с включённым аппаратным ускорением. '+error.message;
  $('fatal-error').classList.remove('hidden');
}
