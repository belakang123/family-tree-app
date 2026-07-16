import React, { useState, useMemo, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { TreePine, Search, Plus, Pencil, Eye, Moon, Sun, Download, BookOpen, X } from 'lucide-react';

import FamilyNode from './components/FamilyNode';
import FamilyPairNode from './components/FamilyPairNode';
import InputModal from './components/InputModal';
import BioDataModal from './components/BioDataModal';
import GuideModal from './components/GuideModal';

import { useTheme } from './hooks/useTheme';
import { useMembers } from './hooks/useMembers';
import { useMemberActions } from './hooks/useMemberActions';
import { useTreeGraph } from './hooks/useTreeGraph';
import { useExportPng } from './hooks/useExportPng';

const nodeTypes = {
  familyNode: FamilyNode,
  familyPairNode: FamilyPairNode,
};

/* ─────────────────────────────────────────────────────────
   Inner app — must live inside ReactFlowProvider
───────────────────────────────────────────────────────── */
function FamilyTreeApp() {
  const [searchTerm,     setSearchTerm]     = useState('');
  const [isEditMode,     setIsEditMode]     = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const treeWrapRef  = useRef(null);
  const mobileInputRef = useRef(null);

  // ── Custom hooks
  const { isDarkEffective, cycleTheme } = useTheme();

  const {
    members, loading, firestoreError,
    confirmDelete,
    handleDeleteMember, handleConfirmDelete, handleCancelDelete,
  } = useMembers();

  const {
    modalState, selectedMember, showBioDataModal,
    handleOpenAddChild, handleOpenAddRoot, handleOpenAddSpouse,
    handleCloseModal, handleEditMember,
    handleShowBioData, handleCloseBioData, handleSaveMember,
  } = useMemberActions(members);

  const matchingIds = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return null;
    return new Set(members.filter((m) => m.name?.toLowerCase().includes(term)).map((m) => m.id));
  }, [members, searchTerm]);

  const { nodes: _nodes, edges, onNodesChange, onEdgesChange } = useTreeGraph({
    members,
    matchingIds,
    isEditMode,
    isExporting: false, // initial; nodes don't need real isExporting for layout
    handleShowBioData,
    handleOpenAddChild,
    handleOpenAddSpouse,
    handleEditMember,
    handleDeleteMember,
  });

  const { isExporting, exportTreeAsPng } = useExportPng({ nodes: _nodes, isDarkEffective, treeWrapRef });

  // Re-build nodes with correct isExporting flag so cards hide buttons during export
  const nodes = useMemo(
    () => _nodes.map((n) => ({
      ...n,
      data: { ...n.data, isExporting },
    })),
    [_nodes, isExporting]
  );

  const totalMembers = members.length;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#F7F5F0] dark:bg-slate-950">

      {/* ── Confirm Delete Dialog ── */}
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
              Anda akan menghapus{' '}
              <span className="font-semibold">{confirmDelete.memberName}</span>{' '}
              beserta <span className="font-semibold">pasangannya</span>, semua{' '}
              <span className="font-semibold">keturunan</span>, dan pasangan dari tiap keturunan.
              Tindakan ini <span className="text-red-500 font-semibold">tidak dapat dibatalkan</span>.
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

      {/* ── BioData Modal ── */}
      <BioDataModal member={selectedMember} isOpen={showBioDataModal} onClose={handleCloseBioData} />

      {/* ── Header ── */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200/60 shadow-sm z-10 dark:bg-slate-950/60 dark:supports-[backdrop-filter]:bg-slate-950/50 dark:border-slate-800">

        {/* ── MOBILE SEARCH OVERLAY (tampil saat mobileSearchOpen) ── */}
        {mobileSearchOpen ? (
          <div className="flex sm:hidden items-center gap-2 flex-1 animate-fadeIn">
            <Search size={15} className="shrink-0 text-slate-400 dark:text-slate-500" />
            <input
              ref={mobileInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama anggota keluarga..."
              autoFocus
              className="flex-1 py-1.5 text-sm bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <button
              onClick={() => { setMobileSearchOpen(false); setSearchTerm(''); }}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              aria-label="Tutup pencarian"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          /* ── NORMAL HEADER CONTENT ── */
          <>
            {/* Branding */}
            <div className="flex items-center gap-2 shrink-0">
              <TreePine className="text-emerald-500" size={22} />
              <div>
                <h1 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                  Dashboard Silsilah Keluarga
                </h1>
                <p className="text-[11px] text-slate-400 leading-tight">{totalMembers} anggota tercatat</p>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="hidden sm:flex relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama anggota keluarga..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white/70 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Right side: legend + add root (desktop) */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-500 shrink-0 dark:text-slate-400 ml-auto">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Laki-laki</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Perempuan</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block" /> Wafat</span>
              {totalMembers > 0 && (
                <button
                  onClick={handleOpenAddRoot}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-slate-600 font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                  title="Tambah leluhur baru (root baru)"
                >
                  <Plus size={12} strokeWidth={3} />
                  Leluhur Baru
                </button>
              )}
            </div>

            {/* Mobile: search icon + add root icon */}
            <div className="flex sm:hidden items-center gap-2 ml-auto">
              <button
                onClick={() => {
                  setMobileSearchOpen(true);
                  setTimeout(() => mobileInputRef.current?.focus(), 50);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                aria-label="Buka pencarian"
                title="Cari anggota"
              >
                <Search size={16} />
              </button>
              {totalMembers > 0 && (
                <button
                  onClick={handleOpenAddRoot}
                  className="w-8 h-8 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-sm transition-colors"
                  title="Tambah Leluhur Baru"
                  aria-label="Tambah Leluhur Baru"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          </>
        )}
      </header>

      {/* ── Canvas ── */}
      <div className="relative flex-1" ref={treeWrapRef}>

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
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="text-center px-6">
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                  <TreePine size={32} className="text-emerald-500" />
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
                Pohon keluarga Anda masih kosong.
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-xs mb-5">
                Mulai dengan menambahkan pasangan leluhur pertama.
              </p>
              <button
                onClick={handleOpenAddRoot}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-100"
              >
                <Plus size={16} strokeWidth={3} />
                Tambah Leluhur Pertama
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
          defaultEdgeOptions={{ type: 'smoothstep', style: { strokeWidth: 2.5 } }}
        >
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.9" />
              </linearGradient>
            </defs>
          </svg>
          <Background color="#cbd5e1" gap={22} variant="dots" />
          <Controls position="top-right" showInteractive={false} />
        </ReactFlow>
      </div>

      {/* ── Input + Guide Modals ── */}
      <InputModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        parentName={modalState.parentName}
        isRoot={modalState.isRoot}
        mode={modalState.mode}
        onSave={handleSaveMember}
        editingData={modalState.editingData}
        members={members}
      />

      <GuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      {/* ── FAB: Theme Toggle (left side) ── */}
      <button
        onClick={cycleTheme}
        className="fixed top-20 left-6 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full shadow-lg flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700 transition-colors"
        title={isDarkEffective ? 'Mode Gelap aktif' : 'Mode Terang aktif'}
        aria-label="Toggle dark mode"
      >
        {isDarkEffective
          ? <Sun className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          : <Moon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        }
      </button>

      {/* ── FAB: Guide Book ── */}
      <button
        onClick={() => setShowGuideModal(true)}
        className="fixed bottom-28 sm:bottom-[136px] right-4 sm:right-6 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 bg-indigo-500 hover:bg-indigo-600 border border-indigo-400/20"
        title="Buku Panduan Penggunaan"
        aria-label="Buku Panduan"
      >
        <BookOpen className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </button>

      {/* ── FAB: Export PNG ── */}
      <button
        onClick={exportTreeAsPng}
        disabled={loading || totalMembers === 0 || isExporting}
        className={`fixed bottom-16 sm:bottom-20 right-4 sm:right-6 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 border border-emerald-400/20 ${loading || totalMembers === 0 || isExporting
            ? 'bg-slate-400 cursor-not-allowed'
            : 'bg-emerald-500 hover:bg-emerald-600'
          }`}
        title={isExporting ? 'Mengekspor...' : 'Export pohon silsilah (PNG)'}
        aria-label="Export PNG"
      >
        <Download className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </button>

      {/* ── FAB: Edit / Preview Toggle ── */}
      <button
        onClick={() => setIsEditMode((v) => !v)}
        className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40 w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 border ${isEditMode
            ? 'bg-red-500 hover:bg-red-600 border-red-400/20'
            : 'bg-cyan-500 hover:bg-cyan-600 border-cyan-400/20'
          }`}
        title={isEditMode ? 'Kembali ke mode preview' : 'Masuk ke mode edit'}
      >
        {isEditMode
          ? <Eye className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          : <Pencil className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
        }
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Root — wraps FamilyTreeApp dengan ReactFlowProvider
───────────────────────────────────────────────────────── */
export default function App() {
  return (
    <ReactFlowProvider>
      <FamilyTreeApp />
    </ReactFlowProvider>
  );
}
