import * as THREE from 'three';

// Dimensions are inferred from the supplied photographs, in metres.
export function referenceDetails(b, m, region, obstacles) {
  const local=(x,y,z,u,v,n,ry)=>b.local(x,y,z,u,v,n,ry);
  function panelDoor(x,z,ry=0,w=1.18,number='206а'){
    const box=(u,y,n,ww,h,d,mat)=>b.localBox(x,0,z,u,y,n,ww,h,d,mat,ry);
    box(0,1.34,0,w+.16,2.75,.16,'ivory');
    box(0,1.3,.09,w,2.6,.06,'whiteDoor');
    for(const side of [-1,1]){
      box(side*w/4,1.29,.135,.024,2.55,.025,'ivory');
      for(const [y,h] of [[.45,.48],[1.12,.48],[1.98,.9]]){
        box(side*w/4,y,.127,w/2-.11,h,.018,'whiteDoor');
        for(const u of [-1,1])box(side*w/4+u*(w/4-.055),y,.15,.018,h,.025,'ivory');
        for(const v of [-1,1])box(side*w/4,y+v*h/2,.15,w/2-.11,.018,.025,'ivory');
      }
    }
    box(.055,1.05,.21,.022,.18,.04,'brass');
    box(.1,1.1,.23,.11,.018,.018,'brass');
    b.label(...local(x,0,z,0,2.68,.14,ry),number,.23,.1,ry,{background:'#b7a879',color:'#453e31',size:80});
  }
  function window(x,z,ry=0,w=1.3,h=2.55,y=2.05,frame='whiteDoor',columns=2){
    // A shallow luminous reveal provides daylight without a full exterior scene.
    b.localBox(x,y,z,0,0,-.04,w+.24,h+.22,.14,'ivory',ry);
    b.panel(...local(x,y,z,0,0,.041,ry),w,h,m.daylight,ry);
    for(let i=0;i<=columns;i++)b.localBox(x,y,z,-w/2+i*w/columns,0,.07,.045,h,.06,frame,ry);
    for(const v of [-h/2,-.35,h*.26,h/2])b.localBox(x,y,z,0,v,.075,w,.045,.06,frame,ry);
    b.localBox(x,y,z,0,-h/2-.04,.16,w+.28,.07,.34,'ivory',ry);
    const bottom=y-h/2;
    b.localBox(x,bottom/2,z,0,0,.1,w*.86,Math.max(.2,bottom-.18),.18,'whiteDoor',ry);
    for(let i=0;i<12;i++)b.localBox(x,bottom/2,z,-w*.37+i*w*.067,0,.2,.015,Math.max(.16,bottom-.25),.012,'ivory',ry);
  }
  function glazedExhibit(x,y,z,w,h,index,ry=0){
    b.frame(x,y,z,w,h,m.displayPosters[index%6],ry,'steel');
    for(const u of [-w/2,w/2])for(const v of [-h/2,h/2])
      b.sphere(...local(x,y,z,u*.95,v*.97,.085,ry),.018,'steel');
    b.localBox(x,y,z,0,h/2+.18,.13,w*.57,.025,.035,'steel',ry);
    b.localBox(x,y,z,0,h/2+.23,.02,.025,.13,.035,'steel',ry);
    // Barely visible glass front, independent of the paper illustration.
    b.panel(...local(x,y,z,0,0,.09,ry),w+.04,h+.04,m.glass,ry);
  }
  function monitorDesk(x,z,ry=0,count=3){
    b.localBox(x,0,z,0,.49,0,count*.46,.98,.48,'steel',ry);
    b.localBox(x,0,z,0,1,0,count*.46+.05,.055,.55,'black',ry);
    for(let i=0;i<count;i++){
      const u=(i-(count-1)/2)*.46;
      b.localBox(x,0,z,u,1.13,-.07,.045,.24,.07,'iron',ry);
      b.localBox(x,0,z,u,1.4,-.09,.39,.3,.04,'black',ry);
      b.localBox(x,0,z,u,1.4,-.064,.34,.255,.005,'doorInset',ry);
      b.localBox(x,0,z,u,1.05,.12,.32,.018,.13,'iron',ry);
    }
    const dx=Math.abs(Math.cos(ry))*count*.23+Math.abs(Math.sin(ry))*.25;
    const dz=Math.abs(Math.sin(ry))*count*.23+Math.abs(Math.cos(ry))*.25;
    obstacles.push({x1:x-dx,x2:x+dx,z1:z-dz,z2:z+dz});
  }
  function lift(x,z,ry=0){
    b.localBox(x,0,z,0,1.5,0,1.5,3,.15,'steel',ry);
    for(const u of [-.34,.34])b.localBox(x,0,z,u,1.38,.09,.66,2.72,.04,'steel',ry);
    b.localBox(x,0,z,0,1.38,.12,.012,2.7,.01,'iron',ry);
    b.label(...local(x,0,z,.53,2.65,.13,ry),'2',.09,.1,ry,{background:'#322c30',color:'#f56c7e',size:130});
    b.localBox(x,0,z,.91,1.15,.08,.09,.28,.035,'steel',ry);
    b.label(...local(x,0,z,.91,1.15,.105,ry),'⌃',.07,.15,ry,{background:'#a6afb0',color:'#474c4b',size:100});
    for(const [i,text] of ['РЕКТОРАТ ↑','ПЛОЩАДЬ ПАМЯТИ ≪','ЦВЕТОЧНАЯ ПЛОЩАДЬ ≫'].entries())
      b.label(...local(x,0,z,1.55,1.96-i*.22,.12,ry),text,1.1,.17,ry,{background:'#dddcd1',color:'#646a68',size:48});
  }
  function centralStair(){
    // Broad first flight, landing in front of the tall window, two return flights.
    const z0=2.08,run=.27,rise=.145,n=14,width=3.65;
    region(-4.3,4.3,1.75,3.25);
    b.floor(0,2.5,8.6,1.5);
    region(-width/2,width/2,3.15,6.93,(_x,z)=>Math.max(0,Math.min(n*rise,(z-3.15)/run*rise)));
    for(let i=0;i<n;i++){
      b.box(0,(i+1)*rise/2,3.15+(i+.5)*run,width,(i+1)*rise,run,'step');
      b.box(0,(i+1)*rise+.006,3.15+i*run+.018,width,.018,.036,'steel');
    }
    region(-4.3,4.3,6.93,8.5,n*rise);b.floor(0,7.72,8.6,1.58,n*rise);
    for(const side of [-1,1]){
      b.rail(side*1.88,3.15,side*1.88,6.93,0,n*rise);
      for(let i=0;i<14;i++)b.box(side*3.18,n*rise+(i+.5)*rise,6.93-(i+.5)*run,1.9,rise,run,'step');
      b.put(b.cube,m.ivory,side*3.18,n*rise*1.5-.13,6.93-n*run/2,1.94,.22,Math.hypot(n*run,n*rise),0,Math.atan2(rise,run));
      b.rail(side*2.21,6.93,side*2.21,3.15,n*rise,n*rise);
      b.wallZ(side*4.45,z0,8.65,0,'plaster',8.25);
      for(const z of [2.3,8.45])b.box(side*4.22,4.1,z,.4,8.2,.38,'marble');
      b.rail(side*2.13,3.12,side*4.15,3.12,0,0);
    }
    b.wallX(-4.45,4.45,8.65,0,'plaster',8.25);
    window(0,8.5,Math.PI,3.85,5.15,4.75,'wood',4);
    b.box(0,8.28,5.4,9,.16,6.5,'ceiling');
    for(const x of [-3,0,3])b.box(x,8.12,5.4,.3,.3,6.5,'ivory');
    for(const side of [-1,1]){
      b.box(side*4.1,1.95,1.99,.4,3.9,.44,'marble');
      b.box(side*4.1,3.84,1.99,.6,.18,.6,'ivory');
    }
    b.box(0,3.97,1.99,8.6,.27,.4,'ivory');
    b.light(0,5.5,7.9,70,13,'#e1edff');
    lift(-3.22,1.82,Math.PI);
    obstacles.push({x1:-4.1,x2:-2.4,z1:1.65,z2:2.15});
    for(const x of [-4.1,4.1])obstacles.push({x1:x-.25,x2:x+.25,z1:1.76,z2:2.22});
  }
  return {panelDoor,window,glazedExhibit,monitorDesk,lift,centralStair};
}
