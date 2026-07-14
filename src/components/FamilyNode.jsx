import React from 'react';
import { Handle, Position } from 'reactflow';
import { Plus, Feather } from 'lucide-react';
import { calculateAge, formatDate, getYear } from '../utils/age';

function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export default function FamilyNode({ data }) {
  const isMale = data.gender === 'male';
  const isDeceased = !!data.isDeceased;
  const age = calculateAge(data.birthDate, isDeceased ? data.deathDate : null);

  const borderColor = isMale ? 'border-sky-400' : 'border-rose-400';
  const badgeColor = isMale ? 'bg-sky-500' : 'bg-rose-500';
  const avatarBg = isMale ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700';

  // Highlight/dim berdasarkan hasil pencarian di header (jika sedang aktif)
  const searchActive = data.searchActive;
  const isMatch = data.isMatch;
  const visualState = !searchActive
    ? ''
    : isMatch
    ? 'ring-2 ring-amber-400'
    : 'opacity-30';

  return (
    <div
      className={`w-[220px] rounded-2xl bg-white shadow-md border-2 ${borderColor} ${visualState} transition-opacity duration-200 overflow-hidden`}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2 !border-0" />

      <div className="p-3">
        <div className="flex items-start gap-2">
          <div
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ${avatarBg}`}
          >
            {data.photoUrl ? (
              <img src={data.photoUrl} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              getInitials(data.name) || '?'
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p
                className={`font-semibold text-sm truncate ${
                  isDeceased ? 'text-slate-500' : 'text-slate-800'
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

        <div className="mt-2 text-[11px] leading-snug text-slate-500 space-y-0.5">
          {data.birthDate && (
            <p>
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onAddChild(data.id, data.name);
          }}
          className="mt-3 flex items-center justify-center gap-1 w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 transition-colors text-white text-[11px] font-semibold py-1.5 rounded-lg"
        >
          <Plus size={12} strokeWidth={3} />
          Tambah Anak
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2 !border-0" />
    </div>
  );
}
