import * as THREE from 'three';
import {createArtifactMesh,createFoundersSafe,createGhostNPC} from '../../client/src/environment.js';
import {PhysicsWorld,PropState} from '../../client/src/physics.js';
import {AnimatedPropsManager,GrandfatherClock,ArcaneGyroscope} from '../../client/src/animatedProps.js';
import {ReactiveMobsManager} from '../../client/src/reactiveMobs.js';
import {NetworkClient} from '../../client/src/network.js';
import {Builder} from './builder.js';
import {ARTIFACTS,TEACHERS,CAMPUS_QUEST_KEY} from './quest-data.js';

const $=id=>document.getElementById(id);
const el=(tag,text='',className='')=>{const e=document.createElement(tag);e.textContent=text;e.className=className;return e;};
const typing=()=>document.activeElement?.matches('input,textarea,select');

// The existing server still owns the old pavilion map. Share auth, chat and AI
// only: do not send campus MOVE coordinates or import its inventory/geometry.
class CampusConnection extends NetworkClient{
  handleMessage(msg){
    if(['PLAYERS_SYNC','PLAYER_JOINED','PLAYER_LEFT','CHUNK_DATA','ITEM_COLLECTED','VICTORY','PROP_PICKED_UP','PROP_PLACED','PROP_THROWN','WORLD_MUTATION'].includes(msg.type))return;
    super.handleMessage(msg);
  }
}

