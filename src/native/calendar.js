// Calendar integration.
// Web: exports an .ics file the phone calendar app can import.
// Native (future): @capacitor-community/calendar with native permission.

import { isNative } from './platform.js';

export async function addToCalendar({ title, body, startAt, endAt }) {
  if (isNative()) {
    // Future: use @capacitor-community/calendar
    // const { CapacitorCalendar } = await import('@capacitor-community/calendar');
    // await CapacitorCalendar.createEvent({ title, notes: body, startDate: startAt, endDate: endAt });
    // For now fall through to ICS export even on native
  }

  exportIcs({ title, body, startAt, endAt });
}

function exportIcs({ title, body, startAt, endAt }) {
  const fmt = (d) => {
    const dt = new Date(d);
    return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const start = fmt(startAt);
  const end = fmt(endAt ?? startAt + 60 * 60 * 1000); // default 1h
  const stamp = fmt(Date.now());
  const uid = `${Date.now()}@ctrlme`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CTRL+Me//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    body ? `DESCRIPTION:${body.replace(/\n/g, '\\n')}` : '',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${title}`,
    'TRIGGER:-PT30M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/\s+/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
