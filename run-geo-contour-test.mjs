/**
 * Geo.traceContour doğrulaması: bilinen basit ızgara şekilleri (kare,
 * L-şekli, iki ayrık ada, ortası delik bir halka) izlenip üretilen
 * halka sayısı, alan ve delik işareti doğrulanır. Diğer test runner'larla
 * aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8811, CDP_PORT = 9271;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_DIR = '/home/user/wayborne-map-editor';

function startServer() {
  const MIME = {'.html':'text/html','.js':'application/javascript','.css':'text/css'};
  const srv = createServer((req, res) => {
    let p = join(BASE_DIR, decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith('/')) p += 'index.html';
    try { res.writeHead(200,{'Content-Type':MIME[extname(p)]||'text/plain'}); res.end(readFileSync(p)); }
    catch { res.writeHead(404); res.end(); }
  });
  return new Promise(r => srv.listen(PORT, () => r(srv)));
}

async function connectCDP() {
  const resp = JSON.parse(execSync(`curl -s http://localhost:${CDP_PORT}/json/list`));
  const wsUrl = resp[0].webSocketDebuggerUrl;
  return new Promise((res, rej) => {
    const ws = new WebSocket(wsUrl);
    let id = 0; const pending = {};
    ws.addEventListener('message', ({ data: d }) => {
      const m = JSON.parse(d);
      if (!m.id && m.method === 'Runtime.exceptionThrown') {
        console.error('[browser ERROR]', m.params.exceptionDetails.text, m.params.exceptionDetails.exception?.description || '');
      }
      if (m.id && pending[m.id]) { pending[m.id](m.result ?? m.error); delete pending[m.id]; }
    });
    ws.addEventListener('open', () => res({
      send: (method, params={}) => new Promise((r2,e2) => {
        const cid = ++id;
        pending[cid] = v => v && v.code ? e2(new Error(JSON.stringify(v))) : r2(v);
        ws.send(JSON.stringify({id:cid, method, params}));
      })
    }));
    ws.addEventListener('error', e => rej(e));
  });
}

async function evaluate(cdp, expression, awaitPromise=false) {
  return cdp.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
}

async function run() {
  const srv = await startServer();
  const chrome = spawn(CHROMIUM, [
    `--remote-debugging-port=${CDP_PORT}`, '--headless=new', '--no-sandbox', '--disable-gpu',
    '--window-size=1280,800', `http://localhost:${PORT}/`
  ], { stdio: 'ignore' });
  process.on('exit', () => { chrome.kill(); srv.close(); });

  await sleep(3000);
  try {
    const cdp = await connectCDP();
    await cdp.send('Runtime.enable');
    for (let i = 0; i < 40; i++) {
      const r = await evaluate(cdp, 'typeof Geo!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    const testCode = `(function () {
      var results = [];
      function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }
      function grid(w, h, cells) {
        var m = new Uint8Array(w*h);
        cells.forEach(function (c) { m[c[1]*w + c[0]] = 1; });
        return m;
      }

      /* 1) 4x4 tam dolu kare -> tek halka, delik yok, alan == 16 */
      var w1=4,h1=4, cells1=[];
      for (var y=0;y<h1;y++) for (var x=0;x<w1;x++) cells1.push([x,y]);
      var r1 = Geo.traceContour(grid(w1,h1,cells1), w1, h1);
      check('kare: tek halka', r1.length === 1);
      check('kare: delik yok', r1.length && !r1[0].hole);
      check('kare: alan doğru', r1.length && Math.abs(r1[0].area - w1*h1) < 1e-6);

      /* 2) L-şekli (6x6, sağ-üst 3x3 kare eksik) -> tek halka, delik yok */
      var w2=6,h2=6, cells2=[];
      for (var y2=0;y2<h2;y2++) for (var x2=0;x2<w2;x2++) {
        if (x2>=3 && y2<3) continue; /* sağ üst çeyrek eksik */
        cells2.push([x2,y2]);
      }
      var r2 = Geo.traceContour(grid(w2,h2,cells2), w2, h2);
      check('L-şekli: tek halka', r2.length === 1);
      check('L-şekli: alan doğru (36-9=27)', r2.length && Math.abs(r2[0].area - 27) < 1e-6);

      /* 3) iki ayrık 3x3 kare (aralarında boşluk) -> iki ayrı halka */
      var w3=10,h3=4, cells3=[];
      for (var y3=0;y3<3;y3++) for (var x3=0;x3<3;x3++) cells3.push([x3,y3]);
      for (var y3b=0;y3b<3;y3b++) for (var x3b=0;x3b<3;x3b++) cells3.push([x3b+6,y3b]);
      var r3 = Geo.traceContour(grid(w3,h3,cells3), w3, h3);
      check('iki ada: iki halka', r3.length === 2);
      check('iki ada: ikisi de dış sınır (delik yok)', r3.every(function(r){return !r.hole;}));

      /* 4) ortası delik 7x7 halka (dış 7x7 dolu, iç 3x3 boş) -> 1 dış + 1 iç (delik) halka */
      var w4=7,h4=7, cells4=[];
      for (var y4=0;y4<h4;y4++) for (var x4=0;x4<w4;x4++) {
        if (x4>=2 && x4<5 && y4>=2 && y4<5) continue; /* iç 3x3 boşluk */
        cells4.push([x4,y4]);
      }
      var r4 = Geo.traceContour(grid(w4,h4,cells4), w4, h4);
      check('halka: iki halka üretti (dış+delik)', r4.length === 2);
      var outer4 = r4.filter(function(r){return !r.hole;});
      var hole4 = r4.filter(function(r){return r.hole;});
      check('halka: bir dış sınır var', outer4.length === 1);
      check('halka: bir delik var', hole4.length === 1);
      /* dış halkanın shoelace alanı deliği "bilmez" — tüm 7x7 dış
         sınırını kapsar (49); gerçek dolu alan (40) yalnızca dış-delik
         çifti birlikte (even-odd) render edildiğinde ortaya çıkar. */
      check('halka: dış alan doğru (49)', outer4.length && Math.abs(outer4[0].area - 49) < 1e-6);
      check('halka: delik alanı doğru (9)', hole4.length && Math.abs(hole4[0].area - 9) < 1e-6);

      /* 5) boş ızgara -> hiç halka yok, çökme yok */
      var r5 = Geo.traceContour(new Uint8Array(16), 4, 4);
      check('boş ızgara: sıfır halka, hata yok', r5.length === 0);

      /* 6) düzensiz doğal-benzeri şekil (flood-fill benzeri, köşegin
         değmeler dahil) -> çökmeden bir sonuç üretmeli */
      var w6=12,h6=12; var m6 = new Uint8Array(w6*h6);
      var rnd = 123456789;
      function nextRnd(){ rnd = (rnd*1103515245+12345)>>>0; return (rnd>>>8)/16777216; }
      for (var y6=0;y6<h6;y6++) for (var x6=0;x6<w6;x6++) {
        var cx=5.5, cy=5.5, d=Math.hypot(x6-cx,y6-cy);
        if (d < 4 + nextRnd()*1.5) m6[y6*w6+x6]=1;
      }
      var r6 = Geo.traceContour(m6, w6, h6);
      check('düzensiz şekil: çökmeden sonuç üretti', Array.isArray(r6) && r6.length >= 1);
      check('düzensiz şekil: tüm halkalar >=3 nokta', r6.every(function(r){return r.length>=3;}));

      return results.join('\\n');
    })()`;

    const result = await evaluate(cdp, testCode);
    const lines = (result.result?.value || '').split('\n').filter(Boolean);
    let allPass = true;
    for (const line of lines) {
      const ok = line.includes(': PASS');
      if (!ok) allPass = false;
      console.log((ok ? '  ✓ ' : '  ✗ ') + line);
    }
    console.log('\n' + (allPass && lines.length ? '✅ TÜM TESTLER GEÇTİ' : '❌ BAZI TESTLER BAŞARISIZ'));
    process.exit(allPass && lines.length ? 0 : 1);
  } catch (err) {
    console.error('KRİTİK HATA:', err.message || err);
    process.exit(1);
  }
}

run();
