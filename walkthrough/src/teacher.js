import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Hand-built, stylized reference character. +Z is the front of the face.
// Photo 1 supplies the current haircut and clothing; photo 2 supplies facial proportions.
const smooth = THREE.MathUtils.smoothstep;
const gaussian = (x, y, cx, cy, sx, sy) => Math.exp(-(((x-cx)/sx)**2)-((y-cy)/sy)**2);
const HEAD_PROFILE=[
  [-.154,.012,.028,.014],[-.145,.047,.067,.007],[-.128,.073,.085,0],
  [-.106,.093,.096,-.003],[-.075,.108,.104,-.005],[-.040,.119,.108,-.005],
  [0,.123,.108,-.006],[.035,.119,.110,-.008],[.075,.116,.112,-.011],
  [.110,.112,.109,-.014],[.140,.099,.095,-.018],[.162,.069,.067,-.020],[.176,.005,.005,-.020],
];

function facialDisplacement(x,y,front){
  const cheek=gaussian(x,y,.065,-.01,.032,.033)+gaussian(x,y,-.065,-.01,.032,.033);
  const sockets=gaussian(x,y,.05,.035,.029,.021)+gaussian(x,y,-.05,.035,.029,.021);
  const bridge=gaussian(x,y,0,.028,.015,.054)*.017;
  const tip=gaussian(x,y,0,-.005,.019,.018)*.034;
  const alae=(gaussian(x,y,.019,-.016,.011,.012)+gaussian(x,y,-.019,-.016,.011,.012))*.012;
  const muzzle=gaussian(x,y,0,-.068,.043,.026)*.006;
  return (cheek*.007-sockets*.004+bridge+tip+alae+muzzle)*front**4;
}

function faceZ(x,y){
  let ring=HEAD_PROFILE.at(-1);
  for(let i=0;i<HEAD_PROFILE.length-1;i++)if(y>=HEAD_PROFILE[i][0]&&y<=HEAD_PROFILE[i+1][0]){
    const t=(y-HEAD_PROFILE[i][0])/(HEAD_PROFILE[i+1][0]-HEAD_PROFILE[i][0]);
    ring=HEAD_PROFILE[i].map((v,c)=>THREE.MathUtils.lerp(v,HEAD_PROFILE[i+1][c],t));break;
  }
  const front=Math.sqrt(Math.max(0,1-(x/ring[1])**2));
  return ring[3]+ring[2]*front**.65+facialDisplacement(x,y,front);
}

function projectFace(geometry,x,y,offset=.001){
  const p=geometry.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,faceZ(p.getX(i)+x,p.getY(i)+y)+offset);
  geometry.computeVertexNormals();return geometry;
}

function material(color, roughness=.75, extra={}) {
  return new THREE.MeshStandardMaterial({color,roughness,...extra});
}

function addMesh(parent, geometry, mat, position=[0,0,0], scale=[1,1,1]) {
  const mesh=new THREE.Mesh(geometry,mat);mesh.position.set(...position);mesh.scale.set(...scale);
  mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

function ellipsoid(parent, mat, p, s, segments=24) {
  return addMesh(parent,new THREE.SphereGeometry(1,segments,16),mat,p,s);
}

function tube(parent, points, radius, mat, segments=24) {
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  return addMesh(parent,new THREE.TubeGeometry(curve,segments,radius,8,false),mat);
}

function limb(parent, from, to, radiusA, radiusB, depthRatio, mat) {
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to),delta=b.clone().sub(a);
  const mesh=addMesh(parent,new THREE.CylinderGeometry(radiusB,radiusA,delta.length(),20,4),mat,a.clone().add(b).multiplyScalar(.5).toArray(),[1,1,depthRatio]);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return mesh;
}

function ringGeometry(rings, count=48, deform=null) {
  const vertices=[],indices=[],colors=[];
  rings.forEach(([y,rx,rz,zc=0],j)=>{
    for(let i=0;i<=count;i++){
      const theta=i/count*Math.PI*2;
      let x=Math.sin(theta)*rx,z=Math.cos(theta)*rz+zc;
      const result=deform?.(x,y,z,theta,j);
      if(result){x=result.x??x;z=result.z??z;}
      vertices.push(x,y,z);
      const c=result?.color||[1,1,1];colors.push(...c);
      if(j<rings.length-1&&i<count){const a=j*(count+1)+i,b=a+count+1;indices.push(a,a+1,b,a+1,b+1,b);}
    }
  });
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);
  const welded=mergeVertices(geometry,1e-5);welded.computeVertexNormals();return welded;
}

