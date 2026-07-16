import { useState, useCallback } from 'react';
import { toPng } from 'html-to-image';

/**
 * Hook untuk mengekspor seluruh pohon silsilah sebagai file PNG.
 * treeWrapRef harus dipasang di container ReactFlow oleh komponen pemanggil.
 */
export function useExportPng({ nodes, isDarkEffective, treeWrapRef }) {
  const [isExporting, setIsExporting] = useState(false);

  const exportTreeAsPng = useCallback(async () => {
    let viewportEl = null;
    try {
      if (!treeWrapRef.current) return;

      viewportEl = treeWrapRef.current.querySelector('.react-flow__viewport');
      if (!viewportEl) return;

      if (nodes.length === 0) return;

      setIsExporting(true);
      // Tunggu render ulang agar tombol-tombol hilang dari DOM
      await new Promise((r) => setTimeout(r, 250));

      // Hitung bounding box seluruh node
      const minX = Math.min(...nodes.map((n) => n.position.x));
      const minY = Math.min(...nodes.map((n) => n.position.y));
      const maxX = Math.max(...nodes.map((n) => n.position.x + (n.type === 'familyPairNode' ? 448 : 220)));
      const maxY = Math.max(...nodes.map((n) => n.position.y + (n.type === 'familyPairNode' ? 160 : 120)));

      const padding = 65;
      const totalWidth  = (maxX - minX) + padding * 2;
      const totalHeight = (maxY - minY) + padding * 2;

      viewportEl.classList.add('react-flow-exporting');

      const bg = isDarkEffective ? '#0f172a' : '#F7F5F0';

      const dataUrl = await toPng(viewportEl, {
        width: totalWidth,
        height: totalHeight,
        style: {
          width:     `${totalWidth}px`,
          height:    `${totalHeight}px`,
          transform: `translate(${-minX + padding}px, ${-minY + padding}px) scale(1)`,
        },
        cacheBust: true,
        backgroundColor: bg,
      });

      const link = document.createElement('a');
      link.download = 'pohon-silsilah.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export PNG gagal:', err);
      alert('Gagal mengekspor gambar. Coba lagi.');
    } finally {
      if (viewportEl) viewportEl.classList.remove('react-flow-exporting');
      setIsExporting(false);
    }
  }, [nodes, isDarkEffective, treeWrapRef]);

  return { isExporting, exportTreeAsPng };
}
