# GPA Planner for Science Students

**English** · [بالعربي (مصري)](README.ar.md) · [Live site](https://samdozer.github.io/gpa-calculator/)

A free, private GPA calculator and semester planner for **credit-hour programmes on a 0–5 scale** (built for the Cairo University Faculty of Science, adjustable for others). It runs entirely in your browser: no account, no server, no tracking. Your grades never leave your device.

**Use it:** open the GitHub Pages site of this repository, or download the repo and double-click `index.html`.

## What it does

- **Knows your CGPA exactly**, including the part most calculators get wrong: a course you failed or missed stays in the denominator one extra time even after you retake and pass it. The rule reproduces five official CGPAs within rounding and a second student’s final CGPA ([evidence](docs/GRADING_MODEL.md)).
- **Plans next semester.** The Semester calculator (top of the Plan tab) takes the courses you are taking and the score you expect in each, and shows the semester GPA, your new CGPA, and what each course does to it.
- **Speaks the faculty calendar.** Terms are named by exam period: Jan (or Dec) = Term 1, May (or Jun) = Term 2, Sep (or Aug) = summer exams, with the academic year shown (see Settings → Term calendar).
- **Answers “what do I need?”** The target calculator tells you the average you need to reach a CGPA, warns when a target is impossible, and shows which courses are worth the most effort and which failures cost the most.
- **Shows the risk.** A simulation turns “I expect 85%” into a likely range and the probability of hitting your target.
- **Estimates the German grade** (modified Bavarian formula) for MSc applications.

## Two ways to start

| Mode | For you if… |
|---|---|
| **Quick start** | You know your current CGPA and hours and don’t want to type old courses. Enter them, add this or next semester’s courses, done. Old courses are optional and are counted on top. |
| **Full transcript** | You want the exact CGPA, term-by-term charts, repeat penalties and a degree map. Paste your courses straight from Excel or Google Sheets (CSV/TSV/JSON). |

There is also a **demo** with a made-up student so you can click around first. The whole interface is also available in **Egyptian Arabic** (right-to-left): press the *عربي* button in the header (it follows your browser language on first visit).

## Screens

| Tab | What is there |
|---|---|
| Overview | KPIs, CGPA timeline (computed vs official vs projected), term trend, credit progress, scenario comparison, recommendations |
| Courses | Add or paste results, edit the attempt log grouped by term, degree map |
| Plan | Drag-and-drop semester board, editable plan with per-course expected scores, CGPA after each term, leverage and cost-of-failure |
| Projection | Presets and sliders, the exact formula with your numbers, target solver (overall or “by the end of this term”), scenarios, risk simulation, German grade |
| Analytics | Grade distribution, subject averages, grade mix by year, where the repeat penalty sits, credits registered vs passed |
| Settings | Grading rules, calibration against your official CGPAs (auto-fit), degree template, backup/restore |

## Privacy

Data is saved in your browser’s local storage only. **Data ▾ → Download my data** exports a JSON file you can keep or move to another device. If you fork this repository, never commit your own profile: `.gitignore` already excludes `profile*.json`.

## Different faculty or programme?

Grading numbers (pass marks, offset/divisor, max GPA, repeat rule) are editable in **Settings → Grading rules**. The **degree total** (146 here) is a normal field: enter yours. Course lists come from templates in [`data/templates.js`](data/templates.js); you can also paste your own list in Settings. Template contributions are welcome: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Run locally and test

No build step.

```bash
# open index.html in a browser, or serve the folder:
npx serve .

# unit tests (Node 18+, no dependencies)
node tests/engine.test.js
```

Layout:

```
index.html          page shell
css/styles.css      design tokens, light + dark
js/engine.js        pure grading, CGPA, projection, simulation, fitting (browser + Node)
js/io.js            CSV / TSV / JSON import and export
js/store.js         profile, local-storage persistence, undo
js/ui/*.js          one file per tab
data/templates.js   degree course lists
data/sample.js      made-up demo student
tests/              Node tests, including invariants (projection == recompute, baseline+carry == full transcript)
docs/               grading model write-up
```

## How this compares to other GPA calculators

Common features in the calculators students use (target-GPA solvers, impossible-target warnings, what-if semesters, replace-vs-average retake policies, client-side privacy) are all here. What is different: the repeat-course penalty is modelled the way this registrar appears to count it, and the model can be **checked and re-fitted against your own official CGPAs** instead of being taken on faith.

## FAQ

**How is CGPA calculated at Cairo University Faculty of Science when a course is retaken?**
Only the latest attempt earns points, and a course that was attempted before stays in the denominator **one extra time** (one extra registration), however many earlier attempts it had. Passes also never earn less than 1.0 grade points (a university requirement passed at 50–59% prints as 1.0). Details and evidence: [docs/GRADING_MODEL.md](docs/GRADING_MODEL.md). It is an inferred model, not a published regulation, and the app can check it against your official CGPAs.

**How do I calculate my GPA if I only know my current CGPA and hours?**
Use *Quick start*: enter CGPA, hours counted in it, hours passed and the hours needed to graduate, then add next semester’s courses in the Semester calculator.

**What do I need to score to reach a target CGPA?**
The target calculator on the Projection tab solves for the average across your planned courses and tells you when the target is impossible.

**What scale and grade conversion does it use?**
0–5 credit-hour scale: points = (score − 50) ÷ 10, pass mark 60% (50% for university requirements), 85–100% Excellent, 75–84% Very Good, 65–74% Good, 60–64% Pass. All editable.

**Does it send my grades anywhere?**
No. There is no server; data stays in your browser’s local storage.

**Can I use it for another university or a different degree total?**
Yes: grading numbers and the degree total are editable, and you can paste your own course list. Contribute a template via [CONTRIBUTING.md](CONTRIBUTING.md).

## Keywords

GPA calculator, CGPA calculator, Cairo University GPA, Faculty of Science GPA, credit hour system, 0–5 GPA scale, retake / repeat course GPA, semester planner, target GPA calculator, Modified Bavarian formula, German grade conversion, حاسبة المعدل التراكمي, كلية العلوم جامعة القاهرة, نظام الساعات المعتمدة.

## Disclaimer

Estimates only. Not an official document. The repeat-course rule is **inferred** from official CGPAs (and cross-checked on a second record), not a university regulation; confirm anything important with your faculty’s student affairs office. “Good standing” and graduation thresholds are the faculty’s to define.

## License

[MIT](LICENSE)
