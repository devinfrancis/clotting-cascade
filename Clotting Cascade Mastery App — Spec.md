# Clotting Cascade Mastery App — Spec

Oct 29, 2026 · @Devin

## Goal

A single-user study app that takes one EMT-B from "I've heard of the clotting cascade" to being able to rebuild it from memory, explain why each step exists, and predict what any anticoagulant, antiplatelet, or thrombolytic does to it and to the labs.

The user is Devin. Prior knowledge: EMT-B pharmacology and physiology, no biochem. Everything is explained from first principles (what problem is the body solving at this step) and then drilled until it's automatic. The app replaces re-reading; it does not replace a textbook as the source of truth. There is no pre-teaching module: Devin learns the actual content from the first screen, and any term he doesn't know is defined on demand and in place (see Definitions on demand).

**The physiology the app teaches is the cell-based model** (initiation on tissue-factor-bearing cells; amplification, where the first small amount of thrombin activates platelets and factors V, VIII, and XI on the platelet surface; propagation, where the tenase and prothrombinase complexes on activated platelets produce the thrombin burst). The classic intrinsic/extrinsic/common "Y diagram" is taught only as the lab-test map that explains what PT and aPTT measure, and the app says so every time it shows it. Teaching the Y diagram as how the body works is the hardest misconception to unlearn later.

Out of scope for v1: platelet biochemistry below the receptor level, pediatric coagulation, and lab bench methods beyond one sentence per test (enough to say what PT and aPTT actually measure: citrated plasma + a trigger + calcium, time to clot). Obstetrics gets exactly two goals because both are routine EMS: pregnancy as a clot-prone state (Module 5) and postpartum hemorrhage + TXA (Module 7). Everything else can be added later as content files without changing the app.

**Disclaimer shown in the app:** this is a study tool, not a clinical reference. Local and state protocol always wins.

## What mastery means

A goal is **Retained**, the final state, when its quiz has been passed at 100% three times at expanding intervals and then passed again cold at 30 and 90 days. Nothing else counts as mastery.

The content is broken into **knowledge goals**: small, named things to know. Each goal has its own quiz, and the quiz *is* the definition of the goal: if you can pass it cold, you know that thing.

**Goal template.** Every goal is one observable verb plus one concept, and is tagged by level. Examples: "List the vitamin K-dependent factors" (recall), "Explain why heparin does nothing without antithrombin" (explain), "Predict which lab rises in a patient on warfarin" (apply). "Understand warfarin" is not a goal. Each module must have goals at all three levels; a module that is 90% recall is rejected at review.

**Goal states:** Locked → Available → In progress (1–2 graded passes) → Mastered (3 passes) → Retained (passed the 90-day check). Review is the fallback state from Mastered or Retained. A module's pre-test is offered once when the module is first opened; it can be skipped, and it never locks anything.

**Rules for goals:**

- Each goal is passable in under 2 minutes of quizzing.
- Each content module has 5–15 goals, written by Claude Code from the template above.
- Each quiz item has at least 3 variants with shuffled answer order. A graded attempt draws the variant seen least recently.
- **Graded vs practice.** A quiz can be practiced any time; practice never counts and never hurts. One graded attempt per goal per day counts toward mastery. The app schedules graded days (day 0, then 2+ days later, then 6+ days later) and lists them on Home under "quizzes due"; Devin does not have to track them.
- **A miss on a graded attempt** does not reset earlier passes. The goal keeps its passes and the next graded attempt is offered the next day.
- **An interrupted graded attempt** (a call comes in, the app is closed) resumes exactly where it left off for 24 hours; after that it is discarded. It is never scored as a fail.
- Goal quizzes are gated by prerequisites (no heparin before antithrombin). The diagram and all Learn content are never gated; browsing ahead is encouraged.
- A typed answer that is marked wrong can be overridden with "I was right" (for typos). Overrides are logged quietly in the export file for Devin's own review, not displayed on the goal.
- A Mastered or Retained goal drops to **Review** only if, after 2 missed flashcards tied to it within 14 days, Devin also fails the one-question re-check that those misses trigger. Every flashcard shows which goals it is tied to.
- **Delayed retention check:** at 30 and 90 days after Mastered, the goal is re-quizzed with no hints (no diagram, no glossary popovers, no "show answer"). A miss drops it to Review. Retention checks due appear on Home.
- When a claim is corrected after review, every goal covering that node drops to Review, and the app shows a one-line "what changed" note on each affected goal so the drop is never a mystery.
- Each module has a short **pre-test**, offered when the module is first opened, with an "I don't know" option on every question so a near-zero score is expected and not discouraging. It sets the baseline and gates nothing.
- The home screen shows: goals Retained + Mastered / total, goals in Review, cards due today, quizzes due today, retention checks due.

