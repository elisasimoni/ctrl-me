import React, { useState, useEffect } from 'react';
import { useStore } from './store.js';
import { useIsStandalone, PhoneFrame } from './PhoneFrame.jsx';
import { A_Onboarding, A_Home, A_Notification } from './screens/DirA.jsx';
import { B_Onboarding, B_Home, B_Notification } from './screens/DirB.jsx';
import { AddSheet } from './components/AddSheet.jsx';
import { Settings } from './components/Settings.jsx';
import { ThemeChooser } from './components/ThemeChooser.jsx';
import { OnboardingQuestionnaire } from './components/OnboardingQuestionnaire.jsx';
import { behaviorSummary } from './lib/behavior.js';
import { useReminderNotifications } from './lib/useReminderNotifications.js';
import { registerNotificationActions } from './native/notifications.js';
import { useT } from './i18n.jsx';

export default function App() {
  const { t, lang } = useT();
  const store = useStore();
  const { state, addReminder, addCluster, setPref, setProfile, toggleDone, snooze } = store;
  const standalone = useIsStandalone();

  const deriveView = (prefs) => {
    if (prefs.onboarded) return 'home';
    if (!prefs.themeChosen) return 'theme';
    if (!prefs.profileDone) return 'questionnaire';
    return 'onboarding';
  };
  const [view, setView] = useState(() => deriveView(state.prefs));

  // Reset back to the right step when "redo onboarding" or "wipe" flip the flags.
  useEffect(() => {
    if (!state.prefs.onboarded && view === 'home') {
      setView(deriveView(state.prefs));
    }
  }, [state.prefs.onboarded, state.prefs.themeChosen, state.prefs.profileDone]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [panel, setPanel] = useState(null); // null | 'profile' | 'config'
  const [nudgeOpen, setNudgeOpen] = useState(false);

  const dir = state.prefs.direction;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;
  const fullscreen = standalone || isMobile;

  // Keep OS notifications in sync with the reminder list.
  useReminderNotifications(
    state.reminders,
    state.prefs.profile.permNotifications,
    state.prefs.profile,
  );

  // Register lock-screen quick action buttons. Re-runs when language
  // changes so the action titles stay localized.
  useEffect(() => {
    registerNotificationActions({
      doneLabel: t('notif.action.done'),
      snoozeLabel: t('notif.action.snooze'),
    });
  }, [lang, t]);

  // Bridge: lock-screen action → store action.
  useEffect(() => {
    const handler = (e) => {
      const { actionId, reminderId } = e.detail || {};
      if (!reminderId) return;
      if (actionId === 'done') toggleDone(reminderId);
      else if (actionId === 'snooze') snooze(reminderId);
    };
    window.addEventListener('ctrlme.notif.action', handler);
    return () => window.removeEventListener('ctrlme.notif.action', handler);
  }, [toggleDone, snooze]);

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

  const pickTheme = (chosenDir) => {
    setPref('direction', chosenDir);
    setPref('themeChosen', true);
    setView('questionnaire');
  };

  const finishQuestionnaire = () => {
    // sync personality with chosen tone so existing LLM call honors it
    if (state.prefs.profile.tone) setPref('personality', state.prefs.profile.tone);
    setProfile({ completedAt: new Date().toISOString() });
    setPref('profileDone', true);
    setView('onboarding');
  };

  const renderScreen = () => {
    if (view === 'theme') {
      return <ThemeChooser onPick={pickTheme} />;
    }
    if (view === 'questionnaire') {
      return (
        <OnboardingQuestionnaire
          dir={dir}
          profile={state.prefs.profile}
          setProfile={setProfile}
          onDone={finishQuestionnaire}
        />
      );
    }
    if (view === 'onboarding') {
      return dir === 'A'
        ? <A_Onboarding onDone={finishOnboarding} />
        : <B_Onboarding onDone={finishOnboarding} />;
    }
    return dir === 'A'
      ? <A_Home store={store}
          onCompose={() => setComposeOpen(true)}
          onSettings={() => setPanel('config')}
          onProfile={() => setPanel('profile')}
          onAddReminder={addReminder} />
      : <B_Home store={store}
          onCompose={() => setComposeOpen(true)}
          onSettings={() => setPanel('config')}
          onProfile={() => setPanel('profile')}
          onAddReminder={addReminder} />;
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
        onAddCluster={addCluster}
        personality={state.prefs.personality}
        profile={state.prefs.profile}
        behavior={behaviorSummary(state.behaviorLog)}
        theme={dir}
      />
      <Settings open={panel !== null} mode={panel ?? 'profile'} onClose={() => setPanel(null)} store={store} />
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
