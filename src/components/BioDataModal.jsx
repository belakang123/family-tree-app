import React, { useState } from 'react';
import { X } from 'lucide-react';
import { calculateAge, formatDate, getYear } from '../utils/age';

export default function BioDataModal({ member, isOpen, onClose }) {
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !member) return null;

  const isMale = member.gender === 'male';
  const isDeceased = !!member.isDeceased;
  const age = calculateAge(member.birthDate, isDeceased ? member.deathDate : null);
  const photoUrl = normalizePhotoUrl(member.photoUrl);

  function normalizePhotoUrl(url) {
    if (!url) return null;

    const cleaned = url.trim();
    const driveIdMatch = cleaned.match(/[?&]id=([^&]+)/i) || cleaned.match(/\/d\/([^/?&]+)/i);
    if (driveIdMatch?.[1]) {
      const canonical = `https://drive.google.com/uc?export=download&id=${driveIdMatch[1]}`;
      return `/api/proxy?url=${encodeURIComponent(canonical)}`;
    }

    if (/^https?:\/\/lh3\.googleusercontent\.com/i.test(cleaned)) {
      const fileIdMatch = cleaned.match(/\/d\/([^/?&]+)/i);
      if (fileIdMatch?.[1]) {
        const canonical = `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
        return `/api/proxy?url=${encodeURIComponent(canonical)}`;
      }
    }

    if (/^[A-Za-z0-9_-]{15,}$/.test(cleaned)) {
      const canonical = `https://drive.google.com/uc?export=download&id=${cleaned}`;
      return `/api/proxy?url=${encodeURIComponent(canonical)}`;
    }

    if (/^https?:\/\/.*drive\.google\.com\//i.test(cleaned)) {
      const canonical = cleaned.replace(/uc\?id=/i, 'uc?export=download&id=').replace(/\/view.*$/i, '');
      return `/api/proxy?url=${encodeURIComponent(canonical)}`;
    }

    return cleaned;
  }

  const borderColor = isMale ? 'border-sky-400/60' : 'border-rose-400/60';
  const badgeColor = isMale ? 'bg-sky-500' : 'bg-rose-500';
  const avatarBg = isMale ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700';

  function getInitials(name = '') {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 max-h-[90vh] overflow-y-auto border border-slate-100 dark:bg-slate-900 dark:border-slate-700"

        onClick={(e) => e.stopPropagation()}
      >
        {/* Header tint */}
        <div
          className={`h-1 w-full ${isMale ? 'bg-sky-400/80' : 'bg-rose-400/80'} rounded-t-2xl`}
          aria-hidden="true"
        />

        <div className="p-6">
          {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
        title="Tutup"
      >
            <X size={20} className="text-slate-600 dark:text-slate-300" />
          </button>

          {/* Biodata Content */}
          <div className="text-center mb-6 pt-2">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden border-4 ${borderColor} ${avatarBg} mx-auto mb-4`}
            >
              {photoUrl && !imageError ? (
                <img
                  src={photoUrl}
                  alt={member.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              ) : (
                getInitials(member.name) || '?'
              )}
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{member.name}</h2>

            <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full font-semibold text-white ${badgeColor}`}>
              {isMale ? 'Laki-laki' : 'Perempuan'}
            </span>
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-slate-700">

            {member.birthDate && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tanggal Lahir</p>
                <p className="text-sm text-slate-800 dark:text-slate-100 font-medium">{formatDate(member.birthDate)}</p>
              </div>
            )}

            {age !== null && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Umur</p>
                <p className="text-sm text-slate-800 dark:text-slate-100 font-medium">
                  {isDeceased ? `${age} tahun (saat wafat)` : `${age} tahun`}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Status</p>
              {isDeceased ? (
                <div>
                  <p className="text-sm text-stone-700 dark:text-stone-200 font-medium">Wafat</p>
                  {member.deathDate && (
                    <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                      Tanggal: {formatDate(member.deathDate)}
                      {age !== null ? ` · ${getYear(member.deathDate)}` : ''}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-emerald-700 dark:text-emerald-200 font-medium">Hidup</p>
              )}
            </div>

            {member.alamat && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Alamat</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{member.alamat}</p>
              </div>
            )}

            {member.noHp && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">No HP</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{member.noHp}</p>
              </div>
            )}

            {member.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Catatan</p>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{member.notes}</p>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 mb-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-300/70 active:scale-[0.99]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
