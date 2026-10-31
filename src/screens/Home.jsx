import { useEffect, useState } from 'preact/hooks';
import { modules, knowledgeGoals } from '../content.js';
import { goalStates, quizzesDue, retentionDue, rechecksDue, STATE_LABEL, setPretest } from '../goals.js';
import { todayCounts, todayPlan } from '../srs.js';
import { isShiftDay, setShiftDay, getMeta, setMeta } from '../store.js';
import { daysBetween, dayKey } from '../day.js';
import { go, progressChanged, useProgressVersion } from '../ui.js';
import { doExport } from '../backup.js';
import { lessonProgress } from './Lesson.jsx';

export function Home() {
  const v = useProgressVersion();
  const [d, setD] = useState(null);
  const [openMod, setOpenMod] = useState(null);

  useEffect(() => {
    (async () => {
      const { states } = await goalStates();
      const counts = await todayCounts();
      const lastExport = await getMeta('lastExport');
      const firstLaunch = await getMeta('firstLaunch');
      const since = lastExport || firstLaunch;
      setD({
        states,
        counts,
        quizzes: await quizzesDue(),
        retention: await retentionDue(),
        rechecks: await rechecksDue(),
        shift: await isShiftDay(),
        backupDue: since && daysBetween(dayKey(new Date(since)), dayKey()) >= 7,
        offerExport: await getMeta('offerExport'),
        lesson: await firstUnfinishedLesson()
      });
    })();
  }, [v]);

  if (!d) return null;
  const vals = Object.values(d.states);
  const done = vals.filter((s) => s === 'mastered' || s === 'retained').length;
  const review = vals.filter((s) => s === 'review').length;

  const toggleShift = async () => {
    await setShiftDay(!d.shift);
    await todayPlan({ recompute: true });
    progressChanged();
  };

  const openModule = async (m) => {
    setOpenMod(openMod === m.id ? null : m.id);
  };

  return (
    <section>
      {d.offerExport && (
        <div class="banner ok">
          <span>A goal just reached Mastered. Back up now?</span>
          <button onClick={async () => { await doExport(); await setMeta('offerExport', false); progressChanged(); }}>Export</button>
          <button class="link" onClick={async () => { await setMeta('offerExport', false); progressChanged(); }}>Later</button>
        </div>
      )}
      {d.backupDue && !d.offerExport && (
        <div class="banner">
          <span>No backup in 7+ days.</span>
          <button onClick={async () => { await doExport(); progressChanged(); }}>Export now</button>
        </div>
      )}

      {d.lesson && (
        <button class="card lesson-cta" onClick={() => go(`#/learn/lesson/${(d.lesson.next || d.lesson.first).id}`)}>
          <span class="eyebrow">{d.lesson.read === 0 ? 'Start here' : 'Continue the lesson'}</span>
          <b>{d.lesson.read === 0 ? `Module ${d.lesson.module}: ${d.lesson.title}` : d.lesson.next.title}</b>
          <span class="small muted">{d.lesson.read} of {d.lesson.total} sections read · about 2 minutes each</span>
        </button>
      )}

      <div class="counters">
        <div class="counter"><b>{done}/{knowledgeGoals.length}</b><span>Retained + Mastered</span></div>
        <div class="counter"><b>{review}</b><span>In Review</span></div>
        <div class="counter"><b>{d.counts.dueToday}</b><span>Cards due today</span></div>
        <div class="counter"><b>{d.quizzes.length + d.rechecks.length}</b><span>Quizzes due</span></div>
        <div class="counter"><b>{d.retention.length}</b><span>Retention checks</span></div>
      </div>

      {d.counts.plan.catchup && <p class="note">Catching up: day {d.counts.plan.catchup.day} of {d.counts.plan.catchup.of}</p>}

      <div class="row-btns">
        <button class="primary big" onClick={() => go('#/study')}>Study</button>
        <button class={`toggle ${d.shift ? 'on' : ''}`} onClick={toggleShift} aria-pressed={d.shift}>
          {d.shift ? 'Shift day: on' : 'Shift day'}
        </button>
      </div>
      {d.shift && <p class="note small">No new cards today, a short review set, and quizzes wait until tomorrow with no penalty.</p>}

      <h2 class="section">Modules</h2>
      {modules.map((m) => {
        const ms = m.goals.map((g) => d.states[g.id]);
        const mdone = ms.filter((s) => s === 'mastered' || s === 'retained').length;
        const started = ms.filter((s) => s === 'in-progress' || s === 'review').length;
        return (
          <div class="module" key={m.id}>
            <button class="module-head" onClick={() => openModule(m)}>
              <span>{m.id}. {m.title}</span>
              <span class="muted small">{mdone}/{m.goals.length}</span>
            </button>
            <div class="bar"><i style={{ width: `${(mdone / m.goals.length) * 100}%` }} /><i class="part" style={{ width: `${(started / m.goals.length) * 100}%` }} /></div>
            {openMod === m.id && <ModuleGoals m={m} states={d.states} />}
          </div>
        );
      })}
    </section>
  );
}

// The first module whose lesson isn't fully read yet.
async function firstUnfinishedLesson() {
  for (const m of modules) {
    const p = await lessonProgress(m.id);
    if (p.total && p.next) return { ...p, module: m.id, title: m.title };
  }
  return null;
}

function ModuleGoals({ m, states }) {
  const [pre, setPre] = useState(undefined);
  useEffect(() => { getMeta(`pretest:${m.id}`).then((p) => setPre(p || null)); }, [m.id]);
  return (
    <div class="goal-list">
      {pre === null && m.pretest && (
        <div class="card pretest-offer">
          <p><b>Pre-test?</b> {m.pretest.draws.length} quick questions to see where you're starting. "I don't know" is a fine answer, and nothing is locked by your score.</p>
          <div class="btns">
            <button class="primary" onClick={() => go(`#/quiz/pretest/${m.pretest.id}`)}>Take it</button>
            <button onClick={async () => { await setPretest(m.id, { status: 'skipped' }); setPre({ status: 'skipped' }); progressChanged(); }}>Skip</button>
          </div>
        </div>
      )}
      {m.goals.map((g) => (
        <button class="goal-row" key={g.id} onClick={() => go(`#/study/goal/${g.id}`)}>
          <span>{g.title}</span>
          <span class={`state s-${states[g.id]}`}>{STATE_LABEL[states[g.id]]}</span>
        </button>
      ))}
    </div>
  );
}
