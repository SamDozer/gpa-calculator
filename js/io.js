/* Import / export helpers. Pure functions so they can be tested in Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.GPAIO = factory(root.GPA);
})(typeof self !== 'undefined' ? self : this, function (GPA) {
  'use strict';

  var ABSENT = /^(غ|ab|abs|absent|a|-|—|n\/a|na|null|none)$/i;

  function splitLine(line, delim) {
    if (delim === ',') {
      var out = [], cur = '', q = false;
      for (var i = 0; i < line.length; i++) {
        var ch = line[i];
        if (ch === '"') { q = !q; continue; }
        if (ch === ',' && !q) { out.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      out.push(cur.trim());
      return out;
    }
    return line.split(delim).map(function (s) { return s.trim(); });
  }
  function detectDelim(lines) {
    var first = lines[0];
    if (first.indexOf('\t') >= 0) return '\t';
    if (first.indexOf(';') >= 0 && first.indexOf(',') < 0) return ';';
    return ',';
  }
  var HEAD = {
    term: /^(term|semester|sem|period|session|الفصل)$/i,
    course: /^(course|code|course\s*code|subject|المقرر)$/i,
    credits: /^(credits?|hours?|ch|cr|credit\s*hours?|الساعات)$/i,
    score: /^(score|mark|marks|%|percent|percentage|grade\s*%|الدرجة)$/i,
    grade: /^(grade|letter|التقدير)$/i
  };
  function mapHeader(cells) {
    var idx = {}, hits = 0;
    cells.forEach(function (c, i) {
      Object.keys(HEAD).forEach(function (k) { if (idx[k] === undefined && HEAD[k].test(c)) { idx[k] = i; hits++; } });
    });
    return hits >= 2 ? idx : null;
  }

  /**
   * Parse pasted attempts. Accepts:
   *   JSON array  [{course,credits,term|semester,score,absent}]
   *   CSV / TSV   with or without a header (default order: course, credits, term, score)
   * A blank score, "غ", "AB" or "absent" means the exam was missed.
   * defaults.credits (course -> credits) fills a missing credits column.
   */
  function parseAttempts(text, defaults) {
    defaults = defaults || {};
    text = String(text || '').trim();
    var rows = [], errors = [];
    if (!text) return { rows: rows, errors: ['Nothing to import.'] };
    function push(term, course, credits, scoreRaw, absentFlag, line) {
      course = String(course || '').trim();
      if (!course) { errors.push('Line ' + line + ': missing course code'); return; }
      var tOrder = GPA.termOrder(term);
      if (!tOrder) { errors.push('Line ' + line + ': term “' + term + '” not understood (use e.g. Sep2026)'); return; }
      var sr = (scoreRaw == null) ? '' : String(scoreRaw).trim(), abs = !!absentFlag || sr === '' || ABSENT.test(sr), score = null;
      if (!abs) {
        score = parseFloat(sr);
        if (isNaN(score) || score < 0 || score > 100) { errors.push('Line ' + line + ': score “' + sr + '” must be 0 to 100'); return; }
      }
      var cr = parseFloat(credits);
      if (isNaN(cr) || cr <= 0) cr = defaults.credits && defaults.credits[course] ? defaults.credits[course] : NaN;
      if (isNaN(cr)) { errors.push('Line ' + line + ': credits missing for ' + course); return; }
      rows.push({ term: String(term).trim(), course: course, credits: cr, score: abs ? null : score, absent: abs });
    }
    if (text[0] === '[' || text[0] === '{') {
      try {
        var j = JSON.parse(text);
        if (!Array.isArray(j)) j = j.attempts || [];
        j.forEach(function (o, i) {
          push(o.term || o.semester || o.sem, o.course || o.code, o.credits != null ? o.credits : o.cr, o.score, o.absent, i + 1);
        });
      } catch (e) { errors.push('Invalid JSON: ' + e.message); }
      return { rows: rows, errors: errors };
    }
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    var delim = detectDelim(lines), head = mapHeader(splitLine(lines[0], delim)), start = 0;
    var order = { course: 0, credits: 1, term: 2, score: 3 };
    if (head) { order = head; start = 1; }
    else if (/course|term|semester|credit/i.test(lines[0]) && !/\d/.test(lines[0])) start = 1;
    for (var i = start; i < lines.length; i++) {
      var c = splitLine(lines[i], delim);
      var g = function (k) { return order[k] !== undefined ? c[order[k]] : undefined; };
      var score = g('score');
      if ((score === undefined || score === '') && order.grade !== undefined && /^(غ|ab|abs|absent)$/i.test(c[order.grade] || '')) score = 'AB';
      push(g('term'), g('course'), g('credits'), score, false, i + 1);
    }
    return { rows: rows, errors: errors };
  }

  function attemptsToCSV(p) {
    var ctx = GPA.makeCtx(p);
    return 'course,credits,term,score,grade\n' + (p.attempts || []).map(function (a) {
      var abs = !!a.absent || a.score == null;
      return [a.course, a.credits, a.term, abs ? '' : a.score, GPA.letter(abs ? null : a.score, abs, a.course, ctx)].join(',');
    }).join('\n');
  }
  function toJSON(p) { return JSON.stringify(p, null, 2); }

  /** Validate and normalise an imported profile; throws on obvious problems. */
  function parseProfile(text) {
    var o = JSON.parse(text);
    if (Array.isArray(o)) throw new Error('This looks like a list of attempts, not a profile. Use “Add courses → paste” instead.');
    if (!o || typeof o !== 'object' || (!o.attempts && !o.baseline && !o.plan)) throw new Error('Not a GPA profile file.');
    return o;
  }

  return { parseAttempts: parseAttempts, attemptsToCSV: attemptsToCSV, toJSON: toJSON, parseProfile: parseProfile };
});
