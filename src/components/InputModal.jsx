import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export default function InputModal({ isOpen, onClose, parentName, isRoot, onSave }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [birthDate, setBirthDate] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [deathDate, setDeathDate] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Reset form setiap kali modal dibuka
  useEffect(() => {
    if (isOpen) {
      setName('');
      setGender('male');
      setBirthDate('');
      setIsDeceased(false);
      setDeathDate('');
      setPhoto(null);
      setPhotoPreview(null);
      setError('');
      setUploading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    setError('');
    setUploading(true);

    // Foto bersifat opsional. Jika ada, unggah dulu ke endpoint Vercel
    // yang meneruskannya ke Google Drive, baru simpan URL publiknya ke Firestore.
    let photoUrl = null;
    if (photo) {
      try {
        const formData = new FormData();
        formData.append('photo', photo);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (res.ok) {
          const result = await res.json();
          photoUrl = result.url ?? null;
        } else {
          console.error('Upload foto gagal, data tetap disimpan tanpa foto.');
        }
      } catch (err) {
        console.error('Gagal menghubungi endpoint upload:', err);
      }
    }

    onSave({
      name: name.trim(),
      gender,
      birthDate: birthDate || null,
      isDeceased,
      deathDate: isDeceased ? deathDate || null : null,
      photoUrl,
    });

    setUploading(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 text-slate-800">
          <Sparkles size={16} className="text-emerald-500" />
          <h2 className="text-lg font-bold">
            {isRoot ? 'Tambah Leluhur Pertama' : 'Tambah Anggota Keluarga'}
          </h2>
        </div>
        {!isRoot && (
          <p className="text-xs text-slate-500 mt-1">
            Hubungan: Anak dari <span className="font-semibold text-slate-700">{parentName}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Kelamin</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={() => setGender('male')}
                />
                Laki-laki
              </label>
              <label className="flex items-center gap-1.5 text-sm text-slate-700">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={() => setGender('female')}
                />
                Perempuan
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Lahir</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Foto Profil (opsional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            {photoPreview && (
              <img
                src={photoPreview}
                alt="Preview"
                className="mt-2 w-14 h-14 rounded-full object-cover border border-slate-200"
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isDeceased}
              onChange={(e) => setIsDeceased(e.target.checked)}
              className="rounded"
            />
            Anggota keluarga ini telah wafat / meninggal
          </label>

          {isDeceased && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Wafat</label>
              <input
                type="date"
                value={deathDate}
                onChange={(e) => setDeathDate(e.target.value)}
                className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              {uploading ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
