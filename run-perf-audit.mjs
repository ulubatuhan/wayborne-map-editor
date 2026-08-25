/**
 * Performans denetimi: tüm ağır araç/mekaniklerin (kara üretimi, biyom, nehir,
 * göl, yol, yerleşim, referans tarama, katman/undo işlemleri) çalışma sürelerini
 * ölçer. Hedef: hiçbir tekil işlem 1000ms'yi, "rastgele harita üret" tam
 * pipeline'ı (kara+nehir+göl+biyom) 2000ms'yi aşmamalı. Diğer test runner'larla
 * aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8797, CDP_PORT = 9252;
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
    const lines = [];
    ws.addEventListener('message', ({ data: d }) => {
      const m = JSON.parse(d);
      if (!m.id && m.method === 'Runtime.consoleAPICalled') {
        const args = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        if (args) lines.push(args);
      }
      if (!m.id && m.method === 'Runtime.exceptionThrown') {
        const ex = m.params.exceptionDetails;
        console.error('[browser ERROR]', ex.text, ex.exception?.description || '');
      }
      if (m.id && pending[m.id]) { pending[m.id](m.result ?? m.error); delete pending[m.id]; }
    });
    ws.addEventListener('open', () => res({
      send: (method, params={}) => new Promise((r2,e2) => {
        const cid = ++id;
        pending[cid] = v => v && v.code ? e2(new Error(JSON.stringify(v))) : r2(v);
        ws.send(JSON.stringify({id:cid, method, params}));
      }),
      lines
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
      const r = await evaluate(cdp, 'typeof Layers!=="undefined"&&typeof Tools!=="undefined"&&typeof UI!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    const testCode = `(async function () {
      try {
        const timings = [];
        function mark(name, ms, budgetMs) {
          timings.push({ name, ms: Math.round(ms*10)/10, budgetMs, pass: ms <= budgetMs });
        }
        async function time(name, budgetMs, fn) {
          const t0 = performance.now();
          const r = fn();
          if (r && typeof r.then === 'function') await r;
          const ms = performance.now() - t0;
          mark(name, ms, budgetMs);
          return r;
        }

        Layers.init(2048, 2048);
        History.clear();

        await time('generateLandmass(continent, 2048)', 1000, () =>
          Tools.generateLandmass('continent', 0.5, 111));
        await time('generateLandmass(island, 2048)', 1000, () =>
          Tools.generateLandmass('island', 0.5, 222));
        await time('generateLandmass(archipelago, 2048)', 1000, () =>
          Tools.generateLandmass('archipelago', 0.5, 333));

        Tools.generateLandmass('continent', 0.5, 444, { withElevation: true });
        await time('autoBiome(2048)', 1000, () => Tools.autoBiome(444));
        await time('generateRivers(2048)', 1000, () => Tools.generateRivers(4, 444));
        await time('autoLakes(2048)', 1000, () => Tools.autoLakes(444));
        await time('generateRoads(2048)', 1000, () => Tools.generateRoads(444));
        await time('autoSettle(2048)', 1000, () => Tools.autoSettle(6, 444));

        await time('TAM PIPELINE (kara+nehir+göl+biyom, 2048)', 2000, async () => {
          Tools.generateLandmass('continent', 0.5, 999, { withElevation: true });
          await Tools.generateRivers(4, 999);
          Tools.autoLakes(999);
          await Tools.autoBiome(999);
        });

        Layers.init(8192, 8192);
        History.clear();
        await time('generateLandmass(continent, 8192)', 1000, () =>
          Tools.generateLandmass('continent', 0.5, 555));
        Tools.generateLandmass('continent', 0.5, 555, { withElevation: true });
        await time('autoBiome(8192)', 1000, () => Tools.autoBiome(555));

        Layers.init(2048, 2048);
        History.clear();
        Tools.generateLandmass('continent', 0.5, 666);
        await time('layerAdd (custom)', 1000, () => Layers.addCustom('perf-test', 2048, 2048));
        await time('History.undo (layerAdd)', 1000, () => History.undo());
        await time('History.undo (landmass)', 1000, () => History.undo());
        await time('History.redo', 1000, () => History.redo());

        const testCanvas = document.createElement('canvas');
        testCanvas.width = 512; testCanvas.height = 512;
        const tctx = testCanvas.getContext('2d');
        tctx.fillStyle = '#1b4a63'; tctx.fillRect(0,0,512,512);
        tctx.fillStyle = '#c9a86a'; tctx.beginPath(); tctx.ellipse(256,256,180,140,0,0,Math.PI*2); tctx.fill();
        tctx.fillStyle = '#3d6ea5'; tctx.beginPath(); tctx.ellipse(200,220,30,20,0,0,Math.PI*2); tctx.fill();
        tctx.strokeStyle = '#3d6ea5'; tctx.lineWidth = 8;
        tctx.beginPath(); tctx.moveTo(260,150); tctx.quadraticCurveTo(300,220,270,320); tctx.stroke();
        tctx.fillStyle = '#8a2be2'; tctx.fillRect(220,240,14,14);

        Layers.init(2048, 2048);
        History.clear();
        const img = new Image();
        await new Promise(res => { img.onload = res; img.src = testCanvas.toDataURL(); });
        const refLayer = Layers.get('reference');
        refLayer.image = img;

        await time('scanReferenceImage (512px sentetik)', 2000, () =>
          Tools.scanReferenceImage({ onProgress: function(){}, token: {} }));

        console.log('__TIMINGS__' + JSON.stringify(timings));
        return timings.every(t => t.pass);
      } catch (e) {
        console.log('__ERROR__' + (e && e.stack || String(e)));
        return false;
      }
    })()`;

    const result = await evaluate(cdp, testCode, true);
    if (result.exceptionDetails) {
      console.error('HATA:', result.exceptionDetails.text, result.exceptionDetails.exception?.description || '');
      process.exit(1);
    }

    const timingLine = cdp.lines.find(l => l.startsWith('__TIMINGS__'));
    const errorLine = cdp.lines.find(l => l.startsWith('__ERROR__'));
    if (errorLine) { console.error('İç HATA:', errorLine.slice('__ERROR__'.length)); process.exit(1); }
    if (!timingLine) { console.error('Zamanlama verisi alınamadı.'); process.exit(1); }

    const timings = JSON.parse(timingLine.slice('__TIMINGS__'.length));
    console.log('\n========== PERFORMANS DENETİMİ ==========\n');
    let allPass = true;
    for (const t of timings) {
      const mark = t.pass ? '✓' : '✗';
      if (!t.pass) allPass = false;
      console.log(`  ${mark} ${t.name.padEnd(42)} ${String(t.ms).padStart(8)}ms  (bütçe: ${t.budgetMs}ms)`);
    }
    console.log('\n' + (allPass ? '✅ TÜM İŞLEMLER BÜTÇE İÇİNDE' : '❌ BAZI İŞLEMLER BÜTÇEYİ AŞTI') + '\n');
    process.exit(allPass ? 0 : 1);
  } catch (err) {
    console.error('KRİTİK HATA:', err.message || err);
    process.exit(1);
  }
}

run();
