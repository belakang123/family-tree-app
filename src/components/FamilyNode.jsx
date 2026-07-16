import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, Feather, Pencil, Trash2 } from 'lucide-react';
import { calculateAge, formatDate, getYear } from '../utils/age';

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

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

export default function FamilyNode({ data }) {
  const [imageError, setImageError] = useState(false);
  const photoUrl = normalizePhotoUrl(data.photoUrl);
  const isMale = data.gender === 'male';
  const isDeceased = !!data.isDeceased;
  const age = calculateAge(data.birthDate, isDeceased ? data.deathDate : null);

  // Premium scheme:
  // - male: deep emerald + indigo tint
  // - female: rose tint (kept, but upgraded opacity/contrast)
  const borderColor = isMale ? 'border-emerald-400/50' : 'border-rose-400/55';
  const badgeColor = isMale ? 'bg-emerald-600' : 'bg-rose-600';
  const avatarBg = isMale
    ? 'bg-gradient-to-br from-emerald-100 to-indigo-100 text-emerald-800'
    : 'bg-gradient-to-br from-rose-100 to-pink-100 text-rose-800';

  const searchActive = data.searchActive;
  const isMatch = data.isMatch;

  const visualState = !searchActive
    ? ''
    : isMatch
    ? 'ring-2 ring-indigo-300 bg-indigo-50/50'
    : 'opacity-30';

  const editRing = data.isEditMode
    ? 'ring-2 ring-indigo-200 ring-offset-1 bg-indigo-50/30'
    : '';

  return (
    <div
      className={`w-[220px] rounded-2xl bg-white dark:bg-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.06)] border-2 ${borderColor} ${visualState} ${editRing} transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-[0_12px_38px_rgba(15,23,42,0.10)] hover:-translate-y-[1px]`}

      onClick={(e) => {
        e.stopPropagation();
        data.onShowBioData(data);
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`!w-2 !h-2 !border-0 !bg-slate-500 ${
          isMale ? '!opacity-90' : '!opacity-85'
        } shadow-[0_0_0_4px_rgba(59,130,246,0.0)]`}
      />

      {/* Top tint */}
      <div
        className={`h-1 w-full ${isMale ? 'bg-gradient-to-r from-emerald-400/80 via-indigo-400/70 to-cyan-400/60' : 'bg-gradient-to-r from-rose-400/80 to-pink-400/60'} opacity-95`}
        aria-hidden="true"
      />

      <div className="p-3">
        <div className="flex items-start gap-2">
          <div
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ${avatarBg} border`}
          >
            {photoUrl && !imageError ? (
              <img
                src={photoUrl}
                alt={data.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
              />
            ) : (
              getInitials(data.name) || '?'
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p
                className={`font-semibold text-sm truncate ${
                  isDeceased ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'
                }`}
                title={data.name}
              >
                {data.name}
              </p>
              {isDeceased && <Feather size={12} className="text-stone-400 shrink-0" />}
            </div>
            <span
              className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white ${badgeColor}`}
            >
              {isMale ? 'Laki-laki' : 'Perempuan'}
            </span>
          </div>
        </div>

        <div className="mt-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400 space-y-0.5">

          {data.birthDate && (
            <p className="truncate">
              {formatDate(data.birthDate)}
              {age !== null && !isDeceased ? ` (${age} th)` : ''}
            </p>
          )}
          {isDeceased ? (
            <p className="text-stone-500 font-medium">
              Wafat{data.deathDate ? `: ${getYear(data.deathDate)}` : ''}
              {age !== null ? ` · ${age} th` : ''}
            </p>
          ) : (
            <p className="text-emerald-600 font-medium">Hidup</p>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <div className="flex-1 min-w-0">
            {data.childIndex ? (
              <div className="mb-2">
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    data.gender === 'male'
                      ? 'bg-sky-600/10 text-sky-700 border border-sky-400/20'
                      : 'bg-rose-600/10 text-rose-700 border border-rose-400/20'
                  }`}
                >
                  Anak ke-{data.childIndex}
                </span>
              </div>
            ) : (
              <div className="mb-2" />
            )}            {!data.isExporting && (
              data.isEditMode ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        data.onEdit(data);
                      }}
                      className="btn-edit-member flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-slate-700 dark:text-slate-100 text-[11px] font-semibold py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-300/70"
                    >
                      <Pencil size={12} />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        data.onDelete(data.id, data.name);
                      }}
                      className="btn-delete-member flex-1 flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 active:bg-red-200 transition-colors text-red-655 dark:bg-red-955/30 dark:hover:bg-red-900/30 dark:active:bg-red-900/40 text-[11px] font-semibold py-1.5 rounded-lg border border-red-100 dark:border-red-700/50 focus:outline-none focus:ring-2 focus:ring-red-300/70"
                    >
                      <Trash2 size={12} />
                      Hapus
                    </button>
                  </div>
                  {typeof data.onAddSpouse === 'function' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        data.onAddSpouse(data.id, data.name, data.gender);
                      }}
                      className="btn-add-spouse flex items-center justify-center gap-1 w-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 transition-colors text-white text-[11px] font-semibold py-1.5 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-300/70"
                    >
                      + Pasangan
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    data.onAddChild(data.id, data.name);
                  }}
                  className="btn-add-child mt-3 flex items-center justify-center gap-1 w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 transition-colors text-white text-[11px] font-semibold py-1.5 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300/70"
                >
                  <Plus size={12} strokeWidth={3} />
                  Tambah Anak
                </button>
              )
            )}
          </div>
        </div>

      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !w-2 !h-2 !border-0" />
    </div>
  );
}

