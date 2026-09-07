import React, { useEffect, useRef, useState } from "react";
import { useStore } from "./store.js";
import { useT } from "./i18n.jsx";
import { Settings } from "./components/Settings.jsx";
import { ThoughtCapture } from "./components/ThoughtCapture.jsx";
import { CalmHome } from "./screens/CalmHome.jsx";
import { useReminderNotifications } from "./lib/useReminderNotifications.js";
import { registerNotificationActions } from "./native/notifications.js";
import { inverseChange, deletionChange } from "./lib/planChanges.js";
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
  function announce(message, before = null, change = null) {
    clearTimeout(timer.current);
    setToast({ message, before, change });
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
  function openPlan(parent) {
    setCapture({
      plan: {
        parent,
        children: store.state.reminders.filter(
          (item) =>
            item.parentId === parent.id && item.clusterId === parent.clusterId,
        ),
      },
    });
  }
  function editReminder(reminder) {
    if (reminder.kind === "parent") openPlan(reminder);
    else setCapture({ reminder });
  }
  function save(plan) {
    const before = capture?.reminder;
    const original =
      capture?.plan ||
      (before && before.kind !== "child"
        ? { parent: before, children: [] }
        : null);
    let change = null;
    if (original) {
      change = store.preparePlanChange(original, plan);
      if (!store.commitChange(change)) return false;
    } else if (before) store.updateReminder(before.id, plan.parent);
    else if (plan.children.length) store.addCluster(plan);
    else store.addReminder(plan.parent);
    store.setPref("onboarded", true);
    setCapture(null);
    announce(
      original || before
        ? it
          ? "Modifiche salvate."
          : "Changes saved."
        : it
          ? "Salvato. Un pensiero in meno."
          : "Saved. One less thing to carry.",
      change ? null : before,
      change,
    );
    return true;
  }
  function removeCaptured() {
    const before = capture.plan
      ? [capture.plan.parent, ...capture.plan.children]
      : [capture.reminder];
    const change = deletionChange(before, before[0]);
    if (!store.commitChange(change)) {
      announce(
        it
          ? "Il piano è cambiato. Riaprilo prima di eliminarlo."
          : "The plan changed. Reopen it before deleting.",
      );
      setCapture(null);
      return;
    }
    setCapture(null);
    announce(
      it ? "Eliminato. Puoi ancora annullare." : "Removed. You can still undo.",
      null,
      change,
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
        onEdit={editReminder}
        onPlan={openPlan}
        onSettings={() => setPanel("config")}
        onProfile={() => setPanel("profile")}
        onAction={action}
      />
      {capture && (
        <ThoughtCapture
          store={store}
          initial={capture.reminder}
          initialPlan={capture.plan}
          onDelete={
            capture.reminder || capture.plan ? removeCaptured : undefined
          }
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
          {(toast.before || toast.change) && (
            <button
              onClick={() => {
                if (toast.change) {
                  if (!store.commitChange(inverseChange(toast.change))) {
                    announce(
                      it
                        ? "Ci sono modifiche più recenti. Annullamento non applicato."
                        : "There are newer changes. Undo was not applied.",
                    );
                    return;
                  }
                } else store.restoreReminder(toast.before);
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
