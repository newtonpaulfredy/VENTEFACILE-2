// VENTEFACILE – synchronisation sur Netlify (stockage Netlify Blobs). Mêmes adresses que Firebase.
import {getStore} from "@netlify/blobs";
const CORS={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,PUT,PATCH,OPTIONS","Access-Control-Allow-Headers":"Content-Type"};
const J=(o,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...CORS,"Content-Type":"application/json"}});
function setPath(root,parts,val){let o=root;for(let i=0;i<parts.length-1;i++){if(typeof o[parts[i]]!=="object"||o[parts[i]]===null)o[parts[i]]={};o=o[parts[i]]}o[parts[parts.length-1]]=val}
export default async (req)=>{
 const u=new URL(req.url),p=decodeURIComponent(u.pathname),store=getStore("vf");
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:CORS});
 if(p==="/avis-recus"){
  if(u.searchParams.get("cle")!==(Netlify.env.get("CLE_ADMIN")||"changez-moi"))return new Response("Clé incorrecte",{status:401,headers:{"Content-Type":"text/plain;charset=utf-8"}});
  const e=x=>String(x||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
  const {blobs}=await store.list({prefix:"avis/"}),L=[];
  for(const b of blobs){const v=await store.get(b.key,{type:"json"});if(v)L.push(v)}
  L.sort((a,b)=>(b.ts||0)-(a.ts||0));
  return new Response('<meta name=viewport content="width=device-width"><body style="font-family:sans-serif;max-width:640px;margin:1rem auto;padding:0 1rem"><h1>Avis VENTEFACILE ('+L.length+')</h1>'+L.map(a=>'<div style="border:1px solid #ccc;border-radius:8px;padding:.7rem;margin:.6rem 0"><b>'+"★".repeat(a.note||0)+"☆".repeat(5-(a.note||0))+"</b> · v"+e(a.ver)+"<br>"+e(a.texte)+"<br><i>"+e(a.contact)+"</i><br><small>"+new Date(a.ts||0).toLocaleString("fr-FR")+"</small></div>").join(""),{headers:{"Content-Type":"text/html;charset=utf-8"}});
 }
 const m=p.match(/^\/(ventefacile|avis)\/([A-Za-z0-9_-]{1,80})\.json$/);
 if(!m)return J({error:"interdit"},403);
 const key=m[1]+"/"+m[2];
 if(req.method==="GET"){const v=await store.get(key,{type:"json"});return J(v===undefined?null:v)}
 let v;try{v=JSON.parse(await req.text())}catch(e){return J({error:"json"},400)}
 if(req.method==="PUT"){await store.setJSON(key,v);return J(v)}
 if(req.method==="PATCH"){
  let cur=await store.get(key,{type:"json"});if(!cur||typeof cur!=="object")cur={};
  for(const k in v)setPath(cur,k.split("/"),v[k]);
  await store.setJSON(key,cur);return J(v);
 }
 return J({error:"methode"},405);
};
export const config={path:["/ventefacile/*","/avis/*","/avis-recus"]};
