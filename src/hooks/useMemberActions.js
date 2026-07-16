import { useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const MODAL_CLOSED = {
  isOpen: false,
  mode: 'addChildSingle',
  parentId: null,
  parentName: '',
  isRoot: false,
  editingMemberId: null,
  editingData: null,
};

export function useMemberActions(members) {
  const [modalState, setModalState] = useState(MODAL_CLOSED);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showBioDataModal, setShowBioDataModal] = useState(false);

  // ── Modal open helpers
  const handleOpenAddChild = useCallback((parentId, parentName) => {
    setModalState({ isOpen: true, mode: 'addChildSingle', parentId, parentName, isRoot: false, editingMemberId: null, editingData: null });
  }, []);

  const handleOpenAddRoot = useCallback(() => {
    setModalState({ isOpen: true, mode: 'rootCouple', parentId: null, parentName: '', isRoot: true, editingMemberId: null, editingData: null });
  }, []);

  const handleOpenAddSpouse = useCallback((memberId, memberName, gender) => {
    setModalState({
      isOpen: true,
      mode: 'addSpouse',
      parentId: memberId,
      parentName: memberName,
      isRoot: false,
      editingMemberId: null,
      editingData: { gender: gender === 'male' ? 'female' : 'male' },
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false, editingMemberId: null, editingData: null }));
  }, []);

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

  // ── BioData
  const handleShowBioData = useCallback((memberData) => {
    const spouseId = memberData?.spouseId ?? null;
    const spouse = spouseId ? members.find((m) => m.id === spouseId) ?? null : null;

    const siblings = members
      .filter((m) => m.parentId === memberData?.id)
      .sort((a, b) => {
        const ao = typeof a.childOrder === 'number' ? a.childOrder : Number.POSITIVE_INFINITY;
        const bo = typeof b.childOrder === 'number' ? b.childOrder : Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0) || a.name?.localeCompare(b.name ?? '');
      });

    const children = siblings.map((c) => ({
      id: c.id,
      name: c.name,
      childIndex: siblings.findIndex((x) => x.id === c.id) + 1,
    }));

    setSelectedMember({ ...memberData, spouse, children });
    setShowBioDataModal(true);
  }, [members]);

  const handleCloseBioData = useCallback(() => {
    setShowBioDataModal(false);
    setTimeout(() => setSelectedMember(null), 300);
  }, []);

  // ── Save member (all modes)
  const handleSaveMember = useCallback(async (formData) => {
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
        spouseId: formData.spouseId ?? null,
        childOrder: typeof formData.childOrder === 'number' ? formData.childOrder : null,
      };

      // ── Edit existing
      if (modalState.editingMemberId) {
        await updateDoc(doc(db, 'members', modalState.editingMemberId), {
          ...normalizedData,
          updatedAt: serverTimestamp(),
        });
      }
      // ── Add root couple
      else if (modalState.mode === 'rootCouple') {
        const husb = formData?.rootHusband;
        const wife = formData?.rootWife;
        if (!husb?.name || !wife?.name) throw new Error('Nama kakek & nenek wajib diisi.');

        const husbRef = await addDoc(collection(db, 'members'), {
          ...husb, spouseId: null, childOrder: null, parentId: null, createdAt: serverTimestamp(),
        });
        const wifeRef = await addDoc(collection(db, 'members'), {
          ...wife, spouseId: null, childOrder: null, parentId: null, createdAt: serverTimestamp(),
        });

        await Promise.all([
          updateDoc(doc(db, 'members', husbRef.id), { spouseId: wifeRef.id, updatedAt: serverTimestamp() }),
          updateDoc(doc(db, 'members', wifeRef.id), { spouseId: husbRef.id, updatedAt: serverTimestamp() }),
        ]);
      }
      // ── Add spouse to existing single
      else if (modalState.mode === 'addSpouse') {
        const targetMemberId = modalState.parentId;
        if (!targetMemberId) throw new Error('Target anggota tidak ditemukan.');

        const spouseRef = await addDoc(collection(db, 'members'), {
          ...normalizedData, parentId: null, createdAt: serverTimestamp(),
        });

        await Promise.all([
          updateDoc(doc(db, 'members', targetMemberId), { spouseId: spouseRef.id, updatedAt: serverTimestamp() }),
          updateDoc(doc(db, 'members', spouseRef.id), { spouseId: targetMemberId, updatedAt: serverTimestamp() }),
        ]);
      }
      // ── Add child + spouse together (form mode can override modal mode)
      else if (formData.mode === 'addChildCouple' || modalState.mode === 'addChildCouple') {
        const parentId = modalState.parentId ?? null;
        const childInput = formData.childData;
        const spouseInput = formData.spouseData;
        if (!childInput?.name || !spouseInput?.name) throw new Error('Nama anak dan pasangan wajib diisi.');

        const siblingOrders = members
          .filter((m) => m.parentId === parentId)
          .map((s) => (typeof s.childOrder === 'number' ? s.childOrder : null))
          .filter((v) => v !== null);
        const maxOrder = siblingOrders.length ? Math.max(...siblingOrders) : 0;

        const childRef = await addDoc(collection(db, 'members'), {
          ...childInput, spouseId: null, childOrder: maxOrder + 1, parentId, createdAt: serverTimestamp(),
        });
        const spouseRef = await addDoc(collection(db, 'members'), {
          ...spouseInput, spouseId: null, childOrder: null, parentId: null, createdAt: serverTimestamp(),
        });

        await Promise.all([
          updateDoc(doc(db, 'members', childRef.id), { spouseId: spouseRef.id, updatedAt: serverTimestamp() }),
          updateDoc(doc(db, 'members', spouseRef.id), { spouseId: childRef.id, updatedAt: serverTimestamp() }),
        ]);
      }
      // ── Add single child
      else {
        const parentId = modalState.isRoot ? null : modalState.parentId;
        let childOrderToSave = normalizedData.childOrder;

        if (!modalState.isRoot && (childOrderToSave === null || childOrderToSave === undefined)) {
          const siblingOrders = members
            .filter((m) => m.parentId === parentId)
            .map((s) => (typeof s.childOrder === 'number' ? s.childOrder : null))
            .filter((v) => v !== null);
          const maxOrder = siblingOrders.length ? Math.max(...siblingOrders) : 0;
          childOrderToSave = maxOrder + 1;
        }

        await addDoc(collection(db, 'members'), {
          ...normalizedData, childOrder: childOrderToSave, parentId, createdAt: serverTimestamp(),
        });
      }

      setModalState(MODAL_CLOSED);
    } catch (err) {
      console.error('Gagal menyimpan data ke Firestore:', err);
      alert('Gagal menyimpan data. Periksa konfigurasi Firebase Anda.');
    }
  }, [modalState, members]);

  return {
    modalState,
    selectedMember,
    showBioDataModal,
    handleOpenAddChild,
    handleOpenAddRoot,
    handleOpenAddSpouse,
    handleCloseModal,
    handleEditMember,
    handleShowBioData,
    handleCloseBioData,
    handleSaveMember,
  };
}
