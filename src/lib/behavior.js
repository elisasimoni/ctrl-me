// Derive simple patterns from the behaviorLog so Haiku can react to them.
//
// We focus on signals the user would expect the app to notice:
//   - which reminders they keep skipping
//   - their done-vs-skip ratio in the last week
//   - peak hours when they actually complete things
//
// Output is intentionally tiny (1–3 short clauses, English) — meant to
// live next to the profile in the LLM memory block. We keep names/titles
// to give Haiku something concrete to mention if relevant.

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function recentEvents(log, windowMs = WEEK) {
  const cutoff = Date.now() - windowMs;
  return (log ?? []).filter(e => e.at >= cutoff);
}

// Returns the titles snoozed/dismissed >= threshold times in the last 7 days,
// sorted by frequency. Useful for surfacing inline "spesso saltato" badges.
export function frequentlySkipped(log, { windowMs = WEEK, threshold = 3 } = {}) {
  const counts = {};
  recentEvents(log, windowMs)
    .filter(e => e.type === 'snooze')
    .forEach(e => { counts[e.title] = (counts[e.title] ?? 0) + 1; });
  return Object.entries(counts)
    .filter(([, n]) => n >= threshold)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count);
}

// Structured stats consumed by Settings to render localized strings.
// Same window as behaviorSummary so the UI matches what the LLM sees.
export function behaviorStats(log, { windowMs = WEEK } = {}) {
  const recent = recentEvents(log ?? [], windowMs);
  const skipped = frequentlySkipped(log ?? [], { windowMs }).slice(0, 5);
  const done = recent.filter(e => e.type === 'done').length;
  const snoozed = recent.filter(e => e.type === 'snooze').length;
  const total = done + snoozed;
  const completionRate = total >= 5 ? done / total : null;
  const doneByWhen = { morning: 0, noon: 0, afternoon: 0, evening: 0, later: 0 };
  recent.filter(e => e.type === 'done').forEach(e => {
    if (e.when in doneByWhen) doneByWhen[e.when] += 1;
  });
  const peakEntry = Object.entries(doneByWhen).sort((a, b) => b[1] - a[1])[0];
  const peakWhen = peakEntry && peakEntry[1] >= 3 ? peakEntry[0] : null;
  return { skipped, completionRate, peakWhen, hasAnything: skipped.length > 0 || completionRate != null || peakWhen };
}

// Top 1–2 short observations to feed into the LLM memory block.
// Always returns a string (possibly empty).
export function behaviorSummary(log) {
  if (!log?.length) return '';
  const recent = recentEvents(log, WEEK);
  if (!recent.length) return '';

  const bits = [];

  // Skipped-pattern: top 1 title skipped 3+ times
  const skipped = frequentlySkipped(log).slice(0, 1);
  skipped.forEach(s => {
    bits.push(`has dismissed "${s.title}" ${s.count}× in last 7 days`);
  });

  // Done vs snooze ratio
  const done = recent.filter(e => e.type === 'done').length;
  const snoozed = recent.filter(e => e.type === 'snooze').length;
  if (done + snoozed >= 5) {
    const ratio = done / (done + snoozed);
    if (ratio < 0.4) bits.push('completes <40% of reminders this week');
    else if (ratio > 0.8) bits.push('completes >80% of reminders this week');
  }

  // Time-of-day completion bias
  const doneByWhen = { morning: 0, noon: 0, afternoon: 0, evening: 0, later: 0 };
  recent.filter(e => e.type === 'done').forEach(e => {
    if (e.when in doneByWhen) doneByWhen[e.when] += 1;
  });
  const top = Object.entries(doneByWhen).sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 3) bits.push(`most reliable in the ${top[0]}`);

  return bits.length ? `Behavior: ${bits.join('; ')}.` : '';
}
