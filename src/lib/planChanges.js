// A plan edit is one atomic change. Its inverse touches only the same reminders.
// Snapshots also prevent an old draft/Undo from overwriting a newer action.
const equal = (a, b) =>
  !!a &&
  !!b &&
  [...new Set([...Object.keys(a), ...Object.keys(b)])].every(
    (key) => a[key] === b[key],
  );
export function canApplyChange(items, change) {
  const before = new Map(change.before.map((item) => [item.id, item]));
  const after = new Map(change.after.map((item) => [item.id, item]));
  if (
    before.size !== change.before.length ||
    after.size !== change.after.length
  )
    return false;
  return (
    [...before].every(([id, item]) =>
      equal(
        items.find((current) => current.id === id),
        item,
      ),
    ) &&
    [...after.keys()].every(
      (id) => before.has(id) || !items.some((item) => item.id === id),
    )
  );
}
export function applyChange(items, change) {
  if (!canApplyChange(items, change)) return items;
  const replacement = new Map(change.after.map((item) => [item.id, item]));
  const affected = new Set(change.before.map((item) => item.id));
  const result = [];
  for (const item of items) {
    if (!affected.has(item.id)) result.push(item);
    else if (replacement.has(item.id)) {
      result.push(replacement.get(item.id));
      replacement.delete(item.id);
    }
  }
  return [...result, ...replacement.values()];
}
export const inverseChange = (change) => ({
  before: change.after,
  after: change.before,
});
export function deletionChange(items, reminder) {
  const before =
    reminder.kind === "parent" && reminder.clusterId
      ? items.filter((item) => item.clusterId === reminder.clusterId)
      : items.filter((item) => item.id === reminder.id);
  return { before, after: [] };
}
const fields = [
  "title",
  "body",
  "date",
  "time",
  "repeat",
  "when",
  "icon",
  "tag",
];
function editableFields(item) {
  return Object.fromEntries(
    fields.filter((key) => key in item).map((key) => [key, item[key]]),
  );
}
export function savedPlanChange(original, draft, nextId) {
  const parentBefore = original.parent;
  const before = [parentBefore, ...original.children];
  const linked = draft.children.length > 0 || parentBefore.kind === "parent";
  const clusterId = linked ? parentBefore.clusterId || `c_${nextId()}` : null;
  const parent = {
    ...parentBefore,
    ...editableFields(draft.parent),
    clusterId,
    parentId: null,
    kind: linked ? "parent" : "standalone",
  };
  const childById = new Map(original.children.map((item) => [item.id, item]));
  const used = new Set();
  const children = draft.children.map((child) => {
    const existing = childById.get(child.id);
    if (existing && used.has(existing.id))
      throw new Error("Duplicate preparation");
    if (existing) used.add(existing.id);
    return {
      ...(existing || {
        id: nextId(),
        done: false,
        body: "",
        date: null,
        time: null,
        repeat: "none",
        when: "later",
        icon: "spark",
        tag: "PREP",
      }),
      ...editableFields(child),
      clusterId,
      parentId: parent.id,
      kind: "child",
    };
  });
  return { before, after: [parent, ...children] };
}
