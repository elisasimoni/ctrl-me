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

// Returns a compact string to prepend to the user message.
// Kept short so it adds ~50-100 tokens max.
export function memoryBlock() {
  const { facts } = loadMemory();
  if (!facts.length) return '';
  return `What I know about this user:\n${facts.map(f => `- ${f}`).join('\n')}\n\n`;
}
