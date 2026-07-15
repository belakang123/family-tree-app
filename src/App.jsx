import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,

  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { collection, onSnapshot, addDoc, serverTimestamp, updateDoc, deleteDoc, writeBatch, doc } from 'firebase/firestore';
import { TreePine, Search, Plus, Pencil, Eye, Moon, Sun } from 'lucide-react';

const THEME_STORAGE_KEY = 'theme';

import { db } from './config/firebase';
import { getLayoutedElements } from './utils/layout';
import { collectDescendantIds } from './utils/tree';
import FamilyNode from './components/FamilyNode';
import InputModal from './components/InputModal';
import BioDataModal from './components/BioDataModal';


const nodeTypes = { familyNode: FamilyNode };

function FamilyTreeApp() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [themePref, setThemePref] = useState('auto'); // 'auto' | 'dark' | 'light'

  const getSystemPrefersDark = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }, []);

  const isDarkEffective = useMemo(() => {
    if (themePref === 'dark') return true;
    if (themePref === 'light') return false;
    return getSystemPrefersDark();
  }, [themePref, getSystemPrefersDark]);

  const applyThemeClass = useCallback(
    (shouldBeDark) => {
      if (typeof document === 'undefined') return;
      document.documentElement.classList.toggle('dark', shouldBeDark);
    },
    []
  );


  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { setCenter } = useReactFlow();

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showBioDataModal, setShowBioDataModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    memberId: null,
    memberName: '',
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    parentId: null,
    parentName: '',
    isRoot: false,
    editingMemberId: null,
    editingData: null,
  });

  // Apply theme (auto/light/dark)
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);

    if (saved === 'light' || saved === 'dark' || saved === 'auto') setThemePref(saved);

    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (localStorage.getItem('theme') === 'auto' || !localStorage.getItem('theme')) {
        applyThemeClass(mq?.matches ?? false);
      }
    };

    if (mq?.addEventListener) mq.addEventListener('change', onChange);
    else mq?.addListener?.(onChange);

    applyThemeClass(
      (saved === 'dark' && true) || (saved === 'light' && false) || (saved !== 'light' && saved !== 'dark' ? (mq?.matches ?? false) : false)
    );

    return () => {
      if (mq?.removeEventListener) mq.removeEventListener('change', onChange);
      else mq?.removeListener?.(onChange);
    };
  }, [applyThemeClass]);

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
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
      editingMemberId: null,
      editingData: null,
    }));
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev);
  }, []);

  const handleShowBioData = useCallback((memberData) => {
    setSelectedMember(memberData);
    setShowBioDataModal(true);
  }, []);

  const handleCloseBioData = useCallback(() => {
    setShowBioDataModal(false);
    setTimeout(() => setSelectedMember(null), 300); // Wait for animation
  }, []);

  // 2. Simpan anggota baru atau edit anggota existing
  const handleSaveMember = useCallback(
    async (formData) => {
      try {
        const normalizedData = {
          name: formData.name,
          gender: formData.gender,
          birthDate: formData.birthDate ?? null,
          isDeceased: formData.isDeceased ?? false,
          deathDate: formData.deathDate ?? null,
          photoUrl: formData.photoUrl ?? null,
          photoFileId: formData.photoFileId ?? null,
          alamat: formData.alamat ?? null,
          noHp: formData.noHp ?? null,
        };

        if (modalState.editingMemberId) {
          // Mode edit: update existing document
          await updateDoc(doc(db, 'members', modalState.editingMemberId), {
            ...normalizedData,
            updatedAt: serverTimestamp(),
          });
        } else {
          // Mode add: create new document
          await addDoc(collection(db, 'members'), {
            ...normalizedData,
            parentId: modalState.isRoot ? null : modalState.parentId,
            createdAt: serverTimestamp(),
          });
        }
        setModalState({
          isOpen: false,
          parentId: null,
          parentName: '',
          isRoot: false,
          editingMemberId: null,
          editingData: null,
        });
      } catch (err) {
        console.error('Gagal menyimpan data ke Firestore:', err);
        alert('Gagal menyimpan data. Periksa konfigurasi Firebase Anda.');
      }
    },
    [modalState]
  );

  const handleEditMember = useCallback((memberData) => {
    setModalState({
      isOpen: true,
      parentId: memberData.parentId || null,
      parentName: '',
      isRoot: false,
      editingMemberId: memberData.id,
      editingData: memberData,
    });
  }, []);

  const handleDeleteMember = useCallback((memberId, memberName) => {
    setConfirmDelete({
      isOpen: true,
      memberId,
      memberName,
    });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const { memberId } = confirmDelete;
    try {
      const descendantIds = collectDescendantIds(memberId, members);
      const allIdsToDelete = [memberId, ...descendantIds];
      const membersToDelete = allIdsToDelete
        .map((id) => members.find((member) => member.id === id))
        .filter(Boolean);

      await Promise.allSettled(
        membersToDelete.map(async (member) => {
          if (!member?.photoUrl && !member?.photoFileId) return;

          await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              photoUrl: member.photoUrl,
              fileId: member.photoFileId,
            }),
          });
        })
      );

      const batch = writeBatch(db);
      allIdsToDelete.forEach((id) => {
        batch.delete(doc(db, 'members', id));
      });
      await batch.commit();

      setConfirmDelete({ isOpen: false, memberId: null, memberName: '' });
    } catch (err) {
      console.error('Gagal menghapus data dari Firestore:', err);
      alert('Gagal menghapus data. Silakan coba lagi.');
    }
  }, [confirmDelete, members]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDelete({ isOpen: false, memberId: null, memberName: '' });
  }, []);

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
        onEdit: handleEditMember,
        onDelete: handleDeleteMember,
        onShowBioData: handleShowBioData,
        searchActive: !!matchingIds,
        isMatch: matchingIds ? matchingIds.has(member.id) : false,
        isEditMode: isEditMode,
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
  }, [members, matchingIds, isEditMode]);

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

  const themeIcon = themePref === 'dark' ? 'dark' : themePref === 'light' ? 'light' : isDarkEffective;

  const cycleTheme = () => {
    // auto -> dark -> light -> auto
    setThemePref((prev) => {
      const next = prev === 'auto' ? 'dark' : prev === 'dark' ? 'light' : 'auto';
      localStorage.setItem('theme', next);
      // apply immediately
      const shouldBeDark = next === 'dark' ? true : next === 'light' ? false : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
      applyThemeClass(shouldBeDark);
      return next;
    });
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#F7F5F0] dark:bg-slate-950">
      {/* Confirmation Dialog */}
      {confirmDelete.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={handleCancelDelete}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200/50 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Konfirmasi Hapus</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Anda akan menghapus <span className="font-semibold">{confirmDelete.memberName}</span> dan semua keturunannya. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCancelDelete}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}


      {/* BioData Modal */}
      <BioDataModal member={selectedMember} isOpen={showBioDataModal} onClose={handleCloseBioData} />

      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-5 py-3 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200/60 shadow-sm z-10 dark:bg-slate-950/60 dark:supports-[backdrop-filter]:bg-slate-950/50 dark:border-slate-800">
        <div className="flex items-center gap-2 shrink-0">
          <TreePine className="text-emerald-500" size={22} />
          <div>
            <h1 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
              Dashboard Silsilah Keluarga
            </h1>
            <p className="text-[11px] text-slate-400 leading-tight">
              {totalMembers} anggota tercatat
            </p>
          </div>
        </div>

        <div className="relative flex-1 max-w-xs">

          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama anggota keluarga..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white/70 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>


        <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 shrink-0 dark:text-slate-400">

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
          <div className="absolute inset-0 flex items-center justify-center bg-[#F7F5F0] dark:bg-slate-950 z-20">
            <p className="text-slate-400 dark:text-slate-300 text-sm">Memuat data keluarga...</p>
          </div>
        )}


        {!loading && firestoreError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#F7F5F0] dark:bg-slate-950 z-20 p-6">
            <div className="max-w-sm text-center bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/40 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-semibold text-red-500">Gagal terhubung ke Firestore</p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">{firestoreError}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-2">
                Periksa konfigurasi Firebase di file .env Anda (lihat README.md).
              </p>
            </div>
          </div>
        )}


        {!loading && !firestoreError && totalMembers === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center px-4">
              <p className="text-slate-400 dark:text-slate-300 text-sm mb-4">Pohon keluarga Anda masih kosong.</p>
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
          <Background color="#cbd5e1" gap={22} variant="dots" />
          <Controls position="top-right" showInteractive={false} />
        </ReactFlow>
      </div>

      <InputModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        parentName={modalState.parentName}
        isRoot={modalState.isRoot}
        onSave={handleSaveMember}
        editingData={modalState.editingData}
      />

      {/* Theme Toggle */}
      <button
        onClick={cycleTheme}
        className="fixed top-20 left-6 z-40 w-11 h-11 rounded-full shadow-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 transition-colors"

        title={themePref === 'auto' ? 'Dark mode: Auto' : themePref === 'dark' ? 'Dark mode: Dark' : 'Dark mode: Light'}
        aria-label="Toggle dark mode"
      >
        {themePref === 'dark' || (themePref === 'auto' && isDarkEffective) ? (
          <Sun size={18} />
        ) : (
          <Moon size={18} />
        )}
      </button>

      {/* Floating Action Button (FAB) - Edit/Preview Toggle */}
      <button
        onClick={toggleEditMode}

        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white font-semibold transition-all hover:scale-110 active:scale-95 ${isEditMode
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-cyan-500 hover:bg-cyan-600'
          }`}
        title={isEditMode ? 'Kembali ke mode preview' : 'Masuk ke mode edit'}
      >
        {isEditMode ? <Eye size={20} /> : <Pencil size={20} />}
      </button>
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
