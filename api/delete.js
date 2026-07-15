import { google } from 'googleapis';

function parseServiceAccountJson(value) {
  if (!value) return null;
  try {
    const json = JSON.parse(value);
    if (!json.client_email || !json.private_key) return null;
    return {
      client_email: json.client_email,
      private_key: json.private_key.replace(/\\n/g, '\n'),
    };
  } catch (err) {
    console.error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON:', err.message || err);
    return null;
  }
}

async function getDriveClient() {
  const serviceAccount = parseServiceAccountJson(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  if (serviceAccount) {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    return google.drive({ version: 'v3', auth });
  }

  if (
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REFRESH_TOKEN
  ) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  throw new Error(
    'Missing Google Drive auth configuration. Set GOOGLE_SERVICE_ACCOUNT_JSON or OAuth2 env vars.'
  );
}

export const config = {
  api: {
    bodyParser: true,
  },
};

function extractDriveFileId(photoUrl) {
  if (!photoUrl) return null;

  try {
    const parsed = new URL(photoUrl);
    const searchParams = parsed.searchParams;
    if (searchParams.get('id')) return searchParams.get('id');

    const pathParts = parsed.pathname.split('/');
    const driveIndex = pathParts.findIndex((part) => part === 'd');
    if (driveIndex >= 0 && pathParts[driveIndex + 1]) return pathParts[driveIndex + 1];
  } catch {
    const match = photoUrl.match(/(?:id=|\/d\/)([a-zA-Z0-9_-]+)/);
    if (match?.[1]) return match[1];
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { photoUrl } = req.body || {};
    const fileId = extractDriveFileId(photoUrl);

    if (!fileId) {
      return res.status(200).json({ ok: true, deleted: false, reason: 'No file id' });
    }

    const drive = await getDriveClient();
    await drive.files.delete({ fileId });

    return res.status(200).json({ ok: true, deleted: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete photo' });
  }
}
