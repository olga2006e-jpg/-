import {PROFESSORS} from '../../client/src/quest/professorQuest.js';
export {PROFESSORS};
export const CAMPUS_QUEST_KEY='bauman-session-v2';
const places={kanev:[25.65,-.9,'#94cfd3'],korshunov:[28.05,17,'#e4c888'],maslennikov:[-28.05,12,'#c0addf']};
export const TEACHERS=Object.values(PROFESSORS).map(p=>({...p,x:places[p.id][0],z:places[p.id][1],y:.08,color:places[p.id][2],greeting:p.greetings[0],topics:p.questions.slice(0,2).map(q=>[q.text,q.explanation])}));
export const ARTIFACTS=TEACHERS.map((p,i)=>({id:'credit_'+p.id,name:['Допуск сетевого инженера','Печать архитектора','Математический ключ'][i],subType:'scroll',icon:'✦',x:p.x,y:1,z:p.z,digit:['7','2','1'][i],clue:'Награда за три правильных ответа: '+p.name,place:p.role,rewardOnly:true,professor:p.id}));