**Question types:** multiple choice, type-the-answer (with fuzzy matching: "Xa", "FXa", "factor 10a" all count), order-the-steps, tap-the-spot-on-the-diagram, and **short clinical scenarios** ("83-year-old on apixaban falls and hits her head. Which factor is blocked and why does that matter?"). The first four mostly test recall; the fifth is where apply-level goals live, so it is built in Phase 1.

**Case scenarios.** Modules 1–3 end with 2–3 physiology-only mini-cases (what happens at a cut when platelets are low; what a clot looks like without factor VIII). From Module 4 on, each module ends with 2–3 integrated cases that pull from earlier modules: trauma patient inside the TXA window, elderly fall on apixaban, GI bleed on warfarin, stroke patient being screened for alteplase. Cases are their own goals.

**Misconceptions.** Each module carries goals that target what people get wrong about it, built with that module: the cascade is not two separate pathways in the body (Module 2); heparin does not dissolve existing clots (Module 3); TXA is an antifibrinolytic, not a procoagulant (Module 4); INR is not a reliable measure of DOAC effect, and a normal INR does not rule one out (Module 6); aspirin's effect lasts the platelet's life (7–10 days), not the drug's half-life (Module 6). Each gets a deliberately targeted quiz item.

## Content scope

Seven content modules in the order they are learned, each a self-contained data file. Claude Code writes the content from verified sources (see Accuracy rules), never from memory.

| Module | Covers | Must include |
| --- | --- | --- |
| 1. Primary hemostasis | Vessel injury, platelet adhesion, activation, aggregation | vWF, GPIb, GPIIb/IIIa, ADP, thromboxane A2, P2Y12 receptor, COX-1 |
| 2. Coagulation (cell-based model) | Initiation (tissue factor/VIIa), amplification (thrombin feedback), propagation (platelet surface); then the intrinsic/extrinsic/common Y diagram taught explicitly as the lab-test map | Factors I–XIII by number and common name, with the numbering quirks stated once: there is no factor VI (retired), III is tissue factor, IV is calcium. Phospholipid surface; cofactors V and VIII; thrombin's feedback loops. **Anchor goal:** the vitamin K-dependent group (II, VII, IX, X, protein C, protein S) as a factor reference map |
| 3. Regulation | The brakes | Antithrombin, protein C/S, TFPI; which factors each inhibits; why heparin needs antithrombin |
| 4. Fibrinolysis | Clot breakdown, and why trauma breaks it | Plasminogen, plasmin, tPA, PAI-1, D-dimer, alpha-2 antiplasmin; trauma-induced coagulopathy and the TXA time window |
| 5. Why people clot (indications) | What the drugs in module 6 are for | Virchow's triad; A-fib → stroke; DVT/PE; stents → dual antiplatelet therapy; pregnancy as a clot-prone state |
| 6. Drugs and their labs | Every v1 agent, with the lab that tracks it where one exists | v1: aspirin, clopidogrel, ticagrelor, prasugrel, warfarin (INR), unfractionated heparin (aPTT), enoxaparin (anti-Xa), apixaban and rivaroxaban (no routine lab; drug-specific anti-Xa only), dabigatran (no routine lab; aPTT/TT qualitative only), TXA, alteplase/tenecteplase (stroke and STEMI screening), vitamin K; one note card on NSAIDs and SSRIs raising bleeding risk. v2 (same file format, add later): protamine, idarucizumab, andexanet alfa, PCC/Kcentra, FFP, platelets, cryoprecipitate |
| 7. Disorders | What breaks, and what the labs show | Hemophilia A/B, vWD, vitamin K deficiency, liver disease, DIC, thrombocytopenia; postpartum hemorrhage + TXA; platelet count, fibrinogen, D-dimer; TEG/ROTEM overview only |

