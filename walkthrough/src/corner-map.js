export function createCornerMap(world,controller,npcs,network,onOpen){
  const button=document.createElement('button');button.className='corner-map';button.id='corner-map';button.setAttribute('aria-label','Открыть карту этажа');
  const heading=document.createElement('span');heading.textContent='ПЛАН ЭТАЖА';const canvas=document.createElement('canvas');canvas.width=440;canvas.height=400;const footer=document.createElement('small');footer.textContent='● Вы   ◆ Преподаватели   M — открыть';button.append(heading,canvas,footer);button.onclick=onOpen;document.getElementById('campus-hud').append(button);
  const ctx=canvas.getContext('2d'),scale=3.9,px=x=>36+(x+54)*scale,pz=z=>24+(z+10)*scale;
  return {update(){
    ctx.fillStyle='#272b3c';ctx.fillRect(0,0,440,400);
    ctx.fillStyle='#a89b8277';for(const r of world.regions)ctx.fillRect(px(r.x1),pz(r.z1),(r.x2-r.x1)*scale,(r.z2-r.z1)*scale);
    ctx.fillStyle='#d9b87c';for(const npc of npcs){const x=px(npc.x),y=pz(npc.z);ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(-3.4,-3.4,6.8,6.8);ctx.restore();}
    ctx.fillStyle='#8dd4ce';for(const p of network.remotePlayers.values()){ctx.beginPath();ctx.arc(px(p.targetX),pz(p.targetZ),3.5,0,Math.PI*2);ctx.fill();}
    ctx.save();ctx.translate(px(controller.x),pz(controller.z));ctx.rotate(-controller.yaw);ctx.fillStyle='#fff0ce';ctx.shadowColor='#e4c78b';ctx.shadowBlur=8;ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(-5,5);ctx.lineTo(0,2);ctx.lineTo(5,5);ctx.closePath();ctx.fill();ctx.restore();
  }};
}
