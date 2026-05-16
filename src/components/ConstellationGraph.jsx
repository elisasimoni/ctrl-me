import React, { useMemo } from 'react';
import { useT } from '../i18n.jsx';
import { Icon } from '../atoms.jsx';
import { TOKENS } from './ProfileInputs.jsx';
import { listClusters } from '../lib/clusters.js';

// Full-screen view that shows every cluster as a small constellation card.
// Reached from Settings → "Vedi costellazioni".
export function ConstellationGraph({ open, onClose, reminders, theme = 'B' }) {
  const { t } = useT();
  if (!open) return null;
  const tok = TOKENS[theme];
  const clusters = listClusters(reminders);

  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-start',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', minHeight: '100%',
        background: tok.bg, color: tok.ink,
        fontFamily: tok.fontBody,
        padding: '52px 22px 32px',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10.5, color: tok.dim,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontWeight: 600, marginBottom: 6,
            }}>{t('graph.title')}</div>
            <h1 style={{
              fontFamily: tok.fontTitle, fontSize: 28, fontWeight: 700,
              letterSpacing: tok.titleLetter, lineHeight: 1.1, margin: 0,
            }}>
              {clusters.length}{' '}
              <span style={{ color: tok.dim, fontWeight: 500 }}>
                {clusters.length === 1 ? '·' : '·'}
              </span>
            </h1>
          </div>
          <button onClick={onClose} aria-label="close" style={{
            background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer',
            fontSize: 28, padding: 0, lineHeight: 1,
          }}>×</button>
        </div>

        {clusters.length === 0 ? (
          <div style={{
            marginTop: 80, fontSize: 14, color: tok.dim, textAlign: 'center',
            padding: '0 24px', lineHeight: 1.5,
          }}>{t('graph.empty')}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {clusters.map(c => (
              <MiniConstellation key={c.id} cluster={c} tok={tok} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniConstellation({ cluster, tok }) {
  const { parent, children } = cluster;
  const N = children.length;
  const W = 280, H = 200;
  const cx = W / 2, cy = H / 2;
  const R = Math.min(80, 50 + N * 6);

  const positions = useMemo(() => children.map((_, i) => {
    const angle = -Math.PI / 2 + (i / Math.max(1, N)) * 2 * Math.PI;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  }), [N, R]);

  const doneCount = children.filter(c => c.done).length + (parent.done ? 1 : 0);
  const total = children.length + 1;

  return (
    <div style={{
      position: 'relative',
      borderRadius: 22,
      background: tok === TOKENS.A ? 'rgba(245,245,242,0.04)' : 'rgba(255,255,255,0.5)',
      border: `1px solid ${tok.hair}`,
      padding: '16px 14px 14px',
      overflow: 'hidden',
    }}>
      {/* Header: parent title + progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{
          fontFamily: tok.fontTitle, fontSize: 16, fontWeight: 700,
          letterSpacing: tok.titleLetter, lineHeight: 1.2,
          maxWidth: 200,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{parent.title}</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10.5, color: tok.dim, letterSpacing: '0.1em',
        }}>{doneCount}/{total}</div>
      </div>

      {/* Constellation canvas */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: H }}>
        <svg width={W} height={H} style={{ overflow: 'visible' }}>
          {/* Lines */}
          {positions.map((p, i) => (
            <line key={i}
              x1={cx} y1={cy} x2={p.x} y2={p.y}
              stroke={tok.ink} strokeWidth={1}
              opacity={children[i].done ? 0.18 : 0.45}
            />
          ))}
          {/* Parent dot */}
          <circle cx={cx} cy={cy} r={14}
            fill={parent.done ? 'transparent' : tok.ink}
            stroke={tok.ink} strokeWidth={1.5}
          />
          {/* Children dots */}
          {children.map((child, i) => {
            const p = positions[i];
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r={7}
                  fill={child.done ? 'transparent' : tok.ink}
                  stroke={tok.ink} strokeWidth={1.5}
                  opacity={child.done ? 0.4 : 1}
                />
                <text x={p.x} y={p.y + 22}
                  fill={tok.ink} opacity={0.8}
                  fontSize={10} fontFamily={tok.fontBody}
                  textAnchor="middle">
                  {truncate(child.title, 18)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
