import test from 'node:test';
import assert from 'node:assert/strict';
import {ProfessorQuestManager,PROFESSORS} from '../client/src/quest/professorQuest.js';

test('credits require three correct answers per professor; errors cannot advance; progress survives reload',()=>{
  const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  let victories=0;const quest=new ProfessorQuestManager({storageKey:'test-session',onVictory:()=>victories++});
  for(const prof of Object.values(PROFESSORS)){
    for(let i=0;i<3;i++){
      const q=prof.questions[i];const wrong=quest.submitAnswer(prof.id,(q.correctIndex+1)%q.options.length);
      assert.equal(wrong.isCorrect,false);assert.equal(quest.state.progress[prof.id].currentQuestion,i);assert.equal(quest.state.credits[prof.id],false);
      const right=quest.submitAnswer(prof.id,q.correctIndex);assert.equal(right.isCorrect,true);assert.equal(right.creditEarnedNow,i===2);
    }
  }
  assert.equal(quest.getSummary().earnedCount,3);assert.equal(victories,1);
  const restored=new ProfessorQuestManager({storageKey:'test-session'});assert.equal(restored.getSummary().isCompleted,true);
});
