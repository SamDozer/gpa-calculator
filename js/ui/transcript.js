/* Courses tab: add results, paste/import, edit the attempt log, and see the degree map. */
UI.Transcript = (function () {
  'use strict';
  var G = window.GPA, el = null, filterText = '';

  function mount(root) {
    el = root;
    el.innerHTML =
      '<div class="card" id="tr_hint" hidden></div>' +
      '<div class="card"><h2><span class="n">ADD</span> Add a result</h2>' +
      '<p class="note" id="a_note">Type a course you sat. Leave the score empty (or tick Absent) for a missed exam. Repeating a course applies the repeat penalty automatically.</p>' +
      '<div class="cfg">' +
      '<label>Term<input type="text" id="a_term" list="dl_terms" placeholder="Sep2026" style="width:110px" autocomplete="off"></label>' +
      '<label>Course code<input type="text" id="a_course" list="dl_courses" placeholder="BTC323" style="width:130px" autocomplete="off"></label>' +
      '<label>Credits<input type="number" id="a_cr" value="3" min="0.5" step="0.5" style="width:80px"></label>' +
      '<label>Score %<input type="number" id="a_score" min="0" max="100" placeholder="85" style="width:84px"></label>' +
      '<label class="check"><input type="checkbox" id="a_abs"> Absent (غ)</label>' +
      '<button class="btn primary" data-act="addAtt" style="margin-bottom:2px">Add result</button></div>' +
      '<div id="a_carry" hidden style="margin-top:12px;padding:12px;border:1px dashed var(--line);border-radius:10px"><label class="check" style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" id="a_isret"> This is a retake of a course already counted in my baseline CGPA</label>' +
      '<div class="cfg" id="a_carryf" hidden style="margin-top:8px"><label>Times failed before<input type="number" id="a_cf" min="0" value="1" style="width:84px"></label><label>Times absent before<input type="number" id="a_ca" min="0" value="0" style="width:84px"></label><label>Last attempt was<select id="a_cl"><option value="F">a fail</option><option value="A">an absence</option></select></label></div></div>' +
      '<p class="msg" id="a_msg" style="margin:10px 0 0"></p>' +
      '<datalist id="dl_terms"></datalist><datalist id="dl_courses"></datalist>' +
      '<details style="margin-top:12px"><summary>▸ Paste many courses (Excel, Google Sheets, CSV or JSON)</summary>' +
      '<p class="note" style="margin-top:8px">One course per line: <span class="mono">course, credits, term, score</span>. Copy straight from a spreadsheet or use a header row (course, credits, semester, score). Leave score empty, or write غ / AB, for an absence.</p>' +
      '<textarea id="imp_txt" placeholder="BTC111&#9;4&#9;Jan2022&#9;70&#10;BTM111&#9;3&#9;Jan2022&#9;&#10;BTM111&#9;3;May2022&#9;65" aria-label="Paste courses"></textarea>' +
      '<div class="btnrow" style="margin-top:8px"><button class="btn primary" data-act="impAdd">Add these</button><button class="btn" data-act="impReplace">Replace all my courses</button><button class="btn" data-act="impFile">From file…</button><button class="btn" data-act="copyCSV">Copy as CSV</button></div>' +
      '<p class="msg" id="imp_msg"></p></details></div>' +
      '<div class="card"><h2><span class="n">LOG</span> Your attempts <span class="msg" id="tr_count" style="margin-left:auto;font-weight:400"></span></h2>' +
      '<div class="row" style="margin:8px 0"><input class="inp" id="tr_filter" type="search" placeholder="Filter by code or name…" style="min-width:220px" aria-label="Filter attempts"></div>' +
      '<div class="tw"><table id="tr_tbl"><thead><tr><th>Course</th><th>cr</th><th>score %</th><th>grade</th><th>GPA</th><th></th></tr></thead><tbody></tbody></table></div></div>' +
      '<div class="card" id="cur_card"><h2><span class="n">CUR</span> Degree map <span class="msg" id="cur_tot" style="margin-left:auto;font-weight:400"></span></h2>' +
      '<p class="note">Green = passed, amber = still outstanding. Click a row to start entering a result for that course.</p>' +
      '<div class="levels" id="cur_lvls"></div><div class="tw" style="margin-top:12px"><table id="cur_tbl"><thead><tr><th>Lvl</th><th>Course</th><th>cr</th><th>Status</th><th>Best %</th><th>Attempts</th></tr></thead><tbody></tbody></table></div></div>';

    var ctx = function () { return App.D.ctx; };
    UI.wire(el, {
      addAtt: addAttempt,
      delAtt: function (t) { var i = +t.dataset.i; Store.update(function (S) { var a = S.attempts.splice(i, 1)[0]; Store.syncPlan(S); UI.toast('Removed ' + a.course + ' (' + a.term + ')'); }, { force: true }); },
      prefill: function (t) {
        document.getElementById('a_course').value = t.dataset.code; document.getElementById('a_cr').value = t.dataset.cr;
        if (t.dataset.term) document.getElementById('a_term').value = t.dataset.term;
        carryUI(); document.getElementById('a_score').focus(); document.getElementById('a_course').scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
      impAdd: function () { doImport(false); }, impReplace: function () { doImport(true); },
      impFile: function () { UI.pickFile('.csv,.tsv,.txt,.json', function (txt) { document.getElementById('imp_txt').value = txt; UI.toast('File loaded. Check it, then press Add.'); }); },
      copyCSV: function () { var t = GPAIO.attemptsToCSV(Store.get()); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { UI.toast('CSV copied'); }, function () { UI.toast('Copy blocked by the browser', 'err'); }); },
      attScore: function (t, ev) {
        var i = +t.dataset.i, raw = t.value.trim(), v = raw === '' ? null : parseFloat(raw);
        if (v !== null && (isNaN(v) || v < 0 || v > 100)) return;
        Store.update(function (S) { var a = S.attempts[i]; a.score = v; a.absent = v === null; delete a.placeholder; if (ev.type === 'change') Store.syncPlan(S); });
      },
      attCr: function (t, ev) { var v = parseFloat(t.value); if (!(v > 0)) return; Store.update(function (S) { S.attempts[+t.dataset.i].credits = v; }); },
      attTerm: function (t, ev) { if (ev.type !== 'change') return; if (!G.termOrder(t.value)) { UI.toast('Term not understood. Use e.g. Sep2026', 'err'); return; } Store.update(function (S) { S.attempts[+t.dataset.i].term = t.value.trim(); }); },
      carryToggle: carryUI
    });
    UI.$('#tr_filter', el).addEventListener('input', function (e) { filterText = e.target.value.toLowerCase(); fill(App.D); });
    UI.$('#a_isret', el).addEventListener('change', function () { UI.$('#a_carryf', el).hidden = !this.checked; });
    UI.$('#a_course', el).addEventListener('input', autofill);
    UI.$('#a_course', el).addEventListener('change', autofill);
    UI.$('#a_abs', el).addEventListener('change', function () { UI.$('#a_score', el).disabled = this.checked; if (this.checked) UI.$('#a_score', el).value = ''; });
  }

  function canon(S, code) {
    code = code.trim(); var lc = code.toLowerCase(), hit = null;
    S.degree.curriculum.forEach(function (c) { if (c.code.toLowerCase() === lc) hit = c.code; });
    if (!hit) S.plan.forEach(function (c) { if (c.code.toLowerCase() === lc) hit = c.code; });
    if (!hit) S.attempts.forEach(function (c) { if (c.course.toLowerCase() === lc) hit = c.course; });
    return hit || code;
  }
  function knownCredits(S, code) {
    var r = null;
    S.degree.curriculum.forEach(function (c) { if (c.code === code) r = c.credits; });
    if (r == null) S.plan.forEach(function (c) { if (c.code === code) r = +c.credits; });
    if (r == null) S.attempts.forEach(function (c) { if (c.course === code) r = c.credits; });
    return r;
  }
  function autofill() {
    var S = Store.get(), code = canon(S, UI.$('#a_course', el).value), cr = knownCredits(S, code);
    if (cr != null) UI.$('#a_cr', el).value = cr;
    carryUI();
  }
  /** Show the "retake of a baseline course" box only in quick mode and only for courses with no logged history. */
  function carryUI() {
    var S = Store.get(), box = UI.$('#a_carry', el), code = canon(S, UI.$('#a_course', el).value);
    var show = S.mode === 'quick' && code && !S.attempts.some(function (a) { return a.course === code; }) && !S.carry[code];
    box.hidden = !show;
    if (!show) UI.$('#a_isret', el).checked = false;
    UI.$('#a_carryf', el).hidden = !UI.$('#a_isret', el).checked;
  }

  function addAttempt() {
    var S = Store.get(), msg = UI.$('#a_msg', el);
    function bad(t) { msg.className = 'msg err'; msg.textContent = t; }
    var term = UI.$('#a_term', el).value.trim(), code = canon(S, UI.$('#a_course', el).value), cr = parseFloat(UI.$('#a_cr', el).value),
      abs = UI.$('#a_abs', el).checked, raw = UI.$('#a_score', el).value.trim(), score = abs || raw === '' ? null : parseFloat(raw);
    if (!term || !code) return bad('Term and course code are required.');
    if (!G.termOrder(term)) return bad('Term not understood. Use e.g. Sep2026, Fall 2026 or مايو2026.');
    if (!(cr > 0)) return bad('Credits must be a positive number.');
    if (score !== null && (isNaN(score) || score < 0 || score > 100)) return bad('Score must be between 0 and 100.');
    var dup = S.attempts.some(function (a) { return a.course === code && G.termOrder(a.term) === G.termOrder(term); });
    if (dup) return bad(code + ' already has a result in ' + term + '. Edit it in the table below instead.');
    var prior = S.attempts.filter(function (a) { return a.course === code; }).length, wasCarry = false;
    var isRet = UI.$('#a_isret', el).checked && !UI.$('#a_carry', el).hidden;
    Store.update(function (S2) {
      S2.attempts.push({ term: term, course: code, credits: cr, score: score, absent: score === null });
      if (isRet) {
        var f = Math.max(0, parseInt(UI.$('#a_cf', el).value) || 0), a = Math.max(0, parseInt(UI.$('#a_ca', el).value) || 0);
        if (f + a > 0) { S2.carry[code] = { failed: f, absent: a, lastAbsent: UI.$('#a_cl', el).value === 'A' }; wasCarry = true; }
      }
      Store.syncPlan(S2);
    }, { force: true });
    msg.className = 'msg ok';
    msg.textContent = 'Added ' + code + ' (' + cr + ' cr, ' + term + '). ' + (prior || wasCarry ? 'Retake: repeat penalty applied.' : 'New course.');
    UI.$('#a_score', el).value = ''; UI.$('#a_abs', el).checked = false; UI.$('#a_score', el).disabled = false;
    UI.$('#a_course', el).value = ''; UI.$('#a_isret', el).checked = false; carryUI();
    UI.$('#a_course', el).focus();
  }

  function doImport(replace) {
    var S = Store.get(), msg = UI.$('#imp_msg', el), txt = UI.$('#imp_txt', el).value;
    var credits = {}; S.degree.curriculum.forEach(function (c) { credits[c.code] = c.credits; }); S.plan.forEach(function (c) { credits[c.code] = credits[c.code] || +c.credits; });
    var res = GPAIO.parseAttempts(txt, { credits: credits });
    if (res.errors.length) {
      msg.className = 'msg err'; msg.innerHTML = res.errors.slice(0, 6).map(UI.esc).join('<br>') + (res.errors.length > 6 ? '<br>…and ' + (res.errors.length - 6) + ' more' : '');
      if (!res.rows.length) return;
    }
    if (!res.rows.length) return;
    function go() {
      Store.update(function (S2) {
        res.rows.forEach(function (r) { r.course = canon(S2, r.course); });
        S2.attempts = replace ? res.rows : S2.attempts.concat(res.rows);
        Store.syncPlan(S2);
      }, { force: true });
      UI.$('#imp_txt', el).value = '';
      UI.toast((replace ? 'Replaced with ' : 'Added ') + res.rows.length + ' attempts' + (res.errors.length ? ' (' + res.errors.length + ' skipped)' : ''));
      if (!res.errors.length) { msg.className = 'msg ok'; msg.textContent = 'Imported ' + res.rows.length + ' attempts.'; }
    }
    if (replace && S.attempts.length) UI.dialog('Replace all courses?', '<p class="note">This overwrites your ' + S.attempts.length + ' saved attempts with ' + res.rows.length + ' imported ones. You can undo with Ctrl+Z.</p>', [{ label: 'Cancel' }, { label: 'Replace', primary: true, fn: go }]);
    else go();
  }

  function fill(D) {
    var S = D.S, ctx = D.ctx;
    /* hint */
    var hint = UI.$('#tr_hint', el);
    if (S.mode === 'quick') {
      hint.hidden = false;
      UI.paint(hint, '<h2>Optional: past courses</h2><p class="note" style="margin:6px 0 0">You started from a CGPA and hours, so older courses are <b>already inside your baseline</b>. Anything you add here is counted <b>on top of it</b>: use it for results that came out <i>after</i> your baseline, or if you want charts of recent terms. Want every old course tracked exactly? Switch to full-transcript mode in <a href="#settings" data-act="toSettings">Settings</a>.</p>');
      hint.querySelectorAll('[data-act="toSettings"]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); App.go('settings'); }; });
    } else hint.hidden = true;

    /* datalists */
    var codes = {}; S.degree.curriculum.forEach(function (c) { codes[c.code] = c.name; }); S.plan.forEach(function (c) { codes[c.code] = codes[c.code] || c.name || ''; });
    UI.paint(UI.$('#dl_courses', el), Object.keys(codes).map(function (k) { return '<option value="' + UI.esc(k) + '">' + UI.esc(codes[k]) + '</option>'; }).join(''));
    UI.paint(UI.$('#dl_terms', el), UI.termOptions(S).concat(G.termsAhead(S.attempts.length ? S.attempts[S.attempts.length - 1].term : 'Sep2026', 3, S.config.terms)).map(function (t) { return '<option value="' + t + '">'; }).join(''));
    carryUI();

    /* attempts table */
    var names = {}; S.degree.curriculum.forEach(function (c) { names[c.code] = c.name; }); S.plan.forEach(function (c) { names[c.code] = names[c.code] || c.name; });
    var rows = S.attempts.map(function (a, i) { return { a: a, i: i, o: G.termOrder(a.term) }; })
      .sort(function (x, y) { return x.o - y.o || x.i - y.i; });
    var seen = {}, semMap = {}, cumMap = {};
    D.sems.forEach(function (s) { semMap[s.order] = s; }); D.timeline.forEach(function (t) { cumMap[t.order] = t; });
    var q = filterText, html = '', lastO = null, shown = 0;
    rows.forEach(function (r) {
      var a = r.a, n = seen[a.course] = (seen[a.course] || 0) + 1;
      var nm = names[a.course] || '';
      if (q && (a.course + ' ' + nm).toLowerCase().indexOf(q) < 0) return;
      shown++;
      if (r.o !== lastO) {
        lastO = r.o;
        var sg = semMap[r.o], cg = cumMap[r.o];
        html += '<tr class="grp"><td colspan="6"><b>' + UI.esc(r.o ? a.term : 'Unknown term') + '</b>' +
          (sg ? ' <span class="muted" style="font-weight:400"> · term GPA ' + UI.f(sg.gpa, 2) + (cg ? ' · CGPA after ' + UI.f(cg.cgpa) : '') + '</span>' : '') +
          (r.o ? ' <button class="btn sm ghost" data-act="prefill" data-code="" data-cr="3" data-term="' + UI.esc(a.term) + '">+ add here</button>' : ' <span class="tag bad">fix the term</span>') + '</td></tr>';
      }
      var abs = !!a.absent || a.score == null, L = G.letter(abs ? null : a.score, abs, a.course, ctx), g = G.scoreToGPA(abs ? null : a.score, abs, a.course, ctx);
      var tags = '';
      if (n > 1) tags += ' <span class="tag ret">retake ' + n + '</span>';
      if (S.carry[a.course] && n === 1) tags += ' <span class="tag ret">retake (baseline)</span>';
      if (a.placeholder) tags += ' <span class="tag warn" title="This score was not recorded as real, only that the result was a fail. Any failing score gives the same GPA.">placeholder</span>';
      if (S.config.excludeNonDegree && ctx.nonDeg[a.course]) tags += ' <span class="tag info" title="Excluded from CGPA and degree credits (see Settings → Degree)">not in CGPA</span>';
      html += '<tr><td>' + UI.esc(a.course) + (nm ? ' <span class="muted">' + UI.esc(nm) + '</span>' : '') + tags + '</td>' +
        '<td><input type="number" data-on="attCr" data-i="' + r.i + '" data-fk="cr' + r.i + '" min="0.5" step="0.5" value="' + a.credits + '" aria-label="Credits"></td>' +
        '<td><input type="number" data-on="attScore" data-i="' + r.i + '" data-fk="sc' + r.i + '" min="0" max="100" placeholder="absent" value="' + (abs ? '' : a.score) + '" aria-label="Score"></td>' +
        '<td>' + UI.badge(L) + '</td><td class="num">' + g.toFixed(1) + '</td>' +
        '<td><button class="btn sm danger" data-act="delAtt" data-i="' + r.i + '" aria-label="Remove ' + UI.esc(a.course) + '">×</button></td></tr>';
    });
    if (!rows.length) html = '<tr><td colspan="6"><div class="empty"><b>No courses yet</b>Add a result above, or paste a whole list.</div></td></tr>';
    UI.paint(UI.$('#tr_tbl tbody', el), html);
    UI.text(UI.$('#tr_count', el), rows.length ? (q ? shown + ' of ' : '') + rows.length + ' attempts' : '');

    /* degree map */
    var cur = S.degree.curriculum, card = UI.$('#cur_card', el);
    card.hidden = !cur.length;
    if (!cur.length) return;
    var lv = {}; cur.forEach(function (c) { (lv[c.level] = lv[c.level] || []).push(c); });
    var lh = '';
    Object.keys(lv).sort(function (a, b) { return a - b; }).forEach(function (L) {
      var tot = lv[L].reduce(function (s, c) { return s + c.credits; }, 0), done = lv[L].filter(function (c) { return D.tot.byCode[c.code] && D.tot.byCode[c.code].passed; }).reduce(function (s, c) { return s + c.credits; }, 0);
      var pc = tot ? Math.round(100 * done / tot) : 0;
      lh += '<div class="lvl"><span class="nm">Level ' + L + '</span><span class="tr meter"><i style="width:' + pc + '%;background:' + (pc === 100 ? 'var(--green)' : 'var(--amber)') + '"></i></span><span class="pc">' + done + '/' + tot + ' cr · ' + pc + '%</span></div>';
    });
    UI.paint(UI.$('#cur_lvls', el), S.mode === 'quick' ? '<p class="note">Level progress needs a full transcript; in quick mode only courses entered here are tracked.</p>' : lh);
    UI.paint(UI.$('#cur_tbl tbody', el), cur.map(function (c) {
      var t = D.tot.byCode[c.code], passed = t && t.passed, atts = t ? t.attempts : [], carried = S.carry[c.code] ? 1 : 0;
      var best = atts.filter(function (a) { return !a.absent; }).reduce(function (m, a) { return Math.max(m, a.score); }, 0);
      var st = passed ? '<span class="tag new">passed</span>' : (atts.length || carried ? '<span class="tag ret">not passed</span>' : '<span class="tag ret">not taken</span>');
      return '<tr style="cursor:pointer' + (passed ? '' : ';background:var(--amber-bg)') + '" data-act="prefill" data-code="' + UI.esc(c.code) + '" data-cr="' + c.credits + '"><td>' + c.level + '</td><td>' + UI.esc(c.code) + ' <span class="muted">' + UI.esc(c.name) + '</span></td><td>' + c.credits + '</td><td>' + st + '</td><td>' + (best || '–') + '</td><td>' + atts.length + '</td></tr>';
    }).join(''));
    UI.text(UI.$('#cur_tot', el), D.cs.earned + ' of ' + D.cs.total + ' cr passed');
  }

  return { mount: mount, fill: fill };
})();
