import { google } from 'googleapis';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // 設定 no-cache headers
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { range, values } = req.body;

  if (!range || !values) {
    return res.status(400).json({ ok: false, error: 'Missing required parameters: range, values' });
  }

  try {
    // 從環境變數取得 Service Account JSON
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const sheetId = process.env.SHEET_ID;

    if (!serviceAccountJson) {
      return res.status(500).json({ ok: false, error: 'Missing GOOGLE_SERVICE_ACCOUNT_JSON env' });
    }
    if (!sheetId) {
      return res.status(500).json({ ok: false, error: 'Missing SHEET_ID env' });
    }

    // 解析 Service Account JSON
    const credentials = JSON.parse(serviceAccountJson);

    // 建立 JWT 授權（需要寫入權限）
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    // 建立 Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // 寫入資料
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: range,
      valueInputOption: 'RAW',
      requestBody: {
        values: values,
      },
    });

    return res.status(200).json({
      ok: true,
      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sheets API Write Error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Unknown error',
    });
  }
}
