// VENTEFACILE – petit serveur de synchronisation (alternative à Firebase). Aucune dépendance.
// Lancer :  node server.js      (PORT=8080 par défaut, données dans data.json)
// Il sert aussi l'application (dossier parent) et affiche les avis reçus sur /avis-recus?cle=VOTRE_CLE
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=fs.existsSync(path.join(__dirname,'index.html'))?__dirname:path.resolve(__dirname,'..'); // fonctionne dossier « serveur-sync » ou fichiers tous à la racine
const PORT=process.env.PORT||8080,FILE=path.join(__dirname,'data.json'),ADMIN=process.env.CLE_ADMIN||'changez-moi';
let DB={};try{DB=JSON.parse(fs.readFileSync(FILE,'utf8'))}catch(e){}
let t=null;const persist=()=>{clearTimeout(t);t=setTimeout(()=>fs.writeFile(FILE,JSON.stringify(DB),()=>{}),300)};
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,PUT,PATCH,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
const MIME={'.html':'text/html;charset=utf-8','.js':'text/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.txt':'text/plain;charset=utf-8'};
function setPath(root,parts,val){let o=root;for(let i=0;i<parts.length-1;i++){if(typeof o[parts[i]]!=='object'||o[parts[i]]===null)o[parts[i]]={};o=o[parts[i]]}o[parts[parts.length-1]]=val}
http.createServer((q,s)=>{
 const u=new URL(q.url,'http://x');let p=decodeURIComponent(u.pathname);
 if(q.method==='OPTIONS'){s.writeHead(204,CORS);return s.end()}
 if(p.endsWith('.json')&&/^\/(ventefacile|avis)\//.test(p)){
  const parts=p.slice(1,-5).split('/').filter(Boolean);
  if(!parts.length||!/^(ventefacile|avis)$/.test(parts[0])){s.writeHead(403,CORS);return s.end('{"error":"interdit"}')}
  if(q.method==='GET'){let o=DB;for(const k of parts){o=o&&o[k];if(o===undefined){o=null;break}}s.writeHead(200,{...CORS,'Content-Type':'application/json'});return s.end(JSON.stringify(o))}
  let b='';q.on('data',d=>{b+=d;if(b.length>5e6)q.destroy()});q.on('end',()=>{
   let v;try{v=JSON.parse(b)}catch(e){s.writeHead(400,CORS);return s.end('{"error":"json"}')}
   if(q.method==='PUT')setPath(DB,parts,v);
   else if(q.method==='PATCH'){for(const k in v)setPath(DB,[...parts,...k.split('/')],v[k])}
   else{s.writeHead(405,CORS);return s.end()}
   persist();s.writeHead(200,{...CORS,'Content-Type':'application/json'});s.end(JSON.stringify(v))});return}
 if(p==='/avis-recus'){
  if(u.searchParams.get('cle')!==ADMIN){s.writeHead(401,{'Content-Type':'text/plain;charset=utf-8'});return s.end('Clé incorrecte')}
  const L=Object.values(DB.avis||{}).sort((a,b)=>(b.ts||0)-(a.ts||0)),e=x=>String(x||'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  s.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
  return s.end('<meta name=viewport content="width=device-width"><body style="font-family:sans-serif;max-width:640px;margin:1rem auto;padding:0 1rem"><h1>Avis VENTEFACILE ('+L.length+')</h1>'+L.map(a=>'<div style="border:1px solid #ccc;border-radius:8px;padding:.7rem;margin:.6rem 0"><b>'+'★'.repeat(a.note||0)+'☆'.repeat(5-(a.note||0))+'</b> · v'+e(a.ver)+'<br>'+e(a.texte)+'<br><i>'+e(a.contact)+'</i><br><small>'+new Date(a.ts||0).toLocaleString('fr-FR')+'</small></div>').join(''))}
 const root=ROOT;let f=path.join(root,p==='/'?'index.html':p);
 const PRIV=/(^|[\\/])(data\.json|server\.js|package\.json|\.gitignore)$/;
 if(!f.startsWith(root)||PRIV.test(f)){s.writeHead(403);return s.end()}
 const serve=(file,alt)=>fs.readFile(file,(e,d)=>{
  if(e){const a=path.join(root,path.basename(file));if(!alt&&a!==file&&!PRIV.test(a))return serve(a,true);s.writeHead(404);return s.end('404')}
  if(path.basename(file)==='index.html'&&path.dirname(file)===root){ // l'application est servie avec l'adresse de CE serveur déjà réglée pour la synchronisation
   const origin=(q.headers['x-forwarded-proto']||'http').split(',')[0]+'://'+q.headers.host;
   s.writeHead(200,{'Content-Type':MIME['.html'],'Cache-Control':'no-cache'});return s.end(d.toString('utf8').replace(/const SYNC_URL='[^']*';/,"const SYNC_URL='"+origin+"';"))}
  s.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream'});s.end(d)});
 serve(f,false);
}).listen(PORT,()=>console.log('VENTEFACILE sur http://localhost:'+PORT+'  (avis : /avis-recus?cle='+ADMIN+')'));