function interpolateRings(profile, steps=4) {
  const result=[];
  for(let i=0;i<profile.length-1;i++)for(let j=0;j<steps;j++){
    const t=j/steps;result.push(profile[i].map((v,c)=>THREE.MathUtils.lerp(v,profile[i+1][c],t)));
  }
  result.push(profile.at(-1));return result;
}

function makeIris() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
  const gradient=c.createRadialGradient(64,64,14,64,64,55);
  gradient.addColorStop(0,'#847246');gradient.addColorStop(.4,'#687660');gradient.addColorStop(.85,'#48594f');gradient.addColorStop(1,'#303e37');
  c.fillStyle=gradient;c.fillRect(0,0,128,128);
  for(let i=0;i<90;i++){
    const a=i/90*Math.PI*2;c.strokeStyle=i%3?'#c0bc8055':'#182b2655';c.lineWidth=.8;
    c.beginPath();c.moveTo(64+Math.cos(a)*18,64+Math.sin(a)*18);c.lineTo(64+Math.cos(a)*53,64+Math.sin(a)*53);c.stroke();
  }
  c.fillStyle='#19211e';c.beginPath();c.arc(64,64,20,0,Math.PI*2);c.fill();
  c.fillStyle='#ffffffbb';c.beginPath();c.arc(48,45,8,0,Math.PI*2);c.fill();
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({map:texture,roughness:.33});
}

function eye(parent, x, m) {
  const y=.036;
  const shape=new THREE.Shape();shape.moveTo(-.024,-.001);
  shape.bezierCurveTo(-.011,.009,.009,.009,.024,.001);
  shape.bezierCurveTo(.01,-.007,-.012,-.007,-.024,-.001);
  const white=addMesh(parent,projectFace(new THREE.ShapeGeometry(shape,24),x,y,.0008),m.sclera,[x,y,0]);white.castShadow=false;
  const irisGeometry=new THREE.CircleGeometry(.0075,32);irisGeometry.scale(1,.8,1);
  const iris=addMesh(parent,projectFace(irisGeometry,x+.001,y+.0008,.0018),m.iris,[x+.001,y+.0008,0]);iris.castShadow=false;
  const eyelid=points=>points.map(([xx,yy])=>[xx,yy,faceZ(xx,yy)+.0013]);
  tube(parent,eyelid([[x-.024,y-.001],[x-.013,y+.006],[x+.005,y+.007],[x+.024,y+.001]]),.0012,m.skin,20);
  tube(parent,eyelid([[x-.023,y-.001],[x-.009,y-.005],[x+.01,y-.005],[x+.024,y+.001]]),.0008,m.lid,20);
  tube(parent,eyelid([[x-.022,y+.0004],[x-.011,y+.006],[x+.007,y+.006],[x+.022,y+.002]]),.00045,m.lash,20);
  const sign=Math.sign(x);
  // Defined, almost straight brows rather than oversized cartoon eyebrows.
  const brow=new THREE.Shape();
  brow.moveTo(-.025,-.001);brow.quadraticCurveTo(-.009,.007,.013,.004);brow.lineTo(.026,-.002);brow.quadraticCurveTo(.005,.002,-.025,-.005);brow.closePath();
  const browMesh=addMesh(parent,projectFace(new THREE.ShapeGeometry(brow,16),x,.068,.0012),m.hair,[x,.068,0]);
}

