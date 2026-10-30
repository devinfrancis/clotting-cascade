import { useEffect, useState } from 'preact/hooks';
import { modules, goalById, questionsForGoal, nodeById } from '../content.js';
import { goalStates, quizzesDue, retentionDue, rechecksDue, gradedOpenToday, STATE_LABEL } from '../goals.js';
import { todayCounts } from '../srs.js';
import { pendingAttempts } from '../quiz.js';
import { getSession, isShiftDay, getMeta } from '../store.js';
import { dayKey } from '../day.js';
import { go, openNode, useProgressVersion } from '../ui.js';

const MODE_LABEL = { graded: 'Graded quiz', practice: 'Practice', pretest: 'Pre-test', retention: 'Retention check', recheck: 'Re-check' };

export function Study({ param, sub }) {
  if (param === 'goal' && sub) return <GoalPage id={sub} />;
  return <StudyHome />;
}

function StudyHome() {
  const v = useProgressVersion();
  const [d, setD] = useState(null);
  useEffect(() => {
    (async () => {
      setD({
        counts: await todayCounts(),
        flash: await getSession('flash'),
        pending: await pendingAttempts(),
        quizzes: await quizzesDue(),
        retention: await retentionDue(),
        rechecks: await rechecksDue(),
        ...(await goalStates()),
        shift: await isShiftDay()
      });
    })();
  }, [v]);
  if (!d) return null;
  const c = d.counts;

  return (
    <section>
      <h1>Study</h1>

      {d.pending.map((p) => (
        <button key={p.goal + p.mode} class="banner resume" onClick={() => go(`#/quiz/${p.mode}/${p.goal}`)}>
          Resume {MODE_LABEL[p.mode].toLowerCase()}: {goalById[p.goal].title} ({p.index + 1}/{p.items.length})
        </button>
      ))}

      <div class="card">
        <h2>Flashcards</h2>
        <p>
          {c.reviewsLeft} reviews · {c.newLeft} new{c.learningDue ? ` · ${c.learningDue} relearning` : ''}
          {c.plan.catchup && <span class="note"> · catching up: day {c.plan.catchup.day} of {c.plan.catchup.of}</span>}
        </p>
        {d.shift && <p class="small muted">Shift day: no new cards, short review set.</p>}
        <button class="primary big" onClick={() => go('#/flash')}>{d.flash ? 'Resume session' : c.dueToday ? 'Start 5-minute session' : 'Check for cards'}</button>
      </div>

      {(d.rechecks.length > 0 || d.retention.length > 0 || d.quizzes.length > 0) && (
        <div class="card">
          <h2>Due today</h2>
          <ul class="links">
            {d.rechecks.map((g) => <li key={'r' + g.id}><button class="link-btn" onClick={() => go(`#/quiz/recheck/${g.id}`)}>Re-check: {g.title}</button></li>)}
            {d.retention.map(({ goal, which }) => <li key={'t' + goal.id}><button class="link-btn" onClick={() => go(`#/quiz/retention/${goal.id}/${which}`)}>{which}-day retention check: {goal.title}</button></li>)}
            {d.quizzes.map((g) => <li key={'q' + g.id}><button class="link-btn" onClick={() => go(`#/quiz/graded/${g.id}`)}>Graded quiz: {g.title}</button></li>)}
          </ul>
        </div>
      )}

      {modules.map((m) => (
        <div key={m.id}>
          <h2 class="section">{m.id}. {m.title}</h2>
          {m.goals.map((g) => (
            <button class="goal-row" key={g.id} onClick={() => go(`#/study/goal/${g.id}`)}>
              <span>{g.title}</span>
              <span class={`state s-${d.states[g.id]}`}>{STATE_LABEL[d.states[g.id]]}</span>
            </button>
          ))}
        </div>
      ))}
    </section>
  );
}

function GoalPage({ id }) {
  const v = useProgressVersion();
  const g = goalById[id];
  const [d, setD] = useState(null);
  useEffect(() => {
    (async () => {
      const { states, progress } = await goalStates();
      const pre = await getMeta(`pretest:${g.module}`);
      setD({ state: states[id], p: progress[id], shift: await isShiftDay(), states, pre });
    })();
  }, [v, id]);
  if (!g || !d) return null;
  const open = gradedOpenToday(d.state, d.p, dayKey(), d.shift);
  const prereqs = g.prerequisites.map((pid) => goalById[pid]);
  const m = modules.find((x) => x.id === g.module);

  return (
    <section>
      <p class="eyebrow">{g.level} · {g.kind}</p>
      <h1>{g.title}</h1>
      <p><span class={`state s-${d.state}`}>{STATE_LABEL[d.state]}</span> · {d.p.passes.length} of 3 graded passes</p>
      {d.p.review && <p class="banner warn">Why it's in Review: {d.p.review.reason}</p>}
      {d.state === 'pretest-pending' && m.pretest && (
        <p class="note small">This module's pre-test hasn't been taken. It's optional: <button class="link" onClick={() => go(`#/quiz/pretest/${m.pretest.id}`)}>take it</button> or just start.</p>
      )}
      {d.state === 'locked' && (
        <p class="muted">Quizzes open after one graded pass on: {prereqs.map((p) => p.title).join('; ')}. The cards and diagram are always open.</p>
      )}
      <div class="btns wrap">
        {d.state !== 'locked' && (
          open ? <button class="primary" onClick={() => go(`#/quiz/graded/${id}`)}>Take graded quiz</button>
            : <button class="primary" disabled>{d.shift ? 'Graded quiz: tomorrow (shift day)' : d.state === 'mastered' || d.state === 'retained' ? 'Mastered: next is the retention check' : `Graded quiz opens ${d.p.nextGradedFrom === dayKey() ? 'today' : d.p.nextGradedFrom || 'tomorrow'}`}</button>
        )}
        {d.state !== 'locked' && <button onClick={() => go(`#/quiz/practice/${id}`)}>Practice</button>}
      </div>
      <h3>Cards in this goal</h3>
      <ul class="links">
        {g.nodes.map((n) => <li key={n}><button class="link-btn" onClick={() => openNode(n)}>{nodeById[n].name}</button></li>)}
      </ul>
      <p class="muted small">{questionsForGoal(id).length} questions · about 2 minutes</p>
    </section>
  );
}
