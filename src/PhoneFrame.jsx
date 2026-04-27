import React from 'react';

// Lightweight iOS-ish frame for the in-browser preview.
// On real mobile (when used as PWA), the frame collapses to fullscreen.
export function PhoneFrame({ children, fullscreen }) {
  if (fullscreen) {
    return (
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        background: '#000',
      }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 390, height: 844, position: 'relative',
        background: '#000',
        borderRadius: 56,
        padding: 12,
        boxShadow: '0 50px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05) inset',
      }}>
        <div style={{
          position: 'absolute', inset: 12,
          borderRadius: 44, overflow: 'hidden',
          background: '#000',
        }}>
          {children}
          {/* Dynamic island */}
          <div style={{
            position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
            width: 120, height: 36, borderRadius: 100, background: '#000', zIndex: 5,
          }} />
          {/* Home indicator */}
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            width: 134, height: 5, borderRadius: 100, background: 'rgba(255,255,255,0.55)',
            zIndex: 5, mixBlendMode: 'difference',
          }} />
        </div>
      </div>
    </div>
  );
}

// Detect if app is running in standalone (PWA-installed) mode
export function useIsStandalone() {
  const [standalone, setStandalone] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  });
  React.useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = (e) => setStandalone(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);
  return standalone;
}
