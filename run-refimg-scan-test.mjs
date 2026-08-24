/**
 * Referans görselden coğrafya taraması (Tools.scanReferenceImage) doğrulaması.
 *
 * Sentetik bir test haritası ÇİZİLİR (dosya yükleme yok): mavi deniz, tan kara,
 * karanın içinde bir göl, ince kıvrımlı bir nehir ve — asıl mesele — kara
 * ortasında duran çok renkli, kompakt bir "şehir ikonu". Testin çekirdek
 * garantisi şu: o ikon coğrafyaya KARIŞMAMALI — ne bir göle ne bir adaya
 * dönüşmeli, altındaki arazi kesintisiz devam etmeli.
 *
 * Ayrıca ilerleme geri çağrılarının sırası/monotonluğu, süre bütçesi (§1.5)
 * ve iptal edildiğinde hiçbir katmana dokunulmadığı doğrulanır.
 * Diğer runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8792, CDP_PORT = 9262;
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
        console.error('[browser ERROR]', m.params.exceptionDetails.text,
                      m.params.exceptionDetails.exception?.description || '');
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

/* Sentetik referans haritasını çizip reference katmanına yükleyen ortak kod.
   IW/IH: görsel boyutu; işaret (marker) merkezi MX,MY. */
const BUILD_REF = `
  window.__IW = 600; window.__IH = 400;
  window.__MX = 400; window.__MY = 200; window.__MR = 11;
  window.__buildRef = async function () {
    var IW = window.__IW, IH = window.__IH;
    var c = document.createElement('canvas'); c.width = IW; c.height = IH;
    var x = c.getContext('2d');
    /* deniz */
    x.fillStyle = '#2a5f8f'; x.fillRect(0, 0, IW, IH);
    /* kara (kenarlara değmeyen büyük bir kütle) */
    x.fillStyle = '#d9c79a';
    x.beginPath(); x.ellipse(IW/2, IH/2, 230, 150, 0, 0, Math.PI*2); x.fill();
    /* göl: kara içinde kompakt su gövdesi */
    x.fillStyle = '#2a5f8f';
    x.beginPath(); x.arc(200, 150, 26, 0, Math.PI*2); x.fill();
    /* nehir: ince, kıvrımlı su şeridi (yine kara içinde) */
    x.strokeStyle = '#2a5f8f'; x.lineWidth = 7; x.lineCap = 'round';
    x.beginPath();
    x.moveTo(300, 95);
    x.bezierCurveTo(340, 150, 260, 200, 310, 300);
    x.stroke();
    /* ŞEHİR İKONU: küçük, kompakt, ÇOK RENKLİ — coğrafya sayılmamalı */
    var MX = window.__MX, MY = window.__MY, MR = window.__MR;
    x.fillStyle = '#54504a'; x.fillRect(MX-MR, MY-MR+6, MR*2, MR*2-6);   /* gövde */
    x.fillStyle = '#b8412f';                                             /* kırmızı çatı */
    x.beginPath(); x.moveTo(MX-MR-2, MY-MR+7); x.lineTo(MX, MY-MR-5);
    x.lineTo(MX+MR+2, MY-MR+7); x.closePath(); x.fill();
    x.fillStyle = '#f2e7cf'; x.fillRect(MX-3, MY+2, 6, 8);               /* açık kapı */
    x.strokeStyle = '#1d1a17'; x.lineWidth = 1.5;
    x.strokeRect(MX-MR, MY-MR+6, MR*2, MR*2-6);

    var im = new Image();
    await new Promise(function (r, j) { im.onload = r; im.onerror = j; im.src = c.toDataURL('image/png'); });
    Layers.get('reference').image = im;
    Layers.get('reference').visible = true;
    return true;
  };
`;

