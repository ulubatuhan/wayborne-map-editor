/**
 * GeoJSON (GIS) dışa aktarımı doğrulaması: Exporter.geojsonData() çıktısının
 * geçerli bir FeatureCollection olduğunu, her vektör katmanının doğru geometri
 * tipine çevrildiğini (nehir/yol → LineString, göl/bölge → kapalı Polygon,
 * sembol/kaynak/etiket/bağlantı → Point) ve devlet/nüfus meta verisinin
 * properties'e taşındığını doğrular.
 * Diğer test runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8862, CDP_PORT = 9322;
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
      const r = await evaluate(cdp, 'typeof Exporter!=="undefined"&&typeof Tools!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    const testCode = `(async function () {
      var results = [];
      function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

      /* boş projede dışa aktarım hata vermemeli */
      Layers.init(2048, 2048); Cv.setSize(2048, 2048, false); History.clear();
      var empty = Exporter.geojsonData();
      check('boş projede geçerli FeatureCollection', empty.type === 'FeatureCollection' && empty.features.length === 0);
      check('boş projede geojson() 0 döndürür ve çökmez', Exporter.geojson() === 0);

      /* zengin bir harita kur */
      Tools.generateLandmass('continent', 0.5, 42, { withElevation:true });
      Cv.render();
      await Tools.generateRivers(3, 42);
      Tools.autoLakes(42);
      Tools.generateRoads(42);
      Tools.autoSettle(5, 42);
      Tools.generateStates(4, 0.35, 42);
      Tools.generateCultures(3, 42);
      Layers.get('resources').objects.push({ id:'r1', x:500, y:500, type:'mine', size:36 });
      Layers.get('labels').objects.push({ id:'l1', x:600, y:600, text:'Test Etiketi', preset:'region' });
      Layers.get('links').objects.push({ id:'k1', x:700, y:700, name:'Alt Harita', targetMapId:'m1' });

      var g = Exporter.geojsonData();
      check('FeatureCollection tipi doğru', g.type === 'FeatureCollection');
      check('feature üretildi', g.features.length > 0);
      check('canvas boyutu bildiriliyor', g.canvas.width === 2048 && g.canvas.height === 2048);
      check('crs açıkça piksel uzayı olarak işaretli', /canvas-pixels/.test(g.crs.properties.name));
      check('y ekseni yönü belgeleniyor', g.canvas.yAxis === 'down');

      function byLayer(l) { return g.features.filter(function (f) { return f.properties.layer === l; }); }

      /* --- geometri tipleri --- */
      var rivers = byLayer('rivers');
      var riverLines = rivers.filter(function (f) { return f.properties.kind === 'river'; });
      var lakePolys = rivers.filter(function (f) { return f.properties.kind === 'lake'; });
      check('nehirler LineString', riverLines.length > 0 && riverLines.every(function (f) { return f.geometry.type === 'LineString'; }));
      check('göller Polygon', lakePolys.length > 0 && lakePolys.every(function (f) { return f.geometry.type === 'Polygon'; }));

      var roads = byLayer('roads');
      check('yollar LineString', roads.length > 0 && roads.every(function (f) { return f.geometry.type === 'LineString'; }));

      var terr = byLayer('territories');
      check('bölgeler Polygon', terr.length > 0 && terr.every(function (f) { return f.geometry.type === 'Polygon'; }));

      var syms = byLayer('symbols');
      check('semboller Point', syms.length > 0 && syms.every(function (f) { return f.geometry.type === 'Point'; }));
      check('kaynak Point olarak çıktı', byLayer('resources').length === 1);
      check('etiket metniyle çıktı', byLayer('labels').length === 1 && byLayer('labels')[0].properties.text === 'Test Etiketi');
      check('harita bağlantısı hedefiyle çıktı', byLayer('links').length === 1 && byLayer('links')[0].properties.target === 'm1');

      /* --- GeoJSON Polygon halkaları KAPALI olmalı --- */
      var allClosed = terr.concat(lakePolys).every(function (f) {
        var r = f.geometry.coordinates[0];
        return r.length >= 4 && r[0][0] === r[r.length-1][0] && r[0][1] === r[r.length-1][1];
      });
      check('tüm Polygon halkaları kapalı (ilk nokta = son nokta)', allClosed);

      /* --- meta veri taşınıyor mu --- */
      var states = terr.filter(function (f) { return f.properties.kind === 'state'; });
      check('devletler kind:state ile çıktı', states.length > 0);
      check('devlet hükümet biçimi properties de', states.every(function (f) { return !!f.properties.government; }));
      check('devlet başkent koordinatı properties de', states.every(function (f) {
        return typeof f.properties.capital_x === 'number' && typeof f.properties.capital_y === 'number';
      }));
      var cultures = terr.filter(function (f) { return f.properties.kind === 'culture'; });
      check('kültür bölgeleri kind:culture ile çıktı', cultures.length > 0);
      check('yerleşimlerde nüfus taşınıyor', syms.some(function (f) { return typeof f.properties.population === 'number' && f.properties.population > 0; }));

      /* --- koordinatlar tuval sınırları içinde ve sayısal --- */
      var coordsOk = true;
      g.features.forEach(function (f) {
        var cs = f.geometry.type === 'Point' ? [f.geometry.coordinates]
               : f.geometry.type === 'LineString' ? f.geometry.coordinates
               : f.geometry.coordinates[0];
        cs.forEach(function (c) {
          if (typeof c[0] !== 'number' || typeof c[1] !== 'number' || !isFinite(c[0]) || !isFinite(c[1])) coordsOk = false;
        });
      });
      check('tüm koordinatlar sonlu sayı', coordsOk);

      /* --- JSON olarak serileştirilebilir (döngüsel referans yok) --- */
      var serialized = null, serOk = true;
      try { serialized = JSON.stringify(g); } catch (e) { serOk = false; }
      check('JSON.stringify ile serileştirilebiliyor', serOk && serialized.length > 100);
      check('geri okunduğunda aynı feature sayısı', JSON.parse(serialized).features.length === g.features.length);

      /* --- sembol grubu bir konum değildir, atlanmalı --- */
      var Sy = Layers.get('symbols');
      var beforeCount = byLayer('symbols').length;
      Sy.objects.push({ id:'grp', kind:'group', members:[{sym:'ik_knight', x:10, y:10, size:40}] });
      check('sembol grubu Point olarak yazılmıyor', Exporter.geojsonData().features.filter(function (f) {
        return f.properties.layer === 'symbols';
      }).length === beforeCount);

      return results.join('\\n');
    })()`;

    const result = await evaluate(cdp, testCode, true);
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
