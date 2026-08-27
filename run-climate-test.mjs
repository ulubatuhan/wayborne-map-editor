/**
 * İklim modeli doğrulaması (docs/afmg-parity-plan.md § #5):
 * ekvator konumu + yarımküre + rüzgâr/yağış gölgesinin autoBiome'a
 * etkisi, Tools.windDirAt bant sınırları, Cv.buildWindArrows önbelleğinin
 * dirty-flag davranışı (Kural B) ve perf bütçesi. Diğer test runner'larla
 * aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8791, CDP_PORT = 9291;
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
      const r = await evaluate(cdp, 'typeof Tools!=="undefined"&&typeof Layers!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    const testCode = `(async function () {
      var results = [];
      function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

      /* ---- 1. Rüzgâr bantları (Tools.windDirAt) ---- */
      check('ekvatorda alizeler doğudan eser', Tools.windDirAt(0.00).x === -1 && Tools.windDirAt(0.10).x === -1);
      check('orta enlemlerde batı rüzgârları', Tools.windDirAt(0.25).x === 1 && Tools.windDirAt(-0.25).x === 1);
      check('kutupta yine doğulu', Tools.windDirAt(0.45).x === -1 && Tools.windDirAt(-0.45).x === -1);
      check('bantlar ekvatora göre x-simetrik',
        [0.05, 0.2, 0.3, 0.4, 0.49].every(function (v) { return Tools.windDirAt(v).x === Tools.windDirAt(-v).x; }));
      /* Meridyen bileşen: alizeler/kutup doğulusu ekvatora, batı
         rüzgârları kutba doğru meyleder — dolayısıyla y bileşeni
         ekvatorun iki yanında ters işaretli olmalı. */
      check('meridyen bileşen ekvatorun iki yanında ters',
        Tools.windDirAt(0.10).y === -Tools.windDirAt(-0.10).y &&
        Tools.windDirAt(0.25).y === -Tools.windDirAt(-0.25).y);
      check('alizeler ekvatora, batı rüzgârları kutba doğru',
        Tools.windDirAt(0.10).y < 0 && Tools.windDirAt(0.25).y > 0);

      /* ---- kurulum: biyom çağrı günlüğü ---- */
      var W = 1024;
      Layers.init(W, W); Cv.setSize(W, W); History.clear();

      var log = null, origScatter = Terrain.scatter;
      function startLog() { log = []; Terrain.scatter = function (ctx, b, cx, cy, r, a, s) {
        log.push(b + '@' + Math.round(cx) + ',' + Math.round(cy));
        return origScatter.apply(Terrain, arguments); }; }
      function stopLog() { Terrain.scatter = origScatter; var l = log; log = null; return l; }

      Tools.generateLandmass('continent', 0.55, 20260827, { withElevation:true });
      await new Promise(function (r) { setTimeout(r, 60); });

      async function biomeLog(climate, seed) {
        App.climate = climate;
        startLog();
        await Tools.autoBiome(seed);
        return stopLog();
      }

      var NEUTRAL_OFF = { on:false, equator:0.5, strength:0.6 };
      var NEUTRAL_ON  = { on:true,  equator:0.5, strength:0.0 };

      /* ---- 2. Kapalıyken davranış değişmiyor ---- */
      var logOff  = await biomeLog(NEUTRAL_OFF, 777);
      var logNeut = await biomeLog(NEUTRAL_ON,  777);
      check('biyom yerleşimi boş değil', logOff.length > 100);
      check('iklim kapalı ≡ ekvator ortada + etki 0 (geriye uyum)',
        logOff.join('|') === logNeut.join('|'));

      /* ---- 3. Determinizm ---- */
      var CLI_A = { on:true, equator:0.5, strength:0.85 };
      var logA1 = await biomeLog(CLI_A, 777);
      var logA2 = await biomeLog({ on:true, equator:0.5, strength:0.85 }, 777);
      check('iklim açıkken aynı tohum → aynı biyom yerleşimi', logA1.join('|') === logA2.join('|'));
      check('rüzgâr çarpanı biyom yerleşimini gerçekten değiştiriyor',
        logA1.join('|') !== logOff.join('|'));

      /* ---- 4. Ekvator kaydırma ---- */
      var logEq = await biomeLog({ on:true, equator:0.15, strength:0.0 }, 777);
      check('ekvator kaydırınca biyom kuşakları kayıyor', logEq.join('|') !== logOff.join('|'));
      /* Ekvator yukarı kaydığında sıcak biyomlar da yukarı taşınmalı:
         üst yarıdaki "sıcak" hücre oranı artmalı. */
      var HOT = ['desert','savanna','marsh','swamp','grassland'];
      function hotFracTop(l) {
        var top = 0, topHot = 0;
        l.forEach(function (e) {
          var parts = e.split('@'), xy = parts[1].split(',');
          if (+xy[1] < W/2) { top++; if (HOT.indexOf(parts[0]) >= 0) topHot++; }
        });
        return top ? topHot/top : 0;
      }
      check('ekvator yukarıda → üst yarı daha sıcak', hotFracTop(logEq) > hotFracTop(logOff) + 0.05);

      /* ---- 6. Yağış gölgesi yönlü mü? ----
         Dikey bir sırt çizip iki yanındaki kuruluğu karşılaştırıyoruz.
         Bantlar dönüşümlü olduğu için (kutup+alize doğulu, orta enlem
         batılı) haritanın çoğunluğu doğudan rüzgâr alır — dolayısıyla
         sırtın BATI yüzü net biçimde daha kurak çıkmalı. */
      Layers.init(W, W); Cv.setSize(W, W); History.clear();
      var Lm = Layers.get('landmass'), Ev = Layers.get('elevation');
      Lm.ctx.fillStyle = '#6b5a3e'; Lm.ctx.fillRect(0, 0, W, W);
      Ev.ctx.fillStyle = 'rgb(128,128,128)'; Ev.ctx.fillRect(0, 0, W, W);
      Ev.ctx.fillStyle = 'rgb(250,250,250)'; Ev.ctx.fillRect(W/2 - 40, 0, 80, W);
      Cv.shoreDirty = true; Cv.elevationDirty = true;

      var DRY = ['desert','badlands','shrubland','savanna','tundra','steppe'];
      function drySides(l) {
        var wN = 0, wD = 0, eN = 0, eD = 0;
        l.forEach(function (e) {
          var parts = e.split('@'), xy = parts[1].split(',');
          var x = +xy[0], dry = DRY.indexOf(parts[0]) >= 0;
          if (x > W/2 - 260 && x < W/2 - 60) { wN++; if (dry) wD++; }
          if (x > W/2 + 60 && x < W/2 + 260) { eN++; if (dry) eD++; }
        });
        return { w: wN ? wD/wN : 0, e: eN ? eD/eN : 0 };
      }
      var sideOff = drySides(await biomeLog(NEUTRAL_OFF, 4242));
      var sideOn  = drySides(await biomeLog({ on:true, equator:0.5, strength:1 }, 4242));
      check('yağış gölgesi sırtın batı yüzünü kurutuyor', sideOn.w > sideOff.w);
      check('kuruma yönlü (batı > doğu)', (sideOn.w - sideOn.e) > (sideOff.w - sideOff.e));

      /* ---- 7. Rüzgâr okları önbelleği (Kural B) ---- */
      App.climate = { on:true, equator:0.5, strength:0.6 };
      Cv.windArrows = true; Cv.windDirty = true; Cv.windCanvas = null;
      var wc1 = Cv.buildWindArrows();
      check('rüzgâr okları önbelleği üretildi', !!wc1 && wc1.width === Cv.W);
      check('üretimden sonra dirty temizlendi', Cv.windDirty === false);
      function windData() {
        var c = document.createElement('canvas'); c.width = 200; c.height = 200;
        c.getContext('2d').drawImage(Cv.windCanvas, 0, 0, 200, 200);
        return c.toDataURL();
      }
      var d1 = windData();
      Cv.buildWindArrows();
      check('parametre değişmeyince aynı çıktı', windData() === d1);
      App.climate.equator = 0.2; Cv.windDirty = true;
      Cv.buildWindArrows();
      check('ekvator değişince oklar yenileniyor', windData() !== d1);

      /* ---- 8. Perf bütçesi ---- */
      Layers.init(2048, 2048); Cv.setSize(2048, 2048); History.clear();
      Tools.generateLandmass('continent', 0.5, 99, { withElevation:true });
      await new Promise(function (r) { setTimeout(r, 60); });
      App.climate = { on:true, equator:0.5, strength:0.85 };
      var tb = performance.now();
      await Tools.autoBiome(99);
      var biomeMs = performance.now() - tb;
      check('autoBiome + iklim bütçe içinde (<1000ms) — ' + Math.round(biomeMs) + 'ms', biomeMs < 1000);
      var tw = performance.now();
      Cv.windDirty = true; Cv.buildWindArrows();
      var windMs = performance.now() - tw;
      check('rüzgâr okları önbelleği ucuz (<100ms) — ' + Math.round(windMs) + 'ms', windMs < 100);

      return results.join('\\n');
    })()`;

    const result = await evaluate(cdp, testCode, true);
    if (result.exceptionDetails) console.error('EVAL HATASI:', JSON.stringify(result.exceptionDetails).slice(0, 1200));
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
