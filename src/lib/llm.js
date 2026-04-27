// Optional LLM analyzer for reminders.
//
// SECURITY: this module calls Anthropic directly from the browser via
// `dangerouslyAllowBrowser`. The VITE_ANTHROPIC_API_KEY is BAKED INTO THE
// BUNDLE at build time — fine for local prototyping, never for production.
// Migration path: move this file to a server route (e.g. /api/analyze) and
// have the client POST { text, lang, personality } to it.
//
// Model: claude-haiku-4-5 (fastest + cheapest; well-suited for a 1-shot
// reminder triage). Adaptive thinking is supported but unnecessary for this
// task — we keep it off to minimize latency.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = 'claude-haiku-4-5';

let _client = null;
function client() {
  if (_client) return _client;
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-...') return null;
  _client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  return _client;
}

export function isLlmEnabled() {
  return client() !== null;
}

// System prompt is intentionally rich (examples + style notes) so it both
// (a) gives the model strong few-shot signal and (b) gets close to the
// 4096-token minimum required for prompt caching to actually fire on Haiku.
// As you add more examples this becomes cache-eligible automatically.
const SYSTEM_PROMPT = `You are CTRL+Me, the reminder assistant in a phone app.

Two jobs:

1. TRIAGE: classify the user's reminder.
   - icon: one of "rain", "pill", "pin", "wallet", "spark", "moon"
       rain   → weather, umbrella, clothes for outside
       pill   → meds, vitamins, health routines
       pin    → location, place, appointment, address
       wallet → money, budget, takeout, spending
       moon   → sleep, bedtime, night routine
       spark  → anything else
   - tag: ONE short uppercase label, max 16 chars (e.g. "WEATHER", "PILL · DAILY", "EXAM", "BUDGET", "BIRTHDAY")
   - title: the user's reminder cleaned up, sentence case, with a period. Keep ≤ 8 words.
   - body: a witty, helpful one-liner in the requested PERSONALITY and LANGUAGE.
       Personalities (NEVER literal — match the vibe):
         chill → calm, terse, no exclamation. ("Noted.", "Tracked.")
         buddy → warm friend who notices things. Slightly clever. ("On it. I'll keep an eye out.")
         hype  → confident, energetic, ALL CAPS allowed sparingly. ("LOCKED IN. Let's go.")
       Languages: 'en' or 'it'. Italian must be NATURAL Gen Z Italian — never literal translation. Use words like "tipo", "tranqui", "occhio", "dai", "raga", "fidati". Avoid stiff phrasing.
   - needs_followup: true if the reminder is missing critical details.
       Examples that NEED follow-up:
         "ho un esame" / "I have an exam"        → when? where?
         "compleanno di mamma" / "mom's birthday" → when?
         "appuntamento dottore"                   → when? where?
       Examples that DO NOT need follow-up:
         "ricordami la pillola alle 12" / "remind me of the pill at 12"
         "prendi l'ombrello se piove"
   - followups: array of 1-2 SHORT clarifying questions in the user's language. Empty if needs_followup is false.
       Tone matches personality. Keep questions under 8 words.

OUTPUT: respond with JSON only, matching the requested schema. No prose, no markdown.

EXAMPLES:

Input: { text: "ho un esame domani", lang: "it", personality: "buddy" }
Output: {
  "icon": "pin",
  "tag": "ESAME",
  "title": "Esame domani.",
  "body": "Tranqui, ti tengo d'occhio. A che ora?",
  "needs_followup": true,
  "followups": ["Che ora?", "In che aula?"]
}

Input: { text: "remind me to take the pill at noon", lang: "en", personality: "chill" }
Output: {
  "icon": "pill",
  "tag": "PILL · DAILY",
  "title": "The pill at noon.",
  "body": "Noted. Same time, daily.",
  "needs_followup": false,
  "followups": []
}

Input: { text: "BUDGET takeout 50 euro questa settimana", lang: "it", personality: "hype" }
Output: {
  "icon": "wallet",
  "tag": "BUDGET",
  "title": "50€ di takeout sta settimana.",
  "body": "MODALITÀ BUDGET ON. Forza dai!",
  "needs_followup": false,
  "followups": []
}

Input: { text: "compleanno di marco", lang: "it", personality: "buddy" }
Output: {
  "icon": "spark",
  "tag": "COMPLEANNO",
  "title": "Compleanno di Marco.",
  "body": "Segnato. Quando è?",
  "needs_followup": true,
  "followups": ["Che giorno?", "Vuoi un regalo?"]
}`;

const SCHEMA = {
  type: 'object',
  properties: {
    icon: { type: 'string', enum: ['rain', 'pill', 'pin', 'wallet', 'spark', 'moon'] },
    tag: { type: 'string' },
    title: { type: 'string' },
    body: { type: 'string' },
    needs_followup: { type: 'boolean' },
    followups: { type: 'array', items: { type: 'string' } },
  },
  required: ['icon', 'tag', 'title', 'body', 'needs_followup', 'followups'],
  additionalProperties: false,
};

export async function analyzeReminder({ text, lang, personality }) {
  const c = client();
  if (!c) throw new Error('LLM not configured');

  const response = await c.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Input: ${JSON.stringify({ text, lang, personality })}\n\nOutput as JSON.`,
      },
    ],
    output_config: {
      format: { type: 'json_schema', schema: SCHEMA },
    },
  });

  const block = response.content.find((b) => b.type === 'text');
  if (!block) throw new Error('No text in response');
  return JSON.parse(block.text);
}
