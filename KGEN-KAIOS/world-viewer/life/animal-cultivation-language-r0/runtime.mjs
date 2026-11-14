/** KAIOS Cultivation language R0; no finance or species identity authority. */
export const PROTOCOL='KAIOS-ANIMAL-INTENT/1';
export const K5_STATUS='MARS_FIVE_DIGIT_DICTIONARY_NOT_VERIFIED';
export const INTENTS=Object.freeze({FOLLOW:1,GUARD:2,HARD_FIGHT:3,ROAM:4,STAY:5,ALERT:6,FOOD:7,HELP:8});
const basic=new Set(['FOLLOW','GUARD','ROAM','STAY','ALERT','FOOD','HELP']);
const words=Object.freeze({
 'zh-Hant':{'跟隨':'FOLLOW','跟著我':'FOLLOW','守衛':'GUARD','自由活動':'ROAM','停下':'STAY','待命':'STAY','攻擊':'HARD_FIGHT','危險':'ALERT','食物':'FOOD','求救':'HELP'},
 'en-US':{'follow':'FOLLOW','follow me':'FOLLOW','guard':'GUARD','roam':'ROAM','stay':'STAY','attack':'HARD_FIGHT','danger':'ALERT','food':'FOOD','help':'HELP'},
 'three-kingdoms':{'隨我來':'FOLLOW','護駕':'GUARD','各自活動':'ROAM','按兵不動':'STAY','迎戰':'HARD_FIGHT','敵襲':'ALERT','用膳':'FOOD','求援':'HELP'}
});
export function stageOf(trainingK){
 if(!Number.isSafeInteger(trainingK)||trainingK<0||trainingK>30000)throw Error('TRAINING_K_OUT_OF_RANGE');
 return trainingK<=300?{name:'後知後決',capability:'SENSORY'}:trainingK<=3000?{name:'不知不覺',capability:'CLOSED_COMMAND'}:{name:'先知先決',capability:'CONTEXT_CANDIDATE'};
}
export function readHuman({trainingK,text,language='zh-Hant',mode='TEXT',sttVerified=false}={}){
 const stage=stageOf(trainingK);
 if(mode==='AUDIO'&&!sttVerified)return {status:'SPEECH_TO_TEXT_REQUIRED',intent:null,stage:stage.name};
 if(mode!=='TEXT'&&mode!=='AUDIO')return {status:'INPUT_UNSUPPORTED',intent:null,stage:stage.name};
 if(stage.capability==='SENSORY')return {status:'NO_HUMAN_LANGUAGE',intent:null,stage:stage.name};
 if(language==='K5')return {status:K5_STATUS,intent:null,stage:stage.name};
 if(language==='K300')return {status:'K300_TEXT_CODEC_NOT_INTENT_DECODER',intent:null,stage:stage.name};
 if(!words[language])return {status:'LANGUAGE_UNSUPPORTED',intent:null,stage:stage.name};
 const intent=words[language][String(text||'').normalize('NFC').trim().toLowerCase()]||null;
 if(!intent)return {status:'NATURAL_LANGUAGE_MODEL_REQUIRED',intent:null,stage:stage.name};
 if(stage.capability==='CLOSED_COMMAND'&&!basic.has(intent))return {status:'ADVANCED_TRAINING_REQUIRED',intent:null,stage:stage.name};
 return {status:'EXACT_CONTROLLED_COMMAND_ONLY',intent,stage:stage.name,code:INTENTS[intent],humanFreeSpeechVerified:false};
}
export function packIntent(intent){if(!INTENTS[intent])throw Error('INTENT_UNKNOWN');return Uint8Array.of(INTENTS[intent]);}
export function unpackIntent(bytes){if(!(bytes instanceof Uint8Array)||bytes.length!==1)throw Error('INVALID_INTENT_FRAME');const intent=Object.keys(INTENTS).find(k=>INTENTS[k]===bytes[0]);if(!intent)throw Error('INTENT_UNKNOWN');return intent;}
export function sendAnimal({messageId,senderId,receiverId,senderSpecies,receiverSpecies,senderK,receiverK,intent,sharedProtocol=null,translator=null}={}){
 if(![messageId,senderId,receiverId].every(x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(x)))throw Error('MESSAGE_ID_REQUIRED');
 if(senderId===receiverId)return {status:'SELF_MESSAGE',delivered:false};
 const from=String(senderSpecies||'').toUpperCase(),to=String(receiverSpecies||'').toUpperCase();
 if(!/^[A-Z]{2,32}$/.test(from)||!/^[A-Z]{2,32}$/.test(to))throw Error('SPECIES_INVALID');
 const s=stageOf(senderK),r=stageOf(receiverK);
 if(!INTENTS[intent])return {status:'INTENT_UNKNOWN',delivered:false};
 if(s.capability==='SENSORY'||r.capability==='SENSORY')return {status:'ANIMAL_CANNOT_DECODE',delivered:false};
 if(r.capability==='CLOSED_COMMAND'&&!basic.has(intent))return {status:'RECEIVER_TRAINING_REQUIRED',delivered:false};
 const shared=sharedProtocol===PROTOCOL;
 const translation=translator?.status==='VERIFIED'&&translator.protocol===PROTOCOL&&translator.from===from&&translator.to===to;
 if(!shared&&!translation)return {status:'NEEDS_SHARED_DECODER_OR_TRANSLATOR',delivered:false};
 return Object.freeze({status:'AWAITING_ACK',delivered:false,protocol:PROTOCOL,messageId,senderId,receiverId,
  senderSpecies:from,receiverSpecies:to,intent,payloadByte:INTENTS[intent],route:shared?'SHARED':'TRANSLATED',financialOrder:null});
}
export function receiverAck(frame,{receiverId,understood}={}){
 if(frame?.status!=='AWAITING_ACK')return {status:'NO_PENDING_MESSAGE',delivered:false};
 if(frame.receiverId!==receiverId)return {status:'RECIPIENT_MISMATCH',delivered:false};
 if(understood!==true)return {status:'NOT_UNDERSTOOD',delivered:false};
 return {status:'GAME_SEMANTIC_ACK',delivered:true,intent:frame.intent,financialOrder:null};
}
export function encodeK300(text,dictionary){
 if(dictionary?.protocol!=='KAIOS-K300'||dictionary.version!=='1.0.0'||dictionary.characters?.length!==300)throw Error('K300_CANONICAL_DICTIONARY_REQUIRED');
 const chars=new Map(),ids=new Set();
 for(const row of dictionary.characters){
  if(!/^\d{3}$/.test(row.id)||!row.char||chars.has(row.char)||ids.has(row.id))throw Error('K300_INVALID');
  chars.set(row.char,row.id);ids.add(row.id);
 }
 return Array.from(String(text)).map(c=>c===' '?'/':(chars.get(c)||('U+'+c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')))).join(' ');
}
export const FAST_MESSAGE_FACT={oneCommandPayloadBytes:1,scope:'SHARED_INTENT_VOCABULARY_ONLY',excludes:'HEADERS_ACK_TRANSLATION_AND_TRANSPORT',fasterThanLight:false};
