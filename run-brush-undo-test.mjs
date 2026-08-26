/**
 * Fırça darbesi undo/redo piksel doğruluğu — tembel "önce" anlık
 * görüntüsü (Tools._ensureBefore) refactor'ünün doğruluk kanıtı.
 *
 * Eski davranış darbe başında TÜM katmanı kopyalıyordu; artık yalnızca
 * kirletilen bölge, boyanmadan hemen önce, artımlı olarak saklanıyor.
 * Bu testin görevi: undo'nun darbeden ÖNCEKİ pikselleri birebir geri
 * getirdiğini ve redo'nun darbeyi birebir geri koyduğunu doğrulamak —
 * özellikle darbe büyüdükçe yamanın genişlediği (union) durumda ve
 * silginin iki katmana birden dokunduğu durumda.
 * Diğer test runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8860, CDP_PORT = 9320;
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

      /* Bir katmanın tamamının imzası — undo'nun SADECE darbe bölgesini
         değil, tuvalin hiçbir yerini bozmadığını da yakalar. */
      function sig(layerId) {
        var L = Layers.get(layerId);
        var c = document.createElement('canvas');
        c.width = 96; c.height = 96;
        var x = c.getContext('2d', { willReadFrequently:true });
        x.drawImage(L.canvas, 0, 0, 96, 96);
        var d = x.getImageData(0, 0, 96, 96).data;
        var h = 2166136261;
        for (var i = 0; i < d.length; i += 4) {
          h ^= d[i]; h = Math.imul(h, 16777619);
          h ^= d[i+3]; h = Math.imul(h, 16777619);
        }
        return h >>> 0;
      }
      /* Belirli bir noktadaki tam piksel */
      function px(layerId, x, y) {
        var L = Layers.get(layerId);
        return L.ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data.join(',');
      }

      function down(x, y) { Tools.startRaster(Layers.active, {x:x,y:y}, Tools.mode); }

      /* ---------- 1) KARA fırçası: tek damga ---------- */
      Layers.init(2048, 2048); History.clear();
      Layers.active = 'landmass';
      var sig0 = sig('landmass');
      var pxOut0 = px('landmass', 1800, 1800);   /* darbeden uzak bir nokta */

      Tools.startRaster('landmass', {x:400,y:400}, 'paint');
      Tools.endRaster();
      var sigPaint = sig('landmass');
      check('kara darbesi tuvali değiştirdi', sigPaint !== sig0);

      await History.undo();
      check('undo kara darbesini birebir geri aldı', sig('landmass') === sig0);
      check('undo darbe dışını bozmadı', px('landmass', 1800, 1800) === pxOut0);
      await History.redo();
      check('redo kara darbesini birebir geri koydu', sig('landmass') === sigPaint);
      await History.undo();

      /* ---------- 2) Uzun darbe: yama artımlı büyümeli ---------- */
      Layers.init(2048, 2048); History.clear();
      Layers.active = 'landmass';
      var sigA = sig('landmass');
      Tools.startRaster('landmass', {x:200,y:200}, 'paint');
      /* tuvalin bir ucundan diğerine sürükle — yama defalarca genişler */
      var pts = [[400,300],[800,500],[1200,700],[1600,900],[1800,1400]];
      for (var i = 0; i < pts.length; i++) Tools.strokeTo({x:pts[i][0], y:pts[i][1]});
      Tools.endRaster();
      var sigB = sig('landmass');
      check('uzun darbe tuvali değiştirdi', sigB !== sigA);
      await History.undo();
      check('uzun darbe undo birebir geri aldı (artımlı yama doğru)', sig('landmass') === sigA);
      await History.redo();
      check('uzun darbe redo birebir geri koydu', sig('landmass') === sigB);

      /* ---------- 3) Üst üste binen iki darbe ----------
         İkinci darbe birincinin üstünü boyar; ikincinin undo'su
         birincinin sonucunu geri vermelidir (orijinali değil). */
      Layers.init(2048, 2048); History.clear();
      Layers.active = 'landmass';
      Tools.startRaster('landmass', {x:600,y:600}, 'paint');
      Tools.strokeTo({x:700,y:700});
      Tools.endRaster();
      var sigFirst = sig('landmass');
      Tools.startRaster('landmass', {x:650,y:650}, 'paint');
      Tools.strokeTo({x:900,y:900});
      Tools.endRaster();
      var sigSecond = sig('landmass');
      check('ikinci darbe farklı sonuç üretti', sigSecond !== sigFirst);
      await History.undo();
      check('ikinci darbenin undo su birinciyi geri verdi', sig('landmass') === sigFirst);
      await History.redo();
      check('ikinci darbenin redo su doğru', sig('landmass') === sigSecond);

      /* ---------- 4) SİLGİ: kara + arazi tek adımda ---------- */
      Layers.init(2048, 2048); History.clear();
      Layers.active = 'landmass';
      Tools.generateLandmass('continent', 0.5, 7);
      Cv.render();
      Layers.active = 'terrain';
      App.terrain.type = 'grassland';
      Tools.startRaster('terrain', {x:1024,y:1024}, 'terrain');
      Tools.strokeTo({x:1100,y:1100});
      Tools.endRaster();
      var sigLandBefore = sig('landmass'), sigTerrBefore = sig('terrain');

      Layers.active = 'landmass';
      Tools.startRaster('landmass', {x:1024,y:1024}, 'erase');
      Tools.strokeTo({x:1100,y:1100});
      Tools.endRaster();
      var sigLandAfter = sig('landmass'), sigTerrAfter = sig('terrain');
      check('silgi karayı değiştirdi', sigLandAfter !== sigLandBefore);
      check('silgi araziyi de değiştirdi', sigTerrAfter !== sigTerrBefore);

      await History.undo();
      check('silgi undo karayı geri aldı', sig('landmass') === sigLandBefore);
      check('silgi undo araziyi de geri aldı (atomik)', sig('terrain') === sigTerrBefore);
      await History.redo();
      check('silgi redo her iki katmanı da geri koydu',
        sig('landmass') === sigLandAfter && sig('terrain') === sigTerrAfter);

      /* ---------- 5) YÜKSELTİ fırçası ---------- */
      Layers.init(2048, 2048); History.clear();
      Layers.active = 'elevation';
      var sigE0 = sig('elevation');
      Tools.startRaster('elevation', {x:500,y:500}, 'elevation');
      Tools.strokeTo({x:700,y:650});
      Tools.endRaster();
      var sigE1 = sig('elevation');
      check('yükselti darbesi değişiklik yaptı', sigE1 !== sigE0);
      await History.undo();
      check('yükselti undo birebir geri aldı', sig('elevation') === sigE0);
      await History.redo();
      check('yükselti redo birebir geri koydu', sig('elevation') === sigE1);

      /* ---------- 6) ÇİZİM (kullanıcı katmanı) ---------- */
      Layers.init(2048, 2048); History.clear();
      var custom = Layers.addCustom('test-sketch', 2048, 2048);
      Layers.active = custom.id;
      var sigS0 = sig(custom.id);
      Tools.startRaster(custom.id, {x:300,y:300}, 'sketch');
      Tools.strokeTo({x:500,y:420});
      Tools.endRaster();
      var sigS1 = sig(custom.id);
      check('çizim darbesi değişiklik yaptı', sigS1 !== sigS0);
      await History.undo();
      check('çizim undo birebir geri aldı', sig(custom.id) === sigS0);
      await History.redo();
      check('çizim redo birebir geri koydu', sig(custom.id) === sigS1);

      /* ---------- 7) Tuval kenarındaki darbe (kırpma sınırları) ---------- */
      Layers.init(2048, 2048); History.clear();
      Layers.active = 'landmass';
      var sigC0 = sig('landmass');
      Tools.startRaster('landmass', {x:5,y:5}, 'paint');
      Tools.strokeTo({x:60,y:40});
      Tools.endRaster();
      var sigC1 = sig('landmass');
      check('kenar darbesi değişiklik yaptı', sigC1 !== sigC0);
      await History.undo();
      check('kenar darbesi undo birebir geri aldı', sig('landmass') === sigC0);
      await History.redo();
      check('kenar darbesi redo birebir geri koydu', sig('landmass') === sigC1);

      /* ---------- 8) Performans: 8192 de darbe başlangıcı donmamalı ----------
         Ölçüm, tuvalin arka-plan deposu ZATEN tahsis edilmişken yapılır:
         taze bir 8192² tuvale ilk boyama işlemi, ne çizildiğinden bağımsız
         olarak ~saniyeler süren bir tahsis tetikler (bkz. CLAUDE.md) — bu
         maliyet bu refactor'den bağımsızdır ve gerçek kullanımda kullanıcı
         zaten açık bir harita üzerinde çalışır. Burada ölçmek istediğimiz,
         darbe BAŞINA düşen maliyet. */
      Layers.init(8192, 8192); Cv.setSize(8192, 8192, false); History.clear();
      Layers.active = 'landmass';
      /* Isıtma darbesi ÖLÇÜLECEK BÖLGENİN yanında yapılır: Chromium
         büyük tuvalin arka-plan deposunu parça parça gerçekleştirir, bu
         yüzden uzak bir bölgeye ilk dokunuş tek seferlik bir bedel
         doğurur. Burada ölçmek istediğimiz kararlı hâldeki darbe
         maliyeti, o tek seferlik tahsis değil. */
      Tools.startRaster('landmass', {x:3900,y:3900}, 'paint');
      Tools.endRaster();
      History.clear();

      /* endRaster'in içindeki History yazımını ayrı ölçebilmek için
         pushRaster'i geçici olarak saralım: darbe bitişinin geri kalanı
         (kıyı efektinin yeniden inşası vb.) bu refactor'ün konusu değil
         ve 8192²'de kendi başına pahalı olduğu zaten belgeli. */
      var pushMs = 0, origPush = History.pushRaster;
      History.pushRaster = function () {
        var s = performance.now();
        var r = origPush.apply(History, arguments);
        pushMs += performance.now() - s;
        return r;
      };

      var t0 = performance.now();
      Tools.startRaster('landmass', {x:4000,y:4000}, 'paint');
      var startMs = performance.now() - t0;
      var t1 = performance.now();
      Tools.strokeTo({x:4200,y:4150});
      Tools.endRaster();
      var endMs = performance.now() - t1;
      History.pushRaster = origPush;

      results.push('__PERF__' + JSON.stringify({
        startMs: Math.round(startMs*10)/10,
        endMs: Math.round(endMs*10)/10,
        pushMs: Math.round(pushMs*10)/10
      }));
      /* Bu refactor'ün doğrudan sorumlu olduğu iki maliyet: */
      check('8192 de darbe baslangici <150ms (eskiden ~1200ms)', startMs < 150);
      check('8192 de History yazimi <400ms', pushMs < 400);
      check('8192 de darbe gercekten History adimi uretti', History.stack.length === 1);

      /* ---------- 9) Kutu kırpması KATMAN tuvaline göre yapılmalı ----------
         Cv.setSize katmanları da yeniden boyutlandırdığı için normal
         kullanımda Cv.W ile katman boyutu ayrışmaz; ama Layers.init tek
         başına çağrıldığında (test koşumları ve harita/doküman değişimi
         yollarında olduğu gibi) ayrışır. Kutuyu Cv.W'ye kırpan eski
         hesap o durumda negatif genişlik üretip darbeyi sessizce
         geri alınamaz bırakıyordu; artık yazılan tuvale kırpılıyor. */
      Cv.setSize(1024, 1024, false);      /* görünüm 1024 */
      Layers.init(4096, 4096);            /* katmanlar 4096 — kasıtlı ayrışma */
      History.clear();
      Layers.active = 'landmass';
      Tools.startRaster('landmass', {x:3000,y:3000}, 'paint');
      Tools.strokeTo({x:3200,y:3100});
      Tools.endRaster();
      check('gorunumden uzaktaki darbe History adimi uretti', History.stack.length === 1);
      var sigFar = sig('landmass');
      await History.undo();
      var sigFarUndone = sig('landmass');
      check('gorunumden uzaktaki darbe geri alinabiliyor', sigFarUndone !== sigFar);
      await History.redo();
      check('gorunumden uzaktaki darbe yinelenebiliyor', sig('landmass') === sigFar);

      return results.join('\\n');
    })()`;

    const result = await evaluate(cdp, testCode, true);
    const lines = (result.result?.value || '').split('\n').filter(Boolean);
    let allPass = true;
    for (const line of lines) {
      if (line.startsWith('__PERF__')) {
        const p = JSON.parse(line.slice(8));
        console.log(`  · 8192²: darbe başlangıcı ${p.startMs}ms · History yazımı ${p.pushMs}ms · endRaster toplam ${p.endMs}ms (fark: kıyı efekti yeniden inşası)`);
        continue;
      }
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
