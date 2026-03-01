// PoC: Google Sheets API 服務
// 使用 Vercel Serverless API 直連 Google Sheets API（Service Account）
// 目標：測試是否比 Apps Script 更快
// 
// 注意：此版本為 PoC 測試版，保持與原本 gasApi.js 相同的 export 介面
// 但內部改用 Vercel API（/api/sheets/read）

// Vercel API 端點
const API_BASE = '/api/sheets';

// 原本的 Apps Script API（用於登入驗證）
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwqsMJ5NAwpWg6mE_KbpBG3BBolD7O9YMaUosu2DUm3qPJeQhzNWPOCReBDDA-IWAkW/exec';

// 效能計時
let lastFetchMs = 0;
export function getLastFetchMs() { return lastFetchMs; }

// 支援的倉庫列表
const WAREHOUSES = ['TAO1', 'TAO3', 'TAO4', 'TAO5', 'TAO6', 'TAO7', 'TAO10'];

// 禁止快取
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
};

/**
 * 呼叫 Vercel API 讀取 Google Sheet
 * @param {string} range - 範圍，例如 "Sheet1!A1:Z1000"
 * @param {string} warehouse - 倉庫代碼
 * @returns {Promise<Object>}
 */
async function fetchSheetData(range, warehouse = 'TAO1') {
  const startTime = performance.now();
  
  try {
    const wh = String(warehouse || 'TAO1').toUpperCase();
    const url = `${API_BASE}/read?warehouse=${wh}&range=${encodeURIComponent(range)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    });

    const data = await response.json();
    lastFetchMs = Math.round(performance.now() - startTime);
    
    console.log(`📊 [PoC] fetchSheetData: ${wh} / ${range} - ${lastFetchMs}ms, apiVersion=${data.apiVersion || 'old'}`);

    if (!data.ok) {
      throw new Error(data.error || 'API 回傳錯誤');
    }

    return data;
  } catch (error) {
    lastFetchMs = Math.round(performance.now() - startTime);
    console.error('fetchSheetData error:', error);
    throw error;
  }
}

/**
 * 取得所有可用的倉庫列表
 */
export function getAvailableWarehouses() {
  return WAREHOUSES;
}

/**
 * 檢查是否已設定
 */
export function isGasConfigured(warehouse) {
  return WAREHOUSES.includes(String(warehouse || '').toUpperCase());
}

/**
 * 本地測試用戶資料
 */
const LOCAL_TEST_USERS = [
  { name: '酷澎', birthday: '0000', warehouse: 'TAO1', isAdmin: true },
  { name: '蔡博文', birthday: '640308', warehouse: 'TAO1', isAdmin: false },
  { name: '王鈴楓', birthday: '850918', warehouse: 'TAO1', isAdmin: false },
  { name: '陳振文', birthday: '741003', warehouse: 'TAO1', isAdmin: false },
  { name: '曾宥霖', birthday: '660615', warehouse: 'TAO1', isAdmin: false },
  { name: '吳尚容', birthday: '851129', warehouse: 'TAO1', isAdmin: false },
  { name: '黃麗梅', birthday: '571002', warehouse: 'TAO1', isAdmin: false },
  { name: '朱逸勛', birthday: '830527', warehouse: 'TAO1', isAdmin: false },
  { name: '高玉靜', birthday: '700729', warehouse: 'TAO1', isAdmin: false },
  { name: '陳芬妮', birthday: '650130', warehouse: 'TAO1', isAdmin: false },
  { name: '白麗秋', birthday: '631214', warehouse: 'TAO1', isAdmin: false },
  { name: '賴伊湘', birthday: '811120', warehouse: 'TAO1', isAdmin: false },
  { name: '潘品權', birthday: '780806', warehouse: 'TAO1', isAdmin: false },
  { name: '施宗佑', birthday: '810429', warehouse: 'TAO1', isAdmin: false },
  { name: '謝興武', birthday: '630924', warehouse: 'TAO1', isAdmin: false },
  { name: '陳采翎', birthday: '750816', warehouse: 'TAO1', isAdmin: false },
  { name: '邱鈺惠', birthday: '760913', warehouse: 'TAO1', isAdmin: false },
  { name: '郭淑美', birthday: '570503', warehouse: 'TAO1', isAdmin: false },
  { name: '余秋萍', birthday: '810125', warehouse: 'TAO1', isAdmin: false },
  { name: '費立萱', birthday: '780605', warehouse: 'TAO1', isAdmin: false },
  { name: '潘玉純', birthday: '890313', warehouse: 'TAO1', isAdmin: false },
  { name: '余品嫻', birthday: '880924', warehouse: 'TAO1', isAdmin: false },
  { name: '吳振豪', birthday: '790517', warehouse: 'TAO1', isAdmin: false },
  { name: '林昱宏', birthday: '820731', warehouse: 'TAO1', isAdmin: false },
  { name: '馬筱玲', birthday: '720407', warehouse: 'TAO1', isAdmin: false },
  { name: '陳玉梅', birthday: '660415', warehouse: 'TAO1', isAdmin: false },
];

/**
 * 驗證登入（PoC 版本：呼叫原本的 Apps Script API 驗證）
 */
export async function verifyLogin(name, birthday, isAdminSearch = false) {
  const trimmedName = String(name || '').trim();
  const trimmedBirthday = String(birthday || '').trim();
  
  // 先嘗試本地驗證（測試用）
  const localUser = LOCAL_TEST_USERS.find(u => 
    u.name === trimmedName && u.birthday === trimmedBirthday
  );
  if (localUser) {
    return {
      ok: true,
      name: localUser.name,
      warehouse: localUser.warehouse,
      warehouseKey: localUser.warehouse,
      isAdmin: localUser.isAdmin,
      msg: `驗證成功 (${localUser.warehouse})`
    };
  }
  
  // 呼叫原本的 Apps Script API 驗證
  try {
    const mode = isAdminSearch ? 'findWarehouseByName' : 'verifyLogin';
    const url = new URL(GAS_API_URL);
    url.searchParams.set('mode', mode);
    url.searchParams.set('name', trimmedName);
    if (!isAdminSearch) {
      url.searchParams.set('birthday', trimmedBirthday);
    }
    url.searchParams.set('t', String(Date.now()));
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      mode: 'cors',
    });
    
    const text = await response.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('GAS API 回傳非 JSON:', text.substring(0, 200));
      return { ok: false, error: '驗證服務回傳格式錯誤' };
    }
    
    if (result && result.ok !== false && (result.name || result.ok === true)) {
      const warehouse = String(result.warehouse || result.warehouseKey || result.wh || '').trim().toUpperCase();
      return {
        ok: true,
        name: result.name || trimmedName,
        warehouse: warehouse,
        warehouseKey: warehouse,
        isAdmin: !!result.isAdmin || isAdminSearch,
        msg: result.msg || `已在 ${warehouse} 找到您的資料`
      };
    }
    
    return {
      ok: false,
      error: result?.error || result?.msg || '姓名或生日不正確，請確認後重試'
    };
  } catch (error) {
    console.error('verifyLogin error:', error);
    return {
      ok: false,
      error: error.message || '驗證失敗，請稍後再試'
    };
  }
}

/**
 * 取得倉庫的 Sheet ID（PoC：從環境變數取得）
 */
export async function getWarehouseSheetId(warehouse) {
  // PoC 版本：Sheet ID 在 Vercel 環境變數中設定
  return 'configured-in-vercel-env';
}

/**
 * 取得分頁名稱列表
 * PoC 版本：呼叫原本的 Apps Script API 取得分頁名稱
 */
export async function getSheetNames(warehouse) {
  const wh = String(warehouse || 'TAO1').toUpperCase();
  const startTime = performance.now();

  // 優先使用快速的 Vercel API
  try {
    const url = `${API_BASE}/names?warehouse=${wh}&t=${Date.now()}`;
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    const data = await response.json();
    const elapsed = Math.round(performance.now() - startTime);
    if (data.ok && Array.isArray(data.sheetNames)) {
      console.log(`📋 getSheetNames (Vercel): ${wh} - ${elapsed}ms, ${data.sheetNames.length} sheets`);
      return data.sheetNames;
    }
  } catch (e) {
    console.warn('getSheetNames Vercel fallback to GAS:', e.message);
  }

  // Fallback: 使用 GAS API
  try {
    const url = new URL(GAS_API_URL);
    url.searchParams.set('mode', 'getSheets');
    url.searchParams.set('wh', wh);
    url.searchParams.set('t', String(Date.now()));
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      mode: 'cors',
    });
    
    const text = await response.text();
    const elapsed = Math.round(performance.now() - startTime);
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      console.error('getSheetNames: GAS API 回傳非 JSON:', text.substring(0, 200));
      return [];
    }
    
    if (Array.isArray(result)) {
      console.log(`📋 getSheetNames (GAS): ${wh} - ${elapsed}ms, ${result.length} sheets`);
      return result;
    }
    if (Array.isArray(result?.sheetNames)) {
      console.log(`📋 getSheetNames (GAS): ${wh} - ${elapsed}ms, ${result.sheetNames.length} sheets`);
      return result.sheetNames;
    }
    
    console.error('getSheetNames: 無法解析分頁名稱', result);
    return [];
  } catch (error) {
    console.error('getSheetNames error:', error);
    return [];
  }
}

/**
 * 判斷是否為 TAO3 班表類分頁（表頭在第2列）
 */
function isTao3ScheduleSheet(warehouse, sheetName) {
  const wh = String(warehouse || '').toUpperCase();
  const name = String(sheetName || '').toLowerCase();
  // TAO3 的班表類分頁：包含「班表」但不包含「出勤」
  return wh === 'TAO3' && name.includes('班表') && !name.includes('出勤');
}

/**
 * 判斷是否為雙行表頭的出勤時數分頁（RC 出勤時數）
 * 這類分頁的表頭分成兩行，需要合併
 */
function isDoubleHeaderAttendanceSheet(warehouse, sheetName) {
  const name = String(sheetName || '');
  // RC 出勤時數分頁使用雙行表頭
  return name.includes('RC') && name.includes('出勤時數');
}

/**
 * 解析表頭中的日期欄位，產生 dateCols 和 headersISO
 * 支援格式：2/1、2/14、2026/2/1、週日 2/1 等
 */
function parseDateColumns(headers, sheetName) {
  const dateCols = [];
  const headersISO = [];
  
  // 從分頁名稱中提取年份（例如：TAO3大園-2月班表(2/8更) -> 2026）
  const currentYear = new Date().getFullYear();
  let year = currentYear;
  
  // 嘗試從分頁名稱提取月份
  const monthMatch = String(sheetName || '').match(/(\d{1,2})月/);
  const sheetMonth = monthMatch ? parseInt(monthMatch[1], 10) : null;
  
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim();
    if (!h) {
      headersISO.push('');
      continue;
    }
    
    // 嘗試解析日期格式
    let month = null, day = null;
    
    // 格式：2026/2/1 或 2026-2-1
    const fullMatch = h.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (fullMatch) {
      year = parseInt(fullMatch[1], 10);
      month = parseInt(fullMatch[2], 10);
      day = parseInt(fullMatch[3], 10);
    }
    
    // 格式：2/1 或 2-1（可能有前綴如「週日」）
    if (!month) {
      const shortMatch = h.match(/(\d{1,2})[\/\-](\d{1,2})/);
      if (shortMatch) {
        month = parseInt(shortMatch[1], 10);
        day = parseInt(shortMatch[2], 10);
      }
    }
    
    if (month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      // 如果分頁名稱有月份，用它來確定年份
      if (sheetMonth && month !== sheetMonth) {
        // 跨年處理：如果分頁是1月但欄位是12月，年份-1
        if (sheetMonth === 1 && month === 12) {
          year = currentYear - 1;
        } else if (sheetMonth === 12 && month === 1) {
          year = currentYear + 1;
        }
      }
      
      const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      headersISO.push(isoDate);
      dateCols.push(i);
    } else {
      headersISO.push('');
    }
  }
  
  return { dateCols, headersISO };
}

/**
 * 讀取分頁資料
 * PoC 版本：使用 Vercel API 直連 Google Sheets（快速）
 */
export async function getSheetData(warehouse, sheetName, name = '', options = {}) {
  try {
    // 建立 range（讀取整個分頁）
    const range = `${sheetName}!A1:AZ1000`;
    
    const result = await fetchSheetData(range, warehouse);
    
    // 轉換為原本的格式（與 Apps Script API 相容）
    const values = result.values || [];
    
    // TAO3 班表類分頁：表頭在第2列（索引1），其他分頁：表頭在第1列（索引0）
    const headerRowIndex = isTao3ScheduleSheet(warehouse, sheetName) ? 1 : 0;
    // 將表頭中的換行符替換為空格
    let headers = (values[headerRowIndex] || []).map(h => String(h || '').replace(/[\n\r]+/g, ' ').trim());
    let dataStartIndex = headerRowIndex + 1;
    
    // 所有出勤時數分頁：將表頭中的換行符替換為空格
    if (sheetName.includes('出勤時數')) {
      headers = headers.map(h => String(h || '').replace(/[\n\r]+/g, ' ').trim());
      console.log(`📊 [PoC] getSheetData: ${sheetName} - 處理換行符後 headers=`, headers.slice(0, 12));
    }
    
    // RC 出勤時數分頁：不再需要合併多行表頭（換行符已在 fetchSheetData 中處理）
    if (isDoubleHeaderAttendanceSheet(warehouse, sheetName)) {
      console.log(`📊 [PoC] getSheetData: ${sheetName} - RC出勤時數 headers=`, headers.slice(0, 12));
      console.log(`📊 [PoC] getSheetData: ${sheetName} - dataStartIndex=${dataStartIndex}, 第二行=`, values[1]?.slice(0, 8));
    }
    
    // 解析日期欄位
    const { dateCols, headersISO } = parseDateColumns(headers, sheetName);
    
    // 轉換 rows 格式：{ v: [...], id: 'row_X' }
    const rows = values.slice(dataStartIndex).map((row, idx) => ({
      v: row,
      id: `row_${idx}`,
    }));
    
    console.log(`📊 [PoC] getSheetData: ${warehouse}/${sheetName} - headerRow=${headerRowIndex + 1}, rows=${rows.length}, dateCols=${dateCols.length}`);
    
    return {
      headers,
      rows,
      dateCols,
      headersISO,
      fetchMs: lastFetchMs,
    };
  } catch (error) {
    console.error('getSheetData error:', error);
    return {
      headers: [],
      rows: [],
      dateCols: [],
      headersISO: [],
      error: error.message,
    };
  }
}

/**
 * 批量讀取多個分頁資料
 * PoC 版本：並行呼叫 getSheetData（提升速度）
 */
export async function getBatchSheetData(warehouse, sheetNames, options = {}) {
  const results = {};
  
  // 並行請求所有分頁
  const promises = sheetNames.map(async (sheetName) => {
    try {
      const data = await getSheetData(warehouse, sheetName, options?.name, options);
      return { sheetName, data };
    } catch (error) {
      console.error(`getBatchSheetData error for ${sheetName}:`, error);
      return { sheetName, data: { headers: [], rows: [], error: error.message } };
    }
  });
  
  const settled = await Promise.all(promises);
  settled.forEach(({ sheetName, data }) => {
    results[sheetName] = data;
  });
  
  return results;
}

/**
 * 找出姓名欄位索引
 */
function findNameColumnIndex(headers) {
  const nameKeywords = ['姓名', 'Name', 'name', '員工姓名', '中文姓名', '人員姓名', '員工名稱'];
  
  // 完全匹配
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] ?? '').trim();
    if (h && nameKeywords.includes(h)) return i;
  }
  
  // 部分匹配
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] ?? '').trim().toLowerCase();
    if (h && (h.includes('姓名') || h.includes('name'))) return i;
  }
  
  return -1;
}

/**
 * 解析分頁資料為標準格式
 */
export function parseSheetData(rawData, options = {}) {
  // 將表頭中的換行符替換為空格，確保資料能正確匹配
  const headers = (rawData.headers ?? []).map(h => String(h ?? '').replace(/[\n\r]+/g, ' ').trim());
  
  // 找出姓名欄位索引
  const nameColIndex = findNameColumnIndex(headers);
  
  const rows = (rawData.rows ?? []).map((row, idx) => {
    const rowData = { id: `row_${idx}` };
    const values = row.v || row;
    
    // 確保 values 是陣列
    const valuesArray = Array.isArray(values) ? values : [];
    
    // 確保所有表頭都有對應的 key（即使值是空的）
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i] || `col_${i + 1}`;
      // 使用原始表頭作為 key，保留換行符等特殊字元
      rowData[header] = valuesArray[i] ?? '';
    }
    
    // 額外：為含換行符的表頭建立正規化的 key（移除換行符）
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i] || '';
      const normalizedHeader = header.replace(/[\n\r]/g, '');
      // 如果正規化後的 key 不同，也加入
      if (normalizedHeader !== header && normalizedHeader) {
        rowData[normalizedHeader] = valuesArray[i] ?? '';
      }
    }
    
    // 確保姓名欄位有值（用於 getRowName）
    if (nameColIndex >= 0 && valuesArray[nameColIndex]) {
      rowData.姓名 = valuesArray[nameColIndex];
    }
    
    // 背景色和文字色
    if (Array.isArray(row.bg)) rowData._bg = row.bg;
    if (Array.isArray(row.fc)) rowData._fc = row.fc;
    
    return rowData;
  });

  return {
    headers,
    rows,
    dateCols: rawData.dateCols || [],
    headersISO: rawData.headersISO || [],
    frozenLeft: rawData.frozenLeft || 0,
    nameColIndex
  };
}

/**
 * 正規化姓名
 */
export function normalizeName(value) {
  return String(value ?? '')
    .replace(/[\u00A0\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/g, '')
    .replace(/\p{Cf}/gu, '')
    .replace(/\s+/g, '')
    .trim();
}

/**
 * 清除快取（PoC 版本：無快取）
 */
export function clearAllCache() {
  console.log('[PoC] 無快取模式，不需要清除');
}

/**
 * 從資料列中取得姓名
 * 自動搜尋所有欄位，找出看起來像中文姓名的值
 */
export function getRowName(row) {
  // 1. 先檢查常見的姓名欄位名稱
  const nameFields = [
    'name', 'Name', 'NAME',
    '姓名', '姓 名', '員工姓名', '中文姓名',
    '姓名(中文)', '人員姓名', '員工名稱'
  ];
  
  for (const field of nameFields) {
    const value = row[field];
    if (value) {
      const name = String(value).trim();
      if (name && name.length >= 2) return name;
    }
  }
  
  // 2. 搜尋包含「姓名」或「Name」的欄位
  for (const [key, value] of Object.entries(row)) {
    if (!key || key.startsWith('_') || key === 'id') continue;
    const k = String(key).toLowerCase();
    if (k.includes('姓名') || k.includes('name')) {
      const name = String(value ?? '').trim();
      if (name && name.length >= 2) return name;
    }
  }
  
  // 3. 自動搜尋：找出看起來像中文姓名的值（2-4個中文字）
  const chineseNamePattern = /^[\u4e00-\u9fa5]{2,4}$/;
  for (const [key, value] of Object.entries(row)) {
    if (!key || key.startsWith('_') || key === 'id') continue;
    const v = String(value ?? '').trim();
    if (v && chineseNamePattern.test(v)) {
      return v;
    }
  }
  
  return '';
}

export default {
  getAvailableWarehouses,
  isGasConfigured,
  verifyLogin,
  getWarehouseSheetId,
  getSheetNames,
  getSheetData,
  getBatchSheetData,
  parseSheetData,
  getRowName,
  normalizeName,
  clearAllCache,
  getLastFetchMs,
};
