/* Run with:  node tests/engine.test.js     (no dependencies) */
'use strict';
const assert = require('assert');
const G = require('../js/engine.js');
const IO = require('../js/io.js');
const Store = require('../js/store.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('PASS ' + name); }
  catch (e) { failed++; console.log('FAIL ' + name + '\n     ' + (e && e.message)); }
}
const near = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= (eps || 1e-9), (msg || '') + ' expected ' + b + ' got ' + a);

function profile(over) {
  const p = Store.blank({ mode: 'full' });
  p.baseline.enabled = false;
  return Object.assign(p, over || {});
}
const att = (term, course, credits, score) => ({ term, course, credits, score, absent: score == null });

/* ------------------------------------------------------------ grading */
test('score to GPA on the 0-5 scale', () => {
  const p = profile(), ctx = G.makeCtx(p);
  [[100, 5], [95, 4.5], [91, 4.1], [85, 3.5], [75, 2.5], [65, 1.5], [60, 1], [59, 0]]
    .forEach(([s, g]) => near(G.scoreToGPA(s, false, 'SCI101', ctx), g, 1e-9, 'score ' + s));
  near(G.scoreToGPA(null, true, 'SCI101', ctx), 0);
});
test('university requirements pass at 50', () => {
  const ctx = G.makeCtx(profile());
  near(G.scoreToGPA(55, false, 'BTU101', ctx), 0.5);
  near(G.scoreToGPA(55, false, 'SCI101', ctx), 0);
  near(G.scoreToGPA(50, false, 'U110', ctx), 0);
});
test('gpa <-> percent round trip and Bavarian endpoints', () => {
  const cfg = G.DEFAULT_CONFIG;
  near(G.gpaToPct(1.5, cfg), 65); near(G.pctToGpa(75, cfg), 2.5);
  near(G.bavarian(5, 5, 1), 1); near(G.bavarian(1, 5, 1), 4);
  assert.strictEqual(G.bavarian(3, 1, 1), null);
});
test('terms: parsing and rolling to the next term', () => {
  assert.strictEqual(G.termOrder('Sep2026'), 202609);
  assert.strictEqual(G.termOrder('Sep 2026'), 202609);
  assert.strictEqual(G.termOrder('2026 Sep'), 202609);
  assert.strictEqual(G.termOrder('Fall-2026'), 202609);
  assert.strictEqual(G.termOrder('مايو2026'), 202605);
  assert.strictEqual(G.termOrder('nonsense'), 0);
  assert.strictEqual(G.nextTerm('Sep2026'), 'Jan2027');
  assert.strictEqual(G.nextTerm('Jan2027'), 'May2027');
  assert.strictEqual(G.nextTerm('Jan2027', ['Fall', 'Spring']), 'Spring2027');
  assert.strictEqual(G.nextTerm('Spring2027', ['Fall', 'Spring']), 'Fall2027');
  assert.deepStrictEqual(G.termsAhead('May2026', 3), ['Sep2026', 'Jan2027', 'May2027']);
});

test('exam periods: Dec = Jan (Term 1), Jun = May (Term 2), Aug = Sep (summer)', () => {
  assert.strictEqual(G.termOrder('Dec2026'), G.termOrder('Jan2027'));
  assert.strictEqual(G.termOrder('Jun2027'), G.termOrder('May2027'));
  assert.strictEqual(G.termOrder('Aug2027'), G.termOrder('Sep2027'));
  assert.ok(G.termOrder('Jan2027') < G.termOrder('May2027') && G.termOrder('May2027') < G.termOrder('Sep2027'));
  assert.strictEqual(G.termOrder('Summer 2027'), 202706);   // a season word is not an alias
});
test('term info names the exam period and academic year', () => {
  assert.strictEqual(G.termInfo('Jan2027').text, 'Term 1 · 2026/27');
  assert.strictEqual(G.termInfo('Dec2026').text, 'Term 1 · 2026/27');
  assert.strictEqual(G.termInfo('May2027').text, 'Term 2 · 2026/27');
  assert.strictEqual(G.termInfo('Sep2027').text, 'Summer · 2026/27');
  assert.strictEqual(G.termInfo('Fall2026', ['Fall', 'Spring']).text, 'Term 1 · 2026/27');
  assert.strictEqual(G.termInfo('nonsense'), null);
});
test('attempts logged as Dec and Jan land in the same term', () => {
  const p = profile({ attempts: [att('Dec2026', 'A', 4, 80), att('Jan2027', 'B', 2, 70)] });
  assert.strictEqual(G.semesterGPAs(p).length, 1);
});
test('uniformFor applies the uniform score to chosen courses only', () => {
  const p = Store.blank({ mode: 'quick', cgpa: 2.0, gpaHours: 60, earnedHours: 60, totalCredits: 66 });
  p.ui.fill = false;
  p.plan = [{ code: 'A', credits: 3, expected: 70, active: true, term: 'Jan2027' }, { code: 'B', credits: 3, expected: 90, active: true, term: 'May2027' }];
  const v = G.projectFinal(p, { uniform: 100, uniformFor: ['B'] });
  near(v, (120 + 3 * 2 + 3 * 5) / 66, 1e-9);
});