function lips(parent,m) {
  const create=(upper)=>{
    const vertices=[],indices=[];
    for(let i=0;i<=32;i++){
      const t=i/32,x=(t-.5)*.067,bell=Math.sin(t*Math.PI);
      const seam=-.072+Math.abs(t-.5)*.009;
      const cupid=upper ? .006*bell-.003*Math.exp(-(((t-.5)/.12)**2)) : -.008*bell;
      vertices.push(x,seam,faceZ(x,seam)+.0015,x,seam+cupid,faceZ(x,seam+cupid)+.001);
      if(i<32){const a=i*2;if(upper)indices.push(a,a+2,a+1,a+1,a+2,a+3);else indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
    const mesh=addMesh(parent,g,upper?m.upperLip:m.lowerLip);mesh.castShadow=false;
  };
  create(true);create(false);
  tube(parent,[[-.033,-.068],[-.017,-.071],[0,-.072],[.017,-.071],[.033,-.068]].map(([x,y])=>[x,y,faceZ(x,y)+.0018]),.0006,m.mouth,24);
}

function makeHead(m) {
  const group=new THREE.Group();group.name='Head';
  const profile=HEAD_PROFILE;
  const skinColor=new THREE.Color('#d3a58d');
  const geometry=ringGeometry(interpolateRings(profile,8),128,(x,y,z,theta)=>{
    const front=Math.max(0,Math.cos(theta));
    const cheek=gaussian(x,y,.065,-.01,.032,.033)+gaussian(x,y,-.065,-.01,.032,.033);
    if(front>0)z=faceZ(x,y);
    // Vertex colour adds subtle cheek/nose warmth and lower-face shading.
    const warmth=cheek*.025+gaussian(x,y,0,-.015,.03,.026)*.03;
    const jawShade=(1-smooth(y,-.145,-.07))*.025;
    return {z,color:[skinColor.r+warmth-jawShade,skinColor.g-warmth*.2-jawShade,skinColor.b-warmth*.25-jawShade]};
  });
  addMesh(group,geometry,m.face);
  for(const side of [-1,1]){
    const ear=ellipsoid(group,m.skin,[side*.12,.007,-.012],[.018,.034,.019]);ear.rotation.z=side*-.13;
    const inner=ellipsoid(group,m.ear,[side*.132,.008,-.003],[.004,.023,.010]);inner.castShadow=false;
    tube(group,[[side*.132,-.013,-.002],[side*.137,.001,.004],[side*.135,.022,-.002],[side*.126,.028,-.006]],.0025,m.skin,20);
    ellipsoid(group,m.skin,[side*.126,-.019,.003],[.009,.011,.012],16);
    ellipsoid(group,m.nostril,[side*.014,-.019,.145],[.004,.0019,.0025],16).castShadow=false;
  }
  eye(group,-.049,m);eye(group,.049,m);lips(group,m);
  // A small chin and cheek plane remain part of the continuous sculpted head.
  makeHair(group,m);
  return group;
}

function makeHair(parent,m) {
  const vertices=[],indices=[],segments=80,rows=28;
  const hairline=theta=>{
    const front=Math.cos(theta);
    return front>=0 ? .027+.078*front**1.3 : .027-.082*(-front)**.65;
  };
  const surface=(theta,t,offset=0)=>{
    const spread=Math.sin(t*Math.PI/2)**.42;
    let x=Math.sin(theta)*(.131+offset)*spread,z=Math.cos(theta)*(.128+offset)*spread-.014;
    let y=THREE.MathUtils.lerp(.199+offset,hairline(theta),t**1.5);
    y+=.022*gaussian(x,z,-.035,.055,.065,.065)*Math.sin(t*Math.PI);
    x-=.008*Math.sin(t*Math.PI)*Math.max(0,Math.cos(theta));
    return [x,y,z];
  };
  for(let row=0;row<=rows;row++)for(let i=0;i<=segments;i++){
    const theta=i/segments*Math.PI*2,t=row/rows;
    vertices.push(...surface(theta,t));
    if(row<rows&&i<segments){const a=row*(segments+1)+i,b=a+segments+1;indices.push(a,b,a+1,a+1,b,b+1);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  addMesh(parent,geometry,m.hair);
  for(let i=0;i<16;i++){
    const thetaStart=-1.25+i/15*2.1,points=[];
    for(let j=0;j<=28;j++){
      const s=j/28;
      const t=s<.55?1-s/.55*.84:.16+(s-.55)/.45*.74;
      const theta=thetaStart+Math.sin(s*Math.PI/2)*2.25;
      points.push(surface(theta,t,.001));
    }
    tube(parent,points,.0004,m.hairSoft,40);
  }
}

function collar(parent,m) {
  // Open collar: two separate folded fabric leaves and the visible neck.
  const leaf=(side)=>{
    const points=[side*.043,1.474,.047,side*.078,1.452,.017,side*.101,1.405,.086,side*.055,1.421,.098];
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setIndex(side>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]);geometry.computeVertexNormals();
    const mesh=addMesh(parent,geometry,m.collar);mesh.material.side=THREE.DoubleSide;
    tube(parent,[[side*.044,1.475,.047],[side*.055,1.424,.098],[side*.101,1.406,.086]],.0008,m.stitch,20);
  };
  leaf(-1);leaf(1);
}

export function createTeacher() {
  const root=new THREE.Group();root.name='Teacher_Blue_Shirt';
  const m={
    face:material('#ffffff',.84,{vertexColors:true}),skin:material('#d3a58d',.83),ear:material('#b77e69',.9),
    lid:material('#bd927f',.9),nostril:material('#785247',.95),sclera:material('#e4dfd2',.6),iris:makeIris(),
    lash:material('#665247',.9),upperLip:material('#a57867',.85),lowerLip:material('#bd907b',.8),mouth:material('#734f48',.95),
    hair:material('#221c18',.64),hairSoft:material('#30251e',.7),hairHighlight:material('#443329',.68),
    shirt:material('#5587b4',.84),shirtShadow:material('#4e7da5',.88),collar:material('#6799c2',.8),stitch:material('#759bb9',.9),
    buttons:material('#d8e0de',.55),trousers:material('#69737b',.92),seam:material('#5a646c',.95),
    leather:material('#3c352e',.7),sole:material('#292a29',.9),belt:material('#3f332c',.65),buckle:material('#a6a296',.35,{metalness:.7}),
  };
  root.userData.description='Stylized reference likeness; blue shirt and swept dark hair from photo 1; facial proportions from photo 2. Shoes and full trouser cut are inferred.';
  const body=new THREE.Group();body.name='Upper_body';root.add(body);
  const torsoProfile=[
    [.94,.146,.091,-.002],[1.01,.152,.098,0],[1.12,.161,.105,0],[1.25,.175,.108,-.004],
    [1.36,.191,.105,-.008],[1.42,.195,.094,-.009],[1.46,.10,.067,-.006],[1.475,.054,.048,0],
  ];
  addMesh(body,ringGeometry(torsoProfile,48),m.shirt);
  const neck=addMesh(body,new THREE.CylinderGeometry(.052,.057,.16,24),m.skin,[0,1.50,0]);neck.name='Neck';
  const head=makeHead(m);head.position.y=1.675;head.name='Reference_head';body.add(head);
  collar(body,m);
  // Button placket follows the convex front of the fitted shirt.
  tube(body,[[0,.955,.096],[0,1.1,.108],[0,1.27,.106],[0,1.4,.087]],.007,m.shirtShadow,28);
  for(let i=0;i<6;i++){
    const y=.985+i*.067,z=y<1.25?.111:.105;
    ellipsoid(body,m.buttons,[.001,y,z],[.006,.006,.0025],12);
  }
  for(const side of [-1,1]){
    tube(body,[[side*.147,.98,-.003],[side*.16,1.13,-.005],[side*.184,1.33,-.009],[side*.19,1.4,-.015]],.0013,m.stitch);
    // Gentle cloth folds, close to the surface rather than painted heavy stripes.
    for(let i=0;i<3;i++)tube(body,[[side*.02,1.02+i*.045,.105],[side*.08,1.005+i*.045,.10],[side*.13,1.015+i*.045,.075]],.0011,m.shirtShadow,16);
  }
  tube(body,[[-.16,1.425,-.069],[0,1.435,-.083],[.16,1.425,-.069]],.0012,m.stitch);
  const leftArm=new THREE.Group();leftArm.name='Left_arm';body.add(leftArm);
  const rightArm=new THREE.Group();rightArm.name='Right_arm';body.add(rightArm);
  makeArm(leftArm,[-.185,1.414,-.001],[-.24,1.17,.025],[-.19,1.01,.14],m);
  makeArm(rightArm,[.185,1.414,-.001],[.285,1.19,.03],[.14,1.115,.195],m);
  // Belt and lightly separated, straight trouser legs.
  const pelvis=addMesh(root,ringGeometry([[.87,.153,.098,-.004],[.955,.15,.095,-.002]],40),m.trousers);
  addMesh(root,new THREE.CylinderGeometry(.153,.153,.035,40),m.belt,[0,.956,-.002],[1,1,.64]);
  addMesh(root,new THREE.BoxGeometry(.035,.027,.009),m.buckle,[0,.956,.098]);
  for(const side of [-1,1]){
    const hip=[side*.077,.89,0],knee=[side*.085,.49,.009],ankle=[side*.092,.115,.015];
    limb(root,hip,knee,.089,.062,1.02,m.trousers);limb(root,knee,ankle,.063,.044,1,m.trousers);
    ellipsoid(root,m.trousers,knee,[.061,.075,.063]);
    tube(root,[[side*.148,.86,-.012],[side*.145,.56,.007],[side*.137,.15,.015]],.0012,m.seam);
    tube(root,[[side*.091,.91,.085],[side*.12,.84,.07],[side*.14,.82,.035]],.0015,m.seam,16);
    ellipsoid(root,m.leather,[side*.095,.075,.055],[.062,.057,.135]);
    ellipsoid(root,m.sole,[side*.095,.03,.06],[.064,.025,.138]);
    for(let i=0;i<3;i++)tube(root,[[side*.095-.021,.12-i*.002,.02+i*.017],[side*.095+.021,.12-i*.002,.02+i*.017]],.0017,m.sole,8);
  }
  // Soft local contact patch anchors the model even when a static light shadow is distant.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');
  const gradient=c.createRadialGradient(64,64,6,64,64,60);gradient.addColorStop(0,'rgba(42,33,23,.23)');gradient.addColorStop(1,'rgba(42,33,23,0)');c.fillStyle=gradient;c.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(.8,.65),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.008;shadow.name='Contact_shadow';root.add(shadow);
  root.scale.setScalar(.98);
  return {
    group:root,head,body,materials:m,
    update(time, viewer=null){
      body.position.y=Math.sin(time*1.65)*.0018;
      body.rotation.z=Math.sin(time*.65)*.003;
      let yaw=Math.sin(time*.38)*.035;
      if(viewer){const local=root.worldToLocal(viewer.clone());if(local.length()<5)yaw=THREE.MathUtils.clamp(Math.atan2(local.x,local.z),-.28,.28);}
      head.rotation.y=THREE.MathUtils.lerp(head.rotation.y,yaw,.035);
      head.rotation.x=Math.sin(time*.45)*.012;
    },
  };
}

function makeArm(parent,shoulder,elbow,wrist,m) {
  ellipsoid(parent,m.shirt,[shoulder[0]*.94,1.385,-.006],[.077,.065,.087]);
  const start=[shoulder[0]*.85,shoulder[1]-.015,shoulder[2]];
  const curve=new THREE.CatmullRomCurve3([start,shoulder,elbow,wrist].map(p=>new THREE.Vector3(...p)));
  const sleeve=new THREE.TubeGeometry(curve,48,1,24,false),positions=sleeve.attributes.position;
  for(let row=0;row<=48;row++){
    const t=row/48,centre=curve.getPointAt(t),radius=THREE.MathUtils.lerp(.066,.034,t);
    for(let j=0;j<=24;j++){
      const i=row*25+j;positions.setXYZ(i,centre.x+(positions.getX(i)-centre.x)*radius,centre.y+(positions.getY(i)-centre.y)*radius,centre.z+(positions.getZ(i)-centre.z)*radius);
    }
  }
  sleeve.computeVertexNormals();addMesh(parent,sleeve,m.shirt);
  const direction=new THREE.Vector3(...wrist).sub(new THREE.Vector3(...elbow)).normalize();
  const cuffCentre=new THREE.Vector3(...wrist).addScaledVector(direction,-.013);
  const cuff=addMesh(parent,new THREE.CylinderGeometry(.036,.037,.052,24),m.collar,cuffCentre.toArray());cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
  const handCentre=new THREE.Vector3(...wrist).addScaledVector(direction,.042);
  const hand=ellipsoid(parent,m.skin,handCentre.toArray(),[.031,.051,.021]);hand.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);
  for(let i=0;i<4;i++){
    const finger=handCentre.clone().addScaledVector(direction,.037);finger.x+=(i-1.5)*.012;
    const mesh=ellipsoid(parent,m.skin,finger.toArray(),[.007,.023,.008],12);mesh.quaternion.copy(hand.quaternion);
  }
  ellipsoid(parent,m.skin,[handCentre.x+(wrist[0]>0?-.024:.024),handCentre.y+.006,handCentre.z+.006],[.014,.025,.013],16);
}