async function run() {
  const srv = await startServer();
  const chrome = spawn(CHROMIUM, [
    `--remote-debugging-port=${CDP_PORT}`, '--headless=new', '--no-sandbox', '--disable-gpu',
    '--window-size=1280,800', `http://localhost:${PORT}/`
  ], { stdio: 'ignore' });
  process.on('exit', () => { chrome.kill(); srv.close(); });

  await sleep(3000);
  const cdp = await connectCDP();
  await cdp.send('Runtime.enable');
  for (let i = 0; i < 40; i++) {
    const r = await evaluate(cdp, 'typeof Tools!=="undefined"&&typeof Layers!=="undefined"');
    if (r.result?.value === true) break;
    await sleep(500);
  }
  await evaluate(cdp, 'UI.showView("editor")');
  await sleep(300);
  await evaluate(cdp, BUILD_REF);

  const results = [];
  const check = (name, cond) => results.push(name + ': ' + (cond ? 'PASS' : 'FAIL'));

  /* ================= 1) ANA TARAMA ================= */
  const main = `(async function () {
    try {
      Exporter.newProject(1024, 1024, 'Scan Test');
      await window.__buildRef();

      var prog = [];
      var t0 = performance.now();
      var res = await Tools.scanReferenceImage({
        onProgress: function (si, sc, key, f) { prog.push({ si:si, sc:sc, key:key, f:f }); }
      });
      var ms = performance.now() - t0;

      /* --- işaretin harita koordinatındaki yeri --- */
      var kx = Cv.W / window.__IW, ky = Cv.H / window.__IH;
      var mx = Math.round(window.__MX * kx), my = Math.round(window.__MY * ky);
      var mrx = window.__MR * kx, mry = window.__MR * ky;

      /* landmass'te işaretin yerinde hâlâ kara var mı (delik açılmamış)? */
      var Lm = Layers.get('landmass');
      var px = Lm.ctx.getImageData(mx, my, 1, 1).data;
      var landUnderMarker = px[3] > 128;

      /* İşaretin bbox'ına düşen bir su nesnesi üretilmiş mi? Asıl garanti bu:
         landmass zaten "iç su da karadır" kuralı yüzünden delinmez, o yüzden
         tek başına delik yokluğu yeterli bir kanıt değil. */
      var Rv = Layers.get('rivers');
      var pad = 1.6;
      function inMarker(p) {
        return Math.abs(p[0]-mx) <= mrx*pad && Math.abs(p[1]-my) <= mry*pad;
      }
      var waterOnMarker = 0;
      Rv.objects.forEach(function (o) {
        if (!o.pts) return;
        for (var i = 0; i < o.pts.length; i++) if (inMarker(o.pts[i])) { waterOnMarker++; return; }
      });

      var lakes = Rv.objects.filter(function (o) { return o.kind === 'lake'; }).length;
      var rivers = Rv.objects.filter(function (o) { return o.kind !== 'lake'; }).length;

      /* ilerleme geri çağrıları: sıra doğru mu, genel oran monotonik mi */
      var STAGES = Tools.SCAN_STAGES;
      var seq = [], mono = true, last = -1;
      prog.forEach(function (p) {
        if (!seq.length || seq[seq.length-1] !== p.key) seq.push(p.key);
        var overall = (p.si + Math.min(1, p.f)) / p.sc;
        if (overall < last - 1e-6) mono = false;
        last = overall;
      });

      window.__R = {
        ok: !!res, ms: ms, landUnderMarker: landUnderMarker,
        waterOnMarker: waterOnMarker, lakes: lakes, rivers: rivers,
        markers: res && res.markers, seq: seq.join(','),
        expectedSeq: STAGES.join(','), mono: mono, lastOverall: last,
        calls: prog.length
      };
    } catch (e) { window.__R = { err: e.message + ' | ' + e.stack }; }
    window.__done = true;
  })();`;

  await evaluate(cdp, main, true);
  for (let i = 0; i < 60; i++) {
    const d = await evaluate(cdp, 'window.__done===true');
    if (d.result?.value) break;
    await sleep(200);
  }
  const R = JSON.parse((await evaluate(cdp, 'JSON.stringify(window.__R||{})')).result?.value || '{}');
  if (R.err) { console.error('HATA:', R.err); process.exit(1); }

  console.log(`süre: ${R.ms.toFixed(0)}ms · ilerleme çağrısı: ${R.calls} · ` +
              `nehir: ${R.rivers} · göl: ${R.lakes} · atlanan işaret: ${R.markers}`);

  check('tarama tamamlandı (Promise çözüldü)', R.ok === true);
  check('işaretin altındaki arazi kesintisiz (delik yok)', R.landUnderMarker === true);
  check('işaret coğrafyaya karışmadı (üstünde su nesnesi yok)', R.waterOnMarker === 0);
  check('en az bir işaret ayıklandı', R.markers >= 1);
  check('göl bulundu', R.lakes >= 1);
  check('nehir bulundu', R.rivers >= 1);
  check('aşama sırası beklenen sırayla', R.seq === R.expectedSeq);
  check('genel ilerleme monotonik artıyor', R.mono === true);
  check('ilerleme %100\'e ulaştı', Math.abs(R.lastOverall - 1) < 1e-6);
  check('süre bütçe içinde (<2000ms)', R.ms < 2000);

  /* ================= 2) İPTAL: hiçbir katmana dokunulmamalı ================= */
  const cancelTest = `(async function () {
    try {
      Exporter.newProject(1024, 1024, 'Scan Cancel');
      await window.__buildRef();
      var Lm = Layers.get('landmass'), Rv = Layers.get('rivers');
      var landBefore = Lm.ctx.getImageData(0, 0, Lm.canvas.width, Lm.canvas.height).data;
      var sumBefore = 0; for (var i = 3; i < landBefore.length; i += 4) sumBefore += landBefore[i];
      var objBefore = Rv.objects.length;
      var histBefore = History.index;

      var token = { cancelled:false };
      var rejected = false;
      var p = Tools.scanReferenceImage({
        token: token,
        /* ilk geri çağrıda iptal et — böylece boru hattı kesin olarak
           başlamış ama 6. (yazma) aşamasına gelmemiş olur */
        onProgress: function () { token.cancelled = true; }
      })['catch'](function () { rejected = true; });
      await p;

      var landAfter = Lm.ctx.getImageData(0, 0, Lm.canvas.width, Lm.canvas.height).data;
      var sumAfter = 0; for (var j = 3; j < landAfter.length; j += 4) sumAfter += landAfter[j];

      window.__C = {
        rejected: rejected,
        landUnchanged: sumBefore === sumAfter,
        objUnchanged: Rv.objects.length === objBefore,
        histUnchanged: History.index === histBefore
      };
    } catch (e) { window.__C = { err: e.message }; }
    window.__cdone = true;
  })();`;

  await evaluate(cdp, cancelTest, true);
  for (let i = 0; i < 40; i++) {
    const d = await evaluate(cdp, 'window.__cdone===true');
    if (d.result?.value) break;
    await sleep(200);
  }
  const C = JSON.parse((await evaluate(cdp, 'JSON.stringify(window.__C||{})')).result?.value || '{}');
  if (C.err) { console.error('İPTAL TESTİ HATASI:', C.err); process.exit(1); }

  check('iptal edilince Promise reddedildi', C.rejected === true);
  check('iptalde landmass değişmedi', C.landUnchanged === true);
  check('iptalde su nesnesi eklenmedi', C.objUnchanged === true);
  check('iptalde History adımı oluşmadı', C.histUnchanged === true);

  console.log('\n========== REFERANS GÖRSEL TARAMA TESTİ ==========');
  results.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
  const pass = results.every(l => l.endsWith('PASS'));
  console.log(pass ? '\n✅ TÜM TESTLER GEÇTİ' : '\n❌ BAZI TESTLER BAŞARISIZ');
  process.exit(pass ? 0 : 1);
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
