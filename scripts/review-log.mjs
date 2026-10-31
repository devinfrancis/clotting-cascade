// Writes content/review-log.md from the reviewers' JSON files plus the writer's resolutions.
// The summary at the top is kept in content/review/summary.md and pasted in as-is.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const L = (f) => (existsSync(`content/review/${f}.json`) ? JSON.parse(readFileSync(`content/review/${f}.json`, 'utf8')) : []);
const notes = JSON.parse(readFileSync('content/review/resolutions.json', 'utf8'));
const persona = { 1: 'R1 physiology professor', 2: 'R2 EMT instructor', 3: 'R3 emergency physician' };
const later = { 1: [...L('r1b'), ...L('r1c'), ...L('r1d')], 2: L('r2b'), 3: L('r3b') };
const cell = (s) => String(s || '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();

function followUp(r, item) {
  const hits = later[r].filter((x) => x.item === item || x.item.startsWith(item + ' ') || item.startsWith(x.item));
  return hits.length ? hits[hits.length - 1].verdict : '';
}

let md = readFileSync('content/review/summary.md', 'utf8') + '\n\n## Every flag, first round\n\n';
md += 'Columns: reviewer, item, verdict, what they said, re-review verdict by the same reviewer, how it was resolved.\n\n';
md += '| Reviewer | Item | Verdict | Detail | Re-review | Resolution |\n|---|---|---|---|---|---|\n';
for (const r of [1, 2, 3]) {
  for (const x of L(`r${r}`)) {
    if (x.verdict === 'approve') continue;
    md += `| ${persona[r]} | ${cell(x.item)} | ${x.verdict} | ${cell(x.detail).slice(0, 400)} | ${followUp(r, x.item)} | ${cell(notes[x.item] || '')} |\n`;
  }
}
md += '\n## Re-review rounds (fixes checked by the reviewer who raised them)\n\n| Round | Item | Verdict | Detail |\n|---|---|---|---|\n';
for (const [name, label] of [['r1b', 'R1 re-review'], ['r2b', 'R2 re-review'], ['r3b', 'R3 re-review'], ['r1c', 'R1 final'], ['r1d', 'R1 final (g-cf-1)']]) {
  for (const x of L(name)) {
    if (x.verdict === 'approve' || x.verdict === 'resolved') continue;
    md += `| ${label} | ${cell(x.item)} | ${x.verdict} | ${cell(x.detail).slice(0, 400)} |\n`;
  }
}
md += '\n## Lesson review (content/m1/lesson.json)\n\n| Reviewer | Item | Verdict | Detail |\n|---|---|---|---|\n';
for (const [name, label] of [['l1', 'R1 physiology professor'], ['l2', 'R2 EMT instructor'], ['l3', 'R3 emergency physician']]) {
  for (const x of L(name)) {
    if (x.verdict === 'approve') continue;
    md += `| ${label} | ${cell(x.item)} | ${x.verdict} | ${cell(x.detail).slice(0, 400)} |\n`;
  }
}
md += '\n### Lesson re-check of fixes\n\n| Reviewer | Item | Verdict | Detail |\n|---|---|---|---|\n';
for (const x of L('l-recheck')) md += `| ${x.reviewer} | ${cell(x.item)} | ${x.verdict} | ${cell(x.detail).slice(0, 300)} |\n`;
writeFileSync('content/review-log.md', md);
console.log('review-log.md written');
