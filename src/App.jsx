import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { TreePine, Search, Plus } from 'lucide-react';
import { db } from './config/firebase';
import { getLayoutedElements } from './utils/layout';
import FamilyNode from './components/FamilyNode';
import InputModal from './components/InputModal';

const nodeTypes = { familyNode: FamilyNode };

function FamilyTreeApp() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter } = useReactFlow();

  const [modalState, setModalState] = useState({
    isOpen: false,
    parentId: null,
    parentName: '',
    isRoot: false,
  });

  // 1. Subscribe realtime ke koleksi "members" di Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'members'),
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
        setMembers(data);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore error:', err);
        setFirestoreError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleOpenAddChild = useCallback((parentId, parentName) => {
    setModalState({ isOpen: true, parentId, parentName, isRoot: false });
  }, []);

  const handleOpenAddRoot = useCallback(() => {
    setModalState({ isOpen: true, parentId: null, parentName: '', isRoot: true });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // 2. Simpan anggota baru — parentId SELALU diinjeksi otomatis dari node yang
  // diklik. Tidak ada dropdown pemilihan induk secara manual.
  const handleSaveMember = useCallback(
    async (formData) => {
      try {
        await addDoc(collection(db, 'members'), {
          ...formData,
          parentId: modalState.isRoot ? null : modalState.parentId,
          createdAt: serverTimestamp(),
        });
        setModalState({ isOpen: false, parentId: null, parentName: '', isRoot: false });
      } catch (err) {
        console.error('Gagal menyimpan data ke Firestore:', err);
        alert('Gagal menyimpan data. Periksa konfigurasi Firebase Anda.');
      }
    },
    [modalState]
  );

  // ID anggota yang cocok dengan pencarian (untuk highlight/dim di canvas)
  const matchingIds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return null;
    return new Set(
      members.filter((m) => m.name?.toLowerCase().includes(term)).map((m) => m.id)
    );
  }, [members, searchTerm]);

  // 3. Bangun ulang nodes/edges + jalankan layout Dagre setiap kali data berubah
  useEffect(() => {
    if (members.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const rawNodes = members.map((member) => ({
      id: member.id,
      type: 'familyNode',
      data: {
        ...member,
        onAddChild: handleOpenAddChild,
        searchActive: !!matchingIds,
        isMatch: matchingIds ? matchingIds.has(member.id) : false,
      },
      position: { x: 0, y: 0 },
    }));

    const rawEdges = members
      .filter((member) => member.parentId)
      .map((member) => ({
        id: `e-${member.parentId}-${member.id}`,
        source: member.parentId,
        target: member.id,
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, matchingIds]);

  // 4. Arahkan kamera ke hasil pencarian pertama
  useEffect(() => {
    if (!matchingIds || matchingIds.size === 0) return;
    const target = nodes.find((n) => matchingIds.has(n.id));
    if (target) {
      setCenter(target.position.x + 110, target.position.y + 60, { zoom: 1, duration: 500 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingIds]);

  const totalMembers = members.length;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#F7F5F0]">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-5 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-2 shrink-0">
          <TreePine className="text-emerald-500" size={22} />
          <div>
            <h1 className="font-bold text-slate-800 text-sm leading-tight">
              Dashboard Silsilah Keluarga
            </h1>
            <p className="text-[11px] text-slate-400 leading-tight">
              {totalMembers} anggota tercatat
            </p>
          </div>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama anggota keluarga..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Laki-laki
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Perempuan
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block" /> Wafat
          </span>
          {totalMembers > 0 && (
            <button
              onClick={handleOpenAddRoot}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
              title="Tambah leluhur baru yang terpisah (root baru)"
            >
              <Plus size={12} strokeWidth={3} />
              Leluhur Baru
            </button>
          )}
        </div>
      </header>

      {/* Canvas */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F7F5F0] z-20">
            <p className="text-slate-400 text-sm">Memuat data keluarga...</p>
          </div>
        )}

        {!loading && firestoreError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F7F5F0] z-20 p-6">
            <div className="max-w-sm text-center bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-red-500">Gagal terhubung ke Firestore</p>
              <p className="text-xs text-slate-500 mt-1">{firestoreError}</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Periksa konfigurasi Firebase di file .env Anda (lihat README.md).
              </p>
            </div>
          </div>
        )}

        {!loading && !firestoreError && totalMembers === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center px-4">
              <p className="text-slate-400 text-sm mb-4">Pohon keluarga Anda masih kosong.</p>
              <button
                onClick={handleOpenAddRoot}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-md transition-colors"
              >
                + Tambah Anggota Keluarga Pertama (Leluhur)
              </button>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.15}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#cbd5e1" gap={20} />
          <Controls position="top-right" showInteractive={false} />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(n) => (n.data.gender === 'male' ? '#38bdf8' : '#fb7185')}
          />
        </ReactFlow>
      </div>

      <InputModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        parentName={modalState.parentName}
        isRoot={modalState.isRoot}
        onSave={handleSaveMember}
      />
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FamilyTreeApp />
    </ReactFlowProvider>
  );
}
