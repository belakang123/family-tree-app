import React, { useState, useEffect } from 'react';
import { Sparkles, UserPlus } from 'lucide-react';

/* ─────────────────────────────────────────────
   Reusable field components
───────────────────────────────────────────── */
const inputCls =
  'w-full border border-slate-200 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white/95 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500';

const labelCls = 'block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1';

function PhotoInput({ preview, onChange, onRemove, isEdit }) {
  return (
    <div>
      <label className={labelCls}>Foto Profil (opsional)</label>
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
      />
      {preview && (
        <div className="relative mt-2 inline-block">
          <img src={preview} alt="Preview" className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
          {isEdit && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs font-bold"
              aria-label="Hapus foto"
            >×</button>
          )}
        </div>
      )}
    </div>
  );
}

/** Formulir data satu orang (nama, gender, TTL, alamat, hp, foto, wafat) */
function PersonForm({ prefix, data, onChange }) {
  const {
    name, gender, birthDate, isDeceased, deathDate,
    alamat, noHp, photoPreview,
  } = data;

  return (
    <div className="space-y-3">
      {/* Nama */}
      <div>
        <label className={labelCls}>Nama Lengkap</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Contoh: Budi Santoso"
          className={inputCls}
        />
      </div>

      {/* Gender */}
      <div>
        <label className={labelCls}>Jenis Kelamin</label>
        <div className="flex gap-3">
          {['male', 'female'].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange('gender', g)}
              className={`flex-1 py-2 rounded-xl text-sm border transition-all duration-150 focus:outline-none focus:ring-2 ${
                gender === g
                  ? g === 'male'
                    ? 'bg-emerald-600/10 border-emerald-500/60 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 ring-1 ring-emerald-400/20 focus:ring-emerald-300/70'
                    : 'bg-rose-600/10 border-rose-500/60 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300 ring-1 ring-rose-400/20 focus:ring-rose-300/70'
                  : 'bg-white/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white/80 focus:ring-slate-300/70'
              }`}
            >
              {g === 'male' ? 'Laki-laki' : 'Perempuan'}
            </button>
          ))}
        </div>
      </div>

      {/* Tanggal Lahir */}
      <div>
        <label className={labelCls}>Tanggal Lahir</label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => onChange('birthDate', e.target.value)}
          className="w-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/50 p-2 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {/* Alamat */}
      <div>
        <label className={labelCls}>Alamat</label>
        <textarea
          value={alamat}
          onChange={(e) => onChange('alamat', e.target.value)}
          rows={2}
          placeholder="Alamat tinggal"
          className="w-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/50 p-2 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {/* No HP */}
      <div>
        <label className={labelCls}>No HP</label>
        <input
          type="text"
          value={noHp}
          onChange={(e) => onChange('noHp', e.target.value)}
          placeholder="Contoh: 0812-3456-7890"
          inputMode="tel"
          className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white/90 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100"
        />
      </div>

      {/* Foto */}
      <PhotoInput
        preview={photoPreview}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange('photo', file);
        }}
      />

      {/* Status Wafat */}
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
        <input
          type="checkbox"
          checked={isDeceased}
          onChange={(e) => onChange('isDeceased', e.target.checked)}
          className="rounded"
        />
        Telah wafat / meninggal
      </label>

      {isDeceased && (
        <div>
          <label className={labelCls}>Tanggal Wafat</label>
          <input
            type="date"
            value={deathDate}
            onChange={(e) => onChange('deathDate', e.target.value)}
            className="w-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/50 p-2 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Default person state
───────────────────────────────────────────── */
const emptyPerson = (gender = 'male') => ({
  name: '', gender, birthDate: '', isDeceased: false, deathDate: '',
  alamat: '', noHp: '', photo: null, photoPreview: null,
});

/* ─────────────────────────────────────────────
   Main InputModal
───────────────────────────────────────────── */
export default function InputModal({
  isOpen,
  onClose,
  parentName,
  isRoot,
  onSave,
  editingData,
  members = [],
  mode = 'addChildSingle',
}) {
  // ── Single-person state (for edit, addSpouse, addChildSingle single tab)
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [birthDate, setBirthDate] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [deathDate, setDeathDate] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noHp, setNoHp] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [spouseId, setSpouseId] = useState(null);
  const [childOrder, setChildOrder] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // ── Couple-tab states shared for both rootCouple & addChildCouple
  const [activeTab, setActiveTab] = useState('person'); // 'person'|'spouse' for addChildCouple, 'husband'|'wife' for rootCouple
  const [withSpouse, setWithSpouse] = useState(false); // toggle for addChildSingle to add spouse

  // Husband / Person A data
  const [husbData, setHusbData] = useState(emptyPerson('male'));
  // Wife / Person B data
  const [wifeData, setWifeData] = useState(emptyPerson('female'));

  const isEditMode = !!(editingData && editingData.id);
  const isCouple = mode === 'rootCouple' || (mode === 'addChildSingle' && withSpouse);
  const isRootCouple = mode === 'rootCouple';

  // ── Reset on open
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode) {
      setName(editingData.name || '');
      setGender(editingData.gender || 'male');
      setBirthDate(editingData.birthDate || '');
      setIsDeceased(!!editingData.isDeceased);
      setDeathDate(editingData.deathDate || '');
      setAlamat(editingData.alamat || '');
      setNoHp(editingData.noHp || '');
      setSpouseId(editingData.spouseId ?? null);
      setChildOrder(typeof editingData.childOrder === 'number' ? editingData.childOrder : null);
      setPhoto(null);
      setPhotoPreview(editingData.photoUrl || null);
      setRemovePhoto(false);
    } else {
      setName('');
      setGender(editingData?.gender || 'male');
      setBirthDate('');
      setIsDeceased(false);
      setDeathDate('');
      setAlamat('');
      setNoHp('');
      setSpouseId(null);
      setChildOrder(null);
      setPhoto(null);
      setPhotoPreview(null);
      setRemovePhoto(false);
      setWithSpouse(false);
      setActiveTab(isRootCouple ? 'husband' : 'person');
      setHusbData(emptyPerson('male'));
      setWifeData(emptyPerson('female'));
    }
    setError('');
    setUploading(false);
  }, [isOpen, editingData, isEditMode, isRootCouple]);

  if (!isOpen) return null;

  // ── Helper: update couple person data
  const updateHusb = (key, val) => {
    setHusbData((prev) => ({
      ...prev,
      [key]: val,
      ...(key === 'photo' ? { photoPreview: URL.createObjectURL(val) } : {}),
    }));
  };
  const updateWife = (key, val) => {
    setWifeData((prev) => ({
      ...prev,
      [key]: val,
      ...(key === 'photo' ? { photoPreview: URL.createObjectURL(val) } : {}),
    }));
  };

  // ── Upload photo helper
  const uploadPhoto = async (photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload foto gagal');
    const result = await res.json();
    const url = result.url ?? (result.fileId ? `https://drive.google.com/uc?id=${result.fileId}` : null);
    return { url, fileId: result.fileId ?? null };
  };

  const deletePhotoFromDrive = async (photoUrl, fileId) => {
    if (!photoUrl && !fileId) return;
    try {
      await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl, fileId }),
      });
    } catch (err) {
      console.error('Gagal menghapus foto lama dari Drive:', err);
    }
  };

  // ── Upload couple person photos and return enriched object
  const uploadPersonData = async (personData) => {
    let photoUrl = null;
    let photoFileId = null;
    if (personData.photo) {
      const { url, fileId } = await uploadPhoto(personData.photo);
      photoUrl = url;
      photoFileId = fileId;
    }
    return {
      name: personData.name.trim(),
      gender: personData.gender,
      birthDate: personData.birthDate || null,
      isDeceased: personData.isDeceased,
      deathDate: personData.isDeceased ? personData.deathDate || null : null,
      alamat: personData.alamat || null,
      noHp: personData.noHp || null,
      photoUrl,
      photoFileId,
    };
  };

  // ── Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ── 1. Root couple (Tambah Leluhur)
    if (isRootCouple && !isEditMode) {
      if (!husbData.name.trim() || !wifeData.name.trim()) {
        setError('Nama Kakek dan Nama Nenek wajib diisi.');
        return;
      }
      setUploading(true);
      try {
        const [rootHusband, rootWife] = await Promise.all([
          uploadPersonData(husbData),
          uploadPersonData(wifeData),
        ]);
        onSave({ mode: 'rootCouple', rootHusband, rootWife });
      } catch (err) {
        setError('Gagal mengunggah foto. Silakan coba lagi.');
        console.error(err);
      } finally {
        setUploading(false);
      }
      return;
    }

    // ── 2. Add Child + Spouse (Couple)
    if (mode === 'addChildSingle' && withSpouse && !isEditMode) {
      if (!husbData.name.trim() || !wifeData.name.trim()) {
        setError('Nama anak dan nama pasangannya wajib diisi.');
        return;
      }
      setUploading(true);
      try {
        const [childData, spouseData] = await Promise.all([
          uploadPersonData(husbData),
          uploadPersonData(wifeData),
        ]);
        onSave({ mode: 'addChildCouple', childData, spouseData });
      } catch (err) {
        setError('Gagal mengunggah foto. Silakan coba lagi.');
        console.error(err);
      } finally {
        setUploading(false);
      }
      return;
    }

    // ── 3. Single person (addChildSingle solo, addSpouse, edit)
    if (!name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }

    setUploading(true);
    try {
      let photoUrl = removePhoto ? null : editingData?.photoUrl || null;
      let photoFileId = removePhoto ? null : editingData?.photoFileId || null;

      if (removePhoto && (editingData?.photoUrl || editingData?.photoFileId)) {
        await deletePhotoFromDrive(editingData.photoUrl, editingData.photoFileId);
      } else if (photo) {
        try {
          if (editingData?.photoUrl || editingData?.photoFileId) {
            await deletePhotoFromDrive(editingData.photoUrl, editingData.photoFileId);
          }
          const { url, fileId } = await uploadPhoto(photo);
          photoUrl = url;
          photoFileId = fileId;
        } catch (err) {
          setError('Foto gagal diunggah. Silakan coba lagi.');
          setUploading(false);
          return;
        }
      }

      onSave({
        mode,
        name: name.trim(),
        gender,
        birthDate: birthDate || null,
        isDeceased,
        deathDate: isDeceased ? deathDate || null : null,
        alamat: alamat || null,
        noHp: noHp || null,
        photoUrl,
        photoFileId,
        spouseId: spouseId || null,
        childOrder: typeof childOrder === 'number' ? childOrder : null,
      });
    } finally {
      setUploading(false);
    }
  };

  // ── Tab config
  const coupleTabConfig = isRootCouple
    ? [
        { key: 'husband', label: 'Kakek (Suami)', data: husbData, update: updateHusb },
        { key: 'wife', label: 'Nenek (Istri)', data: wifeData, update: updateWife },
      ]
    : [
        { key: 'person', label: 'Data Anak', data: husbData, update: updateHusb },
        { key: 'spouse', label: 'Data Pasangan', data: wifeData, update: updateWife },
      ];

  const currentTab = coupleTabConfig.find((t) => t.key === activeTab) ?? coupleTabConfig[0];

  // ── Title
  const title = mode === 'addSpouse'
    ? `Tambah Pasangan untuk ${parentName}`
    : isEditMode
    ? 'Edit Anggota Keluarga'
    : isRoot
    ? 'Tambah Leluhur Pertama'
    : `Tambah Anak dari ${parentName}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl animate-fadeIn max-h-[90vh] flex flex-col border border-emerald-100/60 bg-white/95 dark:border-emerald-900/40 dark:bg-slate-900/90"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color line */}
        <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-emerald-400/90 via-indigo-400/80 to-cyan-400/70" aria-hidden="true" />

        {/* Header */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          </div>
          {!isRoot && !isEditMode && mode === 'addChildSingle' && (
            <p className="text-xs text-slate-500 mt-0.5">
              Anak dari <span className="font-semibold text-slate-700 dark:text-slate-300">{parentName}</span>
            </p>
          )}
          {mode === 'addSpouse' && (
            <p className="text-xs text-slate-500 mt-0.5">
              Pasangan dari <span className="font-semibold text-slate-700 dark:text-slate-300">{parentName}</span>
            </p>
          )}
        </div>

        {/* Scrollable content */}
        <div className="px-6 pb-2 overflow-y-auto flex-1">
          <form id="input-modal-form" onSubmit={handleSubmit} className="space-y-4">

            {/* ── Toggle "tambah pasangan sekaligus" untuk addChildSingle */}
            {mode === 'addChildSingle' && !isEditMode && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none bg-indigo-50 dark:bg-indigo-950/30 px-3 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <div
                  onClick={() => {
                    setWithSpouse((v) => !v);
                    setActiveTab(!withSpouse ? 'person' : 'person');
                  }}
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${withSpouse ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${withSpouse ? 'translate-x-4' : ''}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                    <UserPlus size={13} className="text-indigo-500" />
                    Tambah beserta pasangan
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Isi data anak dan pasangannya sekaligus</p>
                </div>
              </label>
            )}

            {/* ── Couple Tab Mode */}
            {isCouple && !isEditMode ? (
              <div className="space-y-4">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-700">
                  {coupleTabConfig.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 py-2 text-center text-xs font-semibold border-b-2 transition-all ${
                        activeTab === tab.key
                          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                          : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <PersonForm
                  prefix={currentTab.key}
                  data={currentTab.data}
                  onChange={currentTab.update}
                />

                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              </div>
            ) : (
              /* ── Single Person Form */
              <>
                <div>
                  <label className={labelCls}>Nama Lengkap</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Jenis Kelamin</label>
                  <div className="flex gap-3">
                    {['male', 'female'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 py-2 rounded-xl text-sm border transition-all duration-150 focus:outline-none focus:ring-2 ${
                          gender === g
                            ? g === 'male'
                              ? 'bg-emerald-600/10 border-emerald-500/60 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 ring-1 ring-emerald-400/20 focus:ring-emerald-300/70'
                              : 'bg-rose-600/10 border-rose-500/60 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300 ring-1 ring-rose-400/20 focus:ring-rose-300/70'
                            : 'bg-white/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white/80 focus:ring-slate-300/70'
                        }`}
                      >
                        {g === 'male' ? 'Laki-laki' : 'Perempuan'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Tanggal Lahir</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/50 p-2 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className={labelCls}>Alamat</label>
                  <textarea
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    rows={2}
                    placeholder="Contoh: Jl. Melati No. 10, Jakarta"
                    className="w-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/50 p-2 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>

                <div>
                  <label className={labelCls}>No HP</label>
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    inputMode="tel"
                    className="w-full border border-slate-200 p-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white/90 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100"
                  />
                </div>

                <PhotoInput
                  preview={photoPreview}
                  isEdit={isEditMode}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); }
                  }}
                  onRemove={() => { setPhotoPreview(null); setPhoto(null); setRemovePhoto(true); }}
                />

                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
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
                    <label className={labelCls}>Tanggal Wafat</label>
                    <input
                      type="date"
                      value={deathDate}
                      onChange={(e) => setDeathDate(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/50 p-2 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                )}

                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              </>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 pt-3 pb-5 shrink-0 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800/40"
          >
            Batal
          </button>
          <button
            type="submit"
            form="input-modal-form"
            disabled={uploading}
            className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Menyimpan...' : isEditMode ? 'Simpan Perubahan' : 'Simpan Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
