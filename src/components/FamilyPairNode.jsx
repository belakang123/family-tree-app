import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Feather, Pencil, Trash2 } from 'lucide-react';
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

export default function FamilyPairNode({ data }) {
  const husband = data.husband ?? null;
  const wife = data.wife ?? null;

  const anchorPerson = husband ?? wife ?? null;

  const [husbandImageError, setHusbandImageError] = useState(false);
  const [wifeImageError, setWifeImageError] = useState(false);

  const { onEdit, onDelete, isEditMode } = data ?? {};

  const isHusbandMatch = data.searchActive && data.matchingIds?.has(husband?.id);
  const isWifeMatch = data.searchActive && data.matchingIds?.has(wife?.id);

  const renderEditActions = (p) => {
    if (!p) return null;
    if (typeof onEdit !== 'function' || typeof onDelete !== 'function') return null;

    return (
      <div className="mt-2 flex gap-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(p);
          }}
          className="btn-edit-member flex-1 flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-slate-700 dark:text-slate-100 text-[10px] font-semibold py-1 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <Pencil size={10} />
          Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(p.id, p.name);
          }}
          className="btn-delete-member flex-1 flex items-center justify-center gap-1 bg-red-55 hover:bg-red-100 active:bg-red-200 transition-colors text-red-600 dark:bg-red-950/30 dark:hover:bg-red-900/30 dark:active:bg-red-900/40 text-[10px] font-semibold py-1 rounded-lg border border-red-100 dark:border-red-700/50 focus:outline-none focus:ring-1 focus:ring-red-300/70"
        >
          <Trash2 size={10} />
          Hapus
        </button>
      </div>
    );
  };

  const renderCard = (p, isHusband) => {
    if (!p) return null;

    const isMale = p.gender === 'male';
    const isDeceased = !!p.isDeceased;
    const age = calculateAge(p.birthDate, isDeceased ? p.deathDate : null);
    const photoUrl = normalizePhotoUrl(p.photoUrl);
    const hasImageError = isHusband ? husbandImageError : wifeImageError;
    const setImageError = isHusband ? setHusbandImageError : setWifeImageError;
    const isMatch = isHusband ? isHusbandMatch : isWifeMatch;

    const borderColor = isMale ? 'border-emerald-400/50' : 'border-rose-400/55';
    const badgeColor = isMale ? 'bg-emerald-600' : 'bg-rose-600';
    const avatarBg = isMale
      ? 'bg-gradient-to-br from-emerald-100 to-indigo-100 text-emerald-800'
      : 'bg-gradient-to-br from-rose-100 to-pink-100 text-rose-800';

    const visualState = !data.searchActive
      ? ''
      : isMatch
      ? 'ring-2 ring-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20'
      : 'opacity-30';

    const editRing = isEditMode
      ? 'ring-2 ring-indigo-200 dark:ring-indigo-900/50 ring-offset-1 dark:ring-offset-slate-950 bg-indigo-50/10'
      : '';

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (typeof data.onShowBioData === 'function') {
            data.onShowBioData(p);
          }
        }}
        className={`w-[200px] rounded-2xl bg-white dark:bg-slate-900 shadow-[0_8px_28px_rgba(15,23,42,0.06)] border-2 ${borderColor} ${visualState} ${editRing} transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-[0_12px_38px_rgba(15,23,42,0.10)] hover:-translate-y-[1px]`}
      >
        {/* Top tint */}
        <div
          className={`h-1 w-full ${
            isMale
              ? 'bg-gradient-to-r from-emerald-400/80 via-indigo-400/70 to-cyan-400/60'
              : 'bg-gradient-to-r from-rose-400/80 to-pink-400/60'
          } opacity-95`}
          aria-hidden="true"
        />

        <div className="p-3">
          <div className="flex items-start gap-2">
            <div
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden ${avatarBg} border`}
            >
              {photoUrl && !hasImageError ? (
                <img
                  src={photoUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              ) : (
                getInitials(p.name) || '?'
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p
                  className={`font-semibold text-[11px] truncate ${
                    isDeceased ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'
                  }`}
                  title={p.name}
                >
                  {p.name}
                </p>
                {isDeceased && <Feather size={11} className="text-stone-400 shrink-0" />}
              </div>

              <span
                className={`inline-block mt-0.5 text-[8px] px-1.5 py-0.5 rounded-full font-medium text-white ${badgeColor}`}
              >
                {isHusband ? 'Suami' : 'Istri'}
              </span>
            </div>
          </div>

          <div className="mt-2 text-[10px] leading-snug text-slate-500 dark:text-slate-400 space-y-0.5">
            {p.birthDate && (
              <p className="truncate">
                {formatDate(p.birthDate)}
                {age !== null && !isDeceased ? ` (${age} th)` : ''}
              </p>
            )}
            {isDeceased ? (
              <p className="text-stone-500 font-medium">
                Wafat{p.deathDate ? `: ${getYear(p.deathDate)}` : ''}
                {age !== null ? ` · ${age} th` : ''}
              </p>
            ) : (
              <p className="text-emerald-600 font-medium">Hidup</p>
            )}
          </div>

          {p.childIndex ? (
            <div className="mt-2">
              <span
                className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isMale
                    ? 'bg-sky-600/10 text-sky-700 border border-sky-400/20'
                    : 'bg-rose-600/10 text-rose-700 border border-rose-400/20'
                }`}
              >
                Anak ke-{p.childIndex}
              </span>
            </div>
          ) : null}

          {isEditMode && !data.isExporting && renderEditActions(p)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center select-none cursor-default">
      {/* Container untuk dua kartu bersisian */}
      <div className="flex items-center gap-12 relative">
        {/* Handle Target (Top) - Diletakkan tepat di tengah-tengah garis penghubung */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2.5 !h-2.5 !border-0 !bg-slate-500 !opacity-95 shadow-[0_0_0_4px_rgba(59,130,246,0.0)]"
          style={{ left: '50%' }}
        />

        {/* Kartu Suami */}
        {renderCard(husband, true)}

        {/* Garis Penghubung Horizontal */}
        <div
          className="w-12 h-[3px] bg-gradient-to-r from-emerald-500 to-rose-500 relative flex items-center justify-center rounded-full"
          aria-hidden="true"
        >
          {/* Titik ikatan nikah di tengah garis */}
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 border border-white dark:border-slate-900 shadow-sm" />
        </div>

        {/* Kartu Istri */}
        {renderCard(wife, false)}

        {/* Handle Source (Bottom) - Diletakkan tepat di tengah-tengah garis penghubung */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-slate-500 !w-2.5 !h-2.5 !border-0"
          style={{ left: '50%' }}
        />
      </div>

      {/* Tombol Tambah Anak bersama di bawah */}
      {!isEditMode && !data.isExporting && typeof data.onAddChild === 'function' && anchorPerson && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onAddChild(anchorPerson.id, anchorPerson.name);
          }}
          className="btn-add-child mt-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 transition-colors text-white text-[10px] font-semibold px-4 py-1.5 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-300/70"
        >
          + Tambah Anak
        </button>
      )}
    </div>
  );
}
