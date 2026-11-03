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
  function clean(text) { return String(text || '').replace(/^﻿/, '').trim(); }

  function parseAttempts(text, defaults) {
    defaults = defaults || {};
    text = clean(text);
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
      if (isNaN(cr) || cr < 0) cr = defaults.credits && defaults.credits[course] != null ? defaults.credits[course] : NaN;   // 0 is valid: 0-hour requirements are printed on records
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

  /** The first hand-off format (curriculum + attempts + fitted_config at the top level) -> v2 profile. */
  function fromLegacyTranscript(o) {
    var req = {}; (o.university_requirement_codes || []).forEach(function (c) { req[c] = true; });
    var f = o.fitted_config || {}, d = GPA.DEFAULT_CONFIG;
    var p = {
      version: 2, meta: { name: (o.student && (o.student.name || o.student)) || '', program: '', university: '' }, mode: 'full',
      config: Object.assign({}, d, {
        maxGPA: f.max_gpa != null ? f.max_gpa : d.maxGPA, gpaOffset: f.gpa_offset != null ? f.gpa_offset : d.gpaOffset, gpaDivisor: f.gpa_divisor != null ? f.gpa_divisor : d.gpaDivisor,
        subjectPass: f.subject_pass_score != null ? f.subject_pass_score : d.subjectPass, requirementPass: f.requirement_pass_score != null ? f.requirement_pass_score : d.requirementPass,
        repeatMode: f.repeat_mode || d.repeatMode, wFailed: f.w_failed != null ? f.w_failed : d.wFailed, wAbsent: f.w_absent != null ? f.w_absent : d.wAbsent, decay: f.decay != null ? f.decay : d.decay,
        excludeNonDegree: f.exclude_non_degree !== false
      }),
      degree: { totalCredits: (o.curriculum || []).reduce(function (s, c) { return s + c.credits; }, 0) || 146,
        curriculum: (o.curriculum || []).map(function (c) { return { level: c.level, code: c.code, name: c.name, credits: c.credits, req: !!req[c.code] }; }), nonDegree: o.non_degree_courses || [] },
      baseline: { enabled: false, cgpa: 0, gpaHours: 0, earnedHours: 0, asOf: '' }, carry: {},
      attempts: (o.attempts || []).map(function (a) { return { term: a.term, course: a.course, credits: a.credits, score: a.absent ? null : a.score, absent: !!a.absent, placeholder: !!a.placeholder_score }; }),
      plan: [], snapshots: (o.official_snapshots || []).map(function (s) { return { term: s.term, cgpa: s.cgpa }; }), ui: {}
    };
    var tot = GPA.totals(p);
    p.plan = p.degree.curriculum.filter(function (c) { return !(tot.byCode[c.code] && tot.byCode[c.code].passed); })
      .map(function (c) { return { code: c.code, name: c.name, credits: c.credits, term: '', expected: null, active: true, level: c.level }; });
    return p;
  }

  /** Validate and normalise an imported profile; throws on obvious problems. */
  function parseProfile(text) {
    var o;
    try { o = JSON.parse(clean(text)); } catch (e) { throw new Error('This file is not valid JSON (' + e.message + '). Use the file downloaded from Data → Download my data.'); }
    if (Array.isArray(o)) throw new Error('This looks like a list of attempts, not a profile. Use Courses → “Paste many courses” instead.');
    if (o && o.attempts && o.curriculum && !o.degree) return fromLegacyTranscript(o);
    if (!o || typeof o !== 'object' || (!o.attempts && !o.baseline && !o.plan)) throw new Error('Not a GPA profile file.');
    return o;
  }

  return { parseAttempts: parseAttempts, fromLegacyTranscript: fromLegacyTranscript, attemptsToCSV: attemptsToCSV, toJSON: toJSON, parseProfile: parseProfile };
});
