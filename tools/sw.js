
const CACHE='polihov-v6-elite';
const SHELL=[
  './','./index.html','./css/style.css','./js/app.js','./js/tool-utils.js',
  './pages/all-tools.html','./pages/favorites.html','./pages/recent.html','./pages/about.html',
  './tools/word-counter.html','./tools/case-converter.html','./tools/json-formatter.html','./tools/base64-tool.html',
  './tools/hash-generator.html','./tools/url-tool.html','./tools/password-generator.html','./tools/qr-generator.html',
  './tools/image-lab.html','./tools/pdf-studio.html','./tools/color-lab.html','./tools/unit-converter.html',
  './tools/timestamp-tool.html','./tools/text-diff.html','./tools/csv-json.html','./tools/regex-tester.html',
  './tools/slug-generator.html','./tools/lorem-generator.html'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(resp=>{
    const copy=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{}); return resp;
  }).catch(()=>caches.match('./index.html'))))
});
