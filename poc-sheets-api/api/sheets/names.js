import { google } from 'googleapis';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { warehouse = 'TAO1' } = req.query;

  try {
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const wh = String(warehouse || 'TAO1').toUpperCase();
    const sheetId = process.env[`SHEET_ID_${wh}`] || process.env.SHEET_ID;

    if (!serviceAccountJson) {
      return res.status(500).json({ ok: false, error: 'Missing GOOGLE_SERVICE_ACCOUNT_JSON env' });
    }
    if (!sheetId) {
      return res.status(500).json({ ok: false, error: `Missing SHEET_ID_${wh} or SHEET_ID env` });
    }

    const credentials = JSON.parse(serviceAccountJson);

    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    const sheets = google.sheets({ version: 'v4', auth });

    // 只取 spreadsheet metadata（分頁名稱），非常快
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'sheets.properties.title',
    });

    const names = (response.data.sheets || []).map(s => s.properties.title);

    return res.status(200).json({
      ok: true,
      sheetNames: names,
      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sheet Names API Error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Unknown error',
    });
  }
}
