/* Overview: the one-screen summary. Every number here is derived from the same profile as the other tabs. */
UI.Overview = (function () {
  'use strict';
  var G = window.GPA, el = null;
  function short(l) { return String(l).replace(/^([A-Za-z؀-ۿ]+)\s*(\d\d)(\d\d)$/, "$1 '$3"); }

  function mount(root) {
    el = root;
    el.innerHTML =
      '<div class="card" id="ov_stepsCard"><h2>Get set up <button class="btn sm ghost" data-act="hideSteps" style="margin-left:auto">hide</button></h2><div class="steps" id="ov_steps" style="margin-top:8px"></div></div>' +
      '<div class="card"><h2><span class="n">STAT</span> At a glance</h2><div class="stats" id="ov_stats" style="margin-top:10px"></div></div>' +
      '<div class="grid2">' +
      '<div class="card"><h2><span class="n">CH1</span> CGPA timeline</h2><p class="note">Computed CGPA after each term (green), your official numbers if you entered them (blue), and the plan projected forward (purple). Dashed line is your target.</p><div class="chartbox"><canvas id="ch_timeline"></canvas></div><div class="empty" id="e_timeline" hidden></div></div>' +
      '<div class="card"><h2><span class="n">CH2</span> Term GPA trend</h2><p class="note">Credit-weighted GPA of each term on its own, counting fails and absences. A trend indicator, not an official figure.</p><div class="chartbox"><canvas id="ch_semtrend"></canvas></div><div class="empty" id="e_semtrend" hidden></div></div>' +
      '</div>' +
      '<div class="grid2">' +
      '<div class="card"><h2><span class="n">CH5</span> Credit progress</h2><p class="note">Earned, planned (new / retake) and not yet planned.</p><div class="chartbox"><canvas id="ch_credit"></canvas></div></div>' +
      '<div class="card"><h2><span class="n">CH6</span> Projection comparison</h2><p class="note">Graduating CGPA if you average these scores on new courses / retakes. Updates with your plan.</p><div class="chartbox"><canvas id="ch_proj"></canvas></div><div class="empty" id="e_proj" hidden></div></div>' +
      '</div>' +
      '<div class="card"><h2><span class="n">REC</span> What to do next</h2>' +
      '<div class="slider"><div class="slider-lab"><span>Target graduating CGPA</span><span class="val purple" id="ov_tgtV"></span></div><input type="range" id="ov_tgt" min="1" max="5" step="0.01" data-path="ui.target" data-type="num" aria-label="Target CGPA"></div>' +
      '<div id="ov_recs"></div></div>';
    UI.wire(el, {
      hideSteps: function () { Store.update(function (S) { S.ui.hideSteps = true; }); },
      go: function (t) { App.go(t.dataset.to); }
    });
  }

  function steps(D) {
    var S = D.S, planned = S.plan.filter(function (r) { return r.active !== false; });
    var hasExp = planned.some(function (r) { return r.expected != null && r.expected !== ''; }) || S.ui.touched;
    var list = [
      ['Starting point', S.mode === 'quick' ? 'CGPA ' + UI.f(S.baseline.cgpa, 2) + ' · ' + S.baseline.gpaHours + ' h' : D.S.attempts.length + ' attempts', true, 'settings'],
      [S.mode === 'quick' ? 'Add old courses (optional)' : 'Add your courses', S.attempts.length ? S.attempts.length + ' entered' : 'for charts & repeat penalties', S.attempts.length > 0, 'transcript'],
      ['Plan your courses', planned.length ? planned.length + ' planned' : 'this or next semester', planned.length > 0, 'plan'],
      ['Check the projection', hasExp ? 'scores set' : 'set expected scores', hasExp, 'projection']
    ];
    return list.map(function (s, i) {
      return '<button class="step' + (s[2] ? ' done' : '') + '" data-act="go" data-to="' + s[3] + '"><span class="s">' + (s[2] ? '✓ DONE' : 'STEP ' + (i + 1)) + '</span><b>' + s[0] + '</b>' + UI.esc(s[1]) + '</button>';
    }).join('');
  }

  function stats(D) {
    var S = D.S, cs = D.cs, tot = D.tot, cfg = S.config, att = S.attempts, sems = D.sems;
    var act = S.plan.filter(function (r) { return r.active !== false; }), newCr = 0, retCr = 0;
    act.forEach(function (r) { if (G.isRetake(S, r, tot)) retCr += +r.credits || 0; else newCr += +r.credits || 0; });
    var un = G.unallocatedCredits(S, cs);
    var cards = [
      ['CGPA', UI.f(tot.cgpa), '≈ ' + UI.f(G.gpaToPct(tot.cgpa, cfg), 1) + '%', 'amber'],
      ['Credits earned', cs.earned + ' / ' + cs.total, cs.earnedReq ? cs.earnedReq + ' university-requirement + ' + (cs.earned - cs.earnedReq - cs.baseEarned) + ' subject' : 'passed degree credits', 'blue'],
      ['Credits remaining', String(cs.remaining), (newCr || retCr || un) ? newCr + ' new + ' + retCr + ' retake planned' + (un ? ' · ' + UI.num(un) + ' not planned' : '') : 'nothing planned yet', 'amber'],
      ['Effective credits', UI.f(tot.D, 1), 'denominator · ' + UI.f(tot.N, 1) + ' quality points', '']
    ];
    if (sems.length) {
      var best = sems.reduce(function (a, b) { return b.gpa > a.gpa ? b : a; }), worst = sems.reduce(function (a, b) { return b.gpa < a.gpa ? b : a; });
      var pass = att.filter(function (a) { return G.isPass(a.absent ? null : a.score, a.absent, a.course, tot.ctx); }).length;
      cards.push(['Best term', UI.f(best.gpa, 2), best.label + ' · ≈ ' + UI.f(G.gpaToPct(best.gpa, cfg), 0) + '%', 'green']);
      cards.push(['Worst term', UI.f(worst.gpa, 2), worst.label + ' · ≈ ' + UI.f(G.gpaToPct(worst.gpa, cfg), 0) + '%', 'red']);
      cards.push(['Pass rate', UI.f(100 * pass / att.length, 1) + '%', att.length + ' attempts · ' + UI.f(100 * (1 - pass / att.length), 1) + '% fail/absent', 'green']);
      cards.push(['Attempts logged', String(att.length), 'across ' + sems.length + ' terms', '']);
    } else {
      cards.push(['Planned credits', UI.num(D.parts.plannedCredits), act.length + ' courses', '']);
      cards.push(['Projected CGPA', D.parts.items.length || D.parts.unallocated.credits ? UI.f(D.parts.cgpa) : '–', 'at ' + S.ui.sn + '% new / ' + S.ui.sr + '% retake', 'green']);
      cards.push(['Ceiling', UI.f(G.projectFinal(S, { uniform: 100 }, tot)), '100% on everything left', 'blue']);
      cards.push(['Quality points', UI.f(tot.N, 1), 'CGPA × hours counted', '']);
    }
    return cards.map(function (c) { return '<div class="stat"><div class="k">' + c[0] + '</div><div class="v ' + c[3] + '">' + c[1] + '</div><div class="d">' + UI.esc(c[2]) + '</div></div>'; }).join('');
  }

  function setEmpty(id, canvasId, msg) {
    var e = document.getElementById(id), cv = document.getElementById(canvasId);
    if (!e || !cv) return false;
    var box = cv.parentNode;
    if (msg) { box.hidden = true; e.hidden = false; e.innerHTML = msg; return true; }
    box.hidden = false; e.hidden = true; return false;
  }

  function fill(D) {
    var S = D.S, c = UI.colors(), cfg = S.config, tgt = S.ui.target;
    UI.$('#ov_stepsCard', el).hidden = !!S.ui.hideSteps;
    UI.paint(UI.$('#ov_steps', el), steps(D));
    UI.paint(UI.$('#ov_stats', el), stats(D));

    /* CH1 */
    var tl = D.timeline, plan = G.projectTimeline(S, D.o, D.tot), labels = tl.map(function (t) { return short(t.label); });
    var computed = tl.map(function (t) { return t.cgpa; }), n = tl.length;
    var official = {}; G.validSnapshots(S).forEach(function (s) { official[G.termOrder(s.term)] = s.cgpa; });
    var off = tl.map(function (t) { return official[t.order] != null ? official[t.order] : null; });
    var proj = tl.map(function (_, i) { return i === n - 1 ? tl[i].cgpa : null; });
    if (!n) { labels = ['Now']; computed = [D.tot.cgpa]; off = [null]; proj = [D.tot.cgpa]; n = 1; }
    plan.points.forEach(function (p) { labels.push(p.term === 'Unassigned' ? 'Unscheduled' : short(p.term)); computed.push(null); off.push(null); proj.push(p.cgpa); });
    var all = computed.concat(proj, off, [tgt]);
    var emptyTl = !tl.length && !plan.points.length;
    if (!setEmpty('e_timeline', 'ch_timeline', emptyTl ? '<b>Nothing to chart yet</b>Set your starting point or add courses.' : '')) {
      UI.chart('ch_timeline', 'line', { labels: labels, datasets: [
        { label: 'Computed CGPA', data: computed, borderColor: c.green, backgroundColor: UI.alpha(c.green, 0.1), borderWidth: 2.5, fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: c.card, pointBorderColor: c.green, pointBorderWidth: 2 },
        { label: 'Official', data: off, borderColor: c.blue, borderWidth: 2, borderDash: [2, 2], pointRadius: 4, pointBackgroundColor: c.blue, showLine: false },
        { label: 'Plan (projected)', data: proj, borderColor: c.purple, borderWidth: 2.5, borderDash: [5, 4], tension: 0.25, pointRadius: 4, pointBackgroundColor: c.card, pointBorderColor: c.purple, pointBorderWidth: 2 },
        { label: 'Target', data: labels.map(function () { return tgt; }), borderColor: c.ink2, borderWidth: 1.2, borderDash: [6, 5], pointRadius: 0 }
      ] }, UI.lineOpts(UI.axis(all, { ceil: cfg.maxGPA }), { legend: true }));
    }

    /* CH2 */
    var sems = D.sems;
    if (!setEmpty('e_semtrend', 'ch_semtrend', sems.length ? '' : '<b>No terms yet</b>Add past courses on the Courses tab to see how each term went.')) {
      UI.chart('ch_semtrend', 'line', { labels: sems.map(function (s) { return short(s.label); }), datasets: [
        { label: 'Term GPA', data: sems.map(function (s) { return s.gpa; }), borderColor: c.purple, backgroundColor: UI.alpha(c.purple, 0.1), borderWidth: 2.5, fill: true, tension: 0.32, pointRadius: 3, pointBackgroundColor: c.card, pointBorderColor: c.purple, pointBorderWidth: 2 },
        { label: 'Target', data: sems.map(function () { return tgt; }), borderColor: c.ink2, borderWidth: 1.2, borderDash: [6, 5], pointRadius: 0 }
      ] }, UI.lineOpts({ min: 0, max: cfg.maxGPA }, { dec: 2, step: 1 }));
    }

    /* CH5 */
    var act = S.plan.filter(function (r) { return r.active !== false; }), newC = 0, retC = 0;
    act.forEach(function (r) { if (G.isRetake(S, r, D.tot)) retC += +r.credits || 0; else newC += +r.credits || 0; });
    var unp = Math.max(0, D.cs.remaining - newC - retC);
    UI.chart('ch_credit', 'doughnut', { labels: ['Earned', 'Planned · new', 'Planned · retake', 'Not planned'], datasets: [{
      data: [D.cs.earned, newC, retC, unp], backgroundColor: [c.green, c.blue, c.amber, c.line], borderWidth: 2, borderColor: c.card }] },
      { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 }, padding: 12 } },
        tooltip: { callbacks: { label: function (x) { return ' ' + x.label + ': ' + x.parsed + ' cr'; } } } } });

    /* CH6 */
    var hasPlan = act.length > 0 || D.parts.unallocated.credits > 0;
    if (!setEmpty('e_proj', 'ch_proj', hasPlan ? '' : '<b>No plan yet</b>Add courses on the Plan tab to compare scenarios.')) {
      var sc = [['Now', D.tot.cgpa], ['Conserv. 75/60', G.projectFinal(S, { sn: 75, sr: 60 }, D.tot)], ['Realistic 85/65', G.projectFinal(S, { sn: 85, sr: 65 }, D.tot)],
        ['Optimistic 92/78', G.projectFinal(S, { sn: 92, sr: 78 }, D.tot)], ['Perfect', G.projectFinal(S, { sn: 100, sr: 100 }, D.tot)], ['Your plan', D.parts.cgpa]];
      var vals = sc.map(function (x) { return x[1]; }), ax = UI.axis(vals.concat([tgt]), { ceil: cfg.maxGPA });
      var o = UI.lineOpts(ax, {}); o.interaction = { mode: 'index', intersect: false };
      UI.chart('ch_proj', 'bar', { labels: sc.map(function (x) { return x[0]; }), datasets: [
        { type: 'bar', label: 'Graduating CGPA', data: vals, backgroundColor: vals.map(function (v, i) { return i === 0 ? c.slate : i === vals.length - 1 ? c.purple : (v >= tgt ? c.green : c.sand); }), borderWidth: 0, borderRadius: 5 },
        { type: 'line', label: 'Target', data: sc.map(function () { return tgt; }), borderColor: c.ink2, borderWidth: 1.2, borderDash: [6, 5], pointRadius: 0 }
      ] }, o);
    }

    /* REC */
    UI.text(UI.$('#ov_tgtV', el), UI.f(tgt, 2));
    var tg = UI.$('#ov_tgt', el); tg.max = cfg.maxGPA; if (document.activeElement !== tg || +tg.value !== tgt) tg.value = tgt;
    var recs = G.recommendations(S, { target: tgt, sn: S.ui.sn, sr: S.ui.sr }, D.tot);
    UI.paint(UI.$('#ov_recs', el), recs.map(function (r) { return '<div class="rec ' + r[0] + '"><span class="ic">' + r[1] + '</span><span>' + r[2] + '</span></div>'; }).join('') ||
      '<p class="note" style="margin-top:10px">Add a plan to get tailored suggestions.</p>');
  }

  return { mount: mount, fill: fill };
})();
