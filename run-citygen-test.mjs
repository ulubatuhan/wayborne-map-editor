/**
 * Şehir üretimi doğrulaması (docs/city-generation-plan.md, Faz A-E):
 * Tools.generateCity — blok/parsel bölme, bina yerleştirme, sokak
 * hiyerarşisi, sur/kapı, determinizm, tek adımlık atomik undo, ve
 * Faz E ölçek doğrulaması (80-250 bina + o yoğunlukta render bütçesi).
 * Diğer test runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8865, CDP_PORT = 9325;
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
    let id = 0; const pending = {}; const errs = [];
    ws.addEventListener('message', ({ data: d }) => {
      const m = JSON.parse(d);
      if (!m.id && m.method === 'Runtime.exceptionThrown') {
        errs.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || ''));
      }
      if (m.id && pending[m.id]) { pending[m.id](m.result ?? m.error); delete pending[m.id]; }
    });
    ws.addEventListener('open', () => res({
      send: (method, params={}) => new Promise((r2,e2) => {
        const cid = ++id;
        pending[cid] = v => v && v.code ? e2(new Error(JSON.stringify(v))) : r2(v);
        ws.send(JSON.stringify({id:cid, method, params}));
      }), errs
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
      const r = await evaluate(cdp, 'typeof Tools!=="undefined"&&typeof Geo!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    const testCode = `(async function () {
      var results = [];
      function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

      function boundary(cx, cy, R, lobes) {
        var b = [];
        for (var i = 0; i < 14; i++) {
          var a = i/14*Math.PI*2;
          var rr = R * (lobes ? (0.8 + 0.35*Math.abs(Math.sin(i*2.3))) : 1);
          b.push([cx + Math.cos(a)*rr, cy + Math.sin(a)*rr]);
        }
        return b;
      }

      /* ---------- geometri yardımcıları ---------- */
      var sq = [[0,0],[100,0],[100,100],[0,100]];
      var obb = Geo.polygonOBB(sq);
      check('polygonOBB kare için ~100x100', Math.abs(obb.w-100) < 6 && Math.abs(obb.h-100) < 6);
      var half = Geo.clipHalfPlane(sq, 50, 50, 1, 0);
      check('clipHalfPlane kareyi ikiye böldü', Math.abs(Geo.polygonArea(half) - 5000) < 1);
      var seg = Geo.lineThroughPolygon(sq, 50, 50, 0, 1);
      check('lineThroughPolygon dikey kesit buldu', !!seg && Math.abs(seg[1][1]-seg[0][1]) > 90);
      var ins = Geo.insetPolygon(sq, 10);
      check('insetPolygon alanı küçülttü', Geo.polygonArea(ins) < Geo.polygonArea(sq));
      check('insetPolygon çok küçük çokgende null', Geo.insetPolygon([[0,0],[6,0],[6,6],[0,6]], 20) === null);

      /* ---------- şehir üretimi ---------- */
      Layers.init(2048, 2048); Cv.setSize(2048, 2048, false); History.clear();
      Tools.generateLandmass('continent', 0.5, 9); Cv.render();
      var bd = boundary(1024, 1024, 420, true);

      var symBefore = Layers.get('symbols').objects.length;
      var roadBefore = Layers.get('roads').objects.length;
      var histBefore = History.stack.length;

      var t0 = performance.now();
      var n = Tools.generateCity(bd, { district:'craftsmen', buildings:140, streetWidth:7, wall:true, gates:2, seed:777 });
      var genMs = performance.now() - t0;

      check('şehir üretildi', n > 0);
      /* Faz E hedefi: tek üretimde 80-250 bina */
      check('bina sayısı hedef aralıkta (80-250)', n >= 80 && n <= 250);
      check('üretim bütçe içinde (<1000ms)', genMs < 1000);

      var syms = Layers.get('symbols').objects;
      var roads = Layers.get('roads').objects;
      check('sokaklar yol katmanına yazıldı', roads.length - roadBefore > 10);

      /* sokak hiyerarşisi: ana cadde kalın, ara sokak ince */
      var widths = {};
      for (var i = roadBefore; i < roads.length; i++) widths[roads[i].width] = 1;
      check('en az iki farklı sokak genişliği (hiyerarşi)', Object.keys(widths).length >= 2);

      /* binalar sınır içinde (sur sembolleri hariç: onlar sınırın üstünde) */
      var inside = 0, outside = 0;
      for (var k = symBefore; k < syms.length; k++) {
        var s = syms[k];
        if (Geo.pointInPolygon(s.x, s.y, bd)) inside++;
        else { outside++; }
      }
      check('binaların büyük çoğunluğu sınır içinde', inside > (inside+outside) * 0.85);

      /* İzometri korunmalı: bina dönüşleri 90'ın katı olmalı. Ölçüm
         SURSUZ bir üretimde yapılır — sur/kule sembolleri sınır çizgisi
         boyunca serbest açıyla yerleşir (duvarın yönünü izlemeleri
         gerekir) ve bazıları tam sınır üstünde olduğu için nokta-içinde
         testiyle güvenilir şekilde ayıklanamaz. */
      Layers.init(2048, 2048); Cv.setSize(2048, 2048, false); History.clear();
      Tools.generateLandmass('continent', 0.5, 9); Cv.render();
      Tools.generateCity(bd, { district:'craftsmen', buildings:140, streetWidth:7, wall:false, seed:777 });
      var onlyBuildings = Layers.get('symbols').objects;
      var buildingRots = {}, badRot = 0;
      for (var k2 = 0; k2 < onlyBuildings.length; k2++) {
        var r = onlyBuildings[k2].rot;
        if (Math.abs(r % 90) > 0.001) badRot++;
        buildingRots[r] = 1;
      }
      check('bina dönüşleri 90 nin katı (izometri bozulmuyor)', onlyBuildings.length > 0 && badRot === 0);
      check('sokak yönüne göre birden fazla dönüş kullanılıyor', Object.keys(buildingRots).length >= 2);
      check('sursuz üretimde tüm binalar sınır içinde', onlyBuildings.every(function (o) {
        return Geo.pointInPolygon(o.x, o.y, bd);
      }));

      /* sur/kapı testleri için asıl (surlu) üretime geri dön */
      Layers.init(2048, 2048); Cv.setSize(2048, 2048, false); History.clear();
      Tools.generateLandmass('continent', 0.5, 9); Cv.render();
      symBefore = 0; roadBefore = 0; histBefore = History.stack.length;
      n = Tools.generateCity(bd, { district:'craftsmen', buildings:140, streetWidth:7, wall:true, gates:2, seed:777 });
      syms = Layers.get('symbols').objects;
      outside = 0;
      for (var k3 = 0; k3 < syms.length; k3++) if (!Geo.pointInPolygon(syms[k3].x, syms[k3].y, bd)) outside++;

      /* sur/kapı: sınır dışına/üstüne sembol kondu */
      check('sur ve kapı sembolleri yerleştirildi', outside > 0);

      /* tek atomik History adımı */
      check('tek History adımı üretti', History.stack.length - histBefore === 1);

      /* undo şehri TAMAMEN kaldırmalı */
      await History.undo();
      check('undo tüm binaları kaldırdı', Layers.get('symbols').objects.length === symBefore);
      check('undo tüm sokakları kaldırdı', Layers.get('roads').objects.length === roadBefore);
      await History.redo();
      check('redo şehri geri getirdi', Layers.get('symbols').objects.length === syms.length);

      /* determinizm: aynı tohum aynı sonuç */
      Layers.init(2048, 2048); Cv.setSize(2048, 2048, false); History.clear();
      Tools.generateLandmass('continent', 0.5, 9); Cv.render();
      var nA = Tools.generateCity(bd, { district:'craftsmen', buildings:140, streetWidth:7, wall:true, gates:2, seed:777 });
      var sigA = Layers.get('symbols').objects.map(function (o) { return o.sym + '@' + Math.round(o.x) + ',' + Math.round(o.y); }).join('|');
      Layers.init(2048, 2048); Cv.setSize(2048, 2048, false); History.clear();
      Tools.generateLandmass('continent', 0.5, 9); Cv.render();
      var nB = Tools.generateCity(bd, { district:'craftsmen', buildings:140, streetWidth:7, wall:true, gates:2, seed:777 });
      var sigB = Layers.get('symbols').objects.map(function (o) { return o.sym + '@' + Math.round(o.x) + ',' + Math.round(o.y); }).join('|');
      check('determinizm: aynı tohum aynı bina sayısı', nA === nB);
      check('determinizm: aynı tohum aynı yerleşim', sigA === sigB);

      /* farklı tohum farklı sonuç */
      Layers.init(2048, 2048); Cv.setSize(2048, 2048, false); History.clear();
      Tools.generateLandmass('continent', 0.5, 9); Cv.render();
      Tools.generateCity(bd, { district:'craftsmen', buildings:140, streetWidth:7, wall:true, gates:2, seed:31337 });
      var sigC = Layers.get('symbols').objects.map(function (o) { return o.sym + '@' + Math.round(o.x) + ',' + Math.round(o.y); }).join('|');
      check('farklı tohum farklı yerleşim', sigC !== sigA);

      /* district tipi bina havuzunu değiştirmeli */
      Layers.init(2048, 2048); Cv.setSize(2048, 2048, false); History.clear();
      Tools.generateLandmass('continent', 0.5, 9); Cv.render();
      Tools.generateCity(bd, { district:'noble', buildings:120, seed:777 });
      var nobleSyms = Layers.get('symbols').objects.map(function (o) { return o.sym; });
      Layers.init(2048, 2048); Cv.setSize(2048, 2048, false); History.clear();
      Tools.generateLandmass('continent', 0.5, 9); Cv.render();
      Tools.generateCity(bd, { district:'slum', buildings:120, seed:777 });
      var slumSyms = Layers.get('symbols').objects.map(function (o) { return o.sym; });
      check('district tipi bina seçimini değiştiriyor', nobleSyms.join(',') !== slumSyms.join(','));

      /* --- sınır durumları: çökmemeli --- */
      Layers.init(2048, 2048); History.clear();
      check('çok küçük alan reddediliyor', Tools.generateCity(boundary(200,200,20,false), { seed:1 }) === 0);
      check('geçersiz sınır reddediliyor', Tools.generateCity([[10,10],[20,20]], { seed:1 }) === 0);
      check('boş sınır reddediliyor', Tools.generateCity(null, { seed:1 }) === 0);

      /* --- Faz E: 200+ sembolle render bütçesi --- */
      Layers.init(2048, 2048); Cv.setSize(2048, 2048, false); History.clear();
      Tools.generateLandmass('continent', 0.5, 9); Cv.render();
      Tools.generateCity(bd, { district:'craftsmen', buildings:240, streetWidth:6, wall:true, seed:5 });
      var symCount = Layers.get('symbols').objects.length;
      Cv.render();  /* ilk render önbellekleri kursun */
      var rt = [];
      for (var f = 0; f < 8; f++) { var s0 = performance.now(); Cv.render(); rt.push(performance.now()-s0); }
      rt.sort(function (a,b) { return a-b; });
      var median = rt[Math.floor(rt.length/2)];
      results.push('__INFO__' + JSON.stringify({ buildings:n, genMs:Math.round(genMs), symCount:symCount, renderMedian:Math.round(median*10)/10 }));
      check('yoğun şehirde render bütçe içinde (<16.67ms)', median < 16.67);

      return results.join('\\n');
    })()`;

    const result = await evaluate(cdp, testCode, true);
    const lines = (result.result?.value || '').split('\n').filter(Boolean);
    let allPass = true;
    for (const line of lines) {
      if (line.startsWith('__INFO__')) {
        const p = JSON.parse(line.slice(8));
        console.log(`  · ${p.buildings} bina · üretim ${p.genMs}ms · ${p.symCount} sembolle render medyanı ${p.renderMedian}ms`);
        continue;
      }
      const ok = line.includes(': PASS');
      if (!ok) allPass = false;
      console.log((ok ? '  ✓ ' : '  ✗ ') + line);
    }
    if (cdp.errs.length) { console.error('\n[konsol hataları]', cdp.errs); allPass = false; }
    console.log('\n' + (allPass && lines.length ? '✅ TÜM TESTLER GEÇTİ' : '❌ BAZI TESTLER BAŞARISIZ'));
    process.exit(allPass && lines.length ? 0 : 1);
  } catch (err) {
    console.error('KRİTİK HATA:', err.message || err);
    process.exit(1);
  }
}

run();
