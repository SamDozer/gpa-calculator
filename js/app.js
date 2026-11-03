/* App shell: boot, header KPIs, tab routing, data menu. One derive() per state change feeds every tab. */
window.App = (function () {
  'use strict';
  var G = window.GPA, UI = window.UI;
  var D = null, current = null, mounted = null;

  var TABS = [
    { id: 'overview', label: 'Overview', mod: function () { return UI.Overview; } },
    { id: 'transcript', label: 'Courses', mod: function () { return UI.Transcript; } },
    { id: 'plan', label: 'Plan', mod: function () { return UI.Plan; } },
    { id: 'projection', label: 'Projection', mod: function () { return UI.Projection; } },
    { id: 'analytics', label: 'Analytics', mod: function () { return UI.Analytics; } },
    { id: 'settings', label: 'Settings', mod: function () { return UI.Settings; } }
  ];

  function derive() {
    var S = Store.get();
    var o = { sn: S.ui.sn, sr: S.ui.sr };
    var tot = G.totals(S), cs = G.creditStatus(S, tot), parts = G.projectParts(S, o, tot);
    D = { S: S, tot: tot, cs: cs, o: o, parts: parts, sems: G.semesterGPAs(S), timeline: G.cumulativeTimeline(S), cfg: S.config, ctx: tot.ctx };
    return D;
  }

  /* ------------------------------------------------------------- header */
  function renderHeader() {
    var S = D.S, now = D.tot.cgpa, fin = D.parts.cgpa, cs = D.cs, hasPlan = D.parts.items.length > 0 || D.parts.unallocated.credits > 0;
    var pct = cs.total ? Math.min(100, 100 * cs.earned / cs.total) : 0;
    var planned = D.parts.plannedCredits;
    var band = G.classify(now, S.config).band;
    var srcNote = (S.mode === 'quick' ? (D.S.attempts.length ? 'baseline + ' + D.S.attempts.length + ' new results' : 'from your baseline') : '≈ ' + UI.f(G.gpaToPct(now, S.config), 1) + '%') + ' · ' + band;
    var k = [
      ['CGPA now', UI.f(now), (S.mode === 'quick' ? '≈ ' + UI.f(G.gpaToPct(now, S.config), 1) + '% · ' : '') + srcNote, ''],
      ['Projected graduating', hasPlan ? UI.f(fin) : '–', hasPlan ? UI.signed(fin - now) + ' at ' + S.ui.sn + '% new / ' + S.ui.sr + '% retake' : 'add a plan to project', fin >= S.ui.target ? 'green' : ''],
      ['Credits', cs.earned + ' / ' + cs.total, cs.remaining + ' to go · ' + UI.num(planned) + ' planned', ''],
      ['German grade (est.)', UI.germanText(now, S), hasPlan ? 'projected ' + UI.germanText(fin, S) : 'Modified Bavarian, N_min=' + S.config.germanMin, '']
    ];
    var html = k.map(function (x, i) {
      return '<div class="kpi"><div class="k">' + x[0] + '</div><div class="v ' + x[3] + '">' + x[1] + '</div><div class="d" title="' + UI.esc(x[2]) + '">' + UI.esc(x[2]) + '</div>' +
        (i === 2 ? '<div class="meter" role="progressbar" aria-valuenow="' + Math.round(pct) + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>' : '') + '</div>';
    }).join('');
    UI.paint(UI.$('#kpis'), html);
    UI.text(UI.$('#who'), [S.meta.name, S.meta.program || S.meta.university, S.mode === 'quick' ? 'quick mode' : 'full transcript'].filter(Boolean).join(' · '));
    UI.$('#btnUndo').disabled = !Store.canUndo(); UI.$('#btnRedo').disabled = !Store.canRedo();
    var badge = { plan: D.cs.remaining > 0 && !D.S.plan.length ? '!' : '' };
    UI.$$('.tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === current);
      var b = badge[t.dataset.tab], span = t.querySelector('.bdg');
      if (b && !span) t.insertAdjacentHTML('beforeend', '<span class="bdg">' + b + '</span>'); else if (!b && span) span.remove();
    });
  }

  function foot() {
    UI.text(UI.$('#foot'), 'Estimates only: not an official document. The repeat-course rule is a model fitted to published CGPAs, not a university regulation; use Settings → Calibration to check it against your own official numbers. Your data never leaves this browser.');
  }

  /* ------------------------------------------------------------- routing */
  function tabDef(id) { return TABS.filter(function (t) { return t.id === id; })[0] || TABS[0]; }
  function go(id, opts) {
    opts = opts || {};
    var def = tabDef(id), view = UI.$('#view');
    if (mounted && mounted.unmount) mounted.unmount();
    UI.destroyCharts();
    current = def.id;
    view.innerHTML = ''; view._html = null;
    mounted = def.mod();
    var root = document.createElement('div'); root.className = 'tabview'; view.appendChild(root);
    mounted.mount(root, D);
    mounted.fill(D);
    var S = Store.get(); if (S.ui.tab !== def.id) { S.ui.tab = def.id; Store.save(); }
    if (location.hash !== '#' + def.id) history.replaceState(null, '', '#' + def.id);
    renderHeader();
    if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function refresh() {
    if (!Store.get()) return showWelcome();
    derive(); renderHeader();
    if (mounted) mounted.fill(D);
  }

  function showWelcome() {
    UI.destroyCharts();
    if (mounted && mounted.unmount) mounted.unmount();
    mounted = null; current = null;
    UI.$('#hdr').hidden = true; UI.$('#foot').textContent = '';
    var view = UI.$('#view'); view.innerHTML = ''; view._html = null;
    UI.Welcome.mount(view);
  }
  function showApp(tab) {
    UI.$('#hdr').hidden = false;
    derive();
    var tabs = UI.$('#tabs');
    tabs.innerHTML = TABS.map(function (t) { return '<button class="tab" data-tab="' + t.id + '">' + t.label + '</button>'; }).join('');
    foot();
    go(tab || Store.get().ui.tab || 'overview');
  }

  /* ------------------------------------------------------------- menu */
  function menuItems() {
    return [
      ['export', 'Download my data (.json)'], ['import', 'Load a saved file…'], ['csv', 'Export courses (.csv)'], ['print', 'Print / save as PDF'],
      ['-'], ['mode', 'Change starting point…'], ['reset', 'Erase everything and start over']
    ];
  }
  function menuAction(a) {
    var S = Store.get();
    if (a === 'export') { UI.download('gpa-profile.json', IO_toJSON(S)); UI.toast('Saved gpa-profile.json. Keep it somewhere private.'); }
    else if (a === 'import') {
      UI.pickFile('.json,application/json', function (txt) {
        try { var p = GPAIO.parseProfile(txt); Store.set(p); showApp('overview'); UI.toast('Profile loaded'); } catch (e) { UI.toast(e.message, 'err'); }
      });
    }
    else if (a === 'csv') UI.download('courses.csv', GPAIO.attemptsToCSV(S), 'text/csv');
    else if (a === 'print') window.print();
    else if (a === 'mode') go('settings');
    else if (a === 'reset') UI.dialog('Erase everything?', '<p class="note">This removes your saved data from this browser. Download a backup first if you want to keep it.</p>', [
      { label: 'Cancel' }, { label: 'Download backup', fn: function () { menuAction('export'); } }, { label: 'Erase', danger: true, fn: function () { Store.clear(); location.hash = ''; } }]);
  }
  function IO_toJSON(S) { return GPAIO.toJSON(S); }

  function boot() {
    UI.loadTheme();
    Store.subscribe(function () { refresh(); });
    var S = Store.load();
    UI.$('#tabs').addEventListener('click', function (e) { var t = e.target.closest('.tab'); if (t) go(t.dataset.tab); });
    UI.$('#btnUndo').onclick = function () { Store.undo(); };
    UI.$('#btnRedo').onclick = function () { Store.redo(); };
    UI.$('#btnTheme').onclick = function () { UI.toggleTheme(); refresh(); };
    var menu = UI.$('#menu');
    menu.innerHTML = menuItems().map(function (m) { return m[0] === '-' ? '<hr>' : '<button data-m="' + m[0] + '">' + m[1] + '</button>'; }).join('');
    UI.$('#btnMenu').onclick = function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; };
    menu.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { menu.hidden = true; menuAction(b.dataset.m); } });
    document.addEventListener('click', function () { menu.hidden = true; });
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) Store.redo(); else Store.undo(); }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); Store.redo(); }
    });
    window.addEventListener('hashchange', function () { var id = location.hash.slice(1); if (Store.get() && id && id !== current) go(id); });
    if (!S) showWelcome(); else showApp(location.hash.slice(1) || null);
    window.I18N && I18N.start();
  }

  return { boot: boot, go: go, refresh: refresh, showApp: showApp, showWelcome: showWelcome, get D() { return D; } };
})();

document.addEventListener('DOMContentLoaded', function () { App.boot(); });
