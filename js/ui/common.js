/* Shared UI helpers: formatting, escaping, focus-safe repainting, charts, toasts, dialogs. */
window.UI = (function () {
  'use strict';
  var G = window.GPA;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return G.esc(s == null ? '' : s); }
  function f(x, d) { return (x == null || !isFinite(x)) ? '–' : (+x).toFixed(d == null ? 3 : d); }
  function signed(x, d) { return (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(d == null ? 3 : d); }
  function num(x) { return Math.round(x * 100) / 100; }
  function badge(L) { return '<span class="g g' + L + '">' + (L === 'AB' ? '∅' : L) + '</span>'; }

  /* ------------------------------------------------ colours, theme */
  function colors() {
    var cs = getComputedStyle(document.documentElement), g = function (n) { return cs.getPropertyValue(n).trim(); };
    return { green: g('--green'), blue: g('--blue'), amber: g('--amber'), red: g('--red'), slate: g('--slate'), ink: g('--ink'),
      ink2: g('--ink2'), grid: g('--grid'), line: g('--line'), purple: g('--purple'), card: g('--card'), sand: '#EBC77A' };
  }
  function alpha(hex, a) {
    if (hex.indexOf('rgb') === 0 || hex.charAt(0) !== '#') return hex;
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  var THEME_KEY = 'gpa-calculator:theme';
  function applyTheme(t) { if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
  function loadTheme() { try { applyTheme(localStorage.getItem(THEME_KEY)); } catch (e) {} }
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    var dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    var next = dark ? 'light' : 'dark';
    applyTheme(next); try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    destroyCharts();
  }

  /* ------------------------------------------------ focus-safe repaint */
  function fk(el) { return el && el.dataset && (el.dataset.fk || el.dataset.path); }
  function keepFocus(fn) {
    var a = document.activeElement, key = fk(a), s = null, e = null;
    if (key && a.setSelectionRange) { try { s = a.selectionStart; e = a.selectionEnd; } catch (x) {} }
    fn();
    if (key) {
      var n = document.querySelector('[data-fk="' + key + '"],[data-path="' + key + '"]');
      if (n && n !== a) { n.focus(); if (s != null && n.setSelectionRange) { try { n.setSelectionRange(s, e); } catch (x) {} } }
    }
  }
  function paint(el, html) { if (el && el._html !== html) { el._html = html; keepFocus(function () { el.innerHTML = html; }); } }
  function text(el, t) { if (el && el.textContent !== t) el.textContent = t; }

  /* ------------------------------------------------ events */
  /** Delegated bindings on a container. map.click[act](el, ev), plus generic [data-path] inputs. */
  function wire(root, map) {
    map = map || {};
    root.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-act]');
      if (t && root.contains(t) && map[t.dataset.act]) map[t.dataset.act](t, ev);
    });
    function onField(ev) {
      var t = ev.target;
      if (t.dataset && t.dataset.path) {
        var isCommit = (t.type === 'checkbox' || t.tagName === 'SELECT');
        if ((ev.type === 'change') !== isCommit && t.type !== 'range') return;
        setField(t);
      } else if (t.dataset && t.dataset.on && map[t.dataset.on]) map[t.dataset.on](t, ev);
    }
    root.addEventListener('input', onField);
    root.addEventListener('change', onField);
    root.addEventListener('dragstart', function (ev) { if (map.dragstart) map.dragstart(ev); });
    root.addEventListener('dragover', function (ev) { if (map.dragover) map.dragover(ev); });
    root.addEventListener('dragleave', function (ev) { if (map.dragleave) map.dragleave(ev); });
    root.addEventListener('drop', function (ev) { if (map.drop) map.drop(ev); });
    root.addEventListener('dragend', function (ev) { if (map.dragend) map.dragend(ev); });
  }
  function setField(t) {
    var type = t.dataset.type || 'str', v;
    if (t.type === 'checkbox') v = t.checked;
    else if (type === 'num' || type === 'int') { v = parseFloat(t.value); if (isNaN(v)) return; if (type === 'int') v = Math.round(v); }
    else if (type === 'numnull') { v = t.value.trim() === '' ? null : parseFloat(t.value); if (v !== null && isNaN(v)) return; }
    else v = t.value;
    if (t.dataset.min != null && typeof v === 'number') v = Math.max(+t.dataset.min, v);
    if (t.dataset.max != null && typeof v === 'number') v = Math.min(+t.dataset.max, v);
    Store.update(function () { Store.setPath(t.dataset.path, v); });
  }
  /** Push profile values into bound inputs that are part of the static page skeleton (skips the focused one). */
  function syncFields(root, S) {
    $$('[data-path]', root).forEach(function (inp) {
      if (document.activeElement === inp) return;
      var parts = inp.dataset.path.split('.'), v = S;
      for (var i = 0; i < parts.length && v != null; i++) v = v[parts[i]];
      if (inp.type === 'checkbox') { if (inp.checked !== !!v) inp.checked = !!v; }
      else { var sv = v == null ? '' : String(v); if (inp.value !== sv) inp.value = sv; }
    });
  }
  /** <input> html bound to a profile path. */
  function field(path, val, o) {
    o = o || {};
    var a = ' data-path="' + path + '" data-type="' + (o.type || 'num') + '"';
    if (o.min != null) a += ' min="' + o.min + '" data-min="' + o.min + '"';
    if (o.max != null) a += ' max="' + o.max + '" data-max="' + o.max + '"';
    if (o.step != null) a += ' step="' + o.step + '"';
    if (o.ph != null) a += ' placeholder="' + esc(o.ph) + '"';
    if (o.list) a += ' list="' + o.list + '"';
    if (o.label) a += ' aria-label="' + esc(o.label) + '"';
    if (o.style) a += ' style="' + o.style + '"';
    var t = o.html || (o.type === 'str' || o.type === 'text' ? 'text' : 'number');
    return '<input type="' + t + '"' + a + ' value="' + (val == null ? '' : esc(val)) + '">';
  }
  function select(path, val, options, o) {
    o = o || {};
    return '<select data-path="' + path + '" data-type="' + (o.type || 'str') + '"' + (o.label ? ' aria-label="' + esc(o.label) + '"' : '') + '>' +
      options.map(function (x) {
        var v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x;
        return '<option value="' + esc(v) + '"' + (String(v) === String(val) ? ' selected' : '') + '>' + esc(l) + '</option>';
      }).join('') + '</select>';
  }

  /* ------------------------------------------------ charts */
  var charts = {};
  function chartTheme() {
    if (!window.Chart) return;
    var c = colors();
    Chart.defaults.font.family = "'IBM Plex Mono', monospace";
    Chart.defaults.color = c.ink2; Chart.defaults.borderColor = c.grid;
  }
  function chart(id, type, data, options) {
    var el = document.getElementById(id);
    if (!el || !window.Chart) return null;
    chartTheme();
    var c = charts[id];
    if (c && c.canvas === el) { c.data = data; c.options = options; c.update('none'); return c; }
    if (c) c.destroy();
    charts[id] = new Chart(el, { type: type, data: data, options: options });
    return charts[id];
  }
  function destroyCharts() { Object.keys(charts).forEach(function (k) { charts[k].destroy(); }); charts = {}; }
  /** Axis bounds from data, so projections never clip. */
  function axis(values, o) {
    o = o || {};
    var v = values.filter(function (x) { return x != null && isFinite(x); });
    if (!v.length) return { min: o.floor != null ? o.floor : 0, max: o.ceil != null ? o.ceil : 5 };
    var lo = Math.min.apply(null, v), hi = Math.max.apply(null, v), pad = Math.max((hi - lo) * 0.15, o.minPad != null ? o.minPad : 0.15);
    var min = Math.max(o.floor != null ? o.floor : 0, lo - pad), max = Math.min(o.ceil != null ? o.ceil : 5, hi + pad);
    return { min: Math.floor(min * 10) / 10, max: Math.ceil(max * 10) / 10 };
  }
  function lineOpts(ax, o) {
    var c = colors(); o = o || {};
    return { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: !!o.legend, position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 } } },
        tooltip: { callbacks: { label: function (ctx) { return ctx.parsed.y == null ? null : ' ' + ctx.dataset.label + ': ' + ctx.parsed.y.toFixed(o.dec == null ? 3 : o.dec); } } } },
      scales: { y: { min: ax.min, max: ax.max, grid: { color: c.grid }, ticks: { stepSize: o.step } }, x: { grid: { display: false } } } };
  }

  /* ------------------------------------------------ toasts, dialogs, files */
  function toast(msg, kind) {
    var box = $('#toasts'), t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : ''); t.textContent = msg; box.appendChild(t);
    setTimeout(function () { t.remove(); }, kind === 'err' ? 5000 : 2600);
  }
  function dialog(title, html, buttons) {
    var back = document.createElement('div');
    back.className = 'dlg-back';
    back.innerHTML = '<div class="dlg" role="dialog" aria-modal="true"><h3>' + esc(title) + '</h3><div>' + html + '</div><div class="btnrow" style="margin:16px 0 0;justify-content:flex-end"></div></div>';
    var row = back.querySelector('.btnrow');
    (buttons || [{ label: 'Close' }]).forEach(function (b) {
      var el = document.createElement('button');
      el.className = 'btn' + (b.primary ? ' primary' : '') + (b.danger ? ' danger' : ''); el.textContent = b.label;
      el.onclick = function () { back.remove(); if (b.fn) b.fn(); };
      row.appendChild(el);
    });
    back.addEventListener('click', function (e) { if (e.target === back) back.remove(); });
    document.body.appendChild(back);
    var first = back.querySelector('.btn.primary,.btn'); if (first) first.focus();
    return back;
  }
  function download(name, content, mime) {
    var blob = new Blob([content], { type: mime || 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function pickFile(accept, cb) {
    var i = document.createElement('input'); i.type = 'file'; i.accept = accept || '';
    i.onchange = function () {
      var file = i.files[0]; if (!file) return;
      var r = new FileReader(); r.onload = function () { cb(String(r.result), file); }; r.readAsText(file);
    };
    i.click();
  }

  /* ------------------------------------------------ domain helpers shared by tabs */
  function areaOf(code, ctx) {
    var c = ctx && ctx.cur && ctx.cur[code]; if (c && c.area) return c.area;
    if (/^BTBiophy/.test(code)) return 'Biophysics'; if (/^BTBio/.test(code)) return 'Biology'; if (/^BTC/.test(code)) return 'Chemistry';
    if (/^BTM/.test(code)) return 'Math'; if (/^BTPhy/.test(code)) return 'Physics'; if (/^(BTU|U\d)/.test(code)) return 'University';
    if (/^BT/.test(code)) return 'Biotech core';
    var m = String(code).match(/^[A-Za-z]+/); return m ? m[0].toUpperCase() : 'Other';
  }
  function termOptions(S, extra) {
    var seen = {}, out = [];
    function add(t) { if (t && !seen[t]) { seen[t] = 1; out.push(t); } }
    (S.attempts || []).forEach(function (a) { add(a.term); });
    (S.plan || []).forEach(function (r) { add(r.term); });
    var latest = G.cumulativeTimeline(S).filter(function (x) { return x.order; }).pop();
    var start = latest ? latest.label : (S.baseline.asOf && G.termOrder(S.baseline.asOf) ? S.baseline.asOf : null);
    if (start) G.termsAhead(start, 6, S.config.terms).forEach(add);
    (extra || []).forEach(add);
    return out.sort(function (a, b) { return G.termOrder(a) - G.termOrder(b); });
  }
  function germanText(x, S) {
    var g = G.bavarian(x, S.config.germanMax, S.config.germanMin);
    return g == null ? '–' : g.toFixed(2);
  }

  return { $: $, $$: $$, esc: esc, f: f, signed: signed, num: num, badge: badge, colors: colors, alpha: alpha,
    loadTheme: loadTheme, toggleTheme: toggleTheme, keepFocus: keepFocus, paint: paint, text: text, wire: wire, syncFields: syncFields, field: field,
    select: select, chart: chart, destroyCharts: destroyCharts, axis: axis, lineOpts: lineOpts, toast: toast, dialog: dialog,
    download: download, pickFile: pickFile, areaOf: areaOf, termOptions: termOptions, germanText: germanText };
})();
