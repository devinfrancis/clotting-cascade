import { useEffect, useState } from 'preact/hooks';
import { goalById, nodeById, modules } from '../content.js';
import { resumeOrBuild, variantOf, answer, overrideLast, advance, sessionKey } from '../quiz.js';
import { recordGraded, recordRetention, recordRecheck, setPretest } from '../goals.js';
import { setMeta, clearSession } from '../store.js';
import { RichText } from '../components/RichText.jsx';
import { Diagram, LAYERS } from '../components/Diagram.jsx';
import { go, openNode, progressChanged } from '../ui.js';

const MODE_LABEL = { graded: 'Graded quiz', practice: 'Practice', pretest: 'Pre-test', retention: 'Retention check', recheck: 'Re-check' };

// One quiz attempt. Every answer is saved the moment it's given, so closing the app mid-quiz
// resumes on the same question (graded attempts for up to 24 hours).
export function Quiz({ mode, goalId, which }) {
  const [s, setS] = useState(null);
  const [fb, setFb] = useState(null); // feedback for the question just answered
  const [result, setResult] = useState(null);
  const hints = mode !== 'retention';

  useEffect(() => {
    resumeOrBuild(goalId, mode, which ? { which: Number(which) } : {}).then((sess) => {
      // If the app closed after answering but before moving on, show that feedback again.
      if (sess.answers.length > sess.index) setFb(sess.answers[sess.index]);
      setS(sess);
    });
  }, [goalId, mode]);

  if (!s) return null;
  const goal = goalById[goalId];

  if (result) return <Result s={result} mode={mode} goal={goal} />;

  const item = s.items[s.index];
  const { q, v } = variantOf(item);

  const submit = async (given) => {
    const r = await answer(s, given);
    setS(r.session);
    setFb(r.session.answers[r.session.answers.length - 1]);
  };

  const next = async () => {
    const n = await advance(s);
    setFb(null);
    if (n.index >= n.items.length) {
      await finish(n, mode, goalId);
      setResult(n);
    } else setS(n);
  };

  return (
    <section class="quiz">
      <p class="eyebrow">{MODE_LABEL[mode]} · {goal.kind === 'pretest' ? goal.title : goal.title} · {s.index + 1}/{s.items.length}</p>
      <h2 class="prompt">{hints ? <RichText text={v.prompt} /> : v.prompt}</h2>
      {!fb && <Answer item={item} q={q} v={v} mode={mode} onSubmit={submit} />}
      {fb && (
        <div class={`feedback ${fb.correct ? 'right' : 'wrong'}`}>
          <p><b>{fb.correct ? (fb.overridden ? 'Counted as right' : 'Right') : 'Not quite'}</b></p>
          {!fb.correct && <p>Answer: {Array.isArray(v.answer) ? v.answer.join(' → ') : (q.type === 'locate' ? nodeById[v.answer].name : v.answer)}</p>}
          {hints && v.explanation && <p class="small"><RichText text={v.explanation} /></p>}
          {!fb.correct && q.type === 'fill' && mode !== 'pretest' && (
            <button class="link" onClick={async () => { const n = await overrideLast(s); setS(n); setFb(n.answers[n.answers.length - 1]); }}>I was right (typo)</button>
          )}
          <button class="primary" onClick={next}>{s.index + 1 < s.items.length ? 'Next' : 'Finish'}</button>
        </div>
      )}
      <button class="link small" onClick={() => go('#/study')}>Leave (progress is saved)</button>
    </section>
  );
}

async function finish(s, mode, goalId) {
  const correct = s.answers.filter((a) => a.correct).length;
  const passed = correct === s.items.length;
  if (mode === 'graded') {
    const { mastered } = await recordGraded(goalId, passed);
    if (mastered) await setMeta('offerExport', true);
  } else if (mode === 'retention') await recordRetention(goalId, s.which, passed);
  else if (mode === 'recheck') await recordRecheck(goalId, passed);
  else if (mode === 'pretest') {
    const m = modules.find((m) => m.pretest?.id === goalId);
    await setPretest(m.id, { status: 'done', score: correct, of: s.items.length });
  }
  await clearSession(sessionKey(goalId, mode));
  progressChanged();
}

