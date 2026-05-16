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

Your job: parse the user's raw text and return a clean reminder as JSON.

CRITICAL RULES — follow exactly:
1. "title" = MAX 5 WORDS. NEVER copy the raw text. Extract only the core action + time if present.
2. "body" = ALWAYS in the same language as the "lang" field. If lang=it → write in Italian. If lang=en → write in English.
3. "time" = parse any time mention ("alle 8", "at 8", "8am", "8:00") → "08:00". Never use current time.
4. "when" = derive from time: 05-11 → morning, 12 → noon, 13-17 → afternoon, 18-22 → evening, else → later.

OUTPUT: JSON only. No prose, no markdown.

FIELDS:
  icon        → "rain"|"pill"|"pin"|"wallet"|"spark"|"moon"
  tag         → uppercase ≤16 chars
  title       → ≤5 words, sentence case, ends with period
  body        → 1 witty line, correct lang+personality
  time        → "HH:MM" or null
  when        → "morning"|"noon"|"afternoon"|"evening"|"later"
  new_facts   → recurring facts worth remembering (max 3, empty array if none)
  needs_followup → true only if critical info is missing
  followups   → 1-2 short questions if needs_followup, else []

ICONS: rain=weather/umbrella, pill=meds/vitamins, pin=place/address, wallet=money/budget, moon=sleep, spark=other

BODY tone by personality:
  chill: terse. IT→"Segnato." EN→"Noted."
  buddy: warm+clever. IT→natural Gen Z ("Ci penso io, tranqui.") EN→"On it."
  hype: energetic. IT→"FATTO. Sei una macchina." EN→"LOCKED IN."
  IT body: use real Italian slang — tipo, tranqui, occhio, fidati, raga, dai. NEVER translate literally from English.

EXAMPLES (study these carefully):

Input: {"text":"ricordami pillola tutti i giorni alle 8","lang":"it","personality":"buddy"}
Output: {"icon":"pill","tag":"PILLOLA · OGNI GIORNO","title":"Pillola alle 8:00.","body":"Ci penso io, ogni mattina alle 8.","time":"08:00","when":"morning","new_facts":["prende la pillola ogni giorno alle 8:00"],"needs_followup":false,"followups":[]}

Input: {"text":"remember i take tiroid pill every morning 15 min before breakfast i usually get up at 8:50 so remember me at 9","lang":"en","personality":"buddy"}
Output: {"icon":"pill","tag":"PILL · DAILY","title":"Thyroid pill at 9:00.","body":"Every morning at 9. I've got it.","time":"09:00","when":"morning","new_facts":["takes thyroid pill at 9:00 daily","wakes up at 8:50"],"needs_followup":false,"followups":[]}

Input: {"text":"ho un esame domani","lang":"it","personality":"buddy"}
Output: {"icon":"pin","tag":"ESAME","title":"Esame domani.","body":"Ok, occhio. Dove e a che ora?","time":null,"when":"later","new_facts":[],"needs_followup":true,"followups":["Che ora?","In che aula?"]}

Input: {"text":"remind me to take the umbrella if it rains","lang":"en","personality":"chill"}
Output: {"icon":"rain","tag":"WEATHER","title":"Umbrella if it rains.","body":"Noted. I'll check the sky.","time":null,"when":"later","new_facts":[],"needs_followup":false,"followups":[]}

Input: {"text":"budget takeout 50 euro a settimana","lang":"it","personality":"hype"}
Output: {"icon":"wallet","tag":"BUDGET","title":"Takeout: 50€ a settimana.","body":"MODALITÀ BUDGET ON. Dai!","time":null,"when":"later","new_facts":["budget takeout €50 a settimana"],"needs_followup":false,"followups":[]}

Input: {"text":"sleep by 11pm","lang":"en","personality":"chill"}
Output: {"icon":"moon","tag":"NIGHT","title":"Bedtime at 23:00.","body":"Noted. Early to bed.","time":"23:00","when":"evening","new_facts":["goes to bed by 23:00"],"needs_followup":false,"followups":[]}`;

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

export async function analyzeReminder({ text, lang, personality, profile }) {
  const c = client();
  if (!c) throw new Error('LLM not configured');

  // Memory (profile + facts) goes in the USER message so system prompt stays cached
  const memory = memoryBlock(profile);
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
