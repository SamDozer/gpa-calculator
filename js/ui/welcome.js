/* First-run screen: pick a starting point. Builds the profile, then hands over to App. */
UI.Welcome = (function () {
  'use strict';
  var G = window.GPA, el = null, step = null;
  var REPO_URL = '';   // set after publishing, e.g. 'https://github.com/<owner>/gpa-calculator'

  function tplOptions(sel) {
    return window.GPA_TEMPLATES.map(function (t) { return '<option value="' + t.id + '"' + (t.id === sel ? ' selected' : '') + '>' + UI.esc(t.title) + '</option>'; }).join('');
  }
  function tpl(id) { return window.GPA_TEMPLATES.filter(function (t) { return t.id === id; })[0] || window.GPA_TEMPLATES[0]; }

  function render() {
    var h = '<section class="hero"><p class="mono muted" style="font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;margin:0 0 8px">Credit-hour GPA · 0–5 scale · Faculty of Science</p>' +
      '<h1>Know your CGPA. <span class="em">Plan the next one.</span></h1>' +
      '<p>See where you stand, what next semester does to your CGPA, and exactly what you need to score to hit a target. It understands repeat-course penalties, so retakes are modelled the way your registrar counts them.</p></section>' +
      '<div class="modes">' +
      '<button class="mode" data-act="quick"><span class="ic">⚡</span><h3>Quick start</h3><p>You know your current CGPA and finished hours, and don’t want to type old courses. Start planning this or next semester in under a minute.</p><span class="go">I know my CGPA &amp; hours →</span></button>' +
      '<button class="mode" data-act="full"><span class="ic">📋</span><h3>Full transcript</h3><p>Enter every course attempt to get the exact CGPA, term-by-term charts, repeat penalties, and a degree map. Paste from Excel works.</p><span class="go">I’ll enter my courses →</span></button>' +
      '<button class="mode" data-act="demo"><span class="ic">🧪</span><h3>Try the demo</h3><p>Explore every screen with a made-up student first. One click on “Erase everything” in the Data menu clears it and brings you back here.</p><span class="go">Show me around →</span></button>' +
      '</div>';
    if (step === 'quick') h += quickForm();
    if (step === 'full') h += fullForm();
    h += '<div class="privacy"><span>🔒</span><span><b>Private by design.</b> Everything runs in your browser and is saved only on this device. There is no account and no server. Use <i>Data → Download my data</i> to back up or move devices. ' +
      '<a href="#" data-act="load">Load a saved file</a>' + (REPO_URL ? ' · <a href="' + REPO_URL + '" target="_blank" rel="noopener">Open source on GitHub</a>' : '') + '</span></div>';
    el.innerHTML = h;
  }

  function quickForm() {
    return '<div class="card" id="qcard"><h2>Your starting point</h2><p class="note">Copy these from your student portal or transcript. You can change them any time in Settings.</p>' +
      '<div class="cfg">' +
      '<label>Current CGPA<input type="number" id="q_cgpa" step="0.001" min="0" max="5" placeholder="e.g. 2.84" inputmode="decimal"></label>' +
      '<label>Hours counted in CGPA <span class="help" title="The credit hours your university used to compute that CGPA. If you never failed or missed a course this equals your passed hours. If you did, it is higher, because failed attempts still count in the denominator.">?</span><input type="number" id="q_gh" min="1" step="0.5" placeholder="e.g. 96"></label>' +
      '<label>Hours passed (earned)<input type="number" id="q_eh" min="0" step="0.5" placeholder="same as left if no fails"></label>' +
      '<label>Hours to graduate<input type="number" id="q_tot" min="1" value="146" list="totlist"></label>' +
      '<label>As of term (optional)<input type="text" id="q_asof" placeholder="Sep2026" style="width:110px"></label>' +
      '</div><datalist id="totlist"><option value="120"><option value="132"><option value="136"><option value="140"><option value="144"><option value="146"></datalist>' +
      '<div class="cfg" style="margin-top:12px"><label>Course list for autofill (optional)<select id="q_tpl">' + tplOptions('blank') + '</select></label></div>' +
      '<p class="msg" id="q_msg" style="margin:10px 0"></p>' +
      '<div class="btnrow"><button class="btn primary" data-act="startQuick">Start planning</button><button class="btn" data-act="cancel">Back</button></div></div>';
  }
  function fullForm() {
    return '<div class="card"><h2>Which degree?</h2><p class="note">A template pre-fills the course list, credits and the 146-hour total so the app can work out what is left. Pick “Blank” to type your own. Your grades are never part of a template.</p>' +
      '<div class="cfg"><label>Programme<select id="f_tpl">' + tplOptions('cu-science-biotech-molbiochem') + '</select></label>' +
      '<label>Hours to graduate<input type="number" id="f_tot" min="1" value="146"></label></div>' +
      '<div class="btnrow" style="margin-top:14px"><button class="btn primary" data-act="startFull">Continue to my courses</button><button class="btn" data-act="cancel">Back</button></div></div>';
  }

  function startQuick() {
    var cg = parseFloat(document.getElementById('q_cgpa').value), gh = parseFloat(document.getElementById('q_gh').value),
      ehRaw = document.getElementById('q_eh').value, eh = ehRaw === '' ? gh : parseFloat(ehRaw), tot = parseFloat(document.getElementById('q_tot').value),
      asof = document.getElementById('q_asof').value.trim(), msg = document.getElementById('q_msg');
    var err = null;
    if (isNaN(cg) || cg < 0 || cg > 5) err = 'Enter your CGPA as a number between 0 and 5.';
    else if (isNaN(gh) || gh <= 0) err = 'Enter the hours counted in your CGPA.';
    else if (isNaN(eh) || eh < 0) err = 'Enter your passed hours.';
    else if (isNaN(tot) || tot <= 0) err = 'Enter the total hours needed to graduate.';
    else if (eh > tot) err = 'Passed hours cannot exceed the hours needed to graduate.';
    else if (eh > gh + 1e-9) err = 'Passed hours cannot exceed the hours counted in your CGPA (failed courses make the second number larger, not smaller).';
    else if (asof && !G.termOrder(asof)) err = 'Term should look like Sep2026 or Fall 2026 (or leave it empty).';
    if (err) { msg.className = 'msg err'; msg.textContent = err; return; }
    var t = tpl(document.getElementById('q_tpl').value);
    var p = Store.fromTemplate(t, 'quick', { cgpa: cg, gpaHours: gh, earnedHours: eh, totalCredits: tot, asOf: asof || 'Start' });
    p.degree.totalCredits = tot;
    Store.set(p); App.showApp('plan');
    UI.toast('Starting point saved. Add the courses you’re taking next.');
  }
  function startFull() {
    var t = tpl(document.getElementById('f_tpl').value), tot = parseFloat(document.getElementById('f_tot').value) || t.totalCredits;
    var p = Store.fromTemplate(t, 'full', { totalCredits: tot });
    p.degree.totalCredits = tot;
    Store.syncPlan(p);
    Store.set(p); App.showApp('transcript');
  }
  function startDemo() {
    var t = tpl(window.GPA_SAMPLE.template);
    Store.set(Store.fromSample(window.GPA_SAMPLE, t)); App.showApp('overview');
    UI.toast('Demo student loaded. “Erase everything” in the Data menu returns here.');
  }
  function loadFile() {
    UI.pickFile('.json,application/json', function (txt) {
      try { Store.set(GPAIO.parseProfile(txt)); App.showApp('overview'); } catch (e) { UI.toast(e.message, 'err'); }
    });
  }

  function mount(root) {
    el = document.createElement('div'); root.appendChild(el); step = null; render();
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t) return;
      e.preventDefault();
      var a = t.dataset.act;
      if (a === 'quick' || a === 'full') { step = a; render(); var c = el.querySelector('.card'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      else if (a === 'cancel') { step = null; render(); }
      else if (a === 'startQuick') startQuick();
      else if (a === 'startFull') startFull();
      else if (a === 'demo') startDemo();
      else if (a === 'load') loadFile();
    });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && step === 'quick' && e.target.tagName === 'INPUT') startQuick(); });
  }
  return { mount: mount };
})();
