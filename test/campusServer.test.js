import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('server validates answers, isolates map state and restores credits/door after service recreation',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bauman-unit-'));
  process.env.GAME_DATA_DIR=dir;process.env.SQLITE_PATH=path.join(dir,'test.db');
  const {createCampusService,CAMPUS_PROFESSORS}=await import('../server/campus.js');
  const {PROFESSORS}=await import('../client/src/quest/professorQuest.js');
  const {db}=await import('../server/db.js');
  const messages=[],p={username:'test',ws:{readyState:1,send:raw=>messages.push(JSON.parse(raw))}},clients=new Map([['test',p]]);
  try{
    const campus=createCampusService(clients);await campus.handle(p,{type:'CAMPUS_JOIN'});
    assert.equal(p.mapId,'bauman-v2');
    Object.assign(p,CAMPUS_PROFESSORS.kanev);
    await campus.handle(p,{type:'CAMPUS_ANSWER',agentId:'kanev',questionIndex:0,answer:0});
    assert.equal(messages.at(-1).progress.kanev,0);
    for(const prof of Object.values(PROFESSORS)){
      Object.assign(p,CAMPUS_PROFESSORS[prof.id]);
      for(let i=0;i<3;i++)await campus.handle(p,{type:'CAMPUS_ANSWER',agentId:prof.id,questionIndex:i,answer:prof.questions[i].correctIndex});
    }
    p.x=15.7;p.z=-.5;await campus.handle(p,{type:'CAMPUS_DOOR',open:true});campus.save(p);
    const fresh=createCampusService(clients);await fresh.handle(p,{type:'CAMPUS_JOIN'});
    const restored=messages.at(-1);assert.equal(restored.completed,true);assert.deepEqual(restored.progress,{kanev:3,korshunov:3,maslennikov:3});assert.equal(restored.doors.classroom,true);
    assert(db.getAgentMemory('test','kanev').history.length>=6);
  }finally{
    db.close();const resolved=path.resolve(dir);
    if(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('bauman-unit-'))fs.rmSync(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:100});
  }
});
