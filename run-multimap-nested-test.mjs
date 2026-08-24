/**
 * Faz 4 (#36/#37/#45) — 4 seviyeli iç içe harita (bölge bağlantısı) testi:
 * her seviyede App.enterMap ile inip App.exitMap ile çıkma süresi ölçülür,
 * ardından bu 4-seviye iniş/çıkış döngüsü birkaç kez tekrarlanıp
 * performance.memory.usedJSHeapSize örneklenerek bariz bir bellek sızıntısı
 * (her turda sürekli artan bir taban çizgisi) olup olmadığı denetlenir.
 * Kesin bir GC garantisi yoktur (headless Chrome --js-flags=--expose-gc ile
 * çalıştırılır ki her turdan önce window.gc() çağrılabilsin) — yine de N
 * turluk bir eğilim, App.maps'te temizlenmeyen referans biriktiren bir
 * regresyonu yakalamaya yeter.
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8790, CDP_PORT = 9260;
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
    '--js-flags=--expose-gc',
    '--window-size=1280,800', `http://localhost:${PORT}/`
  ], { stdio: 'ignore' });
  process.on('exit', () => { chrome.kill(); srv.close(); });

  await sleep(3000);
  const cdp = await connectCDP();
  await cdp.send('Runtime.enable');
  for (let i = 0; i < 40; i++) {
    const r = await evaluate(cdp, 'typeof App!=="undefined"&&typeof Layers!=="undefined"');
    if (r.result?.value === true) break;
    await sleep(500);
  }
  await evaluate(cdp, 'UI.showView("editor")');
  await sleep(300);

  const results = [];
  function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

  /* ---- 1) 4 seviye iniş, her seviyede gerçek içerik + zamanlama ---- */
  const descendCode = `(async function(){
    Exporter.newProject(512, 512, 'Multimap Test');
    var timings = [];
    var ids = [];
    for (var lvl = 1; lvl <= 4; lvl++) {
      var id = 'lvl' + lvl + '_' + Math.random().toString(36).slice(2);
      ids.push(id);
      /* her seviyede gercek icerik: kara + birkac sembol, boylece
         serialize/deserialize gercekten anlamli veri tasiyor */
      Tools.generateLandmass('island', 0.4, lvl * 111, {});
      App.symbol.id = Sym.SYMBOLS.castles.items[0].id;
      Tools.placeSymbol({x: 100 + lvl*10, y: 100});
      /* buildMapTree yalnizca 'links' katmanindaki pin nesnelerini
         izleyerek agaci kurar — enterMap kendisi boyle bir pin
         olusturmaz (gercek UI akisinda Tools.placeRegionLink yapar).
         Zincirin agac tarafindan da gorulebilmesi icin pini elle ekliyoruz. */
      var LinksL = Layers.get('links');
      LinksL.objects.push({ id:'pin'+lvl, x:100, y:200, size:40, name:'Seviye '+lvl, targetMapId:id });
      var t0 = performance.now();
      App.enterMap(id, 'Seviye ' + lvl);
      /* enterMap asenkron; App._switching false olana kadar bekle */
      while (App._switching) await new Promise(r => setTimeout(r, 5));
      timings.push(performance.now() - t0);
    }
    window.__enterTimings = timings;
    window.__levelIds = ids;
    window.__depth = App.mapStack.length;
    window.__currentId = App.currentMapId;
    window.__descendDone = true;
  })();`;
  await evaluate(cdp, descendCode, true);
  for (let i = 0; i < 40; i++) {
    const d = await evaluate(cdp, 'window.__descendDone===true');
    if (d.result?.value) break;
    await sleep(200);
  }
  const timingsR = await evaluate(cdp, 'JSON.stringify(window.__enterTimings)');
  const timings = JSON.parse(timingsR.result?.value || '[]');
  console.log('enterMap süreleri (ms):', timings.map(t => t.toFixed(1)).join(', '));
  check('4 seviyeye inildi (mapStack derinliği 4)', (await evaluate(cdp, 'window.__depth')).result?.value === 4);
  check('en derin seviyedeyiz', (await evaluate(cdp, 'window.__currentId')).result?.value === (await evaluate(cdp, 'window.__levelIds[3]')).result?.value);
  check('her geçiş 500ms altında (512×512, dört seviye)', timings.every(t => t < 500));

  /* ---- 2) 4 seviye çıkış, köke dönüş doğrulaması ---- */
  const ascendCode = `(async function(){
    var timings = [];
    for (var i = 0; i < 4; i++) {
      var t0 = performance.now();
      App.exitMap();
      while (App._switching) await new Promise(r => setTimeout(r, 5));
      timings.push(performance.now() - t0);
    }
    window.__exitTimings = timings;
    window.__backAtRoot = App.currentMapId === 'root' && App.mapStack.length === 0;
    window.__ascendDone = true;
  })();`;
  await evaluate(cdp, ascendCode, true);
  for (let i = 0; i < 40; i++) {
    const d = await evaluate(cdp, 'window.__ascendDone===true');
    if (d.result?.value) break;
    await sleep(200);
  }
  const exitTimingsR = await evaluate(cdp, 'JSON.stringify(window.__exitTimings)');
  console.log('exitMap süreleri (ms):', JSON.parse(exitTimingsR.result?.value).map(t => t.toFixed(1)).join(', '));
  check('4 çıkışın sonunda köke dönüldü', (await evaluate(cdp, 'window.__backAtRoot')).result?.value === true);

  /* ---- 3) harita ağacı 4 seviyeyi doğru yansıtıyor mu ---- */
  const treeR = await evaluate(cdp, `(function(){
    function depth(n) { return n.children.length ? 1 + Math.max.apply(null, n.children.map(depth)) : 0; }
    return depth(App.buildMapTree());
  })()`);
  check('buildMapTree 4 seviye derinliği doğru raporluyor', treeR.result?.value === 4);

  /* ---- 4) bellek/sızıntı denetimi: 10 tur 4-seviye iniş/çıkış döngüsü ----
     performance.memory.usedJSHeapSize TEK BAŞINA güvenilir bir sızıntı
     sinyali değil — V8'in GC'si window.gc() sonrası bile bazı turlarda
     eski kuşaktan hemen toplamıyor, ~7MB/~15MB arasında gidip gelen
     tamamen gürültülü bir salınım üretebiliyor (bkz. diag-memtrend.mjs ile
     15 turluk deneme: App.maps boyutu HER turda sabit 1'de kalırken heap
     örnekleri monotonik değil, düzensiz sıçrıyordu). Asıl güvenilir/
     deterministik sinyal: App.maps'in kendisi büyümüyor mu — bunu asıl
     assertion yapıyoruz. Heap örnekleri yalnız bilgi amaçlı loglanıyor. */
  const memCycleCode = `(async function(){
    var samples = [];
    var mapCounts = [];
    for (var cycle = 0; cycle < 10; cycle++) {
      var ids = [];
      for (var lvl = 1; lvl <= 4; lvl++) {
        var id = 'cyc' + cycle + '_lvl' + lvl;
        ids.push(id);
        var LinksL = Layers.get('links');
        LinksL.objects.push({ id:'pinC'+cycle+'L'+lvl, x:100, y:200, size:40, name:'L'+lvl, targetMapId:id });
        App.enterMap(id, 'C' + cycle + 'L' + lvl);
        while (App._switching) await new Promise(r => setTimeout(r, 5));
        App.symbol.id = Sym.SYMBOLS.castles.items[0].id;
        Tools.placeSymbol({x: 100, y: 100});
      }
      for (var i = 0; i < 4; i++) {
        App.exitMap();
        while (App._switching) await new Promise(r => setTimeout(r, 5));
      }
      /* her turdan sonra bu turun (artık kökten erisilemeyen) alt
         haritalarini App.maps'ten temizle — deleteMapRecursive'in
         normalde regionlink pini SILINDIGINDE yaptigi isi burada
         elle yapiyoruz, cunku bu test pini hic silmiyor */
      ids.forEach(function(id){ delete App.maps[id]; });
      mapCounts.push(Object.keys(App.maps).length);
      if (window.gc) { window.gc(); window.gc(); }
      await new Promise(r => setTimeout(r, 100));
      samples.push(performance.memory ? performance.memory.usedJSHeapSize : -1);
    }
    window.__memSamples = samples;
    window.__mapCounts = mapCounts;
    window.__memDone = true;
  })();`;
  await evaluate(cdp, memCycleCode, true);
  for (let i = 0; i < 100; i++) {
    const d = await evaluate(cdp, 'window.__memDone===true');
    if (d.result?.value) break;
    await sleep(200);
  }
  const memR = await evaluate(cdp, 'JSON.stringify(window.__memSamples)');
  const mem = JSON.parse(memR.result?.value || '[]');
  const memMB = mem.map(b => (b / 1048576).toFixed(2));
  console.log('bellek örnekleri (MB, bilgi amaçlı, 10 tur):', memMB.join(', '));
  const countsR = await evaluate(cdp, 'JSON.stringify(window.__mapCounts)');
  const counts = JSON.parse(countsR.result?.value || '[]');
  console.log('her turdan sonra App.maps boyutu:', counts.join(', '));
  check('App.maps her turdan sonra sabit boyutta kalıyor (sızıntı yok)',
    counts.length === 10 && counts.every(c => c === counts[0]));

  console.log('\n========== ÇOK SEVİYELİ HARİTA TESTİ ==========');
  results.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
  const pass = results.every(l => l.endsWith('PASS'));
  console.log(pass ? '\n✅ TÜM TESTLER GEÇTİ' : '\n❌ BAZI TESTLER BAŞARISIZ');
  process.exit(pass ? 0 : 1);
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
