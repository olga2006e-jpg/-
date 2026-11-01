import * as THREE from 'three';

export class WalkController {
  constructor(camera, canvas, world) {
    this.camera=camera;this.canvas=canvas;this.world=world;
    this.x=27;this.z=.5;this.yaw=Math.PI/2;this.pitch=0;
    this.keys=new Set();this.velocity=new THREE.Vector2();this.enabled=false;this.mapOpen=false;this.dragging=false;
    this.eyeHeight=1.66;this.eyeY=this.eyeHeight;this.distance=0;this.stepDistance=0;
    this.onStep=null;
    window.addEventListener('keydown',e=>{
      if(e.target.matches?.('input,textarea,button')&&e.code==='Space')return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){
        if(this.enabled&&!this.mapOpen)e.preventDefault();this.keys.add(e.code);
      }
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    window.addEventListener('blur',()=>this.stop());
    document.addEventListener('pointerlockchange',()=>{
      document.body.classList.toggle('locked',document.pointerLockElement===canvas);
      this.stop();
    });
    canvas.addEventListener('pointerdown',e=>{this.dragging=true;this.lastPointer={x:e.clientX,y:e.clientY};});
    window.addEventListener('pointerup',()=>{this.dragging=false;});
    document.addEventListener('mousemove',e=>{
      const locked=document.pointerLockElement===canvas;
      if(!this.enabled||this.mapOpen||(!locked&&!this.dragging))return;
      const dx=locked?e.movementX:e.clientX-this.lastPointer.x,dy=locked?e.movementY:e.clientY-this.lastPointer.y;
      this.yaw-=dx*.0019;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.0019,-1.32,1.32);
      this.lastPointer={x:e.clientX,y:e.clientY};
    });
  }
  async lock(){
    if(!this.enabled||this.mapOpen)return;
    try{await this.canvas.requestPointerLock?.();}catch{/* Dragging the scene remains available. */}
  }
  stop(){this.keys.clear();this.velocity.set(0,0);}
  floorAt(x,z){
    let result=-Infinity;
    for(const r of this.world.regions)if(x>=r.x1&&x<=r.x2&&z>=r.z1&&z<=r.z2){
      const h=typeof r.height==='function'?r.height(x,z):r.height;result=Math.max(result,h);
    }
    return Number.isFinite(result)?result:null;
  }
  canWalk(x,z){
    const radius=.19;
    for(const [dx,dz] of [[-radius,-radius],[radius,-radius],[-radius,radius],[radius,radius]])if(this.floorAt(x+dx,z+dz)===null)return false;
    for(const o of this.world.obstacles)if(x+radius>o.x1&&x-radius<o.x2&&z+radius>o.z1&&z-radius<o.z2)return false;
    return true;
  }
  teleport(x,z,yaw=this.yaw){
    if(!this.canWalk(x,z))return false;
    this.x=x;this.z=z;this.yaw=yaw;this.pitch=0;this.eyeY=(this.floorAt(x,z)||0)+this.eyeHeight;this.stop();this.updateCamera(0);return true;
  }
  update(dt){
    if(!this.enabled||this.mapOpen){this.stop();this.updateCamera(0);return;}
    let forward=Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))-Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'));
    let strafe=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'));
    const magnitude=Math.hypot(forward,strafe);if(magnitude>0){forward/=magnitude;strafe/=magnitude;}
    const speed=this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')?4.3:2.55;
    const targetX=(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*strafe)*speed;
    const targetZ=(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*strafe)*speed;
    const smoothing=1-Math.exp(-14*dt);this.velocity.x=THREE.MathUtils.lerp(this.velocity.x,targetX,smoothing);this.velocity.y=THREE.MathUtils.lerp(this.velocity.y,targetZ,smoothing);
    const oldX=this.x,oldZ=this.z;
    const nextX=this.x+this.velocity.x*dt;if(this.canWalk(nextX,this.z))this.x=nextX;else this.velocity.x=0;
    const nextZ=this.z+this.velocity.y*dt;if(this.canWalk(this.x,nextZ))this.z=nextZ;else this.velocity.y=0;
    const travelled=Math.hypot(this.x-oldX,this.z-oldZ);this.distance+=travelled;this.stepDistance+=travelled;
    if(this.stepDistance>.67){this.stepDistance=0;this.onStep?.();}
    const targetY=(this.floorAt(this.x,this.z)||0)+this.eyeHeight;
    this.eyeY=THREE.MathUtils.lerp(this.eyeY,targetY,1-Math.exp(-16*dt));
    this.updateCamera(magnitude?Math.sin(this.distance*9)*.009:0);
  }
  updateCamera(bob){
    this.camera.position.set(this.x,this.eyeY+bob,this.z);
    this.camera.rotation.order='YXZ';this.camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
  }
}
