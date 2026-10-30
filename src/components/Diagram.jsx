import { nodes, edges } from '../content.js';

const W = 104;
const H = 32;
export const LAYERS = [
  { id: 'platelets', label: 'Platelets' },
  { id: 'coagulation', label: 'Coagulation' },
  { id: 'regulators', label: 'Regulators' },
  { id: 'fibrinolysis', label: 'Fibrinolysis' },
  { id: 'drugs', label: 'Drugs' }
];

export function shortLabel(n) {
  const m = n.name.match(/^(.*?) \((.*)\)$/);
  if (!m) return n.name;
  return m[1].length <= 14 ? m[1] : m[2];
}

function lines(label) {
  if (label.length <= 14) return [label];
  const words = label.split(' ');
  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(' '), words.slice(half).join(' ')];
}

function pos(n) {
  return n.coords[n.layer] || Object.values(n.coords)[0];
}

// Point where a ray from a box center toward (tx, ty) leaves the box, so arrows stop at the edge.
function exitPoint(c, tx, ty) {
  const dx = tx - c.x;
  const dy = ty - c.y;
  const t = Math.min(dx ? (W / 2 + 4) / Math.abs(dx) : Infinity, dy ? (H / 2 + 4) / Math.abs(dy) : Infinity);
  return { x: c.x + dx * t, y: c.y + dy * t };
}

function quad(a, c, b, t) {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
}

// How many other boxes a (possibly curved) edge would pass through.
function hits(a, c, b, others) {
  let n = 0;
  // Leaving the drawing area counts as a collision.
  for (let i = 1; i < 20; i++) {
    const p = quad(a, c, b, i / 20);
    if (p.x < 6 || p.x > 354) { n++; break; }
  }
  for (const o of others) {
    for (let i = 3; i < 38; i++) {
      const p = quad(a, c, b, i / 40);
      if (Math.abs(p.x - o.x) < W / 2 + 2 && Math.abs(p.y - o.y) < H / 2 + 2) { n++; break; }
    }
  }
  return n;
}

// Straight when the way is clear; otherwise bend around whatever box is in the way.
function edgePath(a, b, others) {
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  let best = { c: mid, h: hits(a, mid, b, others) };
  if (best.h) {
    for (const off of [50, -50, 90, -90, 130, -130, 170, -170, 220, -220]) {
      const c = { x: mid.x + nx * off, y: mid.y + ny * off };
      const h = hits(a, c, b, others);
      if (h < best.h) best = { c, h };
      if (!h) break;
    }
  }
  const p1 = exitPoint(a, best.c.x === mid.x ? b.x : best.c.x, best.c.x === mid.x ? b.y : best.c.y);
  const p2 = exitPoint(b, best.c.x === mid.x ? a.x : best.c.x, best.c.x === mid.x ? a.y : best.c.y);
  return best.c === mid ? `M${p1.x},${p1.y} L${p2.x},${p2.y}` : `M${p1.x},${p1.y} Q${best.c.x},${best.c.y} ${p2.x},${p2.y}`;
}

// The SVG diagram. Used by Learn (tap opens a card) and by "locate" quiz questions (tap answers).
export function Diagram({ layers, onTap, highlight, marked }) {
  const shown = nodes.filter((n) => layers.includes(n.layer));
  const ids = new Set(shown.map((n) => n.id));
  const byId = Object.fromEntries(shown.map((n) => [n.id, n]));
  const shownEdges = edges.filter((e) => ids.has(e.from) && ids.has(e.to) && layers.includes(e.layer));
  const height = Math.max(...shown.map((n) => pos(n).y)) + 40;

  return (
    <svg class="diagram" viewBox={`0 0 360 ${height}`} role="img" aria-label="Clotting diagram">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" class="arrowhead" />
        </marker>
        <marker id="tbar" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M5,0 L5,10" class="tbar" />
        </marker>
      </defs>
      {shownEdges.map((e) => {
        const others = shown.filter((n) => n.id !== e.from && n.id !== e.to).map(pos);
        const d = edgePath(pos(byId[e.from]), pos(byId[e.to]), others);
        const inhib = e.relation === 'inhibits';
        return (
          <path key={e.id} d={d} fill="none" class={`edge ${e.relation}`} marker-end={inhib ? 'url(#tbar)' : 'url(#arrow)'}>
            <title>{`${byId[e.from].name} ${e.relation} ${byId[e.to].name}: ${e.label}`}</title>
          </path>
        );
      })}
      {shown.map((n) => {
        const p = pos(n);
        const ls = lines(shortLabel(n));
        const cls = ['node', n.type, highlight === n.id ? 'hl' : '', marked?.[n.id] || ''].join(' ');
        return (
          <g key={n.id} class={cls} transform={`translate(${p.x - W / 2},${p.y - H / 2})`} onClick={() => onTap?.(n.id)} role="button" tabIndex={0} aria-label={n.name}>
            <rect width={W} height={H} rx={8} />
            {ls.map((l, i) => (
              <text key={i} x={W / 2} y={H / 2 + (i - (ls.length - 1) / 2) * 12} dominant-baseline="central" text-anchor="middle">{l}</text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