function Answer({ item, q, v, mode, onSubmit }) {
  if (q.type === 'mc' || q.type === 'scenario') {
    return (
      <div class="options">
        {item.options.map((o) => <button key={o} class={o === "I don't know" ? 'idk' : ''} onClick={() => onSubmit(o)}>{o}</button>)}
      </div>
    );
  }
  if (q.type === 'fill') return <Fill onSubmit={onSubmit} idk={mode === 'pretest'} />;
  if (q.type === 'order') return <Order options={item.options} onSubmit={onSubmit} idk={mode === 'pretest'} />;
  if (q.type === 'locate') {
    return (
      <>
        <p class="muted small">Tap the box on the diagram.</p>
        <Diagram layers={LAYERS.map((l) => l.id)} onTap={(id) => onSubmit(id)} />
        {mode === 'pretest' && <button class="idk" onClick={() => onSubmit("I don't know")}>I don't know</button>}
      </>
    );
  }
  return null;
}

function Fill({ onSubmit, idk }) {
  const [t, setT] = useState('');
  return (
    <form class="fill" onSubmit={(e) => { e.preventDefault(); if (t.trim()) onSubmit(t.trim()); }}>
      <input value={t} onInput={(e) => setT(e.currentTarget.value)} autocapitalize="off" autocomplete="off" spellcheck={false} aria-label="Your answer" />
      <button class="primary" type="submit">Check</button>
      {idk && <button type="button" class="idk" onClick={() => onSubmit("I don't know")}>I don't know</button>}
    </form>
  );
}

// Tap the steps in order; tap a placed step to take it back.
function Order({ options, onSubmit, idk }) {
  const [picked, setPicked] = useState([]);
  const left = options.filter((o) => !picked.includes(o));
  return (
    <div class="order">
      <ol class="placed">
        {picked.map((p) => <li key={p}><button onClick={() => setPicked(picked.filter((x) => x !== p))}>{p} <span class="muted">×</span></button></li>)}
        {picked.length === 0 && <li class="muted small">Tap the steps below in order.</li>}
      </ol>
      <div class="options">
        {left.map((o) => <button key={o} onClick={() => setPicked([...picked, o])}>{o}</button>)}
      </div>
      <div class="btns">
        <button class="primary" disabled={left.length > 0} onClick={() => onSubmit(picked)}>Check order</button>
        {idk && <button class="idk" onClick={() => onSubmit("I don't know")}>I don't know</button>}
      </div>
    </div>
  );
}

function Result({ s, mode, goal }) {
  const correct = s.answers.filter((a) => a.correct).length;
  const passed = correct === s.items.length;
  const missed = s.answers.filter((a) => !a.correct);
  let headline;
  if (mode === 'pretest') headline = `Baseline: ${correct} of ${s.items.length}. A low score here is expected.`;
  else if (mode === 'practice') headline = `${correct} of ${s.items.length} (practice: doesn't count)`;
  else headline = passed ? 'Passed' : `${correct} of ${s.items.length}. Not a pass this time.`;
  return (
    <section class="quiz">
      <h2>{headline}</h2>
      {mode === 'graded' && !passed && <p class="muted">Your earlier passes are kept. The next graded try opens tomorrow.</p>}
      {mode === 'graded' && passed && <p class="muted">Counted toward mastery.</p>}
      {missed.length > 0 && (
        <>
          <h3>Missed</h3>
          <ul class="links">
            {missed.map((a) => {
              const { q, v } = variantOf(a);
              return (
                <li key={a.qid + a.variant}>
                  <p>{v.prompt}</p>
                  <p class="small">Answer: {Array.isArray(v.answer) ? v.answer.join(' → ') : (q.type === 'locate' ? nodeById[v.answer].name : v.answer)}</p>
                  {mode !== 'retention' && <button class="link" onClick={() => openNode(q.source_node)}>Open the card: {nodeById[q.source_node].name}</button>}
                </li>
              );
            })}
          </ul>
        </>
      )}
      <div class="btns">
        <button class="primary" onClick={() => go('#/study')}>Back to Study</button>
        {goal.kind !== 'pretest' && <button onClick={() => go(`#/study/goal/${goal.id}`)}>Goal page</button>}
      </div>
    </section>
  );
}
