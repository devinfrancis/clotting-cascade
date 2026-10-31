// Loads every content file present under /content at build time. Adding a module folder
// (content/m2/...) needs no app change.
import sourceIndex from '../content/sources/index.json';
import corrections from '../content/corrections.json';

const MODULE_TITLES = {
  1: 'Primary hemostasis',
  2: 'Coagulation (cell-based model)',
  3: 'Regulation',
  4: 'Fibrinolysis',
  5: 'Why people clot',
  6: 'Drugs and their labs',
  7: 'Disorders'
};

const files = import.meta.glob('../content/m*/*.json', { eager: true, import: 'default' });

function collect(name) {
  return Object.entries(files)
    .filter(([path]) => path.endsWith(`/${name}.json`))
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .flatMap(([, data]) => data);
}

export const nodes = collect('nodes');
export const edges = collect('edges');
export const goals = collect('goals');
export const questions = collect('questions');
export const cards = collect('cards');
export const glossary = collect('glossary');
export const sources = Object.fromEntries(sourceIndex.map((s) => [s.id, s]));
export { corrections };

export const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));
export const goalById = Object.fromEntries(goals.map((g) => [g.id, g]));
export const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));
export const cardById = Object.fromEntries(cards.map((c) => [c.id, c]));

export const lessons = collect('lesson');

export const claimById = {};
for (const n of nodes) for (const c of n.claims) claimById[c.id] = { ...c, node: n.id };
for (const g of glossary) for (const c of g.claims) claimById[c.id] = { ...c, node: g.node, term: g.term };

export const modules = [...new Set(goals.map((g) => g.module))].sort((a, b) => a - b).map((m) => ({
  id: m,
  title: MODULE_TITLES[m] || `Module ${m}`,
  goals: goals.filter((g) => g.module === m && g.kind !== 'pretest'),
  pretest: goals.find((g) => g.module === m && g.kind === 'pretest')
}));

// Knowledge goals only (the pre-test is not a goal you master).
export const knowledgeGoals = goals.filter((g) => g.kind !== 'pretest');

export function questionsForGoal(goalId) {
  return questions.filter((q) => q.goal === goalId);
}

// Every flashcard is tied to the goals that cover its node.
export function goalsForNode(nodeId) {
  return knowledgeGoals.filter((g) => g.nodes.includes(nodeId));
}
export function goalsForCard(card) {
  return goalsForNode(card.node);
}

// Strip [[term]] / [[shown|term]] markup to plain text.
export function plain(text) {
  return text.replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1');
}
