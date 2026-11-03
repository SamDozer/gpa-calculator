# Grading model

How the planner turns scores into a CGPA. The implementation is [`js/engine.js`](../js/engine.js); the tests in [`tests/engine.test.js`](../tests/engine.test.js) pin every rule below.

## 1. Score to grade points

```
g(score) = 0                                        if absent or score < pass mark
g(score) = max(1.0, min((score − 50) / 10, 5))      otherwise
```

| Course type | Pass mark |
|---|---|
| Subject courses | 60 |
| University requirements | 50 |

So 60% = 1.0, 65% = 1.5, 75% = 2.5, 85% = 3.5, 100% = 5.0. **A pass is never worth less than 1.0 points:** a university requirement passed at 50–59% prints as 1.0 on the academic record (not 0.5–0.9). The inverse for display is `percent = g × 10 + 50`. Letters (A ≥ 85, B ≥ 75, C ≥ 65, D below that, F = fail, AB = absent) are display-only. All constants are editable in Settings.

Courses printed with **0 hours** (for example Critical thinking, Entrepreneurship) appear on the record but count for nothing.

## 2. CGPA with repeated courses

```
            Σ_c  credits_c · g(latest_c)
CGPA = ───────────────────────────────────────────
        Σ_c  credits_c · (1 + [course was attempted before])
```

Only the **latest** attempt of a course earns points. A course that was attempted before (failed or missed) stays in the denominator **one extra time**, however many earlier attempts it had: one extra registration. A course whose latest attempt is a fail still counts with `g = 0`. Courses outside the degree list are excluded.

Alternatives are in Settings for comparison: *replace* (textbook), *weighted* (the earlier fitted rule: 0.96 for a failed exam, 1.00 for an absence, each later attempt ×0.04) and *capped*.

### Evidence

The university does not publish the formula, so it was inferred from official numbers and then tested on a second record.

| Rule | 5 official CGPAs of one student: RMSE | inside rounding (±0.0005) | A second student’s final CGPA (official 1.838) |
|---|---|---|---|
| Replace (textbook) | 0.432 | 0 / 5 | 2.039 (+0.201) |
| Weighted 0.96 / 1.00 / 0.04, no floor (older fit) | 0.00058 | 2 / 5 | 1.8412 (+0.003) |
| Weighted 0.96 / 1.00 / 0.04 + floor | 0.0067 | 0 / 5 | 1.8449 (+0.007) |
| Count one, no floor | 0.0067 | 0 / 5 | 1.8340 (−0.004) |
| **Count one + 1.0 floor (current)** | **0.00028** | **5 / 5** | **1.8377 (−0.0003)** |

- The simple integer rule with the floor reproduces **all five** official values within the university’s 3-decimal rounding with **zero fitted parameters**. A free re-fit of the weighted rule, once the floor is in, collapses to failed weight 1.00, absence weight 1.00 and decay ≈ 0, i.e. the same rule. The earlier weights (0.96 / 0.04) were compensating for the missing floor.
- The second student’s record shows only the latest attempt of each course, with later registration dates marking retakes. Six courses look retaken (20 hours); the official 1.838 needs exactly **16** repeated hours, i.e. five of them (the sixth, a 4-hour course, was probably only deferred). That cannot be matched by weights below 1, and the old rule over-shoots by 0.007. So the evidence is consistent across two students, but note the second record cannot say *which* of two 4-hour courses was not a repeat.
- A third record with no repeats (all courses sat once in their normal terms) gives exactly Σ hours × points ÷ 146.

**Confidence.** High: only the latest attempt earns points, a repeated course costs one extra registration, passes are floored at 1.0. Open: whether absences differ from fails (no evidence so far), and whether a third or later attempt adds anything (none seen). **Settings → Calibration** lets you type your own official CGPAs, see the per-term error and re-fit if your record disagrees.

## 3. Projection

Passing each remaining course once appends one attempt. The final denominator does not depend on the scores:

```
final CGPA = (N + Q) / D_final
N = quality points today,  Q = Σ credits × g over the planned courses,
D_final = D_now + new credits + credits of retaken courses that had no earlier attempt counted yet
```

Consequences you can read off the formula:

- Every extra quality point is worth `1 / D_final` CGPA, whichever course it came from.
- A 4-credit course is worth four times a 1-credit course per grade point.
- The ceiling (100% everywhere) is `(N + 5 × planned credits) / D_final`; a target above it is impossible and the app says so.
- The expensive moment is a course’s **first** failure (one extra registration). A course already repeated costs nothing more to fail again, though it still blocks graduation.

### Quick mode (no transcript)

If you start from a CGPA and hours, the app sets `N = CGPA × hours counted` and `D = hours counted`. Courses you failed earlier are still inside those hours. For a retake of one of them, say it was failed or missed before; the app then adds only the extra registration the new attempt books, exactly as if it had the full history. Anything added in the Courses tab is counted on top of the baseline.

## 4. German grade (modified Bavarian formula)

```
German = 1 + 3 · (N_max − N_d) / (N_max − N_min)
```

`N_max` = best GPA, `N_d` = yours, `N_min` = lowest passing GPA. `N_min` is contested (1.0 or 2.0); both are one field away. It is an estimate: uni-assist or the programme’s own conversion is the authority.

## 5. What the graduation statement prints

The faculty’s statement classifies by: **Excellent** 3.5–5 (85–100%), **Very Good** 2.5–3.4 (75–84%), **Good** 1.5–2.4 (65–74%), **Pass** 1–1.4 (60–64%), and the percentage equals `GPA × 10 + 50`.

- A record with a true CGPA of **3.4527** was classed **Excellent** and printed **3.5 / 85%**; another printed its exact **1.838 / 68.38%** and was classed Good. So the class follows the GPA rounded to 1 decimal, while the printed number is not always rounded (a near-threshold value was printed rounded up). The Projection tab shows the exact value and the class.
- “With Honour” has extra criteria that are not modelled.

## 6. Term GPA

The per-term GPA shown in charts is the credit-weighted `g` of every attempt sat that term, including fails and absences, with no repeat penalty. The university’s own term GPA definition may differ; it is a trend indicator only.

## 7. Term calendar

Terms are named by their **exam period**: Jan (or Dec) = Term 1 exams, May (or Jun) = Term 2 exams (the term starts in February), Sep (or Aug) = summer exams.
