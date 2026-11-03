/* Projection tab: expected scores -> graduating CGPA, the exact formula, target solver, scenarios, risk simulation, German grade. */
UI.Projection = (function () {
  'use strict';
  var G = window.GPA, el = null, mcKey = '', mcTimer = null, mcRes = null, mcSeed = 1, uncRes = null;
  var PRESETS = { cons: [75, 60], real: [85, 65], opt: [92, 78], perf: [100, 100] };

  function mount(root) {
    el = root;
    el.innerHTML =
      '<div class="card"><h2><span class="n">PROJ</span> Graduation predictor</h2>' +
      '<p class="note">Set the scores you expect. Passing a course adds its credits to the denominator once; a course you attempted before stays in the denominator one extra time (one extra registration), which is why new courses move your CGPA far more than retakes. Per-course scores set on the Plan tab override these defaults.</p>' +
      '<div class="grid2" style="gap:28px"><div>' +
      '<div class="btnrow" id="presetRow"><button class="btn" data-act="preset" data-p="cons">Conservative</button><button class="btn" data-act="preset" data-p="real">Realistic</button><button class="btn" data-act="preset" data-p="opt">Optimistic</button><button class="btn" data-act="preset" data-p="perf">Perfect</button><button class="btn" data-p="cust" disabled>Custom</button></div>' +
      '<div class="slider"><div class="slider-lab"><span id="sn_lab">NEW courses average</span><span class="val green" id="sn_v"></span></div><input type="range" min="50" max="100" data-path="ui.sn" data-type="num" id="r_sn" aria-label="Average score on new courses"></div>' +
      '<div class="slider"><div class="slider-lab"><span id="sr_lab">RETAKES average</span><span class="val amber" id="sr_v"></span></div><input type="range" min="50" max="100" data-path="ui.sr" data-type="num" id="r_sr" aria-label="Average score on retakes"></div>' +
      '<label class="check" style="display:flex;gap:8px;align-items:center;font-size:13px;margin-top:14px"><input type="checkbox" data-path="ui.fill" data-type="bool" id="fillchk"> <span id="fill_lab">Assume credits I haven’t planned yet score the new-course average</span></label>' +
      '</div><div><div class="gauge"><span id="g_final">–</span><span class="delta" id="g_delta"></span><small id="g_sub"></small></div><div class="verdict mid" id="g_verdict"></div></div></div>' +
      '<div class="formula" id="formula"></div></div>' +

      '<div class="grid2"><div class="card"><h2><span class="n">TGT</span> Target calculator</h2>' +
      '<div class="slider" style="margin-top:6px"><div class="slider-lab"><span>Target graduating CGPA</span><span class="val purple" id="t_v"></span></div><input type="range" min="1" max="5" step="0.01" data-path="ui.target" data-type="num" id="r_tgt" aria-label="Target CGPA"></div>' +
      '<p class="note" id="t_out" style="margin-top:12px"></p>' +
      '<div class="cfg" style="margin-top:6px"><label>…or the CGPA after this term<select id="t_term"></select></label></div><p class="note" id="t_term_out" style="margin-top:10px"></p></div>' +

      '<div class="card"><h2><span class="n">GER</span> German grade <span class="help" title="Modified Bavarian formula: 1 + 3 × (Nmax − Nd) / (Nmax − Nmin)">?</span></h2>' +
      '<p class="note">An estimate for MSc applications. Nmin is the contested input: some universities use the lowest passing GPA, others the good-standing line. Try both. Uni-assist or the programme’s own table is the authority.</p>' +
      '<div class="cfg" style="margin-bottom:10px"><label>N max (best)<input type="number" step="0.1" data-path="config.germanMax" data-type="num"></label><label>N min (lowest pass)<input type="number" step="0.1" data-path="config.germanMin" data-type="num"></label></div>' +
      '<div class="tw"><table id="ger_tbl"><thead><tr><th>Source</th><th class="num">CGPA</th><th class="num">German</th><th>Class</th></tr></thead><tbody></tbody></table></div>' +
      '<h3>As printed on a graduation statement</h3><p class="note" style="margin:0 0 8px">The class follows the GPA rounded to 1 decimal (a record of 3.4527 was classed Excellent). Bands: Excellent 3.5–5, Very Good 2.5–3.4, Good 1.5–2.4, Pass 1–1.4. The printed number is usually exact (one record printed 1.838 / 68.38%), though a near-threshold value was printed rounded up (3.4527 as 3.5 / 85%). “With Honour” has extra criteria that are not modelled.</p>' +
      '<div class="tw"><table id="cls_tbl"><thead><tr><th>Source</th><th class="num">GPA</th><th class="num">%</th><th>Classification</th></tr></thead><tbody></tbody></table></div></div></div>' +

      '<div class="card"><h2><span class="n">SCEN</span> Scenarios</h2><p class="note">What your plan gives under different score levels (new courses / retakes).</p>' +
      '<div class="tw"><table id="scen_tbl"><thead><tr><th>Scenario</th><th class="num">Final CGPA</th><th class="num">≈ %</th><th class="num">German</th><th>vs target</th></tr></thead><tbody></tbody></table></div></div>' +

      '<div class="card"><h2><span class="n">RISK</span> How likely is your target? <span class="msg" id="mc_n" style="margin-left:auto;font-weight:400"></span></h2>' +
      '<p class="note">A simulation: every planned course is drawn around your expected score, with a chance of failing once and being retaken. It shows a range instead of one number.</p>' +
      '<div class="cfg"><label>Score spread (± points)<input type="number" min="1" max="30" data-path="ui.sd" data-type="num" style="width:90px"></label><label>Fail chance, new %<input type="number" min="0" max="100" data-path="ui.pFailNew" data-type="num" style="width:90px"></label><label>Fail chance, retake %<input type="number" min="0" max="100" data-path="ui.pFailRet" data-type="num" style="width:90px"></label><button class="btn" data-act="mcAgain" style="margin-bottom:2px">Re-roll</button></div>' +
      '<div class="grid2" style="margin-top:10px;gap:24px"><div class="chartbox short"><canvas id="ch_mc"></canvas></div><div id="mc_stats"></div></div><div class="empty" id="e_mc" hidden></div></div>' +

      '<div class="card" id="unc_card"><h2><span class="n">MODEL</span> Model uncertainty</h2><p class="note" id="unc_note"></p><div class="btnrow"><button class="btn" data-act="unc">Compute range from my official CGPAs</button></div><div id="unc_out"></div></div>';

    UI.wire(el, {
      preset: function (t) { var p = PRESETS[t.dataset.p]; Store.update(function (S) { S.ui.sn = p[0]; S.ui.sr = p[1]; S.ui.touched = true; }); },
      mcAgain: function () { mcSeed++; mcKey = ''; App.refresh(); },
      unc: function () {
        var S = Store.get(), fit = G.fitRepeat(S);
        if (!fit) { UI.toast('Add at least 2 official CGPAs in Settings → Calibration first.', 'err'); return; }
        uncRes = { fit: fit, range: G.projectionRange(S, fit.feasible, App.D.o) }; fill(App.D);
      }
    });
    ['r_sn', 'r_sr'].forEach(function (id) { UI.$('#' + id, el).addEventListener('input', function () { Store.get().ui.touched = true; }); });
    UI.$('#t_term', el).addEventListener('change', function () { Store.get().ui._tterm = this.value; fill(App.D); });
  }
  function unmount() { clearTimeout(mcTimer); }

  function verdict(D, fin) {
    var tgt = D.S.ui.target, v = UI.$('#g_verdict', el);
    var ok = fin >= tgt - 1e-9;
    v.className = 'verdict ' + (ok ? 'ok' : 'mid');
    UI.text(v, ok ? 'meets your ' + UI.f(tgt, 2) + ' target' : UI.f(tgt - fin, 3) + ' short of your ' + UI.f(tgt, 2) + ' target');
  }

  function fill(D) {
    var S = D.S, o = D.o, cfg = S.config, tot = D.tot, parts = D.parts, c = UI.colors();
    var hasPlan = parts.items.length > 0 || parts.unallocated.credits > 0;
    UI.syncFields(el, S);

    /* presets + sliders */
    UI.$$('#presetRow .btn', el).forEach(function (b) {
      var p = PRESETS[b.dataset.p];
      var on = p ? (p[0] === S.ui.sn && p[1] === S.ui.sr) : !Object.keys(PRESETS).some(function (k) { return PRESETS[k][0] === S.ui.sn && PRESETS[k][1] === S.ui.sr; });
      b.classList.toggle('active', on);
    });
    var act = S.plan.filter(function (r) { return r.active !== false; }), newCr = 0, retCr = 0;
    act.forEach(function (r) { if (G.isRetake(S, r, tot)) retCr += +r.credits || 0; else newCr += +r.credits || 0; });
    UI.text(UI.$('#sn_lab', el), 'NEW courses average (' + UI.num(newCr) + ' cr)'); UI.text(UI.$('#sr_lab', el), 'RETAKES average (' + UI.num(retCr) + ' cr)');
    UI.text(UI.$('#sn_v', el), S.ui.sn + '%'); UI.text(UI.$('#sr_v', el), S.ui.sr + '%');
    [['r_sn', S.ui.sn], ['r_sr', S.ui.sr]].forEach(function (x) { var r = UI.$('#' + x[0], el); if (document.activeElement !== r) r.value = x[1]; });
    UI.$('#fillchk', el).checked = S.ui.fill !== false;
    var un = G.unallocatedCredits(S, D.cs);
    UI.text(UI.$('#fill_lab', el), 'Assume the ' + UI.num(un) + ' credits I haven’t planned yet score the new-course average');
    UI.$('#fillchk', el).disabled = un <= 0;

    /* gauge */
    var fin = parts.cgpa;
    UI.text(UI.$('#g_final', el), hasPlan ? UI.f(fin) : '–');
    var gd = UI.$('#g_delta', el); UI.text(gd, hasPlan ? UI.signed(fin - tot.cgpa) : ''); gd.style.color = fin >= tot.cgpa ? c.green : c.red;
    UI.$('#g_final', el).style.color = fin >= S.ui.target ? c.green : '';
    UI.text(UI.$('#g_sub', el), hasPlan ? 'projected graduating CGPA (≈ ' + UI.f(G.gpaToPct(fin, cfg), 1) + '%) · from ' + UI.f(tot.cgpa, 2) + ' now' : 'add courses on the Plan tab to project');
    if (hasPlan) verdict(D, fin); else UI.text(UI.$('#g_verdict', el), '');
    UI.$('#g_verdict', el).hidden = !hasPlan;

    /* formula */
    var cf = G.closedForm(S, o, tot);
    UI.paint(UI.$('#formula', el), hasPlan ?
      'final = (N + Q) ÷ D<sub>final</sub> = (<b>' + UI.f(cf.N, 2) + '</b> + <b>' + UI.f(cf.Q, 2) + '</b>) ÷ <b>' + UI.f(cf.Dfinal, 2) + '</b> = <b>' + UI.f(cf.final) + '</b>' +
      '<br><span class="muted">Q = Σ credits × GPA over the planned courses (max ' + UI.f(cf.Qmax, 1) + '). D<sub>final</sub> is fixed once you pass everything, so each extra quality point is worth <b>+' + cf.perPoint.toFixed(5) + '</b> CGPA; one GPA point (10 score points) on a 4-credit course adds <b>+' + (4 * cf.perPoint).toFixed(3) + '</b>.</span>' :
      'final = (N + Q) ÷ D<sub>final</sub>   <span class="muted">· appears once you plan some courses</span>');

    /* target */
    var tgt = S.ui.target, tg = UI.$('#r_tgt', el); tg.max = cfg.maxGPA; if (document.activeElement !== tg) tg.value = tgt;
    UI.text(UI.$('#t_v', el), UI.f(tgt, 2));
    var info = G.scoreForTarget(S, tgt, {}, tot), tout = UI.$('#t_out', el);
    if (!hasPlan) tout.innerHTML = 'Plan some courses first and I will tell you what average they need.';
    else if (!info.possible) tout.innerHTML = '<b>' + UI.f(tgt, 2) + ' is out of reach</b>: even 100% everywhere tops out at <b>' + UI.f(info.ceiling) + '</b>. The past fixes a floor under the denominator.';
    else if (info.already) tout.innerHTML = '<b>' + UI.f(tgt, 2) + ' is already secured</b> if you pass everything planned (bare-pass floor: ' + UI.f(info.floor) + ').';
    else tout.innerHTML = 'To reach <b>' + UI.f(tgt, 2) + '</b> you need about <b>' + UI.f(info.score, 1) + '%</b> on average across all <b>' + UI.num(parts.items.reduce(function (s, x) { return s + x.cr; }, 0) + parts.unallocated.credits) + ' planned credits</b> (needs Q = ' + UI.f(cf.neededQ(tgt), 1) + ' of max ' + UI.f(cf.Qmax, 1) + ').';
    var groups = G.planTerms(S).filter(function (g) { return g.term !== 'Unassigned'; }), ts = UI.$('#t_term', el);
    UI.paint(ts, groups.length ? groups.map(function (g) { return '<option value="' + UI.esc(g.term) + '">' + UI.esc(UI.termLabel(S, g.term)) + '</option>'; }).join('') : '<option value="">(assign terms on the Plan tab)</option>');
    var sel = S.ui._tterm && groups.some(function (g) { return g.term === S.ui._tterm; }) ? S.ui._tterm : (groups[0] && groups[0].term);
    if (sel && document.activeElement !== ts) ts.value = sel;
    var tto = UI.$('#t_term_out', el);
    if (!groups.length) tto.textContent = 'Put courses into terms to ask “what do I need this semester?”.';
    else {
      var codes = []; for (var gi = 0; gi < groups.length; gi++) { groups[gi].courses.forEach(function (x) { codes.push(x.code); }); if (groups[gi].term === sel) break; }
      var ti = G.scoreForTarget(S, tgt, { only: codes }, tot);
      var cur = G.projectParts(S, Object.assign({}, o, { only: codes, fill: false }), tot).cgpa;
      tto.innerHTML = 'At your expected scores, CGPA after <b>' + UI.esc(sel) + '</b> = <b>' + UI.f(cur) + '</b>. ' +
        (ti.already ? 'That target is already met by just passing.' : ti.possible ? 'To have ' + UI.f(tgt, 2) + ' by then you would need about <b>' + UI.f(ti.score, 1) + '%</b> across everything up to that term.' : 'Reaching ' + UI.f(tgt, 2) + ' by then is not possible (ceiling ' + UI.f(ti.ceiling) + ').');
    }

    /* German */
    var gr = [['Current CGPA', tot.cgpa]];
    if (hasPlan) { gr.push(['Projected (your plan)', fin]); gr.push(['Best case (100% on everything)', cf.ceiling]); }
    UI.paint(UI.$('#ger_tbl tbody', el), gr.map(function (r) {
      var g = G.bavarian(r[1], cfg.germanMax, cfg.germanMin), cl = G.germanClass(g), over = g != null && g > 4;
      return '<tr><td>' + r[0] + '</td><td class="num">' + UI.f(r[1]) + '</td><td class="num"><b class="' + cl[1] + '">' + (g == null ? '–' : g.toFixed(2) + (over ? ' ⚠' : '')) + '</b></td><td><span class="tag ' + (cl[1] === 'red' ? 'bad' : 'ok') + '">' + cl[0] + '</span></td></tr>';
    }).join(''));

    UI.paint(UI.$('#cls_tbl tbody', el), gr.map(function (r) {
      var c2 = G.classify(r[1], cfg);
      return '<tr><td>' + r[0] + '</td><td class="num">' + UI.f(r[1]) + '</td><td class="num">' + UI.f(c2.pct, 2) + '%</td><td><span class="tag ' + (c2.band === 'Excellent' || c2.band === 'Very Good' ? 'ok' : c2.band === 'Below pass' ? 'bad' : 'warn') + '">' + c2.band + (c2.range ? ' · ' + c2.range : '') + '</span></td></tr>';
    }).join(''));

    /* scenarios */
    var rows = [['Everything at 70%', { uniform: 70 }], ['Everything at 80%', { uniform: 80 }], ['Everything at 90%', { uniform: 90 }], ['Everything at 100% (ceiling)', { uniform: 100 }]]
      .concat([[75, 60], [85, 65], [92, 78], [95, 95]].map(function (p) { return ['New ' + p[0] + '% / retake ' + p[1] + '%', { sn: p[0], sr: p[1] }]; }));
    UI.paint(UI.$('#scen_tbl tbody', el), hasPlan ? rows.map(function (r) {
      var v = G.projectFinal(S, r[1], tot), g = G.bavarian(v, cfg.germanMax, cfg.germanMin), ok = v >= tgt - 1e-9;
      return '<tr><td>' + r[0] + '</td><td class="num"><b>' + UI.f(v) + '</b></td><td class="num muted">' + UI.f(G.gpaToPct(v, cfg), 1) + '%</td><td class="num">' + (g == null ? '–' : g.toFixed(2)) + '</td><td><span class="tag ' + (ok ? 'ok' : 'warn') + '">' + (ok ? '≥ ' : '< ') + UI.f(tgt, 2) + '</span></td></tr>';
    }).join('') : '<tr><td colspan="5" class="muted">Plan some courses to compare scenarios.</td></tr>');

    /* Monte Carlo (debounced; cached by inputs) */
    var key = JSON.stringify([S.plan, S.attempts.length, S.carry, cfg, S.ui.sn, S.ui.sr, S.ui.sd, S.ui.pFailNew, S.ui.pFailRet, S.ui.fill, S.baseline, mcSeed, tgt]);
    var mcEmpty = !hasPlan;
    UI.$('#ch_mc', el).parentNode.hidden = mcEmpty; UI.$('#e_mc', el).hidden = !mcEmpty;
    if (mcEmpty) { UI.$('#e_mc', el).innerHTML = '<b>No plan to simulate</b>Add courses on the Plan tab.'; UI.paint(UI.$('#mc_stats', el), ''); }
    else if (key !== mcKey) {
      clearTimeout(mcTimer);
      mcTimer = setTimeout(function () {
        var S2 = Store.get(); if (!S2 || !UI.$('#ch_mc', el)) return;
        var D2 = App.D, ts2 = [tgt, 1.8, 2.0].filter(function (v, i, a) { return a.indexOf(v) === i; });
        mcRes = G.monteCarlo(S2, { sn: S2.ui.sn, sr: S2.ui.sr, sd: S2.ui.sd || 8, pFailNew: (S2.ui.pFailNew != null ? S2.ui.pFailNew : 5) / 100, pFailRet: (S2.ui.pFailRet != null ? S2.ui.pFailRet : 10) / 100, runs: 3000, seed: 1000 + mcSeed, targets: ts2 }, D2.tot);
        mcKey = key; drawMC(D2);
      }, 90);
    } else if (mcRes) drawMC(D);

    /* uncertainty */
    var canFit = S.mode === 'full' && G.validSnapshots(S).length >= 2;
    UI.$('#unc_card', el).hidden = !canFit && !uncRes;
    UI.text(UI.$('#unc_note', el), 'The repeat-course rule is fitted to official CGPAs, so the projection has some model error. This re-fits the rule to your own numbers and shows the spread of every parameter set that reproduces them all within the university’s rounding.');
    if (uncRes && uncRes.range) {
      var r = uncRes.range, f = uncRes.fit;
      UI.paint(UI.$('#unc_out', el), '<div class="rec up"><span class="ic">≈</span><span>Projected graduating CGPA across <b>' + r.sets + '</b> equally good fits: <b>' + UI.f(r.lo) + ' to ' + UI.f(r.hi) + '</b>. Best fit: failed weight ' + f.wFailed + ', absence weight ' + f.wAbsent + ', decay ' + f.decay + ' (RMSE ' + f.rmse.toFixed(5) + ').</span></div>');
    } else UI.paint(UI.$('#unc_out', el), uncRes ? '<div class="rec warn"><span class="ic">!</span><span>No parameter set reproduces every snapshot within rounding. The repeat rule may differ for your programme: see Settings → Calibration.</span></div>' : '');
  }

  function drawMC(D) {
    if (!mcRes || !UI.$('#ch_mc', el)) return;
    var S = D.S, c = UI.colors(), m = mcRes, tgt = S.ui.target, labels = [], colors = [];
    for (var i = 0; i < m.hist.length; i++) { var mid = m.histLo + (i + 0.5) * m.histStep; labels.push(mid.toFixed(2)); colors.push(mid >= tgt ? c.green : c.sand); }
    var o = UI.lineOpts({ min: 0, max: Math.max.apply(null, m.hist) * 1.1 }, {});
    o.scales.y.ticks = { display: false }; o.scales.y.grid = { display: false }; o.scales.x.ticks = { maxTicksLimit: 6 };
    o.plugins.tooltip = { callbacks: { title: function (x) { return 'CGPA ≈ ' + x[0].label; }, label: function (x) { return ' ' + (100 * x.parsed.y / m.runs).toFixed(1) + '% of runs'; } } };
    UI.chart('ch_mc', 'bar', { labels: labels, datasets: [{ label: 'Runs', data: m.hist, backgroundColor: colors, borderWidth: 0, borderRadius: 2, categoryPercentage: 1, barPercentage: 0.95 }] }, o);
    UI.text(UI.$('#mc_n', el), m.runs + ' simulated outcomes');
    var prob = m.targets.map(function (t) { return '<div class="stat" style="margin-bottom:8px"><div class="k">P(final ≥ ' + t.target.toFixed(2) + ')</div><div class="v ' + (t.prob >= 0.5 ? 'green' : 'amber') + '">' + (t.prob * 100).toFixed(0) + '%</div></div>'; }).join('');
    UI.paint(UI.$('#mc_stats', el), '<div class="stat" style="margin-bottom:8px"><div class="k">Likely range (90%)</div><div class="v">' + UI.f(m.p5, 2) + ' – ' + UI.f(m.p95, 2) + '</div><div class="d">median ' + UI.f(m.p50) + ' · middle half ' + UI.f(m.p25, 2) + ' – ' + UI.f(m.p75, 2) + '</div></div>' + prob);
  }

  return { mount: mount, fill: fill, unmount: unmount };
})();
