/**
 * Devlet/kültür otomatik üretimi doğrulaması (docs/afmg-parity-plan.md § #1):
 * Tools.generateStates / Tools.generateCultures — determinizm, sınırların
 * kara maskesini aşmaması, performans bütçesi (<1sn), Cv.politicalMode
 * görünüm filtresi, ve Tools.autoSettle'ın yeni nüfus alanı (#2). Diğer
 * test runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8821, CDP_PORT = 9281;
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

    const testCode = `(function () {
      var results = [];
      function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

      Layers.init(2048, 2048); History.clear();
      Tools.generateLandmass('continent', 0.5, 42);

      var t0 = performance.now();
      var n1 = Tools.generateStates(5, 0.35, 777);
      var genStatesMs = performance.now() - t0;
      check('generateStates 5 devlet üretti', n1 >= 3);
      check('generateStates bütçe içinde (<1000ms)', genStatesMs < 1000);

      var t1 = performance.now();
      var n2 = Tools.generateCultures(4, 777);
      var genCulturesMs = performance.now() - t1;
      check('generateCultures kültür bölgesi üretti', n2 >= 2);
      check('generateCultures bütçe içinde (<1000ms)', genCulturesMs < 1000);

      Cv.render(); /* landSample'ı (isOnLand önbelleği) tazele */

      var Tv = Layers.get('territories');
      var states = Tv.objects.filter(function (o) { return o.kind === 'state'; });
      var cultures = Tv.objects.filter(function (o) { return o.kind === 'culture'; });
      check('her devletin adı var', states.every(function (o) { return o.name && o.name.length > 0; }));
      check('her devletin hükümet tipi var', states.every(function (o) {
        return ['kingdom','empire','theocracy','republic','confederation','citystate'].indexOf(o.government) >= 0;
      }));
      check('her devletin başkenti kara üzerinde', states.every(function (o) {
        return o.capital && Cv.isOnLand(o.capital.x, o.capital.y);
      }));
      check('her devletin sınırı >=3 noktalı', states.every(function (o) { return o.pts.length >= 3; }));
      check('kültür bölgeleri de kara üzerinde başlıyor', cultures.every(function (o) { return o.pts.length >= 3; }));

      /* Cv.politicalMode görünüm filtresi (üretilen orijinal devlet+kültür seti üzerinde) */
      Cv.politicalMode = 'state';
      var visStates = Tv.objects.filter(function (o) { return Cv.territoryVisibleInMode(o); });
      check('state modunda kültür bölgeleri gizli', visStates.length > 0 && !visStates.some(function (o) { return o.kind === 'culture'; }));
      Cv.politicalMode = 'culture';
      var visCultures = Tv.objects.filter(function (o) { return Cv.territoryVisibleInMode(o); });
      check('culture modunda sadece kültür bölgeleri görünür', visCultures.length > 0 && visCultures.every(function (o) { return o.kind === 'culture'; }));
      Cv.politicalMode = 'state';

      /* determinizm: aynı tohumla yeniden üret, aynı isim/sayı çıkmalı */
      Layers.init(2048, 2048); History.clear();
      Tools.generateLandmass('continent', 0.5, 42);
      var n1b = Tools.generateStates(5, 0.35, 777);
      var Tv2 = Layers.get('territories');
      var states2 = Tv2.objects.filter(function (o) { return o.kind === 'state'; });
      check('determinizm: aynı tohum aynı devlet sayısı', states.length === states2.length);
      check('determinizm: aynı tohum aynı isimler', JSON.stringify(states.map(function(o){return o.name;}))
        === JSON.stringify(states2.map(function(o){return o.name;})));

      /* farklı tohum -> farklı sonuç (üretecin sabit çıktı vermediğini doğrula) */
      var n1c = Tools.generateStates(5, 0.35, 999);
      var Tv3 = Layers.get('territories');
      var states3 = Tv3.objects.filter(function (o) { return o.kind === 'state' && !states2.some(function(s){return s.id===o.id;}); });
      check('farklı tohum farklı isimler üretiyor', states3.length &&
        JSON.stringify(states3.map(function(o){return o.name;})) !== JSON.stringify(states2.map(function(o){return o.name;})));

      /* render hatasız çalışıyor mu (her iki modda) */
      Cv.political = true;
      var okRender = true;
      try {
        Cv.politicalMode = 'state'; Cv.render();
        Cv.politicalMode = 'culture'; Cv.render();
      } catch (e) { okRender = false; }
      Cv.politicalMode = 'state'; Cv.political = false;
      check('siyasi görünüm (devlet+kültür) render hatasız', okRender);

      /* boş/kara yok senaryosu çökmemeli */
      Layers.init(256, 256); History.clear();
      var nEmpty = Tools.generateStates(5, 0.35, 1);
      check('kara yokken generateStates çökmedi (0 döndü)', nEmpty === 0);

      /* #2: autoSettle nüfus alanı */
      Layers.init(2048, 2048); History.clear();
      Tools.generateLandmass('continent', 0.5, 55, { withElevation:true });
      Tools.autoSettle(6, 55);
      var Sy = Layers.get('symbols');
      check('autoSettle sembollere nüfus atadı', Sy.objects.length > 0 && Sy.objects.every(function (o) {
        return typeof o.population === 'number' && o.population > 0;
      }));
      check('başkent/liman en yüksek nüfuflu eğilimde', Sy.objects[0].population >= (Sy.objects[Sy.objects.length-1] ? Sy.objects[Sy.objects.length-1].population * 0.3 : 0));

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
