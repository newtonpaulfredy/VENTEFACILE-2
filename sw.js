// VENTEFACILE – fonctionne sans connexion une fois installée
const V='ventefacile-v6',FILES=['./','index.html','manifest.json','icon.svg','icon-180.png','icon-192.png','icon-512.png','icon-maskable-512.png','guide/g1.jpg','guide/g2.jpg','guide/g3.jpg','guide/g4.jpg','guide/g5.jpg','guide/g6.jpg','guide/g7.jpg','guide/g8.jpg','guide/g9.jpg','guide/g10.jpg','guide/g11.jpg','guide/g12.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(n=>{const c=n.clone();caches.open(V).then(x=>x.put(e.request,c));return n}).catch(()=>caches.match('index.html'))));
});
