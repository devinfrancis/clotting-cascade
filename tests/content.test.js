// Build gates: `npm run build` runs these first, and any failure blocks the deploy.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const load = (p) => JSON.parse(readFileSync(p, 'utf8'));
const modules = readdirSync('content').filter((d) => /^m\d+$/.test(d));
const read = (name) => modules.flatMap((m) => (existsSync(`content/${m}/${name}.json`) ? load(`content/${m}/${name}.json`) : []));

const sources = Object.fromEntries(load('content/sources/index.json').map((s) => [s.id, s]));
const nodes = read('nodes');
const edges = read('edges');
const goals = read('goals');
const questions = read('questions');
const cards = read('cards');
const glossary = read('glossary');
const nodeIds = new Set(nodes.map((n) => n.id));
const goalIds = new Set(goals.map((g) => g.id));
const claims = [...nodes.flatMap((n) => n.claims), ...glossary.flatMap((g) => g.claims)];
const claimIds = new Set(claims.map((c) => c.id));

const glossaryKeys = new Set(glossary.flatMap((g) => [g.term, ...(g.aliases || [])]).map((t) => t.toLowerCase()));
function glossaryRefs(text) {
  return [...String(text).matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)].map((m) => (m[2] || m[1]).trim());
}

describe('required build gates (spec)', () => {
  it('every edge references existing nodes', () => {
    const bad = edges.filter((e) => !nodeIds.has(e.from) || !nodeIds.has(e.to)).map((e) => e.id);
    expect(bad).toEqual([]);
  });

  it('every claim has at least 2 sources from different documents', () => {
    const bad = claims.filter((c) => new Set(c.sources.map((s) => s.ref)).size < 2).map((c) => c.id);
    expect(bad).toEqual([]);
  });

  it('every module has goals at all three levels', () => {
    for (const m of new Set(goals.map((g) => g.module))) {
      const levels = new Set(goals.filter((g) => g.module === m && g.kind !== 'pretest').map((g) => g.level));
      expect([m, [...levels].sort()]).toEqual([m, ['apply', 'explain', 'recall']]);
    }
  });

  it('every question has at least 3 variants', () => {
    const bad = questions.filter((q) => q.variants.length < 3).map((q) => q.id);
    expect(bad).toEqual([]);
  });

  it('every glossary term referenced by a node or question has an entry', () => {
    const texts = [
      ...nodes.flatMap((n) => n.claims.flatMap((c) => [c.text, c.card_front, c.simplified?.fuller_truth])),
      ...questions.flatMap((q) => q.variants.flatMap((v) => [v.prompt, v.explanation, ...(Array.isArray(v.answer) ? v.answer : [v.answer]), ...(v.distractors || [])]))
    ].filter(Boolean);
    const missing = texts.flatMap(glossaryRefs).filter((t) => !glossaryKeys.has(t.toLowerCase()));
    expect([...new Set(missing)]).toEqual([]);
  });
});

