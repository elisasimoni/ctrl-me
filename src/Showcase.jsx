import React, { useEffect, useRef, useState } from "react";
import { CtrlMark, Icon } from "./atoms.jsx";
import "./showcase.css";

const scenes = [
  {
    label: "The big day",
    text: "Presentation tomorrow at 10. Remind me to rehearse, pack my charger and leave on time.",
    title: "Walk in ready.",
    tag: "PRESENTATION",
    icon: "spark",
    cards: [
      [
        "Tonight · 19:00",
        "One last run-through.",
        "Ten minutes. Say the tricky bit out loud.",
      ],
      [
        "Tomorrow · 08:30",
        "Charger. Slides. Deep breath.",
        "Your bag, minus the last-minute panic.",
      ],
      [
        "Tomorrow · 09:15",
        "Time to head out.",
        "A little breathing room before 10.",
      ],
    ],
  },
  {
    label: "Everyday brain",
    text: "Water the plants at 6, call Mum at 7 and please remind me to get some groceries at 8.",
    title: "Life, a little lighter.",
    tag: "EVERYDAY",
    icon: "sun",
    cards: [
      [
        "Today · 18:00",
        "The plants are thirsty.",
        "A little water goes a long way.",
      ],
      ["Today · 19:00", "Give Mum a call.", "You don’t need a special reason."],
      [
        "Today · 20:00",
        "Pick up the groceries.",
        "Future you would like some dinner.",
      ],
    ],
  },
  {
    label: "Weekend escape",
    text: "Train on Saturday at 9. I need to pack Friday evening and grab my tickets before I leave.",
    title: "Less rush. More weekend.",
    tag: "WEEKEND",
    icon: "pin",
    cards: [
      [
        "Friday · 19:00",
        "Pack the good stuff.",
        "A change of clothes. A book. Done.",
      ],
      [
        "Saturday · 07:45",
        "Tickets? Got them.",
        "Keep them somewhere you can actually find.",
      ],
      [
        "Saturday · 08:00",
        "Your weekend starts now.",
        "Leave time for the station. Train at 9.",
      ],
    ],
  },
];

