import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export default function InputModal({ isOpen, onClose, parentName, isRoot, onSave, editingData }) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [birthDate, setBirthDate] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [deathDate, setDeathDate] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noHp, setNoHp] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Reset form setiap kali modal dibuka atau data edit berubah
  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        // Mode edit: pre-fill form dengan data existing
        setName(editingData.name || '');
        setGender(editingData.gender || 'male');
        setBirthDate(editingData.birthDate || '');
        setIsDeceased(!!editingData.isDeceased);
        setDeathDate(editingData.deathDate || '');
        setAlamat(editingData.alamat || '');
        setNoHp(editingData.noHp || '');
        setPhoto(null);
        setPhotoPreview(editingData.photoUrl || null);
        setRemovePhoto(false);
        setError('');
        setUploading(false);
      } else {
        // Mode add: reset semua field
        setName('');
        setGender('male');
        setBirthDate('');
        setIsDeceased(false);
        setDeathDate('');
        setAlamat('');
        setNoHp('');
        setPhoto(null);
        setPhotoPreview(null);
        setRemovePhoto(false);
        setError('');
        setUploading(false);
      }
    }
  }, [isOpen, editingData]);

  if (!isOpen) return null;

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const deletePhotoFromDrive = async (photoUrl, fileId) => {
    if (!photoUrl && !fileId) return;

    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl, fileId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gagal menghapus foto lama dari Drive:', errorText);
      }
    } catch (err) {
      console.error('Gagal menghubungi endpoint delete foto:', err);
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

    try {
      let photoUrl = removePhoto ? null : editingData?.photoUrl || null;
      let photoFileId = removePhoto ? null : editingData?.photoFileId || null;

      if (removePhoto && (editingData?.photoUrl || editingData?.photoFileId)) {
        await deletePhotoFromDrive(editingData.photoUrl, editingData.photoFileId);
      } else if (photo) {
        try {
          const formData = new FormData();
          formData.append('photo', photo);

          const res = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Upload foto gagal');
          }

          const result = await res.json();
          photoUrl = result.url ?? null;
          photoFileId = result.fileId ?? null;

          if (!photoUrl && photoFileId) {
            photoUrl = `https://drive.google.com/uc?id=${photoFileId}`;
          }

          if (editingData?.photoUrl || editingData?.photoFileId) {
            await deletePhotoFromDrive(editingData.photoUrl, editingData.photoFileId);
          }
        } catch (err) {
          console.error('Gagal menghubungi endpoint upload:', err);
          setError('Foto gagal diunggah. Silakan coba lagi.');
          return;
        }
      }

      onSave({
        name: name.trim(),
        gender,
        birthDate: birthDate || null,
        isDeceased,
        deathDate: isDeceased ? deathDate || null : null,
        alamat: alamat || null,
        noHp: noHp || null,
        photoUrl,
        photoFileId,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-6 animate-fadeIn max-h-[90vh] overflow-y-auto border border-emerald-100/60 bg-white/95 dark:border-emerald-900/40 dark:bg-slate-900/85"
        onClick={(e) => e.stopPropagation()}
      >


        {/* Header tint */}
        <div
          className="h-1 w-full rounded-t-2xl -mx-6 px-6 bg-gradient-to-r from-emerald-400/90 via-indigo-400/80 to-cyan-400/70"
          aria-hidden="true"
        />

        <div className="relative -mt-2">
          <div className="flex items-center gap-1.5 text-slate-800">
            <Sparkles size={16} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">

              {editingData
                ? 'Edit Anggota Keluarga'
                : isRoot
                ? 'Tambah Leluhur Pertama'
                : 'Tambah Anggota Keluarga'}
            </h2>
          </div>
          {!isRoot && !editingData && (
            <p className="text-xs text-slate-500 mt-1">
              Hubungan: Anak dari <span className="font-semibold text-slate-700">{parentName}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nama Lengkap</label>

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
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex-1 py-2 rounded-xl text-sm border transition-all duration-150 ${
                  gender === 'male'
                    ? 'bg-emerald-600/10 border-emerald-500/60 text-emerald-800 ring-1 ring-emerald-400/20'
                    : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white/80'
                } focus:outline-none focus:ring-2 focus:ring-emerald-300/70`}
                aria-pressed={gender === 'male'}
              >
                Laki-laki
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex-1 py-2 rounded-xl text-sm border transition-all duration-150 ${
                  gender === 'female'
                    ? 'bg-rose-600/10 border-rose-500/60 text-rose-800 ring-1 ring-rose-400/20'
                    : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white/80'
                } focus:outline-none focus:ring-2 focus:ring-rose-300/70`}
                aria-pressed={gender === 'female'}
              >
                Perempuan
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Lahir</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/50 p-2 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />

          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat</label>
            <textarea
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              rows={3}
              placeholder="Contoh: Jl. Melati No. 10, Jakarta"
              className="w-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/50 p-2 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />

          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">No HP</label>
            <input
              type="text"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
              placeholder="Contoh: 0812-3456-7890"
              inputMode="tel"
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
              <div className="relative mt-2 inline-block">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-14 h-14 rounded-full object-cover border border-slate-200"
                />
                {editingData && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhoto(null);
                      setRemovePhoto(true);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs font-bold"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                )}
              </div>
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
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Tanggal Wafat</label>

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
              className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? 'Menyimpan...' : editingData ? 'Simpan Perubahan' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
