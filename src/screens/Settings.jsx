import { useEffect, useState } from 'preact/hooks';
import { loadDarkSetting, setDarkSetting } from '../theme.js';
import { get } from '../db.js';

export function Settings() {
  const [dark, setDark] = useState('auto');
  const [persist, setPersist] = useState('');
  useEffect(() => {
    loadDarkSetting().then(setDark);
    get('meta', 'persistence').then(setPersist);
  }, []);

  const choose = async (v) => { setDark(v); await setDarkSetting(v); };

  return (
    <section>
      <h1>Settings</h1>
      <div class="row">
        <span>Dark mode</span>
        <div class="seg">
          <button class={dark === 'auto' ? 'on' : ''} onClick={() => choose('auto')}>Auto</button>
          <button class={dark === 'on' ? 'on' : ''} onClick={() => choose('on')}>On</button>
        </div>
      </div>
      <p class="muted small">Storage: {persist || 'checking…'}</p>
    </section>
  );
}
