/* Plan tab: courses still to take, a drag-and-drop term board, per-term CGPA, and where effort pays. */
UI.Plan = (function () {
  'use strict';
  var G = window.GPA, el = null, dragIdx = null;

  /** The term that is running now (or the latest scheme term before today). */
  function currentTerm(S) {
    var d = new Date(), yr = d.getFullYear(), mo = d.getMonth() + 1;
    var months = S.config.terms.map(function (n) { return { n: n, m: G.MONTH_NAMES.indexOf(n.slice(0, 3)) + 1 || 0 }; }).filter(function (x) { return x.m; }).sort(function (a, b) { return a.m - b.m; });
    if (!months.length) return 'Sep' + yr;
    var pick = null; months.forEach(function (x) { if (x.m <= mo) pick = x; });
    return pick ? pick.n + yr : months[months.length - 1].n + (yr - 1);
  }
  function startTerm(S) {
    if (S.ui.startTerm && G.termOrder(S.ui.startTerm)) return S.ui.startTerm;
    var last = S.attempts.map(function (a) { return G.termOrder(a.term); }).filter(Boolean).sort().pop();
    if (last) return G.nextTerm(G.termLabelFromOrder(last, S.config.terms), S.config.terms);
    if (S.baseline.asOf && G.termOrder(S.baseline.asOf)) return G.nextTerm(S.baseline.asOf, S.config.terms);
    return currentTerm(S);
  }
  function boardTerms(S) {
    var seen = {}, out = [];
    function add(t) { if (t && !seen[t]) { seen[t] = 1; out.push(t); } }
    S.plan.forEach(function (r) { add(String(r.term || '').trim()); });
    (S.ui.extraTerms || []).forEach(add);
    var st = startTerm(S); add(st); G.termsAhead(st, 2, S.config.terms).forEach(add);
    return out.sort(function (a, b) { return G.termOrder(a) - G.termOrder(b); });
  }

  function mount(root) {
    el = root;
    el.innerHTML =
      '<div class="card" id="calc_card"><h2><span class="n">SEM</span> Semester calculator: what will my GPA be?</h2>' +
      '<p class="note">Pick the term, list the courses you take in it and the score you expect in each. You get that semester’s GPA, your new CGPA, and what each course does to it. Whatever you enter here is saved into your plan below, so nothing is entered twice.</p>' +
      '<div class="cfg"><label>Term (named by its exam period)<select data-path="ui.calcTerm" data-type="str" id="calc_term" style="min-width:190px"></select></label><span class="msg" id="calc_info" style="align-self:center;max-width:46ch"></span></div>' +
      '<div id="calc_result" style="margin:14px 0 6px"></div>' +
      '<div class="tw" id="calc_tw"><table id="calc_tbl"><thead><tr><th>Course</th><th class="num">cr</th><th>score %</th><th>grade</th><th class="num">GPA pts</th><th class="num" title="CGPA change from adding only this course">effect on CGPA</th><th></th></tr></thead><tbody></tbody></table></div>' +
      '<div class="cfg" style="margin-top:12px;padding-top:12px;border-top:1px dashed var(--line)">' +
      '<label>Add a course<input type="text" id="sc_code" list="dl_pcodes" data-on="calcCode" placeholder="code, e.g. BTC323" style="width:150px" autocomplete="off"></label>' +
      '<label>Credits<input type="number" id="sc_cr" value="3" min="0.5" step="0.5" style="width:78px"></label>' +
      '<label>Type<select id="sc_type" data-on="calcType"><option value="new">new course</option><option value="ret">retake</option></select></label>' +
      '<label id="sc_fw" hidden>Times failed before<input type="number" id="sc_f" min="0" value="1" style="width:92px"></label>' +
      '<label>Expected %<input type="number" id="sc_exp" min="0" max="100" placeholder="default" style="width:86px"></label>' +
      '<button class="btn primary" data-act="calcAdd" style="margin-bottom:2px">+ Add</button></div>' +
      '<p class="msg" id="sc_msg" style="margin:8px 0 0"></p>' +
      '<div class="slider" id="sc_allw" hidden><div class="slider-lab"><span>Set every course in this term to</span><span class="val green" id="sc_allv">85%</span></div><input type="range" min="50" max="100" value="85" data-on="calcAll" id="sc_all" aria-label="Set all scores for this term"></div>' +
      '<p class="note" id="calc_note" style="margin:10px 0 0"></p></div>' +
      '<div class="card"><h2><span class="n">ADD</span> Add a course to your plan</h2>' +
      '<p class="note" id="pa_note">Planning this semester or the next? Add each course with the credits and the score you expect. For a course you failed or missed before, mark it as a retake so the repeat penalty is counted.</p>' +
      '<div class="cfg">' +
      '<label>Course code<input type="text" id="pa_code" list="dl_pcodes" placeholder="BTC323" style="width:130px" autocomplete="off"></label>' +
      '<label>Name (optional)<input type="text" id="pa_name" placeholder="Instrumental Analysis" style="width:180px"></label>' +
      '<label>Credits<input type="number" id="pa_cr" value="3" min="0.5" step="0.5" style="width:78px"></label>' +
      '<label>Type<select id="pa_type"><option value="new">new course</option><option value="ret">retake</option></select></label>' +
      '<label>Term<input type="text" id="pa_term" list="dl_pterms" placeholder="(later)" style="width:100px" autocomplete="off"></label>' +
      '<label>Expected %<input type="number" id="pa_exp" min="0" max="100" placeholder="default" style="width:86px"></label>' +
      '<button class="btn primary" data-act="addPlan" style="margin-bottom:2px">+ Add to plan</button></div>' +
      '<div class="cfg" id="pa_ret" hidden style="margin-top:10px"><label>Times failed before<input type="number" id="pa_f" min="0" value="1" style="width:92px"></label><label>Times absent before<input type="number" id="pa_a" min="0" value="0" style="width:92px"></label><span class="msg" style="align-self:center">Both count toward the repeat penalty. Courses with logged attempts fill this in automatically.</span></div>' +
      '<p class="msg" id="pa_msg" style="margin:10px 0 0"></p><datalist id="dl_pcodes"></datalist><datalist id="dl_pterms"></datalist></div>' +

      '<div class="card"><h2><span class="n">BOARD</span> Semester board</h2>' +
      '<p class="note">Drag courses between terms to see how the order changes your CGPA. Each column shows that term’s own GPA and your cumulative CGPA after it. On a phone, use the Term column in the table below.</p>' +
      '<div class="cfg" style="margin-bottom:12px"><label>Start term<input type="text" id="pl_start" data-path="ui.startTerm" data-type="str" list="dl_pterms" placeholder="Sep2026" style="width:110px"></label>' +
      '<label>Max credits / term<input type="number" data-path="ui.maxCreditsPerTerm" data-type="num" data-min="0" min="0" style="width:96px" title="0 turns the warning off"></label>' +
      '<button class="btn" data-act="auto" style="margin-bottom:2px">Auto-distribute unassigned</button><button class="btn" data-act="clearTerms" style="margin-bottom:2px">Clear terms</button><button class="btn" data-act="addCol" style="margin-bottom:2px">+ term column</button><span class="msg" id="pl_msg"></span></div>' +
      '<div class="board" id="board"></div><div id="pl_warn"></div></div>' +

      '<div class="card"><h2><span class="n">REM</span> Your plan <span class="msg" id="rem_tot" style="margin-left:auto;font-weight:400"></span></h2>' +
      '<p class="note">Untick a course to leave it out of the projection (it still blocks graduation until passed). Leave “expected %” empty to use the default new / retake scores from the Projection tab.</p>' +
      '<div class="tw"><table id="rem_tbl"><thead><tr><th>on</th><th>Course</th><th>cr</th><th>history</th><th>term</th><th>expected %</th><th>GPA</th><th></th></tr></thead><tbody></tbody></table></div>' +
      '<div class="btnrow" style="margin-top:10px" id="rem_btns"></div><div id="rem_warn"></div></div>' +

      '<div class="card"><h2><span class="n">PLAN</span> CGPA after each term</h2>' +
      '<div class="chartbox short"><canvas id="ch_plan"></canvas></div><div class="empty" id="e_plan" hidden></div>' +
      '<div class="tw" style="margin-top:10px"><table id="plan_tbl"><thead><tr><th>Term</th><th>Courses</th><th class="num">cr</th><th class="num">term GPA</th><th class="num">CGPA after</th><th class="num">Δ</th></tr></thead><tbody></tbody></table></div></div>' +

      '<div class="card"><h2><span class="n">LEV</span> Where your effort pays</h2>' +
      '<p class="note">Each bar is the CGPA you gain by scoring the target below instead of a bare pass. The last column is what one extra failure of that course costs your graduating CGPA.</p>' +
      '<div class="grid2" style="gap:24px"><div class="slider" style="margin-top:0"><div class="slider-lab"><span>Target score for the comparison</span><span class="val green" id="lev_tv"></span></div><input type="range" min="60" max="100" data-path="ui.levTarget" data-type="num" aria-label="Target score"></div>' +
      '<div class="field"><span>If a course fails once, it is retaken at</span><select data-path="ui.levRetake" data-type="numnull" id="lev_rt"><option value="">the score I planned</option><option value="60">60% (bare pass)</option><option value="65">65%</option><option value="70">70%</option><option value="85">85%</option></select></div></div>' +
      '<div class="tw" style="margin-top:12px"><table id="lev_tbl"><thead><tr><th>Course</th><th>cr</th><th>type</th><th id="lev_h">gain</th><th>cost if failed once</th></tr></thead><tbody></tbody></table></div>' +
      '<p class="note" id="lev_sum" style="margin-top:10px"></p></div>';

    UI.wire(el, {
      addPlan: addPlan,
      calcAdd: calcAdd,
      calcCode: function () { calcCodeChanged(); },
      calcType: function (t) { UI.$('#sc_fw', el).hidden = t.value !== 'ret'; },
      calcAll: function (t) {
        var v = Math.round(+t.value), S = Store.get(), cur = calcTermOf(S);
        UI.text(UI.$('#sc_allv', el), v + '%');
        Store.update(function (S2) { S2.plan.forEach(function (r) { if (r.active !== false && String(r.term || '').trim() && G.termOrder(r.term) === G.termOrder(cur)) r.expected = v; }); S2.ui.touched = true; });
      },
      auto: function () {
        Store.update(function (S) {
          var term = startTerm(S), used = 0, n = 0, max = +S.ui.maxCreditsPerTerm || 12;
          S.plan.forEach(function (r) {
            if (r.active === false || String(r.term || '').trim() !== '') return;
            var cr = +r.credits || 0;
            if (used + cr > max && used > 0) { term = G.nextTerm(term, S.config.terms); used = 0; }
            r.term = term; used += cr; n++;
          });
          UI.text(UI.$('#pl_msg', el), n ? 'Distributed ' + n + ' course(s) from ' + startTerm(S) : 'Nothing unassigned');
        }, { force: true });
      },
      clearTerms: function () { Store.update(function (S) { S.plan.forEach(function (r) { r.term = ''; }); }, { force: true }); UI.text(UI.$('#pl_msg', el), 'Terms cleared'); },
      addCol: function () {
        var S = Store.get(), all = boardTerms(S), last = all[all.length - 1] || startTerm(S);
        Store.update(function (S2) { S2.ui.extraTerms = (S2.ui.extraTerms || []).concat([G.nextTerm(last, S2.config.terms)]); });
      },
      delPlan: function (t) { var i = +t.dataset.i; Store.update(function (S) { S.plan.splice(i, 1); }, { force: true }); },
      histF: function (t) { setCarry(+t.dataset.i, 'failed', t.value); }, histA: function (t) { setCarry(+t.dataset.i, 'absent', t.value); },
      typeSel: function (t, ev) {
        if (ev.type !== 'change') return;
        var i = +t.dataset.i;
        Store.update(function (S) { var code = S.plan[i].code; if (t.value === 'ret') S.carry[code] = S.carry[code] || { failed: 1, absent: 0, lastAbsent: false }; else delete S.carry[code]; }, { force: true });
      },
      applyFill: function () { Store.update(function (S) { S.ui.fill = true; }); },
      noFill: function () { Store.update(function (S) { S.ui.fill = false; }); },
      rederive: function () { Store.update(function (S) { S.plan = []; Store.syncPlan(S); }, { force: true }); UI.toast('Plan re-derived from your degree template'); },
      dragstart: function (ev) { var c = ev.target.closest && ev.target.closest('.cc'); if (!c) return; dragIdx = +c.dataset.i; ev.dataTransfer.effectAllowed = 'move'; try { ev.dataTransfer.setData('text/plain', String(dragIdx)); } catch (e) {} c.classList.add('dragging'); },
      dragover: function (ev) { var col = ev.target.closest && ev.target.closest('.col'); if (col && dragIdx != null) { ev.preventDefault(); col.classList.add('over'); } },
      dragleave: function (ev) { var col = ev.target.closest && ev.target.closest('.col'); if (col && !col.contains(ev.relatedTarget)) col.classList.remove('over'); },
      drop: function (ev) {
        var col = ev.target.closest && ev.target.closest('.col'); if (!col || dragIdx == null) return;
        ev.preventDefault(); col.classList.remove('over');
        var i = dragIdx, term = col.dataset.term === '__none' ? '' : col.dataset.term; dragIdx = null;
        Store.update(function (S) { if (S.plan[i]) S.plan[i].term = term; }, { force: true });
      },
      dragend: function () { dragIdx = null; UI.$$('.dragging,.over', el).forEach(function (x) { x.classList.remove('dragging', 'over'); }); }
    });
    UI.$('#pa_code', el).addEventListener('input', codeChanged);
    UI.$('#pa_code', el).addEventListener('change', codeChanged);
    UI.$('#pa_type', el).addEventListener('change', function () { UI.$('#pa_ret', el).hidden = this.value !== 'ret' || !!UI.$('#pa_type', el).disabled; });
    ['#rem_tbl', '#calc_tbl'].forEach(function (id) { UI.$(id, el).addEventListener('input', function (e) { if (e.target.dataset.path && /\.expected$/.test(e.target.dataset.path)) S_touch(); }); });
  }
  function S_touch() { var S = Store.get(); if (!S.ui.touched) S.ui.touched = true; }

  function setCarry(i, key, val) {
    var v = Math.max(0, parseInt(val) || 0);
    Store.update(function (S) {
      var code = S.plan[i].code, c = S.carry[code] = S.carry[code] || { failed: 0, absent: 0 };
      c[key] = v; c.lastAbsent = c.absent > 0 && c.failed === 0;
      if (c.failed + c.absent === 0) delete S.carry[code];
    });
  }
  function canon(S, code) {
    code = code.trim(); var lc = code.toLowerCase(), hit = null;
    S.degree.curriculum.forEach(function (c) { if (c.code.toLowerCase() === lc || (c.aliases || []).some(function (a) { return a.toLowerCase() === lc; })) hit = c.code; });
    S.plan.forEach(function (c) { if (c.code.toLowerCase() === lc) hit = hit || c.code; });
    S.attempts.forEach(function (c) { if (c.course.toLowerCase() === lc) hit = hit || c.course; });
    return hit || code;
  }
  function codeChanged() {
    var S = Store.get(), code = canon(S, UI.$('#pa_code', el).value), cur = S.degree.curriculum.filter(function (c) { return c.code === code; })[0];
    if (cur) { UI.$('#pa_cr', el).value = cur.credits; if (!UI.$('#pa_name', el).value) UI.$('#pa_name', el).value = cur.name; }
    var hist = G.planHistory(S, code), type = UI.$('#pa_type', el), box = UI.$('#pa_ret', el);
    var hasAtt = S.attempts.some(function (a) { return a.course === code; });
    if (hasAtt) { type.value = 'ret'; type.disabled = true; box.hidden = true; UI.text(UI.$('#pa_msg', el), code + ' has ' + hist.length + ' logged attempt(s): counted as a retake automatically.'); UI.$('#pa_msg', el).className = 'msg'; }
    else { type.disabled = false; box.hidden = type.value !== 'ret'; if (UI.$('#pa_msg', el).textContent.indexOf('logged attempt') >= 0) UI.text(UI.$('#pa_msg', el), ''); }
  }
  /** Validate and add one course to the plan. Returns an error string, or null when added. */
  function addCourseFrom(o) {
    var S = Store.get(), code = canon(S, o.code || ''), hasAtt = S.attempts.some(function (a) { return a.course === code; });
    if (!code) return 'Enter a course code.';
    if (!(o.cr > 0)) return 'Credits must be a positive number.';
    if (o.term && !G.termOrder(o.term)) return 'Term not understood. Use e.g. Sep2026, or leave it empty.';
    if (o.exp !== null && (isNaN(o.exp) || o.exp < 0 || o.exp > 100)) return 'Expected score must be between 0 and 100.';
    if (S.plan.some(function (r) { return r.code === code; })) return code + ' is already in the plan. Edit its score or term instead.';
    if (G.isPassedCourse(S, code)) return code + ' is already passed in your logged courses.';
    Store.update(function (S2) {
      var cur = S2.degree.curriculum.filter(function (c) { return c.code === code; })[0];
      S2.plan.push({ code: code, name: o.name || (cur ? cur.name : ''), credits: o.cr, term: o.term || '', expected: o.exp, active: true, level: cur ? cur.level : undefined });
      if (o.type === 'ret' && !hasAtt && o.f + o.a > 0) S2.carry[code] = { failed: o.f, absent: o.a, lastAbsent: o.a > 0 && o.f === 0 };
      S2.ui.touched = S2.ui.touched || o.exp !== null;
    }, { force: true });
    return null;
  }
  function addPlan() {
    var S = Store.get(), msg = UI.$('#pa_msg', el);
    var expRaw = UI.$('#pa_exp', el).value.trim(), type = UI.$('#pa_type', el).value;
    var hasAtt = S.attempts.some(function (a) { return a.course === canon(S, UI.$('#pa_code', el).value); });
    var err = addCourseFrom({ code: UI.$('#pa_code', el).value, name: UI.$('#pa_name', el).value.trim(), cr: parseFloat(UI.$('#pa_cr', el).value), term: UI.$('#pa_term', el).value.trim(),
      exp: expRaw === '' ? null : parseFloat(expRaw), type: type, f: parseInt(UI.$('#pa_f', el).value) || 0, a: parseInt(UI.$('#pa_a', el).value) || 0 });
    if (err) { msg.className = 'msg err'; msg.textContent = err; return; }
    msg.className = 'msg ok'; msg.textContent = 'Added ' + canon(S, UI.$('#pa_code', el).value) + (type === 'ret' || hasAtt ? ' as a retake.' : '.');
    ['pa_code', 'pa_name', 'pa_exp'].forEach(function (id) { UI.$('#' + id, el).value = ''; });
    UI.$('#pa_type', el).disabled = false; UI.$('#pa_type', el).value = 'new'; UI.$('#pa_ret', el).hidden = true; UI.$('#pa_code', el).focus();
  }

  /* ----- semester calculator ----- */
  function calcTermOf(S) {
    var terms = boardTerms(S);
    if (S.ui.calcTerm && terms.indexOf(S.ui.calcTerm) >= 0) return S.ui.calcTerm;
    var st = startTerm(S), i = Math.max(0, terms.indexOf(st));
    for (var k = i; k < terms.length; k++) { var inf = G.termInfo(terms[k], S.config.terms); if (!inf || inf.kind !== 'Summer') return terms[k]; }
    return terms[i];
  }
  function calcCodeChanged() {
    var S = Store.get(), code = canon(S, UI.$('#sc_code', el).value), cur = S.degree.curriculum.filter(function (c) { return c.code === code; })[0];
    if (cur) UI.$('#sc_cr', el).value = cur.credits;
    var type = UI.$('#sc_type', el), hasAtt = S.attempts.some(function (a) { return a.course === code; });
    if (hasAtt) { type.value = 'ret'; type.disabled = true; UI.$('#sc_fw', el).hidden = true; UI.text(UI.$('#sc_msg', el), code + ' is in your logged courses: counted as a retake automatically.'); UI.$('#sc_msg', el).className = 'msg'; }
    else { type.disabled = false; UI.$('#sc_fw', el).hidden = type.value !== 'ret'; }
  }
  function calcAdd() {
    var S = Store.get(), msg = UI.$('#sc_msg', el), expRaw = UI.$('#sc_exp', el).value.trim(), type = UI.$('#sc_type', el).value, cur = calcTermOf(S);
    var code = canon(S, UI.$('#sc_code', el).value), hasAtt = S.attempts.some(function (a) { return a.course === code; });
    var idx = S.plan.findIndex(function (r) { return r.code === code; });
    if (idx >= 0) {
      Store.update(function (S2) {
        var r = S2.plan[idx]; r.term = cur; r.active = true;
        if (expRaw !== '' && !isNaN(parseFloat(expRaw))) { r.expected = Math.max(0, Math.min(100, parseFloat(expRaw))); S2.ui.touched = true; }
      }, { force: true });
      msg.className = 'msg ok'; msg.textContent = code + ' was already in your plan: moved into ' + cur + (expRaw !== '' ? ' with your score.' : '.');
      ['sc_code', 'sc_exp'].forEach(function (id) { UI.$('#' + id, el).value = ''; });
      UI.$('#sc_code', el).focus(); return;
    }
    var err = addCourseFrom({ code: UI.$('#sc_code', el).value, name: '', cr: parseFloat(UI.$('#sc_cr', el).value), term: cur, exp: expRaw === '' ? null : parseFloat(expRaw), type: type, f: parseInt(UI.$('#sc_f', el).value) || 0, a: 0 });
    if (err) { msg.className = 'msg err'; msg.textContent = err; return; }
    msg.className = 'msg ok'; msg.textContent = 'Added ' + code + ' to ' + cur + (type === 'ret' || hasAtt ? ' (retake: repeat penalty applied).' : '.');
    ['sc_code', 'sc_exp'].forEach(function (id) { UI.$('#' + id, el).value = ''; });
    UI.$('#sc_type', el).disabled = false; UI.$('#sc_type', el).value = 'new'; UI.$('#sc_fw', el).hidden = true; UI.$('#sc_code', el).focus();
  }
  function fillCalc(D, terms) {
    var S = D.S, o = D.o, tot = D.tot, cur = calcTermOf(S), curO = G.termOrder(cur), info = G.termInfo(cur, S.config.terms);
    var sel = UI.$('#calc_term', el);
    UI.paint(sel, terms.map(function (t) { return '<option value="' + UI.esc(t) + '">' + UI.esc(UI.termLabel(S, t)) + '</option>'; }).join(''));
    if (document.activeElement !== sel) sel.value = cur;
    UI.text(UI.$('#calc_info', el), info ? info.kind + ' ' + info.academicYear + ': ' + info.detail : '');
    var all = S.plan.map(function (r, i) { return { r: r, i: i, o: G.termOrder(String(r.term || '').trim()) }; }).filter(function (x) { return x.r.active !== false && x.o; });
    var here = all.filter(function (x) { return x.o === curO; }), prior = all.filter(function (x) { return x.o < curO; });
    var priorCodes = prior.map(function (x) { return x.r.code; }), hereCodes = here.map(function (x) { return x.r.code; });
    var before = G.projectParts(S, Object.assign({}, o, { only: priorCodes, fill: false }), tot).cgpa;
    var after = G.projectParts(S, Object.assign({}, o, { only: priorCodes.concat(hereCodes), fill: false }), tot);
    var empty = !here.length;
    UI.$('#calc_tw', el).hidden = empty; UI.$('#sc_allw', el).hidden = empty;
    var res = '';
    if (empty) res = '<div class="empty" style="padding:14px"><b>No courses in ' + UI.esc(cur) + ' yet</b>Add the courses you take in this term below. Each one you add moves your CGPA.</div>';
    else {
      var courses = here.map(function (x) { return x.r; }), sg = G.termGPA(S, courses, o, tot), cr = courses.reduce(function (s, c) { return s + (+c.credits || 0); }, 0), d = after.cgpa - before;
      var ti = G.scoreForTarget(S, S.ui.target, { sn: o.sn, sr: o.sr, only: priorCodes.concat(hereCodes), uniformFor: hereCodes }, tot);
      var tline = ti.already ? 'Your ' + UI.f(S.ui.target, 2) + ' target is already met by just passing these.' : ti.possible ? 'To have <b>' + UI.f(S.ui.target, 2) + '</b> by the end of this term you need about <b>' + UI.f(ti.score, 1) + '%</b> on average in these courses.' : 'A ' + UI.f(S.ui.target, 2) + ' CGPA is out of reach this term (best case ' + UI.f(ti.ceiling) + ').';
      res = '<div class="grid3" style="gap:10px">' +
        '<div class="stat"><div class="k">Semester GPA</div><div class="v">' + UI.f(sg, 2) + '</div><div class="d">≈ ' + UI.f(G.gpaToPct(sg, S.config), 1) + '% · ' + UI.num(cr) + ' cr this term</div></div>' +
        '<div class="stat"><div class="k">New CGPA after ' + UI.esc(cur) + '</div><div class="v ' + (d >= 0 ? 'green' : 'red') + '">' + UI.f(after.cgpa) + '</div><div class="d">' + UI.signed(d) + ' from ' + UI.f(before) + (prior.length ? ' (with earlier planned terms)' : ' now') + '</div></div>' +
        '<div class="stat"><div class="k">German grade (est.)</div><div class="v">' + UI.germanText(after.cgpa, S) + '</div><div class="d">was ' + UI.germanText(before, S) + '</div></div></div>' +
        '<p class="note" style="margin:10px 0 0">' + tline + '</p>';
    }
    UI.paint(UI.$('#calc_result', el), res);
    UI.paint(UI.$('#calc_tbl tbody', el), here.map(function (x) {
      var r = x.r, rt = G.isRetake(S, r, tot), eff = G.expectedScore(r, rt, o.sn, o.sr), g = G.scoreToGPA(eff, false, r.code, tot.ctx);
      var alone = G.projectParts(S, Object.assign({}, o, { only: priorCodes.concat([r.code]), fill: false }), tot).cgpa - before;
      var nm = r.name || '';
      return '<tr><td>' + UI.esc(r.code) + (nm ? ' <span class="muted">' + UI.esc(nm) + '</span>' : '') + ' <span class="tag ' + (rt ? 'ret' : 'new') + '">' + (rt ? 'retake' : 'new') + '</span></td>' +
        '<td class="num">' + UI.field('plan.' + x.i + '.credits', r.credits, { min: 0.5, step: 0.5, label: 'Credits' }) + '</td>' +
        '<td>' + UI.field('plan.' + x.i + '.expected', r.expected == null ? '' : r.expected, { type: 'numnull', min: 0, max: 100, ph: String(eff), label: 'Expected score' }) + '</td>' +
        '<td>' + UI.badge(G.letter(eff, false, r.code, tot.ctx)) + '</td><td class="num">' + g.toFixed(1) + '</td>' +
        '<td class="num ' + (alone >= 0 ? 'green' : 'red') + '">' + UI.signed(alone) + '</td>' +
        '<td><button class="btn sm danger" data-act="delPlan" data-i="' + x.i + '" aria-label="Remove ' + UI.esc(r.code) + '">×</button></td></tr>';
    }).join(''));
    var note = 'Counts only courses planned for this term' + (prior.length ? ' plus the ' + prior.length + ' you planned in earlier terms' : '') + '. “Effect on CGPA” is what that course would do on its own. Retakes include their earlier fails as a repeat penalty automatically.';
    var unsched = S.plan.filter(function (r) { return r.active !== false && !String(r.term || '').trim(); }).length;
    if (unsched) note += ' ' + unsched + ' planned course' + (unsched === 1 ? ' has' : 's have') + ' no term yet and ' + (unsched === 1 ? 'is' : 'are') + ' not counted here.';
    UI.text(UI.$('#calc_note', el), note);
  }

  function fill(D) {
    var S = D.S, tot = D.tot, o = D.o, cfg = S.config, c = UI.colors();
    var terms = boardTerms(S);
    UI.syncFields(el, S);
    fillCalc(D, terms);

    /* datalists */
    var names = {}; S.degree.curriculum.forEach(function (x) { names[x.code] = x.name; });
    var open = S.degree.curriculum.filter(function (x) { return !(tot.byCode[x.code] && tot.byCode[x.code].passed); });
    UI.paint(UI.$('#dl_pcodes', el), open.map(function (x) { return '<option value="' + UI.esc(x.code) + '">' + UI.esc(x.name) + '</option>'; }).join(''));
    UI.paint(UI.$('#dl_pterms', el), terms.map(function (t) { return '<option value="' + UI.esc(t) + '">' + UI.esc(UI.termLabel(S, t)) + '</option>'; }).join(''));
    var st = UI.$('#pl_start', el); if (document.activeElement !== st && !S.ui.startTerm) st.placeholder = startTerm(S);

    /* board */
    var tl = G.projectTimeline(S, o, tot), byTerm = {}; tl.points.forEach(function (p) { byTerm[p.term] = p; });
    var max = +S.ui.maxCreditsPerTerm || 0;
    function chip(r, i) {
      var rt = G.isRetake(S, r, tot), sc = G.expectedScore(r, rt, o.sn, o.sr);
      return '<div class="cc ' + (rt ? 'ret' : 'new') + '" draggable="true" data-i="' + i + '" title="' + UI.esc((r.name || '') + (rt ? ' · retake' : ' · new')) + '"><span class="code">' + UI.esc(r.code) + '</span><span class="meta">' + (+r.credits || 0) + ' cr · ' + sc + '%</span></div>';
    }
    function col(label, key, items) {
      var cr = items.reduce(function (s, x) { return s + (+x.r.credits || 0); }, 0), pt = byTerm[key === '__none' ? 'Unassigned' : key], over = max && key !== '__none' && cr > max;
      var sub = key === '__none' ? 'not scheduled yet' : (pt ? 'term GPA ' + UI.f(G.termGPA(S, items.map(function (x) { return x.r; }), o, tot), 2) + ' · CGPA ' + UI.f(pt.cgpa) + ' (' + UI.signed(pt.delta) + ')' : 'drop courses here');
      var tag = key === '__none' ? '' : UI.termTag(S, key);
      return '<div class="col" data-term="' + UI.esc(key) + '"><div class="col-h"><b>' + UI.esc(label) + '</b><span class="cr' + (over ? ' over' : '') + '">' + UI.num(cr) + ' cr' + (over ? ' ⚠' : '') + '</span></div>' + (tag ? '<div>' + tag + '</div>' : '') + '<div class="col-s">' + sub + '</div>' +
        items.map(function (x) { return chip(x.r, x.i); }).join('') + '</div>';
    }
    var act = S.plan.map(function (r, i) { return { r: r, i: i }; }).filter(function (x) { return x.r.active !== false; });
    var bh = col('Unassigned', '__none', act.filter(function (x) { return !String(x.r.term || '').trim(); }));
    terms.forEach(function (t) { bh += col(t, t, act.filter(function (x) { return String(x.r.term || '').trim() === t; })); });
    UI.paint(UI.$('#board', el), bh);
    var warn = '', excl = S.plan.filter(function (r) { return r.active === false; });
    if (excl.length) warn += '<div class="rec"><span class="ic">i</span><span>Left out of the projection: <b>' + excl.map(function (r) { return UI.esc(r.code); }).join(', ') + '</b> (' + excl.reduce(function (s, r) { return s + (+r.credits || 0); }, 0) + ' cr). They still block graduation until passed.</span></div>';
    UI.paint(UI.$('#pl_warn', el), warn);

    /* table */
    var tot_cr = 0, newC = 0, retC = 0;
    var th = S.plan.map(function (r, i) {
      var cr = +r.credits || 0, rt = G.isRetake(S, r, tot), att = tot.byCode[r.code], hist = G.planHistory(S, r.code, tot), eff = G.expectedScore(r, rt, o.sn, o.sr);
      tot_cr += cr; if (rt) retC += cr; else newC += cr;
      var nm = r.name || names[r.code] || '';
      var histCell;
      if (att) histCell = '<span class="tag ret">' + hist.length + ' attempt' + (hist.length === 1 ? '' : 's') + '</span> <span class="muted" style="font-size:11px">from your log</span>';
      else if (rt) {
        var cc = S.carry[r.code] || { failed: 0, absent: 0 };
        histCell = 'failed <input type="number" min="0" value="' + (cc.failed | 0) + '" data-on="histF" data-i="' + i + '" data-fk="hf' + i + '" style="width:54px" aria-label="Times failed"> absent <input type="number" min="0" value="' + (cc.absent | 0) + '" data-on="histA" data-i="' + i + '" data-fk="ha' + i + '" style="width:54px" aria-label="Times absent">';
      } else histCell = '<select data-on="typeSel" data-i="' + i + '" data-fk="ty' + i + '" aria-label="New or retake"><option value="new" selected>new</option><option value="ret">retake</option></select>';
      return '<tr class="' + (r.active === false ? 'dim' : '') + '"><td><input type="checkbox" data-path="plan.' + i + '.active" data-type="bool"' + (r.active !== false ? ' checked' : '') + ' aria-label="Include ' + UI.esc(r.code) + '"></td>' +
        '<td>' + UI.esc(r.code) + (nm ? ' <span class="muted">' + UI.esc(nm) + '</span>' : '') + '</td>' +
        '<td>' + UI.field('plan.' + i + '.credits', r.credits, { min: 0.5, step: 0.5, label: 'Credits' }) + '</td>' +
        '<td>' + histCell + '</td>' +
        '<td>' + UI.select('plan.' + i + '.term', String(r.term || ''), [['', '–']].concat(terms.map(function (t) { return [t, UI.termLabel(S, t)]; })), { label: 'Term' }) + '</td>' +
        '<td>' + UI.field('plan.' + i + '.expected', r.expected == null ? '' : r.expected, { type: 'numnull', min: 0, max: 100, ph: String(eff), label: 'Expected score' }) + '</td>' +
        '<td class="num">' + G.scoreToGPA(eff, false, r.code, tot.ctx).toFixed(1) + '</td>' +
        '<td><button class="btn sm danger" data-act="delPlan" data-i="' + i + '" aria-label="Remove ' + UI.esc(r.code) + '">×</button></td></tr>';
    }).join('');
    if (!S.plan.length) th = '<tr><td colspan="8"><div class="empty"><b>Your plan is empty</b>Add the courses you are taking or planning above.</div></td></tr>';
    else th += '<tr class="grp"><td></td><td>TOTAL</td><td class="num">' + UI.num(tot_cr) + '</td><td colspan="5" class="muted" style="font-weight:400">' + UI.num(newC) + ' cr new · ' + UI.num(retC) + ' cr retake</td></tr>';
    UI.paint(UI.$('#rem_tbl tbody', el), th);
    UI.text(UI.$('#rem_tot', el), S.plan.length ? UI.num(tot_cr) + ' credits planned' : '');
    var btns = '';
    if (S.mode === 'full' && S.degree.curriculum.length) btns += '<button class="btn sm" data-act="rederive">Re-derive from degree template</button>';
    UI.paint(UI.$('#rem_btns', el), btns);

    /* reconciliation */
    var cs = D.cs, planned = tot_cr, gap = cs.earned + planned - cs.total, w = '', un = G.unallocatedCredits(S, cs);
    if (S.plan.length || cs.earned) {
      if (Math.abs(gap) < 0.001) w += '<div class="rec up"><span class="ic">✓</span><span>Reconciled: <b>' + cs.earned + ' earned + ' + UI.num(planned) + ' planned = ' + cs.total + ' cr</b>, exactly the degree total.</span></div>';
      else if (gap > 0) w += '<div class="rec warn"><span class="ic">!</span><span>Earned + planned = <b>' + UI.num(cs.earned + planned) + ' cr</b>, which is <b>' + UI.num(gap) + ' cr over</b> the ' + cs.total + ' cr degree. Check credits or remove a course.</span></div>';
      else w += '<div class="rec"><span class="ic">i</span><span><b>' + UI.num(-gap) + ' remaining credits are not planned yet.</b> ' + (S.ui.fill !== false ? 'The projection assumes you average <b>' + o.sn + '%</b> on them. <a href="#" data-act="noFill">Ignore them instead</a>.' : 'They are ignored in the projection. <a href="#" data-act="applyFill">Assume ' + o.sn + '% on them</a>.') + '</span></div>';
    }
    if (cs.earnedExtra > 0) w += '<div class="rec"><span class="ic">i</span><span>You also passed <b>' + cs.earnedExtra + ' cr outside the degree list</b>. They are excluded from the 146-style total but follow your Settings for CGPA.</span></div>';
    UI.paint(UI.$('#rem_warn', el), w);
    UI.$$('#rem_warn a', el).forEach(function (a) { a.onclick = function (e) { e.preventDefault(); (a.dataset.act === 'noFill' ? Store.update(function (S2) { S2.ui.fill = false; }) : Store.update(function (S2) { S2.ui.fill = true; })); }; });

    /* PLAN chart */
    var pts = tl.points;
    if (!pts.length) { UI.$('#ch_plan', el).parentNode.hidden = true; UI.$('#e_plan', el).hidden = false; UI.$('#e_plan', el).innerHTML = '<b>Nothing scheduled</b>Drag courses into terms (or press Auto-distribute) to see the path.'; }
    else {
      UI.$('#ch_plan', el).parentNode.hidden = false; UI.$('#e_plan', el).hidden = true;
      var labels = ['Now'].concat(pts.map(function (p) { return p.term === 'Unassigned' ? 'Unscheduled' : p.term; })), vals = [tl.start].concat(pts.map(function (p) { return p.cgpa; }));
      UI.chart('ch_plan', 'line', { labels: labels, datasets: [
        { label: 'Projected CGPA', data: vals, borderColor: c.purple, backgroundColor: UI.alpha(c.purple, 0.1), borderWidth: 2.5, fill: true, tension: 0.25, pointRadius: 4, pointBackgroundColor: c.card, pointBorderColor: c.purple, pointBorderWidth: 2 },
        { label: 'Target', data: labels.map(function () { return S.ui.target; }), borderColor: c.ink2, borderWidth: 1.2, borderDash: [6, 5], pointRadius: 0 }
      ] }, UI.lineOpts(UI.axis(vals.concat([S.ui.target]), { ceil: cfg.maxGPA })));
    }
    UI.paint(UI.$('#plan_tbl tbody', el), pts.map(function (p) {
      var cr = p.credits, over = max && p.term !== 'Unassigned' && cr > max;
      return '<tr' + (p.term === 'Unassigned' ? ' class="muted"' : '') + '><td><b>' + UI.esc(p.term) + '</b></td><td style="font-size:11.5px">' + p.courses.map(function (x) { return UI.esc(x.code); }).join(', ') + '</td><td class="num' + (over ? ' red' : '') + '">' + UI.num(cr) + '</td><td class="num">' + UI.f(G.termGPA(S, p.courses, o, tot), 2) + '</td><td class="num"><b>' + UI.f(p.cgpa) + '</b></td><td class="num ' + (p.delta >= 0 ? 'green' : 'red') + '">' + UI.signed(p.delta) + '</td></tr>';
    }).join('') || '<tr><td colspan="6" class="muted">No scheduled courses yet.</td></tr>');

    /* LEV */
    var lt = S.ui.levTarget || 85, rs = S.ui.levRetake;
    UI.text(UI.$('#lev_tv', el), lt + '%'); UI.text(UI.$('#lev_h', el), 'gain 60 → ' + lt);
    var sel = UI.$('#lev_rt', el); if (document.activeElement !== sel) sel.value = rs == null ? '' : String(rs);
    var lev = G.leverage(S, { sn: o.sn, sr: o.sr, target: lt, retakeScore: rs == null ? undefined : rs }, tot);
    var mx = Math.max.apply(null, lev.map(function (x) { return x.gain; }).concat([1e-9]));
    UI.paint(UI.$('#lev_tbl tbody', el), lev.map(function (x) {
      var pc = Math.round(100 * x.gain / mx), cc = x.cost > 0.02 ? 'red' : (x.cost > 0.005 ? 'amber' : '');
      var ct = Math.abs(x.cost) < 0.0005 ? '~0' : (x.cost > 0 ? '−' : '+') + Math.abs(x.cost).toFixed(3);
      var nm = x.item.name || names[x.code] || '';
      return '<tr><td>' + UI.esc(x.code) + (nm ? ' <span class="muted">' + UI.esc(nm) + '</span>' : '') + '</td><td>' + x.cr + '</td><td><span class="tag ' + (x.retake ? 'ret' : 'new') + '">' + (x.retake ? 'retake' : 'new') + '</span></td>' +
        '<td><span class="bar" style="width:' + Math.max(pc * 0.8, 3) + 'px;background:' + (x.retake ? 'var(--amber)' : 'var(--green)') + '"></span><b>+' + x.gain.toFixed(3) + '</b></td><td class="' + cc + '">' + ct + '</td></tr>';
    }).join('') || '<tr><td colspan="5" class="muted">Add courses to see their leverage.</td></tr>');
    if (lev.length > 1) {
      var byCost = lev.slice().sort(function (a, b) { return b.cost - a.cost; }), cheap = byCost[byCost.length - 1];
      UI.text(UI.$('#lev_sum', el), 'Biggest payoff: ' + lev[0].code + ' (+' + lev[0].gain.toFixed(3) + ' CGPA at ' + lt + '% instead of a bare pass). Costliest failure: ' + byCost[0].code + ' (−' + byCost[0].cost.toFixed(3) + '). Cheapest failure: ' + cheap.code + ' (' + (Math.abs(cheap.cost) < 0.0005 ? '~0' : '−' + Math.abs(cheap.cost).toFixed(3)) + '): its repeat penalty is already booked, though it still blocks graduation.');
    } else UI.text(UI.$('#lev_sum', el), '');
  }

  return { mount: mount, fill: fill, startTerm: startTerm };
})();
