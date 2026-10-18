/** K6888 language cultivation, isolated gameplay candidate. No finance, identity or title authority. */
export const PINE_POINT_ID = 'P_6888p0_松樹國_R26';
export const E_TITLES = Object.freeze([
  '修練佛', '魔族・後知後決', '凡人・不知不覺', '先知先決',
  '龍', '神仙', '神明', '神君'
]);
export const LANGUAGE_ROUTES = Object.freeze([
  {code:'K1', status:'HUMAN_REQUESTED_DEFINITION_PENDING'},
  {code:'K2', status:'HUMAN_REQUESTED_DEFINITION_PENDING'},
  {code:'K3', status:'HUMAN_REQUESTED_DEFINITION_PENDING'},
  {code:'KK4', status:'HUMAN_LITERAL_PENDING_K4_CLARIFICATION'},
  {code:'K5', status:'FIVE_DIGIT_STROKE_DICTIONARY_NOT_VERIFIED'},
  {code:'K7', status:'HUMAN_REQUESTED_DEFINITION_PENDING'}
]);
// These are exercises for the three phrase parsers already present in PR #610.
// They do not certify the proposed K1/K2/K3/KK4/K5/K7 dictionaries.
export const LESSONS = Object.freeze([
  {id:'E1-FOLLOW', stage:1, language:'zh-TW', cue:'告訴鵝跟著主人', intent:'FOLLOW', mode:'REACT'},
  {id:'E1-STAY', stage:1, language:'zh-TW', cue:'告訴鵝原地待命', intent:'STAY', mode:'REACT'},
  {id:'E2-GUARD', stage:2, language:'zh-TW', cue:'讓狗保護你', intent:'GUARD', mode:'HABIT'},
  {id:'E2-ROAM', stage:2, language:'zh-TW', cue:'讓雞自由活動', intent:'ROAM', mode:'HABIT'},
  {id:'E2-FOLLOW', stage:2, language:'zh-TW', cue:'呼喚鵝跟隨', intent:'FOLLOW', mode:'HABIT'},
  {id:'E3-FOREST', stage:3, language:'zh-TW', cue:'預告：森林將有怪物靠近，現在應先部署什麼？', intent:'GUARD', mode:'PREDECISION'},
  {id:'E3-ESCORT', stage:3, language:'zh-TW', cue:'預告：載貨隊即將進入危險區，現在先做什麼？', intent:'GUARD', mode:'PREDECISION'},
  {id:'E4-1', stage:4, language:'zh-TW', cue:'龍的三步指令，第1步：隨隊前進', intent:'FOLLOW', mode:'SEQUENCE', order:1},
  {id:'E4-2', stage:4, language:'zh-TW', cue:'龍的三步指令，第2步：站崗守護', intent:'GUARD', mode:'SEQUENCE', order:2},
  {id:'E4-3', stage:4, language:'zh-TW', cue:'龍的三步指令，第3步：停下待命', intent:'STAY', mode:'SEQUENCE', order:3},
  {id:'E5-EN-FOLLOW', stage:5, language:'en-US', cue:'English: ask a companion to follow', intent:'FOLLOW', mode:'MULTILINGUAL'},
  {id:'E5-EN-STAY', stage:5, language:'en-US', cue:'English: ask a companion to stay', intent:'STAY', mode:'MULTILINGUAL'},
  {id:'E5-THREE-GUARD', stage:5, language:'three-kingdoms', cue:'三國語氣：要求護駕', intent:'GUARD', mode:'MULTILINGUAL'},
  {id:'E5-THREE-ROAM', stage:5, language:'three-kingdoms', cue:'三國語氣：要求自行巡遊', intent:'ROAM', mode:'MULTILINGUAL'},
  {id:'E6-ZH-GUARD', stage:6, language:'zh-TW', cue:'中文：守住松樹國', intent:'GUARD', mode:'TRANSFER'},
  {id:'E6-EN-GUARD', stage:6, language:'en-US', cue:'English: guard the pine kingdom', intent:'GUARD', mode:'TRANSFER'},
  {id:'E6-THREE-GUARD', stage:6, language:'three-kingdoms', cue:'三國語氣：護駕松樹國', intent:'GUARD', mode:'TRANSFER'},
  {id:'E7-EN-FIGHT', stage:7, language:'en-US', cue:'English: take a hard-fight pose (game simulation only)', intent:'HARD_FIGHT', mode:'MASTERY'},
  {id:'E7-ZH-ROAM', stage:7, language:'zh-TW', cue:'中文：自由活動', intent:'ROAM', mode:'MASTERY'},
  {id:'E7-THREE-STAY', stage:7, language:'three-kingdoms', cue:'三國語氣：按兵不動', intent:'STAY', mode:'MASTERY'},
  {id:'E7-THREE-FOLLOW', stage:7, language:'three-kingdoms', cue:'三國語氣：隨我來', intent:'FOLLOW', mode:'MASTERY'}
]);
const ids = new Set(LESSONS.map(x=>x.id));
if(ids.size !== LESSONS.length) throw new Error('DUPLICATE_LESSON_ID');
const safe = x => typeof x==='string' && x.length>0 && x.length<=128 && /^[A-Za-z0-9._-]+$/.test(x);
const copy = o => JSON.parse(JSON.stringify(o));
export function createLearner({learnerId='GUEST',pointId=PINE_POINT_ID}={}) {
  if(!safe(learnerId)||pointId!==PINE_POINT_ID) throw new Error('INVALID_LEARNER_OR_POINT');
  return {schema:'K6888-E-RANK-V1',pointId,learnerId,rank:0,earned:[],attempts:{},events:[],courseCertifications:[],verifiedLifeId:null,awardTx:null};
}
export function validateLearner(s){
  if(!s||s.schema!=='K6888-E-RANK-V1'||s.pointId!==PINE_POINT_ID||!safe(s.learnerId)||!Array.isArray(s.earned)||!s.attempts||!Array.isArray(s.events)||!Array.isArray(s.courseCertifications))throw new Error('INVALID_LEARNER');
  if(s.earned.length!==new Set(s.earned).size||s.earned.some(id=>!ids.has(id)))throw new Error('INVALID_LESSON_HISTORY');
  if(s.events.length>100||Object.entries(s.attempts).some(([id,n])=>!ids.has(id)||!Number.isInteger(n)||n<0||n>3))throw new Error('INVALID_ATTEMPTS');
  const rank=rankFromEarned(s.earned); if(s.rank!==rank)throw new Error('FORGED_RANK');
  if(s.courseCertifications.length)throw new Error('UNVERIFIED_COURSE_CERTIFICATION');
  if(s.verifiedLifeId!==null||s.awardTx!==null)throw new Error('LIFE_OR_FINANCE_CLAIM_FORBIDDEN');
  return true;
}
export function rankFromEarned(earned=[]){
  const s=new Set(earned);
  let rank=0;
  for(let stage=1;stage<=7;stage++){
    const group=LESSONS.filter(x=>x.stage===stage);
    if(!group.every(x=>s.has(x.id)))break;
    rank=stage;
  }
  return rank;
}
export function upcomingLessons(state){
  validateLearner(state);
  return LESSONS.filter(l=>l.stage===state.rank+1&&!state.earned.includes(l.id));
}
export function submitLesson(state,{lessonId,answer,parser,observedAt=Date.now()}={}){
  validateLearner(state);
  const l=LESSONS.find(x=>x.id===lessonId);
  if(!l)return {ok:false,reason:'UNKNOWN_LESSON',state};
  if(l.stage!==state.rank+1)return {ok:false,reason:'LEVEL_SEQUENCE_LOCKED',state};
  if(state.earned.includes(l.id))return {ok:false,reason:'ALREADY_EARNED',state};
  if(state.attempts[l.id]>=3)return {ok:false,reason:'PRACTICE_LIMIT',state};
  if(l.mode==='SEQUENCE'&&l.order>1){
    const prior=LESSONS.find(x=>x.stage===l.stage&&x.order===l.order-1);
    if(!state.earned.includes(prior.id))return {ok:false,reason:'SEQUENCE_NOT_READY',state};
  }
  if(typeof answer!=='string'||answer.length>160||!Number.isSafeInteger(observedAt)||observedAt<0)return {ok:false,reason:'INVALID_ANSWER_OR_TIME',state};
  if(typeof parser!=='function')return {ok:false,reason:'PARSER_NOT_AVAILABLE',state};
  let parsed;
  try {parsed=parser(answer,l.language);}catch{return {ok:false,reason:'PARSER_ERROR',state};}
  const passed=parsed?.status==='RECOGNIZED'&&parsed.intent===l.intent;
  const next=copy(state);
  next.attempts[l.id]=(next.attempts[l.id]||0)+1;
  if(passed)next.earned.push(l.id);
  next.rank=rankFromEarned(next.earned);
  next.events.push({kind:'LOCAL_TEXT_EXAM',lessonId:l.id,language:l.language,passed,observedAt,method:'DECLARED_PHRASE_DICTIONARY'});
  next.events=next.events.slice(-100);
  validateLearner(next);
  return {ok:passed,reason:passed?'LOCAL_GAME_EXAM_PASS':'INTENT_MISMATCH_OR_UNKNOWN',state:next,unlockedRank:next.rank,financialReward:false,realLanguageCredential:false};
}
