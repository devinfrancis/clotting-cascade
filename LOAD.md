# Daily load: Phase 1 (Module 1 only)

Numbers are from `scripts/simulate-load.mjs`, which runs the real 43 cards through ts-fsrs with default parameters, 200 simulated runs averaged. Assumed answers: on a new card's first sight, 25% Again / 15% Hard / 55% Good / 5% Easy; on reviews, 10% Again / 10% Hard / 72% Good / 8% Easy. Rerun with a different cap: `node scripts/simulate-load.mjs 5`.

## What exists

| | Count |
|---|---|
| Flashcards | **43** (one per verified fact on a node) |
| Knowledge goals | 14 (3 recall, 6 explain, 5 apply; 3 are physiology-only cases, 3 are misconception goals) |
| Quiz items | 27, each with 3 variants (81 variants in all) |
| Pre-test | 7 questions, once |

### Cards per goal

A card counts toward every goal that covers its node, so these add to more than 43. Counts are computed from `goals.json` and `cards.json`.

| Goal | Cards |
|---|---|
| g01 List the four steps of primary hemostasis | 7 |
| g02 Match each platelet receptor to its job | 6 |
| g03 Identify what dense and alpha granules release | 6 |
| g04 Explain why platelets don't stick to an intact wall | 3 |
| g05 Explain how vWF connects a platelet to collagen | 6 |
| g06 Explain how ADP and TXA2 recruit more platelets | 7 |
| g07 Explain how GPIIb/IIIa and fibrinogen join platelets | 6 |
| g08 Explain why the plug is not the final clot | 2 |
| g09 Explain why a normal count doesn't guarantee clotting | 8 |
| g10 Predict the consequences of aspirin's COX-1 block | 11 |
| g11 Predict which step the P2Y12 blockers block | 6 |
| g12 Predict bleeding at a cut with a very low count | 10 |
| g13 Predict which step fails without vWF | 7 |
| g14 Predict which step fails without GPIIb/IIIa | 5 |

## Projection at the default cap (10 new cards/day)

| | New cards/day | Reviews/day | Total card answers/day (incl. same-day relearning) |
|---|---|---|---|
| Week 1 | 6 (all 43 seen by day 5) | 9 | 27 |
| Week 2 | 0 | 5 | 6 |
| Week 4 | 0 | 3 | 3 |
| Week 8 | 0 | 1–2 | 1–2 |

New-card weeks at the default cap: under one week (5 days). At a cap of 5 it takes 9 days and week 2 averages 7 reviews/day.

## Minutes per day

These assume about 10 seconds per card answer and about 90 seconds per goal quiz (each quiz is 1–3 questions). Goals need graded passes on day 0, then 2+ days later, then 6+ days later. All 14 goals finish in roughly 2–3 weeks, as prerequisites unlock, at about 2–4 quizzes a day early on.

| | Day off | Shift day |
|---|---|---|
| Week 1 | ~5 min cards + ~5 min quizzes ≈ **10 min** | ≤10 reviews, no new cards, quizzes wait ≈ **≤2 min** |
| Week 2 | ~1 min cards + ~4 min quizzes ≈ **5 min** | ≈ **1 min** |
| Week 4 | <1 min cards + a few quizzes ≈ **2–3 min** | ≈ **<1 min** |
| Week 8 | <1 min, plus 30-day retention checks starting ≈ **1–3 min** | ≈ **<1 min** |

## Honest read

- **Module 1 is light.** 43 cards is far below the spec's estimate of 400–600 for the whole app. Only facts that passed review with two sources became cards, and drug entries are deliberately thin until Module 6.
- **These numbers won't hold once more modules land.** If later modules come in at 50–90 cards each, which is likely for Modules 2 and 6, the full app lands around 350–500 cards. Reviews then climb toward the spec's 80–120/day at the default cap of 10.
- **Week 4 of Phase 1 is nowhere near too much after a 12.** The pile to watch is Module 2 onward. Lowering the cap now buys nothing for Module 1; the better time to decide on the cap is before Module 2.