/* ------------------------------------------------------------ CGPA */
test('hand-computed CGPA with a failed-then-passed course and an absence', () => {
  // A 4cr 80 -> g3 ; B 2cr fail 55 then 70 -> g2, drag .96 ; C 3cr absent then 90 -> g4, drag 1.0
  const p = profile({ attempts: [
    att('Jan2023', 'A', 4, 80), att('Jan2023', 'B', 2, 55), att('Jan2023', 'C', 3, null),
    att('May2023', 'B', 2, 70), att('May2023', 'C', 3, 90)] });
  const t = G.totals(p);
  near(t.N, 4 * 3 + 2 * 2 + 3 * 4, 1e-9); near(t.D, 4 + 2 * 1.96 + 3 * 2.0, 1e-9);
  near(t.cgpa, 28 / 13.92, 1e-9);
});
test('decay: second and third failures add 4% and 0.16%', () => {
  const p = profile({ attempts: [att('Jan2023', 'X', 2, 40), att('May2023', 'X', 2, 30), att('Sep2023', 'X', 2, 20), att('Jan2024', 'X', 2, 80)] });
  near(G.totals(p).D, 2 * (1 + 0.96 + 0.96 * 0.04 + 0.96 * 0.0016), 1e-9);
});
test('repeat modes: full replaces, count_one counts one registration, capped limits the grade', () => {
  const base = [att('Jan2023', 'X', 4, 40), att('May2023', 'X', 4, 40), att('Sep2023', 'X', 4, 95)];
  const mk = (mode) => { const p = profile({ attempts: base }); p.config.repeatMode = mode; return G.totals(p); };
  near(mk('full').D, 4); near(mk('count_one').D, 8); near(mk('capped').N, 4 * 3.3, 1e-9);
});
test('non-degree courses are excluded from CGPA and credits', () => {
  const p = profile({ attempts: [att('Jan2023', 'A', 4, 80), att('Jan2023', 'U110', 2, 50)] });
  p.degree.nonDegree = ['U110'];
  near(G.totals(p).D, 4); near(G.semesterGPAs(p)[0].gpa, 3);
  p.config.excludeNonDegree = false; near(G.totals(p).D, 6);
});
test('credit status counts passes only, once per course', () => {
  const p = profile({ attempts: [att('Jan2023', 'A', 4, 80), att('Jan2023', 'B', 2, 55), att('May2023', 'B', 2, 40)] });
  p.degree.totalCredits = 20;
  const cs = G.creditStatus(p);
  assert.strictEqual(cs.earned, 4); assert.strictEqual(cs.remaining, 16);
});

/* ------------------------------------------------------------ baseline (quick mode) */
test('quick mode: closed form final = (N + Q) / D_final', () => {
  const p = Store.blank({ mode: 'quick', cgpa: 2.0, gpaHours: 60, earnedHours: 60, totalCredits: 69 });
  p.plan = [0, 1, 2].map(i => ({ code: 'N' + i, credits: 3, expected: 80, active: true, term: 'Sep2026' }));
  near(G.totals(p).cgpa, 2.0);
  near(G.projectFinal(p, { sn: 85, sr: 65 }), (120 + 27) / 69, 1e-9);
  const cf = G.closedForm(p, { sn: 85, sr: 65 });
  near(cf.Dfinal, 69); near(cf.Q, 27 * 3 / 3 * 1, 1e-9 + 0); near(cf.final, 147 / 69, 1e-9);
});
test('quick mode: retake of a failed course adds only the repeat drag', () => {
  const p = Store.blank({ mode: 'quick', cgpa: 1.5, gpaHours: 50, earnedHours: 47, totalCredits: 60 });
  p.carry.F1 = { failed: 1, absent: 0 };
  p.plan = [{ code: 'F1', credits: 3, expected: 70, active: true, term: 'Sep2026' }];
  p.ui.fill = false;
  near(G.projectFinal(p, {}), (75 + 3 * 2) / (50 + 3 * 0.96), 1e-9);
});
test('quick mode: unplanned remaining credits are filled at the default score', () => {
  const p = Store.blank({ mode: 'quick', cgpa: 2.0, gpaHours: 60, earnedHours: 60, totalCredits: 72 });
  near(G.unallocatedCredits(p), 12);
  near(G.projectFinal(p, { sn: 80, sr: 65 }), (120 + 12 * 3) / 72, 1e-9);
  p.ui.fill = false; near(G.projectFinal(p, { sn: 80, sr: 65 }), 2.0, 1e-9);
});

