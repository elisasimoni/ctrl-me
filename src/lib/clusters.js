// Helpers around the clusterId/parentId/kind reminder fields.

// Reorder items so cluster children render directly under their parent,
// and flag parents with `_linked` (count of linked children).
// Each child gets `_isChild: true` so the renderer can style it.
export function groupReminders(items) {
  const childrenByParent = {};
  items.forEach(i => {
    if (i.kind === 'child' && i.parentId != null) {
      (childrenByParent[i.parentId] = childrenByParent[i.parentId] || []).push(i);
    }
  });
  const out = [];
  items.forEach(i => {
    if (i.kind === 'child') return;
    const linked = childrenByParent[i.id]?.length ?? 0;
    out.push({ ...i, _linked: linked });
    (childrenByParent[i.id] || []).forEach(c => out.push({ ...c, _isChild: true }));
  });
  return out;
}

// Build a list of clusters for the graph view.
// Each entry: { id, parent, children[] }. Standalone reminders are NOT included.
export function listClusters(items) {
  const byCluster = {};
  items.forEach(i => {
    if (!i.clusterId) return;
    const c = byCluster[i.clusterId] = byCluster[i.clusterId] || { id: i.clusterId, parent: null, children: [] };
    if (i.kind === 'parent') c.parent = i;
    else if (i.kind === 'child') c.children.push(i);
  });
  // Only return clusters that actually have a parent attached.
  return Object.values(byCluster).filter(c => c.parent);
}