export function createCampusGame({scene,camera,renderer,world,materials,controller,teacher,effects,onMap,onPause,onBrightness,onSound}){
  let saved={};try{saved=JSON.parse(localStorage.getItem(CAMPUS_QUEST_KEY)||'{}')||{};}catch{}
  const state={items:new Set((Array.isArray(saved.items)?saved.items:[]).filter(id=>ARTIFACTS.some(a=>a.id===id))),passed:new Set((Array.isArray(saved.passed)?saved.passed:[]).filter(id=>TEACHERS.some(a=>a.id===id))),won:saved.won===true,name:typeof saved.name==='string'?saved.name.slice(0,20):'',brightness:Math.max(85,Math.min(140,Number(saved.brightness)||100))};
  const histories=new Map(),pending=new Map(),artifactMeshes=new Map(),npcs=[];
  let started=false,activeModal=null,activeNpc=null,quiz=false,nearby=null,lastScan=0,lastSave=0,lastTelemetry=0,frames=0,fpsTime=0,fps=0,ping=null,muted=true,lastAiLabel='Учебные карточки · без ИИ';
  const network=new CampusConnection(scene);
  const physics=new PhysicsWorld(scene,{interactionRange:2.2});physics.audioCtx?.suspend();
  const animated=new AnimatedPropsManager(scene),mobs=new ReactiveMobsManager(scene);
  const movable=[];
  const hookLight=obj=>obj.traverse(o=>{if(o.isLight){o.userData.originalIntensity=o.intensity;o.userData.shadowEligible=false;world.lights.push(o);}});
  const clock=animated.add(new GrandfatherClock(new THREE.Vector3(29.9,0,2.25),-Math.PI/2));clock.root.scale.setScalar(.7);hookLight(clock.root);
  const gyro=animated.add(new ArcaneGyroscope(new THREE.Vector3(14.3,.82,-5.1)));gyro.root.scale.setScalar(.37);hookLight(gyro.root);
  world.obstacles.push({x1:29.59,x2:30.22,z1:1.87,z2:2.64});
  for(const [id,type,x,y,z] of [['campus_orb','crystal_orb',29,.25,1.35],['campus_book','book',-29.7,.25,-1.9],['campus_flask','flask',14.4,.88,-5.05]]){
    const obj=physics.createInteractiveProp(id,type,new THREE.Vector3(x,y,z));obj.floorY=y;movable.push(obj);hookLight(obj.mesh);
  }
  mobs.loadMobs([
    {id:'campus_cat_1',type:'CAT',name:'Кот музея',x:29.2,y:.05,z:.1,radius:.65},
    {id:'campus_cat_2',type:'CAT',name:'Кот копицентра',x:-29,y:.05,z:-1.8,radius:.55},
    {id:'campus_cat_3',type:'CAT',name:'Кот галереи',x:-27.8,y:.05,z:23,radius:.55},
    ...[-17,-5,12].map((x,i)=>({id:`campus_bat_${i}`,type:'BAT',x,y:3.4,z:0,radius:.65,speed:1.2})),
  ]);
  for(const data of TEACHERS){
    const mesh=data.id==='kanev'?teacher.group:createGhostNPC({...data,y:data.y});
    if(data.id!=='kanev'){mesh.scale.setScalar(.77);mesh.rotation.y=data.x<0?Math.PI/2:-Math.PI/2;scene.add(mesh);hookLight(mesh);}
    npcs.push({...data,mesh});
  }
  const b=new Builder(scene,materials);
  for(const item of ARTIFACTS){
    const mesh=createArtifactMesh(item);mesh.scale.setScalar(.72);mesh.visible=!state.items.has(item.id);scene.add(mesh);hookLight(mesh);artifactMeshes.set(item.id,mesh);
    const floor=controller.floorAt(item.x,item.z)??0;
    if(item.id!=='crypt_scroll'){
      b.box(item.x,floor+.4,item.z,.42,.8,.42,'darkMarble');b.box(item.x,floor+.82,item.z,.53,.05,.53,'brass');
      world.obstacles.push({x1:item.x-.23,x2:item.x+.23,z1:item.z-.23,z2:item.z+.23});
    }
  }
  const safe=createFoundersSafe(-24.3,0,2.76,Math.PI);safe.scale.setScalar(.55);scene.add(safe);hookLight(safe);
  world.obstacles.push({x1:-25,x2:-23.6,z1:2.32,z2:3.2});
  const gate=new THREE.Group();gate.name='Classroom_door';gate.position.set(15,-.01,-1.92);scene.add(gate);
  const gateMat=new THREE.MeshStandardMaterial({color:'#64797a',roughness:.5,metalness:.1});
  const door=new THREE.Mesh(new THREE.BoxGeometry(1.38,2.77,.09),gateMat);door.position.set(.69,1.385,0);gate.add(door);
  for(const y of [.65,1.6,2.4]){
    const inset=new THREE.Mesh(new THREE.BoxGeometry(1.16,y===1.6?.85:.4,.024),materials.doorInset);inset.position.set(.69,y,.06);gate.add(inset);
  }
  const handle=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,.06),materials.brass);handle.position.set(1.24,1.06,.1);gate.add(handle);
  for(const x of [14.96,16.44])b.box(x,1.4,-1.92,.065,2.86,.17,'darkMarble');
  b.box(15.7,2.83,-1.92,1.55,.08,.17,'darkMarble');
  b.label(15.7,3.04,-1.76,'УЧЕБНАЯ АУДИТОРИЯ',1.6,.17,0,{background:'#d9cfb7',color:'#5a5347',size:55});
  const gateObstacle={x1:14.96,x2:16.44,z1:-2.05,z2:-1.79,active:true};world.obstacles.push(gateObstacle);let gateOpen=false;
  b.flush();

  const hud=el('div','','campus-hud');hud.id='campus-hud';hud.innerHTML=`
    <div class="campus-toolbar"><span class="edition-pill">НОЧЬ В БАУМАНКЕ</span><button id="journal-button">Журнал <kbd>J</kbd></button><button id="chat-button">Чат <kbd>Enter</kbd><i id="chat-unread" hidden></i></button><button id="settings-button" aria-label="Настройки">Настройки</button><button id="connect-button"><i class="connection-dot"></i><span id="network-label">Подключиться</span></button></div>
    <aside class="quest-card"><div class="eyebrow">ЭКСПЕДИЦИЯ / 01</div><h2>Знания открывают двери.</h2><p id="quest-next">Четыре находки. Один шифр.<br>Исследуйте знакомые коридоры.</p><div class="quest-count"><span>Найдено подсказок</span><b id="clue-count">0 / 4</b></div><div class="quest-track"><span id="clue-track"></span></div><button id="quest-journal">Открыть журнал <span>↗</span></button></aside>
    <div id="campus-prompt" class="campus-prompt hidden"><kbd>E</kbd><span></span></div>
    <div id="campus-toast" class="campus-toast hidden" role="status" aria-live="polite"></div>
    <div class="campus-stats"><span id="campus-fps">— FPS</span><span id="campus-save">Прогресс на этом устройстве</span></div>
    <button id="campus-lantern" class="lantern-button" aria-pressed="false">Фонарь <kbd>L</kbd></button>
    <div id="campus-modal" class="campus-modal hidden" role="dialog" aria-modal="true" aria-labelledby="campus-modal-title"><section class="campus-dialog"><header><div><div id="campus-modal-kicker" class="eyebrow"></div><h2 id="campus-modal-title"></h2></div><button id="campus-modal-close" aria-label="Закрыть">×</button></header><div id="campus-modal-body"></div></section></div>`;
  document.body.append(hud);
  const prompt=$('campus-prompt'),body=$('campus-modal-body');
  let toastTimer;
  function toast(text){$('campus-toast').textContent=text;$('campus-toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('campus-toast').classList.add('hidden'),4200);}
  function persist(){
    try{localStorage.setItem(CAMPUS_QUEST_KEY,JSON.stringify({items:[...state.items],passed:[...state.passed],won:state.won,name:state.name,brightness:state.brightness,position:{x:controller.x,z:controller.z,yaw:controller.yaw},histories:Object.fromEntries(histories)}));$('campus-save').textContent='Прогресс сохранён';}catch{$('campus-save').textContent='Сохранение недоступно';}
  }
  if(saved.histories&&typeof saved.histories==='object')for(const npc of TEACHERS){const h=saved.histories[npc.id];if(Array.isArray(h))histories.set(npc.id,h.filter(t=>t&&typeof t.text==='string'&&['user','agent'].includes(t.role)).slice(-30));}
  function refresh(){
    $('clue-count').textContent=`${state.items.size} / 4`;$('clue-track').style.width=`${state.items.size*25}%`;
    $('quest-next').textContent=state.won?'Сейф открыт. Можно продолжить прогулку.':state.items.size===4?'Шифр собран. Сейф ждёт у левой лестницы.':'Четыре находки. Один шифр. Подсказки отмечены в журнале.';
    for(const [id,mesh]of artifactMeshes){mesh.visible=!state.items.has(id);mesh.traverse(o=>{if(o.isLight)o.userData.inactive=!mesh.visible;});}
  }
  function pause(){onPause(Boolean(activeModal));controller.stop();}
  function close(){activeModal=null;activeNpc=null;quiz=false;$('campus-modal').classList.add('hidden');document.body.classList.remove('game-modal-open');body.replaceChildren();document.activeElement?.blur();pause();}
  function open(type,title,kicker){
    activeModal=type;body.replaceChildren();$('campus-modal-title').textContent=title;$('campus-modal-kicker').textContent=kicker;$('campus-modal').classList.remove('hidden');document.body.classList.add('game-modal-open');document.exitPointerLock?.();pause();$('campus-modal-close').focus();
  }
  $('campus-modal-close').onclick=close;$('campus-modal').onclick=e=>{if(e.target===$('campus-modal'))close();};
  function button(text,action,primary=false){const b=el('button',text,primary?'game-primary':'game-secondary');b.type='button';b.onclick=action;return b;}
  function journal(){
    open('journal','Журнал экспедиции','ПЕРВЫЙ ЭТАЖ / ВАШ МАРШРУТ');
    body.append(el('p','Найдите четыре артефакта. Канев у правой лестницы выдаёт допуск в учебную аудиторию. Сейф находится в левом холле.','game-lead'));
    const grid=el('div','','clue-grid');
    ARTIFACTS.forEach((a,i)=>{const found=state.items.has(a.id),card=el('article','',found?'clue-card found':'clue-card');card.append(el('span',`0${i+1} / ${found?'НАЙДЕНО':'ПОИСК'}`,'eyebrow'),el('strong',found?a.digit:'—','clue-digit'),el('h3',a.name),el('p',found?a.clue:a.place));grid.append(card);});body.append(grid);
    const passes=el('div','','passed-list');passes.append(el('h3','Учебные отметки'));for(const npc of TEACHERS)passes.append(el('span',`${state.passed.has(npc.id)?'✓':'○'} ${npc.name}`));body.append(passes);
    const actions=el('div','','game-actions');actions.append(button('Посмотреть карту',()=>{close();onMap();}),button('К сейфу — по левому коридору',()=>toast('Сейф стоит справа в холле у копицентра.')));body.append(actions);
  }
  function addTurn(id,role,text){const h=histories.get(id)||[];h.push({role,text:String(text).slice(0,4000)});histories.set(id,h.slice(-30));persist();if(activeNpc?.id===id)renderDialogue();}
  function dialogue(npc){activeNpc=npc;quiz=false;open('dialogue',npc.name,npc.role);activeNpc=npc;if(!histories.has(npc.id))histories.set(npc.id,[{role:'agent',text:npc.greeting}]);renderDialogue();}
  function renderDialogue(){
    if(!activeNpc)return;const npc=activeNpc;body.replaceChildren();const log=el('div','','campus-dialogue-log');log.setAttribute('role','log');
    for(const t of histories.get(npc.id)||[]){const turn=el('div','',`campus-turn ${t.role}`);turn.append(el('small',t.role==='user'?'ВЫ':npc.name),el('p',t.text));log.append(turn);}body.append(log);
    const status=el('p',pending.has(npc.id)?'Собеседник обдумывает ответ…':lastAiLabel,'dialogue-mode');status.setAttribute('role','status');body.append(status);
    const quick=el('div','','game-quick');for(const [q]of npc.topics)quick.append(button(q,()=>ask(npc,q)));quick.append(button(state.passed.has(npc.id)?'✓ Задание сдано':'Проверить знания',()=>{quiz=true;addTurn(npc.id,'agent',npc.quiz.question);}));body.append(quick);
    const form=el('form','','game-input-row'),input=el('input');input.id='campus-dialogue-input';input.placeholder=quiz?'Ваш ответ…':'Ваш вопрос преподавателю…';input.maxLength=300;input.required=true;input.autocomplete='off';input.setAttribute('aria-label','Вопрос преподавателю');const send=el('button','Отправить →','game-primary');send.disabled=pending.has(npc.id);form.append(input,send);form.onsubmit=e=>{e.preventDefault();const text=input.value.trim();if(text)ask(npc,text);};body.append(form);requestAnimationFrame(()=>{log.scrollTop=log.scrollHeight;});
  }
  function ask(npc,text){
    if(pending.has(npc.id))return;addTurn(npc.id,'user',text);
    if(quiz){
      const correct=text.trim().replace(/[.,]0+$/,'')===npc.quiz.answer;
      if(correct){state.passed.add(npc.id);quiz=false;addTurn(npc.id,'agent',npc.id==='kanev'?'Верно! Допуск получен. Учебная аудитория находится дальше по горизонтальному коридору; на её двери есть табличка.':'Верно! Отметка о задании добавлена в журнал.');toast('Задание сдано · '+npc.name);persist();}
      else addTurn(npc.id,'agent','Пока нет. '+npc.quiz.hint);
      lastAiLabel='Ответ проверен по учебному правилу';renderDialogue();return;
    }
    if(network.isConnected()){
      const timeout=setTimeout(()=>{pending.delete(npc.id);addTurn(npc.id,'agent','Ответ сервера не пришёл вовремя. Можно повторить вопрос или пройти локальное задание.');},20000);pending.set(npc.id,timeout);network.sendAgentChat(npc.id,text);renderDialogue();return;
    }
    const topic=npc.topics.find(([q])=>q===text)||npc.topics.find(([q])=>q.toLowerCase().split(/\W+/u).some(w=>w.length>4&&text.toLowerCase().includes(w)));
    lastAiLabel='Учебные карточки · без ИИ';
    addTurn(npc.id,'agent',topic?.[1]||'Сейчас доступны учебные карточки и проверка знаний. Выберите тему выше; для свободного разговора подключитесь к серверу через кнопку вверху.');
  }
  function safeDialog(){
    open('safe',state.won?'Сейф открыт':'Сейф Основателей','ЧЕТЫРЕ НАХОДКИ / ЧЕТЫРЕ ЦИФРЫ');
    body.append(el('p',state.won?'Экспедиция завершена. Все знания остаются с вами.':`Собрано ${state.items.size} из 4 подсказок. Порядок цифр указан в журнале.`,'game-lead'));
    if(state.won)return;
    const form=el('form','','game-input-row'),input=el('input'),status=el('p','','game-form-status');input.id='campus-safe-code';input.inputMode='numeric';input.pattern='[0-9]{4}';input.maxLength=4;input.placeholder='· · · ·';input.required=true;input.setAttribute('aria-label','Код сейфа');form.append(input,el('button','Открыть →','game-primary'));
    form.onsubmit=e=>{e.preventDefault();if(state.items.size<4){status.textContent='Сначала найдите все четыре артефакта.';return;}if(input.value!==ARTIFACTS.map(a=>a.digit).join('')){status.textContent='Шифр не подошёл. Проверьте порядок подсказок.';return;}state.won=true;persist();refresh();safeDialog();toast('Сейф открыт. Экспедиция завершена!');};body.append(form,status);
  }
  const chatLog=[];
  function showChat(){open('chat','Командный канал','СООБЩЕНИЯ ЧЕРЕЗ СЕРВЕР');$('chat-unread').hidden=true;renderChat();}
  function renderChat(){
    if(activeModal!=='chat')return;body.replaceChildren();body.append(el('p',network.isConnected()?'Вы подключены к общему каналу проекта.':'Подключитесь к серверу, чтобы писать команде. Одиночный квест доступен без подключения.','game-lead'));
    const log=el('div','','campus-dialogue-log');for(const msg of chatLog){const line=el('div','','campus-turn');line.append(el('small',msg.sender),el('p',msg.text));log.append(line);}body.append(log);
    if(!network.isConnected()){body.append(button('Подключиться',connectDialog,true));return;}
    const form=el('form','','game-input-row'),input=el('input');input.id='campus-chat-input';input.placeholder='Сообщение команде…';input.maxLength=300;input.required=true;input.setAttribute('aria-label','Сообщение команде');form.append(input,el('button','Отправить →','game-primary'));form.onsubmit=e=>{e.preventDefault();const t=input.value.trim();if(t){network.sendChat(t);input.value='';}};body.append(form);log.scrollTop=log.scrollHeight;
  }
  function connectDialog(){
    open('connect','Подключить чат и ИИ','СУЩЕСТВУЮЩИЙ СЕРВЕР ПРОЕКТА');body.append(el('p','Вход подключает командный чат и диалоги с преподавателями. Прогресс этой карты сохраняется на вашем устройстве.','game-lead'));
    if(network.isConnected()){body.append(el('p','Вы вошли как '+state.name),button('Отключиться',()=>{network.ws.onclose=null;network.ws.close();network.isAuthenticated=false;$('network-label').textContent='Подключиться';document.body.classList.remove('campus-online');close();}));return;}
    const form=el('form','','campus-login-form'),mode=el('select');mode.id='campus-auth-mode';mode.setAttribute('aria-label','Режим входа');for(const [v,t]of [['guest','Гость'],['login','Вход'],['register','Регистрация']]){const o=el('option',t);o.value=v;mode.append(o);}
    const name=el('input'),pass=el('input'),status=el('p','','game-form-status'),submit=el('button','Подключиться →','game-primary');name.id='campus-auth-name';name.placeholder='Ваше имя';name.value=state.name;name.required=true;name.maxLength=20;name.autocomplete='username';name.setAttribute('aria-label','Имя');pass.id='campus-auth-password';pass.type='password';pass.placeholder='Пароль';pass.autocomplete='current-password';pass.setAttribute('aria-label','Пароль');pass.hidden=true;mode.onchange=()=>{pass.hidden=mode.value==='guest';pass.required=mode.value==='register';};form.append(mode,name,pass,submit,status);
    form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;status.textContent='Подключаемся…';try{
      const payload={username:name.value.trim(),color:'#94cfd3'};if(mode.value!=='guest'&&pass.value)payload.password=pass.value;
      const response=await fetch(mode.value==='register'?'/api/register':'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(7000)});
      const result=await response.json();if(!response.ok||!result.success)throw new Error(result.error||'Ошибка входа');state.name=payload.username;persist();network.connect(result.token,state.name);
    }catch{status.textContent='Не удалось войти. Проверьте имя, пароль и запуск сервера на порту 3001.';submit.disabled=false;}};body.append(form);
  }
  function settings(){
    open('settings','Настроить вечер','СВЕТ / ЗВУК / УПРАВЛЕНИЕ');
    const label=el('label','','brightness-control');label.append(el('span','Яркость сцены'));const range=el('input');range.id='campus-brightness';range.type='range';range.min=85;range.max=140;range.value=state.brightness;const value=el('output',state.brightness+'%');range.oninput=()=>{state.brightness=Number(range.value);value.textContent=range.value+'%';onBrightness(state.brightness/100);};range.onchange=persist;label.append(range,value);body.append(label);
    const particles=el('label','','game-toggle'),check=el('input');check.type='checkbox';check.checked=effects.root.userData.particles!==false;check.onchange=()=>{effects.setParticles(check.checked);effects.root.userData.particles=check.checked;};particles.append(check,el('span','Светлячки'));body.append(particles);
    body.append(el('p','WASD — движение · Shift — быстрее · E — взаимодействовать · G — взять предмет · F — бросить · L — фонарь · J — журнал · M — карта · Tab — скрыть панели.','game-lead'));
    body.append(button('Звук: '+(muted?'выключен':'включён'),()=>{$('sound-button').click();settings();}),button('Полный экран',()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.().catch(()=>toast('Полноэкранный режим недоступен.'));}));
    const reset=button('Начать квест заново',()=>{if(!reset.dataset.confirm){reset.dataset.confirm='yes';reset.textContent='Подтвердить сброс находок и заданий';return;}state.items.clear();state.passed.clear();state.won=false;gateOpen=false;gateObstacle.active=true;controller.teleport(28,1.15,1.3);persist();refresh();journal();});reset.classList.add('game-reset');body.append(reset);
  }
  network.onAuthSuccess=()=>{document.body.classList.add('campus-online');$('network-label').textContent=state.name;close();toast('Подключены чат и диалоги с ИИ');};
  network.onConnectionError=message=>{network.isAuthenticated=false;$('network-label').textContent='Подключиться';document.body.classList.remove('campus-online');for(const [id,timer]of pending){clearTimeout(timer);pending.delete(id);addTurn(id,'agent','Связь с сервером прервалась. Учебные карточки и задания доступны без подключения.');}if(activeModal==='connect'){const status=body.querySelector('.game-form-status');if(status)status.textContent=message;const submit=body.querySelector('button[type="submit"],form button');if(submit)submit.disabled=false;}else toast(message);};
  network.onAgentReply=data=>{const timer=pending.get(data.agentId);if(!timer)return;clearTimeout(timer);pending.delete(data.agentId);lastAiLabel=data.usedLLM?'Ответ локальной языковой модели':'Ответ алгоритма сервера';addTurn(data.agentId,'agent',data.reply||'Ответ не получен. Попробуйте ещё раз.');};
  network.onChatMessage=msg=>{chatLog.push({sender:String(msg.sender||'Команда'),text:String(msg.text||'')});if(chatLog.length>40)chatLog.shift();if(activeModal==='chat')renderChat();else $('chat-unread').hidden=false;};
  network.onPong=msg=>{if(msg.clientTime)ping=Date.now()-msg.clientTime;};
  $('journal-button').onclick=journal;$('quest-journal').onclick=journal;$('chat-button').onclick=showChat;$('connect-button').onclick=connectDialog;$('settings-button').onclick=settings;
  $('campus-lantern').onclick=()=>{const enabled=effects.toggleLantern();$('campus-lantern').setAttribute('aria-pressed',String(enabled));};
  function interact(){
    if(!nearby)return;
    if(nearby.type==='npc')dialogue(nearby.data);
    if(nearby.type==='artifact'){const a=nearby.data;state.items.add(a.id);persist();refresh();toast('Найдено: '+a.name+' · '+a.digit);nearby=null;prompt.classList.add('hidden');}
    if(nearby.type==='safe')safeDialog();
    if(nearby.type==='door'){
      if(!state.passed.has('kanev')){toast('Нужен допуск: ответьте на вопрос Канева у правой лестницы.');return;}
      gateOpen=!gateOpen;gateObstacle.active=!gateOpen;toast(gateOpen?'Учебная аудитория открыта':'Дверь закрыта');
    }
  }
  function placeHeld(){
    const held=physics.heldObject;if(!held)return;
    const dir=new THREE.Vector3();camera.getWorldDirection(dir);let x=controller.x+dir.x*.85,z=controller.z+dir.z*.85;
    if(!controller.canWalk(x,z)){x=controller.x;z=controller.z;}
    const y=(controller.floorAt(x,z)??0)+.18;held.place(new THREE.Vector3(x,y,z),controller.yaw);held.floorY=y;physics.heldObject=null;
  }
  window.addEventListener('keydown',e=>{
    if(e.code==='Escape'&&activeModal){e.preventDefault();close();return;}
    if(typing()||e.repeat||!started)return;
    if(e.code==='Tab'){e.preventDefault();document.body.classList.toggle('campus-clean');}
    if(e.code==='KeyJ'){e.preventDefault();if(activeModal==='journal')close();else journal();return;}
    if(e.code==='Enter'&&!activeModal){e.preventDefault();showChat();return;}
    if(activeModal)return;
    if(e.code==='KeyE')interact();
    if(e.code==='KeyL')$('campus-lantern').click();
    if(e.code==='KeyG'){if(physics.heldObject)placeHeld();else{const r=physics.interact(camera,state.name||'Исследователь');if(r)toast('Предмет в руке · G — поставить, F — бросить');}}
    if(e.code==='KeyF'&&physics.heldObject)physics.throwHeldObject(camera,new THREE.Vector3(controller.velocity.x,0,controller.velocity.y),5.5);
  });
  function scan(){
    nearby=null;const candidates=[];
    for(const npc of npcs){const d=Math.hypot(npc.x-controller.x,npc.z-controller.z);if(d<2.25)candidates.push({type:'npc',data:npc,d});}
    for(const a of ARTIFACTS){if(state.items.has(a.id))continue;const d=Math.hypot(a.x-controller.x,a.z-controller.z);if(d<1.6&&Math.abs(camera.position.y-a.y)<1.8)candidates.push({type:'artifact',data:a,d:d-.5});}
    const sd=Math.hypot(controller.x+24.3,controller.z-2.76);if(sd<2.2)candidates.push({type:'safe',d:sd});
    const dd=Math.hypot(controller.x-15.7,controller.z+1.92);if(dd<1.7)candidates.push({type:'door',d:dd});
    candidates.sort((a,b)=>a.d-b.d);nearby=candidates[0];
    let key='E',text=nearby?(nearby.type==='npc'?'Поговорить · '+nearby.data.name:nearby.type==='artifact'?'Забрать · '+nearby.data.name:nearby.type==='safe'?'Сейф Основателей':gateOpen?'Закрыть аудиторию':state.passed.has('kanev')?'Открыть аудиторию':'Аудитория · нужен допуск Канева'):'';
    if(physics.heldObject){key='G';text='Поставить предмет · F — бросить';}else if(!nearby&&physics.findNearbyInteractable(camera,1.8)){key='G';text='Взять предмет';}
    prompt.classList.toggle('hidden',!text||Boolean(activeModal)||controller.mapOpen);prompt.querySelector('kbd').textContent=key;prompt.querySelector('span').textContent=text;
  }
  refresh();onBrightness(state.brightness/100);
  window.addEventListener('pagehide',persist);
  return {state,network,physics,animated,mobs,artifactMeshes,npcs,gate,gateObstacle,interact,journal,close,dialogue,
    isModalOpen:()=>Boolean(activeModal),
    setSound(value){muted=!value;if(value)physics.audioCtx?.resume();else physics.audioCtx?.suspend();},
    begin(){started=true;document.body.classList.add('campus-playing');if(saved.position&&state.passed.has('kanev')){gateOpen=true;gateObstacle.active=false;}
      if(saved.position&&Number.isFinite(saved.position.x)&&Number.isFinite(saved.position.z))controller.teleport(saved.position.x,saved.position.z,Number.isFinite(saved.position.yaw)?saved.position.yaw:1.3);
      toast(state.items.size?'Экспедиция продолжена · журнал J':'Добро пожаловать в Бауманку · Канев ждёт у правой лестницы');},
    update(dt,time){
      animated.update(dt);effects.update(time);
      const frameScale=Math.min(1,dt*6);gate.rotation.y=THREE.MathUtils.lerp(gate.rotation.y,gateOpen?Math.PI*.48:0,frameScale);
      for(const npc of npcs)if(npc.id!=='kanev'){npc.mesh.visible=camera.position.distanceToSquared(npc.mesh.position)<35*35;if(npc.mesh.visible)npc.mesh.position.y=npc.y+Math.sin(time*1.2+npc.x)*.06;}
      for(const a of ARTIFACTS){const mesh=artifactMeshes.get(a.id);if(mesh.visible){mesh.rotation.y=time*.45;mesh.position.y=a.y+Math.sin(time*1.7+a.x)*.06;}}
      if(state.won)safe.userData.wheelGroup.rotation.z=time*.3;
      for(const obj of movable){if(obj.state!==PropState.HELD){obj.mesh.userData.previousPosition=obj.mesh.position.clone();if(obj.state===PropState.FLYING)obj.floorY=(controller.floorAt(obj.mesh.position.x,obj.mesh.position.z)??0)+.18;}}
      physics.update(dt,camera);
      for(const obj of movable){if(obj.state===PropState.HELD)continue;const p=obj.mesh.position,old=obj.mesh.userData.previousPosition;if(controller.floorAt(p.x,p.z)===null||world.obstacles.some(o=>o.active!==false&&p.x>o.x1-.1&&p.x<o.x2+.1&&p.z>o.z1-.1&&p.z<o.z2+.1&&p.y<1.8)){
        p.x=old.x;p.z=old.z;obj.velocity.x*=-.45;obj.velocity.z*=-.45;
      }}
      mobs.update(dt,camera.position,{isSprinting:controller.keys.has('ShiftLeft'),lanternOn:effects.lantern.visible,isChatting:activeModal==='dialogue'});
      for(const mob of mobs.mobs.values()){const p=mob.group.position;if(controller.floorAt(p.x,p.z)===null){p.x=mob.basePos.x;p.z=mob.basePos.z;}p.y=Math.min(p.y,3.7);mob.group.visible=camera.position.distanceToSquared(p)<24*24;}
      frames++;fpsTime+=dt;if(fpsTime>1){fps=Math.round(frames/fpsTime);frames=0;fpsTime=0;$('campus-fps').textContent=`${fps} FPS${ping===null?'':' · '+ping+' мс'}`;}
      if(started&&time-lastScan>.15){lastScan=time;scan();}
      if(started&&time-lastSave>5){lastSave=time;persist();}
      if(network.isConnected()&&time-lastTelemetry>3){lastTelemetry=time;network.sendPing();}
    }
  };
}