export default function Showcase() {
  const [scene, setScene] = useState(0);
  const [phase, setPhase] = useState("ready");
  const [done, setDone] = useState([]);
  const [dark, setDark] = useState(false);
  const timer = useRef();
  const current = scenes[scene];
  useEffect(() => {
    document.documentElement.lang = "en";
    return () => clearTimeout(timer.current);
  }, []);
  function select(index) {
    clearTimeout(timer.current);
    setScene(index);
    setPhase("ready");
    setDone([]);
  }
  function play() {
    clearTimeout(timer.current);
    setDone([]);
    setPhase("thinking");
    timer.current = setTimeout(() => setPhase("revealed"), 1100);
  }
  return (
    <main className="showcase">
      <nav className="show-nav" aria-label="Main navigation">
        <a href="#" className="show-brand" aria-label="CTRL+Me home">
          <CtrlMark size={25} />
        </a>
        <span className="nav-note">A LITTLE LESS ON YOUR MIND.</span>
        <a className="nav-github" href="https://github.com/elisasimoni/ctrl-me">
          GitHub <span>↗</span>
        </a>
        <a className="nav-open" href="#app">
          Open app <span>↗</span>
        </a>
      </nav>

      <section className="show-hero">
        <div className="hero-copy">
          <div className="show-eyebrow">
            <span className="live-dot" /> YOUR BRAIN’S NEW PLUS ONE
          </div>
          <h1>
            Life is messy.
            <br />
            Your head
            <br />
            can be <em>clear.</em>
            <span className="asterisk" aria-hidden="true">
              ✳
            </span>
          </h1>
          <p className="hero-description">
            The thought you almost forgot. The thing before the big thing. Just
            say it — CTRL+Me helps turn the mess into a plan.
          </p>
          <a className="hero-cta" href="#playground" onClick={play}>
            Give your brain a break <Icon name="arrow" size={22} />
          </a>
          <div className="hero-caption">
            NO ACCOUNT. NO STREAKS. NO GUILT TRIPS.
          </div>
          <div className="hero-bottom">
            <span className="tiny-key">⌘</span>
            <p>
              A reminder app with a little more feeling.
              <br />
              <strong>And a lot less noise.</strong>
            </p>
          </div>
        </div>

        <div className="demo-stage" id="playground">
          <div className="stage-top">
            <span>THE INTERACTIVE PLAYGROUND</span>
            <span>01 — 03</span>
          </div>
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="floating-note note-top">
            thoughts → breathing room <span>↴</span>
          </div>
          <div className={`demo-phone ${dark ? "demo-dark" : ""}`}>
            <div className="demo-status">
              <span>9:41</span>
              <span>••• ▰</span>
            </div>
            <div className="demo-phone-header">
              <CtrlMark size={19} />
              <button
                className="theme-toggle"
                aria-label={
                  dark ? "Switch to Pebble theme" : "Switch to OS theme"
                }
                onClick={() => setDark(!dark)}
              >
                <Icon name={dark ? "sun" : "moon"} />
              </button>
            </div>
            <div className="demo-greeting">
              A little space,
              <br />
              <em>just for you.</em>
            </div>
            <div className="demo-day">
              <span>YOUR DAY, UNTANGLED</span>
              <span>{done.length} / 3</span>
            </div>
            <div
              className="demo-results"
              aria-live="polite"
              aria-busy={phase === "thinking"}
            >
              {phase !== "revealed" ? (
                <div className="demo-idle">
                  <div
                    className={`demo-mascot ${phase === "thinking" ? "is-thinking" : ""}`}
                  >
                    <i />
                    <i />
                  </div>
                  <h3>
                    {phase === "thinking"
                      ? "Untangling the thought…"
                      : "A lot on your mind?"}
                  </h3>
                  <p>
                    {phase === "thinking"
                      ? "Finding the little things that help."
                      : "Pick a moment below. I’ll show you what a little help can look like."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="cluster-label">
                    <Icon name={current.icon} size={14} /> {current.tag}
                    <span>↗ 3 LINKED</span>
                  </div>
                  <h3 className="cluster-title">
                    {done.length === 3
                      ? "All clear. Go live a little."
                      : current.title}
                  </h3>
                  {current.cards.map(([time, title, body], i) => (
                    <button
                      key={`${scene}-${i}`}
                      className={`demo-card ${done.includes(i) ? "is-done" : ""}`}
                      style={{ "--i": i }}
                      aria-pressed={done.includes(i)}
                      onClick={() =>
                        setDone((items) =>
                          items.includes(i)
                            ? items.filter((n) => n !== i)
                            : [...items, i],
                        )
                      }
                    >
                      <span className="card-check">
                        {done.includes(i) && <Icon name="check" size={13} />}
                      </span>
                      <span>
                        <small>{time}</small>
                        <strong>{title}</strong>
                        <span className="card-body">{body}</span>
                      </span>
                    </button>
                  ))}
                </>
              )}
            </div>
            <div className="phone-bottom">
              <span>One nudge. When it matters.</span>
              <span>✳</span>
            </div>
          </div>
          <div className="floating-note note-bottom">
            less mental tabs.
            <br />
            <em>more actual life.</em>
          </div>
          <div className="demo-console">
            <div
              className="demo-tabs"
              role="group"
              aria-label="Choose a demo scenario"
            >
              {scenes.map((item, i) => (
                <button
                  key={item.label}
                  aria-pressed={scene === i}
                  onClick={() => select(i)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="demo-prompt">
              <span>“{current.text}”</span>
              <button
                onClick={play}
                disabled={phase === "thinking"}
                aria-label="Run interactive demo"
              >
                <Icon name="arrow" size={23} />
              </button>
            </div>
            <div className="demo-disclaimer">
              <span>
                {phase === "revealed"
                  ? "✓ Try checking off a reminder above."
                  : "↑ Pick a thought. See it become a plan."}
              </span>
              <span>Scripted preview · No AI call</span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="show-principles"
        aria-label="What makes CTRL+Me different"
      >
        <article>
          <span>01 / CAPTURE</span>
          <h2>Say it messy.</h2>
          <p>
            A sentence, not a form. The app finds the what and when, so you can
            keep moving.
          </p>
        </article>
        <article>
          <span>02 / CONNECT</span>
          <h2>See the little things.</h2>
          <p>
            With AI enabled, one big event can become a constellation of smaller
            reminders. You choose what stays.
          </p>
        </article>
        <article>
          <span>03 / EXHALE</span>
          <h2>Get on with living.</h2>
          <p>
            No score to protect. No streak to lose. Just a useful nudge and a
            quieter head.
          </p>
        </article>
      </section>
      <footer className="show-footer">
        <CtrlMark size={19} />
        <span>BUILT FOR REAL LIFE. OPEN SOURCE BY NATURE.</span>
        <a href="#app">Meet your plus one ↗</a>
      </footer>
    </main>
  );
}
