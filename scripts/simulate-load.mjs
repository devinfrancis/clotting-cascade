// Projects daily flashcard load with ts-fsrs defaults for the cards that actually exist.
// Assumptions are printed with the results so LOAD.md can quote them.
import { readFileSync, readdirSync } from 'node:fs';
import { fsrs, generatorParameters, createEmptyCard, Rating, State } from 'ts-fsrs';

const cards = readdirSync('content').filter((d) => /^m\d+$/.test(d)).flatMap((m) => JSON.parse(readFileSync(`content/${m}/cards.json`, 'utf8')));
const NEW_CAP = Number(process.argv[2] || 10);
const DAYS = 60;
const RUNS = 200;
// Answer mix: first sight of a new card is harder than a review of a known one.
const MIX_NEW = { again: 0.25, hard: 0.15, good: 0.55, easy: 0.05 };
const MIX_REVIEW = { again: 0.1, hard: 0.1, good: 0.72, easy: 0.08 };

function pick(mix, r) {
  if (r < mix.again) return Rating.Again;
  if (r < mix.again + mix.hard) return Rating.Hard;
  if (r < mix.again + mix.hard + mix.good) return Rating.Good;
  return Rating.Easy;
}

const f = fsrs(generatorParameters({ enable_fuzz: true }));
const totals = Array.from({ length: DAYS }, () => ({ reviews: 0, answers: 0, fresh: 0 }));
let lastNewDaySum = 0;

for (let run = 0; run < RUNS; run++) {
  const start = new Date(2026, 10, 1, 8);
  const deck = [];
  let introduced = 0;
  let lastNewDay = 0;
  for (let day = 0; day < DAYS; day++) {
    const now = new Date(start.getTime() + day * 86_400_000);
    const end = new Date(now.getTime() + 86_400_000);
    let reviews = 0;
    let answers = 0;
    // Reviews due today (including same-day relearning steps).
    for (let pass = 0; pass < 6; pass++) {
      for (const c of deck) {
        if (c.due < end && (pass === 0 ? c.state === State.Review : c.state !== State.Review && c.state !== State.New)) {
          const r = pick(MIX_REVIEW, Math.random());
          if (pass === 0) reviews++;
          answers++;
          Object.assign(c, f.next(c, c.due < now ? now : c.due, r).card);
        }
      }
    }
    const fresh = Math.min(NEW_CAP, cards.length - introduced);
    for (let i = 0; i < fresh; i++) {
      let c = createEmptyCard(now);
      c = f.next(c, now, pick(MIX_NEW, Math.random())).card;
      answers++;
      // Learning steps the same day until it graduates or the day ends.
      for (let k = 0; k < 4 && c.state !== State.Review && c.due < end; k++) {
        c = f.next(c, c.due, pick(MIX_REVIEW, Math.random())).card;
        answers++;
      }
      deck.push(c);
      introduced++;
    }
    if (fresh) lastNewDay = day;
    totals[day].reviews += reviews;
    totals[day].answers += answers;
    totals[day].fresh += fresh;
  }
  lastNewDaySum += lastNewDay;
}

const avg = totals.map((t) => ({ reviews: t.reviews / RUNS, answers: t.answers / RUNS, fresh: t.fresh / RUNS }));
const week = (w) => {
  const days = avg.slice((w - 1) * 7, w * 7);
  const m = (k) => (days.reduce((s, d) => s + d[k], 0) / days.length).toFixed(1);
  return { reviews: m('reviews'), answers: m('answers'), fresh: m('fresh') };
};
console.log(JSON.stringify({ cards: cards.length, newCap: NEW_CAP, lastNewDay: (lastNewDaySum / RUNS).toFixed(1), week1: week(1), week2: week(2), week4: week(4), week8: week(8), mixNew: MIX_NEW, mixReview: MIX_REVIEW }, null, 1));
