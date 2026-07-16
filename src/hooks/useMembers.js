import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { collectDescendantIds } from '../utils/tree';

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
      const descendantIds = collectDescendantIds(memberId, members);
      const allIdsToDelete = [memberId, ...descendantIds];
      const membersToDelete = allIdsToDelete
        .map((id) => members.find((m) => m.id === id))
        .filter(Boolean);

      await Promise.allSettled(
        membersToDelete.map(async (member) => {
          if (!member?.photoUrl && !member?.photoFileId) return;
          await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoUrl: member.photoUrl, fileId: member.photoFileId }),
          });
        })
      );

      const spouseMember = members.find((m) => m.spouseId === memberId);
      const batch = writeBatch(db);
      if (spouseMember) {
        batch.update(doc(db, 'members', spouseMember.id), { spouseId: null });
      }
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
