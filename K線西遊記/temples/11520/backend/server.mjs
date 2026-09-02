import http from 'node:http';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataFile = resolve(here, 'data', 'players.json');
const resourceManifest = resolve(here, '..', 'assets', 'resource-manifest.json');
const PORT = Number(process.env.PORT || 11520);
const sessions = new Map();
let players = {};

async function loadDb(){
  try { players = JSON.parse(await readFile(dataFile, 'utf8')); }
  catch { players = {}; await persist(); }
}
async function persist(){ await mkdir(dirname(dataFile), { recursive:true }); await writeFile(dataFile, JSON.stringify(players,null,2)); }
function send(res, status, body){ res.writeHead(status, {'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-headers':'content-type,authorization','access-control-allow-methods':'GET,POST,PUT,OPTIONS'}); res.end(JSON.stringify(body)); }
async function json(req){ let s=''; for await (const c of req) s += c; return s ? JSON.parse(s) : {}; }
function auth(req){ const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,''); return sessions.get(token)||null; }
function playerView(p){ return { id:p.id,name:p.name,xyz:p.xyz,kgen:p.kgen,kaios:p.kaios,kufo:p.kufo,hp:p.hp,home:p.home||null,updatedAt:p.updatedAt }; }

await loadDb();
const server=http.createServer(async (req,res)=>{
  if(req.method==='OPTIONS') return send(res,204,{});
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  try {
    if(req.method==='GET' && url.pathname==='/health') return send(res,200,{ok:true,service:'k11520-backend',mode:'OFFCHAIN_SIMULATION'});
    if(req.method==='GET' && url.pathname==='/api/v1/resources') return send(res,200,JSON.parse(await readFile(resourceManifest,'utf8')));
    if(req.method==='POST' && url.pathname==='/api/v1/login'){
      const body=await json(req); const id=String(body.playerId||randomUUID());
      const now=new Date().toISOString();
      players[id] ||= {id,name:String(body.name||'旅人').slice(0,40),xyz:{x:0,y:0,z:0},kgen:10,kaios:1000,kufo:1,hp:100,home:null,updatedAt:now};
      players[id].updatedAt=now; await persist();
      const token=randomBytes(24).toString('hex'); sessions.set(token,id);
      return send(res,200,{token,player:playerView(players[id]),orderMode:'OFFCHAIN_SIMULATION'});
    }
    if(req.method==='GET' && url.pathname==='/api/v1/player'){
      const id=auth(req); if(!id) return send(res,401,{error:'UNAUTHORIZED'}); return send(res,200,{player:playerView(players[id])});
    }
    if(req.method==='PUT' && url.pathname==='/api/v1/player'){
      const id=auth(req); if(!id) return send(res,401,{error:'UNAUTHORIZED'}); const body=await json(req); const p=players[id];
      if(body.xyz) p.xyz={x:Number(body.xyz.x)||0,y:Number(body.xyz.y)||0,z:Number(body.xyz.z)||0};
      if(Array.isArray(body.home)&&body.home.length===2) p.home=[Number(body.home[0]),Number(body.home[1])];
      p.updatedAt=new Date().toISOString(); await persist(); return send(res,200,{player:playerView(p)});
    }
    if(req.method==='POST' && url.pathname==='/api/v1/order'){
      const id=auth(req); if(!id) return send(res,401,{error:'UNAUTHORIZED'}); const b=await json(req); const p=players[id];
      const axis=String(b.axis||''); const side=String(b.side||''); const lots=Math.trunc(Number(b.lots)); const leverage=Math.trunc(Number(b.leverage)); const price=Number(b.price);
      if(!['KX','KY','KZ'].includes(axis)) return send(res,400,{error:'BAD_AXIS'});
      if(!['多','空'].includes(side)) return send(res,400,{error:'BAD_SIDE'});
      if(!(lots>=1&&lots<=100)) return send(res,400,{error:'BAD_LOTS'});
      if(!(leverage>=1&&leverage<=1000)) return send(res,400,{error:'BAD_LEVERAGE'});
      if(!Number.isFinite(price)||price<=0) return send(res,400,{error:'BAD_PRICE'});
      if(p.kgen<lots) return send(res,409,{error:'INSUFFICIENT_KGEN',required:lots,available:p.kgen});
      p.kgen-=lots; p.updatedAt=new Date().toISOString(); await persist();
      return send(res,200,{order:{id:randomUUID(),axis,side,lots,leverage,marginKgen:lots,entryPrice:price,status:'FILLED_SIMULATION'},player:playerView(p)});
    }
    return send(res,404,{error:'NOT_FOUND'});
  } catch (e) { return send(res,500,{error:'SERVER_ERROR',message:String(e?.message||e)}); }
});
server.listen(PORT,()=>console.log(`K11520 backend listening on :${PORT}`));
