import test from "node:test";
import assert from "node:assert/strict";
import {
  applyChange,
  canApplyChange,
  savedPlanChange,
  inverseChange,
  deletionChange,
} from "../src/lib/planChanges.js";
const parent = {
  id: 1,
  title: "Trip",
  kind: "parent",
  clusterId: "c_1",
  parentId: null,
  done: false,
};
const child = {
  id: 2,
  title: "Tickets",
  kind: "child",
  clusterId: "c_1",
  parentId: 1,
  done: true,
  completedOn: "2026-09-07",
  date: "2026-09-12",
  time: "09:00",
};
const other = { id: 3, title: "Call Mum", done: false };
test("editing a constellation preserves identities and completion while adding and removing nodes", () => {
  let id = 10;
  const change = savedPlanChange(
    { parent, children: [child] },
    {
      parent: { ...parent, title: "Weekend trip" },
      children: [
        { ...child, title: "Train tickets" },
        { title: "Pack a book" },
      ],
    },
    () => ++id,
  );
  const result = applyChange([parent, child, other], change);
  assert.equal(result.find((r) => r.id === 2).done, true);
  assert.equal(result.find((r) => r.id === 2).completedOn, "2026-09-07");
  assert.equal(result.find((r) => r.title === "Pack a book").parentId, 1);
  assert.equal(result.find((r) => r.title === "Pack a book").clusterId, "c_1");
  assert.equal(
    result.find((r) => r.id === 3),
    other,
  );
  const restored = applyChange(result, inverseChange(change));
  assert.deepEqual(restored, [parent, child, other]);
});
test("dropping an existing preparation removes it atomically and Undo restores the exact item", () => {
  const change = savedPlanChange(
    { parent, children: [child] },
    { parent, children: [] },
    () => 10,
  );
  const result = applyChange([parent, child, other], change);
  assert.equal(
    result.some((r) => r.id === 2),
    false,
  );
  const restored = applyChange(result, inverseChange(change));
  assert.deepEqual(
    restored.find((r) => r.id === 2),
    child,
  );
});
test("a standalone reminder can become a constellation without losing its id", () => {
  const solo = {
    id: 7,
    title: "Presentation",
    kind: "standalone",
    done: false,
  };
  let id = 20;
  const change = savedPlanChange(
    { parent: solo, children: [] },
    { parent: solo, children: [{ title: "Rehearse" }] },
    () => ++id,
  );
  assert.equal(change.after[0].id, 7);
  assert.equal(change.after[0].kind, "parent");
  assert.equal(change.after[1].parentId, 7);
  assert.equal(change.after[0].clusterId, change.after[1].clusterId);
});
test("deleting a parent removes its whole constellation, a child removes only itself", () => {
  const items = [parent, child, other];
  assert.deepEqual(applyChange(items, deletionChange(items, parent)), [other]);
  assert.deepEqual(applyChange(items, deletionChange(items, child)), [
    parent,
    other,
  ]);
});
test("stale edits and Undo never overwrite newer changes or conflicting IDs", () => {
  const change = savedPlanChange(
    { parent, children: [child] },
    { parent: { ...parent, title: "Updated" }, children: [child] },
    () => 10,
  );
  assert.equal(
    canApplyChange([{ ...parent, done: true }, child], change),
    false,
  );
  const changed = applyChange([parent, child, other], change);
  const newer = changed.map((r) => (r.id === 2 ? { ...r, done: false } : r));
  assert.equal(applyChange(newer, inverseChange(change)), newer);
  const deleted = deletionChange([parent, child], child);
  assert.equal(
    canApplyChange(
      [parent, { ...child, title: "Reused id" }],
      inverseChange(deleted),
    ),
    false,
  );
});
