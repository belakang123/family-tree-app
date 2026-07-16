import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { collectAllDeleteIds } from '../utils/tree';

export function useMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    memberId: null,
    memberName: '',
  });

  // Realtime subscription ke Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'members'),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
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

  const handleDeleteMember = useCallback((memberId, memberName) => {
    setConfirmDelete({ isOpen: true, memberId, memberName });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const { memberId } = confirmDelete;
    try {
      // Kumpulkan semua ID yang harus dihapus:
      // anggota yang dipilih + pasangannya + semua keturunan + pasangan tiap keturunan
      const allIdsToDelete = collectAllDeleteIds(memberId, members);
      const membersToDelete = allIdsToDelete
        .map((id) => members.find((m) => m.id === id))
        .filter(Boolean);

      // Hapus semua foto dari Google Drive terlebih dahulu
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

      // Hapus semua dokumen Firestore sekaligus dengan batch
      // Jika ada anggota lain di luar set hapus yang memiliki spouseId ke salah satu
      // anggota yang dihapus, putuskan relasinya
      const deletedIdSet = new Set(allIdsToDelete);
      const orphanedSpouses = members.filter(
        (m) => !deletedIdSet.has(m.id) && m.spouseId && deletedIdSet.has(m.spouseId)
      );

      const batch = writeBatch(db);
      for (const orphan of orphanedSpouses) {
        batch.update(doc(db, 'members', orphan.id), { spouseId: null });
      }
      for (const id of allIdsToDelete) {
        batch.delete(doc(db, 'members', id));
      }
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

  return {
    members,
    loading,
    firestoreError,
    confirmDelete,
    handleDeleteMember,
    handleConfirmDelete,
    handleCancelDelete,
  };
}
