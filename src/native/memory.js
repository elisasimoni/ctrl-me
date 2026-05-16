// Lightweight user memory — persisted in localStorage.
// Injected into each Haiku call as a short prefix in the USER message,
// so the cached system prompt never changes (no cache invalidation).

const KEY = 'ctrlme.memory.v1';
const MAX_FACTS = 20;

export function loadMemory() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : { facts: [] };
  } catch { return { facts: [] }; }
}

export function saveMemory(mem) {
  try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch {}
}

export function addFact(fact) {
  const mem = loadMemory();
  // Avoid exact duplicates
  if (mem.facts.includes(fact)) return;
  mem.facts = [fact, ...mem.facts].slice(0, MAX_FACTS);
  saveMemory(mem);
}

export function removeFact(index) {
  const mem = loadMemory();
  mem.facts.splice(index, 1);
  saveMemory(mem);
}

export function clearMemory() {
  saveMemory({ facts: [] });
}

// Compact profile summary built from the onboarding questionnaire.
function profileSummary(profile) {
  if (!profile) return '';
  const bits = [];
  if (profile.name) bits.push(`name: ${profile.name}`);
  if (profile.tone) bits.push(`preferred tone: ${profile.tone}`);
  if (profile.directTone === false) bits.push('prefers soft phrasing');
  if (profile.directTone === true) bits.push('ok with direct talk');
  if (profile.wakeHour != null && profile.sleepHour != null) {
    bits.push(`awake ${String(profile.wakeHour).padStart(2,'0')}:00–${String(profile.sleepHour).padStart(2,'0')}:00`);
  }
  if (profile.occupation) bits.push(`role: ${profile.occupation}`);
  if (profile.noWorkDays?.length) bits.push(`no-work days: ${profile.noWorkDays.join(',')}`);
  if (profile.areas?.length) bits.push(`focus areas: ${profile.areas.join(',')}`);
  if (profile.onSkip) bits.push(`on skip: ${profile.onSkip}`);
  if (profile.insistence) bits.push(`pressure: ${profile.insistence}`);
  if (profile.eveningCheckin) bits.push('opted into evening check-in');
  return bits.length ? `User profile: ${bits.join('; ')}.` : '';
}

// Returns a compact string to prepend to the user message.
// Kept short so it adds ~80-200 tokens max.
export function memoryBlock(profile, behavior = '') {
  const { facts } = loadMemory();
  const summary = profileSummary(profile);
  const factsLine = facts.length
    ? `What I know about this user:\n${facts.map(f => `- ${f}`).join('\n')}`
    : '';
  const lines = [summary, behavior, factsLine].filter(Boolean);
  if (!lines.length) return '';
  return lines.join('\n') + '\n\n';
}
