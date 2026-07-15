/**
 * Kumpulkan ID semua keturunan (anak, cucu, dst.) dari parentId tertentu.
 */
export function collectDescendantIds(parentId, members) {
  const children = members.filter((m) => m.parentId === parentId);
  return children.flatMap((c) => [c.id, ...collectDescendantIds(c.id, members)]);
}
