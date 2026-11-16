const http=require('http'),fs=require('fs'),path=require('path');
const root=process.argv[2],port=+process.argv[3]||8765;
const T={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.txt':'text/plain'};
http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);let f=path.join(root,p);
 try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');}catch(e){if(fs.existsSync(f+'.html'))f+='.html';}
 fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end('404');}r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});r.end(d);});
}).listen(port,()=>console.log('serving on '+port));
