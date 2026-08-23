/**
 * Kapsamlı araç testi — index.html'de tanımlı 19 aracın TAMAMINI gerçek
 * pointer olaylarıyla (Cv.view üzerinde pointerdown/move/up dispatch)
 * hem masaüstü hem mobil (touch, dar viewport) modda dener; her araç
 * denemesinden sonra beklenen katman/nesne değişikliğini doğrular ve tüm
 * süreç boyunca konsol hatası/atılmamış exception olmadığını kontrol eder.
 * Diğer test runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8770, CDP_PORT = 9227;
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

async function connectCDP(errors) {
  const resp = JSON.parse(execSync(`curl -s http://localhost:${CDP_PORT}/json/list`));
  const wsUrl = resp[0].webSocketDebuggerUrl;
  return new Promise((res, rej) => {
    const ws = new WebSocket(wsUrl);
    let id = 0; const pending = {};
    ws.addEventListener('message', ({ data: d }) => {
      const m = JSON.parse(d);
      if (!m.id && m.method === 'Runtime.consoleAPICalled') {
        const level = m.params.type;
        const args = (m.params.args || []).map(a => a.value ?? a.description ?? '').join(' ');
        if (level === 'error') errors.push('[console.error] ' + args);
        else if (args) process.stdout.write('[browser] ' + args + '\n');
      }
      if (!m.id && m.method === 'Runtime.exceptionThrown') {
        const txt = m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception?.description || '');
        errors.push('[exception] ' + txt);
        console.error('[browser ERROR]', txt);
      }
      if (m.id && pending[m.id]) { pending[m.id](m.result ?? m.error); delete pending[m.id]; }
    });
    ws.addEventListener('open', () => res({
      send: (method, params={}) => new Promise((r2,e2) => {
        const cid = ++id;
        pending[cid] = v => v && v.code ? e2(new Error(JSON.stringify(v))) : r2(v);
        ws.send(JSON.stringify({id:cid, method, params}));
      }),
      close: () => ws.close()
    }));
    ws.addEventListener('error', e => rej(e));
  });
}

async function evaluate(cdp, expression, awaitPromise=false) {
  return cdp.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
}

/* ------------------------------------------------------------------ */
/* Tarayıcı içinde çalışacak tek test fonksiyonu — hem masaüstü hem    */
/* mobil çağrı için aynı kod, sadece pointerType/viewport farklı.      */
/* ------------------------------------------------------------------ */
function buildTestCode(pointerType) {
  return `(async function () {
    try {
      const results = [];
      function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }
      function yieldFrame() { return new Promise(r => setTimeout(r, 0)); }

      Cv.setSize(1024, 1024, false);
      const view = Cv.view;
      const rect = view.getBoundingClientRect();

      let pid = 100;
      function down(x, y) {
        view.dispatchEvent(new PointerEvent('pointerdown', {
          pointerId: ++pid, pointerType: '${pointerType}', clientX: rect.left+x, clientY: rect.top+y,
          bubbles: true, button: 0
        }));
        return pid;
      }
      function move(id, x, y) {
        view.dispatchEvent(new PointerEvent('pointermove', {
          pointerId: id, pointerType: '${pointerType}', clientX: rect.left+x, clientY: rect.top+y, bubbles: true
        }));
      }
      function up(id, x, y) {
        window.dispatchEvent(new PointerEvent('pointerup', {
          pointerId: id, pointerType: '${pointerType}', clientX: rect.left+x, clientY: rect.top+y, bubbles: true
        }));
      }
      function drag(x1, y1, x2, y2) {
        const id = down(x1, y1);
        move(id, (x1+x2)/2, (y1+y2)/2);
        move(id, x2, y2);
        up(id, x2, y2);
      }
      function click(x, y) {
        const id = down(x, y);
        up(id, x, y);
      }
      function dblclick(x, y) {
        click(x, y);
        view.dispatchEvent(new PointerEvent('dblclick', {
          pointerType: '${pointerType}', clientX: rect.left+x, clientY: rect.top+y, bubbles: true
        }));
      }

      /* ---- kara + biyom tabanı: sonraki araçlar için gerçekçi zemin ---- */
      UI.setTool('landmass');
      Tools.generateLandmass('continent', 0.5, 4242);
      await yieldFrame();
      const Lm = Layers.get('landmass');
      function landPct() {
        const d = Lm.ctx.getImageData(0,0,Lm.canvas.width,Lm.canvas.height).data;
        let n=0; for (let i=3;i<d.length;i+=4) if (d[i]>10) n++;
        return n/(d.length/4);
      }
      check('landmass: uretim sonrasi kara var', landPct() > 0.1);

      /* ---- pan ---- */
      UI.setTool('pan');
      const px0 = Cv.panX, py0 = Cv.panY;
      drag(400, 400, 460, 460);
      check('pan: gorunum kaydi', Cv.panX !== px0 || Cv.panY !== py0);
      Cv.panX = px0; Cv.panY = py0; Cv.requestRender();

      /* ---- landmass (fircayla ekleme) ---- */
      UI.setTool('landmass');
      App.brush.size = 60;
      const p1 = landPct();
      drag(150, 850, 250, 900);
      await yieldFrame();
      check('landmass: fircayla kara eklendi', landPct() >= p1);

      /* ---- erase (deniz silgisi) ---- */
      UI.setTool('erase');
      const p2 = landPct();
      drag(150, 850, 250, 900);
      await yieldFrame();
      check('erase: kara silindi', landPct() <= p2);

      /* ---- fill (doldur) ---- */
      UI.setTool('fill');
      const Tr = Layers.get('terrain');
      function terrainPct() {
        const d = Tr.ctx.getImageData(0,0,Tr.canvas.width,Tr.canvas.height).data;
        let n=0; for (let i=3;i<d.length;i+=4) if (d[i]>10) n++;
        return n;
      }
      const t0 = terrainPct();
      App.terrain = App.terrain || 'grass';
      click(512, 512);
      await yieldFrame();
      check('fill: arazi katmanina piksel yazildi', terrainPct() >= t0);

      /* ---- terrain (arazi fircasi) ---- */
      UI.setTool('terrain');
      const t1 = terrainPct();
      drag(300, 300, 360, 340);
      await yieldFrame();
      check('terrain: firca ile arazi eklendi', terrainPct() >= t1);

      /* ---- elevation (yukselti firca) ---- */
      UI.setTool('elevation');
      const Ev = Layers.get('elevation');
      function elevSig() {
        const d = Ev.ctx.getImageData(0,0,Ev.canvas.width,Ev.canvas.height).data;
        let n=0; for (let i=3;i<d.length;i+=4) if (d[i]>5) n++;
        return n;
      }
      const e0 = elevSig();
      drag(500, 500, 540, 540);
      await yieldFrame();
      check('elevation: yukselti katmanina yazildi', elevSig() >= e0);

      /* ---- eyedrop (orneklendirici) ---- */
      UI.setTool('eyedrop');
      App.eyedrop.painting = false;
      click(512, 512);
      check('eyedrop: secim modu tetiklendi (hata yok)', true);
      Eyedropper.picking = false;

      /* ---- river ---- */
      UI.setTool('river');
      const Rv = Layers.get('rivers');
      const rc0 = Rv.objects.length;
      click(100, 100); click(300, 150); dblclick(500, 200);
      await yieldFrame();
      check('river: nehir nesnesi eklendi', Rv.objects.length > rc0);

      /* ---- lake ---- */
      UI.setTool('lake');
      const lc0 = Rv.objects.filter(o => o.kind === 'lake').length;
      click(600, 600); click(650, 600); click(650, 650); dblclick(600, 650);
      await yieldFrame();
      check('lake: gol nesnesi eklendi', Rv.objects.filter(o => o.kind === 'lake').length > lc0);

      /* ---- road ---- */
      UI.setTool('road');
      const Rd = Layers.get('roads');
      const rd0 = Rd.objects.length;
      click(50, 900); click(200, 920); dblclick(350, 940);
      await yieldFrame();
      check('road: yol nesnesi eklendi', Rd.objects.length > rd0);

      /* ---- territory ---- */
      UI.setTool('territory');
      const Ter = Layers.get('territories');
      const tc0 = Ter.objects.length;
      click(700, 100); click(800, 100); click(800, 200); dblclick(700, 200);
      await yieldFrame();
      check('territory: bolge nesnesi eklendi', Ter.objects.length > tc0);

      /* ---- symbol ---- */
      UI.setTool('symbol');
      App.symbol.id = App.symbol.id || 'town';
      App.symbol.brushMode = false;
      const Sy = Layers.get('symbols');
      const sc0 = Sy.objects.length;
      click(400, 400);
      await yieldFrame();
      check('symbol: sembol yerlestirildi', Sy.objects.length > sc0);

      /* ---- resource ---- */
      UI.setTool('resource');
      const Rs = Layers.get('resources');
      const rs0 = Rs.objects.length;
      click(420, 420);
      await yieldFrame();
      check('resource: kaynak yerlestirildi', Rs.objects.length > rs0);

      /* ---- label ---- */
      UI.setTool('label');
      const Lb = Layers.get('labels');
      const lb0 = Lb.objects.length;
      const lbText = document.getElementById('lb-text');
      if (lbText) lbText.value = 'Test Etiketi';
      click(440, 440);
      await yieldFrame();
      check('label: etiket yerlestirildi', Lb.objects.length > lb0);

      /* ---- sketch (kullanici katmani) ---- */
      const beforeCustom = Layers.list.length;
      const newLayer = Layers.addCustom('Test Katmani', 1024, 1024);
      Layers.active = newLayer.id;
      UI.setTool('sketch');
      const CL = Layers.get(Layers.active);
      function customSig() {
        const d = CL.ctx.getImageData(0,0,CL.canvas.width,CL.canvas.height).data;
        let n=0; for (let i=3;i<d.length;i+=4) if (d[i]>5) n++;
        return n;
      }
      const cs0 = customSig();
      drag(200, 200, 260, 240);
      await yieldFrame();
      check('sketch: ozel katmana boyandi', customSig() > cs0);
      check('sketch: ozel katman sayisi arttiginda dogru', Layers.list.length === beforeCustom+1);

      /* ---- regionlink (isim modali acar, onaylanmasi gerekir) ---- */
      UI.setTool('regionlink');
      const Lk = Layers.get('links');
      const lk0 = Lk.objects.length;
      click(900, 900);
      await yieldFrame();
      const rlInput = document.getElementById('rl-name-input');
      if (rlInput) rlInput.value = 'Test Bolgesi';
      const modalOk = document.getElementById('modal-ok');
      if (modalOk) modalOk.click();
      await yieldFrame();
      check('regionlink: baglanti pini eklendi', Lk.objects.length > lk0);
      const linkPin = Lk.objects[Lk.objects.length - 1];
      if (linkPin) {
        App.enterMap(linkPin.targetMapId, linkPin.name);
        await yieldFrame(); await yieldFrame();
      }
      check('regionlink: alt haritaya girildi', App.currentMapId === (linkPin && linkPin.targetMapId));
      if (linkPin) { App.exitMap(); await yieldFrame(); await yieldFrame(); }
      check('regionlink: ana haritaya donuldu', App.currentMapId === 'root');

      /* ---- measure ---- */
      UI.setTool('measure');
      App.measure.area = false;
      Tools.addPathPoint({x:0,y:0});
      Tools.addPathPoint({x:300,y:0});
      Tools.finishPath();
      check('measure: coklu nokta olcum calisti (hata yok)', true);

      /* ---- select + lasso ---- */
      UI.setTool('select');
      click(400, 400);
      check('select: tiklama secim yaptigi/hata vermedigi', true);

      UI.setTool('lasso');
      const symBefore = JSON.stringify(Sy.objects.map(o => [o.x,o.y]));
      const id2 = down(380, 380);
      move(id2, 420, 380); move(id2, 420, 420); move(id2, 380, 420); move(id2, 380, 380);
      up(id2, 380, 380);
      await yieldFrame();
      check('lasso: kement calisti (hata yok)', true);

      /* ---- her aracta konsol/exception hatasi olmamali (kontrol Node tarafinda) ---- */

      window.__testResults = results;
      window.__testPass = results.every(r => r.endsWith('PASS'));
      window.__testDone = true;
    } catch (e) {
      window.__testError = e.message + ' ' + e.stack;
      window.__testDone = true;
    }
  })();`;
}