Each drug entry carries: generic name and **every common brand name as an alias** (Eliquis, Xarelto, Plavix, Brilinta, Effient, Coumadin, Lovenox, Pradaxa, Activase, TNKase), because that is what patients and med lists say; aliases work in search, fuzzy matching, flashcards, and scenarios. Then: target, mechanism in one sentence, indication (why the patient is on it), which lab tracks it ("none routinely" is a valid answer), reversal agent, half-life, **duration of effect (hours vs days)** as a separate field because for aspirin, the P2Y12 inhibitors, and warfarin the two differ, and an EMS note: bleeding risk, head-injury concern, **TXA relevance** (for most drugs this is simply "TXA does not reverse this drug"), **time of last dose and why it matters**, and a generic handoff line that defers to local and state protocol. Whether TXA is in BLS or ALS scope in Massachusetts is an ems-practice claim and must be sourced to the current Massachusetts Statewide Treatment Protocols, not asserted.

Each factor entry carries: Roman numeral, common name, what activates it, what it activates, required cofactors and ions, vitamin K-dependent (yes/no), where it sits in the cell-based model, where it sits on the lab-test map, and a plain-language "why this step exists" line. Reviewers check that every "why" line is mechanistically true, not just purpose-flavored.

## App screens and features

Four screens plus a search bar on every one of them. Everything works on a phone-width screen first; the builder gets more room on a laptop. Dark mode follows the phone's setting and can be forced on, because a white screen in a dark truck at 0300 is unusable.

**Search.** Type a drug (generic or brand), a factor, a lab, or any term and get its card in under 3 seconds. This is the on-shift use case: "patient says she's on Eliquis" → type it → lab, reversal, duration of effect, last-dose note. Search works offline and is never gated.

**1. Home.** Three numbers: goals Retained + Mastered / total, goals in Review, cards due today. One button: Study. Below it, the modules with each one's goal progress bar. Tapping a module shows its goals and their state (Locked / Pre-test pending / Available / In progress / Review / Mastered / Retained). A weekly one-line backup reminder appears here if no export has happened. On first visit, before any studying, the app shows how to install it (on iPhone: Share → Add to Home Screen, with a short walkthrough), because an installed app and the browser tab do not share saved progress on iOS.

**2. Learn (reference).** The interactive diagram, never gated. Tap any node to open its card. Toggle layers on and off in this order, which is the order things happen in the body: platelets → coagulation → regulators → fibrinolysis → drugs. A "lab-test map" toggle overlays the intrinsic/extrinsic/common view with a banner saying it is a test map, not physiology. A "why" button on every factor shows its plain-language reason for existing. Every card shows its sources, and any "simplified for EMT level" flag expands to show what was simplified and the fuller truth.

**3. Builder.** Blank canvas with a tray of pieces (factors, cofactors, ions, cells and surfaces, drugs, inhibitors). Drag pieces onto the canvas and draw arrows between them; must work with touch. Check button compares against the correct graph and highlights what's wrong, missing, or extra. Levels follow the cell-based model, each its own goal: initiation → amplification → propagation → full coagulation → + regulators → + fibrinolysis → + drugs. One optional level rebuilds the lab-test map, shown with the test-map banner.

**4. Study.** Two things run here:

- *Sessions are 5-minute chunks.* Every session, flashcards or quiz, can be dropped mid-question when a call comes in and resumes exactly where it left off. Nothing is ever lost or scored because the app was closed.
- *Flashcards with spaced repetition.* Every fact on every card becomes a flashcard (front: "What activates factor X?"; back: the answer plus a link to the diagram). Scheduling uses FSRS; cards you miss come back sooner. New cards are capped per day (default 10, adjustable in Settings). Due cards come first; after they hit zero, a **"keep going"** option offers extra new cards up to a second, higher cap, so a motivated day off isn't wasted.
- *Catch-up mode.* After a missed day or several, the app never shows "147 due." It spreads the overdue pile across the next several days (default 3, adjustable), shows today's share only, and says "catching up: 2 of 3 days."
- *Shift toggle.* One tap on Home marks today a shift day: new cards drop to zero, the review share shrinks to a settable minimum, and quizzes and retention checks are deferred without penalty.
- *Goal quizzes.* Pick an available goal, take its quiz, see the result and which questions you missed with a link to the relevant card. Quizzes can be practiced freely; practice does not touch flashcard scheduling.

