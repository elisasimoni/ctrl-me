import React, { useEffect, useState } from "react";
import { CtrlMark, Icon } from "../atoms.jsx";
import { useT } from "../i18n.jsx";
import { dateLabel, laneFor, localDate } from "../lib/planning.js";
import { requestPermission } from "../native/notifications.js";
import { WeatherBanner } from "../components/WeatherBanner.jsx";
import { isNative } from "../native/platform.js";

export function CalmHome({
  store,
  onCompose,
  onEdit,
  onPlan,
  onSettings,
  onProfile,
  onAction,
}) {
  const { lang } = useT();
  const it = lang === "it";
  const { state, setPref, setProfile } = store;
  const [filter, setFilter] = useState(null);
  const [clock, setClock] = useState(() => new Date());
  const [permissionNote, setPermissionNote] = useState("");
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (filter && !state.reminders.some((r) => r.clusterId === filter))
      setFilter(null);
  }, [state.reminders, filter]);
  const first = !state.prefs.onboarded && state.reminders.length === 0;
  const open = state.reminders.filter((r) => !r.done);
  const completed = state.reminders.filter((r) => r.done);
  const active = filter ? open.filter((r) => r.clusterId === filter) : open;
  const parents = state.reminders.filter((r) => r.kind === "parent");
  const lanes = [
    {
      key: "now",
      label: it ? "Adesso" : "Now",
      sub: it
        ? "Oggi e quello rimasto in sospeso"
        : "Today, and anything still waiting",
    },
    {
      key: "later",
      label: it ? "Più tardi" : "Later",
      sub: it ? "Ogni cosa a suo tempo" : "One thing at a time",
    },
    {
      key: "space",
      label: it ? "Può aspettare" : "Can wait",
      sub: it
        ? "Un posto per i pensieri senza data"
        : "A home for thoughts without a date",
    },
  ];
  async function enableNotifications() {
    const allowed = await requestPermission();
    setProfile({
      permNotifications: allowed,
      notificationRevision: Date.now(),
    });
    setPermissionNote(
      allowed
        ? it
          ? "Notifiche abilitate."
          : "Notifications enabled."
        : it
          ? "Notifiche non abilitate. Controlla i permessi del dispositivo."
          : "Notifications aren’t enabled. Check your device permissions.",
    );
  }
  return (
    <div className="calm-home">
      <header className="calm-nav">
        <a
          href="#"
          aria-label={it ? "Torna alla presentazione" : "Back to showcase"}
        >
          <CtrlMark size={23} />
        </a>
        <div>
          <button
            className="calm-icon"
            onClick={() =>
              setPref("direction", state.prefs.direction === "A" ? "B" : "A")
            }
            aria-label={it ? "Cambia tema" : "Switch theme"}
          >
            <Icon
              name={state.prefs.direction === "A" ? "sun" : "moon"}
              size={18}
            />
          </button>
          <button className="calm-ghost" onClick={onSettings}>
            {it ? "Impostazioni" : "Settings"}
          </button>
        </div>
      </header>
      <div className="calm-content">
        <section className="calm-intro">
          <div>
            <span className="calm-eyebrow">
              {first
                ? it
                  ? "CIAO, SONO IL TUO +1"
                  : "HELLO, I’M YOUR PLUS ONE"
                : clock.toLocaleDateString(it ? "it-IT" : "en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
            </span>
            <h1>
              {first ? (
                it ? (
                  <>
                    La testa piena?
                    <br />
                    <em>Fai spazio.</em>
                  </>
                ) : (
                  <>
                    A lot on your mind?
                    <br />
                    <em>Make a little space.</em>
                  </>
                )
              ) : open.length === 0 ? (
                it ? (
                  <>
                    Tutto a posto.
                    <br />
                    <em>Vai a vivere.</em>
                  </>
                ) : (
                  <>
                    All clear.
                    <br />
                    <em>Go live a little.</em>
                  </>
                )
              ) : it ? (
                <>
                  Una cosa alla volta.
                  <br />
                  <em>Il resto può aspettare.</em>
                </>
              ) : (
                <>
                  One thing at a time.
                  <br />
                  <em>The rest can wait.</em>
                </>
              )}
            </h1>
            <p>
              {first
                ? it
                  ? "Scrivi un pensiero. Lo trasformiamo in qualcosa di più leggero, prima di chiederti qualsiasi altra cosa."
                  : "Start with a thought. We’ll turn it into something lighter before asking you anything else."
                : it
                  ? "Nessun punteggio. Nessuna corsa. Solo quello che conta."
                  : "No score to keep. No race to win. Just what matters."}
            </p>
          </div>
          <div className="calm-companion" aria-hidden="true">
            <span>✳</span>
            <small>{it ? "CI PENSIAMO INSIEME" : "A LITTLE LESS NOISE"}</small>
          </div>
        </section>
        <button className="home-capture" onClick={onCompose}>
          <span className="capture-plus">+</span>
          <span>
            {it ? "Cosa hai in testa?" : "What’s on your mind?"}
            <small>
              {it
                ? "Scrivi come parli. Al resto pensiamo insieme."
                : "Write it like you’d say it. We’ll take it from there."}
            </small>
          </span>
          <Icon name="arrow" size={23} />
        </button>
        {first && (
          <div className="first-use-note">
            <span>01 / {it ? "SCRIVI" : "SAY IT"}</span>
            <span>02 / {it ? "CONTROLLA" : "MAKE IT YOURS"}</span>
            <span>03 / {it ? "RESPIRA" : "EXHALE"}</span>
            <p>
              {it
                ? "Nessun account, nessun questionario. Le preferenze arrivano quando vuoi."
                : "No account, no questionnaire. Your preferences can come later."}
            </p>
          </div>
        )}
        {!first && (
          <>
            <div className="home-tools">
              <span className="calm-eyebrow">
                {it ? "IL TUO SPAZIO" : "YOUR HEADSPACE"}
              </span>
              <button className="calm-ghost" onClick={onProfile}>
                {it ? "Rendilo più tuo ↗" : "Make this more you ↗"}
              </button>
            </div>
            {parents.length > 0 && (
              <div
                className="cluster-filters"
                role="group"
                aria-label={
                  it ? "Filtra costellazioni" : "Filter constellations"
                }
              >
                <button aria-pressed={!filter} onClick={() => setFilter(null)}>
                  {it ? "Tutto" : "Everything"}
                </button>
                {parents.map((parent) => (
                  <button
                    key={parent.id}
                    aria-pressed={filter === parent.clusterId}
                    onClick={() => setFilter(parent.clusterId)}
                  >
                    ✳ {parent.title}
                  </button>
                ))}
              </div>
            )}
            {filter &&
              parents.find((parent) => parent.clusterId === filter) && (
                <div className="saved-plan-bar">
                  <span>
                    <strong>
                      {
                        parents.find((parent) => parent.clusterId === filter)
                          .title
                      }
                    </strong>
                    <small>
                      {
                        state.reminders.filter(
                          (item) => item.clusterId === filter && !item.done,
                        ).length
                      }{" "}
                      {it ? "ancora da fare" : "still to do"}
                    </small>
                  </span>
                  <button
                    className="calm-primary"
                    onClick={() =>
                      onPlan(
                        parents.find((parent) => parent.clusterId === filter),
                      )
                    }
                  >
                    {it ? "Apri costellazione ↗" : "Open constellation ↗"}
                  </button>
                </div>
              )}
            {state.prefs.profile.permWeather &&
              state.prefs.profile.permLocation && (
                <WeatherBanner
                  theme={state.prefs.direction}
                  onAddReminder={store.addReminder}
                />
              )}
            <div className="home-lanes">
              {lanes.map((lane) => {
                const items = active
                  .filter((r) => laneFor(r, clock) === lane.key)
                  .sort((a, b) =>
                    `${a.date || ""}${a.time || "99"}`.localeCompare(
                      `${b.date || ""}${b.time || "99"}`,
                    ),
                  );
                return (
                  <section
                    className={`home-lane ${items.length ? "" : "is-empty"}`}
                    key={lane.key}
                  >
                    <header>
                      <h2>{lane.label}</h2>
                      <span>{items.length.toString().padStart(2, "0")}</span>
                    </header>
                    <p>{lane.sub}</p>
                    {items.map((r) => (
                      <article className="calm-reminder" key={r.id}>
                        <div className="reminder-topline">
                          <span>
                            {r.clusterId ? "✳ " : ""}
                            {dateLabel(r, lang)}
                          </span>
                          {r.date &&
                            r.date < localDate(clock) &&
                            r.repeat !== "daily" && (
                              <small>
                                {it ? "In sospeso" : "Still waiting"}
                              </small>
                            )}
                        </div>
                        <div className="reminder-main">
                          <button
                            className="reminder-check"
                            onClick={() => onAction(r, "done")}
                            aria-label={`${it ? "Completa" : "Complete"}: ${r.title}`}
                          >
                            <Icon name="check" size={15} />
                          </button>
                          <button
                            className="reminder-edit"
                            onClick={() => onEdit(r)}
                          >
                            <strong>{r.title}</strong>
                            {r.body && <p>{r.body}</p>}
                          </button>
                        </div>
                        <footer>
                          {r.kind === "child" ? (
                            <span>
                              {
                                parents.find((p) => p.clusterId === r.clusterId)
                                  ?.title
                              }
                            </span>
                          ) : (
                            <span>
                              {r.kind === "parent" ? (
                                <button
                                  className="open-plan-link"
                                  onClick={() => onPlan(r)}
                                >
                                  {it ? "Apri piano ↗" : "Open plan ↗"}
                                </button>
                              ) : (
                                r.tag
                              )}
                            </span>
                          )}
                          <button
                            onClick={() => onAction(r, "snooze")}
                            aria-label={`${it ? "Rimanda di 10 minuti" : "Snooze 10 minutes"}: ${r.title}`}
                          >
                            +10 min
                          </button>
                        </footer>
                      </article>
                    ))}
                    {!items.length && (
                      <div className="lane-empty">
                        {it ? "Spazio libero." : "A little breathing room."}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
            {completed.length > 0 && (
              <details className="completed-list">
                <summary>
                  {it
                    ? "Fatto, e fuori dalla testa"
                    : "Done, and off your mind"}{" "}
                  · {completed.length}
                </summary>
                {completed.map((r) => (
                  <div key={r.id}>
                    <button
                      className="completed-edit"
                      onClick={() => onEdit(r)}
                      aria-label={`${it ? "Modifica completato" : "Edit completed reminder"}: ${r.title}`}
                    >
                      {r.title}
                    </button>
                    <button
                      className="calm-ghost"
                      onClick={() => onAction(r, "done")}
                    >
                      {it ? "Riapri" : "Reopen"}
                    </button>
                  </div>
                ))}
              </details>
            )}
            <aside className="notification-note">
              <span>
                <strong>
                  {it
                    ? "Una spinta, quando serve."
                    : "One nudge, when it matters."}
                </strong>
                <small>
                  {isNative()
                    ? it
                      ? "Le notifiche usano i permessi e gli orari del dispositivo."
                      : "Notifications use your device permissions and quiet hours."
                    : it
                      ? "Sul web le notifiche funzionano mentre la pagina resta aperta."
                      : "On the web, notifications work while this page stays open."}
                </small>
                {permissionNote && (
                  <small role="status">{permissionNote}</small>
                )}
              </span>
              <button className="calm-ghost" onClick={enableNotifications}>
                {it ? "Abilita notifiche" : "Enable notifications"}
              </button>
            </aside>
          </>
        )}
        <footer className="calm-footer">
          <span>
            {it
              ? "UN PENSIERO IN MENO. UN PO’ PIÙ DI VITA."
              : "ONE LESS MENTAL TAB. A LITTLE MORE LIFE."}
          </span>
          <span>CTRL + Me</span>
        </footer>
      </div>
    </div>
  );
}
