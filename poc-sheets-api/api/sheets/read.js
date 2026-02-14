import { google } from 'googleapis';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // 設定 no-cache headers
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { range, majorDimension = 'ROWS', warehouse = 'TAO1' } = req.query;

  if (!range) {
    return res.status(400).json({ ok: false, error: 'Missing required parameter: range' });
  }

  try {
    // 從環境變數取得 Service Account JSON
    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    
    // 支援多倉庫：優先使用 SHEET_ID_TAO1 格式，否則使用 SHEET_ID
    const wh = String(warehouse || 'TAO1').toUpperCase();
    const sheetId = process.env[`SHEET_ID_${wh}`] || process.env.SHEET_ID;

    if (!serviceAccountJson) {
      return res.status(500).json({ ok: false, error: 'Missing GOOGLE_SERVICE_ACCOUNT_JSON env' });
    }
    if (!sheetId) {
      return res.status(500).json({ ok: false, error: `Missing SHEET_ID_${wh} or SHEET_ID env` });
    }

    // 解析 Service Account JSON
    const credentials = JSON.parse(serviceAccountJson);

    // 建立 JWT 授權
    const auth = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    // 建立 Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // 讀取資料
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range,
      majorDimension: majorDimension,
    });

    const values = response.data.values || [];
    const rows = values.length;
    const cols = values[0]?.length || 0;

    return res.status(200).json({
      ok: true,
      range: range,
      values: values,
      meta: { rows, cols },
      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sheets API Error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Unknown error',
    });
  }
}