**Daily load.** The spec's own estimate: factor and drug entries at roughly 9 fields each will produce 400–600+ flashcards, meaning 6–8 weeks of new cards at the default cap and daily reviews climbing toward 80–120 before quizzes. That is workable in chunks on a 12, not on a busy 16, which is why the shift toggle and catch-up mode are in Phase 1. Claude Code reports the real numbers after Phase 1 content is written.

Settings in v1: new-card cap, "keep going" cap, catch-up spread (days), shift-day review minimum, dark mode (auto / on), reset progress (with confirmation), export progress, import progress.

## Definitions on demand (glossary)

No on-ramp module. The content is taught as-is, and any term in it that Devin doesn't understand gets defined in place, at the moment he hits it, without pulling him into a side course. The rule for what gets defined: anything that appears in the content. The rule for what doesn't: anything that doesn't.

**How it works in the app**

- Every term that already has a verified glossary entry is subtly marked (dotted underline). Tap or hover shows the definition in a small popover; the popover never leaves the current screen.
- Any other word or phrase can be highlighted; a **Define** button appears. Tapping it does two things at once: it shows something *right now*, and it queues the term for a verified definition.
- **Right now:** the app shows the related node card if the term belongs to one, otherwise a short definition clearly labeled "Unverified: written by the app, not yet reviewed" plus a link to the StatPearls or DailyMed search for the term. This is the one place unreviewed text is allowed in the app, and it is always labeled.
- **Later:** the verified entry replaces the unverified one on the next sync, and the term becomes marked everywhere it appears, including in flashcards and quizzes. The popover says "Verified" and shows its sources.
- A glossary entry has one job: make the sentence it appears in understandable. It is 1–3 sentences at EMT level, says why the term matters here, and links to the node it belongs to if there is one. It does not become its own module and does not get its own goals or flashcards.
- The app logs every glossary tap. A term tapped 3 or more times is flagged in the review log as a sign it belongs in the teaching content itself, not in a popover.

**How verified definitions get written**

The app is static and offline, so nothing leaves the phone until Devin syncs. The define list travels inside the normal progress export, so he never handles a separate file:

1. Devin exports progress (the same one-tap export used for backup) and hands the file to Claude Code, or Claude Code reads it from the repo if he committed it there.
2. Claude Code writes each queued definition from sources of the right kind (see Accuracy rules), with at least 2 cited.
3. The three reviewer agents check it: factually correct, citations real and relevant, pitched at EMT level, no longer than it needs to be.
4. The entry lands in `glossary.json` and ships with the next push. The app's message after tapping Define is honest about this: "Saved to your define list. A verified definition arrives next time you sync with Claude Code."

**Guaranteed pre-seeds.** A learner can only tap words he knows he doesn't know. Five concepts a no-biochem learner reads straight past without noticing are defined before Module 1 ships, no reviewer judgment involved: enzyme vs substrate; zymogen (an inactive precursor); the "a" suffix meaning activated (X → Xa); cofactor; and calcium as the bridge that holds factors onto the phospholipid surface. Beyond those five, reviewer 2 (EMT instructor) flags every other term in each module that an EMT-B would not already know, and those get entries before the module ships. This is not pre-teaching: nothing is shown until it is tapped.

**Scope guard.** A definition that would itself need three more definitions to make sense is a sign the term is out of scope. The writer trims it to what the current sentence needs and notes the omission in the review log.

## Content data model

All content lives in plain JSON files under `/content/`, one per module, so a module can be added, edited, or re-validated without touching app code. The app loads whatever files are present.

| File | Holds | Key fields |
| --- | --- | --- |
| `nodes.json` | Every factor, cofactor, ion, inhibitor, drug, and lab as a graph node | id, type (factor / cofactor / ion / inhibitor / drug / lab / receptor / mediator / enzyme / cell-or-surface), numeral, common name, cell-based-model stage, lab-map pathway, vitamin K-dependent, why-this-step, indication, EMS note, diagram coordinates per layer, claims\[\] |
| `edges.json` | Every arrow | from, to, relation (activates / inhibits / requires / cleaves / tracks), label, layer |
| `goals.json` | Knowledge goals | id, module, title (verb + concept), level (recall / explain / apply), kind (standard / case / misconception / builder / pretest), prerequisites\[\], node ids covered |
| `questions.json` | Quiz questions | id, goal id, type (mc / fill / order / locate / scenario), variants\[\] (each: prompt, answer, accepted answers for fuzzy match, distractors, explanation), source node id |
| `cards.json` | Flashcards, generated from nodes at build time | id, node id, front, back |
| glossary.json | On-demand definitions for terms in the content | term, aliases\[\], definition (1–3 sentences, EMT level), why-it-matters-here, linked node id (optional), claims\[\] with sources and review, requested-by (pre-seed / Devin), date added |

