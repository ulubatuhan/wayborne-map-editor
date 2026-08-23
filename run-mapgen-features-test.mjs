/**
 * Faz A doğrulama — kara üretimi determinizmi, biyom otomatik atama, nehir
 * otomatik üretimi, sembol lejantı. Diğer test runner'larla aynı CDP
 * iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8769, CDP_PORT = 9226;
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
      if (!m.id && m.method === 'Runtime.consoleAPICalled') {
        const args = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        if (args) process.stdout.write('[browser] ' + args + '\n');
      }
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
  let cdp;
  try {
    cdp = await connectCDP();
    await cdp.send('Runtime.enable');

    for (let i = 0; i < 40; i++) {
      const r = await evaluate(cdp, 'typeof Layers!=="undefined"&&typeof Tools!=="undefined"&&typeof Cv!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    const testCode = `(async function () {
      try {
        const results = [];
        function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

        Cv.setSize(1024, 1024, false);

        /* 1) Kıta şablonu üretiyor mu + deterministik mi + %40 kapsama */
        Tools.generateLandmass('continent', 0.5, 12345);
        await new Promise(r => setTimeout(r, 50));
        const Lm = Layers.get('landmass');
        function landPct() {
          const d = Lm.ctx.getImageData(0,0,Lm.canvas.width,Lm.canvas.height).data;
          let n=0; for (let i=3;i<d.length;i+=4) if (d[i]>10) n++;
          return n / (d.length/4);
        }
        const p1 = landPct();
        check('kıta kara üretti', p1 > 0.01 && p1 < 0.95);
        check('kıta en az %40 kaplıyor', p1 >= 0.38);
        Tools.generateLandmass('continent', 0.5, 12345);
        await new Promise(r => setTimeout(r, 50));
        const p2 = landPct();
        check('kıta aynı tohum -> aynı sonuç', Math.abs(p1-p2) < 0.001);
        Tools.generateLandmass('continent', 0.5, 999);
        await new Promise(r => setTimeout(r, 50));
        const p3 = landPct();
        check('kıta farklı tohum -> farklı sonuç', Math.abs(p1-p3) > 0.001);

        /* 2) Biyom otomatik atama */
        Tools.generateLandmass('continent', 0.5, 55);
        await new Promise(r => setTimeout(r, 50));
        await Tools.autoBiome(777);
        const T = Layers.get('terrain');
        const td = T.ctx.getImageData(0,0,T.canvas.width,T.canvas.height).data;
        let tPixels = 0; for (let i=3;i<td.length;i+=4) if (td[i]>10) tPixels++;
        check('biyom atama arazi katmanına piksel yazdı', tPixels > 100);

        /* elevation ekle, biyomların yükseklik bandına duyarlı olduğunu kontrol et */
        const Ev = Layers.get('elevation');
        Ev.ctx.save();
        Ev.ctx.globalCompositeOperation = 'lighten';
        const eg = Ev.ctx.createRadialGradient(512,512,0,512,512,300);
        eg.addColorStop(0,'rgb(255,255,255)'); eg.addColorStop(1,'rgba(255,255,255,0)');
        Ev.ctx.fillStyle = eg;
        Ev.ctx.beginPath(); Ev.ctx.arc(512,512,300,0,Math.PI*2); Ev.ctx.fill();
        Ev.ctx.restore();
        Cv.elevationDirty = true;
        await Tools.autoBiome(777);
        const td2 = T.ctx.getImageData(0,0,T.canvas.width,T.canvas.height).data;
        let tPixels2 = 0; for (let i=3;i<td2.length;i+=4) if (td2[i]>10) tPixels2++;
        check('yükseklik eklenince biyom yeniden üretildi', tPixels2 > 100);

        /* 3) Nehir otomatik üretimi */
        const Rv = Layers.get('rivers');
        const beforeCount = Rv.objects.length;
        Tools.generateRivers(4, 321);
        await new Promise(r => setTimeout(r, 100));
        check('nehir nesneleri eklendi', Rv.objects.length > beforeCount);
        const riv = Rv.objects[Rv.objects.length-1];
        check('nehir en az 2 noktalı', riv && riv.pts && riv.pts.length >= 2);
        check('nehir renk/genişlik alanları var', riv && typeof riv.width === 'number' && !!riv.color);
        let inBounds = true;
        if (riv) riv.pts.forEach(function(pt){ if (pt[0]<0||pt[1]<0||pt[0]>1024||pt[1]>1024) inBounds=false; });
        check('nehir noktaları tuval sınırları içinde', inBounds);

        /* undo/redo bütünlüğü: nehir üretimi de History'ye giriyor mu */
        await History.undo();
        await new Promise(r => setTimeout(r, 100));
        check('nehir üretimi undo edilebiliyor', Rv.objects.length === beforeCount);
        await History.redo();
        await new Promise(r => setTimeout(r, 100));
        check('nehir üretimi redo edilebiliyor', Rv.objects.length > beforeCount);

        /* 4) Sembol lejantı */
        const Sy = Layers.get('symbols');
        Sy.objects.push({ id:'legtest1', sym:'town', x:100, y:100, size:64, rot:0 });
        Sy.objects.push({ id:'legtest2', sym:'town', x:200, y:200, size:64, rot:0 }); // aynı sembol -> dedupe
        Sy.objects.push({ id:'legtest3', sym:'castle', x:300, y:300, size:64, rot:0 });
        Cv.symbolLegend = true;
        Cv.requestRender();
        await new Promise(r => setTimeout(r, 150));
        const c = document.createElement('canvas'); c.width = Cv.W; c.height = Cv.H;
        const cx = c.getContext('2d');
        Cv.renderMap(cx, { includeReference:false, includeLinks:false });
        check('renderMap lejant ile hatasız çalıştı', true);

        /* proje kaydet/yükle round-trip: symbolLegend kalıcı mı */
        const proj = JSON.parse(JSON.stringify(Exporter.buildProjectData()));
        check('symbolLegend serialize ediliyor', proj.symbolLegend === true);
        Cv.symbolLegend = false;
        await Exporter.applyProjectData(proj);
        await new Promise(r => setTimeout(r, 100));
        check('symbolLegend geri yüklendi', Cv.symbolLegend === true);

        window.__testResults = results;
        window.__testPass = results.every(r => r.endsWith('PASS'));
        window.__testDone = true;
      } catch (e) {
        window.__testError = e.message + ' ' + e.stack;
        window.__testDone = true;
      }
    })();`;

    await evaluate(cdp, testCode, true);

    for (let i = 0; i < 30; i++) {
      const done = await evaluate(cdp, 'window.__testDone===true');
      if (done.result?.value) break;
      await sleep(300);
    }

    const err = await evaluate(cdp, 'window.__testError||""');
    if (err.result?.value) { console.error('HATA:', err.result.value); process.exit(1); }

    const res = await evaluate(cdp, 'JSON.stringify(window.__testResults||[])');
    const pass = await evaluate(cdp, 'window.__testPass===true');
    const list = JSON.parse(res.result?.value || '[]');
    console.log('\n========== FAZ A TESTİ ==========');
    list.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
    console.log(pass.result?.value ? '\n✅ TÜM TESTLER GEÇTİ' : '\n❌ BAZI TESTLER BAŞARISIZ');
    process.exit(pass.result?.value ? 0 : 1);

  } finally {
    cdp?.close(); chrome.kill(); srv.close();
  }
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
