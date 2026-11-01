import {db} from './db.js';
import {PROFESSORS} from '../client/src/quest/professorQuest.js';
import {adminState} from './adminState.js';
import {generateResponse,classifyIntentActions} from './ai/agentService.js';

export const CAMPUS_MAP='bauman-v2';
export const CAMPUS_PROFESSORS={kanev:{x:25.65,z:-.9},korshunov:{x:28.05,z:17},maslennikov:{x:-28.05,z:12}};
const fresh=()=>({progress:{kanev:0,korshunov:0,maslennikov:0},completed:false,position:{x:28,y:1.66,z:1.15,rotY:1.3}});
export function createCampusService(clients){
  const sessions=new Map(),savedWorld=db.getQuestProgress('bauman-world-v2');
  const world={doors:savedWorld.doors||{},props:savedWorld.props||{},mutations:savedWorld.mutations||[]};
  for(const prop of Object.values(world.props))if(prop.heldBy){prop.heldBy=null;prop.action='place';prop.position.y=prop.position.x<0&&prop.position.z>31?.66:.18;}
  const worldSave=()=>db.saveQuestProgress({extra:world},'bauman-world-v2');
  const send=(p,msg)=>{if(p.ws.readyState===1)p.ws.send(JSON.stringify(msg));};
  const broadcast=msg=>{for(const p of clients.values())if(p.mapId===CAMPUS_MAP)send(p,msg);};
  const key=name=>'bauman-player-v2:'+name;
  function load(name){const s=db.getQuestProgress(key(name));return {...fresh(),...s,progress:{...fresh().progress,...s.progress}};}
  function save(p){const s=sessions.get(p.username);if(!s)return;s.position={x:p.x,y:p.y,z:p.z,rotY:p.rotY};db.saveQuestProgress({completed:s.completed,extra:s},key(p.username));}
  function mutate(m){const record=m.id?{...m,mapId:CAMPUS_MAP}:adminState.recordMutation({...m,mapId:CAMPUS_MAP});if(record.mutationType==='CLEAR_MUTATIONS')world.mutations=[];else world.mutations=[...world.mutations,record].slice(-20);worldSave();broadcast({type:'WORLD_MUTATION',...record});return record;}
  function state(p,extra={}){send(p,{type:'CAMPUS_STATE',...sessions.get(p.username),doors:world.doors,props:world.props,mutations:world.mutations,settings:adminState.world,worldTime:Date.now(),...extra});}
  const finitePosition=v=>v&&['x','y','z'].every(k=>Number.isFinite(v[k]))&&Math.abs(v.x)<=100&&v.z>=-15&&v.z<=90&&v.y>=0&&v.y<15;
  const near=(p,q,range=3)=>Math.hypot(p.x-q.x,p.z-q.z)<=range;
  function responseError(p,message){send(p,{type:'CAMPUS_ERROR',message});}
  async function handle(p,msg){
    if(msg.type==='CAMPUS_JOIN'){
      p.mapId=CAMPUS_MAP;const s=load(p.username);sessions.set(p.username,s);Object.assign(p,s.position);state(p);return true;
    }
    if(p.mapId!==CAMPUS_MAP)return false;
    const s=sessions.get(p.username);
    if(msg.type==='CAMPUS_MOVE'){
      if(finitePosition(msg)){p.x=Math.round(msg.x*1000)/1000;p.y=msg.y;p.z=Math.round(msg.z*1000)/1000;p.rotY=Number.isFinite(msg.rotY)?msg.rotY:0;p.lastUpdate=Date.now();p.lanternOn=msg.lantern===true;if(msg.chatting)p.talkingUntil=Date.now()+1500;}return true;
    }
    if(msg.type==='CAMPUS_ANSWER'){
      const prof=PROFESSORS[msg.agentId],where=CAMPUS_PROFESSORS[msg.agentId];
      if(!prof||!where||!near(p,where)) {responseError(p,'Подойдите к преподавателю, чтобы ответить.');return true;}
      const index=s.progress[msg.agentId]||0,q=prof.questions[index];
      if(!q){state(p,{agentId:msg.agentId,feedback:'Зачёт уже получен.'});return true;}
      if(msg.questionIndex!==index){state(p,{agentId:msg.agentId,feedback:'Вопрос обновлён. Ответьте ещё раз.'});return true;}
      const correct=msg.answer===q.correctIndex;
      if(correct)s.progress[msg.agentId]=index+1;
      const credit=correct&&s.progress[msg.agentId]===3;
      s.completed=Object.values(s.progress).every(n=>n===3);save(p);
      db.updateAgentMemory(p.username,msg.agentId,m=>{m.turnsCount++;m.lastTopic=q.text;m.history=[...m.history,{role:'user',text:q.options[msg.answer]||''},{role:'agent',text:correct?q.successPhrase:q.explanation}].slice(-10);});
      state(p,{agentId:msg.agentId,correct,feedback:correct?q.successPhrase:'Пока неверно. '+q.explanation,creditEarnedNow:credit});
      if(credit)mutate({mutationType:'REVEAL_FORMULA',x:where.x,y:2.8,z:where.z,author:prof.name,message:`${p.username} получил зачёт: ${prof.name}`,params:{professor:msg.agentId}});
      if(credit&&s.completed)mutate({mutationType:'SPAWN_PORTAL',x:-27,y:.48,z:57,author:prof.name,message:'Сессия сдана. Открыт общий портал знаний!'});
      return true;
    }
    if(msg.type==='CAMPUS_DOOR'){
      if(!near(p,{x:15.7,z:-1.92},3)){responseError(p,'Подойдите к двери.');return true;}
      if((s.progress.kanev||0)<3){responseError(p,'Для открытия нужен зачёт по сетям.');return true;}
      if(msg.open===false&&[...clients.values()].some(c=>c.mapId===CAMPUS_MAP&&Math.abs(c.x-15.7)<.94&&Math.abs(c.z+1.92)<.45)){responseError(p,'В дверном проёме стоит игрок.');return true;}
      world.doors.classroom=msg.open===true;worldSave();broadcast({type:'CAMPUS_DOOR_STATE',open:world.doors.classroom});return true;
    }
    if(msg.type==='CAMPUS_PROP'){
      const allowed=['campus_orb','campus_book','campus_flask'];if(!allowed.includes(msg.propId))return true;
      const previous=world.props[msg.propId];
      if(msg.action==='pickup'&&previous?.heldBy&&previous.heldBy!==p.username){send(p,{type:'CAMPUS_PROP_STATE',...previous});responseError(p,'Предмет уже держит другой игрок.');return true;}
      if(msg.action==='pickup'){
        const origin=previous?.position||({campus_orb:{x:29,z:1.35},campus_book:{x:-29.7,z:-1.9},campus_flask:{x:14.4,z:-5.05}}[msg.propId]);if(!near(p,origin,3))return true;
      }else if(msg.action==='settle'){if(previous?.username!==p.username||previous.heldBy)return true;}
      else if(previous?.heldBy!==p.username)return true;
      if(msg.action!=='pickup'&&(!finitePosition(msg.position)||(msg.action!=='settle'&&!near(p,msg.position,3))))return true;
      const velocity=msg.velocity&&['x','y','z'].every(k=>Number.isFinite(msg.velocity[k])&&Math.abs(msg.velocity[k])<20)?msg.velocity:{x:0,y:0,z:0};
      const prop={propId:msg.propId,action:msg.action,heldBy:msg.action==='pickup'?p.username:null,username:p.username,position:msg.position||{x:p.x,y:p.y,z:p.z},velocity,rotY:Number(msg.rotY)||0};
      world.props[msg.propId]=prop;worldSave();broadcast({type:'CAMPUS_PROP_STATE',...prop});return true;
    }
    if(msg.type==='AGENT_CHAT'){
      const prof=PROFESSORS[msg.agentId];if(!prof)return true;
      const text=String(msg.text||'').trim().slice(0,500);if(!text)return true;
      p.talkingUntil=Date.now()+5000;send(p,{type:'AGENT_TYPING',agentId:msg.agentId});
      const mem=db.getAgentMemory(p.username,msg.agentId),context=`Игрок ${p.username}. Правильных ответов: ${s.progress[msg.agentId]}/3. История: ${mem.history.map(h=>h.text||h.content||'').join(' / ')}`;
      // Intent classification is immediate and independent of LLM availability.
      const actions=classifyIntentActions(text);
      for(const action of actions)mutate({mutationType:action,x:action==='SPAWN_SERVER_RACK'?14.3:action==='SPAWN_PORTAL'?-27:-24.3,y:0,z:action==='SPAWN_SERVER_RACK'?-6:action==='SPAWN_PORTAL'?57:2.4,author:prof.name,message:action==='SPAWN_SERVER_RACK'?'Преподаватель создал вычислительную стойку.':action==='SPAWN_PORTAL'?'Открыт портал знаний.':'Преподаватель осветил путь к левому холлу.'});
      const reply=await generateResponse(msg.agentId,text,context,'STORY');
      db.updateAgentMemory(p.username,msg.agentId,m=>{m.turnsCount++;m.lastTopic=text;m.history=[...m.history,{role:'user',text},{role:'agent',text:reply.text}].slice(-10);});
      send(p,{type:'AGENT_REPLY',agentId:msg.agentId,agentName:prof.name,reply:reply.text,usedLLM:reply.source==='ollama',actions});return true;
    }
    return false;
  }
  function tick(){
    const players=[...clients.values()].filter(p=>p.mapId===CAMPUS_MAP),time=Date.now()/1000;
    if(!players.length)return;
    const npcs=Array.from({length:42},(_,i)=>{
      const side=i%2?-27:27,z=5+(i%14)*4.2,base={x:side,z};
      const nearest=players.reduce((a,p)=>!a||Math.hypot(p.x-side,p.z-z)<Math.hypot(a.x-side,a.z-z)?p:a,null);
      const speaker=players.find(p=>p.talkingUntil>Date.now()&&near(p,base,7)),target=speaker||nearest,reacting=Boolean(speaker)||nearest&&near(nearest,base,3.5),flee=i<16&&nearest?.lanternOn&&near(nearest,base,5),t=time*.25+i,floor=side<0&&z>31?.48:0;
      return {id:'campus_ambient_'+i,type:i<16?'BAT':i<32?'CAT':'SHADOW_STUDENT',x:side+(reacting?0:Math.sin(t)*.55),y:floor+(i<16?(flee?3.7:3.35):.05),z:z+(reacting?0:Math.cos(t)*.65),rotY:reacting?Math.atan2(target.x-side,target.z-z):t,state:flee?'FLEE':reacting?'WATCH':'PATROL',talking:Boolean(speaker)};
    });broadcast({type:'CAMPUS_NPCS',npcs});
  }
  return {handle,tick,save,mutate,leave(p){save(p);sessions.delete(p.username);for(const prop of Object.values(world.props))if(prop.heldBy===p.username){prop.heldBy=null;prop.action='place';prop.position={x:p.x,y:Math.max(.18,p.y-1.48),z:p.z};broadcast({type:'CAMPUS_PROP_STATE',...prop});}worldSave();}};
}
