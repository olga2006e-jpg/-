import * as THREE from 'three';

function rng(seed) {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
}

function canvasTexture(draw, size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d'), size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function stone(base, vein, seed, dark = false) {
  return canvasTexture((c, size) => {
    const random = rng(seed);
    const hash=(x,y)=>{let n=Math.imul(x+seed,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
    const noise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);let tx=x-ix,ty=y-iy;tx=tx*tx*(3-2*tx);ty=ty*ty*(3-2*ty);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),tx),THREE.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),tx),ty);};
    const fbm=(x,y)=>noise(x,y)*.57+noise(x*2.1,y*2.1)*.27+noise(x*4.3,y*4.3)*.12+noise(x*8.4,y*8.4)*.04;
    const image=c.createImageData(size,size);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const n=fbm(x*.024,y*.024),veins=Math.abs(Math.sin(x*.013+y*.018+n*13));
      const thin=Math.pow(Math.max(0,1-veins/.085),2),shade=(n-.5)*(dark?23:19)+(random()-.5)*4;
      const rgb=dark?[38,33,35]:[174,162,142];
      const index=(y*size+x)*4;
      for(let ch=0;ch<3;ch++)image.data[index+ch]=rgb[ch]+shade+(dark?thin*130:-thin*33);
      image.data[index+3]=255;
    }
    c.putImageData(image,0,0);
  });
}

export function makeMaterials() {
  const m = {};
  const standard = (name, color, roughness = .75, metalness = 0, extra = {}) =>
    m[name] = new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
  standard('plaster', '#e2dccb');
  standard('ivory', '#f1eadb');
  standard('ceiling', '#f4f0e8', .95);
  standard('ceilingInset', '#d3d1c8', .95);
  standard('terracotta', '#a75641');
  standard('redSquare', '#ad503c');
  standard('ochre', '#d8bc7f');
  standard('door', '#737d7e', .8);
  standard('doorInset', '#687275', .8);
  standard('brass', '#ac8b45', .28, .72);
  standard('bronze', '#554537', .43, .56);
  standard('foliage', '#424c31', .85, .04);
  standard('iron', '#272b29', .55, .55);
  standard('wood', '#71513a', .65);
  standard('blue', '#163e80', .45);
  standard('whiteDoor', '#d9d9cc', .6);
  standard('steel', '#a6afb0', .26, .78);
  standard('paper', '#e3dfd0', .85);
  m.daylight = new THREE.MeshBasicMaterial({color:'#e4eff0'});
  standard('black', '#282a28', .68);
  standard('glass', '#95b2b7', .18, .3, { transparent: true, opacity: .23, depthWrite: false });
  standard('doorGlass', '#9eaaa4', .42, .1);
  standard('marble', '#ffffff', .34, .03, { map: stone('#b8a17b', '#665541', 41) });
  standard('darkMarble', '#ffffff', .26, .08, { map: stone('#352c2b', '#f0e4cd', 97, true) });
  standard('brownMarble', '#ffffff', .35, .04, { map: stone('#74604b', '#c7b59b', 72) });
  standard('step', '#ffffff', .64, 0, { map: canvasTexture((c, s) => {
    c.fillStyle = '#aaa18d'; c.fillRect(0, 0, s, s); const random = rng(4);
    for (let i = 0; i < 28000; i++) { const n = Math.floor(65 + random() * 150); c.fillStyle = `rgb(${n},${n-3},${n-10})`; c.fillRect(random()*s, random()*s, 1.5, 1.5); }
  }) });
  m.lamp = new THREE.MeshBasicMaterial({ color: '#fff5db' });
  m.coolLamp = new THREE.MeshBasicMaterial({ color: '#b8e4ff' });
  m.exit = new THREE.MeshBasicMaterial({ color: '#67d2ad' });
  m.screen = new THREE.MeshBasicMaterial({ color: '#6ac8d7' });
  m.ink = new THREE.MeshBasicMaterial({ color: '#2a2c29' });
  const portraits = [];
  for (let index = 0; index < 16; index++) {
    const tex = canvasTexture((c, s) => {
      const random = rng(200 + index), warm = index % 5 === 0;
      c.fillStyle = warm ? '#ad9c82' : '#b3b1a6'; c.fillRect(0, 0, s, s);
      const halo = c.createRadialGradient(s*.5,s*.38,4,s*.5,s*.48,s*.6);
      halo.addColorStop(0, '#e3dfcf'); halo.addColorStop(1, '#7c7d75'); c.fillStyle=halo;c.fillRect(0,0,s,s);
      c.fillStyle = index%3 ? '#353c3b' : '#514d49';
      c.beginPath(); c.moveTo(s*.05,s); c.bezierCurveTo(s*.11,s*.58,s*.35,s*.64,s*.5,s*.61);c.bezierCurveTo(s*.7,s*.65,s*.9,s*.55,s*.97,s);c.fill();
      c.fillStyle = '#d5c9af'; c.beginPath();c.ellipse(s*.5,s*.36,s*(.14+random()*.02),s*.205,0,0,Math.PI*2);c.fill();
      c.fillStyle = index%4===0 ? '#c9c6b5' : '#65645c';
      c.beginPath();c.ellipse(s*.5,s*.23,s*.16,s*.13,0,Math.PI,Math.PI*2);c.lineTo(s*.66,s*.34);c.lineTo(s*.59,s*.21);c.lineTo(s*.38,s*.26);c.lineTo(s*.34,s*.4);c.closePath();c.fill();
      c.strokeStyle='#676359';c.lineWidth=3;
      for (const dx of [-.055,.055]) {c.beginPath();c.moveTo(s*(.5+dx-.025),s*.36);c.lineTo(s*(.5+dx+.025),s*.36);c.stroke();}
      c.strokeStyle='#938775';c.lineWidth=2;c.beginPath();c.moveTo(s*.5,s*.37);c.lineTo(s*.48,s*.46);c.lineTo(s*.52,s*.46);c.stroke();
      c.beginPath();c.moveTo(s*.46,s*.5);c.lineTo(s*.55,s*.5);c.stroke();
      c.fillStyle='#e6dfcb';c.beginPath();c.moveTo(s*.4,s*.64);c.lineTo(s*.5,s*.8);c.lineTo(s*.59,s*.64);c.closePath();c.fill();
      c.fillStyle='#514b44';c.beginPath();c.moveTo(s*.49,s*.7);c.lineTo(s*.45,s*.94);c.lineTo(s*.55,s*.94);c.lineTo(s*.51,s*.7);c.fill();
      // Fine grain keeps placeholder portraits quiet at walking distance.
      for(let i=0;i<5000;i++){c.fillStyle=`rgba(30,25,20,${random()*.045})`;c.fillRect(random()*s,random()*s,1,1);}
    }, 256);
    portraits.push(new THREE.MeshStandardMaterial({map:tex,roughness:.72}));
  }
  m.portraits = portraits;
  m.displayPosters = Array.from({length:6},(_,index)=>new THREE.MeshStandardMaterial({roughness:.8,map:canvasTexture((c,s)=>{
    const random=rng(index+12);c.fillStyle='#d3c29a';c.fillRect(0,0,s,s);
    c.fillStyle='#706444';c.textAlign='center';c.font='25px Georgia';c.fillText(['ИСТОРИЯ УНИВЕРСИТЕТА','МГТУ ИМ. Н. Э. БАУМАНА','НАУКА И ОБРАЗОВАНИЕ'][index%3],s/2,50);
    c.fillStyle='#99967f';c.fillRect(36,75,s-72,160);
    c.strokeStyle='#d5cdb6';c.lineWidth=2;for(let i=0;i<8;i++){c.beginPath();c.moveTo(45+i*55,225);c.lineTo(60+i*55,105+random()*90);c.stroke();}
    c.fillStyle='#81755b';for(let y=270;y<s-28;y+=13)c.fillRect(38,y,s-76-random()*65,2);
  })}));
  return m;
}