Progress lives separately in the browser (see Tech stack) and never mixes with content, so updating content never wipes progress. The one exception is deliberate: when a claim is corrected, the content build lists the affected node ids, and the app drops every goal covering them to Review on next load.

**Claims, not blanket sources.** Every factual statement on a node or question is a `claim` object: `text`, `kind` (physiology / drug / ems-practice), `sources[]` (at least 2, each with title, URL, accessed date, and the exact passage relied on), and `review` (each reviewer's verdict plus whether they confirmed the citation exists and says what it's cited for). A simplified claim also carries `simplified: {what, fuller_truth}`.

## Tech stack and constraints

A static web app with no backend, deployed to GitHub Pages (free, one push to deploy, works on any phone or PC via a URL). Claude Code picks the framework within the constraints below; lightweight options (vanilla, Preact, Svelte) are preferred because the phone is the realistic study device.

- **Deployment:** `git push` to `main` deploys via a GitHub Actions workflow. No servers, no accounts, no monthly cost.
- **Runs anywhere:** responsive layout, phone-first. Installable as a PWA (home-screen icon, works offline after first load). The app prompts to install on first visit, because iOS Safari can evict storage from uninstalled sites after about 7 days of non-use.
- **Progress storage:** IndexedDB (not localStorage). The app calls `navigator.storage.persist()` on first launch. Every answer, card review, and builder attempt is written the moment it happens, never on a timer or on page close. A refresh, closed tab, or dead battery mid-quiz loses nothing.
- **Backup:** export progress to a JSON file and import it back. Home shows a one-line reminder after 7 days without an export, and offers one-tap export after each goal reaches Mastered.
- **Speed:** first load under 2 seconds on a phone; every tap responds instantly (no network calls after load). Content JSON is bundled at build time.
- **Diagram and builder:** SVG, not canvas, so nodes are tappable and text stays sharp. Drag-and-drop must work with touch; this is a hard requirement, tested on an actual phone before a phase is called done.
- **Spaced repetition:** ts-fsrs, not a hand-rolled scheduler.
- **No frameworks that need a server** (no server routes, no databases).
- **Tests:** fail the build if an edge references a missing node, if any claim has fewer than 2 sources, if any module lacks goals at all three levels, or if any question has fewer than 3 variants.

## Build phases

