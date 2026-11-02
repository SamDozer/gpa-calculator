/* Settings: starting point, degree, grading rules, calibration against official CGPAs, data. */
UI.Settings = (function () {
  'use strict';
  var G = window.GPA, el = null, fitRes = null, looRes = null;
  var MODES = [['weighted', 'Weighted (fitted): earlier fails keep ~full weight, later ones decay'], ['count_one', 'Count one extra registration'], ['full', 'Replace (textbook): only the latest attempt counts'], ['capped', 'Capped: retake grade limited to a maximum']];

  function mount(root) {
    el = root;
    el.innerHTML =
      '<div class="card"><h2><span class="n">ME</span> Starting point</h2>' +
      '<p class="note">How the app knows your record. You can switch at any time; nothing is lost.</p>' +
      '<div class="seg" id="modeSeg" role="group" aria-label="Starting point"><button data-act="mode" data-m="quick">Quick: CGPA &amp; hours</button><button data-act="mode" data-m="full">Full transcript</button></div>' +
      '<div class="cfg" style="margin-top:14px"><label>Name (optional)<input type="text" data-path="meta.name" data-type="str" style="width:150px"></label><label>Programme<input type="text" data-path="meta.program" data-type="str" style="width:230px"></label><label>Hours to graduate<input type="number" data-path="degree.totalCredits" data-type="num" min="1"></label><label>Term names in a year<input type="text" id="s_terms" style="width:150px" title="Comma separated, e.g. Fall, Spring, Summer"></label></div>' +
      '<div id="s_base" style="margin-top:14px"><h3>Baseline (your record before anything below)</h3><div class="cfg">' +
      '<label>CGPA<input type="number" step="0.001" data-path="baseline.cgpa" data-type="num" min="0"></label><label>Hours counted in CGPA<input type="number" step="0.5" data-path="baseline.gpaHours" data-type="num" min="0"></label>' +
      '<label>Hours passed<input type="number" step="0.5" data-path="baseline.earnedHours" data-type="num" min="0"></label><label>As of term<input type="text" data-path="baseline.asOf" data-type="str" style="width:100px"></label></div>' +
      '<p class="note" style="margin-top:8px">Courses you failed earlier are still in the denominator, so hours counted can be higher than hours passed. For a retake of one of those, mark it as a retake in the Plan tab so its repeat penalty is applied.</p></div></div>' +

      '<div class="card"><h2><span class="n">CAL</span> Term calendar</h2>' +
      '<p class="note">Every term in this app is named by its <b>exam period</b>, because that is when results (and your CGPA) change. Typing the month your exams fall in is enough:</p>' +
      '<div class="tw"><table><thead><tr><th>Write</th><th>Meaning</th><th>Starts</th></tr></thead><tbody>' +
      '<tr><td class="mono"><b>Jan</b> or Dec</td><td>Term 1 exams (December / January)</td><td>autumn (Sep/Oct)</td></tr>' +
      '<tr><td class="mono"><b>May</b> or Jun</td><td>Term 2 exams (late May / early June)</td><td>February</td></tr>' +
      '<tr><td class="mono"><b>Sep</b> or Aug</td><td>Summer exams (August / September)</td><td>after Term 2</td></tr></tbody></table></div>' +
      '<p class="note" style="margin:10px 0 0">So <span class="mono">Dec2026</span> and <span class="mono">Jan2027</span> are the same term (Term 1 of 2026/27), <span class="mono">May2027</span> / <span class="mono">Jun2027</span> are Term 2, and <span class="mono">Aug2027</span> / <span class="mono">Sep2027</span> are the summer exams of that same academic year. Other universities can rename the terms in “Term names in a year” above (for example Fall, Spring).</p></div>' +
      '<div class="card"><h2><span class="n">CFG</span> Grading rules</h2>' +
      '<p class="note">Defaults match the Cairo University Faculty of Science credit-hour system. Every number is editable if your faculty differs.</p>' +
      '<div class="cfg"><label>Pass mark<input type="number" data-path="config.subjectPass" data-type="num"></label><label>University-req. pass<input type="number" data-path="config.requirementPass" data-type="num"></label>' +
      '<label>Score offset<input type="number" data-path="config.gpaOffset" data-type="num"></label><label>Score divisor<input type="number" data-path="config.gpaDivisor" data-type="num"></label><label>Max GPA<input type="number" step="0.5" data-path="config.maxGPA" data-type="num"></label>' +
      '<label class="check"><input type="checkbox" data-path="config.excludeNonDegree" data-type="bool"> exclude non-degree courses from CGPA</label></div>' +
      '<div class="cfg" style="margin-top:12px"><label>Repeat-course rule<select data-path="config.repeatMode" data-type="str" style="max-width:360px">' + MODES.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Failed-exam weight<input type="number" step="0.005" data-path="config.wFailed" data-type="num"></label><label>Absence weight<input type="number" step="0.005" data-path="config.wAbsent" data-type="num"></label><label>Decay per repeat<input type="number" step="0.005" data-path="config.decay" data-type="num"></label><label>Retake grade cap<input type="number" step="0.1" data-path="config.repeatCap" data-type="num"></label>' +
      '<button class="btn" data-act="resetCfg" style="margin-bottom:2px">Reset to Cairo defaults</button></div>' +
      '<p class="note" style="margin-top:12px">GPA = score &lt; pass ? 0 : min((score − offset) ÷ divisor, max). Under the weighted rule the k-th earlier attempt of a course adds <b>weight × decay<sup>k</sup></b> × credits to the denominator, so the <b>first</b> failure costs almost one full registration and later failures add very little. Only the latest attempt earns points. Non-degree courses (below) never count.</p>' +
      '<details style="margin-top:8px"><summary>▸ Score ↔ GPA table</summary><div class="tw" style="margin-top:8px"><table id="conv_tbl"><thead><tr><th>Score %</th><th class="num">GPA</th><th>Letter</th></tr></thead><tbody></tbody></table></div></details></div>' +

      '<div class="card" id="cal_card"><h2><span class="n">FIT</span> Calibration against your official CGPAs</h2>' +
      '<p class="note">The repeat-course rule is not published, so it is a model. Type the CGPA your university showed after each term; the table shows how closely the rules reproduce them. Official values are rounded to 3 decimals, so ±0.0005 is the noise floor.</p>' +
      '<div class="cfg" style="margin-bottom:10px"><label>Term<input type="text" id="sn_term" placeholder="Sep2026" list="dl_sterms" style="width:100px"></label><label>Official CGPA<input type="number" id="sn_val" step="0.001" min="0" max="5" style="width:100px"></label><button class="btn" data-act="addSnap" style="margin-bottom:2px">+ Add official CGPA</button><datalist id="dl_sterms"></datalist></div>' +
      '<div class="tw"><table id="fit_tbl"><thead><tr><th>Term</th><th class="num">Official</th><th class="num">Model</th><th class="num">Error</th><th></th></tr></thead><tbody></tbody></table></div><p class="note" id="fit_sum" style="margin-top:10px"></p>' +
      '<div class="btnrow"><button class="btn" data-act="fit">Auto-fit the rule to my numbers</button></div><div id="fit_out"></div></div>' +

      '<div class="card"><h2><span class="n">DEG</span> Degree &amp; course list</h2>' +
      '<p class="note" id="deg_note"></p><div class="cfg"><label>Template<select id="tpl_sel">' + window.GPA_TEMPLATES.map(function (t) { return '<option value="' + t.id + '">' + UI.esc(t.title) + '</option>'; }).join('') + '</select></label><button class="btn" data-act="applyTpl" style="margin-bottom:2px">Use this course list</button></div>' +
      '<details style="margin-top:12px"><summary>▸ Paste my own course list</summary><p class="note" style="margin-top:8px">One course per line: <span class="mono">level, code, name, credits[, req]</span>. Put <span class="mono">req</span> at the end for university requirements (lower pass mark).</p><textarea id="cur_txt" placeholder="1,SCI101,General Chemistry,4&#10;1,SCI102,University English,2,req"></textarea><div class="btnrow" style="margin-top:8px"><button class="btn" data-act="applyCur">Use pasted list</button><button class="btn" data-act="copyCur">Copy current list</button></div></details>' +
      '<div class="cfg" style="margin-top:12px"><label>Non-degree courses (passed but outside the total; comma separated)<input type="text" id="s_nd" style="width:260px"></label></div></div>' +

      '<div class="card"><h2><span class="n">DATA</span> Your data</h2><p class="note">Saved only in this browser (local storage). Nothing is sent anywhere. Download a backup to move to another device or keep a private copy; you can load it again from the welcome screen or the Data menu.</p>' +
      '<div class="btnrow"><button class="btn primary" data-act="exp">Download my data (.json)</button><button class="btn" data-act="csv">Export courses (.csv)</button><button class="btn" data-act="print">Print / PDF</button><button class="btn danger" data-act="wipe">Erase everything</button></div></div>';

    UI.wire(el, {
      mode: function (t) { setMode(t.dataset.m); },
      resetCfg: function () { Store.update(function (S) { var k = S.config.terms, gmax = S.config.germanMax, gmin = S.config.germanMin; S.config = Store.clone(G.DEFAULT_CONFIG); S.config.terms = k; S.config.germanMax = gmax; S.config.germanMin = gmin; }, { force: true }); UI.toast('Grading rules reset'); },
      addSnap: function () {
        var term = UI.$('#sn_term', el).value.trim(), v = parseFloat(UI.$('#sn_val', el).value);
        if (!G.termOrder(term)) return UI.toast('Term not understood. Use e.g. Sep2026', 'err');
        if (isNaN(v) || v < 0 || v > 5) return UI.toast('Enter the official CGPA (0–5)', 'err');
        Store.update(function (S) { S.snapshots = S.snapshots.filter(function (s) { return G.termOrder(s.term) !== G.termOrder(term); }).concat([{ term: term, cgpa: v }]); }, { force: true });
        UI.$('#sn_term', el).value = ''; UI.$('#sn_val', el).value = ''; fitRes = null;
      },
      delSnap: function (t) { Store.update(function (S) { S.snapshots.splice(+t.dataset.i, 1); }, { force: true }); fitRes = null; },
      fit: function () {
        var S = Store.get();
        if (G.validSnapshots(S).length < 3) return UI.toast('Add at least 3 official CGPAs for a meaningful fit.', 'err');
        fitRes = G.fitRepeat(S); looRes = G.leaveOneOut(S); fill(App.D);
      },
      applyFit: function () { if (!fitRes) return; Store.update(function (S) { Object.assign(S.config, { repeatMode: 'weighted', wFailed: fitRes.wFailed, wAbsent: fitRes.wAbsent, decay: fitRes.decay }); }, { force: true }); UI.toast('Fitted values applied'); },
      applyTpl: function () {
        var t = window.GPA_TEMPLATES.filter(function (x) { return x.id === UI.$('#tpl_sel', el).value; })[0];
        UI.dialog('Replace the course list?', '<p class="note">Your logged courses stay. The degree list becomes “' + UI.esc(t.title) + '” (' + t.curriculum.length + ' courses).</p>', [{ label: 'Cancel' }, { label: 'Use it', primary: true, fn: function () { Store.update(function (S) { S.degree.curriculum = Store.clone(t.curriculum); S.degree.nonDegree = Store.clone(t.nonDegree); if (t.totalCredits) S.degree.totalCredits = t.totalCredits; Store.syncPlan(S); }, { force: true }); } }]);
      },
      applyCur: function () {
        var lines = UI.$('#cur_txt', el).value.split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean), out = [], bad = 0;
        lines.forEach(function (l) { var p = l.split(/[,\t;]/).map(function (x) { return x.trim(); }); var cr = parseFloat(p[3]); if (p.length < 4 || !p[1] || !(cr > 0)) { bad++; return; } out.push({ level: parseInt(p[0]) || 1, code: p[1], name: p[2], credits: cr, req: /^req/i.test(p[4] || '') }); });
        if (!out.length) return UI.toast('No valid lines. Format: level, code, name, credits', 'err');
        Store.update(function (S) { S.degree.curriculum = out; Store.syncPlan(S); }, { force: true });
        UI.toast('Course list set: ' + out.length + ' courses' + (bad ? ', ' + bad + ' lines skipped' : ''), bad ? 'err' : '');
      },
      copyCur: function () {
        var t = Store.get().degree.curriculum.map(function (c) { return [c.level, c.code, c.name, c.credits].concat(c.req ? ['req'] : []).join(','); }).join('\n');
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { UI.toast('Copied'); }, function () { UI.toast('Copy blocked by the browser', 'err'); });
      },
      exp: function () { UI.download('gpa-profile.json', GPAIO.toJSON(Store.get())); UI.toast('Saved gpa-profile.json'); },
      csv: function () { UI.download('courses.csv', GPAIO.attemptsToCSV(Store.get()), 'text/csv'); },
      print: function () { window.print(); },
      wipe: function () { UI.dialog('Erase everything?', '<p class="note">Removes your saved data from this browser.</p>', [{ label: 'Cancel' }, { label: 'Erase', danger: true, fn: function () { Store.clear(); location.hash = ''; } }]); }
    });
    UI.$('#s_terms', el).addEventListener('change', function () {
      var names = this.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      if (!names.length || names.some(function (n) { return !G.termOrder(n + '2000'); })) { UI.toast('Use month or season names, e.g. Jan, May, Sep or Fall, Spring', 'err'); return; }
      Store.update(function (S) { S.config.terms = names; });
    });
    UI.$('#s_nd', el).addEventListener('change', function () { var v = this.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean); Store.update(function (S) { S.degree.nonDegree = v; }); });
  }

  function setMode(m) {
    var S = Store.get(); if (S.mode === m) return;
    Store.update(function (S2) {
      S2.mode = m; S2.baseline.enabled = m === 'quick';
      if (m === 'full') Store.syncPlan(S2);
    }, { force: true });
    UI.toast(m === 'quick' ? 'Quick mode: enter your baseline below.' : 'Full-transcript mode: your baseline is switched off and every logged course counts.');
  }

  function fill(D) {
    var S = D.S, cfg = S.config, ctx = D.ctx;
    UI.$$('#modeSeg button', el).forEach(function (b) { b.classList.toggle('active', b.dataset.m === S.mode); });
    UI.$('#s_base', el).hidden = S.mode !== 'quick';
    var tt = UI.$('#s_terms', el); if (document.activeElement !== tt) tt.value = cfg.terms.join(', ');
    var nd = UI.$('#s_nd', el); if (document.activeElement !== nd) nd.value = S.degree.nonDegree.join(', ');
    UI.syncFields(el, S);
    var dn = S.degree.curriculum.length ? S.degree.curriculum.length + ' courses in your degree list (' + D.cs.curriculumCredits + ' cr). ' : 'No degree list yet: you can type course codes freely, but level progress and “remaining courses” need a list. ';
    UI.text(UI.$('#deg_note', el), dn + 'A template only supplies course names and credits.');

    /* conversion table */
    var ctx2 = G.makeCtx(S);
    UI.paint(UI.$('#conv_tbl tbody', el), [59, 60, 65, 70, 75, 80, 85, 90, 95, 100].map(function (sc) {
      var g = G.scoreToGPA(sc, false, 'X', ctx2), L = G.letter(sc, false, 'X', ctx2);
      return '<tr><td>' + sc + '%</td><td class="num">' + g.toFixed(1) + '</td><td>' + UI.badge(L) + '</td></tr>';
    }).join(''));

    /* calibration */
    UI.$('#cal_card', el).hidden = false;
    var errs = G.snapshotErrors(S), byTerm = {}; errs.forEach(function (e) { byTerm[G.termOrder(e.term)] = e; });
    UI.paint(UI.$('#dl_sterms', el), D.timeline.map(function (t) { return '<option value="' + UI.esc(t.label) + '">'; }).join(''));
    UI.paint(UI.$('#fit_tbl tbody', el), S.snapshots.map(function (s, i) {
      var e = byTerm[G.termOrder(s.term)], ok = e && Math.abs(e.err) <= 0.0015, col = !e ? '' : Math.abs(e.err) <= 0.0005 ? 'green' : ok ? 'amber' : 'red';
      return '<tr><td>' + UI.field('snapshots.' + i + '.term', s.term, { type: 'str', label: 'Term', style: 'width:96px' }) + '</td><td class="num">' + UI.field('snapshots.' + i + '.cgpa', s.cgpa, { step: 0.001, min: 0, max: 5, label: 'Official CGPA', style: 'width:92px' }) + '</td><td class="num">' + (e ? e.model.toFixed(4) : '–') + '</td><td class="num ' + col + '">' + (e ? (e.err >= 0 ? '+' : '') + e.err.toFixed(4) : '–') + '</td><td><button class="btn sm danger" data-act="delSnap" data-i="' + i + '" aria-label="Remove">×</button></td></tr>';
    }).join('') || '<tr><td colspan="5" class="muted">No official CGPAs yet. Adding even three or four tells you how well the repeat rule fits your record.</td></tr>');
    var sum = '';
    if (errs.length) sum = 'RMSE <b>' + G.rmse(errs).toFixed(5) + '</b> · ' + G.insideBand(errs) + ' of ' + errs.length + ' inside rounding (±0.0005)' + (S.mode === 'quick' ? '. <span class="red">Calibration compares your logged courses only, so use full-transcript mode for it.</span>' : '.');
    UI.paint(UI.$('#fit_sum', el), sum);

    var out = '';
    if (fitRes) {
      var comp = G.compareModels(S, fitRes);
      out += '<div class="rec up"><span class="ic">✓</span><span>Best fit: failed weight <b>' + fitRes.wFailed + '</b>, absence weight <b>' + fitRes.wAbsent + '</b>, decay <b>' + fitRes.decay + '</b> (RMSE ' + fitRes.rmse.toFixed(5) + '). ' + fitRes.feasible.length + ' parameter sets reproduce every snapshot within rounding. ' +
        (looRes ? 'Leave-one-out error: <b>' + looRes.rmse.toFixed(5) + '</b> (each snapshot predicted from the others, absence weight fixed at 1). ' : '') +
        '<button class="btn sm primary" data-act="applyFit">Apply these values</button></span></div>' +
        '<div class="tw" style="margin-top:10px"><table><thead><tr><th>Model</th><th class="num">RMSE</th><th class="num">Max error</th><th class="num">Inside rounding</th><th class="num">Projected final</th></tr></thead><tbody>' +
        comp.map(function (m) { return '<tr><td>' + m.name + '</td><td class="num">' + m.rmse.toFixed(5) + '</td><td class="num">' + m.max.toFixed(4) + '</td><td class="num">' + m.inside + ' / ' + m.n + '</td><td class="num">' + UI.f(m.final) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    UI.paint(UI.$('#fit_out', el), out);
  }

  return { mount: mount, fill: fill };
})();
