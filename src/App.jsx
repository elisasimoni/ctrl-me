import React, { useState, useEffect } from 'react';
import { useStore } from './store.js';
import { useIsStandalone, PhoneFrame } from './PhoneFrame.jsx';
import { A_Onboarding, A_Home, A_Notification } from './screens/DirA.jsx';
import { B_Onboarding, B_Home, B_Notification } from './screens/DirB.jsx';
import { AddSheet } from './components/AddSheet.jsx';
import { Settings } from './components/Settings.jsx';
import { useT } from './i18n.jsx';

export default function App() {
  const { t, lang } = useT();
  const store = useStore(t, lang);
  const { state, addReminder, setPref } = store;
  const standalone = useIsStandalone();

  const [view, setView] = useState(() => state.prefs.onboarded ? 'home' : 'onboarding');
  const [composeOpen, setComposeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nudgeOpen, setNudgeOpen] = useState(false);

  const dir = state.prefs.direction;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
  const fullscreen = standalone || isMobile;

  useEffect(() => {
    if (view !== 'home') return;
    const seenKey = 'ctrlme.nudgeSeen';
    if (sessionStorage.getItem(seenKey)) return;
    const tm = setTimeout(() => {
      sessionStorage.setItem(seenKey, '1');
      setNudgeOpen(true);
    }, 9000);
    return () => clearTimeout(tm);
  }, [view]);

  const finishOnboarding = () => {
    setPref('onboarded', true);
    setView('home');
  };

  const renderScreen = () => {
    if (view === 'onboarding') {
      return dir === 'A'
        ? <A_Onboarding onDone={finishOnboarding} />
        : <B_Onboarding onDone={finishOnboarding} />;
    }
    return dir === 'A'
      ? <A_Home store={store} onCompose={() => setComposeOpen(true)} onSettings={() => setSettingsOpen(true)} />
      : <B_Home store={store} onCompose={() => setComposeOpen(true)} onSettings={() => setSettingsOpen(true)} />;
  };

  const Notification = dir === 'A' ? A_Notification : B_Notification;

  const screen = (
    <>
      {renderScreen()}
      {nudgeOpen && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40 }}>
          <Notification onDismiss={() => setNudgeOpen(false)} />
        </div>
      )}
      <AddSheet
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onAdd={addReminder}
        personality={state.prefs.personality}
        theme={dir}
      />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} store={store} />
    </>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <PhoneFrame fullscreen={fullscreen}>{screen}</PhoneFrame>
      {!fullscreen && view === 'home' && <DesktopHints dir={dir} setNudge={setNudgeOpen} t={t} />}
    </div>
  );
}

function DesktopHints({ dir, setNudge, t }) {
  return (
    <div style={{
      position: 'absolute', bottom: 24, left: 24, right: 24,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      pointerEvents: 'none',
      fontFamily: dir === 'A' ? "'JetBrains Mono', monospace" : "'Inter Tight', sans-serif",
      color: 'rgba(0,0,0,0.5)',
      fontSize: 12,
      letterSpacing: dir === 'A' ? '0.08em' : '-0.01em',
    }}>
      <span>{t('desktop.tagline')}</span>
      <button onClick={() => setNudge(true)} style={{
        pointerEvents: 'auto',
        background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 100,
        padding: '8px 14px', cursor: 'pointer', color: 'inherit',
        fontFamily: 'inherit', fontSize: 12,
      }}>{t('desktop.previewNudge')}</button>
    </div>
  );
}
