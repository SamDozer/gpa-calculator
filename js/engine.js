/* =============================================================================
   GPA engine: pure functions, no DOM. Works in the browser (window.GPA) and in
   Node (module.exports) so the same code is unit-tested and shipped.

   Model (credit-hour 0-5 scale, Cairo University Faculty of Science):
     g(score)  = 0 if absent or score < pass mark, else min((score-offset)/divisor, max)
     CGPA      = sum_c cr_c * g(latest_c)  /  sum_c cr_c * (1 + drag_c)
     drag_c    = sum_k w(p_k) * decay^k       (k = 0 is the oldest earlier attempt)
     w         = wFailed for a failed exam, wAbsent for an absence

   A "profile" is a plain JSON object (see store.js):
     config, degree{totalCredits,curriculum[],nonDegree[]}, baseline{enabled,cgpa,
     gpaHours,earnedHours}, carry{code:{failed,absent,lastAbsent}|{types[]}},
     attempts[{term,course,credits,score,absent}], plan[], snapshots[]
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GPA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULT_CONFIG = {
    maxGPA: 5, gpaOffset: 50, gpaDivisor: 10,
    subjectPass: 60, requirementPass: 50,
    letters: [85, 75, 65],                 // A, B, C lower bounds (display only)
    repeatMode: 'weighted',                // weighted | full | capped | count_one
    wFailed: 0.96, wAbsent: 1.0, decay: 0.04, repeatCap: 3.3,
    excludeNonDegree: true,
    terms: ['Jan', 'May', 'Sep'],          // term names in a year, in order
    germanMax: 5, germanMin: 1
  };

  /* ---------------------------------------------------------------- terms */
  var MONTHS = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
    jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
    oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
    winter: 1, spring: 2, summer: 6, fall: 9, autumn: 9,
    'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'ابريل': 4, 'مايو': 5, 'يونيو': 6, 'يوليو': 7,
    'أغسطس': 8, 'اغسطس': 8, 'سبتمبر': 9, 'أكتوبر': 10, 'اكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12,
    'شتاء': 1, 'ربيع': 2, 'صيف': 6, 'خريف': 9
  };
  var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /** "Sep2026", "Sep 2026", "2026 Sep", "Fall-2026", "مايو2026" -> 202609. 0 when unparseable. */
  function termOrder(label) {
    var s = String(label == null ? '' : label).trim().toLowerCase();
    if (!s) return 0;
    var m = s.match(/^([a-z؀-ۿ]+)[\s\-_'\/]*((?:19|20)\d\d)$/);
    var name, yr;
    if (m) { name = m[1]; yr = +m[2]; }
    else {
      m = s.match(/^((?:19|20)\d\d)[\s\-_'\/]*([a-z؀-ۿ]+)$/);
      if (!m) return 0;
      name = m[2]; yr = +m[1];
    }
    var mo = MONTHS[name];
    if (!mo) return 0;
    return yr * 100 + mo;
  }
  function termMonthNumber(name) { return MONTHS[String(name).toLowerCase()] || 0; }
  function termLabelFromOrder(order, scheme) {
    var yr = Math.floor(order / 100), mo = order % 100, best = null;
    (scheme || DEFAULT_CONFIG.terms).forEach(function (n) { if (termMonthNumber(n) === mo) best = n; });
    return (best || MONTH_NAMES[mo - 1] || '?') + yr;
  }
  /** Next term after `label` given the year's term scheme, e.g. Sep2026 -> Jan2027. */
  function nextTerm(label, scheme) {
    scheme = (scheme && scheme.length ? scheme : DEFAULT_CONFIG.terms);
    var months = scheme.map(termMonthNumber).filter(Boolean).sort(function (a, b) { return a - b; });
    var o = termOrder(label);
    if (!o || !months.length) return label;
    var yr = Math.floor(o / 100), mo = o % 100;
    for (var i = 0; i < months.length; i++) if (months[i] > mo) return termLabelFromOrder(yr * 100 + months[i], scheme);
    return termLabelFromOrder((yr + 1) * 100 + months[0], scheme);
  }
  function termsAhead(label, n, scheme) {
    var out = [], t = label;
    for (var i = 0; i < n; i++) { t = nextTerm(t, scheme); out.push(t); }
    return out;
  }

  /* ----------------------------------------------------- context & grading */
  function makeCtx(p) {
    var cur = {}, n = 0, nd = {};
    ((p.degree && p.degree.curriculum) || []).forEach(function (c) { cur[c.code] = c; n++; });
    ((p.degree && p.degree.nonDegree) || []).forEach(function (c) { nd[c] = 1; });
    return { cfg: p.config, cur: cur, hasCur: n > 0, nonDeg: nd, carry: p.carry || {}, p: p };
  }
  function isReq(code, ctx) {
    var c = ctx.cur[code];
    if (c && c.req !== undefined) return !!c.req;
    return /^(BTU|U)\d/i.test(code || '');
  }
  function passMark(code, ctx) { return isReq(code, ctx) ? ctx.cfg.requirementPass : ctx.cfg.subjectPass; }
  function isPass(score, absent, code, ctx) { return !absent && score != null && score >= passMark(code, ctx); }
  function scoreToGPA(score, absent, code, ctx) {
    if (absent || score == null || score < passMark(code, ctx)) return 0;
    var c = ctx.cfg;
    return Math.min((score - c.gpaOffset) / c.gpaDivisor, c.maxGPA);
  }
  function letter(score, absent, code, ctx) {
    if (absent || score == null) return 'AB';
    if (score < passMark(code, ctx)) return 'F';
    var L = ctx.cfg.letters;
    if (score >= L[0]) return 'A'; if (score >= L[1]) return 'B'; if (score >= L[2]) return 'C';
    return 'D';
  }
  function gpaToPct(g, cfg) { return g * cfg.gpaDivisor + cfg.gpaOffset; }
  function pctToGpa(pct, cfg) { return Math.max(0, Math.min((pct - cfg.gpaOffset) / cfg.gpaDivisor, cfg.maxGPA)); }

  /** Modified Bavarian formula. Returns null when the range is degenerate. */
  function bavarian(nd, nmax, nmin) {
    if (!(nmax > nmin)) return null;
    return 1 + 3 * (nmax - nd) / (nmax - nmin);
  }
  function germanClass(x) {
    if (x == null) return ['n/a', ''];
    if (x <= 1.5) return ['sehr gut', 'green']; if (x <= 2.5) return ['gut', 'green'];
    if (x <= 3.5) return ['befriedigend', 'blue']; if (x <= 4.0) return ['ausreichend', 'amber'];
    return ['nicht bestanden', 'red'];
  }

  /* ----------------------------------------------------- repeat policy */
  /** Extra denominator weight carried by earlier attempts (types oldest first: 'F' | 'A' | 'P'). */
  function drag(types, cfg) {
    var s = 0, i;
    if (cfg.repeatMode === 'weighted') {
      for (i = 0; i < types.length; i++) s += (types[i] === 'A' ? cfg.wAbsent : cfg.wFailed) * Math.pow(cfg.decay, i);
    } else if (cfg.repeatMode === 'count_one') {
      s = types.length ? 1 : 0;
    }
    return s;                                   // full / capped: earlier attempts add nothing
  }
  function attemptTypes(atts, code, ctx) {
    return atts.map(function (a) { return a.absent ? 'A' : (a.score == null || a.score < passMark(code, ctx) ? 'F' : 'P'); });
  }
  /** History that is already inside the baseline CGPA for a course. */
  function carryTypes(c) {
    if (!c) return [];
    if (c.types && c.types.length) return c.types.slice();
    var f = Math.max(0, c.failed | 0), a = Math.max(0, c.absent | 0), i, fs = [], as = [];
    if (f + a === 0) return [];
    for (i = 0; i < f; i++) fs.push('F');
    for (i = 0; i < a; i++) as.push('A');
    return (c.lastAbsent && a > 0) ? fs.concat(as) : as.concat(fs);
  }
  /**
   * Numerator and denominator contribution of one course.
   * carryT: attempts already counted in the baseline; atts: real attempts after it.
   */
  function courseTerms(code, cr, carryT, atts, ctx) {
    var cfg = ctx.cfg;
    if (!atts.length) return { n: 0, d: 0, g: 0, drag: 0, types: carryT };
    var types = carryT.concat(attemptTypes(atts, code, ctx)), pri = types.slice(0, -1);
    var last = atts[atts.length - 1], g = scoreToGPA(last.score, last.absent, code, ctx);
    if (cfg.repeatMode === 'capped' && pri.length > 0) g = Math.min(g, cfg.repeatCap);
    var dr = drag(pri, cfg);
    var counted = carryT.length ? cr * (1 + drag(carryT.slice(0, -1), cfg)) : 0;
    return { n: cr * g, d: cr * (1 + dr) - counted, g: g, drag: dr, types: types };
  }

  /* ----------------------------------------------------- transcript -> CGPA */
  function groupCourses(p, upto) {
    var by = {};
    (p.attempts || []).forEach(function (a, i) {
      var o = termOrder(a.term);
      if (upto != null && o > upto) return;
      var abs = !!a.absent || a.score == null || a.score === '';
      (by[a.course] = by[a.course] || []).push({
        term: a.term, order: o, idx: i, score: abs ? null : +a.score, absent: abs, credits: +a.credits || 0
      });
    });
    Object.keys(by).forEach(function (c) { by[c].sort(function (x, y) { return x.order - y.order || x.idx - y.idx; }); });
    return by;
  }
  function baselineNums(p) {
    var b = p.baseline;
    if (b && b.enabled && b.gpaHours > 0) return { N: b.cgpa * b.gpaHours, D: b.gpaHours };
    return { N: 0, D: 0 };
  }

  /** Whole-record totals. `upto` limits attempts to terms at or before that order. */
  function totals(p, upto) {
    var ctx = makeCtx(p), by = groupCourses(p, upto), base = baselineNums(p);
    var N = base.N, D = base.D, courses = [], byCode = {};
    Object.keys(by).forEach(function (code) {
      var atts = by[code], last = atts[atts.length - 1], cr = last.credits;
      var carryT = carryTypes(ctx.carry[code]);
      var t = courseTerms(code, cr, carryT, atts, ctx);
      var ex = !!(ctx.cfg.excludeNonDegree && ctx.nonDeg[code]);
      var row = {
        code: code, cr: cr, attempts: atts, n: t.n, d: t.d, g: t.g, drag: t.drag, excluded: ex,
        passed: isPass(last.score, last.absent, code, ctx), retake: t.types.length > 1,
        lastScore: last.score, lastAbsent: last.absent
      };
      courses.push(row); byCode[code] = row;
      if (!ex) { N += t.n; D += t.d; }
    });
    return { N: N, D: D, cgpa: D > 0 ? N / D : 0, courses: courses, byCode: byCode, base: base, ctx: ctx };
  }
  function computeCGPA(p, upto) { var t = totals(p, upto); return { cgpa: t.cgpa, num: t.N, den: t.D }; }

  /** Credit-weighted GPA of each term on its own (unofficial trend indicator). */
  function semesterGPAs(p) {
    var ctx = makeCtx(p), by = {};
    (p.attempts || []).forEach(function (a) {
      if (ctx.cfg.excludeNonDegree && ctx.nonDeg[a.course]) return;
      var o = termOrder(a.term); if (!o) return;
      (by[o] = by[o] || []).push(a);
    });
    return Object.keys(by).map(Number).sort(function (a, b) { return a - b; }).map(function (o) {
      var num = 0, den = 0;
      by[o].forEach(function (a) {
        var cr = +a.credits || 0, abs = !!a.absent || a.score == null;
        num += cr * scoreToGPA(abs ? null : +a.score, abs, a.course, ctx); den += cr;
      });
      return { order: o, label: by[o][0].term, gpa: den ? num / den : 0, credits: den };
    });
  }
  function cumulativeTimeline(p) {
    var out = [], b = p.baseline;
    if (b && b.enabled && b.gpaHours > 0) out.push({ order: 0, label: b.asOf || 'Start', cgpa: b.cgpa, N: b.cgpa * b.gpaHours, D: b.gpaHours, base: true });
    var orders = {};
    (p.attempts || []).forEach(function (a) { var o = termOrder(a.term); if (o) orders[o] = a.term; });
    Object.keys(orders).map(Number).sort(function (a, b2) { return a - b2; }).forEach(function (o) {
      var t = totals(p, o);
      out.push({ order: o, label: orders[o], cgpa: t.cgpa, N: t.N, D: t.D });
    });
    return out;
  }

  /* ----------------------------------------------------- credits */
  function creditStatus(p, tot) {
    tot = tot || totals(p);
    var ctx = tot.ctx, earned = 0, earnedReq = 0, extra = 0;
    tot.courses.forEach(function (c) {
      if (!c.passed) return;
      if (ctx.nonDeg[c.code] || (ctx.hasCur && !ctx.cur[c.code])) { extra += c.cr; return; }
      var cr = ctx.hasCur ? ctx.cur[c.code].credits : c.cr;
      earned += cr; if (isReq(c.code, ctx)) earnedReq += cr;
    });
    var b = p.baseline, baseEarned = (b && b.enabled) ? (+b.earnedHours || 0) : 0;
    var curSum = Object.keys(ctx.cur).reduce(function (s, k) { return s + ctx.cur[k].credits; }, 0);
    var total = (p.degree && +p.degree.totalCredits > 0) ? +p.degree.totalCredits : curSum;
    earned += baseEarned;
    return { earned: earned, earnedReq: earnedReq, earnedExtra: extra, baseEarned: baseEarned,
      total: total, remaining: Math.max(0, total - earned), curriculumCredits: curSum };
  }
  function isPassedCourse(p, code, tot) {
    tot = tot || totals(p); var c = tot.byCode[code]; return !!(c && c.passed);
  }

  /* ----------------------------------------------------- plan & projection */
  function planHistory(p, code, tot) {
    tot = tot || totals(p);
    var c = tot.byCode[code];
    var types = carryTypes(tot.ctx.carry[code]);
    if (c) types = types.concat(attemptTypes(c.attempts, code, tot.ctx));
    return types;
  }
  function isRetake(p, item, tot) { return planHistory(p, item.code, tot).length > 0; }
  function expectedScore(item, retake, sn, sr) {
    var e = item.expected;
    if (e !== null && e !== undefined && e !== '' && !isNaN(+e)) return +e;
    return retake ? sr : sn;
  }
  function planTerms(p) {
    var t = {};
    (p.plan || []).forEach(function (r) {
      if (r.active === false) return;
      var k = String(r.term || '').trim() || 'Unassigned';
      (t[k] = t[k] || []).push(r);
    });
    return Object.keys(t).sort(function (a, b) {
      if (a === 'Unassigned') return 1; if (b === 'Unassigned') return -1;
      var oa = termOrder(a), ob = termOrder(b);
      if (oa && ob) return oa - ob;
      return a.localeCompare(b);
    }).map(function (k) { return { term: k, courses: t[k] }; });
  }
  function unallocatedCredits(p, st) {
    var planned = (p.plan || []).reduce(function (s, r) { return s + (+r.credits || 0); }, 0);
    return Math.max(0, (st || creditStatus(p)).remaining - planned);
  }

  /**
   * Project the CGPA after every active plan course gets one more attempt.
   * o: {sn, sr}  default expected scores (new / retake)
   *    only        array of course codes to include (default all active)
   *    uniform     one score for every included course
   *    override    {code: score}
   *    failFirst   code that fails once, then passes at retakeScore (default: its own expected score)
   *    fill        add the unplanned remaining credits at score sn (default p.ui.fill !== false)
   */
  function projectParts(p, o, tot) {
    o = o || {}; tot = tot || totals(p);
    var ctx = tot.ctx, sn = o.sn != null ? o.sn : 85, sr = o.sr != null ? o.sr : 65;
    var N = tot.N, D = tot.D, items = [], planned = 0;
    var only = o.only ? o.only.reduce(function (m, c) { m[c] = 1; return m; }, {}) : null;
    (p.plan || []).forEach(function (it) {
      var cr = +it.credits || 0;
      planned += cr;
      if (it.active === false || (only && !only[it.code])) return;
      if (ctx.cfg.excludeNonDegree && ctx.nonDeg[it.code]) return;
      var cur = tot.byCode[it.code], atts = cur ? cur.attempts : [], carryT = carryTypes(ctx.carry[it.code]);
      var before = atts.length ? courseTerms(it.code, cr, carryT, atts, ctx) : { n: 0, d: 0 };
      var retake = carryT.length + atts.length > 0;
      var sc = o.uniform != null ? o.uniform : (o.override && o.override[it.code] != null ? o.override[it.code] : expectedScore(it, retake, sn, sr));
      var fut = [{ score: sc, absent: false }];
      if (o.failFirst === it.code) fut = [{ score: 0, absent: false }, { score: o.retakeScore != null ? o.retakeScore : sc, absent: false }];
      var after = courseTerms(it.code, cr, carryT, atts.concat(fut), ctx);
      N += after.n - before.n; D += after.d - before.d;
      items.push({ item: it, code: it.code, cr: cr, retake: retake, score: sc, g: after.g, dn: after.n - before.n, dd: after.d - before.d });
    });
    var un = { credits: 0, score: sn, g: 0 };
    var fill = o.fill !== undefined ? o.fill : !(p.ui && p.ui.fill === false);
    if (fill && !only) {
      un.credits = unallocatedCredits(p);
      var us = o.uniform != null ? o.uniform : sn;
      un.score = us; un.g = scoreToGPA(us, false, 'X', { cfg: ctx.cfg, cur: {}, hasCur: false });
      if (un.credits > 0) { N += un.credits * un.g; D += un.credits; }
    }
    return { N0: tot.N, D0: tot.D, N: N, D: D, cgpa: D > 0 ? N / D : 0, Q: N - tot.N, dD: D - tot.D,
      items: items, unallocated: un, plannedCredits: planned };
  }
  function projectFinal(p, o, tot) { return projectParts(p, o, tot).cgpa; }

  /** CGPA after each planned term, cumulative. */
  function projectTimeline(p, o, tot) {
    tot = tot || totals(p); o = o || {};
    var groups = planTerms(p), seen = [], pts = [], prev = tot.cgpa;
    groups.forEach(function (g) {
      g.courses.forEach(function (c) { seen.push(c.code); });
      var parts = projectParts(p, Object.assign({}, o, { only: seen.slice(), fill: false }), tot);
      pts.push({ term: g.term, courses: g.courses, credits: g.courses.reduce(function (s, c) { return s + (+c.credits || 0); }, 0),
        cgpa: parts.cgpa, delta: parts.cgpa - prev });
      prev = parts.cgpa;
    });
    return { start: tot.cgpa, points: pts };
  }

  /** GPA of one term's own courses (not cumulative), at their expected scores. */
  function termGPA(p, courses, o, tot) {
    tot = tot || totals(p); var ctx = tot.ctx, num = 0, den = 0, sn = o.sn, sr = o.sr;
    courses.forEach(function (c) {
      var rt = isRetake(p, c, tot), sc = expectedScore(c, rt, sn, sr), cr = +c.credits || 0;
      num += cr * scoreToGPA(sc, false, c.code, ctx); den += cr;
    });
    return den ? num / den : 0;
  }

  /** Uniform score the included courses need to reach `target` CGPA. */
  function scoreForTarget(p, target, o, tot) {
    o = o || {}; tot = tot || totals(p);
    var pm = tot.ctx.cfg.subjectPass, lo = pm, hi = 100;
    var ceiling = projectParts(p, Object.assign({}, o, { uniform: 100 }), tot).cgpa;
    var floor = projectParts(p, Object.assign({}, o, { uniform: pm }), tot).cgpa;
    if (target <= floor + 1e-12) return { score: pm, possible: true, already: true, ceiling: ceiling, floor: floor };
    if (target > ceiling + 1e-9) return { score: 100, possible: false, ceiling: ceiling, floor: floor };
    for (var i = 0; i < 60; i++) {
      var mid = (lo + hi) / 2;
      if (projectParts(p, Object.assign({}, o, { uniform: mid }), tot).cgpa >= target) hi = mid; else lo = mid;
    }
    return { score: hi, possible: true, ceiling: ceiling, floor: floor };
  }

  /** Closed form: final = (N + Q) / D_final, so +1 quality point = 1 / D_final. */
  function closedForm(p, o, tot) {
    tot = tot || totals(p);
    var best = projectParts(p, Object.assign({}, o, { uniform: 100 }), tot);
    var cur = projectParts(p, o, tot);
    return { N: tot.N, Dnow: tot.D, Dfinal: cur.D, Q: cur.Q, Qmax: best.Q, perPoint: cur.D ? 1 / cur.D : 0,
      final: cur.cgpa, ceiling: best.cgpa, neededQ: function (t) { return t * cur.D - tot.N; } };
  }

  /** Per-course payoff (score vs bare pass) and cost of one extra failure. */
  function leverage(p, o, tot) {
    tot = tot || totals(p); o = o || {};
    var pm = tot.ctx.cfg.subjectPass, tgt = o.target != null ? o.target : 85, rs = o.retakeScore;
    var base = projectFinal(p, o, tot);
    return (p.plan || []).filter(function (r) { return r.active !== false; }).map(function (r) {
      var lo = projectFinal(p, Object.assign({}, o, { override: Object.assign({}, o.override, (function () { var m = {}; m[r.code] = pm; return m; })()) }), tot);
      var hi = projectFinal(p, Object.assign({}, o, { override: Object.assign({}, o.override, (function () { var m = {}; m[r.code] = tgt; return m; })()) }), tot);
      var ff = projectFinal(p, Object.assign({}, o, { failFirst: r.code, retakeScore: rs }), tot);
      return { item: r, code: r.code, cr: +r.credits || 0, retake: isRetake(p, r, tot), gain: hi - lo, cost: base - ff };
    }).sort(function (a, b) { return b.gain - a.gain; });
  }

  /* ----------------------------------------------------- Monte Carlo */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  /**
   * Random scores around each course's expected score. A course fails when the draw lands
   * under the pass mark or with probability pFail (then it is retaken at about `retakeScore`).
   * o: {sn, sr, sd, pFailNew, pFailRet, retakeScore, runs, seed, targets[]}
   */
  function monteCarlo(p, o, tot) {
    tot = tot || totals(p); o = o || {};
    var ctx = tot.ctx, runs = o.runs || 4000, sd = o.sd != null ? o.sd : 8, rnd = mulberry32(o.seed || 12345);
    var sn = o.sn != null ? o.sn : 85, sr = o.sr != null ? o.sr : 65;
    var pFN = o.pFailNew != null ? o.pFailNew : 0.05, pFR = o.pFailRet != null ? o.pFailRet : 0.10, rs = o.retakeScore != null ? o.retakeScore : 65;
    function randn() { var u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    var pm = ctx.cfg.subjectPass;
    var jobs = [];
    (p.plan || []).forEach(function (it) {
      if (it.active === false || (ctx.cfg.excludeNonDegree && ctx.nonDeg[it.code])) return;
      var cr = +it.credits || 0, cur = tot.byCode[it.code], atts = cur ? cur.attempts : [], carryT = carryTypes(ctx.carry[it.code]);
      var retake = carryT.length + atts.length > 0;
      jobs.push({ code: it.code, cr: cr, atts: atts, carryT: carryT, retake: retake, mean: expectedScore(it, retake, sn, sr),
        before: atts.length ? courseTerms(it.code, cr, carryT, atts, ctx) : { n: 0, d: 0 }, pm: passMark(it.code, ctx) });
    });
    var fillCr = (!(p.ui && p.ui.fill === false)) ? unallocatedCredits(p) : 0;
    while (fillCr > 0) {
      var c = Math.min(3, fillCr); fillCr -= c;
      jobs.push({ code: '~', cr: c, atts: [], carryT: [], retake: false, mean: sn, before: { n: 0, d: 0 }, pm: pm, generic: true });
    }
    var finals = new Array(runs), i, j;
    for (i = 0; i < runs; i++) {
      var N = tot.N, D = tot.D;
      for (j = 0; j < jobs.length; j++) {
        var jb = jobs[j], x = Math.max(0, Math.min(100, jb.mean + sd * randn()));
        var forced = rnd() < (jb.retake ? pFR : pFN), fut;
        if (x < jb.pm || forced) {
          var r2 = Math.max(jb.pm, Math.min(100, rs + sd * 0.5 * randn()));
          fut = [{ score: 0, absent: false }, { score: r2, absent: false }];
        } else fut = [{ score: x, absent: false }];
        var after = jb.generic
          ? courseTerms('X', jb.cr, [], fut, { cfg: ctx.cfg, cur: {}, hasCur: false })
          : courseTerms(jb.code, jb.cr, jb.carryT, jb.atts.concat(fut), ctx);
        N += after.n - jb.before.n; D += after.d - jb.before.d;
      }
      finals[i] = D > 0 ? N / D : 0;
    }
    finals.sort(function (a, b) { return a - b; });
    var q = function (f) { return finals[Math.min(runs - 1, Math.floor(f * runs))]; };
    var mean = finals.reduce(function (s, v) { return s + v; }, 0) / runs;
    var targets = (o.targets || [1.8, 2.0]).map(function (t) {
      var k = 0; while (k < runs && finals[k] < t) k++;
      return { target: t, prob: (runs - k) / runs };
    });
    var lo = finals[0], hi = finals[runs - 1], bins = 24, step = (hi - lo) / bins || 1, hist = new Array(bins).fill(0);
    finals.forEach(function (v) { hist[Math.min(bins - 1, Math.floor((v - lo) / step))]++; });
    return { runs: runs, mean: mean, p5: q(0.05), p25: q(0.25), p50: q(0.5), p75: q(0.75), p95: q(0.95),
      min: lo, max: hi, targets: targets, hist: hist, histLo: lo, histStep: step };
  }

  /* ----------------------------------------------------- calibration */
  var BAND = 0.0005;                          // official CGPAs are rounded to 3 decimals
  function validSnapshots(p) {
    return (p.snapshots || []).filter(function (s) { return termOrder(s.term) && isFinite(s.cgpa) && s.cgpa !== '' && s.cgpa !== null; })
      .map(function (s) { return { term: s.term, cgpa: +s.cgpa, order: termOrder(s.term) }; })
      .sort(function (a, b) { return a.order - b.order; });
  }
  function snapshotErrors(p, cfgOverride) {
    var q = cfgOverride ? Object.assign({}, p, { config: Object.assign({}, p.config, cfgOverride) }) : p;
    return validSnapshots(p).map(function (s) {
      var m = totals(q, s.order).cgpa; return { term: s.term, official: s.cgpa, model: m, err: m - s.cgpa };
    });
  }
  function rmse(errs) { return errs.length ? Math.sqrt(errs.reduce(function (s, e) { return s + e.err * e.err; }, 0) / errs.length) : 0; }
  function insideBand(errs) { return errs.filter(function (e) { return Math.abs(e.err) <= BAND + 1e-9; }).length; }

  function range(a, b, s) { var o = []; for (var x = a; x <= b + 1e-9; x += s) o.push(Math.round(x * 10000) / 10000); return o; }
  /**
   * Grid-search the repeat parameters against the official snapshots. Loss is zero inside the
   * rounding band (+-0.0005), so equally good parameter sets are all kept in `feasible`.
   * Works on full transcripts (baseline disabled). opts: {fixAbsent, holdout}
   */
  function fitRepeat(p, opts) {
    opts = opts || {};
    var ctx = makeCtx(p), snaps = validSnapshots(p).filter(function (s) { return s.term !== opts.holdout; });
    if (snaps.length < 2) return null;
    var prep = snaps.map(function (s) {
      var by = groupCourses(p, s.order), N = 0, crSum = 0, items = [];
      Object.keys(by).forEach(function (code) {
        if (ctx.cfg.excludeNonDegree && ctx.nonDeg[code]) return;
        var atts = by[code], last = atts[atts.length - 1], cr = last.credits;
        N += cr * scoreToGPA(last.score, last.absent, code, ctx); crSum += cr;
        for (var k = 0; k < atts.length - 1; k++) items.push([cr, k, atts[k].absent ? 1 : 0]);
      });
      return { N: N, crSum: crSum, items: items, t: s.cgpa };
    });
    var wfs = range(0.8, 1.1, 0.0025), was = opts.fixAbsent != null ? [opts.fixAbsent] : range(0.8, 1.2, 0.005), ds = range(0, 0.25, 0.0025);
    var best = null, feasible = [], d, i, a, f, s;
    for (var di = 0; di < ds.length; di++) {
      d = ds[di];
      var SF = [], SA = [];
      for (s = 0; s < prep.length; s++) {
        var sf = 0, sa = 0, it = prep[s].items;
        for (i = 0; i < it.length; i++) { var v = it[i][0] * Math.pow(d, it[i][1]); if (it[i][2]) sa += v; else sf += v; }
        SF.push(sf); SA.push(sa);
      }
      for (f = 0; f < wfs.length; f++) for (a = 0; a < was.length; a++) {
        var loss = 0, sse = 0, maxe = 0;
        for (s = 0; s < prep.length; s++) {
          var D = prep[s].crSum + wfs[f] * SF[s] + was[a] * SA[s], e = prep[s].N / D - prep[s].t, ae = Math.abs(e);
          var ex = ae > BAND ? ae - BAND : 0; loss += ex * ex; sse += e * e; if (ae > maxe) maxe = ae;
        }
        if (maxe <= BAND + 1e-12 && feasible.length < 40000) feasible.push([wfs[f], was[a], d]);
        if (!best || loss < best.loss - 1e-15 || (Math.abs(loss - best.loss) <= 1e-15 && sse < best.sse)) {
          best = { wFailed: wfs[f], wAbsent: was[a], decay: d, loss: loss, sse: sse };
        }
      }
    }
    best.rmse = Math.sqrt(best.sse / prep.length);
    best.feasible = feasible;
    return best;
  }
  function leaveOneOut(p, fixAbsent) {
    var out = [];
    validSnapshots(p).forEach(function (s) {
      var r = fitRepeat(p, { fixAbsent: fixAbsent != null ? fixAbsent : 1.0, holdout: s.term });
      if (!r) return;
      var e = snapshotErrors(p, { repeatMode: 'weighted', wFailed: r.wFailed, wAbsent: r.wAbsent, decay: r.decay }).filter(function (x) { return x.term === s.term; })[0];
      out.push({ term: s.term, official: e.official, model: e.model, err: e.err, wFailed: r.wFailed, decay: r.decay });
    });
    return { rows: out, rmse: rmse(out) };
  }
  function compareModels(p, best) {
    var cur = p.config, models = [
      { name: 'Replace (textbook)', cfg: { repeatMode: 'full' } },
      { name: 'Count one extra registration', cfg: { repeatMode: 'count_one' } },
      { name: 'Your current settings', cfg: {} }
    ];
    if (best) models.push({ name: 'Best fit to your snapshots', cfg: { repeatMode: 'weighted', wFailed: best.wFailed, wAbsent: best.wAbsent, decay: best.decay } });
    return models.map(function (m) {
      var errs = snapshotErrors(p, m.cfg), cfg = Object.assign({}, cur, m.cfg);
      return { name: m.name, cfg: m.cfg, rmse: rmse(errs), max: errs.reduce(function (x, e) { return Math.max(x, Math.abs(e.err)); }, 0),
        inside: insideBand(errs), n: errs.length, final: projectFinal(Object.assign({}, p, { config: cfg }), { sn: (p.ui && p.ui.sn) || 85, sr: (p.ui && p.ui.sr) || 65 }) };
    });
  }
  /** Min and max projection over every parameter set that reproduces all snapshots. */
  function projectionRange(p, feasible, o) {
    if (!feasible || !feasible.length) return null;
    var step = Math.max(1, Math.floor(feasible.length / 150)), lo = Infinity, hi = -Infinity;
    for (var i = 0; i < feasible.length; i += step) {
      var f = feasible[i], cfg = Object.assign({}, p.config, { repeatMode: 'weighted', wFailed: f[0], wAbsent: f[1], decay: f[2] });
      var v = projectFinal(Object.assign({}, p, { config: cfg }), o);
      if (v < lo) lo = v; if (v > hi) hi = v;
    }
    return { lo: lo, hi: hi, sets: feasible.length };
  }

  /* ----------------------------------------------------- recommendations */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  /** Rule-based advice. Returns [{kind: ''|'up'|'warn'|'stop', icon, html}]. */
  function recommendations(p, o, tot) {
    tot = tot || totals(p); o = o || {};
    var out = [], sems = semesterGPAs(p), st = creditStatus(p, tot), target = o.target != null ? o.target : 2.0;
    var active = (p.plan || []).filter(function (r) { return r.active !== false; });
    var retCr = 0, newCr = 0;
    active.forEach(function (r) { if (isRetake(p, r, tot)) retCr += +r.credits || 0; else newCr += +r.credits || 0; });
    var thr = (p.ui && p.ui.retakeWarnCredits) || 6;
    var info = scoreForTarget(p, target, o, tot), cfg = p.config;
    if (!active.length && st.remaining > 0)
      out.push(['warn', '+', '<b>Nothing planned yet.</b> ' + st.remaining + ' credits are still needed for graduation. Add this term’s courses in the Plan tab to see where your CGPA lands.']);
    if (retCr >= thr && cfg.repeatMode !== 'full')
      out.push(['warn', '↺', '<b>Prioritise new courses.</b> You carry ' + retCr + ' cr of retakes vs ' + newCr + ' cr of new courses. Under the “' + cfg.repeatMode + '” repeat rule a retake barely lifts CGPA. Pass them (they block graduation) and put the effort into the new credits.']);
    if (sems.length >= 3) {
      var l3 = sems.slice(-3), improving = l3[2].gpa > l3[0].gpa;
      if (improving) out.push(['up', '↗', '<b>Upward trend.</b> Your last three term GPAs (' + l3.map(function (x) { return x.gpa.toFixed(2); }).join(' → ') + ') are rising. Worth foregrounding in applications.']);
      var hist = sems.slice(0, -3);
      if (hist.length) {
        var ra = l3.reduce(function (s, x) { return s + x.gpa; }, 0) / 3, ha = hist.reduce(function (s, x) { return s + x.gpa; }, 0) / hist.length;
        if (ra > ha + 0.3) out.push(['up', '✓', '<b>Recovery.</b> The recent 3-term average (' + ra.toFixed(2) + ') is well above your earlier average (' + ha.toFixed(2) + ').']);
      }
    }
    if (active.length) {
      if (!info.possible) out.push(['stop', '∅', '<b>Target ' + target.toFixed(2) + ' is out of reach.</b> Even 100% on everything left tops out at ' + info.ceiling.toFixed(3) + '. Aim at or below that.']);
      else if (info.already) out.push(['up', '◎', '<b>Target ' + target.toFixed(2) + ' is already secured</b> if you simply pass everything planned.']);
      else out.push(['', '◎', '<b>Target ' + target.toFixed(2) + ' needs about ' + info.score.toFixed(0) + '%</b> on average across the planned courses. Ceiling from here: ' + info.ceiling.toFixed(3) + '.']);
      var lev = leverage(p, { sn: o.sn, sr: o.sr, target: 85 }, tot);
      if (lev.length > 1) {
        var top = lev[0];
        out.push(['', '▲', '<b>Biggest lever: ' + esc(top.code) + '</b> (' + top.cr + ' cr). Scoring 85% instead of a bare pass adds about +' + top.gain.toFixed(3) + ' to your final CGPA.']);
        var worst = lev.slice().sort(function (a, b) { return b.cost - a.cost; })[0];
        if (worst.cost > 0.005) out.push(['warn', '!', '<b>Costliest failure: ' + esc(worst.code) + '</b> (−' + worst.cost.toFixed(3) + ' final CGPA if you fail once before passing).']);
      }
    }
    var maxCr = (p.ui && p.ui.maxCreditsPerTerm) || 0;
    if (maxCr) planTerms(p).forEach(function (g) {
      if (g.term === 'Unassigned') return;
      var c = g.courses.reduce(function (s, x) { return s + (+x.credits || 0); }, 0);
      if (c > maxCr) out.push(['warn', '!', '<b>' + esc(g.term) + ' carries ' + c + ' cr</b>, above your ' + maxCr + ' cr ceiling. Overloaded terms are where GPAs usually slip; consider moving a course.']);
    });
    var un = unallocatedCredits(p, st);
    if (un > 0 && st.remaining > 0)
      out.push(['', 'i', '<b>' + un + ' remaining credits are not planned yet.</b> The projection assumes you average ' + (o.sn != null ? o.sn : 85) + '% on them (switch this off in Projection).']);
    return out;
  }

  return {
    DEFAULT_CONFIG: DEFAULT_CONFIG, BAND: BAND, MONTH_NAMES: MONTH_NAMES,
    termOrder: termOrder, nextTerm: nextTerm, termsAhead: termsAhead, termLabelFromOrder: termLabelFromOrder,
    makeCtx: makeCtx, isReq: isReq, passMark: passMark, isPass: isPass, scoreToGPA: scoreToGPA, letter: letter,
    gpaToPct: gpaToPct, pctToGpa: pctToGpa, bavarian: bavarian, germanClass: germanClass,
    drag: drag, carryTypes: carryTypes, attemptTypes: attemptTypes, courseTerms: courseTerms,
    groupCourses: groupCourses, totals: totals, computeCGPA: computeCGPA, semesterGPAs: semesterGPAs,
    cumulativeTimeline: cumulativeTimeline, creditStatus: creditStatus, isPassedCourse: isPassedCourse,
    planHistory: planHistory, isRetake: isRetake, expectedScore: expectedScore, planTerms: planTerms,
    unallocatedCredits: unallocatedCredits, projectParts: projectParts, projectFinal: projectFinal,
    projectTimeline: projectTimeline, termGPA: termGPA, scoreForTarget: scoreForTarget, closedForm: closedForm,
    leverage: leverage, monteCarlo: monteCarlo, validSnapshots: validSnapshots, snapshotErrors: snapshotErrors,
    rmse: rmse, insideBand: insideBand, fitRepeat: fitRepeat, leaveOneOut: leaveOneOut, compareModels: compareModels,
    projectionRange: projectionRange, recommendations: recommendations, esc: esc
  };
});
