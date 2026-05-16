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

// Three sensible alternative times derived from the user's profile.
// Skips the slot that matches the current `when` so the user always
// sees three NEW options.
export function suggestTimes(profile, currentWhen) {
  const wake = profile?.wakeHour ?? 8;
  const sleep = profile?.sleepHour ?? 23;
  const slots = [
    { time: pad(wake + 1), when: 'morning' },
    { time: '13:00',        when: 'afternoon' },
    { time: pad(Math.max(wake + 2, Math.min(sleep - 2, 20))), when: 'evening' },
  ];
  return slots.filter(s => s.when !== currentWhen).slice(0, 3);
}

function pad(h) {
  const n = Math.max(0, Math.min(23, h));
  return `${String(n).padStart(2, '0')}:00`;
}

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

// Silent streak: count of consecutive 'done' events starting from the
// most recent log entry. 'snooze' or 'undone' break the streak. Other
// event types ('created', 'rescheduled', 'cluster_created') are skipped
// over without breaking. We never show this to the user — it only
// flavours the LLM tone.
export function currentStreak(log) {
  if (!log?.length) return 0;
  let n = 0;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e.type === 'done') n += 1;
    else if (e.type === 'snooze' || e.type === 'undone') break;
    // skip 'created', 'rescheduled', 'cluster_created'
  }
  return n;
}

// Per-title reschedule habits over a wide window (4 weeks). Returns
// [{title, when, count}] for titles the user has rescheduled to the
// SAME 'when' slot 2+ times — i.e. learned preferences. Used by Haiku
// to pre-empt next time the user asks about the same thing.
export function reschedulingHabits(log, { windowMs = 4 * WEEK, threshold = 2 } = {}) {
  if (!log?.length) return [];
  const cutoff = Date.now() - windowMs;
  const counts = {}; // key = `${title}|${toWhen}`
  log.filter(e => e.type === 'rescheduled' && e.at >= cutoff && e.to?.when).forEach(e => {
    const key = `${e.title}|${e.to.when}`;
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return Object.entries(counts)
    .filter(([, n]) => n >= threshold)
    .map(([key, count]) => {
      const [title, when] = key.split('|');
      return { title, when, count };
    })
    .sort((a, b) => b.count - a.count);
}

// Top 1–2 short observations to feed into the LLM memory block.
// Always returns a string (possibly empty).
export function behaviorSummary(log) {
  if (!log?.length) return '';
  const recent = recentEvents(log, WEEK);
  if (!recent.length) return '';

  const bits = [];

  // Skipped patterns — up to 2 titles, so Haiku can match new creations
  // against a small set of "watch out" items.
  const skipped = frequentlySkipped(log).slice(0, 2);
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

  // Silent streak — Haiku can soften / tighten tone, must never name it.
  const streak = currentStreak(log);
  if (streak >= 5) bits.push(`silent streak: ${streak} consecutive completions (DO NOT mention)`);

  // Learned reschedule preferences — top 2
  const habits = reschedulingHabits(log).slice(0, 2);
  habits.forEach(h => {
    bits.push(`usually moves "${h.title}" to ${h.when}`);
  });

  return bits.length ? `Behavior: ${bits.join('; ')}.` : '';
}
