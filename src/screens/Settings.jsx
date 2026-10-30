import { useEffect, useState } from 'preact/hooks';
import { setDarkSetting } from '../theme.js';
import { getSettings, setSetting, resetAll } from '../store.js';
import { todayPlan } from '../srs.js';
import { doExport, doImport } from '../backup.js';
import { progressChanged } from '../ui.js';

const NUMBERS = [
  { key: 'newCap', label: 'New cards per day', min: 0, max: 50 },
  { key: 'keepGoingCap', label: '"Keep going" cap (total new cards on a good day)', min: 0, max: 100 },
  { key: 'catchupDays', label: 'Catch-up spread (days)', min: 1, max: 14 },
  { key: 'shiftReviewMin', label: 'Shift-day review minimum', min: 0, max: 100 }
];

export function Settings() {
  const [st, setSt] = useState(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { getSettings().then(setSt); }, []);
  if (!st) return null;

  const setNum = async (k, v) => {
    const n = Math.max(0, Math.round(Number(v) || 0));
    setSt({ ...st, [k]: n });
    await setSetting(k, n);
    await todayPlan({ recompute: true });
    progressChanged();
  };

  return (
    <section>
      <h1>Settings</h1>
      {NUMBERS.map((f) => (
        <label class="row" key={f.key}>
          <span>{f.label}</span>
          <input type="number" inputMode="numeric" min={f.min} max={f.max} value={st[f.key]} onChange={(e) => setNum(f.key, e.currentTarget.value)} />
        </label>
      ))}
      <div class="row">
        <span>Dark mode</span>
        <div class="seg">
          <button class={st.dark === 'auto' ? 'on' : ''} onClick={async () => { setSt({ ...st, dark: 'auto' }); await setDarkSetting('auto'); }}>Auto</button>
          <button class={st.dark === 'on' ? 'on' : ''} onClick={async () => { setSt({ ...st, dark: 'on' }); await setDarkSetting('on'); }}>On</button>
        </div>
      </div>
      <div class="row">
        <span>Export progress</span>
        <button onClick={async () => { if (await doExport()) setMsg('Exported.'); progressChanged(); }}>Export</button>
      </div>
      <label class="row">
        <span>Import progress</span>
        <input type="file" accept="application/json,.json" onChange={async (e) => {
          const f = e.currentTarget.files?.[0];
          if (!f) return;
          if (!confirm('Replace all progress on this device with this file?')) return;
          try { await doImport(f); setMsg('Imported.'); setSt(await getSettings()); progressChanged(); } catch (err) { setMsg(err.message); }
        }} />
      </label>
      <div class="row">
        <span>Reset progress</span>
        <button class="danger" onClick={async () => {
          if (!confirm('Erase all progress (cards, quizzes, goals)? Settings are kept. Export first if you might want it back.')) return;
          if (!confirm('Really erase everything?')) return;
          await resetAll();
          setMsg('Progress reset.');
          progressChanged();
        }}>Reset</button>
      </div>
      {msg && <p class="note">{msg}</p>}
    </section>
  );
}
