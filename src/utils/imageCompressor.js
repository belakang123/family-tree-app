/**
 * Mengompres dan me-resize gambar menggunakan Canvas API sebelum dikirim ke server.
 * - Maksimal ukuran: maxSizeMB MB (default 1 MB)
 * - Maksimal resolusi: maxWidthOrHeight px di sisi terpanjang (default 1024px)
 * - Output format: image/jpeg dengan kualitas yang dikurangi bertahap jika masih terlalu besar
 *
 * @param {File} file - File gambar asli dari input
 * @param {object} opts
 * @param {number} opts.maxSizeMB - Batas ukuran output dalam MB (default 0.9)
 * @param {number} opts.maxWidthOrHeight - Batas panjang sisi terpanjang dalam piksel (default 1024)
 * @returns {Promise<File>} - File baru yang sudah dikompres
 */
export async function compressImage(file, { maxSizeMB = 0.9, maxWidthOrHeight = 1024 } = {}) {
  const maxBytes = maxSizeMB * 1024 * 1024;

  // Jika sudah kecil, kembalikan langsung
  if (file.size <= maxBytes) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // Hitung dimensi baru
      let { width, height } = img;
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width >= height) {
          height = Math.round((height / width) * maxWidthOrHeight);
          width = maxWidthOrHeight;
        } else {
          width = Math.round((width / height) * maxWidthOrHeight);
          height = maxWidthOrHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Kurangi quality secara bertahap sampai di bawah batas
      const tryCompress = (quality) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengompres gambar.'));
              return;
            }
            if (blob.size <= maxBytes || quality <= 0.1) {
              // Selesai: buat File baru dari blob
              const outputName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
              const compressed = new File([blob], outputName, { type: 'image/jpeg', lastModified: Date.now() });
              resolve(compressed);
            } else {
              // Masih terlalu besar, kurangi kualitas lagi
              tryCompress(Math.max(quality - 0.1, 0.1));
            }
          },
          'image/jpeg',
          quality
        );
      };

      tryCompress(0.85);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca file gambar.'));
    };

    img.src = objectUrl;
  });
}
