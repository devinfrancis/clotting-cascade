import { exportAll, importAll, setMeta } from './store.js';
import { dayKey } from './day.js';

// One-tap export. Uses the share sheet where it can take files (iPhone), else a download.
export async function doExport() {
  const data = await exportAll();
  const name = `cascade-progress-${dayKey()}.json`;
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
    } catch (e) {
      if (e.name === 'AbortError') return false;
      throw e;
    }
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  await setMeta('lastExport', new Date().toISOString());
  return true;
}

export async function doImport(file) {
  const data = JSON.parse(await file.text());
  await importAll(data);
}
