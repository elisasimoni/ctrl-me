import React, { useEffect, useRef, useState } from "react";
import { useStore } from "./store.js";
import { useT } from "./i18n.jsx";
import { Settings } from "./components/Settings.jsx";
import { ThoughtCapture } from "./components/ThoughtCapture.jsx";
import { CalmHome } from "./screens/CalmHome.jsx";
import { useReminderNotifications } from "./lib/useReminderNotifications.js";
import { registerNotificationActions } from "./native/notifications.js";
import "./calm.css";

export default function App() {
  const store = useStore();
  const { lang } = useT();
  const it = lang === "it";
  const [capture, setCapture] = useState(null);
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function announce(message, before = null) {
    clearTimeout(timer.current);
    setToast({ message, before });
    timer.current = setTimeout(() => setToast(null), 10000);
  }
  useReminderNotifications(
    store.state.reminders,
    store.state.prefs.profile.permNotifications,
    store.state.prefs.profile,
  );
  useEffect(() => {
    registerNotificationActions({
      doneLabel: it ? "Fatto" : "Done",
      snoozeLabel: it ? "Dopo" : "Snooze",
    });
  }, [lang]);
  useEffect(() => {
    const handler = (e) => {
      const { actionId, reminderId } = e.detail || {};
      if (actionId === "done") store.toggleDone(reminderId);
      if (actionId === "snooze") store.snooze(reminderId);
    };
    window.addEventListener("ctrlme.notif.action", handler);
    return () => window.removeEventListener("ctrlme.notif.action", handler);
  }, [store.toggleDone, store.snooze]);
  function save(plan) {
    const before = capture?.reminder;
    if (before) store.updateReminder(before.id, plan.parent);
    else if (plan.children.length) store.addCluster(plan);
    else store.addReminder(plan.parent);
    store.setPref("onboarded", true);
    setCapture(null);
    announce(
      before
        ? it
          ? "Modifiche salvate."
          : "Changes saved."
        : it
          ? "Salvato. Un pensiero in meno."
          : "Saved. One less thing to carry.",
      before,
    );
  }
  function action(reminder, type) {
    if (type === "done") store.toggleDone(reminder.id);
    else store.snooze(reminder.id);
    announce(
      type === "done"
        ? it
          ? reminder.done
            ? "Riaperto."
            : "Fatto. Respira."
          : reminder.done
            ? "Back on your list."
            : "Done. Take a breath."
        : it
          ? "Tra 10 minuti."
          : "In 10 minutes.",
      reminder,
    );
  }
  return (
    <div
      className={`calm-app ${store.state.prefs.direction === "A" ? "calm-dark" : ""}`}
    >
      {store.storageError && (
        <div className="storage-error" role="alert">
          {it
            ? "Il browser non riesce a salvare. Le modifiche restano solo in questa sessione."
            : "Browser storage is unavailable. Changes will only last for this session."}
        </div>
      )}
      <CalmHome
        store={store}
        onCompose={() => setCapture({})}
        onEdit={(reminder) => setCapture({ reminder })}
        onSettings={() => setPanel("config")}
        onProfile={() => setPanel("profile")}
        onAction={action}
      />
      {capture && (
        <ThoughtCapture
          store={store}
          initial={capture.reminder}
          onSave={save}
          onClose={() => setCapture(null)}
        />
      )}
      <Settings
        open={!!panel}
        mode={panel || "config"}
        store={store}
        onClose={() => setPanel(null)}
      />
      {toast && (
        <div className="calm-toast" role="status">
          <span>{toast.message}</span>
          {toast.before && (
            <button
              onClick={() => {
                store.restoreReminder(toast.before);
                clearTimeout(timer.current);
                setToast(null);
              }}
            >
              {it ? "Annulla" : "Undo"}
            </button>
          )}
          <button
            aria-label={it ? "Chiudi messaggio" : "Dismiss message"}
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
