import React, { useEffect, useRef, useState } from 'react';
import { Pebble } from '../atoms.jsx';
import { useT } from '../i18n.jsx';

const DARK = '#0a0a0a';
const PAPER = '#f4f1ec';
const INK_DARK = '#f5f5f2';
const INK_LIGHT = '#0d0d0d';

const SPRING_K = 0.09;
const DAMPING = 0.72;
const THRESHOLD = 0.22; // fraction of width

export function ThemeChooser({ onPick }) {
  const { t, lang } = useT();
  const wrapRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef({ x: 0, vx: 0, dragging: false, startX: 0, lastX: 0, lastT: 0, width: 0 });
  const [, force] = useState(0);
  const [exiting, setExiting] = useState(null); // 'A' | 'B' | null

  // The loop only runs while something actually moves — dragging, springing
  // back, or flying off-screen. At rest it stops, so an untouched chooser costs
  // zero frames instead of re-rendering 60 times a second.
  const tick = () => {
    const s = stateRef.current;
    if (!s.dragging) {
      // spring back to 0
      const ax = -SPRING_K * s.x;
      s.vx = (s.vx + ax) * DAMPING;
      s.x += s.vx;
      if (Math.abs(s.x) < 0.4 && Math.abs(s.vx) < 0.4) {
        s.x = 0; s.vx = 0;
      }
    }
    force(n => (n + 1) & 0xffff);
    if (s.dragging || s.x !== 0 || s.vx !== 0) {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      rafRef.current = 0;
    }
  };

  const startLoop = () => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (el) stateRef.current.width = el.clientWidth;
    const onResize = () => { if (el) stateRef.current.width = el.clientWidth; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', onResize); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e) => {
    if (exiting) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const s = stateRef.current;
    s.dragging = true;
    startLoop();
    s.startX = e.clientX - s.x;
    s.lastX = e.clientX;
    s.lastT = performance.now();
    s.vx = 0;
  };
  const onPointerMove = (e) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const now = performance.now();
    const dt = Math.max(1, now - s.lastT);
    const nextX = e.clientX - s.startX;
    s.vx = (e.clientX - s.lastX) / dt * 16; // ~px per frame
    s.x = nextX;
    s.lastX = e.clientX;
    s.lastT = now;
  };
  const commit = (dir) => {
    setExiting(dir);
    const s = stateRef.current;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    // launch off-screen
    const target = dir === 'A' ? -s.width : s.width;
    const start = performance.now();
    const from = s.x;
    const dur = 380;
    const animate = (now) => {
      const k = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      s.x = from + (target - from) * eased;
      force(n => (n + 1) & 0xffff);
      if (k < 1) requestAnimationFrame(animate);
      else onPick?.(dir);
    };
    requestAnimationFrame(animate);
  };
  const onPointerUp = (e) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    s.dragging = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const w = s.width || 1;
    const ratio = s.x / w;
    if (ratio <= -THRESHOLD) commit('A');
    else if (ratio >= THRESHOLD) commit('B');
    // else: spring tick handles bounce
  };

  const s = stateRef.current;
  const w = s.width || 1;
  const ratio = Math.max(-1, Math.min(1, s.x / w));
  // background blend: -1 = dark left, +1 = warm right
  const tBlend = (ratio + 1) / 2;
  const blendedBg = `linear-gradient(90deg, ${DARK} 0%, ${PAPER} 100%)`;
  // mascot squish based on velocity
  const speed = Math.min(1, Math.abs(s.vx) / 30);
  const sx = 1 + speed * 0.18;
  const sy = 1 - speed * 0.12;
  const rot = ratio * 14;

  // arrow opacity grows as user pulls toward that side; fades on the opposite side
  const leftOp = Math.max(0.25, 0.45 - ratio * 0.5);
  const rightOp = Math.max(0.25, 0.45 + ratio * 0.5);
  const leftActive = ratio <= -0.05;
  const rightActive = ratio >= 0.05;

  // ink color for arrows: contrast against side
  const labelLeft = lang === 'it' ? 'OS' : 'OS';
  const labelRight = lang === 'it' ? 'Pebble' : 'Pebble';
  const hint = lang === 'it' ? 'trascinami' : 'drag me';
  const sub = lang === 'it' ? 'Scegli un tema' : 'Pick a theme';

  return (
    <div
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: blendedBg,
        touchAction: 'none', userSelect: 'none', cursor: 'grab',
      }}
    >
      {/* Subtitle top */}
      <div style={{
        position: 'absolute', top: 64, left: 0, right: 0, textAlign: 'center',
        fontFamily: "'Inter Tight', sans-serif", fontSize: 14, fontWeight: 500,
        letterSpacing: '-0.01em',
        color: tBlend < 0.5 ? 'rgba(245,245,242,0.7)' : 'rgba(13,13,13,0.6)',
        transition: 'color .2s',
      }}>{sub}</div>

      {/* Left affordance: ← OS */}
      <div className="ctrl-pulse" style={{
        position: 'absolute', top: '50%', left: 28, transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', gap: 10,
        opacity: leftOp, transition: 'opacity .2s',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: leftActive ? INK_DARK : 'rgba(245,245,242,0.75)',
      }}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>←</span>
        <span>{labelLeft}</span>
      </div>

      {/* Right affordance: Pebble → */}
      <div className="ctrl-pulse" style={{
        position: 'absolute', top: '50%', right: 28, transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', gap: 10,
        opacity: rightOp, transition: 'opacity .2s',
        fontFamily: "'Inter Tight', sans-serif",
        fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
        color: rightActive ? INK_LIGHT : 'rgba(13,13,13,0.6)',
      }}>
        <span>{labelRight}</span>
        <span style={{ fontSize: 20, lineHeight: 1 }}>→</span>
      </div>

      {/* Mascot */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: `translate(-50%, -50%) translateX(${s.x}px) rotate(${rot}deg) scale(${sx}, ${sy})`,
        willChange: 'transform',
      }}>
        <Pebble size={96} eyes={Math.abs(ratio) > 0.5 ? 'closed' : 'open'} />
      </div>

      {/* drag hint below mascot */}
      <div style={{
        position: 'absolute', top: 'calc(50% + 70px)', left: 0, right: 0, textAlign: 'center',
        transform: `translateX(${s.x * 0.6}px)`,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: tBlend < 0.5 ? 'rgba(245,245,242,0.55)' : 'rgba(13,13,13,0.45)',
        opacity: exiting ? 0 : 1, transition: 'opacity .2s, color .2s',
      }}>· {hint} ·</div>
    </div>
  );
}
