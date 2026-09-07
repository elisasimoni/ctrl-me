import React, { useEffect, useRef, useState } from "react";
import { CtrlMark, Icon } from "../atoms.jsx";
import { useT } from "../i18n.jsx";
import { addFact } from "../native/memory.js";
import { behaviorSummary } from "../lib/behavior.js";
import { isDailyReminder } from "../native/notifications.js";
import { analyzeReminder, isLlmEnabled } from "../lib/llm.js";
import {
  planLocally,
  planFromAI,
  dateLabel,
  whenFor,
  validDate,
  validTime,
} from "../lib/planning.js";

export function ThoughtCapture({ onClose, onSave, store, initial }) {
  const { lang } = useT();
  const it = lang === "it";
  const dialog = useRef(null);
  const editor = useRef(null);
  const request = useRef(0);
  const controller = useRef(null);
  const [text, setText] = useState("");
  const [plan, setPlan] = useState(
    initial
      ? {
          parent: {
            body: "",
            ...initial,
            repeat: isDailyReminder(initial) ? "daily" : "none",
          },
          children: [],
          source: "edit",
        }
      : null,
  );
  const [selected, setSelected] = useState(0);
  const [dropped, setDropped] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    dialog.current.showModal();
    return () => {
      request.current += 1;
      controller.current?.abort();
    };
  }, []);
  const close = () => {
    request.current += 1;
    controller.current?.abort();
    onClose();
  };
  async function analyze() {
    if (!text.trim() || busy) return;
    const id = ++request.current;
    setBusy(true);
    setNotice("");
    let result;
    if (isLlmEnabled()) {
      controller.current = new AbortController();
      const timeout = setTimeout(() => controller.current.abort(), 20000);
      try {
        const ai = await analyzeReminder({
          text: text.trim(),
          lang,
          personality: store.state.prefs.personality,
          profile: store.state.prefs.profile,
          behavior: behaviorSummary(store.state.behaviorLog),
          signal: controller.current.signal,
          persistMemory: false,
        });
        result = {
          ...planFromAI(ai, text.trim(), lang),
          newFacts: ai.new_facts || [],
        };
      } catch {
        result = planLocally(text.trim(), lang);
        if (id === request.current)
          setNotice(
            it
              ? "AI non disponibile. Ho preparato una bozza locale da controllare."
              : "AI unavailable. Here’s a local draft to review.",
          );
      } finally {
        clearTimeout(timeout);
      }
    } else result = planLocally(text.trim(), lang);
    if (id !== request.current) return;
    setPlan(result);
    setSelected(0);
    setDropped([]);
    setBusy(false);
  }
  const nodes = plan ? [plan.parent, ...plan.children] : [];
  const kept = nodes.filter((_, i) => !dropped.includes(i));
  const invalid = kept.some(
    (n) =>
      !n.title.trim() ||
      (n.time &&
        (!validTime(n.time) || (!validDate(n.date) && n.repeat !== "daily"))) ||
      (n.date && !validDate(n.date)),
  );
  function selectNode(index) {
    setSelected(index);
    if (window.matchMedia('(max-width: 740px)').matches) {
      requestAnimationFrame(() => editor.current?.scrollIntoView({ block: 'start', behavior: 'instant' }));
    }
  }
  function edit(patch) {
    setPlan((p) =>
      selected === 0
        ? { ...p, parent: { ...p.parent, ...patch } }
        : {
            ...p,
            children: p.children.map((n, i) =>
              i === selected - 1 ? { ...n, ...patch } : n,
            ),
          },
    );
  }
  function save() {
    if (invalid) return;
    (plan.newFacts || []).forEach((fact) => addFact(fact));
    const clean = (n) => ({
      ...n,
      title: n.title.trim(),
      when: whenFor(n.time),
    });
    onSave({
      parent: clean(plan.parent),
      children: plan.children
        .filter((_, i) => !dropped.includes(i + 1))
        .map(clean),
      droppedChildren: plan.children.filter((_, i) => dropped.includes(i + 1)),
    });
  }
  const examples = it
    ? [
        "Presentazione domani alle 10",
        "Treno sabato alle 9",
        "Chiamare mamma domani alle 19",
      ]
    : [
        "Presentation tomorrow at 10",
        "Train on Saturday at 9",
        "Call Mum tomorrow at 7pm",
      ];
  return (
    <dialog
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      className={`thought-dialog ${store.state.prefs.direction === "A" ? "calm-dark" : ""}`}
      aria-labelledby="capture-title"
    >
      <header className="capture-header">
        <CtrlMark size={20} />
        <button
          className="calm-icon"
          onClick={close}
          aria-label={it ? "Chiudi" : "Close"}
        >
          ×
        </button>
      </header>
      {!plan ? (
        <div className="capture-compose">
          <span className="calm-eyebrow">
            {it ? "UN PENSIERO IN MENO" : "ONE LESS MENTAL TAB"}
          </span>
          <h1 id="capture-title">
            {it ? "Dillo come viene." : "Say it messy."}
          </h1>
          <p>
            {it
              ? "Non serve mettere tutto in ordine. Prima una bozza, poi decidi tu."
              : "No need to have it all figured out. First a draft. Then you decide."}
          </p>
          <label className="sr-only" htmlFor="thought">
            {it ? "Il tuo pensiero" : "Your thought"}
          </label>
          <textarea
            id="thought"
            autoFocus
            value={text}
            maxLength={1500}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                analyze();
              }
            }}
            placeholder={
              it
                ? "Ho un esame domani alle 10 e la testa piena…"
                : "I have a presentation tomorrow at 10 and a lot on my mind…"
            }
            rows={4}
            disabled={busy}
          />
          <div className="capture-examples">
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => setText(example)}
                disabled={busy}
              >
                {example} ↗
              </button>
            ))}
          </div>
          <button
            className="calm-primary"
            disabled={busy || !text.trim()}
            onClick={analyze}
          >
            {busy
              ? it
                ? "Preparo una bozza…"
                : "Making a little space…"
              : it
                ? "Mettiamo ordine"
                : "Make a little space"}{" "}
            <Icon name="arrow" size={18} />
          </button>
          <p className="capture-footnote">
            {isLlmEnabled()
              ? it
                ? "Analisi AI attiva. Controlli tutto prima di salvare."
                : "AI analysis is connected. You review everything before saving."
              : it
                ? "Funziona sul dispositivo. Date e orari semplici, idee facoltative per prepararti."
                : "Works on your device. Simple dates and times, optional ideas to get ready."}
          </p>
        </div>
      ) : (
        <>
          <div className="review-heading">
            <span className="calm-eyebrow">
              {initial
                ? it
                  ? "IL TUO PROMEMORIA"
                  : "YOUR REMINDER"
                : it
                  ? "BOZZA · NON ANCORA SALVATA"
                  : "DRAFT · NOT SAVED YET"}
            </span>
            <h1 id="capture-title">
              {nodes.length > 1
                ? it
                  ? "Il grande giorno. E tutto il resto."
                  : "The big thing. And the little things."
                : it
                  ? "Un pensiero più leggero."
                  : "A little lighter already."}
            </h1>
            <p>
              {plan.why ||
                (it
                  ? "Controlla titolo, data e ora. Puoi anche lasciarlo senza orario."
                  : "Check the title, date and time. It’s fine to leave it unscheduled.")}
            </p>
          </div>
          {notice && (
            <p className="review-notice" role="status">
              {notice}
            </p>
          )}
          {plan.followups?.length > 0 && (
            <p className="review-notice">
              {it ? "Dettagli da chiarire: " : "Details to clarify: "}
              {plan.followups.join(" ")}{" "}
              {it
                ? "Completa la bozza qui sotto o torna al testo."
                : "Fill in the draft below or go back to your thought."}
            </p>
          )}
          <div
            className={`review-layout ${nodes.length === 1 ? "single-review" : ""}`}
          >
            {nodes.length > 1 && (
              <div className="constellation-panel">
                <div
                  className="constellation-map"
                  aria-label={
                    it
                      ? "Scegli un nodo da modificare"
                      : "Choose a node to edit"
                  }
                >
                  <svg viewBox="0 0 360 300" preserveAspectRatio="none" aria-hidden="true">
                    {plan.children.map((_, i) => {
                      const angle =
                        -Math.PI / 2 + (i * 2 * Math.PI) / plan.children.length;
                      return (
                        <line
                          key={i}
                          x1="180"
                          y1="150"
                          x2={180 + Math.cos(angle) * 122}
                          y2={150 + Math.sin(angle) * 110}
                          className={
                            dropped.includes(i + 1) ? "line-dropped" : ""
                          }
                        />
                      );
                    })}
                    <circle cx="180" cy="150" r="110" />
                  </svg>
                  <button
                    className={`constellation-center ${selected === 0 ? "node-selected" : ""}`}
                    onClick={() => selectNode(0)}
                    aria-pressed={selected === 0}
                    aria-label={
                      it ? "Modifica evento principale" : "Edit main event"
                    }
                  >
                    <span>✳</span>
                    <small>{it ? "IL GRANDE GIORNO" : "THE BIG THING"}</small>
                  </button>
                  {plan.children.map((child, i) => {
                    const angle =
                      -Math.PI / 2 + (i * 2 * Math.PI) / plan.children.length;
                    return (
                      <button
                        key={i}
                        className={`constellation-dot ${selected === i + 1 ? "node-selected" : ""} ${dropped.includes(i + 1) ? "node-dropped" : ""}`}
                        style={{
                          left: `${(180 + Math.cos(angle) * 122) / 3.6}%`,
                          top: `${(150 + Math.sin(angle) * 110) / 3}%`,
                        }}
                        onClick={() => selectNode(i + 1)}
                        aria-pressed={selected === i + 1}
                        aria-label={`${it ? "Modifica" : "Edit"}: ${child.title}`}
                      >
                        <Icon
                          name={child.icon === "pin" ? "pin" : "spark"}
                          size={18}
                        />
                        <span>{i + 1}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="node-list">
                  {nodes.map((node, i) => (
                    <button
                      className={`${selected === i ? "active-node" : ""} ${dropped.includes(i) ? "node-dropped" : ""}`}
                      key={i}
                      onClick={() => selectNode(i)}
                      aria-pressed={selected === i}
                    >
                      <span>{i === 0 ? "✳" : String(i).padStart(2, "0")}</span>
                      <span>
                        <strong>{node.title}</strong>
                        <small>{dateLabel(node, lang)}</small>
                      </span>
                      <span>↗</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="node-editor" key={selected} ref={editor}>
              <div className="editor-label">
                <span className="calm-eyebrow">
                  {selected === 0
                    ? it
                      ? "IL TUO PROMEMORIA"
                      : "YOUR REMINDER"
                    : `${it ? "PREPARATIVO" : "PREPARATION"} ${selected}`}
                </span>
                {selected > 0 && (
                  <button
                    className="keep-toggle"
                    aria-pressed={!dropped.includes(selected)}
                    onClick={() =>
                      setDropped((d) =>
                        d.includes(selected)
                          ? d.filter((i) => i !== selected)
                          : [...d, selected],
                      )
                    }
                  >
                    {dropped.includes(selected)
                      ? it
                        ? "+ Ripristina"
                        : "+ Keep this"
                      : it
                        ? "✓ Incluso"
                        : "✓ Keeping this"}
                  </button>
                )}
              </div>
              <label>
                {it ? "Cosa vuoi ricordare" : "What to remember"}
                <input
                  value={nodes[selected].title}
                  maxLength={240}
                  onChange={(e) => edit({ title: e.target.value })}
                />
              </label>
              <div className="editor-schedule">
                <label>
                  {it ? "Data" : "Date"}
                  <input
                    type="date"
                    value={nodes[selected].date || ""}
                    onChange={(e) => edit({ date: e.target.value || null })}
                  />
                </label>
                <label>
                  {it ? "Ora" : "Time"}
                  <input
                    type="time"
                    value={nodes[selected].time || ""}
                    onChange={(e) => edit({ time: e.target.value || null })}
                  />
                </label>
              </div>
              <label>
                {it ? "Ripeti" : "Repeat"}
                <select
                  value={nodes[selected].repeat || "none"}
                  onChange={(e) => edit({ repeat: e.target.value })}
                >
                  <option value="none">{it ? "Una volta" : "Just once"}</option>
                  <option value="daily">
                    {it ? "Ogni giorno" : "Every day"}
                  </option>
                </select>
              </label>
              <label>
                {it ? "Un dettaglio, se serve" : "A detail, if it helps"}
                <textarea
                  rows={2}
                  maxLength={600}
                  value={nodes[selected].body}
                  onChange={(e) => edit({ body: e.target.value })}
                />
              </label>
              <p className="schedule-hint">
                {nodes[selected].time &&
                !nodes[selected].date &&
                nodes[selected].repeat !== "daily"
                  ? it
                    ? "Scegli anche la data: non voglio indovinare il giorno."
                    : "Choose a date too. Let’s not guess which day."
                  : !nodes[selected].time
                    ? it
                      ? "Senza ora resta nella lista. Nessuna notifica programmata."
                      : "Without a time, it stays on your list. No notification scheduled."
                    : it
                      ? "Controlla che data e ora siano quelle giuste."
                      : "Make sure the date and time are the ones you mean."}
              </p>
              {selected > 0 && (
                <p className="capture-footnote">
                  {it
                    ? "È un suggerimento. Tocca “Incluso” per escluderlo."
                    : "This is a suggestion. Tap “Keeping this” to leave it out."}
                </p>
              )}
            </div>
          </div>
          <footer className="review-footer">
            <button
              className="calm-ghost"
              onClick={() => (initial ? close() : setPlan(null))}
            >
              {it ? "Indietro" : "Back"}
            </button>
            <div>
              {invalid && (
                <small role="status">
                  {it
                    ? "Controlla titoli, date e orari."
                    : "Check titles, dates and times."}
                </small>
              )}
              <button
                className="calm-primary"
                onClick={save}
                disabled={invalid}
              >
                {initial
                  ? it
                    ? "Salva modifiche"
                    : "Save changes"
                  : `${it ? "Salva" : "Save"} ${kept.length} ${it ? (kept.length === 1 ? "promemoria" : "promemoria") : kept.length === 1 ? "reminder" : "reminders"}`}{" "}
                <Icon name="check" size={18} />
              </button>
            </div>
          </footer>
        </>
      )}
    </dialog>
  );
}