/* ------------------------------------------------------------ randomized invariants */
function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function randomTranscript(r) {
  const terms = ['Jan2022', 'May2022', 'Sep2022', 'Jan2023', 'May2023', 'Sep2023', 'Jan2024'];
  const codes = Array.from({ length: 14 }, (_, i) => 'C' + i), cr = {}; codes.forEach(c => cr[c] = 2 + Math.floor(r() * 3));
  const attempts = [];
  terms.forEach(t => codes.forEach(c => {
    if (r() < 0.22) {
      const x = r(); const prev = attempts.filter(a => a.course === c);
      const passedAlready = prev.length && prev[prev.length - 1].score != null && prev[prev.length - 1].score >= 60;
      if (passedAlready) return;
      attempts.push(att(t, c, cr[c], x < 0.2 ? null : (x < 0.5 ? 20 + Math.floor(r() * 39) : 60 + Math.floor(r() * 41))));
    }
  }));
  return { attempts, codes, cr };
}
test('projection equals recomputing the transcript with the planned attempts appended', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const r = rng(seed), { attempts, codes, cr } = randomTranscript(r);
    const p = profile({ attempts });
    p.config.wFailed = 0.9 + r() * 0.1; p.config.decay = r() * 0.2;
    const tot = G.totals(p);
    p.plan = codes.filter(c => !(tot.byCode[c] && tot.byCode[c].passed)).map(c => ({ code: c, credits: cr[c], expected: 60 + Math.floor(r() * 41), active: true, term: '' }));
    p.ui.fill = false;
    const q = JSON.parse(JSON.stringify(p));
    p.plan.forEach(it => q.attempts.push(att('Sep2030', it.code, it.credits, it.expected)));
    near(G.projectFinal(p, {}), G.totals(q).cgpa, 1e-9, 'seed ' + seed);
  }
});
test('baseline + carry reproduces the full transcript exactly', () => {
  for (let seed = 100; seed <= 140; seed++) {
    const r = rng(seed), { attempts } = randomTranscript(r);
    const p = profile({ attempts });
    p.config.wFailed = 0.93; p.config.decay = 0.07;
    const cut = G.termOrder('Sep2022');
    const old = attempts.filter(a => G.termOrder(a.term) <= cut), recent = attempts.filter(a => G.termOrder(a.term) > cut);
    const o = JSON.parse(JSON.stringify(p)); o.attempts = old;
    const ot = G.totals(o);
    const q = Store.blank({ mode: 'quick', cgpa: ot.cgpa, gpaHours: ot.D, earnedHours: 0 });
    q.config = p.config; q.attempts = recent;
    recent.forEach(a => { const oc = ot.byCode[a.course]; if (oc && !q.carry[a.course]) q.carry[a.course] = { types: G.attemptTypes(oc.attempts, a.course, ot.ctx) }; });
    near(G.totals(q).cgpa, G.totals(p).cgpa, 1e-9, 'seed ' + seed);
  }
});
test('monotonic: higher expected scores never lower the projection', () => {
  const r = rng(7), { attempts, codes, cr } = randomTranscript(r), p = profile({ attempts }), tot = G.totals(p);
  p.plan = codes.filter(c => !(tot.byCode[c] && tot.byCode[c].passed)).map(c => ({ code: c, credits: cr[c], expected: null, active: true, term: '' }));
  let prev = -1;
  for (let s = 60; s <= 100; s += 5) { const v = G.projectFinal(p, { sn: s, sr: s }); assert.ok(v >= prev - 1e-12); prev = v; }
});
test('target solver: the returned score reaches the target', () => {
  const r = rng(11), { attempts, codes, cr } = randomTranscript(r), p = profile({ attempts }), tot = G.totals(p);
  p.plan = codes.filter(c => !(tot.byCode[c] && tot.byCode[c].passed)).map(c => ({ code: c, credits: cr[c], expected: null, active: true, term: '' }));
  const lo = G.projectFinal(p, { uniform: 60 }), hi = G.projectFinal(p, { uniform: 100 }), tgt = (lo + hi) / 2;
  const s = G.scoreForTarget(p, tgt);
  assert.ok(s.possible); near(G.projectFinal(p, { uniform: s.score }), tgt, 1e-6);
  assert.strictEqual(G.scoreForTarget(p, hi + 0.5).possible, false);
});
test('failing a course once costs more for a fresh course than for a heavily repeated one', () => {
  const p = profile({ attempts: [att('Jan2022', 'OLD', 2, 10), att('May2022', 'OLD', 2, 10), att('Sep2022', 'OLD', 2, 10), att('Jan2023', 'OLD', 2, null), att('May2023', 'OLD', 2, null), att('Jan2023', 'DONE', 4, 90)] });
  p.plan = [{ code: 'OLD', credits: 2, expected: 80, active: true }, { code: 'NEW', credits: 2, expected: 80, active: true }];
  p.ui.fill = false;
  const lev = G.leverage(p, { sn: 80, sr: 80 }), cost = {}; lev.forEach(l => cost[l.code] = l.cost);
  assert.ok(cost.NEW > 0.01); assert.ok(Math.abs(cost.OLD) < 0.002);
});
test('Monte Carlo is reproducible and bounded by floor and ceiling', () => {
  const r = rng(5), { attempts, codes, cr } = randomTranscript(r), p = profile({ attempts }), tot = G.totals(p);
  p.plan = codes.filter(c => !(tot.byCode[c] && tot.byCode[c].passed)).map(c => ({ code: c, credits: cr[c], expected: null, active: true, term: '' }));
  const a = G.monteCarlo(p, { sn: 85, sr: 65, runs: 800, seed: 3 }), b = G.monteCarlo(p, { sn: 85, sr: 65, runs: 800, seed: 3 });
  assert.deepStrictEqual(a.hist, b.hist);
  assert.ok(a.p5 <= a.p50 && a.p50 <= a.p95);
  assert.ok(a.max <= G.projectFinal(p, { uniform: 100 }) + 1e-9);
});

