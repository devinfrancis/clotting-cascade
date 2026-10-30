import { useEffect, useState } from 'preact/hooks';
import { Home } from './screens/Home.jsx';
import { Learn } from './screens/Learn.jsx';
import { Study } from './screens/Study.jsx';
import { Settings } from './screens/Settings.jsx';
import { SearchBar } from './components/SearchBar.jsx';
import { InstallGuide } from './components/InstallGuide.jsx';

const SCREENS = [
  { id: 'home', label: 'Home', C: Home },
  { id: 'learn', label: 'Learn', C: Learn },
  { id: 'study', label: 'Study', C: Study },
  { id: 'settings', label: 'Settings', C: Settings }
];

// Hash routing, so GitHub Pages never needs server-side rewrites.
function currentRoute() {
  const id = location.hash.replace(/^#\/?/, '').split('/')[0];
  return SCREENS.some((s) => s.id === id) ? id : 'home';
}

export function App() {
  const [route, setRoute] = useState(currentRoute());
  useEffect(() => {
    const onHash = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const Screen = SCREENS.find((s) => s.id === route).C;

  return (
    <div class="shell">
      <header class="top">
        <SearchBar />
      </header>
      <main class="content">
        <InstallGuide />
        <Screen />
        <p class="disclaimer">Study tool, not a clinical reference. Local and state protocol always wins.</p>
      </main>
      <nav class="tabs">
        {SCREENS.map((s) => (
          <a key={s.id} href={`#/${s.id}`} class={route === s.id ? 'on' : ''}>{s.label}</a>
        ))}
      </nav>
    </div>
  );
}
