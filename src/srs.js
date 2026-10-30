// Flashcard scheduling: ts-fsrs decides intervals; this file decides how many cards today.
import { fsrs, generatorParameters, createEmptyCard, Rating, State } from 'ts-fsrs';
import { all, get, put } from './db.js';
import { cards as allCards, goalsForCard } from './content.js';
import { dayKey, dayStart, endOfDay, daysBetween } from './day.js';
import { getSettings, getMeta, setMeta, isShiftDay, logReview } from './store.js';
import { recordCardMiss } from './goals.js';

export { Rating };
const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

function revive(c) {
  return { ...c, due: new Date(c.due), last_review: c.last_review ? new Date(c.last_review) : undefined };
}

// Today's plan is fixed the first time the day is opened, so the numbers don't jump around.
// Shift toggles and settings changes recompute it.
export async function todayPlan({ recompute = false } = {}) {
  const today = dayKey();
  let plan = await getMeta(`plan:${today}`);
  if (plan && !recompute) return plan;

  const settings = await getSettings();
  const shift = await isShiftDay();
  const states = await all('cards');
  const dueNow = states.filter((s) => s.card.state === State.Review && new Date(s.card.due) < endOfDay(today)).length;
  const reviewsDone = (await getMeta(`reviewsDone:${today}`)) || 0;
  const pileAtStart = plan?.pileAtStart ?? dueNow + reviewsDone;

  // Catch-up: after one or more missed days, spread the overdue pile instead of showing it all.
  let catchup = await getMeta('catchup');
  const lastActive = await getMeta('lastActiveDay');
  const overdue = states.filter((s) => s.card.state === State.Review && new Date(s.card.due) < dayStart(today)).length;
  if (!plan && lastActive && daysBetween(lastActive, today) >= 2 && overdue > 0) {
    catchup = { startDay: today, days: settings.catchupDays };
    await setMeta('catchup', catchup);
  }
  let catchupInfo = null;
  let reviewQuota = pileAtStart;
  if (catchup) {
    const k = daysBetween(catchup.startDay, today);
    if (k < catchup.days) {
      reviewQuota = Math.ceil(pileAtStart / (catchup.days - k));
      catchupInfo = { day: k + 1, of: catchup.days };
    } else {
      await setMeta('catchup', null);
    }
  }

  let newQuota = settings.newCap;
  if (shift) {
    newQuota = 0;
    reviewQuota = Math.min(reviewQuota, settings.shiftReviewMin);
  }
  plan = { day: today, pileAtStart, reviewQuota, newQuota, keepGoingCap: settings.keepGoingCap, catchup: catchupInfo, shift };
  await setMeta(`plan:${today}`, plan);
  return plan;
}

export async function todayCounts() {
  const today = dayKey();
  const plan = await todayPlan();
  const reviewsDone = (await getMeta(`reviewsDone:${today}`)) || 0;
  const newDone = (await getMeta(`newDone:${today}`)) || 0;
  const keepGoing = (await getMeta(`keepGoing:${today}`)) || false;
  const states = await all('cards');
  const learningDue = states.filter((s) => (s.card.state === State.Learning || s.card.state === State.Relearning)).length;
  const dueReviews = states.filter((s) => s.card.state === State.Review && new Date(s.card.due) < endOfDay(today)).length;
  const reviewsLeft = Math.min(Math.max(0, plan.reviewQuota - reviewsDone), dueReviews);
  const unseen = allCards.length - states.length;
  const newCap = keepGoing ? plan.keepGoingCap : plan.newQuota;
  const newLeft = Math.min(Math.max(0, newCap - newDone), unseen);
  return { plan, reviewsDone, newDone, reviewsLeft, newLeft, learningDue, unseen, keepGoing, dueToday: reviewsLeft + newLeft + learningDue };
}

// Pick the next card: learning steps that are due, then today's share of reviews, then new cards.
export async function nextCard(excludeId) {
  const now = new Date();
  const counts = await todayCounts();
  const states = await all('cards');
  const byId = Object.fromEntries(states.map((s) => [s.id, s]));

  const learning = states
    .filter((s) => (s.card.state === State.Learning || s.card.state === State.Relearning) && s.id !== excludeId)
    .sort((a, b) => new Date(a.card.due) - new Date(b.card.due));
  if (learning.length && new Date(learning[0].card.due) <= now) return learning[0].id;

  if (counts.reviewsLeft > 0) {
    const due = states
      .filter((s) => s.card.state === State.Review && new Date(s.card.due) < endOfDay() && s.id !== excludeId)
      .sort((a, b) => new Date(a.card.due) - new Date(b.card.due));
    if (due.length) return due[0].id;
  }
  if (counts.newLeft > 0) {
    const fresh = allCards.find((c) => !byId[c.id] && c.id !== excludeId);
    if (fresh) return fresh.id;
  }
  // Learning cards not yet due come back at the end rather than leaving the session empty-handed.
  if (learning.length) return learning[0].id;
  return null;
}

export async function cardState(id) {
  const s = await get('cards', id);
  return s ? revive(s.card) : createEmptyCard(new Date());
}

export function previewIntervals(card) {
  const now = new Date();
  const out = {};
  for (const r of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy]) out[r] = scheduler.next(card, now, r).card.due;
  return out;
}

export async function rateCard(id, rating) {
  const today = dayKey();
  const now = new Date();
  const prev = await cardState(id);
  const { card, log } = scheduler.next(prev, now, rating);
  const existing = await get('cards', id);
  await put('cards', { id, card, introducedDay: existing?.introducedDay || today }, id);
  await logReview({ card: id, rating, at: now.toISOString(), prevState: prev.state, state: card.state, due: card.due.toISOString(), elapsed_days: log.elapsed_days });
  if (prev.state === State.New) await setMeta(`newDone:${today}`, ((await getMeta(`newDone:${today}`)) || 0) + 1);
  if (prev.state === State.Review) await setMeta(`reviewsDone:${today}`, ((await getMeta(`reviewsDone:${today}`)) || 0) + 1);
  await setMeta('lastActiveDay', today);
  if (rating === Rating.Again) {
    const c = allCards.find((x) => x.id === id);
    for (const g of goalsForCard(c)) await recordCardMiss(g.id);
  }
  return card;
}

export async function startKeepGoing() {
  await setMeta(`keepGoing:${dayKey()}`, true);
}