describe('content integrity', () => {
  it('every source a claim cites is in the registry, with a passage', () => {
    const all = claims.flatMap((c) => [...c.sources, ...(c.simplified?.sources || [])].map((s) => ({ c: c.id, ...s })));
    expect(all.filter((s) => !sources[s.ref]).map((s) => `${s.c}:${s.ref}`)).toEqual([]);
    expect(all.filter((s) => !s.passage || s.passage.length < 15).map((s) => s.c)).toEqual([]);
  });

  it('claim kinds match the source rules (drug claims cite drug-capable sources)', () => {
    const drugOk = (ref) => /^(dm-|sp-|pmc-)/.test(ref);
    const bad = claims.filter((c) => c.kind === 'drug' && c.sources.filter((s) => drugOk(s.ref)).length < 2).map((c) => c.id);
    expect(bad).toEqual([]);
  });

  it('claim ids are unique', () => {
    expect(claims.length).toBe(claimIds.size);
  });

  it('every node "why" points at one of its own claims', () => {
    const bad = nodes.filter((n) => !n.claims.some((c) => c.id === n.why)).map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('every node has diagram coordinates for its layer', () => {
    const bad = nodes.filter((n) => !n.coords?.[n.layer]).map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it('modules have 5–15 knowledge goals, a pre-test, and all five question types', () => {
    for (const m of new Set(goals.map((g) => g.module))) {
      const kg = goals.filter((g) => g.module === m && g.kind !== 'pretest');
      expect(kg.length).toBeGreaterThanOrEqual(5);
      expect(kg.length).toBeLessThanOrEqual(15);
      expect(goals.some((g) => g.module === m && g.kind === 'pretest')).toBe(true);
      const types = new Set(questions.filter((q) => kg.some((g) => g.id === q.goal)).map((q) => q.type));
      expect([...types].sort()).toEqual(['fill', 'locate', 'mc', 'order', 'scenario']);
    }
  });

  it('modules 1–3 have 2–3 physiology-only case goals and at least one misconception goal', () => {
    for (const m of new Set(goals.map((g) => g.module)).values()) {
      if (m > 3) continue;
      const cases = goals.filter((g) => g.module === m && g.kind === 'case').length;
      expect(cases).toBeGreaterThanOrEqual(2);
      expect(cases).toBeLessThanOrEqual(3);
      expect(goals.some((g) => g.module === m && g.kind === 'misconception')).toBe(true);
    }
  });

  it('every knowledge goal has questions, valid prerequisites, and covers real nodes', () => {
    for (const g of goals.filter((g) => g.kind !== 'pretest')) {
      expect([g.id, questions.some((q) => q.goal === g.id)]).toEqual([g.id, true]);
      expect(g.prerequisites.filter((p) => !goalIds.has(p))).toEqual([]);
      expect(g.nodes.filter((n) => !nodeIds.has(n))).toEqual([]);
    }
  });

  it('pre-test draws only from real goals that have questions', () => {
    for (const p of goals.filter((g) => g.kind === 'pretest')) {
      expect(p.draws.filter((id) => !questions.some((q) => q.goal === id))).toEqual([]);
    }
  });

  it('questions point at real goals, nodes, and claims, and their answers are well-formed', () => {
    for (const q of questions) {
      expect([q.id, goalIds.has(q.goal), nodeIds.has(q.source_node)]).toEqual([q.id, true, true]);
      expect([q.id, (q.claims || []).filter((c) => !claimIds.has(c))]).toEqual([q.id, []]);
      q.variants.forEach((v, i) => {
        const tag = `${q.id}#${i}`;
        if (q.type === 'mc' || q.type === 'scenario') {
          expect([tag, v.distractors?.length >= 2, v.distractors.includes(v.answer)]).toEqual([tag, true, false]);
        }
        if (q.type === 'fill') expect([tag, Array.isArray(v.accepted) && v.accepted.length > 0]).toEqual([tag, true]);
        if (q.type === 'order') expect([tag, Array.isArray(v.answer) && v.answer.length >= 3 && new Set(v.answer).size === v.answer.length]).toEqual([tag, true]);
        if (q.type === 'locate') expect([tag, nodeIds.has(v.answer)]).toEqual([tag, true]);
      });
    }
  });

  it('cards.json is in sync with node claims (run scripts/build-content.mjs)', () => {
    const expected = nodes.flatMap((n) => n.claims.filter((c) => c.card_front).map((c) => `card-${c.id}`)).sort();
    expect(cards.map((c) => c.id).sort()).toEqual(expected);
    for (const c of cards) {
      const claim = nodes.find((n) => n.id === c.node)?.claims.find((x) => x.id === c.claim);
      expect([c.id, c.front]).toEqual([c.id, claim.card_front]);
    }
  });

  it('every drug node lists its generic and brand names as aliases', () => {
    const brands = { clopidogrel: 'Plavix', prasugrel: 'Effient', ticagrelor: 'Brilinta' };
    for (const [id, brand] of Object.entries(brands)) {
      const n = nodes.find((x) => x.id === id);
      if (n) expect(n.aliases).toContain(brand);
    }
  });

  it('glossary entries are 1–3 sentences and link to real nodes', () => {
    for (const g of glossary) {
      const sentences = g.definition.split(/(?<=[.!?])\s+(?=[A-Z"])/).length;
      expect([g.term, sentences >= 1 && sentences <= 3]).toEqual([g.term, true]);
      if (g.node) expect([g.term, nodeIds.has(g.node)]).toEqual([g.term, true]);
    }
  });
});
