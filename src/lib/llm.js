// LLM analyzer — Haiku 4.5 with user memory + prompt caching.
//
// Architecture:
// - System prompt: rich + cached (cache_control ephemeral). Never changes.
// - User message: memory block (few facts) + the reminder text. Cheap, uncached.
// - Result: clean title, correct time, icon, body in personality+lang, new facts to save.
//
// SECURITY: dangerouslyAllowBrowser is fine for local dev.
// For production move to a /api/analyze server route.

import Anthropic from '@anthropic-ai/sdk';
import { memoryBlock, addFact } from '../native/memory.js';

const MODEL = 'claude-haiku-4-5';

let _client = null;
function client() {
  if (_client) return _client;
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-...') return null;
  _client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  return _client;
}

export function isLlmEnabled() { return client() !== null; }

const SYSTEM_PROMPT = `You are CTRL+Me, a smart reminder assistant inside a phone app.

Your job: turn a user's raw text into a clean, useful reminder.

OUTPUT: JSON only. Match the schema exactly. No prose, no markdown fences.

SCHEMA:
{
  "icon": one of "rain"|"pill"|"pin"|"wallet"|"spark"|"moon",
  "tag": short uppercase label ≤16 chars (e.g. "PILL · DAILY", "ESAME", "METEO", "BUDGET"),
  "title": clean short sentence, sentence case, period at end, MAX 7 WORDS. Extract the core action — NOT the full user text,
  "body": witty one-liner matching PERSONALITY and LANGUAGE (see below),
  "time": "HH:MM" 24h format if mentioned, else null,
  "when": one of "morning"|"noon"|"afternoon"|"evening"|"later",
  "new_facts": array of short strings — facts about the user worth remembering for future calls (routines, schedules, preferences). Max 3 per call. Empty array if nothing new,
  "needs_followup": true only if a critical detail is missing AND you cannot infer it,
  "followups": 1-2 short questions in user's language if needs_followup is true, else []
}

ICONS:
  rain   → weather, umbrella, rain, outdoor clothing
  pill   → medication, vitamins, health routines
  pin    → location, address, place, exam room, appointment
  wallet → money, budget, spending, takeout
  moon   → sleep, bedtime, night routines
  spark  → everything else

TITLE rules:
  - MAX 7 words. Extract the core action, do NOT copy the full sentence.
  - Good: "Thyroid pill at 9:00." / "Pillola tiroide alle 9." / "Exam building C, room 204."
  - Bad: "Remember i take tiroid pill every morning 15 min before breakfast..."

TIME rules:
  - Parse times from natural language: "at 9", "alle 9", "9am", "9:00" → "09:00"
  - "morning" without specific time → null (do not guess)
  - "before breakfast", "after lunch" → infer from user's known schedule if in memory

BODY personalities (match language EN or IT):
  chill → calm, terse. EN: "Noted." / IT: "Segnato."
  buddy → warm, slightly clever. EN: "On it. I'll remind you." / IT: "Ci penso io."
  hype  → energetic, caps ok. EN: "LOCKED IN." / IT: "FATTO."

IT body must be natural Gen Z Italian. Never literal. Use: tipo, tranqui, occhio, fidati, raga, dai.

new_facts — save only recurring routines or permanent info, NOT one-off events:
  GOOD: "takes thyroid pill at 9:00 daily", "wakes up at 8:50", "exam building is C room 204"
  BAD: "has exam tomorrow" (one-off), "ordered takeout today" (one-off)

EXAMPLES:

Input: { text: "remember i take tiroid pill every morning 15 min before breakfast i usually get up at 8:50 so remember me at 9", lang: "en", personality: "buddy" }
Output: {"icon":"pill","tag":"PILL · DAILY","title":"Thyroid pill at 9:00.","body":"Every morning at 9. I've got it.","time":"09:00","when":"morning","new_facts":["takes thyroid pill at 9:00 daily","wakes up at 8:50"],"needs_followup":false,"followups":[]}

Input: { text: "ho un esame domani", lang: "it", personality: "buddy" }
Output: {"icon":"pin","tag":"ESAME","title":"Esame domani.","body":"Ok. Dove e a che ora?","time":null,"when":"later","new_facts":[],"needs_followup":true,"followups":["Che ora?","In che aula?"]}

Input: { text: "ricordami la pillola alle 12", lang: "it", personality: "chill" }
Output: {"icon":"pill","tag":"PILLOLA · OGNI GIORNO","title":"Pillola alle 12:00.","body":"Segnato.","time":"12:00","when":"noon","new_facts":["prende la pillola ogni giorno a mezzogiorno"],"needs_followup":false,"followups":[]}

Input: { text: "budget takeout 50 euro this week", lang: "en", personality: "hype" }
Output: {"icon":"wallet","tag":"BUDGET","title":"Takeout budget: €50.","body":"BUDGET MODE ON. Let's go.","time":null,"when":"later","new_facts":["weekly takeout budget is €50"],"needs_followup":false,"followups":[]}`;

const SCHEMA = {
  type: 'object',
  properties: {
    icon:           { type: 'string', enum: ['rain','pill','pin','wallet','spark','moon'] },
    tag:            { type: 'string' },
    title:          { type: 'string' },
    body:           { type: 'string' },
    time:           { type: ['string','null'] },
    when:           { type: 'string', enum: ['morning','noon','afternoon','evening','later'] },
    new_facts:      { type: 'array', items: { type: 'string' } },
    needs_followup: { type: 'boolean' },
    followups:      { type: 'array', items: { type: 'string' } },
  },
  required: ['icon','tag','title','body','time','when','new_facts','needs_followup','followups'],
  additionalProperties: false,
};

export async function analyzeReminder({ text, lang, personality }) {
  const c = client();
  if (!c) throw new Error('LLM not configured');

  // Memory goes in the USER message so system prompt stays cached
  const memory = memoryBlock();
  const userContent = `${memory}Input: ${JSON.stringify({ text, lang, personality })}\n\nOutput as JSON.`;

  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userContent }],
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
  });

  const block = response.content.find(b => b.type === 'text');
  if (!block) throw new Error('No text in response');
  const result = JSON.parse(block.text);

  // Persist new facts for future calls
  (result.new_facts ?? []).forEach(f => addFact(f));

  return result;
}
