/* Quick calculator: current CGPA + finished hours + this semester's courses (hours and expected score only, no names).
   Works without a profile (from the welcome screen) and as its own tab. Its numbers are kept separately in this browser. */
UI.QuickCalc = (function () {
  'use strict';
  var G = window.GPA, KEY = 'gpa-calculator:quickcalc', el = null, st = null, standalone = false;

  function load() {
    try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && s.rows) return s; } catch (e) {}
    return { cgpa: '', hours: '', n: 5, total: 18, avg: 80, target: '', rows: split(5, 18, 80) };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  /** n courses sharing `total` hours as evenly as possible, e.g. 5 courses / 18 h -> 4,4,4,3,3 */
  function split(n, total, avg) {
    n = Math.max(1, Math.min(12, Math.round(n) || 1)); total = Math.max(n * 0.5, +total || n * 3);
    var base = Math.floor(total / n), extra = Math.round(total - base * n), rows = [];
    for (var i = 0; i < n; i++) rows.push({ cr: base + (i < extra ? 1 : 0), sc: avg, ret: false });
    return rows;
  }

  /** Builds a throwaway quick-mode profile and lets the engine do the maths (same rule as the rest of the app). */
  function profileFor(s, rows) {
    var cg = +s.cgpa, h = +s.hours;
    var p = Store.blank({ mode: 'quick', cgpa: cg, gpaHours: h, earnedHours: h, totalCredits: h + 1000 });
    p.ui.fill = false;
    p.plan = rows.map(function (r, i) { return { code: 'C' + (i + 1), credits: +r.cr, expected: +r.sc, active: true, term: '' }; });
    rows.forEach(function (r, i) { if (r.ret) p.carry['C' + (i + 1)] = { failed: 1, absent: 0 }; });
    return p;
  }
  function valid() {
    var cg = parseFloat(st.cgpa), h = parseFloat(st.hours);
    if (st.cgpa === '' || isNaN(cg) || cg < 0 || cg > 5) return 'Enter your current CGPA (0 to 5).';
    if (st.hours === '' || isNaN(h) || h <= 0) return 'Enter the hours you have finished (counted in your CGPA).';
    var rows = st.rows.filter(function (r) { return +r.cr > 0; });
    if (!rows.length) return 'Add at least one course with its hours.';
    for (var i = 0; i < rows.length; i++) { var s = +rows[i].sc; if (isNaN(s) || s < 0 || s > 100) return 'Scores must be between 0 and 100.'; }
    return null;
  }

  var prefill = null;
  function mount(root, opts) {
    opts = opts || {}; el = root; standalone = !!opts.standalone; st = load(); prefill = opts.prefill || null;
    if (opts.prefill && st.cgpa === '' && st.hours === '') { st.cgpa = +opts.prefill.cgpa.toFixed(3); st.hours = +opts.prefill.hours.toFixed(2); }
    el.innerHTML =
      (standalone ? '<div class="row" style="margin-top:22px"><button class="btn" data-q="back">← Back</button></div>' : '') +
      '<div class="card"><h2><span class="n">CALC</span> Quick GPA calculator</h2>' +
      '<p class="note">No course names, no transcript: just your current CGPA, the hours you have finished, and this semester’s hours and expected scores. You get this semester’s GPA and your new CGPA.</p>' +
      '<div class="cfg"><label>Current CGPA<input type="number" step="0.001" min="0" max="5" data-k="cgpa" placeholder="e.g. 2.5" inputmode="decimal"></label>' +
      '<label>Finished hours <span class="help" title="The hours counted in your CGPA. If you never failed a course this is simply your passed hours. A failed course still counts in this number.">?</span><input type="number" step="0.5" min="0" data-k="hours" placeholder="e.g. 100"></label>' +
      '<label>Target CGPA (optional)<input type="number" step="0.01" min="0" max="5" data-k="target" placeholder="e.g. 2.7"></label>' + (prefill ? '<button class="btn" data-q="mine" style="margin-bottom:2px">Use my current CGPA &amp; hours</button>' : '') + '</div>' +
      '<h3>This semester</h3><div class="cfg"><label>Number of courses<input type="number" min="1" max="12" data-k="n"></label><label>Total hours<input type="number" min="1" step="0.5" data-k="total"></label>' +
      '<label>Expected average %<input type="number" min="0" max="100" data-k="avg"></label><button class="btn primary" data-q="split" style="margin-bottom:2px">Fill the courses</button></div>' +
      '<div class="tw" style="margin-top:12px"><table><thead><tr><th>#</th><th>hours</th><th>expected %</th><th>grade</th><th class="num">points</th><th>retake?</th><th class="num">effect on CGPA</th><th></th></tr></thead><tbody id="qc_rows"></tbody></table></div>' +
      '<div class="btnrow" style="margin-top:8px"><button class="btn" data-q="add">+ Add a course</button></div>' +
      '<p class="msg err" id="qc_err" style="margin:6px 0 0"></p><div id="qc_res"></div></div>' +
      '<div class="card" id="qc_whatif_card"><h2>What if I average…</h2><p class="note">The same courses, every one at the same score.</p><div class="tw"><table><thead><tr><th>average</th><th class="num">semester GPA</th><th class="num">new CGPA</th><th class="num">change</th><th>class</th></tr></thead><tbody id="qc_whatif"></tbody></table></div></div>';
    ['cgpa', 'hours', 'target', 'n', 'total', 'avg'].forEach(function (k) { var i = el.querySelector('[data-k="' + k + '"]'); i.value = st[k]; });
    el.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset.k) { st[t.dataset.k] = t.value.trim(); save(); fill(); }
      else if (t.dataset.row != null) {
        var r = st.rows[+t.dataset.row]; if (!r) return;
        if (t.dataset.f === 'ret') r.ret = t.checked; else r[t.dataset.f] = t.value;
        save(); fill(false);
      }
    });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-q]'); if (!b) return;
      var q = b.dataset.q;
      if (q === 'back') { UI.Welcome && App.showWelcome(); return; }
      if (q === 'mine' && prefill) { st.cgpa = +prefill.cgpa.toFixed(3); st.hours = +prefill.hours.toFixed(2); el.querySelector('[data-k="cgpa"]').value = st.cgpa; el.querySelector('[data-k="hours"]').value = st.hours; }
      else if (q === 'split') st.rows = split(+st.n, +st.total, +st.avg);
      else if (q === 'add') st.rows.push({ cr: 3, sc: +st.avg || 80, ret: false });
      else if (q === 'del') st.rows.splice(+b.dataset.i, 1);
      save(); fill(true);
    });
    fill(true);
  }

  function fill(rebuildRows) {
    var err = valid(), rowsEl = el.querySelector('#qc_rows');
    if (rebuildRows !== false) UI.paint(rowsEl, st.rows.map(function (r, i) {
      return '<tr><td>' + (i + 1) + '</td><td><input type="number" min="0.5" step="0.5" value="' + UI.esc(r.cr) + '" data-row="' + i + '" data-f="cr" data-fk="qcr' + i + '" aria-label="Hours"></td>' +
        '<td><input type="number" min="0" max="100" value="' + UI.esc(r.sc) + '" data-row="' + i + '" data-f="sc" data-fk="qsc' + i + '" aria-label="Expected score"></td>' +
        '<td class="qg"></td><td class="num qp"></td><td><input type="checkbox" data-row="' + i + '" data-f="ret"' + (r.ret ? ' checked' : '') + ' title="Failed or missed this course before; it then counts one extra time in your CGPA" aria-label="Retake"></td>' +
        '<td class="num qe"></td><td><button class="btn sm danger" data-q="del" data-i="' + i + '" aria-label="Remove">×</button></td></tr>';
    }).join(''));
    var ctx = G.makeCtx(Store.blank({}));
    // per-row grade / points always
    UI.$$('#qc_rows tr', el).forEach(function (tr, i) {
      var r = st.rows[i]; if (!r) return; var s = +r.sc, ok = !isNaN(s) && r.sc !== '';
      UI.text(tr.querySelector('.qp'), ok ? G.scoreToGPA(s, false, 'C', ctx).toFixed(1) : '–');
      tr.querySelector('.qg').innerHTML = ok ? UI.badge(G.letter(s, false, 'C', ctx)) : '';
    });
    UI.text(el.querySelector('#qc_err'), err ? UI.tr(err) : '');
    var res = el.querySelector('#qc_res'), wi = el.querySelector('#qc_whatif');
    if (err) { UI.paint(res, ''); UI.paint(wi, ''); UI.$$('#qc_rows .qe', el).forEach(function (c) { c.textContent = ''; }); return; }
    var rows = st.rows.filter(function (r) { return +r.cr > 0; }), p = profileFor(st, rows), now = +st.cgpa;
    var parts = G.projectParts(p, {}), cr = rows.reduce(function (s, r) { return s + (+r.cr); }, 0);
    var sg = G.termGPA(p, p.plan, { sn: 80, sr: 80 }), cl = G.classify(parts.cgpa), d = parts.cgpa - now;
    UI.$$('#qc_rows tr', el).forEach(function (tr, i) {
      var r = st.rows[i]; if (!r || !(+r.cr > 0)) { UI.text(tr.querySelector('.qe'), ''); return; }
      var k = rows.indexOf(r), v = G.projectParts(p, { only: ['C' + (k + 1)], fill: false }).cgpa - now, c = tr.querySelector('.qe');
      UI.text(c, UI.signed(v)); c.className = 'num qe ' + (v >= 0 ? 'green' : 'red');
    });
    var tgt = parseFloat(st.target), tline = '';
    if (!isNaN(tgt) && st.target !== '') {
      var ti = G.scoreForTarget(p, tgt, {});
      tline = ti.already ? 'You reach ' + tgt.toFixed(2) + ' just by passing these courses.' : ti.possible ? 'To reach ' + tgt.toFixed(2) + ' this semester you need about ' + ti.score.toFixed(1) + '% on average in these courses.' : tgt.toFixed(2) + ' is out of reach this semester: even 100% everywhere gives ' + ti.ceiling.toFixed(3) + '.';
    }
    UI.paint(res, '<div class="grid3" style="gap:10px;margin-top:12px">' +
      '<div class="stat"><div class="k">Semester GPA</div><div class="v">' + sg.toFixed(2) + '</div><div class="d">' + UI.num(cr) + ' hours · ≈ ' + G.gpaToPct(sg, Store.blank({}).config).toFixed(1) + '%</div></div>' +
      '<div class="stat"><div class="k">New CGPA</div><div class="v ' + (d >= 0 ? 'green' : 'red') + '">' + parts.cgpa.toFixed(3) + '</div><div class="d">' + UI.signed(d) + ' from ' + now.toFixed(3) + ' · ' + UI.num(+st.hours + cr) + ' hours</div></div>' +
      '<div class="stat"><div class="k">Class</div><div class="v">' + UI.tr(cl.band) + '</div><div class="d">German (est.) ' + UI.germanText(parts.cgpa, Store.blank({})) + '</div></div></div>' +
      (tline ? '<p class="note" style="margin:10px 0 0">' + UI.esc(tline) + '</p>' : '') +
      (rows.some(function (r) { return r.ret; }) ? '<p class="note" style="margin:6px 0 0">A retake ticked here is assumed to have been failed once before, so its earlier attempt is already inside your finished hours.</p>' : ''));
    UI.paint(wi, [60, 65, 70, 75, 80, 85, 90, 95, 100].map(function (s) {
      var v = G.projectParts(p, { uniform: s }).cgpa, g = G.termGPA(p, p.plan.map(function (x) { return Object.assign({}, x, { expected: s }); }), { sn: s, sr: s });
      return '<tr><td>' + s + '%</td><td class="num">' + g.toFixed(2) + '</td><td class="num"><b>' + v.toFixed(3) + '</b></td><td class="num ' + (v >= now ? 'green' : 'red') + '">' + UI.signed(v - now) + '</td><td>' + UI.tr(G.classify(v).band) + '</td></tr>';
    }).join(''));
  }

  return { mount: mount, fill: function () { if (el) fill(false); }, split: split, profileFor: profileFor };
})();
