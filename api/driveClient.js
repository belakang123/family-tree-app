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

export async function getDriveClient() {
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
