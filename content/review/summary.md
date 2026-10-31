# Review log: Module 1 (primary hemostasis)

Reviewed 2026-10-30. Three independent reviewer agents (Opus), none of which saw the drafting conversation, each got the content files, the source excerpts (`content/m1/excerpts.md`), and a claim-by-claim checklist. Raw verdicts are in `content/review/r1.json`, `r2.json`, `r3.json` (first round), `r1b/r2b/r3b.json` (re-review of fixes by the reviewer who raised them), and `r1c/r1d.json` (final narrow re-checks).

## Summary

| | Count |
|---|---|
| Claims reviewed in round 1 (node + glossary) | 52 |
| Claims with any flag | 27 |
| Items with a blocking flag (factual error or citation problem) | 18 (17 claims, 1 question) |
| Factual errors | 2 (g-zym-1: "all clotting factors circulate as zymogens"; m1-q08 v3: a spleen distractor that is partly true) |
| Claims edited after review (wording, sources, or both) | 31 |
| Claims deleted (no second conforming source) | 2 (c-et-2 spasm duration, c-vwf-4 shear) |
| Glossary entries added from reviewer 2's flags | 17 (30 terms flagged; the other 13 were removed from learner text or explained inline) |
| Claims in the shipped module | 67 (43 node claims → 43 flashcards, 24 glossary claims) |
| Blocking flags still open | 0 |

Every quoted passage was then checked word for word against its source: 44 against saved copies on disk, and 61 against the live NCBI and PMC pages in a browser. All matched.

## What the reviewers caught that matters for learning

- **Source articles contain errors in sentences we didn't quote.** The archived StatPearls "Platelet Activation" article calls ticagrelor irreversible (it is reversible; the FDA label says so), and says factor VIII belongs to the "extrinsic" pathway. StatPearls "Biochemistry, Clotting Factors" lists factor VI as a serine protease (there is no factor VI). Those sentences were never used, which is why every claim needs two independent sources.
- **A fix can introduce a new error.** The first replacement source for thromboxane A2 said it is released from granules. It isn't: platelets make it on demand from a membrane fat. Reviewer 1 caught that on re-review.
- **"Reversible" ≠ short-acting.** Reviewer 3 flagged that calling ticagrelor (Brilinta) reversible, with no duration, could make an EMT think a Brilinta patient's bleeding risk is gone in hours. The label shows platelet inhibition back to placebo levels only after about 5 days.
- **Primary then secondary hemostasis is a teaching simplification.** In the body (cell-based model), the platelet plug and the fibrin clot are built together on activated platelets. This is now a flagged simplification on the platelet-plug card.

## Escalated to Devin

Nothing blocking. Three decisions are yours to overrule:

1. **EMS-practice lines left out of Module 1** (reviewer 2 asked for them): why EMTs give aspirin in suspected ACS, and that a wound can re-bleed once vascular spasm wears off. The spec requires EMS-practice claims to be sourced to the current Massachusetts Statewide Treatment Protocols. I put them in the Module 6 drug entries rather than writing them unsourced now.
2. **Two claims with thin sourcing on one detail** (reviewer 1, not blocking). In c-endo-2, thrombin and TXA2 as platelet activators rest on one StatPearls article, though the claim's core has two sources. In c-ag-1, "largest and most numerous granule" has one source.
3. **Style flags declined** (listed in the table below with reasons). The main one is that m1-q19, the 150,000 threshold question, is recall sitting under an apply goal.

## Glossary taps

The app logs every glossary tap. No usage data exists yet; terms tapped 3+ times will be listed here after your first export.

## Lesson (added 2026-10-30)

Devin pointed out that Module 1 had only flashcards and node cards and no actual teaching. I added a 10-section guided lesson (`content/m1/lesson.json`). Every paragraph cites the reviewed claims it rests on, and a build test fails if a paragraph cites no claim or a claim that doesn't exist.

| | Count |
|---|---|
| Paragraphs reviewed | 33 (plus 10 section "problem" lines) |
| Blocking flags | 4 factual errors and 5 citation problems (R1 and R3 combined) |
| Style flags | 9 from R2, 6 from R1 and R3 |
| Fixed and re-checked by the reviewer who raised them | all blocking items approved on re-check |

The one item still open after re-check, m1-l09#2, was a true but unsourced clause ("the plug at any cut is weak"). I removed it rather than ship it unsourced.

What the lesson review caught that matters:

- **Plavix/Effient durations.** The first draft never said each blocked platelet stays blocked for its whole life, and it gave the label's "about 5 days" as if it were a limit. Together that could make Plavix seem to wear off faster than aspirin.
- **The bleeding pattern.** Skin and mucosal bleeding is *typical* of platelet problems, not a signature, and the same signs have other causes.
- **"Platelets only clot at a break."** This was an overstatement; it now reads "normally".
