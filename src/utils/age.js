/**
 * Menghitung umur dalam tahun. Jika deathDate diberikan, umur dihitung
 * sampai tanggal wafat (bukan sampai hari ini).
 */
export function calculateAge(birthDate, deathDate = null) {
  if (!birthDate) return null;
  const start = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  let age = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < start.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getYear(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.getFullYear();
}
