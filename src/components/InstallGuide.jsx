import { useEffect, useState } from 'preact/hooks';
import { get, put } from '../db.js';
import { isStandalone, isIOS, canPromptInstall, promptInstall } from '../install.js';

// Shown on first visit in the browser (never inside the installed app), because on iOS
// the installed app and the browser tab keep separate saved progress.
export function InstallGuide() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isStandalone()) return;
    get('meta', 'installGuideDismissed').then((d) => setShow(!d));
  }, []);

  if (!show) return null;

  const dismiss = async () => { await put('meta', true, 'installGuideDismissed'); setShow(false); };

  const iosSteps = [
    'Open this page in Safari (not Chrome or an in-app browser).',
    'Tap the Share button: the square with an arrow pointing up, at the bottom of the screen (top on iPad).',
    'Scroll down and tap "Add to Home Screen", then tap Add.',
    'Open the app from the new Cascade icon on your home screen and study only from there. Progress saved in the Safari tab does not carry over.'
  ];

  return (
    <div class="card install">
      <h2>Install this app first</h2>
      <p class="small">
        Installed, it works offline and your progress is safe. In a plain browser tab, iPhone can erase saved progress after about a week without visits.
      </p>
      {isIOS() ? (
        <>
          <p><b>Step {step + 1} of {iosSteps.length}:</b> {iosSteps[step]}</p>
          <div class="btns">
            {step > 0 && <button onClick={() => setStep(step - 1)}>Back</button>}
            {step < iosSteps.length - 1
              ? <button class="primary" onClick={() => setStep(step + 1)}>Next</button>
              : <button class="primary" onClick={dismiss}>Done</button>}
          </div>
        </>
      ) : canPromptInstall() ? (
        <div class="btns">
          <button class="primary" onClick={async () => { if (await promptInstall()) dismiss(); }}>Install</button>
        </div>
      ) : (
        <p class="small">Use your browser menu and choose "Install app" or "Add to Home screen".</p>
      )}
      <button class="link small" onClick={dismiss}>Not now</button>
    </div>
  );
}
