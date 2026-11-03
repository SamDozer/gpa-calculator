/* Interface language: English (default) or Egyptian Arabic.
   Translation works on the rendered DOM: every text node, placeholder, title and aria-label is looked up in a dictionary
   (data/i18n-ar.js). Numbers and course/term codes are replaced by "#" in the lookup key and put back in order, so
   "Added BTC323 (3 cr, Jan2027). New course." and "Added BT411(1) (5 cr, May2026). New course." share one entry.
   Anything not in the dictionary (course names you typed, unknown strings) is left as it is. */
window.I18N = (function () {
  'use strict';
  var KEY = 'gpa-calculator:lang', lang = 'en', dict = null, obs = null, busy = false, scheduled = false, missing = {};
  var TOKEN = /[A-Za-z]+\d[\w()\/\-.]*|\d+(?:\.\d+)?/g;

  function detect() {
    try { var s = localStorage.getItem(KEY); if (s === 'ar' || s === 'en') return s; } catch (e) {}
    return /^ar\b/i.test(navigator.language || '') ? 'ar' : 'en';
  }
  /** "Added BTC323 (3 cr, Jan2027)." -> {key: "Added # (# cr, #).", nums: ["BTC323","3","Jan2027"]} */
  function norm(s) {
    var nums = [], key = s.replace(TOKEN, function (m) { nums.push(m); return '#'; });
    return { key: key, nums: nums };
  }
  function t(s) {
    if (lang !== 'ar' || !dict || typeof s !== 'string') return s;
    var lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0], core = s.trim();
    if (!core || !/[A-Za-z]/.test(core)) return s;
    var hit = dict[core];
    if (hit !== undefined) return lead + hit + trail;
    var n = norm(core); hit = dict[n.key];
    if (hit === undefined) { if (window.__I18N_HARVEST) missing[n.key] = core; return s; }
    var i = 0;
    return lead + hit.replace(/#/g, function () { return n.nums[i++] !== undefined ? n.nums[i - 1] : '#'; }) + trail;
  }

  var ATTRS = ['placeholder', 'title', 'aria-label', 'label'];
  function walk(root) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) { var tn = n.tagName; return (tn === 'SCRIPT' || tn === 'STYLE' || tn === 'TEXTAREA' || tn === 'CANVAS' || n.hasAttribute('data-noi18n')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP; }
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
    requestAnimationFrame(function () { scheduled = false; apply(document.body); });
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
