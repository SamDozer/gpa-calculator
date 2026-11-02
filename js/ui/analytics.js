/* Analytics tab: grade distribution, subject strengths, grade mix by year, plus where the repeat penalty sits and credits over time. */
UI.Analytics = (function () {
  'use strict';
  var G = window.GPA, el = null;
  var BOXES = [['ch_dist', 'CH3', 'Grade distribution', 'Every attempt by grade band.'],
    ['ch_subj', 'CH4', 'Subject averages', 'Average GPA of passed courses (latest attempt) by area.'],
    ['ch_mixyear', 'CH7', 'Grade mix by year', 'How the mix of grades, fails and absences shifted year to year.'],
    ['ch_drag', 'NEW', 'Where the repeat penalty sits', 'Extra credits each course adds to the denominator because of earlier failed or missed attempts. Big bars are expensive history; they are sunk cost, so passing them cleanly matters more than perfecting them.'],
    ['ch_credits', 'NEW', 'Credits over time', 'Credits registered vs credits actually passed, cumulative. A widening gap is lost semesters.']];

  function mount(root) {
    el = root;
    el.innerHTML = '<div class="card" id="an_empty" hidden><div class="empty"><b>No course history yet</b>Analytics are built from your logged attempts. Add past courses to unlock them. Your CGPA and planning work without them.<br><br><button class="btn primary" data-act="toCourses">Add courses</button></div></div><div id="an_body">' +
      '<div class="grid2">' + card(0) + card(1) + '</div><div class="card"><h2><span class="n">CH7</span> ' + BOXES[2][2] + '</h2><p class="note">' + BOXES[2][3] + '</p><div class="chartbox"><canvas id="ch_mixyear"></canvas></div></div>' +
      '<div class="grid2">' + card(3) + card(4) + '</div></div>';
    UI.wire(el, { toCourses: function () { App.go('transcript'); } });
  }
  function card(i) { var b = BOXES[i]; return '<div class="card"><h2><span class="n">' + b[1] + '</span> ' + b[2] + '</h2><p class="note">' + b[3] + '</p><div class="chartbox"><canvas id="' + b[0] + '"></canvas></div></div>'; }

  function fill(D) {
    var S = D.S, ctx = D.ctx, c = UI.colors(), cfg = S.config;
    var rows = S.attempts.filter(function (a) { return !(cfg.excludeNonDegree && ctx.nonDeg[a.course]); });
    UI.$('#an_empty', el).hidden = rows.length > 0; UI.$('#an_body', el).hidden = rows.length === 0;
    if (!rows.length) return;
    var order = ['A', 'B', 'C', 'D', 'F', 'AB'], col = { A: c.green, B: c.blue, C: c.amber, D: c.sand, F: c.red, AB: c.slate };

    /* CH3 */
    var dc = { A: 0, B: 0, C: 0, D: 0, F: 0, AB: 0 };
    rows.forEach(function (a) { var ab = a.absent || a.score == null; dc[G.letter(ab ? null : a.score, ab, a.course, ctx)]++; });
    var yo = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: c.grid }, ticks: { precision: 0 } }, x: { grid: { display: false } } } };
    UI.chart('ch_dist', 'bar', { labels: ['A', 'B', 'C', 'D', 'F', 'Absent'], datasets: [{ data: order.map(function (k) { return dc[k]; }), backgroundColor: order.map(function (k) { return col[k]; }), borderWidth: 0, borderRadius: 5 }] }, yo);

    /* CH4 */
    var areas = {};
    D.tot.courses.forEach(function (x) { if (x.passed && !x.excluded) (areas[UI.areaOf(x.code, ctx)] = areas[UI.areaOf(x.code, ctx)] || []).push(x.g); });
    var an = Object.keys(areas).map(function (a) { return [a, areas[a].reduce(function (s, v) { return s + v; }, 0) / areas[a].length]; }).sort(function (x, y) { return y[1] - x[1]; });
    UI.chart('ch_subj', 'bar', { labels: an.map(function (a) { return a[0]; }), datasets: [{ data: an.map(function (a) { return a[1]; }), backgroundColor: an.map(function (a) { return a[1] >= 3 ? c.green : a[1] >= 2 ? c.blue : a[1] >= 1.6 ? c.amber : c.red; }), borderWidth: 0, borderRadius: 5, barThickness: 15 }] },
      { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (x) { return ' ' + x.parsed.x.toFixed(2); } } } }, scales: { x: { min: 0, max: cfg.maxGPA, grid: { color: c.grid } }, y: { grid: { display: false } } } });

    /* CH7 */
    var years = {};
    rows.forEach(function (a) { var o = G.termOrder(a.term), y = o ? Math.floor(o / 100) : '?'; years[y] = years[y] || { A: 0, B: 0, C: 0, D: 0, F: 0, AB: 0 }; var ab = a.absent || a.score == null; years[y][G.letter(ab ? null : a.score, ab, a.course, ctx)]++; });
    var yl = Object.keys(years).sort();
    UI.chart('ch_mixyear', 'bar', { labels: yl, datasets: order.map(function (k) { return { label: k === 'AB' ? 'Absent' : k, data: yl.map(function (y) { return years[y][k]; }), backgroundColor: col[k], borderWidth: 0, stack: 's' }; }) },
      { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, font: { size: 10.5 }, padding: 10 } } }, scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: c.grid }, ticks: { precision: 0 } } } });

    /* drag */
    var dr = D.tot.courses.filter(function (x) { return !x.excluded && x.cr * x.drag > 0.001; }).sort(function (a, b) { return b.cr * b.drag - a.cr * a.drag; }).slice(0, 12);
    UI.chart('ch_drag', 'bar', { labels: dr.map(function (x) { return x.code; }), datasets: [{ data: dr.map(function (x) { return x.cr * x.drag; }), backgroundColor: dr.map(function (x) { return x.passed ? c.blue : c.amber; }), borderWidth: 0, borderRadius: 5, barThickness: 14 }] },
      { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (x) { var r = dr[x.dataIndex]; return ' +' + x.parsed.x.toFixed(2) + ' effective cr (' + r.cr + ' cr × ' + r.drag.toFixed(2) + ')' + (r.passed ? ', passed' : ', not passed'); } } } },
        scales: { x: { grid: { color: c.grid }, title: { display: true, text: 'extra credits in denominator', font: { size: 10 } } }, y: { grid: { display: false } } } });

    /* credits over time */
    var tl = D.timeline.filter(function (t) { return !t.base; }), reg = 0, byTerm = {};
    rows.forEach(function (a) { var o = G.termOrder(a.term); byTerm[o] = (byTerm[o] || 0) + (+a.credits || 0); });
    var regS = [], earnS = [];
    tl.forEach(function (t) { reg += byTerm[t.order] || 0; regS.push(reg); var sub = Object.assign({}, S, { attempts: S.attempts.filter(function (a) { return G.termOrder(a.term) <= t.order; }) }); earnS.push(G.creditStatus(sub).earned - (S.mode === 'quick' ? D.cs.baseEarned : 0)); });
    var lb = tl.map(function (t) { return String(t.label).replace(/^([A-Za-z؀-ۿ]+)\s*(\d\d)(\d\d)$/, "$1 '$3"); });
    var lo = UI.lineOpts({ min: 0, max: Math.max.apply(null, regS.concat([1])) * 1.1 }, { legend: true, dec: 0 });
    UI.chart('ch_credits', 'line', { labels: lb, datasets: [
      { label: 'Registered', data: regS, borderColor: c.slate, borderWidth: 2, tension: 0.2, pointRadius: 2 },
      { label: 'Passed', data: earnS, borderColor: c.green, backgroundColor: UI.alpha(c.green, 0.12), borderWidth: 2.5, fill: true, tension: 0.2, pointRadius: 3 }] }, lo);
  }

  return { mount: mount, fill: fill };
})();
