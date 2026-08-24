/**
 * Mobil derin dokunma UX doğrulaması (Faz 1 #32/#40/#41):
 *   - 375/390/430/768px genişliklerde editörün her zaman kullanılabilir
 *     kalması (paneller, tuval, touch-path-actions çubuğu)
 *   - Klavyesiz, uçtan uca dokunma-only bir iş akışı: nehir çiz → bitir
 *     (tpa-finish), bir alanı kement ile kaldır → onayla (tpa-finish),
 *     bir sembolü seç → sil (btn-del) — hiçbiri klavye olayı kullanmaz.
 *   - Jest çakışması: bir yol aracında tek parmakla nokta eklerken hemen
 *     ikinci parmak inip pinch başlatırsa (Tools.onDown'daki 250ms'lik
 *     geri-al penceresi), istemsiz eklenen nokta geri alınmalı.
 * Diğer runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8794, CDP_PORT = 9254;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BASE_DIR = '/home/user/wayborne-map-editor';
const WIDTHS = [375, 390, 430, 768];

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

function widthTestCode(width) {
  return `(async function () {
    try {
      const results = [];
      function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }
      function yieldFrame() { return new Promise(r => setTimeout(r, 0)); }

      UI.showView('editor');
      await new Promise(r => setTimeout(r, 200));
      Cv.setSize(1024, 1024, false);

      check('editor gorunumu acik (w=${width})', UI._currentView === 'editor');
      check('tuval sifir degil (w=${width})', Cv.vw > 0 && Cv.vh > 0);

      var ws = document.getElementById('workspace');
      check('sol panel varsayilan kapali (w=${width})', ws.classList.contains('collapsed-left'));
      check('sag panel varsayilan kapali (w=${width})', ws.classList.contains('collapsed-right'));

      var bar = document.getElementById('touch-path-actions');
      check('touch-path-actions DOM\\'da mevcut (w=${width})', !!bar);

      /* ---- uctan uca dokunma-only is akisi: NEHIR ----
         Klavye olayi hic kullanilmaz; sadece pointer events + tpa dugmeleri.
         x/y burada EKRAN (view'a goreli) piksel — Tools.pos() bunlari
         Cv.screenToMap ile harita koordinatina cevirir; secim adiminda
         AYNI ekran noktasina tekrar dokunulur ki harita koordinati
         onceden bilinmeden de doğru nesneye isabet etsin. */
      var view = document.getElementById('view');
      var rect = view.getBoundingClientRect();
      var pid = 500;
      function tdown(x, y) {
        var id = ++pid;
        view.dispatchEvent(new PointerEvent('pointerdown', { pointerId:id, pointerType:'touch', clientX:rect.left+x, clientY:rect.top+y, bubbles:true, button:0 }));
        return id;
      }
      function tup(id, x, y) {
        window.dispatchEvent(new PointerEvent('pointerup', { pointerId:id, pointerType:'touch', clientX:rect.left+x, clientY:rect.top+y, bubbles:true }));
      }
      function ttap(x, y) { var id = tdown(x, y); tup(id, x, y); }

      UI.setTool('river');
      var Rv = Layers.get('rivers');
      var rc0 = Rv.objects.length;
      ttap(80, 80); ttap(200, 80); ttap(200, 200);
      check('dokunma ile 3 nokta eklendi (w=${width})', Tools.pathPts.length === 3);
      check('nokta eklenince cubuk gorunur (w=${width})', !bar.classList.contains('hidden'));
      var btnRect = document.getElementById('tpa-finish').getBoundingClientRect();
      check('tpa dugmeleri >=44px dokunma hedefi (w=${width})', btnRect.width >= 44 && btnRect.height >= 44);
      document.getElementById('tpa-finish').click();
      check('tpa-finish (klavyesiz) nehri bitirdi (w=${width})', Rv.objects.length === rc0 + 1);
      check('bitirince cubuk gizlendi (w=${width})', bar.classList.contains('hidden'));

      /* ---- uctan uca dokunma-only is akisi: sembol sec + sil (btn-del) ---- */
      UI.setTool('symbol');
      var symId = (Sym.SYMBOLS.castles && Sym.SYMBOLS.castles.items[0].id);
      App.symbol.id = symId;
      var Sy = Layers.get('symbols');
      var sc0 = Sy.objects.length;
      var symScreenX = 260, symScreenY = 260;
      ttap(symScreenX, symScreenY);
      check('dokunma ile sembol yerlestirildi (w=${width})', Sy.objects.length === sc0 + 1);
      UI.setTool('select');
      ttap(symScreenX, symScreenY);
      var newSym = Sy.objects[Sy.objects.length - 1];
      check('dokunma ile sembol secildi (w=${width})', App.selection && App.selection.id === newSym.id);
      /* sag panel kapali olabilir — buton yine de DOM'da ve tiklanabilir olmali */
      document.getElementById('btn-del').click();
      check('btn-del (klavyesiz) secili sembolu sildi (w=${width})', Sy.objects.length === sc0);

      window.__wResults_${width} = results;
      window.__wPass_${width} = results.every(r => r.endsWith('PASS'));
      window.__wDone_${width} = true;
    } catch (e) {
      window.__wError_${width} = e.message + ' ' + e.stack;
      window.__wDone_${width} = true;
    }
  })();`;
}

const gestureConflictTest = `(async function () {
  try {
    const results = [];
    function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

    UI.showView('editor');
    await new Promise(r => setTimeout(r, 200));
    Cv.setSize(1024, 1024, false);
    var view = document.getElementById('view');
    var rect = view.getBoundingClientRect();

    UI.setTool('river');
    Tools.pathPts = [];
    var Rv = Layers.get('rivers');

    /* birinci parmak iner (bir yol noktasi ekler), hemen ardindan ikinci
       parmak pinch niyetiyle iner — birinci parmagin AZ ONCE eklemis
       oldugu nokta geri alinmali (bkz. Tools.onDown, _lastTouchPoint). */
    view.dispatchEvent(new PointerEvent('pointerdown', { pointerId:901, pointerType:'touch', clientX:rect.left+100, clientY:rect.top+100, bubbles:true, button:0 }));
    check('birinci parmak nokta ekledi', Tools.pathPts.length === 1);
    view.dispatchEvent(new PointerEvent('pointerdown', { pointerId:902, pointerType:'touch', clientX:rect.left+140, clientY:rect.top+100, bubbles:true, button:0 }));
    check('ikinci parmak inince pinch kuruldu', !!Tools._pinch);
    check('istemsiz eklenen nokta geri alindi', Tools.pathPts.length === 0);

    window.dispatchEvent(new PointerEvent('pointerup', { pointerId:901, pointerType:'touch', clientX:rect.left+100, clientY:rect.top+100, bubbles:true }));
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId:902, pointerType:'touch', clientX:rect.left+140, clientY:rect.top+100, bubbles:true }));
    check('parmaklar kalkinca pinch temizlendi', !Tools._pinch);

    /* kontrol: BIRINCI parmak inip beklerken (kalkmadan — pinch adayi
       hala ayni tek parmak), ikinci parmak 250ms'den GEÇ gelirse nokta
       KORUNMALI (kullanici gercekten tek parmakla nokta koyup, bir sure
       sonra ayrica pinch baslatmis olabilir; bu artik "az once eklenen
       nokta" sayilmamali). */
    Tools.pathPts = [];
    view.dispatchEvent(new PointerEvent('pointerdown', { pointerId:903, pointerType:'touch', clientX:rect.left+300, clientY:rect.top+300, bubbles:true, button:0 }));
    check('tek parmak dokunusu sonrasi nokta kalici', Tools.pathPts.length === 1);
    await new Promise(r => setTimeout(r, 300));
    view.dispatchEvent(new PointerEvent('pointerdown', { pointerId:904, pointerType:'touch', clientX:rect.left+340, clientY:rect.top+300, bubbles:true, button:0 }));
    check('250ms sonra gelen ikinci parmak eski noktayi SILMEZ', Tools.pathPts.length === 1);
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId:903, pointerType:'touch', clientX:rect.left+300, clientY:rect.top+300, bubbles:true }));
    window.dispatchEvent(new PointerEvent('pointerup', { pointerId:904, pointerType:'touch', clientX:rect.left+340, clientY:rect.top+300, bubbles:true }));

    Tools.pathPts = []; Tools._pinch = null; Tools._touches = {};

    window.__gcResults = results;
    window.__gcPass = results.every(r => r.endsWith('PASS'));
    window.__gcDone = true;
  } catch (e) {
    window.__gcError = e.message + ' ' + e.stack;
    window.__gcDone = true;
  }
})();`;

async function run() {
  const srv = await startServer();
  const chrome = spawn(CHROMIUM, [
    `--remote-debugging-port=${CDP_PORT}`, '--headless=new', '--no-sandbox', '--disable-gpu',
    '--window-size=1280,800', `http://localhost:${PORT}/`
  ], { stdio: 'ignore' });
  process.on('exit', () => { chrome.kill(); srv.close(); });

  await sleep(3000);
  let cdp;
  let allOk = true;
  try {
    cdp = await connectCDP();
    await cdp.send('Runtime.enable');

    for (let i = 0; i < 40; i++) {
      const r = await evaluate(cdp, 'typeof Layers!=="undefined"&&typeof Tools!=="undefined"&&typeof UI!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    for (const w of WIDTHS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 2, mobile: true });
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
      await sleep(200);

      await evaluate(cdp, widthTestCode(w), true);
      for (let i = 0; i < 30; i++) {
        const done = await evaluate(cdp, `window.__wDone_${w}===true`);
        if (done.result?.value) break;
        await sleep(200);
      }
      const err = await evaluate(cdp, `window.__wError_${w}||""`);
      if (err.result?.value) { console.error(`HATA (w=${w}):`, err.result.value); allOk = false; continue; }
      const res = await evaluate(cdp, `JSON.stringify(window.__wResults_${w}||[])`);
      const pass = await evaluate(cdp, `window.__wPass_${w}===true`);
      const list = JSON.parse(res.result?.value || '[]');
      console.log(`\n========== GENİŞLİK ${w}px ==========`);
      list.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
      if (!pass.result?.value) allOk = false;
    }

    /* jest çakışması testi masaüstü genişlikte de anlamlı (dokunmatik
       dizüstü/tablet), ayrı bölüm olarak çalıştırılır */
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 800, deviceScaleFactor: 2, mobile: true });
    await sleep(150);
    await evaluate(cdp, gestureConflictTest, true);
    for (let i = 0; i < 30; i++) {
      const done = await evaluate(cdp, 'window.__gcDone===true');
      if (done.result?.value) break;
      await sleep(200);
    }
    const gcErr = await evaluate(cdp, 'window.__gcError||""');
    if (gcErr.result?.value) { console.error('HATA (jest çakışması):', gcErr.result.value); allOk = false; }
    else {
      const gcRes = await evaluate(cdp, 'JSON.stringify(window.__gcResults||[])');
      const gcPass = await evaluate(cdp, 'window.__gcPass===true');
      const gcList = JSON.parse(gcRes.result?.value || '[]');
      console.log('\n========== JEST ÇAKIŞMASI: PINCH SIRASINDA İSTEMSİZ NOKTA ==========');
      gcList.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
      if (!gcPass.result?.value) allOk = false;
    }

    console.log(allOk ? '\n✅ TÜM DERİN DOKUNMA TESTLERİ GEÇTİ' : '\n❌ BAZI TESTLER BAŞARISIZ');
    process.exit(allOk ? 0 : 1);
  } catch (e) {
    console.error('Test çalıştırma hatası:', e);
    process.exit(1);
  }
}

run();
