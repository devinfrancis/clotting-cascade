// Goal states and the graded-quiz schedule.
// Locked → Available → In progress (1–2 graded passes) → Mastered (3) → Retained (90-day check passed).
// Review is the fallback from Mastered/Retained (re-check fail, retention fail, or a corrected claim).
import { get, put, all } from './db.js';
import { goalById, knowledgeGoals, corrections, modules } from './content.js';
import { dayKey, addDays, daysBetween } from './day.js';
import { getMeta, setMeta, isShiftDay } from './store.js';

// Spacing between graded passes: pass 2 at least 2 days after pass 1, pass 3 at least 6 days after pass 2.
const GAP_AFTER_PASS = [2, 6];

export const STATE_LABEL = {
  locked: 'Locked',
  'pretest-pending': 'Pre-test pending',
  available: 'Available',
  'in-progress': 'In progress',
  review: 'Review',
  mastered: 'Mastered',
  retained: 'Retained'
};

const blank = () => ({ passes: [], lastGradedDay: null, nextGradedFrom: null, masteredOn: null, check30: null, check90: null, review: null, misses: [], recheckPending: false });

export async function getGoal(id) {
  return { ...blank(), ...(await get('goals', id)) };
}
const saveGoal = (id, g) => put('goals', g, id);

export async function allGoalProgress() {
  const out = {};
  for (const g of knowledgeGoals) out[g.id] = await getGoal(g.id);
  return out;
}

export async function pretestStatus(moduleId) {
  return getMeta(`pretest:${moduleId}`);
}

export function goalState(goal, p, progress, pretest) {
  if (p.review) return 'review';
  if (p.passes.length >= 3) return p.check90 === 'passed' ? 'retained' : 'mastered';
  if (p.passes.length >= 1) return 'in-progress';
  // Prerequisites gate quizzes only: each prerequisite needs at least one graded pass.
  const unlocked = goal.prerequisites.every((pid) => (progress[pid]?.passes.length || 0) >= 1);
  if (!unlocked) return 'locked';
  return pretest ? 'available' : 'pretest-pending';
}

export async function goalStates() {
  const progress = await allGoalProgress();
  const pre = {};
  for (const m of modules) pre[m.id] = await pretestStatus(m.id);
  const out = {};
  for (const g of knowledgeGoals) out[g.id] = goalState(g, progress[g.id], progress, pre[g.module]);
  return { states: out, progress };
}

// A graded attempt can be taken today if the goal is open, not already graded today,
// its scheduled day has arrived, and today isn't a shift day.
export function gradedOpenToday(state, p, today = dayKey(), shift = false) {
  if (shift) return false;
  if (state === 'locked' || state === 'mastered' || state === 'retained') return false;
  if (p.lastGradedDay === today) return false;
  return !p.nextGradedFrom || p.nextGradedFrom <= today;
}

// Quizzes the app has scheduled for today (Home's "quizzes due"): goals already started.
export async function quizzesDue() {
  const { states, progress } = await goalStates();
  const shift = await isShiftDay();
  return knowledgeGoals.filter((g) => (states[g.id] === 'in-progress' || states[g.id] === 'review') && gradedOpenToday(states[g.id], progress[g.id], dayKey(), shift));
}

export async function retentionDue() {
  if (await isShiftDay()) return [];
  const { states, progress } = await goalStates();
  const today = dayKey();
  const out = [];
  for (const g of knowledgeGoals) {
    const p = progress[g.id];
    if (!(states[g.id] === 'mastered' || states[g.id] === 'retained') || !p.masteredOn) continue;
    if (!p.check30 && daysBetween(p.masteredOn, today) >= 30) out.push({ goal: g, which: 30 });
    else if (p.check30 === 'passed' && !p.check90 && daysBetween(p.masteredOn, today) >= 90) out.push({ goal: g, which: 90 });
  }
  return out;
}

export async function rechecksDue() {
  if (await isShiftDay()) return [];
  const progress = await allGoalProgress();
  return knowledgeGoals.filter((g) => progress[g.id].recheckPending);
}

// Returns { mastered: true } when this pass made the goal Mastered (Home offers an export then).
export async function recordGraded(goalId, passed) {
  const today = dayKey();
  const p = await getGoal(goalId);
  p.lastGradedDay = today;
  let mastered = false;
  if (!passed) {
    // A miss keeps earlier passes; the next graded attempt opens tomorrow.
    p.nextGradedFrom = addDays(today, 1);
  } else if (p.review) {
    // Passing from Review restores the goal; retention checks restart from today.
    p.review = null;
    if (p.passes.length >= 3) { p.masteredOn = today; p.check30 = null; p.check90 = null; mastered = true; }
    p.nextGradedFrom = addDays(today, 1);
  } else {
    p.passes.push(today);
    if (p.passes.length >= 3) { p.masteredOn = today; mastered = true; p.nextGradedFrom = null; }
    else p.nextGradedFrom = addDays(today, GAP_AFTER_PASS[p.passes.length - 1]);
  }
  await saveGoal(goalId, p);
  return { mastered };
}

export async function recordRetention(goalId, which, passed) {
  const p = await getGoal(goalId);
  if (passed) {
    if (which === 30) p.check30 = 'passed'; else p.check90 = 'passed';
  } else {
    p.review = { reason: `Missed the ${which}-day retention check`, at: dayKey() };
  }
  await saveGoal(goalId, p);
}

// Two missed flashcards tied to a Mastered/Retained goal within 14 days trigger a one-question re-check.
export async function recordCardMiss(goalId) {
  const p = await getGoal(goalId);
  if (p.passes.length < 3 || p.review) return;
  const today = dayKey();
  p.misses = [...p.misses.filter((d) => daysBetween(d, today) < 14), today];
  if (p.misses.length >= 2) p.recheckPending = true;
  await saveGoal(goalId, p);
}

export async function recordRecheck(goalId, passed) {
  const p = await getGoal(goalId);
  p.recheckPending = false;
  p.misses = [];
  if (!passed) p.review = { reason: 'Missed the re-check triggered by 2 missed flashcards', at: dayKey() };
  await saveGoal(goalId, p);
}

// When a claim is corrected after review, every started goal covering that node drops to Review
// with a one-line note saying what changed.
export async function applyCorrections() {
  const applied = (await getMeta('appliedCorrections')) || [];
  for (const c of corrections) {
    if (applied.includes(c.id)) continue;
    for (const g of knowledgeGoals.filter((g) => g.nodes.some((n) => c.nodes.includes(n)))) {
      const p = await getGoal(g.id);
      if (p.passes.length === 0) continue;
      p.review = { reason: `Content corrected: ${c.note}`, at: dayKey() };
      await saveGoal(g.id, p);
    }
    applied.push(c.id);
  }
  await setMeta('appliedCorrections', applied);
}

export async function setPretest(moduleId, result) {
  await setMeta(`pretest:${moduleId}`, { ...result, at: new Date().toISOString() });
}

export { goalById };
