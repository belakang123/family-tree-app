import { google } from 'googleapis';
import formidable from 'formidable';
import fs from 'fs';

// Matikan body parser bawaan Vercel karena kita menangani multipart/form-data secara manual
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({});

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Form parsing error' });
    }

    try {
      const uploaded = Array.isArray(files.photo) ? files.photo[0] : files.photo;
      if (!uploaded) {
        return res.status(400).json({ error: 'Tidak ada file foto yang diterima.' });
      }

      // Autentikasi sebagai akun Google PRIBADI (bukan Service Account) lewat OAuth2
      // refresh token. Service Account tidak punya kuota penyimpanan sendiri di Drive
      // biasa (non-Shared Drive), sehingga upload selalu gagal dengan
      // "storageQuotaExceeded". Dengan OAuth2, file ikut memakai kuota 15GB gratis
      // akun pribadi yang sudah mengotorisasi aplikasi ini.
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET
      );
      oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Unggah ke folder spesifik milik akun yang sama (tidak perlu di-share ke siapa pun lagi)
      const fileMetadata = {
        name: `${Date.now()}_${uploaded.originalFilename}`,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };
      const media = {
        mimeType: uploaded.mimetype,
        body: fs.createReadStream(uploaded.filepath),
      };

      const driveFile = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id',
      });

      const fileId = driveFile.data.id;

      // Ubah izin akses file menjadi publik (read-only) agar bisa ditampilkan sebagai URL gambar di web
      await drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' },
      });

      // Format URL gambar direct-link Google Drive (gratis, tanpa perlu bucket storage berbayar)
      const publicUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      return res.status(200).json({ url: publicUrl });
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({ error: uploadError.message });
    }
  });
}