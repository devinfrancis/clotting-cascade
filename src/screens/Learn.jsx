import { useEffect, useState } from 'preact/hooks';
import { nodes } from '../content.js';
import { Diagram, LAYERS } from '../components/Diagram.jsx';
import { LessonIndex, LessonSection } from './Lesson.jsx';
import { go, openNode } from '../ui.js';

// #/learn            lesson list
// #/learn/lesson/id  one lesson section
// #/learn/map[/node] the full diagram
export function Learn({ param, sub }) {
  const view = param === 'map' ? 'map' : 'lesson';
  if (param === 'lesson' && sub) return <LessonSection id={sub} />;
  return (
    <section>
      <h1>Learn</h1>
      <div class="seg tabs-inline">
        <button class={view === 'lesson' ? 'on' : ''} onClick={() => go('#/learn')}>Lesson</button>
        <button class={view === 'map' ? 'on' : ''} onClick={() => go('#/learn/map')}>Diagram</button>
      </div>
      {view === 'lesson' ? <LessonIndex /> : <Map highlight={sub} />}
    </section>
  );
}

function Map({ highlight }) {
  // Layers are listed in the order things happen in the body; only layers with content appear.
  const available = LAYERS.filter((l) => nodes.some((n) => n.layer === l.id));
  const [on, setOn] = useState(() => available.map((l) => l.id));
  const [labMap, setLabMap] = useState(false);
  const hasLabMap = nodes.some((n) => n.lab_map);

  useEffect(() => {
    if (highlight) document.querySelector('.diagram .hl')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlight]);

  const toggle = (id) => setOn(on.includes(id) ? on.filter((x) => x !== id) : [...on, id]);

  return (
    <>
      <div class="layer-toggles">
        {available.map((l) => (
          <button key={l.id} class={`chip ${on.includes(l.id) ? 'on' : ''}`} onClick={() => toggle(l.id)} aria-pressed={on.includes(l.id)}>{l.label}</button>
        ))}
        {hasLabMap && <button class={`chip ${labMap ? 'on' : ''}`} onClick={() => setLabMap(!labMap)}>Lab-test map</button>}
      </div>
      {labMap && <p class="banner warn">Lab-test map: this shows what PT and aPTT measure. It is not how clotting works in the body.</p>}
      <p class="muted small">Tap any box to open its card.</p>
      <Diagram layers={on} onTap={openNode} highlight={highlight} />
      <div class="legend small muted">
        <span><i class="lg arrow" /> activates / binds / releases / makes</span>
        <span><i class="lg tbar" /> blocks</span>
      </div>
    </>
  );
}
