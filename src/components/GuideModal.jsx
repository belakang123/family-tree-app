import React from 'react';
import { X, BookOpen, Plus, UserPlus, Trash2, Moon, Download, Pencil, Users } from 'lucide-react';

export default function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 animate-fadeIn max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Color Line */}
        <div
          className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500"
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <BookOpen size={20} className="stroke-[2.5]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
              Buku Panduan Penggunaan
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400/70"
            title="Tutup"
          >
            <X size={18} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-650 dark:text-slate-300 leading-relaxed">
          
          {/* Section 1: Leluhur */}
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <Users size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-[13px] sm:text-sm">
                1. Membuat Leluhur Pertama (Root)
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-[12px]">
                Untuk memulai pohon silsilah baru, klik tombol <span className="font-semibold text-indigo-600 dark:text-indigo-400">Leluhur Baru</span> di kanan atas. Isi data lengkap Kakek dan Nenek pada masing-masing tab yang tersedia di formulir, lalu simpan.
              </p>
            </div>
          </div>

          {/* Section 2: Tambah Anak */}
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-650 dark:text-emerald-400">
              <Plus size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-[13px] sm:text-sm">
                2. Menambahkan Anak (Keturunan)
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-[12px]">
                Klik tombol <span className="font-semibold text-emerald-600 dark:text-emerald-400">+ Tambah Anak</span> di bawah garis pernikahan pasangan. Isi formulir nama, tanggal lahir, dan detail lainnya. Anak tersebut akan otomatis terhubung ke bawah pasangan orang tua tersebut.
              </p>
            </div>
          </div>

          {/* Section 3: Tambah Pasangan */}
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <UserPlus size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-[13px] sm:text-sm">
                3. Menikahkan Anggota (Tambah Pasangan)
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-[12px]">
                Aktifkan <span className="font-semibold text-cyan-600">Mode Edit</span> (ikon Pensil), lalu cari anggota tunggal yang ingin dinikahkan. Klik tombol <span className="font-semibold text-indigo-600 dark:text-indigo-400">+ Pasangan</span> pada kartu mereka, masukkan data lengkap pasangan baru, dan simpan. Mereka akan bersisian secara otomatis.
              </p>
            </div>
          </div>

          {/* Section 4: Mode Edit & Preview */}
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-cyan-650 dark:text-cyan-400">
              <Pencil size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-[13px] sm:text-sm">
                4. Mode Edit & Preview
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-[12px]">
                Gunakan ikon melayang di pojok kanan bawah (Pensil/Mata) untuk berpindah mode. Di **Mode Edit**, Anda bisa mengedit data, menghapus, atau menambah pasangan. Di **Mode Preview**, tampilan menjadi bersih dan Anda bisa menambah anak serta mengklik kartu untuk melihat biodata lengkap.
              </p>
            </div>
          </div>

          {/* Section 5: Hapus Anggota */}
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-650 dark:text-red-400">
              <Trash2 size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-[13px] sm:text-sm">
                5. Menghapus Anggota Silsilah
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-[12px]">
                Pada **Mode Edit**, klik tombol Hapus pada kartu yang ingin dihapus. Menghapus seseorang akan ikut menghapus seluruh keturunan di bawah mereka secara aman.
              </p>
            </div>
          </div>

          {/* Section 6: Dark Mode */}
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-650 dark:text-amber-400">
              <Moon size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-[13px] sm:text-sm">
                6. Mode Gelap & Terang
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-[12px]">
                Klik tombol Bulan/Matahari di sudut kiri atas untuk beralih mode gelap dan terang secara instan untuk kenyamanan membaca di malam hari.
              </p>
            </div>
          </div>

          {/* Section 7: Ekspor Gambar */}
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-650 dark:text-emerald-400">
              <Download size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-1 text-[13px] sm:text-sm">
                7. Mengunduh Pohon Keluarga (PNG)
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-[12px]">
                Klik ikon Unduh di kanan bawah untuk menyimpan seluruh pohon keluarga Anda sebagai gambar PNG bersih tanpa tombol aksi, tombol edit, maupun tombol kontrol zoom.
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-750 text-white text-xs sm:text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-300 active:scale-[0.98]"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
