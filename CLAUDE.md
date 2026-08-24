# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wayborne Map Editor (aka "Cartographer") — a fantasy/medieval map editor. Vanilla JS + Canvas 2D only: no framework, no build step, no bundler, no npm dependencies, no CDN assets. Everything (894 symbols, 34 terrain types, isometric buildings) is generated in code, not loaded from files.

Source comments and UI strings are primarily Turkish (this is a Turkish-authored project with TR/EN i18n built in via `js/ui.js`'s `DICT`). Keep that convention in mind when reading/writing comments.

## Running it locally

There is no build/compile/lint step — it's static files served directly.

```bash
python3 serve.py 8000        # or: python3 -m http.server 8000
# or, if Node is available:
npx http-server . -p 8000 -c-1 -o
```

Then open `http://localhost:8000/`. **Do not open `index.html` via `file://`** — `toDataURL`/`getImageData` (used for the shore effect and PNG export) are blocked by CORS under `file://`.

### Tests

Four Node scripts drive a real headless Chromium over CDP (no Playwright dependency — they speak the
protocol directly via Node's built-in `WebSocket`, and each boots its own static server). Run them from
the repo root with plain `node`; each exits non-zero on failure.

```bash
node run-integration-test.mjs        # 77 assertions: every module, catalog integrity, round-trips
node run-layer-undo-test.mjs         # layer add/delete undo, pixel-level fidelity
node run-fps.mjs                     # frame budget at 1024/2048/4096/8192, idle+pan+zoom
node run-mapgen-test.mjs             # renders 3 landmass templates to /tmp/mapgen-shots for eyeballing
node run-mapgen-features-test.mjs    # continent coverage/determinism, auto-biome, auto-rivers, symbol legend
node run-editor-features-test.mjs    # multi-segment/area measure, recent symbols, shortcuts screen,
                                      # save-history thumbnails, auto-roads, auto-settlements, share links
node run-regions-todo-test.mjs       # Bölgeler tab (political-region list, multi-level map tree,
                                      # jumpToMap, recursive delete), the to-do list, and left/right
                                      # panel collapse
node run-mobile-test.mjs             # mobile core support: no more hard screen-size gate, drawer
                                      # panels default to closed on a narrow viewport, two-finger
                                      # pinch-zoom (via Emulation.setDeviceMetricsOverride)
node run-landgen-test.mjs            # land-generation coverage guarantees, archipelago as separate
                                      # islands, tectonic template removal, river/lake/terrain
                                      # generate-time options, one-time warning, adjustable sea colour,
                                      # Tools.autoBiome async/chunked contract
node run-alltools-test.mjs           # all 19 toolbar tools (landmass/erase/fill/terrain/elevation/
                                      # eyedrop/river/lake/road/territory/symbol/resource/label/sketch/
                                      # regionlink/measure/select/lasso/pan) driven via real dispatched
                                      # pointer events on Cv.view, run once with mouse at desktop size
                                      # and once with touch pointerType under Emulation.setDeviceMetricsOverride
                                      # (mobile), asserting the expected layer/object mutation per tool
                                      # and zero console errors/uncaught exceptions across the whole run
node run-mobile-deep-test.mjs        # deep touch UX at 375/390/430/768px: touch-path-actions bar
                                      # visibility + >=44px targets, a fully keyboard-free workflow
                                      # (draw a river and finish it via tpa-finish, place+select+delete
                                      # a symbol via btn-del — no keydown events at all), and the
                                      # pinch-vs-path-point gesture-conflict retroactive-undo (see below)
node run-export-inspect.mjs          # manual, not asserted: builds a rich test map (biome, elevation
                                      # hillshade, rivers/lake, symbols, territory, a Latin AND an
                                      # Arabic/RTL label) and downloads PNG 1x/2x/4x, SVG, and the
                                      # self-contained HTML viewer through Chrome's real download
                                      # mechanism (Page.setDownloadBehavior) to /tmp/export-inspect —
                                      # CDP's Runtime.evaluate returnByValue chokes on the multi-MB
                                      # base64 strings a naive "capture the blob and return its text"
                                      # approach produces, so don't go back to that; outputs are for
                                      # eyeballing (dimensions, RTL label shaping, self-containment)
```

Two gotchas when writing more of these: **`requestAnimationFrame` is throttled in headless Chrome**, so
benchmark loops must use `setTimeout(0)`; and a Chromium left over from a previous run holds the CDP port,
so the first invocation after one is killed can fail to connect — just run it again.

Anything they don't cover still wants a manual pass: run the server, open the app, confirm
`[WME] hazır — N sembol, tuval 2048×2048` in the console, and exercise the affected tool.

## Architecture

Everything hangs off `window` as a set of singleton modules, each an IIFE assigning to `global.<Name>`. `index.html` loads them via plain `<script>` tags in a load-bearing order (no module system, no dynamic imports):

```
iso.js → catalog.js → catalog2.js → symbols.js → i18n-names.js → names.js → history.js → layers.js → canvas.js → tools.js → export.js → ui.js → app.js
```

This order matters: later files reference globals defined by earlier ones (e.g. `catalog2.js` pushes into `IsoCatalog.ITEMS` created by `catalog.js`; `Layers`, `Cv`, `Tools` etc. are read by `ui.js` and `app.js` at init time).

### App shell (Homepage / Canvas / Tutorial / Community)

`index.html` also contains a top-level app shell wrapping the editor: `#shell-nav` (four tabs) plus `#view-home`/`#view-canvas`/`#view-tutorial`/`#view-community`/`#view-editor`, each a `.shell-view` toggled by `UI.showView(name)` in `js/ui.js` (styling in `css/shell.css`). `App.init()` still runs unconditionally on load and fully initializes the editor (Layers/Cv/UI) — it's just hidden behind `#view-editor.hidden` until the user enters it via the Canvas tab (`display:contents` on `#view-editor` when active, so the editor's pre-existing viewport-relative absolute positioning is untouched by the wrapper). Switching into the editor calls `Cv.resize(); Cv.fit();` on the next frame, since the canvas reports 0×0 while hidden. There's no backend: the Canvas tab's "saved canvases" list is `localStorage` (`Exporter.LIB_KEY`, via `Exporter.libList/libSave/libOpen/libDelete`), separate from the `.json` export/import which remains the real backup/transfer path. `Exporter.buildProjectData()`/`applyProjectData(d)` are the shared serialize/deserialize core used by both the file-based flow and the `localStorage` library. `Exporter.autoSave()` is the silent counterpart of the "Save" button's `libSave` call (no `.json` download, no toast) — it fires from `UI.showView()` whenever the user navigates away from the editor view, and on a `setInterval` every 10 minutes while the editor view is active; both are gated on `History.canUndo()` so an untouched blank canvas never clutters the library.

### RTL languages

`UI.RTL_LANGS` lists the right-to-left UI languages (`ar` ships; `fa`/`he`/`ur` are data-only additions), and
`applyLang()` stamps `document.documentElement.dir`. The layout mirrors on its own because the direction-sensitive
CSS uses **logical** properties (`border-inline-start`, `padding-inline-end`, `inset-inline-end`, `text-align:start`)
— the `#workspace` grid reverses its columns under `dir="rtl"`, so the tool rail moves to the right and the options
panel to the left. Canvas rendering is coordinate math and is unaffected. `UI.t()` falls back to **English** (not
Turkish) for any non-`tr` language, so a partially translated language degrades sensibly — this is a safety net for
whichever new key someone forgets to translate next, not the normal state: as of this writing all 395 `DICT` keys
are filled in for all 11 languages (verified by a permanent `run-integration-test.mjs` assertion that compares each
non-`tr`/`en` language's translation of a representative key set against the English fallback value, catching a
silently-dropped translation the moment it regresses).

The canvas label engine needed a real fix for this, independent of UI language: `drawLabel` positions glyphs
**one at a time** to implement letter-spacing, arc curvature and path-following, which destroys Arabic/Persian
joining forms and bidi order and breaks Indic ligatures. `Cv.isComplexText()` / `Cv.isRTLText()` detect those
scripts and switch the label to a **single shaped run** (`ctx.direction` set, tracking and curve dropped, an
on-path label placed at the path midpoint tangent); `measureLabel` likewise measures the whole string, since
summing per-character widths comes out ~26% too wide for connected scripts. `labelSVG` mirrors this with
`direction="rtl"`, `letter-spacing="0"` and no curved `textPath`. Latin/Cyrillic labels take the original
per-character path untouched.


### Screen support

Shell pages scale fluidly from 360px phones to 4K TVs via `clamp()` typography in `shell.css` (no per-device layouts); under 640px card grids collapse to one column and forms go full-width. The editor itself is responsive down to phone widths (core-tier mobile support): its three-column `#workspace` grid (`--panel-l` + `1fr` + `--panel-r`) still drives the canvas column negative below ~1024px, so below `UI.MOBILE_BREAKPOINT` (860px, `main.css`) `#workspace` collapses to a single column and `#left-panel`/`#right-panel` become `position:fixed` drawers that slide over the canvas instead of sitting beside it, reusing the same `.collapsed-left`/`.collapsed-right` classes and kolçak (edge-tab) toggle buttons that desktop uses to hide/show the panels (`UI.togglePanel(side)`) — on desktop those classes zero out `--panel-l`/`--panel-r`; under the mobile media query they instead `translateX` the drawer off-screen (mirrored for `html[dir="rtl"]`). `UI.applyMobileDefaults()` (called once, the first time `showView('editor')` runs) starts both drawers closed on a narrow viewport so the canvas is visible immediately, without re-forcing that choice once the user has toggled a panel manually. There is no more hard gate: the old `EDITOR_MIN_W`/`EDITOR_MIN_H`/`UI.editorFits()`/`#view-narrow` "screen too small" door was removed entirely in favour of this responsive layout. Touch has basic gestures: pointer events and double-tap path-finish already worked; two-finger pinch-to-zoom/pan is now handled directly in `Tools.onDown`/`onMove`/`onUp` (`Tools._touches`/`_pinch`, keyed by `pointerId`) — a second simultaneous touch cleanly finishes whatever single-touch action the first finger had started (via a bare `this.onUp()` call) before switching into pinch mode, so a stray draw stroke can't leak into a pinch gesture; `Cv.view.setPointerCapture` is wrapped in `try/catch` since it can throw `NotFoundError` for a pointer that's already been released. `#view` still sets `touch-action:none` so the browser's own scroll/zoom gestures don't fight this custom handling.

Deep touch UX beyond the core gestures above: multi-point path tools (river/road/territory/lake/measure) and a lifted lasso selection (`Tools.floating`) used to be finishable/cancellable/undoable only via Enter/Escape/Delete — a real dead end on a keyboardless touch device. `#touch-path-actions` (`css/canvas.css`, floating pill over the canvas) surfaces the same three actions as tap targets: `UI.finishOrCommit()`/`cancelOrDeselect()`/`undoPointOrDelete()` are the single shared implementations the keydown handler *and* the `#tpa-finish`/`#tpa-cancel`/`#tpa-undo` buttons both call, so keyboard and touch can never drift out of sync. `UI.refreshTouchActions()` toggles the bar's visibility and is called from every `Tools` mutation that changes `pathPts`/`floating` state (`addPathPoint`, `finishPath`, `cancelPath`, `undoPathPoint`, `liftSelection`, `commitFloating`, `cancelFloating`, `deleteFloating`). Separately, `Tools._lastPointerType` (set on every `onDown`) widens the hit-test radius for the small bezier-handle (`hitTestHandle`) and symbol-resize-corner (`hitTestResizeHandle`) targets when the active pointer is `'touch'` — those targets are ~16-18px in mouse mode, well under a fingertip.

One more touch-specific fix lives in the same area: a path tool (river/road/territory/lake/measure) adds a point on the *first* finger's `pointerdown`, before it's known whether a second finger is about to land and turn the gesture into a pinch-zoom — so an intentional two-finger pinch starting while mid-path-draw used to leave behind a stray point from the first finger's touchdown. `Tools._lastTouchPoint` (`{tool, ts}`, set in `addPathPoint` only for touch) lets the `tids.length>=2` branch in `onDown` retroactively pop that point back off, but only if it was added <250ms ago for the *same* tool — a deliberate single tap followed later by an unrelated pinch is left untouched. This adds no latency to normal single-finger tapping; it only corrects the rare case reactively once a second finger actually arrives.

Chrome icons are monochrome inline SVG (`.ico-svg`, `stroke="currentColor"`) rather than emoji — emoji glyphs like 🌐/🏠/📏 render in full colour on macOS and Windows and break the brass palette. Where a text glyph is used for an emoji-capable codepoint (⛰, ⛏) it carries U+FE0E to force text presentation.

Module responsibilities:
- **`app.js`** — `App`, the single mutable state object (current tool, brush/terrain/symbol/river/road/label/scale/windrose settings). `App.init()` is the entry point, wired to `DOMContentLoaded`.
- **`layers.js`** — `Layers` (the 13 built-in raster/vector layers, plus up to `CUSTOM_MAX` user-added ones — see below — land, terrain, elevation, territories, rivers, roads, symbols, labels, etc.) and `Terrain` (34 terrain type definitions: base/dark/mark colors, procedural scatter density, terrain-aware shore coloring, selectable shore style — sandy/rocky/reef). Terrain texture is generated per-brush-stroke, not tiled — no two strokes look identical. The `elevation` layer stores raw grayscale height (painted in `tools.js` via lighten/darken brush compositing); `Cv.buildElevationEffect()` derives a cached hillshade + contour-line overlay from it at render time (same lazy-rebuild-on-dirty pattern as the shore effect). Terrain includes an "interior" subset (`woodfloor`/`stonefloor`/`strawfloor`/`carpetfloor`/`cavefloor`/`stonewall`) meant for the region-link sub-map workflow below — no separate mechanic, just paint a room shape with the land brush and texture it with these instead of an outdoor terrain (turn off the "Kıyı" shore-glow checkbox for interiors, since it's styled for coastlines).

### User-added layers

The 13 layers in `DEFS` are fixed, but `Layers.addCustom(name, w, h)` inserts an extra `type:'raster'` layer
(`custom:true`, `id:'usr_…'`) directly above the active one, up to `Layers.CUSTOM_MAX` (12). These need no
rendering code of their own: `renderMap`'s generic `l.type === 'raster'` branch already draws any raster layer,
and visibility/lock/opacity/blend/reordering all come from the existing layer machinery. `Layers.name()` returns
the user's own string for a custom layer instead of going through `i18nName`, so a hand-typed name survives a
language switch. `serialize()` carries `custom`/`name`; `deserialize()` **creates** custom layers found in the
saved data (built-ins are matched by id, so an unknown id used to be silently dropped) and removes any custom
layer the incoming document doesn't have — the active document must end up exactly matching what was saved.

The `sketch` tool paints into them (`Tools.startRaster(activeId, p, 'sketch')`, a soft round dab honouring
`App.sketch.{color,size,hardness,opacity,eraser}`), and it refuses to run unless the active layer is a custom
one — free paint on `landmass` or `elevation` would corrupt what those layers mean (a land mask, a grayscale
height field). Adding and deleting layers **is** undoable via dedicated `layerAdd`/`layerRemove` History entries
(`Layers.snapshotLayer`/`restoreLayer`/`removeById`) — separate from `pushMeta`, which only round-trips
id/visible/locked/opacity/blend and can't resurrect a deleted layer. Deletion is still confirm-gated since it's
destructive within the session even though it's now reversible via Ctrl+Z.

### Multi-map (region links) and interior maps

`App.enterMap(targetId, label)`/`App.exitMap()` (`app.js`) swap the *entire* active `Layers` document for another one keyed in `App.maps{}` — a region-link pin (Tools' `regionlink` tool, `links` vector layer) just calls `enterMap` with a fresh `uid()` as `targetMapId` on first placement. Each sub-map is a fully independent document (own layers, own undo history, `History.clear()`'d on switch) round-tripped through `App._snapshotLayers()` (JSON-deep-clone — the vector `.objects` arrays must never be shared by reference between two "documents", see the aliasing bug this fixed earlier). `App.mapStack` is the breadcrumb trail back to the parent map. Both switches are **asynchronous** (`Layers.deserialize()` returns a Promise, since raster layers decode through `Image`), and `currentMapId` is only updated once that promise resolves — so a second switch fired mid-flight would snapshot the *incoming* document under the *outgoing* map's id and silently destroy the parent's content. `App._switching` guards against exactly that: `enterMap`/`exitMap` bail out while a switch is in flight and clear the flag in a terminal `.then()` (after a `.catch()`, so a failed deserialize can't wedge the editor). This same mechanism is intentionally reused for interior maps (a room/hall behind a building symbol) — there is no dedicated "interior" mode; it's just another sub-map, populated with the `furniture` symbol category (bed/table/chair/chest/bookshelf/fireplace/cauldron/cabinet/crate/rug/window/door/sconce/weapon rack/throne/anvil) and the interior terrain subset above.

`App.buildMapTree()` walks the full hierarchy (root + every nested region-link) by following each visited map's `links` layer objects, snapshotting the *current* map first so the tree reflects live state; a `visited{}` guard makes it cycle-safe. `App.jumpToMap(targetId)` uses that tree to jump to any node directly (not just one level like `enterMap`), rebuilding `App.mapStack` from the root→target path. `App.deleteMapRecursive(id)` (also cycle-guarded) is called when a region-link pin is deleted (`Tools.deleteSelection()`), so orphaned nested sub-maps under it are cleaned up too rather than leaking unreachably in `App.maps`. All three read `App.maps[id]` snapshots, which is why `Layers.deserialize()` assigning `l.objects = e.objects` **by reference** (no clone) mattered here: `App._blankSnapshot` is built once in `init()`, so passing it straight into `deserialize()` for every never-before-visited sub-map used to hand every one of them the *same* `links`/vector arrays — a push into one blank sub-map's objects silently mutated all the others (and could fabricate a link cycle). `App._cloneBlank()` (a JSON deep-clone of `_blankSnapshot`) is used everywhere a blank document is handed to `deserialize()` instead.

The right panel's **Bölgeler** ("Regions") tab (`ui.js`'s `refreshRegionsPanel`/`refreshTerritoryList`/`refreshMapTree`) surfaces both of these read-models: named `territories` objects (click to select + pan to centroid) and the map tree (click to `jumpToMap`, current map highlighted). A separate **Görevler** ("To-do") tab is a flat, session-wide checklist backed by a single `localStorage` key (`UI.TODO_KEY`, `{id,text,done,createdAt}[]`) — same upsert/full-rewrite pattern as `Exporter.libList`, unrelated to any specific map/project.
- **`canvas.js`** — `Cv` (viewport: zoom/pan/fit/minimap, main render loop, shore glow effect, river/road/territory/label rendering, interactive scale bar) and `Geo` (path sampling/geometry helpers, including `sampleBezier`/`autoHandle` for optional per-point bezier tangent handles on rivers/roads/lakes/territories — a path with no `handles` renders exactly as the original Catmull-Rom `Geo.sample`, so old saves are unaffected). A river/road path can cross the land/sea boundary any number of times; `Cv._findAllSeaCrossings`/`_findAllSeaCrossingsCached` find every crossing (not just one), each gets its own river-mouth "plume" effect, and `drawRiver` no longer truncates the path itself — the land/sea clip is applied once, pixel-exact, by the `destination-in` mask in `renderMap`'s `'rivers'` branch, so it's correct regardless of how many times the river weaves in and out of land.
- **`tools.js`** — `Tools`, the input/tool state machine (land brush, sea eraser, terrain paint, elevation raise/lower brush, symbol placement, river/road/territory path drawing, label placement, texture eyedropper, selection, right-click pan) plus `Eyedropper`. This is where mouse/keyboard events become layer edits. Selected symbols show 4 draggable corner handles (`resizeHandlePositions`/`hitTestResizeHandle`/`drawResizeHandles`) for uniform-scale resize by dragging, matching common design-tool UX; the drag is resolved in the symbol's local (rotation-compensated) space so it also works correctly on rotated symbols. The lasso/floating-selection lift (`liftSelection`/`LASSO_VECTOR_LAYERS`) also picks up point-based vector objects (symbols, resources, labels, map-links) whose position falls inside the lasso polygon, not just the raster layers — so anything sitting on a lifted piece of land moves with it; committed as one atomic `History.pushCombo` step. `Tools.generateLandmass(template, roughness, seed, opts)` has three templates (continent/island/archipelago — the earlier "tectonic" fault-line template was removed by request) and a **coverage-guarantee retry loop**: it builds seeds on a cheap N×N grid, measures the estimated land fraction, and — if short of the per-template floor (continent ≥40%, island/archipelago ≥20% of the canvas) — regrows the seed radii/count and retries (up to 6 attempts, keeping the best-covered attempt seen, since a larger/more-crowded archipelago layout doesn't always beat a smaller one once rejection-sampled island placement starts failing). Archipelago seeds are placed via rejection sampling with a minimum-separation factor so islands stay genuinely disjoint (`run-landgen-test.mjs` asserts ≥3 disconnected components via flood fill) rather than fusing into one blob as island-radius grows. `opts.withElevation` additionally paints a grayscale elevation layer from that same height grid (`Tools._paintGeneratedElevation`) in the encoding `autoBiome`/`generateRivers` expect (R=G=B gray level, alpha = signal strength) — the "Üret" button's Nehir/Göl/Arazi checkboxes (`App.landgen.rivers/lakes/terrain`) turn this on and chain `Tools.generateRivers`/`Tools.autoLakes`/`Tools.autoBiome` off the same seed after the landmass finishes, each still its own separate undo step. `Tools.autoLakes` samples the landmass layer for interior points whose surrounding margin is entirely land and drops 1-3 irregular closed polygons there as ordinary `kind:'lake'` objects in the `rivers` layer. The "replaces your land" warning modal (`UI.LANDGEN_WARNED_KEY` in `localStorage`) now shows only once ever, not on every click. Sea colour is a first-class setting (`App.sea.color` / `Cv.seaColor`, round-tripped in project saves) — `Cv.setSeaColor()` repaints the existing ocean tile canvas in place (a `CanvasPattern` tracks its source canvas, so no new pattern object is needed) and the render-time depth gradient derives its rgba stops from the same colour instead of a hardcoded blue.

Two perf fixes keep `generateLandmass` from stalling the tab on slower hardware: the per-attempt fBm noise texture (~48k cells) used to be recomputed on every coverage-retry-loop iteration even though it doesn't depend on `boost` — it's now built **once** before the loop and reused; and the post-loop CSS-blur+threshold pass (previously uncapped at the full canvas size when that size was ≤2048) now always runs at a fixed `GEN_MAX` of 1024px and upscales, since the source data is already limited to a 220-cell noise grid so the extra resolution bought nothing but cost — this was the single largest contributor (1.2–4.5s under simulated throttling) to a 2048² generation. `Tools.autoBiome` is **asynchronous** (returns a Promise) and processes its row loop in ~60ms time-boxed chunks yielding via `setTimeout(0)` between them, since its per-cell `Terrain.scatter` calls were the other multi-second synchronous block; callers (`runLandgen`'s checkbox-driven pipeline and the standalone "Biyom ata" button, both in `ui.js`) disable and relabel the trigger button (`⏳ …`) for the duration and chain the remaining steps (`generateRivers`/`autoLakes`) with their own `yieldFrame()` pause in between, so a full land+river+lake+terrain generation runs as a series of short bursts instead of one multi-second freeze. The same rewrite fixed a visual complaint independent of performance: biome "moisture" used to be an independent `Math.random()`-equivalent draw **per grid cell**, so neighbouring cells with near-identical elevation/latitude could still land in unrelated biomes — the result read as a hard-edged checkerboard mosaic rather than a map. Moisture is now sampled from a low-frequency `noise.fbm()` field (spatially correlated, so adjacent cells agree) and each stamp's centre gets a small random jitter (breaks the perfect grid alignment), producing soft, organic-looking biome bands instead.

A wide visual scan across seeds/templates (render land+elevation+`autoBiome`, then actually look at the screenshots) turned up one remaining flaw in `pickBiome`: the `e > 0.36` (mid-elevation) tier below the taiga-latitude cutoff resolved to a single, unconditional `'highland'` regardless of moisture — every other tier varies with `moist`, so this one stood out as a large, texture-poor grey/brown patch with no internal variety. The fix adds the same moisture axis there: `moist < 0.22` → `'badlands'`, `< 0.55` → `'highland'`, else `'steppe'` — both `badlands` and `steppe` already existed as full `TERRAIN` catalog entries (`js/layers.js`) but were unreachable from `autoBiome` before this, so the fix is pure reuse, no new art. Determinism note for anyone touching this again: `Terrain.scatter`'s individual paint dabs use plain unseeded `Math.random()` by design (texture should never repeat identically stroke-to-stroke), so two `autoBiome(seed)` calls with the same seed are **not** pixel-identical — what must match, and does, is the sequence of `(biome, cx, cy)` cells `Terrain.scatter` gets called with, i.e. the actual biome layout (`run-landgen-test.mjs` asserts this by temporarily wrapping `Terrain.scatter` and diffing the call log between two runs, not by diffing canvas pixels).
- **`iso.js`** — the isometric building engine (`Iso.Scene`, `Iso.MAT`). Parallel projection `sx=(x-y)*0.866, sy=(x+y)*0.5-z`; solids are depth-sorted with the painter's algorithm. Produces `Sym.part()`-style path data normalized to a 0–100 box.
- **`catalog.js` / `catalog2.js`** — composite isometric buildings built on top of `Iso.Scene`, organized by theme (`catalog2.js` loads second and pushes additional items + material variants into the same `IsoCatalog.ITEMS` table). Civic buildings (inn/tavern/library/shrine/well/stall/smithy/bakery) are generated from a shared `CIVIC_CULTURE` (5 regional material/roof signatures) × `CIVIC_TIER` (5 wealth levels, 1–5, driving scale + wing/accent additions) grid in `catalog2.js` — `civicLabel()` builds the `"<Bina> · <katman>.<isim> · <kültür>"` display name from the pair, so adding a new civic building type is one `CIVIC_CULTURE.forEach(cul => CIVIC_TIER.forEach(tier => reg(...)))` block reusing an existing scene-generator function shape. House variants (`ivh_*`, 9 materials × 6 roofs = 54) predate this grid and are labeled via a simpler `HOUSE_WALL`/`HOUSE_ROOF` → tier/culture mapping (`TIER_NAMES`) rather than driving geometry from it.

A gap analysis for "can you actually assemble a city block from symbols alone" (grepping every `reg('<cat>', 'i...` call across both catalog files) found the isometric catalog already remarkably deep for this — walls, gates (`iwl_gate_*`/`ik_freegate_*`), bridges (stone/wood/rope/per-culture), wells, fountains, market stalls, smithies, bakeries, inns, taverns, libraries, watch posts, gallows, campfires, mills, granaries — the one real hole was street/plaza-level furniture: no standalone (non-ruined) monument, no street lamp, no public bench. `catalog2.js`'s `misc` bucket now has `id_statue`/`id_lamppost`/`id_bench` filling exactly that, built with the same small-prop pattern as `id_gallows`/`id_campfire` (a handful of `box`/`cyl`/`dome` calls, no new `Iso.Scene` primitives needed). Adding a catalog item bumps the total symbol count everywhere it's hardcoded: `run-integration-test.mjs`'s Arabic-coverage assertion (`total === N && withAr === N`) and the count mentioned in this file and in `i18n-names.js`'s header comment — grep for the old number across all three when adding more.
- **`symbols.js`** — `Sym`, the flat (non-isometric) symbol index (~200+ ink-style symbols as `{d, f, s, lw, tr}` Path2D parts in a 0–100 coordinate space centered at (50,50)), plus custom PNG symbol upload/registration. The same path data draws to canvas via `Path2D` and is written verbatim as `<path>` in SVG export — SVG output is genuinely vector, not embedded bitmap.
- **`names.js`** — `Names`: syllable-based fantasy place-name generator. Seven cultures (western / med / north / east / stone / sylvan / savage), each with its own onset / nucleus / coda inventory and a `birlesik` flag deciding compound (`Ashford`) vs. flowing (`Mithriel`) construction; eight feature types add a TR/EN suffix. No dictionary, no external data. `Names.generate(culture, feature, lang, seed)` is seeded (same seed → same name) so output is testable.
- **`i18n-names.js`** — `NameI18N` lookup table + `i18nName(key, tr, en, lang)` helper. Display names for symbols/buildings/terrain/categories/label presets/layers live as `tr`/`en` fields on their own data structures (`symbols.js`, `catalog.js`/`catalog2.js`, `layers.js`, `canvas.js`); this table supplies the other 8 UI languages by id/key, falling back to English when a key or language is missing. `ui.js`'s eleven-language switcher (see `DICT` in `ui.js`) covers chrome strings directly — this module only covers catalog/data names. Arabic (`ar`) covers **all 894 catalog symbol names** (in addition to the structural set: 34 terrain types, symbol categories, label presets, the 13 layer names, typeface families, name-generator cultures) — most catalog names are combinatorial (culture × tier × building-type, material × roof grids in `catalog2.js`'s `civicLabel()`/`HOUSE_WALL`/`HOUSE_ROOF`), so the 894 English names decompose into ~575 unique `' · '`-joined segments; those were translated once and recomposed per id, the same "shared vocabulary, not hand-written one by one" approach the other 8 languages already used for this table.
- **`history.js`** — `History`, 50-step undo/redo. Brush strokes are stored as bbox-cropped PNG patches (not full layer copies), so even an 8192² canvas keeps undo memory small; `rasterMulti` lets one undo step atomically touch multiple layers (e.g. the sea eraser clears both land and terrain); `combo` does the same for a raster+vector mix in one atomic step (e.g. the lasso tool moving painted land together with the symbols/resources/labels/links sitting on it).
- **`export.js`** — `Exporter` and `downloadFile`: PNG/SVG export and `.json` project save/load, plus three share/print paths. `Exporter.html(opts)` writes a **single self-contained `.html`**: the map as a data-URI image plus an inline pan/zoom viewer (`_viewerHTML`) — no external requests, no library, so a map can be emailed and double-clicked. `Exporter.print(opts)` scales the map into the printable area of a chosen page (A5–Tabloid, orientation, margin, DPI), writes it into a hidden iframe with an `@page` rule and calls `print()` on it — the browser's "Save as PDF" produces the PDF, so there is no PDF library in the repo; a hidden iframe rather than a popup avoids popup blockers. `Exporter.buildShareURL(opts)` is a third, backend-free share path: it renders a downscaled JPEG and embeds it **directly in the URL hash** (`#d=<base64url>&t=<title>&w=&h=&f=jpeg`) — the hash never reaches a server, so this static site can serve as its own no-backend viewer host. `UI.tryShowSharedMap()` (called from `UI.initShell()` before the default `showView('home')`) detects `#d=` on load and swaps in `#view-share`, a standalone pan/zoom viewer (`UI.bindShareViewer()`, mirroring `_viewerHTML`'s vanilla-JS pan/zoom) instead of the normal shell; an `&e=1` flag additionally hides `#shell-nav` for clean `<iframe>` embedding (`Exporter.embedCode()` appends this automatically). `png`, `html`, `print` and `buildShareURL` all share `Exporter.renderToCanvas(w, h)`, the single scaled `renderMap` path (grid included).
- **`ui.js`** — `UI`: panels, the TR/EN `DICT` i18n table, the layer list, symbol library browser, label presets, scale bar controls, keyboard shortcut bindings. The left tool rail is split into **five functional groups** (`grp_navigate` / `grp_terrain` / `grp_water` / `grp_markers` / `grp_regions`) over a 3-column grid; a group whose count is not a multiple of 3 centres its lone trailing tool via `.tool-grid > .tool:last-child:nth-child(3n+1){grid-column:2}`, so `grp_markers`'s four tools read as deliberate rather than ragged; the markup lives in `index.html` as `.tool-group > .tool-group-label + .tool-grid`, and `TUTORIAL_GROUPS` in `ui.js` mirrors the exact same grouping and order so the Rehber page teaches the layout the user actually sees. Tool buttons must keep their `.tool` class and `data-tool` attribute — `bindTools`/`setTool` bind through `querySelectorAll('.tool')`, so wrapping them in group containers is safe but renaming is not.

### Adding a new symbol

Add to the relevant category's `items` array in `js/symbols.js`:
```js
{ id, tr, en, parts: [part('M...', 'fill', 'ink', 3)] }
```
Coordinate space is 0–100, centered at (50,50).

### Key data-flow points

- User input → `Tools` mutates `App.*` settings and/or writes into `Layers` (raster patches or vector object arrays) → `History` snapshots the change → `Cv` re-renders from `Layers` state.
- Canvas defaults to 2048×2048 at `App.init()`, but size is per-project: `Exporter.newProject(w, h, name)` (called from the Canvas tab's new-canvas form) accepts independent width/height.
- Why Canvas 2D and not WebGL: raster layers are kept full-resolution in offscreen canvases and composited to screen with a single `drawImage` (browser already GPU-accelerates this); WebGL would add per-stroke shader cost and complicate the `getImageData`-based shore thresholding and SVG export.
