// Local calendar dates intentionally avoid UTC conversion (which shifts dates west of UTC).
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const d = new Date(`${value}T12:00:00`);
  return !Number.isNaN(d.getTime()) && localDate(d) === value;
}
export function validTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || "");
}
export function whenFor(time) {
  if (!validTime(time)) return "later";
  const h = Number(time.slice(0, 2));
  return h < 12
    ? "morning"
    : h === 12
      ? "noon"
      : h < 18
        ? "afternoon"
        : "evening";
}
export function shiftDate(value, days) {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + days);
  return localDate(d);
}
export function extractDate(text, now = new Date()) {
  const value = text.toLowerCase();
  const iso = value.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (iso) return validDate(iso[0]) ? iso[0] : null;
  if (/\b(day after tomorrow|dopodomani)\b/.test(value))
    return shiftDate(localDate(now), 2);
  if (/\b(tomorrow|domani)\b/.test(value)) return shiftDate(localDate(now), 1);
  if (/\b(today|tonight|oggi|stasera)\b/.test(value)) return localDate(now);
  const days = [
    "sunday|domenica",
    "monday|lunedì",
    "tuesday|martedì",
    "wednesday|mercoledì",
    "thursday|giovedì",
    "friday|venerdì",
    "saturday|sabato",
  ];
  const day = days.findIndex((pattern) =>
    new RegExp(`(?:^|\\s)(${pattern})(?=\\s|[.,!?]|$)`, "i").test(value),
  );
  if (day >= 0) {
    let delta = (day - now.getDay() + 7) % 7;
    if (!delta || /\bnext\b|prossim/.test(value)) delta = delta || 7;
    return shiftDate(localDate(now), delta);
  }
  return null;
}
export function extractTime(text) {
  const match = text
    .toLowerCase()
    .match(
      /\b(?:at|alle?|ore)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b|\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(\d{1,2}):(\d{2})\b/,
    );
  if (!match) return null;
  let h = Number(match[1] ?? match[4] ?? match[7]);
  const m = Number(match[2] ?? match[5] ?? match[8] ?? 0);
  const meridian = match[3] ?? match[6];
  if (meridian && (h < 1 || h > 12)) return null;
  if (meridian) h = (h % 12) + (meridian === "pm" ? 12 : 0);
  const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return validTime(time) ? time : null;
}
export function parseThought(text, lang = "en", now = new Date()) {
  const date = extractDate(text, now),
    time = extractTime(text);
  const repeat = /\bevery day\b|\bdaily\b|ogni giorno|tutti i giorni/i.test(
    text,
  )
    ? "daily"
    : "none";
  let icon = "spark";
  if (
    /\b(exam|train|flight|interview|presentation)\b|esame|treno|volo|colloquio|presentazione/i.test(
      text,
    )
  )
    icon = "pin";
  if (/\b(pill|vitamin)\b|pillola|vitamina/i.test(text)) icon = "pill";
  let title = text
    .replace(/^(remind me\s+(to\s+)?|ricordami\s+(di\s+)?)/i, "")
    .trim();
  if (date)
    title = title.replace(
      /\b\d{4}-\d{2}-\d{2}\b|(?:\b(?:on|next)\s+)?\b(?:day after tomorrow|tomorrow|today|tonight|sunday|monday|tuesday|wednesday|thursday|friday|saturday|dopodomani|domani|oggi|stasera|domenica|sabato)\b|(?:lunedì|martedì|mercoledì|giovedì|venerdì)/gi,
      " ",
    );
  if (time)
    title = title.replace(
      /\b(?:at|alle?|ore)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b|\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b|\b\d{1,2}:\d{2}\b/gi,
      " ",
    );
  if (repeat === "daily")
    title = title.replace(
      /\bevery day\b|\bdaily\b|ogni giorno|tutti i giorni/gi,
      " ",
    );
  title =
    title
      .replace(/\s+/g, " ")
      .replace(/[\s,.-]+$/, "")
      .trim() || text.trim();
  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    body: "",
    date,
    time,
    repeat,
    when: whenFor(time),
    icon,
    tag: lang === "it" ? "PROMEMORIA" : "REMINDER",
  };
}
export function planLocally(text, lang = "en", now = new Date()) {
  const it = lang === "it";
  const parent = parseThought(text, lang, now);
  // Conservative templates: optional, untimed preparation, never inferred travel/medical advice.
  let titles = [];
  if (
    /\b(presentation|interview|exam)\b|presentazione|colloquio|esame/i.test(
      text,
    )
  )
    titles = it
      ? ["Rivedere gli appunti", "Preparare quello che serve"]
      : ["Review your notes", "Pack what you need"];
  else if (/\b(train|flight|trip)\b|treno|volo|viaggio/i.test(text))
    titles = it
      ? ["Controllare biglietti e documenti", "Preparare la borsa"]
      : ["Check tickets and documents", "Pack your bag"];
  return {
    parent,
    children: titles.map((title) => ({
      title,
      body: "",
      date: null,
      time: null,
      repeat: "none",
      when: "later",
      icon: "spark",
      tag: it ? "PREPARATIVI" : "PREP",
    })),
    source: "local",
    why: titles.length
      ? it
        ? "Due idee per prepararti. Scegli cosa tenere e quando."
        : "Two ideas to get ready. Choose what helps and when."
      : "",
  };
}
export function planFromAI(result, text, lang, now = new Date()) {
  const normalize = (item, sourceText) => {
    const parsed = parseThought(sourceText, lang, now);
    return {
      ...parsed,
      title: item.title || parsed.title,
      body: item.body || "",
      icon: item.icon || "spark",
      tag: item.tag || parsed.tag,
      time: validTime(item.time) ? item.time : parsed.time,
      date: extractDate(sourceText, now),
      when: whenFor(item.time || parsed.time),
    };
  };
  return {
    parent: normalize(result, text),
    children: result.cluster?.propose
      ? (result.cluster.children || [])
          .slice(0, 6)
          .map((c) => normalize(c, c.title))
      : [],
    source: "ai",
    why: result.cluster?.why || "",
    followups: result.needs_followup ? result.followups : [],
  };
}
export function dateLabel(item, lang = "en") {
  const parts = [];
  if (item.repeat === "daily")
    parts.push(lang === "it" ? "Ogni giorno" : "Every day");
  if (validDate(item.date))
    parts.push(
      new Date(`${item.date}T12:00:00`).toLocaleDateString(
        lang === "it" ? "it-IT" : "en-GB",
        { weekday: "short", day: "numeric", month: "short" },
      ),
    );
  if (validTime(item.time)) parts.push(item.time);
  return (
    parts.join(" · ") || (lang === "it" ? "Senza orario" : "No schedule yet")
  );
}
export function laneFor(item, now = new Date()) {
  if (!item.date && item.repeat !== "daily") return "space";
  if (item.repeat === "daily" && (!item.date || item.date <= localDate(now)))
    return "now";
  return item.date <= localDate(now) ? "now" : "later";
}
