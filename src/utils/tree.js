/**
 * Kumpulkan ID semua keturunan (anak, cucu, dst.) dari parentId tertentu.
 * Hanya mengikuti relasi parentId, tidak termasuk pasangan.
 */
export function collectDescendantIds(parentId, members) {
  const children = members.filter((m) => m.parentId === parentId);
  return children.flatMap((c) => [c.id, ...collectDescendantIds(c.id, members)]);
}

/**
 * Kumpulkan ID semua anggota yang harus dihapus ketika satu anggota dihapus.
 *
 * Aturan:
 * 1. Anggota yang dihapus (memberId) → ikut dihapus beserta pasangannya (spouseId).
 * 2. Semua keturunan (anak, cucu, dst.) dari memberId → ikut dihapus.
 * 3. Pasangan dari setiap keturunan → ikut dihapus.
 *
 * Catatan: pasangan di luar keturunan (misalnya "mertua" hasil nikah) TIDAK dihapus
 * kecuali mereka adalah keturunan langsung dari memberId.
 *
 * @param {string} memberId - ID anggota yang diklik hapus
 * @param {Array}  members  - Seluruh anggota dari Firestore
 * @returns {string[]} Array unik ID yang harus dihapus (sudah termasuk memberId)
 */
export function collectAllDeleteIds(memberId, members) {
  const toDelete = new Set();

  const addWithSpouse = (id) => {
    if (!id || toDelete.has(id)) return;
    toDelete.add(id);

    // Sertakan pasangan
    const member = members.find((m) => m.id === id);
    if (member?.spouseId && !toDelete.has(member.spouseId)) {
      toDelete.add(member.spouseId);
    }

    // Sertakan semua anak (berdasarkan parentId = id ini)
    // Kemudian rekursif ke bawah
    const children = members.filter((m) => m.parentId === id);
    for (const child of children) {
      addWithSpouse(child.id);
    }
  };

  addWithSpouse(memberId);
  return [...toDelete];
}
