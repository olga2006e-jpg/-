import * as THREE from 'three';
import { Builder } from './builder.js';
import { textMaterial } from './materials.js';
import { referenceDetails } from './reference-details.js';

export const START = { x: 28, z: 1.15, yaw: 1.30 };
export const LANDMARKS = [
  {number:'01',title:'Правая лестница',description:'Музейная экспозиция · начало маршрута',x:27,z:0,radius:5},
  {number:'05',title:'Доска почёта',description:'Середина главного коридора',x:0,z:0,radius:7},
  {number:'07',title:'Левая лестница',description:'Копировальный киоск · вход в галерею',x:-27,z:0,radius:5},
  {number:'09',title:'Портретная галерея',description:'Левый коридор · история университета',x:-27,z:17,radius:14},
  {number:'11',title:'Левый коридор',description:'Небольшой подъём · проход к Красной площади',x:-27,z:43,radius:12},
  {number:'12',title:'Красная площадь',description:'Колонны · памятник · проход к столовой',x:-27,z:59.5,radius:7},
  {number:'13',title:'Лестница у выхода',description:'Левая лестничная площадка',x:-27,z:73,radius:8},
];

export function makeWorld(scene, materials) {
  const b=new Builder(scene,materials),m=materials;
  const regions=[],obstacles=[];
  const region=(x1,x2,z1,z2,height=0)=>regions.push({x1,x2,z1,z2,height});
  const detail=referenceDetails(b,m,region,obstacles);
  const ceilingH=4.1;

  function framedPoster(x,y,z,index,w=.65,h=.85,ry=0){
    b.frame(x,y,z,w,h,m.displayPosters[index%6],ry,'brownMarble');
    b.sconce(...b.local(x,y,z,0,h/2+.12,0,ry),ry);
  }

  function doorway(x,z,base,ry,number){b.door(x,z,base,ry,number);}

  function upperCorridor(){
    const a=-23.5,c=23.5,width=3.7;
    region(a,c,-width/2,width/2);
    b.floor(0,0,c-a,width);b.ceiling(0,0,c-a,width);
    const bays=10,step=(c-a)/bays;
    for(let i=0;i<bays;i++){
      const x=a+(i+.5)*step;
      for(const side of [-1,1]){
        const z=side*(width/2+.1),ry=side===-1?0:Math.PI;
        const lo=x-step/2,hi=x+step/2;
        const studyEntrance=side===-1&&i===8;
        if(studyEntrance){
          b.wallX(lo,15.0,z);b.wallX(16.4,hi,z);
          b.box(15.7,3.45,z,1.4,1.3,.22,'plaster');
        }else if(side===1&&lo<4.5&&hi>-4.5){
          if(lo<-4.5)b.wallX(lo,-4.5,z);
          if(hi>4.5)b.wallX(4.5,hi,z);
        }else b.wallX(lo,hi,z);
        if(side===-1||Math.abs(lo)>4.5)b.box(lo,2,z,.3,4.04,.3,'marble');
        if(Math.abs(x)>6){
          if(!studyEntrance)doorway(x-.75,z-side*.14,0,ry,String(100+i*2+(side>0?1:0)));
          framedPoster(x+1.0,1.9,z-side*.14,i,.65,.8,ry);
        }
        if(side===-1&&[1,3,6,8].includes(i))detail.window(x+1.35,z+.15,0,.92,2.5,2.12);
      }
      b.box(x,3.93,0,.23,.31,width,'ivory');
      for(const side of [-1,1]){
        b.box(x,4.015,side*1.63,step-.2,.045,.055,'ivory');
        b.box(x-step/2+.2,4.015,0,.045,.045,3.3,'ivory');
        b.box(x,3.99,side*1.74,step,.07,.055,'ivory');
      }
      b.chandelier(x,0);
    }
    // Photo 5: the broad board on the outer wall, opposite the central staircase.
    b.label(0,3.22,-1.79,'ДОСКА ПОЧЁТА',4.2,.35,0,{background:'#e7ddbf',color:'#65523c',size:75});
    const seal=crestMaterial();b.panel(0,2.35,-1.785,.85,1.05,seal);
    for(const side of [-1,1])for(let row=0;row<4;row++)for(let col=0;col<6;col++){
      const x=side*(1.0+col*.57);b.portrait(x,2.85-row*.58,-1.77,col+row*6,.38,.43);
    }
    detail.centralStair();
    // A small playable classroom behind an existing corridor door.
    region(13.3,18.1,-7.1,-1.84);b.floor(15.7,-4.48,4.8,5.24);b.ceiling(15.7,-4.48,4.8,5.24);
    b.wallX(13.3,18.1,-7.2);b.wallZ(13.2,-7.2,-2);b.wallZ(18.2,-7.2,-2);
    b.frame(15.7,2.25,-7.05,3.3,1.6,new THREE.MeshStandardMaterial({color:'#344d47'}),0,'wood');
    b.label(15.7,2.45,-6.99,'ЗНАНИЯ ОТКРЫВАЮТ ДВЕРИ',2.8,.22,0,{background:'#344d47',color:'#e4e0c7',size:68});
    b.label(15.7,1.94,-6.99,'TCP  ·  HTTP  ·  WebSocket',2.6,.2,0,{background:'#344d47',color:'#d5c99e',size:64});
    for(const xx of [14.35,17.05]){
      b.box(xx,.77,-5.05,1.15,.07,.72,'wood');
      for(const dx of [-.48,.48])for(const dz of [-.25,.25])b.box(xx+dx,.37,-5.05+dz,.035,.74,.035,'iron');
      obstacles.push({x1:xx-.6,x2:xx+.6,z1:-5.46,z2:-4.64});
    }
    b.chandelier(15.7,-4.35);
  }

  function crestMaterial(){
    const c=document.createElement('canvas');c.width=512;c.height=640;const ctx=c.getContext('2d');
    ctx.clearRect(0,0,512,640);
    ctx.fillStyle='#aa8c3c';ctx.beginPath();ctx.moveTo(100,80);ctx.lineTo(412,80);ctx.lineTo(396,400);ctx.quadraticCurveTo(330,545,256,590);ctx.quadraticCurveTo(155,530,116,400);ctx.closePath();ctx.fill();
    ctx.fillStyle='#244b76';ctx.beginPath();ctx.moveTo(119,104);ctx.lineTo(393,104);ctx.lineTo(375,397);ctx.quadraticCurveTo(319,515,256,553);ctx.quadraticCurveTo(177,510,136,394);ctx.closePath();ctx.fill();
    ctx.fillStyle='#d8ba52';ctx.font='bold 70px Georgia';ctx.textAlign='center';ctx.fillText('МГТУ',256,230);ctx.font='108px Georgia';ctx.fillText('Б',256,365);ctx.font='42px Georgia';ctx.fillText('1830',256,458);
    for(let side of [-1,1])for(let i=0;i<13;i++){
      ctx.save();ctx.translate(256+side*(180-25*Math.sin(i/13*Math.PI)),130+i*27);ctx.rotate(side*(.4+i*.06));ctx.fillStyle=i%2?'#bc9f4b':'#818f64';ctx.beginPath();ctx.ellipse(0,0,12,26,side*.6,0,Math.PI*2);ctx.fill();ctx.restore();
    }
    const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({map,transparent:true,roughness:.55,metalness:.15});
  }

  function cofferedCeiling(x,z,w,d,cool=false,base=0){
    b.ceiling(x,z,w,d,base);
    const nx=3,nz=3,cw=w/nx,cd=d/nz;
    for(let ix=0;ix<nx;ix++)for(let iz=0;iz<nz;iz++){
      const xx=x-w/2+(ix+.5)*cw,zz=z-d/2+(iz+.5)*cd;
      b.box(xx,base+4.07,zz,cw-.15,.08,cd-.15,'ceilingInset');
      for(const side of [-1,1]){
        b.box(xx+side*(cw/2-.12),base+4.00,zz,.07,.1,cd-.12,'ivory');
        b.box(xx,base+4.00,zz+side*(cd/2-.12),cw-.12,.1,.07,'ivory');
        if(cool){
          b.box(xx+side*(cw/2-.19),base+4.045,zz,.023,.01,cd-.35,'coolLamp');
          b.box(xx,base+4.045,zz+side*(cd/2-.19),cw-.35,.01,.023,'coolLamp');
        }
      }
    }
  }

  function museum(){
    region(23.5,30.6,-3.5,3.5);
    b.floor(27.05,0,7.1,7,0,'memorial');cofferedCeiling(27.05,0,7.1,7,false);
    // The museum wall lies to the right when facing the horizontal corridor.
    b.wallX(23.5,30.6,-3.6,0,'terracotta');
    b.box(27.05,3.44,-3.43,7.1,1.1,.18,'darkMarble');
    for(const x of [23.75,26.35,29.95])b.box(x,1.95,-3.37,.38,3.9,.26,'darkMarble');
    detail.glazedExhibit(24.95,1.95,-3.25,.88,1.8,0);
    detail.glazedExhibit(28.97,1.95,-3.25,.8,1.8,1);
    b.box(27.5,.64,-2.98,1.18,.17,.58,'darkMarble');
    b.box(27.5,.3,-3.1,.96,.6,.38,'marble');
    const caseMat=new THREE.MeshPhysicalMaterial({color:'#d9e6df',transparent:true,opacity:.1,roughness:.1,metalness:0,depthWrite:false});
    b.box(27.5,1.6,-3.02,1.13,1.8,.6,caseMat);
    for(const xx of [27.13,27.73]){
      b.cylinder(xx,1.75,-3.06,.012,2.1,'brass');
      const cloth=new THREE.PlaneGeometry(.44,1.55,8,16),p=cloth.attributes.position;
      for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*24+p.getY(i)*4)*.035);
      cloth.computeVertexNormals();
      const flagMat=new THREE.MeshStandardMaterial({color:'#9a2226',side:THREE.DoubleSide,roughness:.9});
      b.put(cloth,flagMat,xx+.15,1.7,-3.03,1,1,1,-.12);
      b.label(xx+.14,1.65,-2.975,'СССР',.3,.15,0,{background:'#9a2226',color:'#c6ad62',size:130});
    }
    b.wallX(23.5,25.05,3.6,0,'terracotta');b.wallX(29.05,30.6,3.6,0,'terracotta');
    b.arch(27.05,3.52,3.65,0,0,'brownMarble');
    b.box(27.05,4.0,3.6,4,.2,.3,'ivory');b.exitSign(27.05,3.94,3.35,Math.PI);
    // Memorial photo arrangement around the white double door (photo 1).
    b.box(24.33,2.0,3.43,1.5,3.85,.06,'ivory');
    detail.panelDoor(24.3,3.34,Math.PI,1.04);
    for(const xx of [23.76,24.3,24.84])for(let row=0;row<2;row++)
      b.frame(xx,3.48-row*.38,3.32,.29,.29,m.portraits[(row*3+Math.round(xx))%16],Math.PI,'wood');
    for(const xx of [23.72,24.9])for(let row=0;row<4;row++)
      b.frame(xx,2.45-row*.51,3.32,.24,.32,m.portraits[(row+Math.round(xx))%16],Math.PI,'wood');
    b.label(24.3,3.81,3.30,'Мы перед ними в долгу неоплаченном',1.5,.12,Math.PI,{background:'#e8e0cd',color:'#53443a',size:50,serif:true});
    for(const xx of [23.57,25.08])b.box(xx,2,3.34,.055,3.88,.07,'darkMarble');
    b.wallZ(23.4,-3.5,-1.85,0,'darkMarble');b.wallZ(23.4,1.85,3.5,0,'darkMarble');
    b.box(23.42,3.67,0,.35,.9,3.7,'ivory');
    for(const zz of [-1.78,1.78])b.box(23.42,1.72,zz,.35,3.44,.18,'ivory');
    b.wallZ(30.7,-3.5,-1.65,0,'terracotta');b.wallZ(30.7,1.65,3.5,0,'terracotta');
    b.arch(30.65,0,3.12,0,Math.PI/2,'ivory');
    b.label(30.5,3.8,0,'ВЫХОД',.43,.14,-Math.PI/2,{background:'#278b75',color:'#eaffed',size:95});
    for(const zz of [-2.55,2.55]){
      b.frame(30.48,1.9,zz,.4,1.65,m.displayPosters[2],-Math.PI/2,'steel');
    }
    b.light(26.3,3.7,0,42,10,'#dfecff');
    splitStair(30.8,0,0,'east');
  }

  function splitStair(x,z,base,direction){
    const east=direction==='east',steps=12,run=.25,rise=.145,width=2.8;
    const transform=(u,v)=>east?[x+u,z+v]:[x+v,z-u];
    for(let i=0;i<steps;i++){
      const [xx,zz]=transform((i+.5)*run,0);
      b.box(xx,base+(i+1)*rise/2,zz,east?run:width,(i+1)*rise,east?width:run,'step');
      b.box(xx,base+(i+1)*rise+.003,zz,east?run:width,.012,east?width:run,'step');
    }
    const [lx,lz]=transform(3.7,0);b.floor(lx,lz,east?1.4:width,east?width:1.4,base+steps*rise);
    for(const side of [-1,1]){
      const a=transform(0,side*1.43),c=transform(3,side*1.43);b.rail(...a,...c,base,steps*rise);
      // Upper split flights are visible but the walk stays on the first-floor route.
      for(let i=0;i<10;i++){
        const [xx,zz]=transform(3.7,side*(1.35+(i+.5)*.25));
        b.box(xx,base+steps*rise+(i+1)*rise/2,zz,east?1.35:.25,(i+1)*rise,east?.25:1.35,'step');
      }
      const a2=transform(4.35,side*1.35),c2=transform(4.35,side*3.85);b.rail(...a2,...c2,base+steps*rise,1.45);
    }
    const [wx,wz]=transform(4.6,0);
    if(east){
      region(x,x+4.35,z-1.35,z+1.35,(xx)=>base+Math.min(steps*rise,Math.max(0,(xx-x)/run)*rise));
      b.wallZ(x+4.6,z-4,z+4,base,'plaster',7.8);
      framedPoster(x+4.45,base+3.1,z,2,1.6,1.1,-Math.PI/2);
      for(const side of [-1,1])detail.window(x+4.45,z+side*2.65,-Math.PI/2,1.22,4.7,base+3.7);
      b.wallX(x,x+4.6,z-4,base,'plaster',7.8);b.wallX(x,x+4.6,z+4,base,'plaster',7.8);
    }else{
      region(x-1.35,x+1.35,z-4.35,z,(_xx,zz)=>base+Math.min(steps*rise,Math.max(0,(z-zz)/run)*rise));
      b.wallX(x-4,x+4,z-4.6,base,'plaster',7.8);
      b.frame(x,base+3.5,z-4.45,1.45,.85,m.displayPosters[3],0,'wood');
      for(const side of [-1,1])detail.window(x+side*2.65,z-4.45,0,1.15,4.5,base+3.7);
      b.wallZ(x-4,z-4.6,z,base,'plaster',7.8);b.wallZ(x+4,z-4.6,z,base,'plaster',7.8);
    }
    b.box(wx,base+7.8,wz,east?9:8,.15,east?8:9,'ceiling');
    b.light(lx,base+4.5,lz,38,12);
  }

  function leftJunction(){
    region(-30.5,-23.5,-3.5,3.5);
    b.floor(-27,0,7,7,0,'gallery');cofferedCeiling(-27,0,7,7);
    b.wallZ(-30.6,-3.5,3.5);
    b.wallX(-30.5,-28.7,-3.6);b.wallX(-25.3,-23.5,-3.6);
    b.arch(-27,-3.5,3.25,0,0,'ivory');b.exitSign(-27,3.82,-3.27);
    b.wallZ(-23.4,-3.5,-1.85);b.wallZ(-23.4,1.85,3.5);
    b.box(-23.42,3.67,0,.35,.9,3.7,'ivory');
    for(const zz of [-1.78,1.78])b.box(-23.42,1.72,zz,.35,3.44,.18,'ivory');
    b.wallX(-30.5,-28.9,3.6);b.wallX(-25.1,-23.5,3.6);
    b.arch(-27,3.5,3.5,0,0,'brownMarble');b.exitSign(-27,3.82,3.27,Math.PI);
    // Photo 7: circular ceiling centre and the vivid blue copy kiosk.
    const disc=new THREE.CircleGeometry(2.2,64);b.put(disc,m.ceilingInset,-27,4.07,0,1,1,1,0,Math.PI/2);
    const ring=new THREE.TorusGeometry(2.2,.025,6,80);b.put(ring,m.ivory,-27,4.02,0,1,1,1,0,Math.PI/2);
    b.chandelier(-27,0,0,true);
    kiosk(-29.3,.85);
    // Glass continuation of the copy centre, with shelves behind the shopfront.
    b.box(-30.15,1.24,-1.25,.05,2.48,2.55,'steel');
    b.box(-30.10,1.4,-1.25,.018,1.8,2.45,'glass');
    for(const z of [-2.5,-1.25,0])b.box(-30.06,1.25,z,.06,2.5,.035,'steel');
    for(const y of [.55,.95,1.35])b.box(-30.30,y,-1.2,.3,.025,2.25,'ivory');
    detail.monitorDesk(-23.96,-.9,-Math.PI/2,3);
    detail.window(-23.55,2.65,-Math.PI/2,1.05,2.6,2.1);
    b.localBox(-23.6,3.03,-1,0,0,0,1.7,.9,.12,'black',-Math.PI/2);
    b.localBox(-23.6,3.03,-1,0,0,.075,1.56,.77,.015,'doorInset',-Math.PI/2);
    b.box(-25.16,.4,-2.95,.55,.8,.38,'whiteDoor');
    for(const side of [-1,1])b.box(-25.16+side*.25,.4,-2.71,.035,.8,.035,'ivory');
    splitStair(-27,-3.7,0,'north');
    framedPoster(-30.44,2,2.5,2,1.2,1.9,Math.PI/2);
    for(const [xx,zz,ry] of [[-25.1,-3.25,0],[-25.1,3.25,Math.PI]])
      b.label(xx,1.35,zz,'↘',.18,.18,ry,{background:'#388970',color:'#e9f5dd',size:120});
  }

  function kiosk(x,z){
    const w=1.65,d=1.05,h=2.45;
    b.box(x,.38,z,w,.76,d,'blue');b.box(x,h-.18,z,w,.36,d,'blue');
    for(const xx of [-w/2,w/2])for(const zz of [-d/2,d/2])b.box(x+xx,h/2,z+zz,.055,h,.055,'blue');
    b.box(x,1.42,z+d/2,w-.08,1.35,.012,'glass');
    b.box(x,1.03,z,.86,.43,.5,'ivory');b.box(x,1.28,z,.72,.08,.43,'black');
    for(let i=0;i<7;i++)b.box(x-.6+i*.19,.83,z+.28,.11,.07,.21,'plaster');
    b.label(x,1.83,z+d/2+.02,'КОПИРОВАЛЬНЫЙ ЦЕНТР',1.5,.2,0,{background:'#e2dfcf',color:'#464d50',size:48});
    obstacles.push({x1:x-w/2-.1,x2:x+w/2+.1,z1:z-d/2-.1,z2:z+d/2+.1});
  }

  function longCorridor(x,left){
    const width=3.7,firstEnd=left?30:67.5;
    region(x-width/2,x+width/2,3.5,firstEnd);
    b.floor(x,(3.5+firstEnd)/2,width,firstEnd-3.5,0,'gallery');b.ceiling(x,(3.5+firstEnd)/2,width,firstEnd-3.5);
    for(let z=3.5;z<firstEnd-.1;z+=4.4){
      const end=Math.min(z+4.4,firstEnd),mid=(z+end)/2;
      for(const side of [-1,1]){
        const wallX=x+side*(width/2+.1),ry=side<0?Math.PI/2:-Math.PI/2;
        b.wallZ(wallX,z,end);
        b.box(wallX,2.02,z,.31,4.04,.35,'marble');
        if(left&&side<0){
          for(let row=0;row<2;row++)for(let c=0;c<4;c++){
            const zz=z+.55+c*.92;b.portrait(wallX-side*.14,2.85-row*1.02,zz,Math.floor(z)+row*4+c,.58,.7,ry);
          }
        }else if(left){
          detail.window(wallX-side*.14,mid,ry,1.12,2.5,2.16);
          for(let row=0;row<2;row++)for(const dz of [-1.45,1.45])
            b.portrait(wallX-side*.14,2.85-row*1.02,mid+dz,Math.floor(z)+row+(dz>0?1:0),.45,.61,ry);
        }else{
          doorway(wallX-side*.14,mid,0,ry,String(110+Math.floor(z/4)*2+(side>0?1:0)));
          framedPoster(wallX-side*.14,1.95,z+.5,Math.floor(z),.65,.9,ry);
        }
        b.sconce(wallX-side*.15,3.14,mid,ry);
        b.box(wallX-side*.03,3.55,mid,.12,.09,end-z,'darkMarble');
      }
      b.chandelier(x,mid);
    }
    if(left){
      b.arch(x,30,3.5,0,0,'brownMarble');
      for(let i=0;i<3;i++)b.box(x,(i+1)*.16/2,30.2+i*.4,width,(i+1)*.16,.4,'step');
      region(x-width/2,x+width/2,30,31.2,(_x,z)=>Math.min(.48,Math.max(0,z-30)*.4));
      yellowCorridor(x,31.2,54.5,.48);
    }
  }

  function yellowCorridor(x,z1,z2,base){
    const width=3.7;region(x-width/2,x+width/2,z1,z2,base);
    b.floor(x,(z1+z2)/2,width,z2-z1,base);b.ceiling(x,(z1+z2)/2,width,z2-z1,base);
    // Cut-out framing replaces the solid doorway panel so the path remains visibly open.
    // The two narrow jambs and header do not cover the central opening.
    // (No navigation obstacle is placed here.)
    for(const side of [-1,1])b.box(x+side*1.71,base+1.9,z1,.25,3.8,.3,'darkMarble');
    b.box(x,base+3.83,z1,3.7,.22,.3,'darkMarble');
    for(let z=z1;z<z2-.1;z+=4.6){
      const end=Math.min(z+4.6,z2),mid=(z+end)/2;
      for(const side of [-1,1]){
        const xx=x+side*1.95,ry=side<0?Math.PI/2:-Math.PI/2;
        b.wallZ(xx,z,end,base,'ochre');
        doorway(xx-side*.14,mid,base,ry,String(130+Math.floor(z)));
        b.box(xx-side*.12,base+2.7,mid+1.7,.05,1.2,.65,'brownMarble');
      }
      b.box(x,base+3.57,mid,.12,.08,1.35,'iron');
      b.box(x,base+3.52,mid,.1,.025,1.3,'lamp');
      b.cylinder(x,base+3.84,mid,.007,.6,'iron');
      b.light(x,base+3.4,mid,22,10,'#fff7e9');
    }
    b.exitSign(x,base+3.7,z1+.03,Math.PI);
  }

  function redSquare(){
    const x=-27,z=59.5,base=.48,w=10,d=10;
    region(x-w/2,x+w/2,z-d/2,z+d/2,base);b.floor(x,z,w,d,base,'museum');
    cofferedCeiling(x,z,w,d,false,base);
    b.wallX(-32,-28.85,54.4,base,'redSquare');b.wallX(-25.15,-22,54.4,base,'redSquare');
    b.arch(x,54.55,3.5,base,0,'ivory');
    b.wallZ(-21.9,54.5,64.5,base,'redSquare');
    b.wallX(-32,-28.85,64.6,base,'redSquare');b.wallX(-25.15,-22,64.6,base,'redSquare');
    b.arch(x,64.5,3.5,base,0,'ivory');
    b.wallZ(-32.1,54.5,58,base,'redSquare');b.wallZ(-32.1,62,64.5,base,'redSquare');
    b.arch(-32,60,3.8,base,Math.PI/2,'ivory');
    b.column(-30.7,56.1,base);b.column(-23.3,56.1,base);
    for(const xx of [-30.8,-23.2])for(let zz=55;zz<64;zz+=.4)b.box(xx,base+3.82,zz,.2,.19,.18,'ivory');
    for(let ix=-1;ix<=1;ix++)for(let iz=-1;iz<=1;iz++){
      b.cylinder(x+ix*1.3,base+4.0,z+iz*1.3,.23,.04,'lamp');
      const ring=new THREE.TorusGeometry(.3,.018,6,32);b.put(ring,m.brass,x+ix*1.3,base+3.99,z+iz*1.3,1,1,1,0,Math.PI/2);
    }
    b.light(x,base+3.55,z,70,15,'#fff0d8');
    b.box(-22.13,base+2.2,60.9,.14,3.25,2.3,'wood');
    b.panel(-22.22,base+2.65,60.9,1.1,1.35,crestMaterial(),-Math.PI/2);
    framedPoster(-22.07,base+2.1,57,3,1.0,1.5,-Math.PI/2);
    framedPoster(-23.5,base+2.25,64.42,4,1.3,1.85,Math.PI);
    statue(-23.6,61.1,base);
    // Information terminal and the wooden tables from photo 12.
    b.box(-30.85,base+1.2,57.3,.65,2.4,.2,'black');b.box(-30.85,base+1.35,57.17,.56,1.65,.025,'screen');
    b.label(-30.85,base+1.65,57.145,'МГТУ',.42,.2,Math.PI,{background:'#65c8d7',color:'#f3ffff',size:100});
    for(let i=0;i<2;i++){
      const zz=60.2+i*1.6;b.box(-23.15,base+.78,zz,1.25,.07,1.45,'wood');
      for(const dx of [-.5,.5])for(const dz of [-.6,.6])b.box(-23.15+dx,base+.38,zz+dz,.035,.76,.035,'iron');
      obstacles.push({x1:-23.9,x2:-22.4,z1:zz-.8,z2:zz+.8});
    }
    cafeteriaPassage();
  }

  function statue(x,z,base){
    b.box(x,base+.5,z,.9,1,.75,'darkMarble');b.box(x,base+1.03,z,1.06,.12,.86,'bronze');
    const rings=[[0,.33,.22],[.18,.32,.20],[.49,.41,.23],[.67,.43,.24],[.77,.30,.19],[.83,.11,.105]];
    const vertices=[],indices=[],sides=24;
    for(const [y,rx,rz]of rings)for(let i=0;i<sides;i++){const angle=i/sides*Math.PI*2;vertices.push(Math.cos(angle)*rx,y,Math.sin(angle)*rz);}
    for(let row=0;row<rings.length-1;row++)for(let i=0;i<sides;i++){const a=row*sides+i,bb=row*sides+(i+1)%sides,c=a+sides,d=bb+sides;indices.push(a,c,bb,bb,c,d);}
    const torso=new THREE.BufferGeometry();torso.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));torso.setIndex(indices);torso.computeVertexNormals();
    b.put(torso,m.bronze,x,base+1.07,z);
    b.sphere(x,base+2.12,z,.19,'bronze',1.38);b.cylinder(x,base+1.91,z,.075,.16,'bronze');
    b.sphere(x+.05,base+2.12,z-.16,.058,'bronze',.65);
    b.sphere(x-.27,base+1.77,z,.13,'bronze',.75);b.sphere(x+.27,base+1.77,z,.13,'bronze',.75);
    for(const side of [-1,1]){
      b.sphere(x+side*.076,base+2.17,z-.166,.023,'darkMarble',.55);
      b.box(x+side*.12,base+1.62,z-.223,.035,.34,.017,'bronze',0);
    }
    b.box(x,base+2.025,z-.174,.085,.014,.015,'bronze');
    for(let i=0;i<3;i++)b.sphere(x+.04,base+1.22+i*.17,z-.23,.016,'brass');
    // Raised arm: shoulder, elbow, hand.
    const limb=(a,c,r)=>{
      const direction=new THREE.Vector3(c[0]-a[0],c[1]-a[1],c[2]-a[2]);
      const geo=new THREE.CylinderGeometry(r,r*1.12,direction.length(),10);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()));
      b.put(geo,m.bronze,(a[0]+c[0])/2,(a[1]+c[1])/2,(a[2]+c[2])/2);
    };
    limb([x+.25,base+1.73,z],[x+.55,base+2.07,z],.09);limb([x+.55,base+2.07,z],[x+.73,base+2.52,z],.065);b.sphere(x+.73,base+2.54,z,.075,'bronze',1.5);
    limb([x-.23,base+1.71,z],[x-.38,base+1.18,z-.08],.08);
    for(let i=0;i<24;i++){
      const a=i/24*Math.PI*2;
      b.put(b.ball,m.foliage,x+Math.cos(a)*.32,base+.85+Math.sin(a)*.48,z-.4,.075,.135,.035,0,0,-a);
    }
    obstacles.push({x1:x-.65,x2:x+.9,z1:z-.6,z2:z+.6});
  }

  function cafeteriaPassage(){
    const x1=-52,x2=-32,z=60,base=.48,w=3.8;
    region(x1,x2,z-w/2,z+w/2,base);b.floor((x1+x2)/2,z,x2-x1,w,base);b.ceiling((x1+x2)/2,z,x2-x1,w,base);
    for(let x=x1;x<x2;x+=5){
      b.wallX(x,Math.min(x+5,x2),z-w/2-.1,base);b.wallX(x,Math.min(x+5,x2),z+w/2+.1,base);
      b.chandelier(x+2.5,z,base);
    }
    b.wallZ(x1-.1,z-w/2,z+w/2,base);
    b.door(x1+.08,z,base,Math.PI/2,'');
    b.label(x1+.26,base+3.35,z,'СТОЛОВАЯ',1.65,.23,Math.PI/2,{background:'#e7ddbf',color:'#756045',size:110});
  }

  function exitStair(x,base){
    const z1=x<0?64.5:67.5;
    region(x-1.85,x+1.85,z1,70,base);b.floor(x,(z1+70)/2,3.7,70-z1,base);b.ceiling(x,(z1+70)/2,3.7,70-z1,base);
    b.wallZ(x-1.95,z1,70,base);b.wallZ(x+1.95,z1,70,base);
    region(x-2.6,x+2.6,70,78,base);
    b.floor(x,74,5.2,8,base);b.ceiling(x,74,5.2,8,base+3.2);
    b.wallZ(x-2.7,70,78,base,'plaster',7.3);b.wallZ(x+2.7,70,78,base,'plaster',7.3);b.wallX(x-2.7,x+2.7,78.1,base,'plaster',7.3);
    // First flight rises ahead; a ground-level passage remains on its right.
    for(let i=0;i<17;i++)b.box(x+.7,base+(i+1)*.15/2,70.5+(i+.5)*.32,1.9,(i+1)*.15,.32,'step');
    b.rail(x-.3,70.5,x-.3,75.94,base,2.55);
    region(x-.2,x+1.65,70.5,75.94,(_x,z)=>base+Math.max(0,(z-70.5)/.32)*.15);
    region(x-.2,x+1.65,75.94,77.5,base+2.55);b.floor(x+.7,76.72,1.9,1.56,base+2.55);
    b.door(x-2.54,75.5,base,Math.PI/2,'');b.exitSign(x-2.42,base+3.1,75.5,Math.PI/2);
    for(const zz of [71,74,77]){
      b.frame(x-2.55,base+2.0,zz,1.6,2.4,m.marble,Math.PI/2,'ivory');
      b.frame(x+2.55,base+4.4,zz,1.6,2.6,m.marble,-Math.PI/2,'ivory');
    }
    b.chandelier(x,72,base+3,true);b.light(x,base+3.7,74,40,13);
  }

  upperCorridor();museum();leftJunction();longCorridor(-27,true);longCorridor(27,false);redSquare();exitStair(-27,.48);exitStair(27,0);
  b.flush();
  return {regions,obstacles,lights:b.lights,landmarks:LANDMARKS};
}
