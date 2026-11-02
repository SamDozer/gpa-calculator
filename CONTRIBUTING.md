# Contributing

Thanks for helping other students! Good first contributions:

## Add your programme’s course list

Templates live in [`data/templates.js`](data/templates.js). Add an object:

```js
{
  id: 'university-faculty-programme',
  title: 'University, Faculty: Programme (146 cr)',
  university: 'University, Faculty',
  totalCredits: 146,
  nonDegree: [],                       // codes that never count toward CGPA or the total
  curriculum: [ { level: 1, code: 'SCI101', name: 'General Chemistry I', credits: 4, req: false }, … ]
}
```

`req: true` marks university requirements (they use the lower pass mark). A template contains **course names and credits only**. Never include anyone’s grades.

## Report a grading rule that differs for you

Open an issue with the faculty/programme, the rule (pass marks, scale, how retakes are counted) and, if you can share them, a few official CGPA values per term (no names, no course-level grades needed). That is exactly what the calibration screen is for.

## Code

- `js/engine.js` is the single source of truth for the math and must stay free of DOM code. Change it together with `tests/engine.test.js`.
- `node tests/engine.test.js` must pass (no dependencies, Node 18+).
- No build step: plain scripts, so the site works from `file://` and GitHub Pages.
- **Privacy:** no network calls, analytics or storage beyond `localStorage`. Please keep it that way.

## Never commit personal data

Profiles exported from the app (`profile*.json`, `gpa-profile*.json`) are in `.gitignore`. Keep your own record in a private repository.