export function textMaterial(text, { color = '#62553d', background = '#e3d8bb', size = 38, serif = false, width = 1024, height = 256 } = {}) {
  const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');
  ctx.fillStyle=background;ctx.fillRect(0,0,width,height);ctx.fillStyle=color;
  ctx.textAlign='center';ctx.textBaseline='middle';let fontSize=size;
  ctx.font=`${fontSize}px ${serif?'Georgia':'Arial'}`;
  while(ctx.measureText(text).width>width-35&&fontSize>12)ctx.font=`${--fontSize}px ${serif?'Georgia':'Arial'}`;
  ctx.fillText(text,width/2,height/2);
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=4;
  return new THREE.MeshStandardMaterial({map,roughness:.7});
}

export function floorMaterial(width, length, style = 'regular') {
  const tile=.6, pixelsPerUnit=100;
  const w=Math.min(2048,Math.max(256,Math.round(width*pixelsPerUnit))),h=Math.min(4096,Math.max(256,Math.round(length*pixelsPerUnit)));
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const c=canvas.getContext('2d'),random=rng(57);
  c.fillStyle='#d5c7ac';c.fillRect(0,0,w,h);
  const sx=w/width,sz=h/length;
  for(let x=0;x<width;x+=tile)for(let z=0;z<length;z+=tile){
    const tone=Math.floor(196+random()*17);c.fillStyle=`rgb(${tone+15},${tone+5},${tone-16})`;c.fillRect(x*sx,z*sz,tile*sx,tile*sz);
    c.strokeStyle='#a69b8466';c.lineWidth=.65;c.strokeRect(x*sx,z*sz,tile*sx,tile*sz);
  }
  const line=(x,z,ww,hh,color='#584c3d')=>{c.fillStyle=color;c.fillRect(x*sx,z*sz,ww*sx,hh*sz);};
  for(const inset of [.12,.22,.32]){
    line(inset,inset,.045,length-inset*2);line(width-inset-.045,inset,.045,length-inset*2);
    line(inset,inset,width-inset*2,.045);line(inset,length-inset-.045,width-inset*2,.045);
  }
  if(style==='gallery'){
    for(let z=.8;z<length-1;z+=2.6){c.strokeStyle='#544b3c';c.lineWidth=.045*sx;c.strokeRect(.5*sx,z*sz,(width-1)*sx,1.8*sz);}
  }else if(style==='memorial'){
    // Eight pointed stone compass, photographed in the memorial hall.
    c.save();c.translate(w/2,h/2);c.scale(sx,sz);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4-Math.PI/2,r=i%2?2.05:2.6;
      c.fillStyle=i%2?'#624337':'#4c3630';
      c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);
      c.lineTo(Math.cos(a+.30)*.53,Math.sin(a+.30)*.53);
      c.lineTo(0,0);c.closePath();c.fill();
      c.fillStyle='#8e7260';c.beginPath();c.moveTo(Math.cos(a)*r,Math.sin(a)*r);
      c.lineTo(Math.cos(a-.30)*.53,Math.sin(a-.30)*.53);c.lineTo(0,0);c.closePath();c.fill();
    }
    c.restore();
  }else if(style==='museum'){
    c.save();c.translate(w/2,h/2);c.scale(sx,sz);c.strokeStyle='#5d4b38';c.lineWidth=.075;c.rotate(Math.PI/4);c.strokeRect(-1.1,-1.1,2.2,2.2);c.restore();
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
  return new THREE.MeshStandardMaterial({map,roughness:.38,metalness:.025});
}