Build one thin slice all the way through before widening. Content-format problems (missing diagram coordinates, vague goals, questions that don't fit a type) only show up once content is rendered and used, and fixing them across seven modules is expensive. Stop and show Devin after each phase, with a daily-load estimate (new cards per day, reviews per day, minutes per day) so he can check the pace against his shift schedule.

1. **Vertical slice: Module 1 only.** Write and validate primary-hemostasis content (nodes, edges, goals, questions, cards, pre-seeded glossary, mini-cases, misconception goals). Build Home, search, Learn (platelets layer only), Study (flashcards and goal quizzes, all five question types including scenarios, 5-minute resumable sessions, catch-up mode, shift toggle), the Define button with its unverified-now / verified-later flow, IndexedDB, dark mode, the install walkthrough, export/import, and the 30/90-day retention checks. Deploy to GitHub Pages. Devin uses it for a few days and reports what's wrong before anything else is built.
2. **Fix the format, then Module 2 (coagulation).** Apply whatever the slice taught about content shape, then write and validate the cell-based model, the lab-test map, the factor reference map, and Module 2's misconception goals. Add the coagulation layer to the diagram.
3. **Modules 3–4 (regulation, fibrinolysis).** Content, their misconceptions, their diagram layers, and the first integrated cases (Module 4). This is the minimum useful app: the full physiology, learnable and drillable.
4. **Builder.** The drag-and-drop canvas with its levels as goals. Touch-tested on a phone.
5. **Modules 5–6 (indications, drugs and labs).** Content, the drugs layer, their misconceptions and integrated cases.
6. **Module 7 (disorders)** with its cases.
7. **v2 drugs.** Reversal agents and blood products: content files only, no app changes.

## Accuracy and sourcing rules

No content ships unless every factual claim was written from sources that match the kind of claim, and was checked by three independent reviewer agents. This section is non-negotiable.

**Sources match the claim.** An EMS protocol cannot verify physiology, and a physiology textbook says nothing about what to do on scene. Each claim needs at least two independent sources of the right kind, each one actually opened, with the passage relied on recorded. Open-access sources come first, because an agent told to "open" a paywalled book will either fail or invent the passage it claims to have read:

| Claim kind | Acceptable sources, in order of preference |
| --- | --- |
| Physiology | StatPearls (NCBI Bookshelf), OpenStax Anatomy & Physiology, full-text reviews on PubMed Central (Hoffman & Monroe on the cell-based model, or equivalent); then Guyton & Hall or Costanzo via excerpts Devin supplies |
| Drug mechanism, labs, reversal | DailyMed (FDA labels), StatPearls, PubMed Central reviews; then Lexicomp or a pharmacology textbook via excerpts Devin supplies |
| EMS practice | Massachusetts Statewide Treatment Protocols (current edition, mass.gov), NREMT or NAEMT material, peer-reviewed EMS sources |

Content written from memory is not allowed. A paywalled source may be cited only when its passage is on file as a supplied excerpt. Any claim without two conforming sources is rejected at review.

**Validation.** After each module is drafted, Claude Code spawns three separate subagents that have not seen the drafting conversation. Each gets the drafted content, the source excerpts, and a claim-by-claim checklist, so it verifies rather than free-associates. Each returns, per claim: *approve*, *factual error* (with the correction and its source), *citation problem* (source missing, doesn't exist, or doesn't say what it's cited for), or *style* (wording, level, clarity). Run these on Opus or Haiku, not Fable; this is checking, not deep reasoning.

| Reviewer | Persona | Checks for |
| --- | --- | --- |
| 1 | College physiology professor | Mechanistic correctness: does each arrow, cofactor, and "why this step exists" line match the cell-based model? Is the lab-test map labeled as a map? |
| 2 | EMT instructor | Is it pitched at EMT-B level, explained from first principles, free of undefined jargon? Do goals follow the verb + concept template with all three levels present? Are the EMS notes what a street medic actually needs? |
| 3 | Emergency physician | Clinical correctness: drug mechanisms, indications, reversal agents, lab effects, last-dose timing, bleeding-risk notes, anything dangerous if wrong |

**Resolution.** Shipping is blocked only by *factual error* and *citation problem* flags. *Style* flags are applied if the writer agrees and logged either way. A fix is re-reviewed by the reviewer who raised it, for that claim only, not the whole module. Disagreements between reviewers are settled by opening the cited source; anything still unresolved is escalated to Devin with both positions. Every flag and its resolution is logged in `/content/review-log.md`; reading why reviewers disagreed is itself good study material.

**Simplification rule.** "True but incomplete" is allowed and flagged; "false but easier" is never allowed. "Intrinsic and extrinsic are separate pathways in the body" is false, not simplified. Every flagged simplification expands in the app to show what was left out and the fuller truth.

## Terms used in this spec

For reading the spec itself, not for the app.

| Term | Meaning here |
| --- | --- |
| FSRS | A spaced-repetition scheduling algorithm (the thing that decides when a flashcard comes back); a modern replacement for the one Anki used for years |
| PWA | Progressive web app: a website that installs to your home screen and works offline |
| IndexedDB | The browser's built-in local database, where progress is saved |
| SVG | A drawing format where every shape is a separate object, so each factor on the diagram can be tapped |
| Nodes and edges | Graph language: a node is a thing on the diagram (a factor, a drug), an edge is an arrow between two things |
| Cofactor | A helper that a factor needs alongside it to work; V and VIII are the main ones here |
| Cleaves | Cuts. Thrombin cleaves fibrinogen into fibrin |
| Phospholipid surface | The outer membrane of an activated platelet, where most of the cascade actually assembles |
| Anti-Xa | A blood test that measures how much factor Xa is being blocked; used for enoxaparin and, with drug-specific calibration, for DOACs |
| TT | Thrombin time, a lab that is prolonged by dabigatran |
| TEG/ROTEM | Whole-blood clotting tests that show clot formation and breakdown as a curve; hospital-side only |
| Fable / Opus / Haiku | Anthropic model names. Reviewers run on the cheaper models because checking is simpler than drafting |