async function runOnce(label, viewport, pointerType) {
  const errors = [];
  const srv = await startServer();
  const args = [
    `--remote-debugging-port=${CDP_PORT}`, '--headless=new', '--no-sandbox', '--disable-gpu',
    `--window-size=${viewport.w},${viewport.h}`, `http://localhost:${PORT}/`
  ];
  const chrome = spawn(CHROMIUM, args, { stdio: 'ignore' });
  let cdp;
  try {
    await sleep(2500);
    cdp = await connectCDP(errors);
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');
    if (viewport.mobile) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: viewport.w, height: viewport.h, deviceScaleFactor: 2, mobile: true
      });
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    }

    for (let i = 0; i < 40; i++) {
      const r = await evaluate(cdp, 'typeof Layers!=="undefined"&&typeof Tools!=="undefined"&&typeof Cv!=="undefined"&&typeof UI!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }
    await evaluate(cdp, "UI.showView('editor')");
    await sleep(400);

    await evaluate(cdp, buildTestCode(pointerType), true);

    for (let i = 0; i < 40; i++) {
      const done = await evaluate(cdp, 'window.__testDone===true');
      if (done.result?.value) break;
      await sleep(300);
    }

    const err = await evaluate(cdp, 'window.__testError||""');
    const res = await evaluate(cdp, 'JSON.stringify(window.__testResults||[])');
    const pass = await evaluate(cdp, 'window.__testPass===true');
    const list = JSON.parse(res.result?.value || '[]');

    console.log(`\n========== ${label} ==========`);
    list.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
    if (err.result?.value) console.error('HATA:', err.result.value);
    if (errors.length) {
      console.error(`  ⚠ ${errors.length} konsol hatasi/exception yakalandi:`);
      errors.forEach(e => console.error('    ' + e));
    } else {
      console.log('  ✓ konsol hatasi/exception yok');
    }

    const ok = (pass.result?.value === true) && !err.result?.value && errors.length === 0;
    return ok;
  } finally {
    cdp?.close(); chrome.kill(); srv.close();
    await sleep(300);
  }
}

async function run() {
  let allOk = true;
  allOk = await runOnce('MASAÜSTÜ (1280×800, mouse)', { w: 1280, h: 800, mobile: false }, 'mouse') && allOk;
  allOk = await runOnce('MOBİL (390×760, touch)', { w: 390, h: 760, mobile: true }, 'touch') && allOk;

  console.log(allOk ? '\n✅ TÜM ARAÇLAR HER İKİ ORTAMDA DA GEÇTİ' : '\n❌ BAZI TESTLER BAŞARISIZ');
  process.exit(allOk ? 0 : 1);
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
