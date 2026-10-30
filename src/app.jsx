import { useEffect, useState } from 'preact/hooks';
import { Home } from './screens/Home.jsx';
import { Learn } from './screens/Learn.jsx';
import { Study } from './screens/Study.jsx';
import { Settings } from './screens/Settings.jsx';
import { Quiz } from './screens/Quiz.jsx';
import { Flashcards } from './screens/Flashcards.jsx';
import { SearchBar } from './components/SearchBar.jsx';
import { InstallGuide } from './components/InstallGuide.jsx';
import { Overlays } from './components/Overlays.jsx';
import { closeAllOverlays } from './ui.js';

const TABS = [
  { id: 'home', label: 'Home' },
  { id: 'learn', label: 'Learn' },
  { id: 'study', label: 'Study' },
  { id: 'settings', label: 'Settings' }
];

// Hash routing, so GitHub Pages never needs server-side rewrites.
// #/home  #/learn[/node]  #/study[/goal/id]  #/flash  #/quiz/<mode>/<goal>[/which]  #/settings
function parse() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  return { screen: parts[0] || 'home', parts: parts.slice(1) };
}

export function App() {
  const [r, setR] = useState(parse());
  useEffect(() => {
    const onHash = () => { setR(parse()); closeAllOverlays(); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  let screen;
  const [a, b, c] = r.parts;
  switch (r.screen) {
    case 'learn': screen = <Learn param={a} />; break;
    case 'study': screen = <Study param={a} sub={b} />; break;
    case 'settings': screen = <Settings />; break;
    case 'flash': screen = <Flashcards />; break;
    case 'quiz': screen = <Quiz key={r.parts.join('/')} mode={a} goalId={b} which={c} />; break;
    default: screen = <Home />;
  }
  const tab = r.screen === 'flash' || r.screen === 'quiz' ? 'study' : r.screen;

  return (
    <div class="shell">
      <header class="top">
        <SearchBar />
      </header>
      <main class="content">
        {r.screen === 'home' && <InstallGuide />}
        {screen}
      </main>
      <nav class="tabs">
        {TABS.map((t) => (
          <a key={t.id} href={`#/${t.id}`} class={tab === t.id ? 'on' : ''}>{t.label}</a>
        ))}
      </nav>
      <Overlays />
    </div>
  );
}
