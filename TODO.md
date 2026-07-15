# TODO - Dark Mode

- [ ] Update `tailwind.config.js` untuk `darkMode: 'class'`.
- [ ] Tambah base styling di `src/index.css` untuk tema light/dark.
- [ ] Implement theme manager di `src/App.jsx`:
  - [ ] baca preferensi dari `localStorage`
  - [ ] fallback ke `prefers-color-scheme`
  - [ ] update `document.documentElement` class `dark`
  - [ ] UI toggle dark/light di header (walau ada auto)
- [ ] Update styling `src/App.jsx` untuk kelas `dark:` (background, header, empty/loading state, confirmation dialog).
- [ ] Update styling `src/components/FamilyNode.jsx` untuk `dark:` (card background/text/border/buttons).
- [ ] Update styling `src/components/InputModal.jsx` untuk `dark:`.
- [ ] Update styling `src/components/BioDataModal.jsx` untuk `dark:`.
- [ ] Jalankan `npm run dev` atau build untuk validasi.

