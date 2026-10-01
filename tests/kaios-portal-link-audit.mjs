// Read-only first-party audit: historical entry links stay inspectable in Git;
// no financial, external submission or network authority is exercised.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const BASE='a6e65af31b7070425d44cdf08862ab26e26e0a9f';
const origin='https://klineodyssey.github.io/kline-odyssey/';
const playable=new Set(['K線西遊記/temples/11520/game-5d.html','K線西遊記/temples/12345/index.html','K線西遊記/temples/16888/index.html']);
const rows=[];
for(const entry of ['index.html','K線西遊記/index.html']){
  const html=execFileSync('git',['show',`${BASE}:${entry}`],{cwd:ROOT,encoding:'utf8',maxBuffer:8e6});
  const seen=new Set();
  for(const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
    const href=match[1],label=match[2].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
    let url;try{url=new URL(href,new URL(entry,origin))}catch{rows.push({entry,href,label,status:'BROKEN',action:'removed from playable navigation'});continue}
    if(url.origin!==new URL(origin).origin){rows.push({entry,href,label,status:'INFORMATION_ONLY',action:'external reference; not a playable world; remote availability not certified'});continue}
    const relative=decodeURIComponent(url.pathname).replace(/^\/kline-odyssey\//,'');
    const disk=path.resolve(ROOT,relative||'index.html');
    const exists=disk.startsWith(ROOT)&&fs.existsSync(disk)&&(fs.statSync(disk).isFile()||fs.existsSync(path.join(disk,'index.html')));
    let status=seen.has(url.href)?'DUPLICATE':!exists?'MISSING':playable.has(relative)?'PLAYABLE':relative==='K線西遊記/temples/11520/index.html'?'STALE':relative==='K線西遊記/index.html'?'SUPERSEDED':'INFORMATION_ONLY';
    seen.add(url.href);
    rows.push({entry,href,label,status,action:status==='PLAYABLE'?'registry-backed play CTA':status==='SUPERSEDED'?'compatibility redirect to root Portal':status==='STALE'?'game CTA uses temples/11520/game-5d.html; old exchange retained':status==='MISSING'?'not exposed by new Portal':status==='DUPLICATE'?'converged into registry navigation':'reference retained through Explore / library, not a play CTA'});
  }
}
const out=path.join(ROOT,'artifacts/kaios-portal-qa');fs.mkdirSync(out,{recursive:true});
const report={baseline:BASE,scope:'Two former main entry pages; all anchor links. No claim of exhaustive historical-doc or external-provider uptime audit.',counts:rows.reduce((r,x)=>(r[x.status]=(r[x.status]||0)+1,r),{}),links:rows};
fs.writeFileSync(path.join(out,'legacy-link-audit.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({baseline:BASE,count:rows.length,counts:report.counts}));
