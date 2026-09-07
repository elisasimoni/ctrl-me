import test from "node:test";
import assert from "node:assert/strict";
import {
  extractDate,
  extractTime,
  planLocally,
  laneFor,
  localDate,
  planFromAI,
} from "../src/lib/planning.js";
import {
  nextFireForReminder,
  isDailyReminder,
  applyQuietHours,
} from "../src/native/notifications.js";
const now = new Date(2026, 8, 7, 15, 0);
test("explicit dates stay in local calendar time, including month boundaries", () => {
  assert.equal(extractDate("tomorrow", now), "2026-09-08");
  assert.equal(extractDate("domani", now), "2026-09-08");
  assert.equal(extractDate("Saturday", now), "2026-09-12");
  assert.equal(extractDate("2026-02-30", now), null);
  assert.equal(
    extractDate("tomorrow", new Date(2026, 11, 31, 23)),
    "2027-01-01",
  );
});
test("English AM/PM and Italian times reject invalid hours and minutes", () => {
  for (const [text, expected] of [
    ["7pm", "19:00"],
    ["at 12am", "00:00"],
    ["12pm", "12:00"],
    ["alle 9:30", "09:30"],
    ["at 9:99", null],
    ["25:00", null],
    ["0pm", null],
  ])
    assert.equal(extractTime(text), expected, text);
});
test("local preparations are optional and never invent a schedule or daily medication", () => {
  const plan = planLocally("Presentation tomorrow at 10", "en", now);
  assert.equal(plan.parent.date, "2026-09-08");
  assert.equal(plan.parent.time, "10:00");
  assert.equal(plan.children.length, 2);
  assert.ok(plan.children.every((child) => !child.date && !child.time));
  assert.equal(
    planLocally("take a pill at 9", "en", now).parent.repeat,
    "none",
  );
  assert.equal(
    planLocally("water plants every day at 9", "en", now).parent.repeat,
    "daily",
  );
  assert.equal(planLocally("Call Mum", "en", now).children.length, 0);
});
test("AI times are validated and undated suggestions require explicit review", () => {
  const plan = planFromAI(
    {
      title: "Prepare",
      time: "99:00",
      cluster: {
        propose: true,
        children: [{ title: "Pack a bag", time: "08:00" }],
      },
    },
    "Trip tomorrow",
    "en",
    now,
  );
  assert.equal(plan.parent.time, null);
  assert.equal(plan.parent.date, "2026-09-08");
  assert.equal(plan.children[0].date, null);
});
test("date-aware notifications never move past one-off events to tomorrow", () => {
  assert.equal(
    nextFireForReminder({ date: "2026-09-06", time: "10:00" }, now),
    null,
  );
  assert.equal(
    nextFireForReminder({ date: "2026-09-07", time: "10:00" }, now),
    null,
  );
  assert.equal(
    localDate(nextFireForReminder({ date: "2026-09-12", time: "10:00" }, now)),
    "2026-09-12",
  );
  assert.equal(
    nextFireForReminder({ date: "2026-02-30", time: "10:00" }, now),
    null,
  );
  assert.equal(nextFireForReminder({ date: "2026-09-08" }, now), null);
});
test("daily repeats, completed daily reminders, and legacy items retain their schedules", () => {
  assert.equal(
    localDate(nextFireForReminder({ repeat: "daily", time: "10:00" }, now)),
    "2026-09-08",
  );
  assert.equal(
    localDate(
      nextFireForReminder(
        {
          repeat: "daily",
          time: "18:00",
          done: true,
          completedOn: "2026-09-07",
        },
        now,
      ),
    ),
    "2026-09-08",
  );
  assert.equal(
    localDate(nextFireForReminder({ time: "10:00" }, now)),
    "2026-09-08",
  );
  assert.equal(isDailyReminder({ repeat: "none", tag: "PILL · DAILY" }), false);
  assert.equal(isDailyReminder({ tag: "PILL · DAILY" }), true);
});
test("home lanes and quiet hours use the same local-day boundary", () => {
  assert.equal(laneFor({ date: "2026-09-07" }, now), "now");
  assert.equal(laneFor({ date: "2026-09-08" }, now), "later");
  assert.equal(laneFor({ date: null, time: null }, now), "space");
  assert.equal(laneFor({ date: null, repeat: "daily" }, now), "now");
  const quiet = new Date(
    applyQuietHours(new Date(2026, 8, 7, 23, 30).getTime(), 8, 23),
  );
  assert.equal(localDate(quiet), "2026-09-08");
  assert.equal(quiet.getHours(), 8);
});
test("web notification cancellation, replacement and long delays do not leak timers", async (t) => {
  const { scheduleNotification, cancelNotification } = await import(
    "../src/native/notifications.js"
  );
  const fired = [];
  const previous = globalThis.Notification;
  globalThis.Notification = class {
    static permission = "granted";
    constructor(title) {
      fired.push(title);
    }
  };
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 100000 });
  try {
    await scheduleNotification({
      id: 10,
      title: "cancelled",
      at: Date.now() + 1000,
    });
    await cancelNotification(10);
    t.mock.timers.tick(1001);
    assert.deepEqual(fired, []);
    await scheduleNotification({ id: 11, title: "old", at: Date.now() + 1000 });
    await scheduleNotification({ id: 11, title: "new", at: Date.now() + 2000 });
    t.mock.timers.tick(1001);
    assert.deepEqual(fired, []);
    t.mock.timers.tick(1000);
    assert.deepEqual(fired, ["new"]);
    await scheduleNotification({
      id: 12,
      title: "far away",
      at: Date.now() + 3000000000,
    });
    t.mock.timers.tick(2147483647);
    assert.deepEqual(fired, ["new"]);
    await cancelNotification(12);
  } finally {
    globalThis.Notification = previous;
    t.mock.timers.reset();
  }
});

test('completing a future daily reminder does not bring its start date forward', () => {
  const at = nextFireForReminder({ repeat: 'daily', date: '2026-09-12', time: '10:00', done: true, completedOn: '2026-09-07' }, now);
  assert.equal(localDate(at), '2026-09-12');
});
