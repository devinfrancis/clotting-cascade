// Builds and grades quiz attempts. Modes: graded, practice, pretest, retention, recheck.
import { questionsForGoal, questionById, goalById, nodeById } from './content.js';
import { getMeta, setMeta, getSession, saveSession, clearSession, logAttempt, logOverride } from './store.js';
import { matches } from './match.js';
import { db } from './db.js';

const DAY_MS = 86_400_000;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Graded attempts draw the variant seen least recently; practice picks at random.
async function pickVariant(q, mode) {
  const seen = (await getMeta(`seen:${q.id}`)) || {};
  if (mode === 'practice') return Math.floor(Math.random() * q.variants.length);
  let best = 0;
  for (let i = 1; i < q.variants.length; i++) {
    if ((seen[i] || '') < (seen[best] || '')) best = i;
  }
  return best;
}

export async function markSeen(qid, variant) {
  const seen = (await getMeta(`seen:${qid}`)) || {};
  seen[variant] = new Date().toISOString();
  await setMeta(`seen:${qid}`, seen);
}

async function buildItem(q, mode) {
  const variant = await pickVariant(q, mode);
  const v = q.variants[variant];
  const item = { qid: q.id, variant };
  if (q.type === 'mc' || q.type === 'scenario') {
    item.options = shuffle([v.answer, ...v.distractors]);
    if (mode === 'pretest') item.options.push("I don't know");
  }
  if (q.type === 'order') item.options = shuffle(v.answer);
  return item;
}

// Retention checks run cold: no diagram, so "locate" items are left out.
export async function buildAttempt(goalId, mode) {
  let qs;
  if (mode === 'pretest') {
    qs = goalById[goalId].draws.map((gid) => questionsForGoal(gid)[0]).filter(Boolean);
  } else {
    qs = questionsForGoal(goalId);
    if (mode === 'retention' || mode === 'recheck') qs = qs.filter((q) => q.type !== 'locate');
    if (mode === 'recheck') qs = [qs[Math.floor(Math.random() * qs.length)]];
  }
  const items = [];
  for (const q of qs) items.push(await buildItem(q, mode));
  return { goal: goalId, mode, items, index: 0, answers: [], startedAt: new Date().toISOString() };
}

export const sessionKey = (goalId, mode) => `quiz:${mode}:${goalId}`;

// An interrupted attempt resumes exactly where it was for 24 hours, then is discarded (never scored).
export async function resumeOrBuild(goalId, mode, extra = {}) {
  const key = sessionKey(goalId, mode);
  const s = await getSession(key);
  if (s && Date.now() - new Date(s.startedAt).getTime() < DAY_MS && s.index < s.items.length) return s;
  if (s) await clearSession(key);
  const fresh = { ...(await buildAttempt(goalId, mode)), ...extra };
  await saveSession(key, fresh);
  return fresh;
}

export async function pendingAttempts() {
  const out = [];
  for (const k of await (await db()).getAllKeys('sessions')) {
    if (!String(k).startsWith('quiz:')) continue;
    const s = await getSession(k);
    if (Date.now() - new Date(s.startedAt).getTime() < DAY_MS && s.index < s.items.length) out.push(s);
  }
  return out;
}

export function variantOf(item) {
  const q = questionById[item.qid];
  return { q, v: q.variants[item.variant] };
}

// Any alias of the answer's node also counts (brand names, abbreviations).
function acceptedFor(q, v) {
  const list = [v.answer, ...(v.accepted || [])];
  const node = Object.values(nodeById).find((n) => [n.id, n.name, ...(n.aliases || [])].some((a) => a.toLowerCase() === String(v.answer).toLowerCase()));
  if (node) list.push(node.name, ...(node.aliases || []));
  return list;
}

export function grade(item, given) {
  const { q, v } = variantOf(item);
  if (given === "I don't know") return false;
  switch (q.type) {
    case 'mc':
    case 'scenario':
      return given === v.answer;
    case 'fill':
      return matches(given, acceptedFor(q, v));
    case 'order':
      return Array.isArray(given) && given.length === v.answer.length && given.every((x, i) => x === v.answer[i]);
    case 'locate':
      return given === v.answer;
    default:
      return false;
  }
}

// Each answer is written the moment it is given.
export async function answer(session, given) {
  const item = session.items[session.index];
  const correct = grade(item, given);
  await logAttempt({ goal: session.goal, mode: session.mode, qid: item.qid, variant: item.variant, given, correct, at: new Date().toISOString() });
  await markSeen(item.qid, item.variant);
  const next = { ...session, answers: [...session.answers, { qid: item.qid, variant: item.variant, given, correct }] };
  await saveSession(sessionKey(session.goal, session.mode), next);
  return { session: next, correct };
}

// "I was right" for a typed answer marked wrong (typos). Logged quietly for the export.
export async function overrideLast(session) {
  const last = session.answers[session.answers.length - 1];
  await logOverride({ goal: session.goal, mode: session.mode, qid: last.qid, variant: last.variant, given: last.given, at: new Date().toISOString() });
  const answers = [...session.answers.slice(0, -1), { ...last, correct: true, overridden: true }];
  const next = { ...session, answers };
  await saveSession(sessionKey(session.goal, session.mode), next);
  return next;
}

export async function advance(session) {
  const next = { ...session, index: session.index + 1 };
  if (next.index >= next.items.length) await clearSession(sessionKey(session.goal, session.mode));
  else await saveSession(sessionKey(session.goal, session.mode), next);
  return next;
}
