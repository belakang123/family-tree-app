import { useEffect, useMemo } from 'react';
import { useNodesState, useEdgesState, useReactFlow } from 'reactflow';
import { getLayoutedElements } from '../utils/layout';

/**
 * Membangun nodes & edges React Flow dari array members Firestore,
 * menjalankan Dagre layout, dan mengarahkan kamera ke hasil pencarian.
 */
export function useTreeGraph({
  members,
  matchingIds,
  isEditMode,
  isExporting,
  handleShowBioData,
  handleOpenAddChild,
  handleOpenAddSpouse,
  handleEditMember,
  handleDeleteMember,
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter } = useReactFlow();

  // ── Build nodes + edges setiap kali data berubah
  useEffect(() => {
    if (members.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Map parentId → children
    const childrenOfParent = new Map();
    for (const m of members) {
      const pid = m.parentId ?? null;
      if (!childrenOfParent.has(pid)) childrenOfParent.set(pid, []);
      childrenOfParent.get(pid).push(m);
    }

    const getOrderedChildren = (parentId) => {
      const list = childrenOfParent.get(parentId ?? null) ?? [];
      return [...list].sort((a, b) => {
        const ao = typeof a.childOrder === 'number' ? a.childOrder : Number.POSITIVE_INFINITY;
        const bo = typeof b.childOrder === 'number' ? b.childOrder : Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0) || a.name?.localeCompare(b.name ?? '');
      });
    };

    // Bundle ID per pasangan/tunggal
    const pairKeyFor = (aId, bId) => {
      if (!aId && !bId) return null;
      if (!aId) return `solo:${bId}`;
      if (!bId) return `solo:${aId}`;
      return aId < bId ? `pair:${aId}:${bId}` : `pair:${bId}:${aId}`;
    };

    // Build bundles
    const bundleByKey = new Map();
    for (const m of members) {
      const spouseId = m.spouseId ?? null;
      const key = spouseId ? pairKeyFor(m.id, spouseId) : pairKeyFor(m.id, null);
      if (!bundleByKey.has(key)) bundleByKey.set(key, { key, husbandId: null, wifeId: null, anchorPersonId: m.id });

      const bundle = bundleByKey.get(key);
      if (spouseId) {
        const other = members.find((x) => x.id === spouseId) ?? null;
        if (!other) continue;
        const male = m.gender === 'male' ? m : other.gender === 'male' ? other : null;
        const female = male ? (male.id === m.id ? other : m) : null;
        if (male) bundle.husbandId = male.id;
        if (female) bundle.wifeId = female.id;
      }
    }

    // Fill missing husband/wife from gender
    for (const bundle of bundleByKey.values()) {
      if (bundle.husbandId || bundle.wifeId) continue;
      const ids = bundle.key.startsWith('pair:')
        ? bundle.key.replace('pair:', '').split(':')
        : [bundle.anchorPersonId];
      const p1 = members.find((x) => x.id === ids[0]) ?? null;
      const p2 = members.find((x) => x.id === ids[1]) ?? null;
      const male = p1?.gender === 'male' ? p1 : p2?.gender === 'male' ? p2 : null;
      const female = male ? (male.id === p1?.id ? p2 : p1) : null;
      if (male) bundle.husbandId = male.id;
      if (female) bundle.wifeId = female.id;
    }

    const bundleIdByPersonId = (personId) => {
      const p = members.find((x) => x.id === personId);
      if (!p) return null;
      const spouseId = p.spouseId ?? null;
      return spouseId ? pairKeyFor(p.id, spouseId) : pairKeyFor(p.id, null);
    };

    // Nodes
    const rawNodes = [];
    for (const bundle of bundleByKey.values()) {
      const husband = bundle.husbandId ? members.find((m) => m.id === bundle.husbandId) ?? null : null;
      const wife    = bundle.wifeId    ? members.find((m) => m.id === bundle.wifeId)    ?? null : null;

      if (husband && wife) {
        const husbIndex = (husband.parentId ? getOrderedChildren(husband.parentId) : []).findIndex((x) => x.id === husband.id) + 1;
        const wifeIndex = (wife.parentId    ? getOrderedChildren(wife.parentId)    : []).findIndex((x) => x.id === wife.id)    + 1;

        rawNodes.push({
          id: bundle.key,
          type: 'familyPairNode',
          data: {
            husband: { ...husband, childIndex: husbIndex > 0 ? husbIndex : null },
            wife:    { ...wife,    childIndex: wifeIndex > 0 ? wifeIndex : null },
            searchActive: !!matchingIds,
            matchingIds,
            isEditMode,
            isExporting,
            onShowBioData: handleShowBioData,
            onAddChild: (pid, pname) => handleOpenAddChild(pid, pname),
            onEdit: handleEditMember,
            onDelete: handleDeleteMember,
          },
          position: { x: 0, y: 0 },
        });
      } else {
        const person = husband ?? wife;
        if (!person) continue;
        const siblings   = person.parentId ? getOrderedChildren(person.parentId) : [];
        const childIndex = siblings.findIndex((x) => x.id === person.id) + 1;
        const isMatch    = !!(matchingIds && matchingIds.has(person.id));

        rawNodes.push({
          id: bundle.key,
          type: 'familyNode',
          data: {
            ...person,
            childIndex: childIndex > 0 ? childIndex : null,
            searchActive: !!matchingIds,
            isMatch,
            isEditMode,
            isExporting,
            onShowBioData: handleShowBioData,
            onAddChild: (pid, pname) => handleOpenAddChild(pid, pname),
            onAddSpouse: handleOpenAddSpouse,
            onEdit: handleEditMember,
            onDelete: handleDeleteMember,
          },
          position: { x: 0, y: 0 },
        });
      }
    }

    // Edges
    const rawEdges = [];
    for (const child of members) {
      if (!child.parentId) continue;
      const sourceBundleId = bundleIdByPersonId(child.parentId);
      const targetBundleId = bundleIdByPersonId(child.id);
      if (!sourceBundleId || !targetBundleId) continue;

      rawEdges.push({
        id: `e-${sourceBundleId}-${targetBundleId}-${child.id}`,
        source: sourceBundleId,
        target: targetBundleId,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: 'url(#edgeGradient)',
          strokeWidth: 2.5,
          strokeLinecap: 'round',
          filter: 'drop-shadow(0 0 3px rgba(99,102,241,0.25))',
        },
        markerEnd: { type: 'arrowclosed', color: '#818cf8', width: 16, height: 16 },
      });
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, matchingIds, isEditMode]);

  // ── Arahkan kamera ke pencarian pertama
  useEffect(() => {
    if (!matchingIds || matchingIds.size === 0) return;
    const target = nodes.find((n) => matchingIds.has(n.id));
    if (target) {
      setCenter(target.position.x + 110, target.position.y + 60, { zoom: 1, duration: 500 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingIds]);

  return { nodes, edges, onNodesChange, onEdgesChange };
}
