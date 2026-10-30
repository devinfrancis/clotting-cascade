import { useEffect, useRef, useState } from 'preact/hooks';
import { cardById, goalsForCard, nodeById } from '../content.js';
import { nextCard, rateCard, cardState, previewIntervals, Rating, todayCounts } from '../srs.js';
import { getSession, saveSession, clearSession } from '../store.js';
import { RichText } from '../components/RichText.jsx';
import { go, openNode, progressChanged } from '../ui.js';

const SESSION_MS = 5 * 60_000;
const KEY = 'flash';

function fmt(due) {
  const mins = Math.round((due - Date.now()) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

// A 5-minute flashcard session. The current card, whether its answer is showing, and the time used
// are saved on every action, so a call mid-card resumes exactly there.
export function Flashcards() {
  const [s, setS] = useState(null);
  const [card, setCard] = useState(null);
  const [ivl, setIvl] = useState(null);
  const [done, setDone] = useState(null);
  const tick = useRef(Date.now());

  const persist = async (next) => {
    const now = Date.now();
    const used = next.usedMs + (now - tick.current);
    tick.current = now;
    const saved = { ...next, usedMs: used };
    await saveSession(KEY, saved);
    setS(saved);
    return saved;
  };

  const load = async (sess) => {
    let id = sess.cardId;
    if (!id) id = await nextCard();
    if (!id) {
      await clearSession(KEY);
      setDone({ reason: 'empty', counts: await todayCounts() });
      return;
    }
    const st = await cardState(id);
    setIvl(previewIntervals(st));
    setCard(cardById[id]);
    await persist({ ...sess, cardId: id });
  };

  useEffect(() => {
    (async () => {
      tick.current = Date.now();
      const existing = await getSession(KEY);
      await load(existing || { startedAt: new Date().toISOString(), usedMs: 0, cardId: null, revealed: false, reviewed: 0 });
    })();
    // Count only time the app is visible; save the clock when it goes to the background.
    const onVis = async () => {
      if (document.visibilityState === 'hidden') {
        const cur = await getSession(KEY);
        if (cur) { await saveSession(KEY, { ...cur, usedMs: cur.usedMs + (Date.now() - tick.current) }); }
      } else tick.current = Date.now();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (done) return <SessionEnd done={done} onMore={async () => { setDone(null); tick.current = Date.now(); await load({ startedAt: new Date().toISOString(), usedMs: 0, cardId: null, revealed: false, reviewed: 0 }); }} />;
  if (!s || !card) return null;

  const reveal = () => persist({ ...s, revealed: true });

  const rate = async (r) => {
    await rateCard(card.id, r);
    progressChanged();
    const after = await persist({ ...s, cardId: null, revealed: false, reviewed: s.reviewed + 1 });
    if (after.usedMs >= SESSION_MS) {
      await clearSession(KEY);
      setDone({ reason: 'time', reviewed: after.reviewed, counts: await todayCounts() });
      return;
    }
    const id = await nextCard(card.id);
    if (!id) {
      await clearSession(KEY);
      setDone({ reason: 'empty', reviewed: after.reviewed, counts: await todayCounts() });
      return;
    }
    setCard(null);
    await load(after);
  };

  const goals = goalsForCard(card);
  const left = Math.max(0, Math.ceil((SESSION_MS - s.usedMs) / 60_000));

  return (
    <section class="flash">
      <p class="eyebrow">Flashcards · about {left} min left in this session</p>
      <div class="card card-face">
        <p class="front"><RichText text={card.front} /></p>
        {s.revealed && (
          <>
            <hr />
            <p class="back"><RichText text={card.back} /></p>
            <button class="link" onClick={() => openNode(card.node)}>Open card: {nodeById[card.node].name}</button>
          </>
        )}
        <p class="tied small muted">Tied to: {goals.map((g) => g.title).join(' · ') || 'no goal'}</p>
      </div>
      {!s.revealed ? (
        <button class="primary big" onClick={reveal}>Show answer</button>
      ) : (
        <div class="ratings">
          <button onClick={() => rate(Rating.Again)}>Again<span>{ivl && fmt(ivl[Rating.Again])}</span></button>
          <button onClick={() => rate(Rating.Hard)}>Hard<span>{ivl && fmt(ivl[Rating.Hard])}</span></button>
          <button onClick={() => rate(Rating.Good)}>Good<span>{ivl && fmt(ivl[Rating.Good])}</span></button>
          <button onClick={() => rate(Rating.Easy)}>Easy<span>{ivl && fmt(ivl[Rating.Easy])}</span></button>
        </div>
      )}
      <button class="link small" onClick={() => go('#/study')}>Stop here (resumes on this card)</button>
    </section>
  );
}

function SessionEnd({ done, onMore }) {
  const c = done.counts;
  return (
    <section class="flash">
      <h2>{done.reason === 'time' ? '5 minutes done' : 'Nothing more due right now'}</h2>
      {done.reviewed > 0 && <p>{done.reviewed} cards this session.</p>}
      {done.reason === 'time' && c.dueToday > 0 && <button class="primary big" onClick={onMore}>Another 5 minutes</button>}
      {done.reason === 'empty' && <KeepGoing counts={c} onMore={onMore} />}
      <button class="link" onClick={() => go('#/study')}>Back to Study</button>
    </section>
  );
}

import { startKeepGoing } from '../srs.js';

function KeepGoing({ counts, onMore }) {
  if (counts.plan.shift || counts.keepGoing || counts.unseen === 0 || counts.plan.keepGoingCap <= counts.plan.newQuota) return null;
  const extra = Math.min(counts.plan.keepGoingCap - counts.newDone, counts.unseen);
  if (extra <= 0) return null;
  return (
    <div class="card">
      <p>Today's cards are done. Keep going with up to {extra} extra new cards?</p>
      <button class="primary" onClick={async () => { await startKeepGoing(); progressChanged(); onMore(); }}>Keep going</button>
    </div>
  );
}