/* ------------------------------------------------------------ calibration */
test('fit recovers parameters that reproduce synthetic official snapshots', () => {
  const r = rng(21), { attempts } = randomTranscript(r), p = profile({ attempts });
  p.config.wFailed = 0.95; p.config.wAbsent = 1.0; p.config.decay = 0.05;
  const orders = [...new Set(attempts.map(a => G.termOrder(a.term)))].sort((a, b) => a - b);
  p.snapshots = orders.map(o => ({ term: G.termLabelFromOrder(o), cgpa: Math.round(G.totals(p, o).cgpa * 1000) / 1000 }));
  const fit = G.fitRepeat(p);
  assert.ok(fit && fit.feasible.length > 0, 'a feasible set exists');
  const q = JSON.parse(JSON.stringify(p)); Object.assign(q.config, { wFailed: fit.wFailed, wAbsent: fit.wAbsent, decay: fit.decay });
  G.snapshotErrors(q).forEach(e => assert.ok(Math.abs(e.err) <= 0.0005 + 1e-9));
});

/* ------------------------------------------------------------ import / export */
test('CSV import: header, absences, defaults', () => {
  const res = IO.parseAttempts('course,credits,semester,score\nBTC111,4,Jan2022,70\nBTM111,3,Jan2022,\nBTM111,3,May2022,غ\nX,2,Sep 2022,AB');
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(res.rows.length, 4);
  assert.strictEqual(res.rows[1].absent, true); assert.strictEqual(res.rows[2].absent, true); assert.strictEqual(res.rows[3].absent, true);
});
test('TSV paste from a spreadsheet, headerless', () => {
  const res = IO.parseAttempts('BTC111\t4\tJan2022\t70\nBTBio111\t4\tJan2022\t57');
  assert.strictEqual(res.rows.length, 2); assert.strictEqual(res.rows[1].score, 57);
});
test('legacy dashboard JSON export imports', () => {
  const res = IO.parseAttempts(JSON.stringify([{ course: 'A', credits: 3, semester: 'May2024', score: 88, grade: 'A' }, { course: 'B', credits: 2, semester: 'May2024', score: null, grade: 'AB' }]));
  assert.strictEqual(res.rows.length, 2); assert.strictEqual(res.rows[1].absent, true);
});
test('import reports bad rows instead of failing silently', () => {
  const res = IO.parseAttempts('course,credits,semester,score\nA,3,Someday,70\nB,3,Jan2022,170\n,3,Jan2022,70');
  assert.strictEqual(res.rows.length, 0); assert.strictEqual(res.errors.length, 3);
});
test('profile files with a BOM (re-saved on Windows) still load', () => {
  const p = profile({ attempts: [att('Jan2023', 'A', 4, 80)] });
  const BOM = String.fromCharCode(0xFEFF);
  assert.ok(IO.parseProfile(BOM + IO.toJSON(p)).attempts.length === 1);
  assert.strictEqual(IO.parseAttempts(BOM + 'course,credits,term,score\nA,3,Jan2023,70').rows.length, 1);
});
test('first hand-off transcript format converts to a profile with the same CGPA and plan', () => {
  const legacy = { curriculum: [{ level: 1, code: 'A', name: 'Alpha', credits: 4 }, { level: 1, code: 'B', name: 'Beta', credits: 2 }, { level: 2, code: 'BTU1', name: 'Req', credits: 2 }],
    university_requirement_codes: ['BTU1'], non_degree_courses: ['X'],
    attempts: [{ term: 'Jan2023', course: 'A', credits: 4, score: 80, absent: false }, { term: 'Jan2023', course: 'B', credits: 2, score: 40, absent: false },
      { term: 'Jan2023', course: 'X', credits: 2, score: 90, absent: false }, { term: 'Jan2023', course: 'BTU1', credits: 2, score: 55, absent: false }],
    official_snapshots: [{ term: 'Jan2023', cgpa: 2.5 }], fitted_config: { w_failed: 0.96, w_absent: 1, decay: 0.04, repeat_mode: 'weighted', exclude_non_degree: true } };
  const p = Store.normalize(IO.parseProfile(JSON.stringify(legacy)));
  near(G.totals(p).cgpa, (12 + 0 + 0.5 * 2) / (4 + 2 + 2), 1e-9);
  assert.deepStrictEqual(p.plan.map(r => r.code), ['B']);
  assert.strictEqual(p.snapshots.length, 1);
});
test('garbage files give a readable error', () => {
  assert.throws(() => IO.parseProfile('not json'), /not valid JSON/);
  assert.throws(() => IO.parseProfile('{"hello":1}'), /Not a GPA profile/);
});
test('graduation statement: GPA to 1 decimal and % to a whole number, rounded to nearest', () => {
  const c = G.classify(3.4527);
  assert.strictEqual(c.printedGPA, 3.5); assert.strictEqual(c.printedPct, 85); assert.strictEqual(c.band, 'Excellent');
  assert.strictEqual(G.classify(3.44).band, 'Very Good'); assert.strictEqual(G.classify(2.45).band, 'Very Good');
  assert.strictEqual(G.classify(1.5373).band, 'Good'); assert.strictEqual(G.classify(1.44).band, 'Pass');
  assert.strictEqual(G.classify(0.9).band, 'Below pass');
});
test('alias codes count as the curriculum course (alternative electives, renamed codes)', () => {
  const p = profile({ attempts: [att('Jan2025', 'ALT1', 2, 90), att('Jan2025', 'B', 2, 80)] });
  p.degree.curriculum = [{ level: 1, code: 'MAIN', name: 'Elective', credits: 2, aliases: ['ALT1'] }, { level: 1, code: 'B', name: 'B', credits: 2 }];
  p.degree.totalCredits = 4;
  const tot = G.totals(p);
  assert.ok(tot.byCode.MAIN && !tot.byCode.ALT1);
  assert.strictEqual(G.creditStatus(p, tot).earned, 4);
  Store.syncPlan(p); assert.strictEqual(p.plan.length, 0);
});
test('0-hour requirements import and never move the CGPA', () => {
  const res = IO.parseAttempts('course,credits,term,score\nU110,0,May2022,79\nA,4,Jan2022,80');
  assert.strictEqual(res.errors.length, 0); assert.strictEqual(res.rows[0].credits, 0);
  const p = profile({ attempts: res.rows }); near(G.totals(p).cgpa, 3.0, 1e-9);
});
test('profile survives a JSON round trip', () => {
  const p = profile({ attempts: [att('Jan2023', 'A', 4, 80)] });
  const q = Store.normalize(JSON.parse(IO.toJSON(p)));
  near(G.totals(q).cgpa, G.totals(p).cgpa);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
