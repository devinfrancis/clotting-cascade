import { render } from 'preact';
import { App } from './app.jsx';
import { requestPersistence, put, get } from './db.js';
import { loadDarkSetting, applyDark } from './theme.js';
import './styles.css';

async function boot() {
  applyDark(await loadDarkSetting());
  if (!(await get('meta', 'firstLaunch'))) await put('meta', new Date().toISOString(), 'firstLaunch');
  await put('meta', await requestPersistence(), 'persistence');
  render(<App />, document.getElementById('app'));
}

boot();
