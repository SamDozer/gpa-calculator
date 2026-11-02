# Grading model

How the planner turns scores into a CGPA. The implementation is [`js/engine.js`](../js/engine.js); the tests in [`tests/engine.test.js`](../tests/engine.test.js) pin every rule below.

## 1. Score to grade points

```
g(score) = 0                              if absent or score < pass mark
g(score) = min((score − 50) / 10, 5)      otherwise
```

| Course type | Pass mark |
|---|---|
| Subject courses | 60 |
| University requirements | 50 |

So 60% = 1.0, 65% = 1.5, 75% = 2.5, 85% = 3.5, 100% = 5.0. The inverse for display is `percent = g × 10 + 50`. Letters (A ≥ 85, B ≥ 75, C ≥ 65, D below that, F = fail, AB = absent) are display-only and do not affect any number. All of these constants are editable in Settings.

## 2. CGPA with repeated courses

For every course, take its **latest** attempt for the points and treat each **earlier** attempt as extra weight in the denominator:

```
            Σ_c  credits_c · g(latest_c)
CGPA = ─────────────────────────────────────────────
        Σ_c  credits_c · (1 + Σ_k  w(p_k) · decay^k)

w = 0.96 for a sat-and-failed exam, 1.00 for an absence, decay = 0.04
(p_0 is the oldest earlier attempt)
```

In plain terms: **the first failure of a course costs almost one full extra registration; each later failure of the same course adds only about 4% of that.** A course attempted five times carries roughly one extra registration of drag, not four. A course whose latest attempt is a fail still counts with `g = 0`.

Courses outside the degree list (for example a passed course that is not part of the required total) are excluded from the CGPA when *exclude non-degree courses* is ticked.

Other repeat rules are available in Settings for comparison: **replace** (only the latest attempt counts), **count one extra registration**, and **capped** (retake grade limited to a maximum).

### Evidence and confidence

The university does not publish this formula. The weights were fitted to a handful of official CGPA values from one student’s record, reproducing them to within the 3-decimal rounding (error ≈ 0.0006) and predicting a held-out value correctly. Treat it as a **calibrated model, not a regulation**:

- **High confidence:** the shape: first failure ≈ one full registration, later ones nearly free.
- **Medium:** absences weigh slightly more than failed exams (1.00 vs 0.96).
- **Low:** the exact decay (anything from about 0.03 to 0.06 fits). It barely affects projections.

Because your record may behave slightly differently, **Settings → Calibration** lets you type the official CGPAs your own university showed, see the error per term, and auto-fit the three parameters. The fit treats each official value as the interval ±0.0005 (its rounding), keeps *every* parameter set that reproduces all your numbers, and the Projection tab shows the spread of outcomes across them.

## 3. Projection

Passing each remaining course once appends one attempt. Earlier attempts of that course become drag at that moment, so the final denominator is fixed no matter what you score:

```
final CGPA = (N + Q) / D_final
N = quality points today,  Q = Σ credits × g over the planned courses,  D_final = D_now + new credits + drag booked by passing retakes
```

Consequences you can read straight off the formula:

- Every extra quality point is worth `1 / D_final` CGPA, independent of which course it came from.
- A 4-credit course is worth four times a 1-credit course per grade point.
- The ceiling (100% everywhere) is `(N + 5 × planned credits) / D_final`; a target above it is impossible, and the app says so.
- For retakes, the damage is already booked; passing them costs little GPA but still counts toward graduation.

### Quick mode (no transcript)

If you start from a CGPA and hours, the app sets `N = CGPA × hours counted` and `D = hours counted`. Courses you failed earlier are still inside those hours. For a retake of one of them, say how many times you failed or missed it; the app then adds only the extra drag the new attempt books, exactly as if it had the full history. Anything you add in the Courses tab is counted on top of the baseline.

## 4. German grade (modified Bavarian formula)

```
German = 1 + 3 · (N_max − N_d) / (N_max − N_min)
```

`N_max` = best GPA, `N_d` = yours, `N_min` = lowest passing GPA. `N_min` is contested (1.0 or 2.0); both are one field away. It is an estimate: uni-assist or the programme’s own conversion is the authority.

## 5. Term GPA

The per-term GPA shown in charts is the credit-weighted `g` of every attempt sat that term, including fails and absences, with no repeat drag. The university’s own term GPA definition may differ; it is a trend indicator only.
