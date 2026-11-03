/* Interface language: English (default) or Egyptian Arabic.
   Translation works on the rendered DOM: every text node, placeholder, title and aria-label is looked up in a dictionary
   (data/i18n-ar.js). Numbers and course/term codes are replaced by "#" in the lookup key and put back in order, so
   "Added BTC323 (3 cr, Jan2027). New course." and "Added BT411(1) (5 cr, May2026). New course." share one entry.
   Anything not in the dictionary (course names you typed, unknown strings) is left as it is. */
window.I18N = (function () {
  'use strict';
  var KEY = 'gpa-calculator:lang', lang = 'en', dict = null, obs = null, busy = false, scheduled = false, missing = {};
  var TOKEN = /[A-Za-z]+\d+(?:\(\w+\))?|\d+(?:\.\d+)?/g;   // codes like BT411(1), Jan2027, then plain numbers

  function detect() {
    try { var s = localStorage.getItem(KEY); if (s === 'ar' || s === 'en') return s; } catch (e) {}
    return /^ar\b/i.test(navigator.language || '') ? 'ar' : 'en';
  }
  /** "Added BTC323 (3 cr, Jan2027)." -> {key: "Added # (# cr, #).", nums: ["BTC323","3","Jan2027"]} */
  function norm(s) {
    var nums = [], key = s.replace(TOKEN, function (m) { nums.push(m); return '#'; });
    return { key: key, nums: nums };
  }
  function core(c, depth) {
    var hit = dict[c];
    if (hit !== undefined) return hit;
    var n = norm(c); hit = dict[n.key];
    if (hit !== undefined) { var i = 0; return hit.replace(/#/g, function () { return n.nums[i++] !== undefined ? n.nums[i - 1] : '#'; }); }
    // known endings such as " · new" or the class word after a GPA
    var suf = window.I18N_AR_SUFFIX || [];
    for (var k = 0; k < suf.length && !depth; k++) {
      var sx = suf[k][0];
      if (c.length > sx.length && c.slice(-sx.length) === sx) { var base = core(c.slice(0, -sx.length), 1); return (base === null ? c.slice(0, -sx.length) : base) + suf[k][1]; }
    }
    if (window.__I18N_HARVEST) missing[n.key] = c;
    return null;
  }
  function t(s) {
    if (lang !== 'ar' || !dict || typeof s !== 'string') return s;
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], c = s.trim();
    if (!c || !/[A-Za-z]/.test(c)) return s;
    var r = core(c, 0);
    return r === null ? s : lead + r + trail;
  }

  var ATTRS = ['placeholder', 'title', 'aria-label', 'label'];
  function walk(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) { var tn = n.tagName; return (tn === 'SCRIPT' || tn === 'STYLE' || tn === 'NOSCRIPT' || tn === 'TEXTAREA' || tn === 'CANVAS' || n.hasAttribute('data-noi18n')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP; }
        return NodeFilter.FILTER_ACCEPT;
      }
    }), n;
    while ((n = w.nextNode())) { var v = n.nodeValue, r = t(v); if (r !== v) n.nodeValue = r; }
    var els = root.querySelectorAll ? root.querySelectorAll('[placeholder],[title],[aria-label],option[label]') : [];
    for (var i = 0; i < els.length; i++) ATTRS.forEach(function (a) { var v2 = els[i].getAttribute(a); if (v2) { var r2 = t(v2); if (r2 !== v2) els[i].setAttribute(a, r2); } });
    if (root.nodeType === 1 && root.hasAttribute && root.hasAttribute('title')) { var tv = root.getAttribute('title'), tr = t(tv); if (tr !== tv) root.setAttribute('title', tr); }
  }
  function apply(root) {
    if (lang !== 'ar' || !dict) return;
    busy = true; try { walk(root || document.body); document.title = t(document.title) || document.title; } finally { busy = false; }
  }
  function schedule() {
    if (scheduled) return; scheduled = true;
    setTimeout(function () { scheduled = false; apply(document.body); }, 20);   // not rAF: it is paused in background tabs
  }
  function start() {
    lang = detect(); dict = window.I18N_AR || null;
    var h = document.documentElement;
    h.setAttribute('lang', lang === 'ar' ? 'ar-EG' : 'en'); h.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    if (lang === 'ar' && dict) {
      obs = new MutationObserver(function () { if (!busy) schedule(); });
      obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
      apply(document.body);
    }
    var b = document.getElementById('btnLang');
    if (b) { b.textContent = lang === 'ar' ? 'English' : 'عربي'; b.title = lang === 'ar' ? 'Switch to English' : 'عرض بالعربي (مصري)'; b.onclick = function () { set(lang === 'ar' ? 'en' : 'ar'); }; }
  }
  function set(l) { try { localStorage.setItem(KEY, l); } catch (e) {} location.reload(); }
  return { start: start, t: t, apply: apply, set: set, norm: norm, get lang() { return lang; }, get missing() { return missing; } };
})();
