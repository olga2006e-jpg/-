import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createTeacher } from './teacher.js';

const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;renderer.outputColorSpace=THREE.SRGBColorSpace;document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#dce1db');
const generator=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=generator.fromScene(room,.04).texture;scene.environmentIntensity=.5;room.dispose();generator.dispose();
scene.add(new THREE.HemisphereLight('#fff4e6','#80938a',1.3));
const key=new THREE.DirectionalLight('#fff1dd',2.3);key.position.set(-2,4,4);scene.add(key);
const rim=new THREE.DirectionalLight('#d4e5ff',1.6);rim.position.set(3,2,-2);scene.add(rim);
const camera=new THREE.PerspectiveCamera(37,innerWidth/innerHeight,.01,30);
camera.position.set(.40,1.65,1.02);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.55,0);controls.enableDamping=true;controls.minDistance=.38;controls.maxDistance=5;
const teacher=createTeacher();scene.add(teacher.group);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshStandardMaterial({color:'#dce1db',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.005;scene.add(ground);
const pose=(position,target)=>{camera.position.set(...position);controls.target.set(...target);controls.update();};
document.getElementById('portrait').onclick=()=>pose([0,1.63,.95],[0,1.56,0]);
document.getElementById('profile').onclick=()=>pose([.93,1.65,.12],[0,1.58,0]);
document.getElementById('full').onclick=()=>pose([1.7,1.3,3.1],[0,.95,0]);

export async function exportTeacher(){
  const clone=teacher.group.clone(true);clone.traverse(object=>{if(object.name==='Contact_shadow')object.visible=false;});
  const data=await new GLTFExporter().parseAsync(clone,{binary:true,onlyVisible:true});return data;
}
document.getElementById('export').onclick=async()=>{
  const button=document.getElementById('export');button.disabled=true;button.textContent='Экспорт…';
  try{const data=await exportTeacher();const url=URL.createObjectURL(new Blob([data],{type:'model/gltf-binary'}));const link=document.createElement('a');link.href=url;link.download='teacher-reference.glb';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  finally{button.disabled=false;button.textContent='Скачать GLB ↓';}
};
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const clock=new THREE.Clock();
function render(){controls.update();teacher.update(clock.getElapsedTime());renderer.render(scene,camera);requestAnimationFrame(render);}render();
if(import.meta.env.DEV)window.__teacher={teacher,renderer,scene,camera,controls,pose,exportTeacher};
