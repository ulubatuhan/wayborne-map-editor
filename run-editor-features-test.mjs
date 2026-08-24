/**
 * Faz B doğrulama — çok parçalı ölçüm/alan, son kullanılan semboller
 * tepsisi, klavye kısayolları ekranı, kayıt geçmişi önizlemeleri, yol
 * otomatik üretimi, yerleşim otomatik yerleştirme. Diğer test
 * runner'larla aynı CDP iskeletini kullanır (bkz. CLAUDE.md § Tests).
 */
import { execSync, spawn } from 'child_process';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';
import { setTimeout as sleep } from 'timers/promises';

const PORT = 8779, CDP_PORT = 9236;
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
  let cdp;
  try {
    cdp = await connectCDP();
    await cdp.send('Runtime.enable');

    for (let i = 0; i < 40; i++) {
      const r = await evaluate(cdp, 'typeof Layers!=="undefined"&&typeof Tools!=="undefined"&&typeof UI!=="undefined"');
      if (r.result?.value === true) break;
      await sleep(500);
    }

    const testCode = `(async function () {
      try {
        const results = [];
        function check(name, cond) { results.push(name + ': ' + (cond ? 'PASS' : 'FAIL')); }

        Cv.setSize(1024, 1024, false);

        /* ---- 1) çok parçalı ölçüm + alan ---- */
        App.tool = 'measure'; App.measure.area = false;
        Tools.addPathPoint({x:100,y:100});
        Tools.addPathPoint({x:300,y:100});
        Tools.addPathPoint({x:300,y:300});
        Tools.finishPath();
        var Mm = Layers.get('measures');
        var lastM = Mm.objects[Mm.objects.length-1];
        check('coklu nokta olcum eklendi', lastM && lastM.pts.length === 3 && !lastM.closed);
        App.measure.area = true;
        Tools.addPathPoint({x:0,y:0}); Tools.addPathPoint({x:200,y:0});
        Tools.addPathPoint({x:200,y:200}); Tools.addPathPoint({x:0,y:200});
        Tools.finishPath();
        var lastArea = Mm.objects[Mm.objects.length-1];
        var info = Cv.measureLength(lastArea);
        check('alan modu kapali poligon uretti', lastArea.closed === true);
        check('alan hesabi dogru (duz kenar, 200x200=40000)', info.area && Math.abs(info.area.px - 40000) < 1);

        /* ---- 2) son kullanilan semboller ---- */
        localStorage.removeItem(UI.RECENT_SYM_KEY);
        var symDef = Sym.SYMBOLS.castles.items[0];
        UI.pushRecentSymbol(symDef.id);
        check('son kullanilan sembol kaydedildi', UI.loadRecentSymbols()[0] === symDef.id);
        check('tepsi gorunur oldu', document.getElementById('sym-recent-bar').style.display !== 'none');

        /* ---- 3) klavye kisayollari ekrani ---- */
        UI.showShortcuts();
        var modalOpen = !document.getElementById('modal').classList.contains('hidden');
        var wideOk = document.querySelector('.modal-box').classList.contains('wide');
        check('? ekrani acildi ve genis modda', modalOpen && wideOk);
        check('en az 6 kisayol grubu var', document.querySelectorAll('.shortcuts-group').length >= 6);
        document.getElementById('modal-cancel').click();

        /* ---- 4) kayit gecmisi onizlemeleri ---- */
        localStorage.removeItem(Exporter.LIB_KEY);
        Tools.generateLandmass('island', 0.5, 7);
        var libId = Exporter.libSave('Test', null);
        var entry = Exporter.libList()[0];
        check('kayit thumbnail uretti', !!entry.thumb && entry.thumb.indexOf('data:image/jpeg') === 0);
        check('kayit zaman damgasi var', typeof entry.updatedAt === 'number');

        /* ---- 5) yol otomatik uretimi ---- */
        Tools.generateLandmass('continent', 0.5, 42);
        var Rd = Layers.get('roads');
        var beforeRoad = Rd.objects.length;
        Tools.generateRoads(1);
        check('rastgele noktalarla yol uretildi', Rd.objects.length > beforeRoad);

        /* ---- 6) yerlesim otomatik yerlestirme + yol entegrasyonu ---- */
        var Sy = Layers.get('symbols');
        var beforeSettle = Sy.objects.length;
        Tools.autoSettle(5, 2);
        check('yerlesimler eklendi', Sy.objects.length > beforeSettle);
        var newSettles = Sy.objects.slice(beforeSettle);
        var validCats = newSettles.every(function (o) { return Tools.ROAD_SETTLE_CATS[Sym.catOf(o.sym)]; });
        check('yerlesimler gecerli kategoride', validCats);

        var beforeRoad2 = Rd.objects.length;
        Tools.generateRoads(3);
        check('yerlesimlerle yol uretimi calisti', Rd.objects.length > beforeRoad2);

        var c = document.createElement('canvas'); c.width = Cv.W; c.height = Cv.H;
        try { Cv.renderMap(c.getContext('2d'), { includeReference:false, includeLinks:true }); check('tam pipeline renderMap hatasiz', true); }
        catch (e) { check('tam pipeline renderMap hatasiz: ' + e.message, false); }

        /* ---- 7) paylaşım linki (URL hash, sunucu yok) ---- */
        App.currentCanvasName = 'Test Ada';
        var shareUrl = Exporter.buildShareURL({ maxDim: 800, title: 'Test Ada' });
        check('paylasim linki uretildi', shareUrl.indexOf('#d=') >= 0);
        var hashPart = shareUrl.split('#')[1];
        history.replaceState(null, '', '#' + hashPart);
        var parsed = Exporter.parseShareHash();
        check('link geri cozumlendi', !!parsed && parsed.title === 'Test Ada');
        var embedSnippet = Exporter.embedCode(shareUrl, 640, 480);
        check('embed kodu uretildi', embedSnippet.indexOf('<iframe') === 0 && embedSnippet.indexOf('e=1') > 0);
        var sharedOk = UI.tryShowSharedMap();
        await new Promise(function (r) { setTimeout(r, 200); });
        check('paylasim gorunumu acildi', sharedOk === true && !document.getElementById('view-share').classList.contains('hidden'));
        history.replaceState(null, '', location.pathname);

        /* ---- 8) dokunmatik yol bitir/iptal/geri-al eylem çubuğu ---- */
        var tpaBar = document.getElementById('touch-path-actions');
        check('touch-path-actions basta gizli', tpaBar.classList.contains('hidden'));
        App.tool = 'river'; Tools.pathPts = [];
        Tools.addPathPoint({x:10,y:10});
        check('nokta eklenince cubuk gorunur', !tpaBar.classList.contains('hidden'));
        Tools.addPathPoint({x:50,y:10});
        document.getElementById('tpa-undo').click();
        check('tpa-undo son noktayi geri aldi', Tools.pathPts.length === 1);
        document.getElementById('tpa-cancel').click();
        check('tpa-cancel yolu iptal etti ve cubugu gizledi', Tools.pathPts.length === 0 && tpaBar.classList.contains('hidden'));
        Tools.addPathPoint({x:10,y:10}); Tools.addPathPoint({x:50,y:10});
        var riverCountBefore = Layers.get('rivers').objects.length;
        document.getElementById('tpa-finish').click();
        check('tpa-finish yolu bitirdi ve cubugu gizledi', Layers.get('rivers').objects.length === riverCountBefore + 1 && tpaBar.classList.contains('hidden'));

        /* dokunma tutamac isabet yaricapi buyutulmus mu (sembol koseleri,
           deterministik geometri: resizeHandlePositions dondurulmemis
           sembolde tam olarak x±size/2, y±size/2 verir) */
        var beforeR = Tools._lastPointerType;
        var beforeZoom = Cv.zoom; Cv.zoom = 1;
        var testSym = { id:uid(), sym:'castle', x:500, y:500, size:40, rot:0, hue:0, opacity:1 };
        Layers.get('symbols').objects.push(testSym);
        App.selection = { layerId:'symbols', id: testSym.id };
        var cornerPt = { x:500-20+13, y:500-20 }; /* koseden 13px icerde: mouse (8px) kacirir, touch (18px) yakalar */
        Tools._lastPointerType = 'touch';
        var touchHit = Tools.hitTestResizeHandle(cornerPt);
        Tools._lastPointerType = 'mouse';
        var mouseHit = Tools.hitTestResizeHandle(cornerPt);
        Tools._lastPointerType = beforeR; Cv.zoom = beforeZoom;
        Layers.get('symbols').objects.pop();
        check('touch modunda tutamac isabet yaricapi mouse\\'tan genis', !!touchHit && !mouseHit);

        window.__testResults = results;
        window.__testPass = results.every(function (r) { return r.endsWith('PASS'); });
        window.__testDone = true;
      } catch (e) {
        window.__testError = e.message + ' ' + e.stack;
        window.__testDone = true;
      }
    })();`;

    await evaluate(cdp, testCode, true);

    for (let i = 0; i < 30; i++) {
      const done = await evaluate(cdp, 'window.__testDone===true');
      if (done.result?.value) break;
      await sleep(300);
    }

    const err = await evaluate(cdp, 'window.__testError||""');
    if (err.result?.value) { console.error('HATA:', err.result.value); process.exit(1); }

    const res = await evaluate(cdp, 'JSON.stringify(window.__testResults||[])');
    const pass = await evaluate(cdp, 'window.__testPass===true');
    const list = JSON.parse(res.result?.value || '[]');
    console.log('\n========== FAZ B TESTİ ==========');
    list.forEach(l => console.log('  ' + (l.includes('PASS') ? '✓' : '✗') + ' ' + l));
    console.log(pass.result?.value ? '\n✅ TÜM TESTLER GEÇTİ' : '\n❌ BAZI TESTLER BAŞARISIZ');
    process.exit(pass.result?.value ? 0 : 1);

  } finally {
    cdp?.close(); chrome.kill(); srv.close();
  }
}

run().catch(e => { console.error('[FATAL]', e.message); process.exit(1); });
