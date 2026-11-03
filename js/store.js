/* State: one profile object, saved to localStorage, with undo. Nothing leaves the browser. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.Store = factory(root.GPA);
})(typeof self !== 'undefined' ? self : this, function (GPA) {
  'use strict';

  var KEY = 'gpa-calculator:profile:v2';
  var listeners = [], undoStack = [], redoStack = [], lastCheckpoint = 0, saveTimer = null;
  var S = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function blank(opts) {
    opts = opts || {};
    return {
      version: 2,
      meta: { name: '', program: opts.program || '', university: opts.university || '' },
      mode: opts.mode || 'quick',
      config: clone(GPA.DEFAULT_CONFIG),
      degree: { totalCredits: opts.totalCredits || 146, curriculum: opts.curriculum || [], nonDegree: opts.nonDegree || [] },
      baseline: { enabled: (opts.mode || 'quick') === 'quick', cgpa: opts.cgpa || 0, gpaHours: opts.gpaHours || 0, earnedHours: opts.earnedHours || 0, asOf: opts.asOf || 'Now' },
      carry: {},
      attempts: [],
      plan: [],
      snapshots: [],
      ui: { sn: 85, sr: 65, target: 2.0, fill: true, maxCreditsPerTerm: 18, retakeWarnCredits: 6, levTarget: 85, levRetake: null, sd: 8, tab: 'overview' }
    };
  }

  /** Fill in anything missing so older / hand-edited files still load. */
  function normalize(p) {
    var b = blank({ mode: p.mode });
    var o = Object.assign({}, b, p);
    o.config = Object.assign({}, b.config, p.config || {});
    o.degree = Object.assign({}, b.degree, p.degree || {});
    o.degree.curriculum = o.degree.curriculum || []; o.degree.nonDegree = o.degree.nonDegree || [];
    o.baseline = Object.assign({}, b.baseline, p.baseline || {});
    o.ui = Object.assign({}, b.ui, p.ui || {});
    o.carry = p.carry || {}; o.attempts = p.attempts || []; o.plan = p.plan || []; o.snapshots = p.snapshots || [];
    o.meta = Object.assign({}, b.meta, p.meta || {});
    o.mode = p.mode || (o.baseline.enabled ? 'quick' : 'full');
    // Profiles saved before the improved model: floor passes at 1.0 and move the old fitted weights to "one extra registration".
    if (p.config && p.config.passFloor === undefined) {
      o.config.passFloor = 1.0;
      var c = p.config;
      if (c.repeatMode === 'weighted' && c.wFailed === 0.96 && c.wAbsent === 1 && c.decay === 0.04) { o.config.repeatMode = 'count_one'; o.meta.migrated = 'model5'; }
    }
    return o;
  }

  function fromTemplate(t, mode, extra) {
    return Object.assign(blank(Object.assign({ mode: mode, curriculum: clone(t.curriculum || []), nonDegree: clone(t.nonDegree || []),
      totalCredits: t.totalCredits, university: t.university }, extra || {})), {});
  }
  function fromSample(sample, template) {
    var p = fromTemplate(template, 'full');
    p.meta.name = 'Demo student';
    p.attempts = sample.attempts.map(function (a) {
      var c = p.degree.curriculum.filter(function (x) { return x.code === a[1]; })[0];
      return { term: a[0], course: a[1], credits: c ? c.credits : 3, score: a[2], absent: a[2] == null };
    });
    p.snapshots = clone(sample.snapshots || []);
    syncPlan(p);
    return p;
  }

  /** Remaining curriculum courses not yet passed (keeps existing term / expected score choices). */
  function syncPlan(p) {
    var tot = GPA.totals(p), prev = {};
    p.plan.forEach(function (r) { prev[r.code] = r; });
    // Full-transcript mode with a degree template: remaining = template minus passed.
    // Quick mode cannot know what was passed before the baseline, so it only prunes finished courses.
    if (p.mode === 'full' && p.degree.curriculum.length) {
      var out = [];
      p.degree.curriculum.forEach(function (c) {
        var cur = tot.byCode[c.code];
        if (cur && cur.passed) return;
        var old = prev[c.code];
        out.push(old ? old : { code: c.code, name: c.name, credits: c.credits, term: '', expected: null, active: true, level: c.level });
      });
      // keep manually added courses that are not in the curriculum and not yet passed
      p.plan.forEach(function (r) {
        if (p.degree.curriculum.some(function (c) { return c.code === r.code; })) return;
        var cur = tot.byCode[r.code];
        if (!(cur && cur.passed)) out.push(r);
      });
      p.plan = out;
    } else {
      p.plan = p.plan.filter(function (r) { var cur = tot.byCode[r.code]; return !(cur && cur.passed); });
    }
    return p;
  }

  /* --------------------------------------------------------- persistence */
  function safeGet() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function safeSet(v) { try { localStorage.setItem(KEY, v); return true; } catch (e) { return false; } }
  function load() {
    var raw = safeGet();
    if (!raw) return null;
    try { S = normalize(JSON.parse(raw)); return S; } catch (e) { return null; }
  }
  function save() { if (S) safeSet(JSON.stringify(S)); }
  function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 250); }

  function get() { return S; }
  function set(p) { S = normalize(p); undoStack = []; redoStack = []; save(); emit(); return S; }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} S = null; undoStack = []; redoStack = []; emit(); }

  function subscribe(fn) { listeners.push(fn); }
  function emit() { listeners.forEach(function (fn) { fn(S); }); }

  /** Call right before mutating. Groups rapid edits (typing) into one undo step. */
  function checkpoint(force) {
    var now = Date.now();
    if (force || now - lastCheckpoint > 1500) {
      undoStack.push(JSON.stringify(S)); if (undoStack.length > 40) undoStack.shift();
      redoStack = [];
    }
    lastCheckpoint = now;
  }
  /** Mutate the profile, save, repaint. */
  function update(fn, opts) {
    opts = opts || {};
    checkpoint(opts.force);
    fn(S);
    scheduleSave(); emit();
  }
  function undo() {
    if (!undoStack.length) return false;
    redoStack.push(JSON.stringify(S));
    S = normalize(JSON.parse(undoStack.pop())); lastCheckpoint = 0; scheduleSave(); emit(); return true;
  }
  function redo() {
    if (!redoStack.length) return false;
    undoStack.push(JSON.stringify(S));
    S = normalize(JSON.parse(redoStack.pop())); lastCheckpoint = 0; scheduleSave(); emit(); return true;
  }
  function canUndo() { return undoStack.length > 0; }
  function canRedo() { return redoStack.length > 0; }

  /** Set a value by path like "plan.3.expected". */
  function setPath(path, value) {
    var parts = path.split('.'), o = S;
    for (var i = 0; i < parts.length - 1; i++) { o = o[parts[i]]; if (o == null) return; }
    o[parts[parts.length - 1]] = value;
  }

  return { KEY: KEY, blank: blank, normalize: normalize, fromTemplate: fromTemplate, fromSample: fromSample, syncPlan: syncPlan,
    load: load, save: save, get: get, set: set, clear: clear, subscribe: subscribe, update: update, undo: undo, redo: redo,
    canUndo: canUndo, canRedo: canRedo, setPath: setPath, clone: clone };
});
