/**
 * KAIOS K6888 pine-kingdom LANGUAGE CULTIVATION E0–E7 pilot.
 * Independent OFF-CHAIN gameplay only; does not change PR #610/#611,
 * sovereign map, animals, wallets, employee identities, token balances or canon.
 */
export const SCHEMA='KAIOS-K6888-ELEVATION-PILOT/1';
export const MAP_POINT_ID='P_6888p0_松樹國_R26';
export const K_COORDINATE=6888;
export const ORIGINAL_HUMAN_LANGUAGE_SEQUENCE='K1K2K3KK4K5K7';
export const ORDERED_CHANNELS=Object.freeze(['K1','K2','K3','K4','K5','K7']);
export const LANGUAGE_CHANNELS=Object.freeze({
  K1:{status:'PILOT_PRACTICE_NOT_CANONICAL_DEFINITION'},
  K2:{status:'PILOT_PRACTICE_NOT_CANONICAL_DEFINITION'},
  K3:{status:'PILOT_PRACTICE_NOT_CANONICAL_DEFINITION'},
  K4:{status:'PILOT_PRACTICE_NOT_CANONICAL_DEFINITION'},
  K5:{status:'CANONICAL_FIVE_DIGIT_DICTIONARY_NOT_VERIFIED',note:'火星 2 位筆畫數＋3 位序號；不得混用 KAIOS-K300 三位字典。'},
  K7:{status:'PILOT_PRACTICE_NOT_CANONICAL_DEFINITION'},
  K6:{status:'UNSPECIFIED_NOT_ASSUMED'}
});
export const E_STAGES=Object.freeze([
  {id:'E0',title:'修練佛',description:'松樹國入門修行，不等於現實宗教地位'},
  {id:'E1',title:'魔族後知後決',description:'辨識延遲反應與基本命令'},
  {id:'E2',title:'凡人不知不覺',description:'辨識熟悉的生活指令'},
  {id:'E3',title:'先知先決',description:'理解既有上下文；不預知未來'},
  {id:'E4',title:'龍',description:'跨語言意圖辨識'},
  {id:'E5',title:'神仙',description:'安全訊息與援助意圖'},
  {id:'E6',title:'神明',description:'不同語言風格的組合試煉'},
  {id:'E7',title:'神君',description:'完成封閉指令題庫，不代表通用語音理解'}
].map(x=>Object.freeze(x)));
export const INTENTS=Object.freeze(['FOLLOW','GUARD','HARD_FIGHT','ROAM','STAY','ALERT','FOOD','HELP']);
const row=(rank,channel,language,phrase,intent)=>Object.freeze({id:`${rank}-${channel}-${language}-${phrase}`,rank,channel,language,phrase,intent});
export const TRIALS=Object.freeze([
 row('E1','K1','zh-Hant','跟隨','FOLLOW'),
 row('E1','K1','zh-Hant','停下','STAY'),
 row('E2','K2','en-US','guard','GUARD'),
 row('E2','K2','en-US','roam','ROAM'),
 row('E3','K3','three-kingdoms','隨我來','FOLLOW'),
 row('E3','K3','three-kingdoms','按兵不動','STAY'),
 row('E4','K4','zh-Hant','保護我','GUARD'),
 row('E4','K4','en-US','follow me','FOLLOW'),
 row('E5','K7','zh-Hant','危險','ALERT'),
 row('E5','K7','en-US','help','HELP'),
 row('E6','K1','zh-Hant','自由活動','ROAM'),
 row('E6','K4','three-kingdoms','護駕','GUARD'),
 row('E7','K2','en-US','attack','HARD_FIGHT'),
 row('E7','K7','three-kingdoms','迎戰','HARD_FIGHT')
]);
const trialIds=new Set(TRIALS.map(x=>x.id));
export function createStudent(traineeId='K6888-GUEST'){
  if(typeof traineeId!=='string'||!(/^[A-Za-z0-9_-]{1,64}$/).test(traineeId))throw Error('INVALID_TRAINEE_ID');
  return {schema:SCHEMA,pointId:MAP_POINT_ID,traineeId,completed:[],mistakes:0};
}
export function validateStudent(student){
  if(!student||student.schema!==SCHEMA||student.pointId!==MAP_POINT_ID||
     typeof student.traineeId!=='string'||!(/^[A-Za-z0-9_-]{1,64}$/).test(student.traineeId)||
     !Array.isArray(student.completed)||!Number.isSafeInteger(student.mistakes)||student.mistakes<0)throw Error('INVALID_STUDENT');
  const used=new Set();
  for(let i=0;i<student.completed.length;i++){
    const v=student.completed[i];
    if(!trialIds.has(v)||used.has(v)||TRIALS[i]?.id!==v)throw Error('INVALID_TRAINING_SEQUENCE');
    used.add(v);
  }
  return student;
}
export function studentRank(student){
  validateStudent(student);
  return E_STAGES[Math.min(7,Math.floor(student.completed.length/2))];
}
export function nextTrial(student){
  validateStudent(student);
  return TRIALS[student.completed.length]??null;
}
export function answerTrial(student,{trialId,intent}={}){
  validateStudent(student);
  const trial=nextTrial(student);
  if(!trial)return {status:'TRAINING_COMPLETED',student:structuredClone(student),rank:studentRank(student),financialOrder:null};
  if(trialId!==trial.id)throw Error('TRIAL_ORDER_OR_REPLAY_INVALID');
  if(!INTENTS.includes(intent))throw Error('INTENT_UNKNOWN');
  const accepted=trial.intent===intent;
  const newStudent={...student,completed:accepted?[...student.completed,trial.id]:[...student.completed],mistakes:student.mistakes+(accepted?0:1)};
  const rank=studentRank(newStudent);
  return {status:accepted?'TRIAL_PASSED':'TRIAL_RETRY',student:newStudent,rank,rankUp:accepted&&studentRank(student).id!==rank.id,financialOrder:null,realLifeRank:false};
}
export function channelStatus(code){return LANGUAGE_CHANNELS[code]??{status:'UNKNOWN_CHANNEL'};}
export function checkK5Codebook(dictionary){
  // K5 is NOT K300, and this prototype has no authoritative five-digit dictionary.
  if(!dictionary)return {status:'DICTIONARY_REQUIRED',eligible:false};
  if(dictionary.protocol==='KAIOS-K300')return {status:'K300_IS_NOT_K5',eligible:false};
  return {status:'K5_INDEPENDENT_CANON_AND_ROUNDTRIP_VERIFICATION_REQUIRED',eligible:false};
}
export function createGraduationRecord(student){
  validateStudent(student);
  return {traineeId:student.traineeId,pointId:student.pointId,rank:studentRank(student).id,
    distinctTrialsPassed:student.completed.length,trialTotal:TRIALS.length,
    unverifiedK5:true,unverifiedK6:true,voiceSpeechVerified:false,naturalLanguageVerified:false,
    lifeIdIssued:false,actualAnimalAITrained:false,financialOrder:null,worldCanonModified:false,
    evidenceClass:'LOCAL_GAMEPLAY_CANDIDATE'};
}
