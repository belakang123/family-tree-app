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
      // Only skip if BOTH are already resolved
      if (bundle.husbandId && bundle.wifeId) continue;

      if (bundle.key.startsWith('pair:')) {
        // Pair bundle: extract the two IDs embedded in the key
        // key format: "pair:idA:idB" — we stored them via pairKeyFor which sorts lexicographically
        const withoutPrefix = bundle.key.slice('pair:'.length);
        // Split on first colon only, then rejoin in case IDs contained colons
        const firstColon = withoutPrefix.indexOf(':');
        const id1 = withoutPrefix.slice(0, firstColon);
        const id2 = withoutPrefix.slice(firstColon + 1);
        const p1 = members.find((x) => x.id === id1) ?? null;
        const p2 = members.find((x) => x.id === id2) ?? null;
        const male   = p1?.gender === 'male' ? p1 : p2?.gender === 'male' ? p2 : null;
        const female  = p1?.gender === 'female' ? p1 : p2?.gender === 'female' ? p2 : null;
        if (!bundle.husbandId && male)   bundle.husbandId = male.id;
        if (!bundle.wifeId    && female) bundle.wifeId    = female.id;
      } else {
        // Solo bundle: assign based on gender
        const person = members.find((x) => x.id === bundle.anchorPersonId) ?? null;
        if (!person) continue;
        if (person.gender === 'male')   bundle.husbandId = person.id;
        else                            bundle.wifeId    = person.id;
      }
    }

    const bundleIdByPersonId = (personId) => {
      const p = members.find((x) => x.id === personId);
      if (!p) return null;
      const spouseId = p.spouseId ?? null;
      return spouseId ? pairKeyFor(p.id, spouseId) : pairKeyFor(p.id, null);
    };

    // ── Helper: ambil childOrder dari bundle (pakai anak yg punya parentId)
    const getBundleChildOrder = (bundle) => {
      const candidateId = bundle.husbandId ?? bundle.wifeId ?? bundle.anchorPersonId;
      const person = members.find((x) => x.id === candidateId);
      if (!person?.parentId) return Number.POSITIVE_INFINITY;
      const siblings = getOrderedChildren(person.parentId);
      const idx = siblings.findIndex((x) => x.id === person.id);
      return idx >= 0 ? idx : Number.POSITIVE_INFINITY;
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
          _childOrder: getBundleChildOrder(bundle),
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
          _childOrder: getBundleChildOrder(bundle),
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

    // Urutkan nodes berdasarkan childOrder agar Dagre mendaftarkan node
    // sesuai urutan — ini mempengaruhi posisi horizontal sibling
    rawNodes.sort((a, b) => a._childOrder - b._childOrder);

    // Edges — dikumpulkan dengan _childOrder agar bisa diurutkan
    const rawEdges = [];
    for (const child of members) {
      if (!child.parentId) continue;
      const sourceBundleId = bundleIdByPersonId(child.parentId);
      const targetBundleId = bundleIdByPersonId(child.id);
      if (!sourceBundleId || !targetBundleId) continue;

      // Cari urutan anak berdasarkan siblings dari parent yang sama
      const siblings = getOrderedChildren(child.parentId);
      const edgeOrder = siblings.findIndex((x) => x.id === child.id);

      rawEdges.push({
        id: `e-${sourceBundleId}-${targetBundleId}-${child.id}`,
        source: sourceBundleId,
        target: targetBundleId,
        _childOrder: edgeOrder >= 0 ? edgeOrder : Number.POSITIVE_INFINITY,
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

    // Urutkan edges berdasarkan childOrder — Dagre memakai urutan pendaftaran
    // edge untuk menentukan posisi horizontal anak (kiri = index kecil)
    rawEdges.sort((a, b) => a._childOrder - b._childOrder);

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
