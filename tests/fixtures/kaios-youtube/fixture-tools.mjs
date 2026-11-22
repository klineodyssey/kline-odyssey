import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** Test responses only. Never fetch a YouTube request or ship this in dist. */
export async function loadNativeYouTubeFixture({videoIds}={}){
 if(!Array.isArray(videoIds)||!videoIds.length||!videoIds.every(id=>typeof id==='string'&&/^[A-Za-z0-9_-]{11}$/.test(id)))throw new TypeError('EXPLICIT_VALIDATED_VIDEO_IDS_REQUIRED');
 const allowed=new Set(videoIds);
 const [api,template,media]=await Promise.all([
  readFile(new URL('iframe-api.js',import.meta.url),'utf8'),
  readFile(new URL('embed.html',import.meta.url),'utf8'),
  readFile(new URL('media.webm',import.meta.url))
 ]);
 const token='__KGEN_LOCAL_MEDIA_DATA_URI__';
 if(template.split(token).length!==2)throw new Error('LOCAL_MEDIA_TEMPLATE_REQUIRED');
 const html=template.replace(token,'data:video/webm;base64,'+media.toString('base64'));
 const manifest={label:'LOCAL ISOLATED NATIVE MEDIA; NOT YOUTUBE PLAYBACK',mediaBytes:media.length,mediaSha256:createHash('sha256').update(media).digest('hex'),upstreamRequests:0};
 return Object.freeze({api,html,manifest,responseFor(request){
  const url=new URL(typeof request==='string'?request:request.url());
  const method=typeof request==='string'?'GET':request.method();
  if(!['GET','HEAD'].includes(method))return null;
  const headers={'cache-control':'no-store','x-kgen-local-fixture':'LOCAL_ISOLATED_NATIVE_MEDIA_NOT_YOUTUBE_PLAYBACK'};
  if(url.href==='https://www.youtube.com/iframe_api')return {status:200,contentType:'text/javascript; charset=utf-8',headers,body:api};
  const match=/^\/embed\/([A-Za-z0-9_-]{11})$/.exec(url.pathname);
  if(url.origin==='https://www.youtube.com'&&match&&allowed.has(match[1]))return {status:200,contentType:'text/html; charset=utf-8',headers,body:html};
  return null;
 }});
}
