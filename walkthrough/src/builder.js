import * as THREE from 'three';
import { textMaterial, floorMaterial } from './materials.js';

export class Builder {
  constructor(scene, materials) {
    this.scene=scene;this.m=materials;this.batches=new Map();this.lights=[];
    this.cube=new THREE.BoxGeometry(1,1,1);
    this.ball=new THREE.SphereGeometry(1,12,8);
    this.round=new THREE.CylinderGeometry(1,1,1,16);
    this.plane=new THREE.PlaneGeometry(1,1);
    this.railCurl=new THREE.TorusGeometry(.063,.009,5,16,Math.PI*1.75);
    this.arm=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
      new THREE.Vector3(0,0,0),new THREE.Vector3(.12,-.09,0),new THREE.Vector3(.28,-.09,0),new THREE.Vector3(.36,.05,0),
    ]),16,.012,6,false);
    this.lampshade=new THREE.LatheGeometry([new THREE.Vector2(.028,0),new THREE.Vector2(.045,.025),new THREE.Vector2(.065,.06),new THREE.Vector2(.105,.11),new THREE.Vector2(.115,.14),new THREE.Vector2(.10,.16)],20);
    this.matrix=new THREE.Matrix4();this.position=new THREE.Vector3();this.scale=new THREE.Vector3();this.quat=new THREE.Quaternion();this.euler=new THREE.Euler();
  }
  put(geometry,material,x,y,z,sx=1,sy=1,sz=1,ry=0,rx=0,rz=0){
    if(!Number.isFinite(x+y+z+sx+sy+sz+ry+rx+rz))throw new Error('Invalid architecture transform');
    const key=geometry.uuid+material.uuid;
    if(!this.batches.has(key))this.batches.set(key,{geometry,material,matrices:[]});
    this.euler.set(rx,ry,rz);this.quat.setFromEuler(this.euler);this.position.set(x,y,z);this.scale.set(sx,sy,sz);
    this.matrix.compose(this.position,this.quat,this.scale);this.batches.get(key).matrices.push(this.matrix.clone());
  }
  box(x,y,z,w,h,d,mat='ivory',ry=0){this.put(this.cube,this.m[mat]||mat,x,y,z,w,h,d,ry);}
  sphere(x,y,z,r,mat='lamp',sy=1){this.put(this.ball,this.m[mat]||mat,x,y,z,r,r*sy,r);}
  cylinder(x,y,z,r,h,mat='brass'){this.put(this.round,this.m[mat]||mat,x,y,z,r,h,r);}
  panel(x,y,z,w,h,material,ry=0){this.put(this.plane,material,x,y,z,w,h,1,ry);}
  local(x,y,z,u,v,n,ry){return [x+Math.cos(ry)*u+Math.sin(ry)*n,y+v,z-Math.sin(ry)*u+Math.cos(ry)*n];}
  localBox(x,y,z,u,v,n,w,h,d,mat,ry){this.box(...this.local(x,y,z,u,v,n,ry),w,h,d,mat,ry);}
  frame(x,y,z,w,h,material,ry=0,mat='brass'){
    this.localBox(x,y,z,0,0,-.025,w+.065,h+.065,.055,'black',ry);
    for(const u of [-w/2,w/2])this.localBox(x,y,z,u,0,.012,.025,h+.04,.055,mat,ry);
    for(const v of [-h/2,h/2])this.localBox(x,y,z,0,v,.012,w+.04,.025,.055,mat,ry);
    this.panel(...this.local(x,y,z,0,0,.047,ry),w-.025,h-.025,material,ry);
  }
  label(x,y,z,text,w=1,h=.22,ry=0,options={}){this.panel(x,y,z,w,h,textMaterial(text,options),ry);}
  floor(x,z,w,d,y=0,style='regular'){
    this.put(this.plane,floorMaterial(w,d,style),x,y,z,w,d,1,0,-Math.PI/2);
  }
  wallX(x1,x2,z,base=0,mat='plaster',height=4.1){this.wall((x1+x2)/2,z,x2-x1,.22,base,mat,height);}
  wallZ(x,z1,z2,base=0,mat='plaster',height=4.1){this.wall(x,(z1+z2)/2,.22,z2-z1,base,mat,height);}
  wall(x,z,w,d,base,mat,height){
    if(w<=0||d<=0)return;
    this.box(x,base+height/2,z,w,height,d,mat);
    if(mat==='redSquare')this.box(x,base+.11,z,w+.025,.22,d+.025,'ivory');
    else this.box(x,base+.48,z,w+.025,.94,d+.025,mat==='ochre'?'brownMarble':'marble');
    this.box(x,base+.055,z,w+.06,.11,d+.06,'darkMarble');
    if(mat!=='redSquare')this.box(x,base+.98,z,w+.04,.045,d+.04,'brownMarble');
    for(const [yy,hh,extra] of [[height-.11,.1,.12],[height-.23,.08,.08],[height-.3,.045,.045]])this.box(x,base+yy,z,w+extra,hh,d+extra,'ivory');
  }
  ceiling(x,z,w,d,base=0){this.box(x,base+4.16,z,w,.12,d,'ceiling');}
  arch(x,z,width=3.3,base=0,ry=0,finish='marble'){
    const radius=width/2,spring=2.08,outer=radius+.16;
    const shape=new THREE.Shape();shape.moveTo(-outer,0);shape.lineTo(-outer,spring);shape.absarc(0,spring,outer,Math.PI,0,true);shape.lineTo(outer,0);shape.lineTo(radius,0);shape.lineTo(radius,spring);shape.absarc(0,spring,radius,0,Math.PI,false);shape.lineTo(-radius,0);shape.closePath();
    const geo=new THREE.ExtrudeGeometry(shape,{depth:.28,bevelEnabled:false,curveSegments:32});geo.translate(0,0,-.14);
    this.put(geo,this.m[finish],x,base,z,1,1,1,ry);
    const casing=radius+.19;
    for(const u of [-casing,casing])this.localBox(x,base,z,u,1.03,0,.055,2.06,.34,'ivory',ry);
    // Radial stone joints make the arch read as masonry from close range.
    for(let i=1;i<16;i++){
      const a=i*Math.PI/16,px=Math.cos(a)*(radius+.08),py=spring+Math.sin(a)*(radius+.08);
      const [xx,yy,zz]=this.local(x,base,z,px,py,.146,ry);
      this.put(this.cube,this.m.brownMarble,xx,yy,zz,.012,.15,.004,ry,0,a-Math.PI/2);
    }
  }
  chandelier(x,z,base=0,large=false){
    const h=base+3.24,r=large?.55:.36;
    this.cylinder(x,h+.5,z,.022,.7);this.cylinder(x,h+.12,z,.065,.45);
    this.sphere(x,h-.16,z,.21,'lamp',.72);
    this.cylinder(x,h-.28,z,.1,.025);
    const count=large?8:5;
    for(let i=0;i<count;i++){
      const a=i/count*Math.PI*2,xx=x+Math.cos(a)*r,zz=z+Math.sin(a)*r;
      this.put(this.arm,this.m.brass,x,h-.02,z,r/.36,1,r/.36,-a);
      this.cylinder(xx,h+.04,zz,.014,.16);
      this.put(this.lampshade,this.m.lamp,xx,h+.07,zz);
      this.cylinder(xx,h+.07,zz,.065,.025);
    }
    this.cylinder(x,base+4.04,z,.18,.035,'ivory');
    const ring=new THREE.TorusGeometry(large?.42:.28,.018,6,48);
    this.put(ring,this.m.ivory,x,base+4.07,z,1,1,1,0,Math.PI/2);
    this.light(x,base+3.05,z,large?48:28,12,'#fff1d4');
  }
  light(x,y,z,intensity=25,distance=12,color='#fff1d4'){
    const light=new THREE.PointLight(color,intensity,distance,2);light.position.set(x,y,z);light.userData.originalIntensity=intensity;
    this.scene.add(light);this.lights.push(light);return light;
  }
  sconce(x,y,z,ry=0){
    this.localBox(x,y,z,0,0,0,.1,.21,.055,'iron',ry);
    this.localBox(x,y,z,0,0,.08,.15,.05,.12,'brass',ry);
    this.localBox(x,y,z,0,.02,.16,.15,.11,.1,'lamp',ry);
  }
  door(x,z,base=0,ry=0,number=''){
    const h=2.75,w=1.38;
    this.localBox(x,base,z,0,h/2,-.01,w+.22,h+.12,.23,'darkMarble',ry);
    this.localBox(x,base,z,0,h/2,.12,w,h,.1,'door',ry);
    for(const u of [-.35,.35]){
      this.localBox(x,base,z,u,1.37,.181,.57,1.96,.018,'doorInset',ry);
      this.localBox(x,base,z,u,1.65,.195,.22,1.25,.015,'doorGlass',ry);
      for(const v of [1.12,1.65,2.2])this.localBox(x,base,z,u,v,.215,.24,.018,.025,'door',ry);
      this.localBox(x,base,z,u,.28,.187,.5,.33,.02,'doorInset',ry);
    }
    this.localBox(x,base,z,0,2.45,.2,1.19,.36,.025,'black',ry);
    for(let i=-3;i<=3;i++)this.localBox(x,base,z,i*.17,2.45,.225,.016,.34,.015,'door',ry);
    this.localBox(x,base,z,0,1.35,.21,.05,2.7,.025,'door',ry);
    for(const u of [-.09,.09])this.localBox(x,base,z,u,1.04,.26,.018,.2,.035,'brass',ry);
    if(number)this.label(...this.local(x,base,z,0,2.94,.16,ry),number,.23,.13,ry,{background:'#a69265',color:'#282723',size:90});
  }
  exitSign(x,y,z,ry=0){
    this.localBox(x,y,z,0,0,-.02,.43,.17,.07,'exit',ry);
    this.label(...this.local(x,y,z,0,0,.022,ry),'ВЫХОД',.4,.14,ry,{background:'#258b73',color:'#f0fff1',size:90});
  }
  portrait(x,y,z,index=0,w=.48,h=.62,ry=0){
    this.frame(x,y,z,w,h,this.m.portraits[index%this.m.portraits.length],ry);
    this.localBox(x,y,z,0,-h/2-.09,.015,w*.72,.1,.03,'ivory',ry);
    // Small dark strokes stand in for unreadable caption lines, without invented names.
    for(let i=0;i<2;i++)this.localBox(x,y,z,0,-h/2-.071-i*.026,.034,w*.5,.007,.003,'brownMarble',ry);
  }
  rail(x1,z1,x2,z2,base=0,rise=0){
    const distance=Math.hypot(x2-x1,z2-z1),count=Math.ceil(distance/.19);
    for(let i=0;i<=count;i++){
      const t=i/count,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t,y=base+rise*t;
      this.cylinder(x,y+.46,z,.012,.89,'iron');this.sphere(x,y+.46,z,.026,'iron',2.3);
      if(i%3===0){
        // Repeated cast-iron curls below the wooden handrail.
        const curl=this.railCurl;
        const ry=Math.atan2(-(z2-z1),x2-x1);
        this.put(curl,this.m.iron,x,y+.77,z,1,1,1,ry);
        this.put(curl,this.m.iron,x,y+.18,z,.72,.72,.72,ry,0,Math.PI);
      }
    }
    const midpoint=new THREE.Vector3((x1+x2)/2,base+rise/2+.94,(z1+z2)/2);
    const direction=new THREE.Vector3(x2-x1,rise,z2-z1),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
    const matrix=new THREE.Matrix4().compose(midpoint,q,new THREE.Vector3(.035,direction.length(),.035));
    const key=this.round.uuid+this.m.wood.uuid;if(!this.batches.has(key))this.batches.set(key,{geometry:this.round,material:this.m.wood,matrices:[]});this.batches.get(key).matrices.push(matrix);
  }
  column(x,z,base=0,height=4.1){
    this.cylinder(x,base+height/2,z,.21,height,'ivory');
    for(const [y,r,h] of [[.06,.31,.12],[.18,.26,.09],[height-.18,.26,.14],[height-.06,.32,.09]])this.cylinder(x,base+y,z,r,h,'ivory');
    this.box(x,base+height-.025,z,.68,.09,.68,'ivory');
  }
  flush(){
    for(const {geometry,material,matrices} of this.batches.values()){
      const mesh=new THREE.InstancedMesh(geometry,material,matrices.length);
      mesh.castShadow=!material.isMeshBasicMaterial&&!material.transparent&&geometry!==this.plane;
      mesh.receiveShadow=!material.isMeshBasicMaterial;
      matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();this.scene.add(mesh);
    }
    this.batches.clear();
  }
}
