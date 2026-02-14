/**
 * 資料存取模組 - 封裝 Google Sheets API 呼叫
 * 禁止快取，每次都讀取最新資料
 */

const API_BASE = '/api/sheets';

/**
 * 讀取 Google Sheet 資料
 * @param {string} range - 範圍，例如 "Sheet1!A1:K2000"
 * @param {string} majorDimension - ROWS 或 COLUMNS，預設 ROWS
 * @returns {Promise<{ok: boolean, values: any[][], meta: {rows: number, cols: number}, fetchMs: number}>}
 */
export async function fetchSheetRange(range, majorDimension = 'ROWS') {
  const startTime = performance.now();
  
  try {
    const url = `${API_BASE}/read?range=${encodeURIComponent(range)}&majorDimension=${majorDimension}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 禁止快取
      cache: 'no-store',
    });

    const data = await response.json();
    const fetchMs = Math.round(performance.now() - startTime);

    if (!data.ok) {
      throw new Error(data.error || 'API 回傳錯誤');
    }

    return {
      ...data,
      fetchMs,
    };
  } catch (error) {
    const fetchMs = Math.round(performance.now() - startTime);
    console.error('fetchSheetRange error:', error);
    return {
      ok: false,
      error: error.message,
      values: [],
      meta: { rows: 0, cols: 0 },
      fetchMs,
    };
  }
}

/**
 * 寫入 Google Sheet 資料
 * @param {string} range - 範圍，例如 "Sheet1!C2:C2"
 * @param {any[][]} values - 要寫入的值，例如 [["內容"]]
 * @returns {Promise<{ok: boolean, fetchMs: number}>}
 */
export async function writeSheetRange(range, values) {
  const startTime = performance.now();
  
  try {
    const response = await fetch(`${API_BASE}/write`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ range, values }),
      cache: 'no-store',
    });

    const data = await response.json();
    const fetchMs = Math.round(performance.now() - startTime);

    return {
      ...data,
      fetchMs,
    };
  } catch (error) {
    const fetchMs = Math.round(performance.now() - startTime);
    console.error('writeSheetRange error:', error);
    return {
      ok: false,
      error: error.message,
      fetchMs,
    };
  }
}

/**
 * 效能計時工具
 */
export function logPerformance({ fetchMs, renderMs, rows, cols }) {
  const totalMs = fetchMs + (renderMs || 0);
  console.log('📊 Performance:', {
    fetchMs: `${fetchMs}ms`,
    renderMs: renderMs ? `${renderMs}ms` : 'N/A',
    totalMs: `${totalMs}ms`,
    rows,
    cols,
  });
  return { fetchMs, renderMs, totalMs, rows, cols };
}
