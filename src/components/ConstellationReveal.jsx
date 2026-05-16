import React, { useEffect, useState, useMemo } from 'react';
import { useT } from '../i18n.jsx';
import { Pebble, Icon } from '../atoms.jsx';
import { TOKENS } from './ProfileInputs.jsx';

// Renders a "constellation": parent reminder in the center, proposed
// children orbiting around it. User taps any child to toggle keep/drop,
// then confirms. Used after Haiku returns cluster.propose=true.
export function ConstellationReveal({
  parent, why, children, theme = 'B',
  onConfirm, onJustParent, onCancel,
}) {
  const { t, lang } = useT();
  const tok = TOKENS[theme];
  const N = children.length;

  // Each child starts "kept". Tap toggles.
  const [keep, setKeep] = useState(() => children.map(() => true));
  const toggle = (i) => setKeep(k => k.map((v, j) => j === i ? !v : v));

  // Reveal cadence: parent first, then children staggered.
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const tms = [setTimeout(() => setRevealed(1), 60)];
    children.forEach((_, i) => {
      tms.push(setTimeout(() => setRevealed(v => Math.max(v, i + 2)), 280 + i * 180));
    });
    return () => tms.forEach(clearTimeout);
  }, [children.length]);

  // Layout — center + ring of children. Tuned for ~360 wide viewport.
  const W = 340, H = 420;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(140, 90 + N * 8);

  const positions = useMemo(() => children.map((_, i) => {
    const angle = -Math.PI / 2 + (i / Math.max(1, N)) * 2 * Math.PI;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle), angle };
  }), [N, R]);

  const keptCount = keep.filter(Boolean).length;
  const totalToAdd = keptCount + 1; // parent + kept children
  const plural = lang === 'it'
    ? (totalToAdd === 1 ? 'a' : 'e')
    : (totalToAdd === 1 ? '' : 's');

  const handleConfirm = () => {
    const keptChildren = children.filter((_, i) => keep[i]);
    onConfirm(keptChildren);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: tok.bg, color: tok.ink,
      display: 'flex', flexDirection: 'column',
      fontFamily: tok.fontBody,
      overflow: 'hidden',
    }}>
      <Starfield tok={tok} />

      {/* Header */}
      <div style={{
        padding: '52px 22px 12px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        position: 'relative', zIndex: 2,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10.5, color: tok.dim,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            fontWeight: 600, marginBottom: 8,
          }}>{t('constellation.parentBadge')}</div>
          <h1 style={{
            fontFamily: tok.fontTitle, fontSize: 22, fontWeight: 700,
            letterSpacing: tok.titleLetter, lineHeight: 1.15,
            margin: 0, color: tok.ink, maxWidth: 280,
          }}>{t('constellation.title')}</h1>
          {why && <p style={{
            margin: '8px 0 0', fontSize: 13.5, lineHeight: 1.45,
            color: tok.dim, maxWidth: 290,
          }}>{why}</p>}
        </div>
        <button onClick={onCancel} aria-label="close" style={{
          background: 'transparent', border: 'none', color: tok.ink, cursor: 'pointer',
          fontSize: 26, padding: 0, lineHeight: 1, marginLeft: 8,
        }}>×</button>
      </div>

      {/* Constellation canvas */}
      <div style={{
        position: 'relative', flex: 1, minHeight: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ position: 'relative', width: W, height: H }}>
          {/* SVG connection lines */}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {positions.map((p, i) => {
              const isKept = keep[i];
              const isOn = revealed >= i + 2;
              return (
                <line key={i}
                  x1={cx} y1={cy} x2={p.x} y2={p.y}
                  stroke={tok.ink}
                  strokeWidth={1}
                  strokeDasharray={isKept ? '0' : '3 4'}
                  opacity={isOn ? (isKept ? 0.55 : 0.18) : 0}
                  style={{ transition: 'opacity .35s, stroke-dasharray .25s' }}
                />
              );
            })}
          </svg>

          {/* Parent at center */}
          <ParentNode tok={tok} x={cx} y={cy} parent={parent}
            visible={revealed >= 1} />

          {/* Children around */}
          {children.map((child, i) => (
            <ChildNode key={i}
              tok={tok}
              x={positions[i].x} y={positions[i].y}
              child={child}
              kept={keep[i]}
              visible={revealed >= i + 2}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div style={{
        padding: '8px 22px 28px',
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative', zIndex: 2,
      }}>
        <button onClick={handleConfirm} style={{
          height: 52, borderRadius: 100,
          background: tok.ink, color: tok.bg, border: 'none',
          fontFamily: tok.fontBody, fontSize: 15, fontWeight: 700,
          cursor: 'pointer', letterSpacing: '-0.01em',
        }}>
          {t('constellation.confirm', { n: totalToAdd, a: plural, s: plural })}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onJustParent} style={ghostBtn(tok)}>
            {t('constellation.justOne')}
          </button>
          <button onClick={onCancel} style={ghostBtn(tok, true)}>
            {t('constellation.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ghostBtn(tok, danger = false) {
  return {
    flex: 1, height: 44, borderRadius: 100,
    background: 'transparent',
    color: danger ? (tok === TOKENS.A ? '#ff8a8a' : '#c44') : tok.ink,
    border: `1.5px solid ${tok.hair}`,
    fontFamily: tok.fontBody, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', letterSpacing: '-0.005em',
  };
}

function ParentNode({ tok, x, y, parent, visible }) {
  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.4})`,
      opacity: visible ? 1 : 0,
      transition: 'transform .5s cubic-bezier(.2,.9,.3,1.4), opacity .35s',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 6,
    }}>
      <div className="ctrl-pulse" style={{
        padding: 6, borderRadius: 100,
        background: tok.bg,
        boxShadow: `0 0 0 2px ${tok.hair}`,
      }}>
        <Pebble size={84} />
      </div>
      <div style={{
        marginTop: 4, padding: '5px 12px',
        borderRadius: 100,
        background: tok.ink, color: tok.bg,
        fontFamily: tok.fontTitle, fontSize: 13, fontWeight: 700,
        letterSpacing: tok.titleLetter, maxWidth: 220,
        textAlign: 'center',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{parent.title}</div>
      {parent.time && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10, letterSpacing: '0.14em', color: tok.dim,
        }}>{parent.time}</div>
      )}
    </div>
  );
}

function ChildNode({ tok, x, y, child, kept, visible, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      position: 'absolute',
      left: x, top: y,
      transform: `translate(-50%, -50%) scale(${visible ? 1 : 0})`,
      opacity: visible ? (kept ? 1 : 0.42) : 0,
      transition: 'transform .55s cubic-bezier(.2,.9,.3,1.4), opacity .25s',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 4, width: 120,
      background: 'transparent', border: 'none', padding: 0,
      cursor: 'pointer',
      color: tok.ink, fontFamily: tok.fontBody,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 100,
        background: kept ? tok.ink : 'transparent',
        color: kept ? tok.bg : tok.ink,
        border: `1.5px solid ${kept ? tok.ink : tok.hair}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s',
      }}>
        <Icon name={iconName(child.icon)} size={18} stroke={kept ? tok.bg : tok.ink} sw={1.8} />
      </div>
      <div style={{
        fontSize: 11.5, fontWeight: 600,
        textAlign: 'center', lineHeight: 1.25,
        textDecoration: kept ? 'none' : 'line-through',
        letterSpacing: '-0.005em',
        maxWidth: 110,
      }}>{child.title}</div>
      {child.time && (
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9.5, letterSpacing: '0.12em', color: tok.dim,
        }}>{child.time}</div>
      )}
    </button>
  );
}

// Map our icon names to the atoms.jsx Icon component name.
function iconName(n) {
  switch (n) {
    case 'rain':   return 'umbrella';
    case 'pill':   return 'pill';
    case 'pin':    return 'pin';
    case 'wallet': return 'wallet';
    case 'moon':   return 'moon';
    case 'spark':  return 'plus';
    default:       return 'plus';
  }
}

// Very subtle dotted starfield in the background.
function Starfield({ tok }) {
  const dots = useMemo(() => Array.from({ length: 28 }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    s: 1 + Math.random() * 1.6,
    o: 0.18 + Math.random() * 0.32,
  })), []);
  return (
    <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      preserveAspectRatio="none" viewBox="0 0 100 100">
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.s * 0.18}
          fill={tok.ink} opacity={d.o} />
      ))}
    </svg>
  );
}
