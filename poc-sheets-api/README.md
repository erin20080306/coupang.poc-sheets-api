# PoC: Google Sheets API 測速版

## 📋 專案說明

這是一個 PoC（概念驗證）專案，用於測試透過 Vercel Serverless API 直連 Google Sheets API 的效能。

### 資料流
```
PWA（前端）→ Vercel Serverless API → Google Sheets API (Service Account) → JSON → PWA 渲染
```

### 目標
- 測試是否能比原本的 Apps Script Web App（約 8.9 秒）更快
- 禁止任何形式的快取，確保每次都讀取最新資料

---

## 🔧 環境變數設定

在 Vercel Project Settings → Environment Variables 中設定：

| 變數名稱 | 說明 | 範例 |
|---------|------|------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Service Account JSON 完整內容（字串形式） | `{"type":"service_account",...}` |
| `SHEET_ID` | Google Sheet ID（網址中的那串） | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` |

### 如何取得 Service Account JSON

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案（或使用現有專案）
3. 啟用 **Google Sheets API**
4. 前往「IAM 與管理」→「服務帳戶」
5. 建立服務帳戶
6. 建立金鑰（JSON 格式）
7. 下載 JSON 檔案
8. 將 JSON 內容複製到 Vercel 環境變數

### 重要：分享 Google Sheet 給 Service Account

將目標 Google Sheet 分享給 Service Account 的 email（`client_email` 欄位），權限：
- 只讀：Viewer
- 需要寫入：Editor

---

## 📡 API 端點

### GET /api/sheets/read

讀取 Google Sheet 資料。

**Query 參數：**
| 參數 | 必填 | 說明 | 範例 |
|-----|------|------|------|
| `range` | ✅ | 讀取範圍 | `Sheet1!A1:K2000` |
| `majorDimension` | ❌ | ROWS 或 COLUMNS | `ROWS`（預設） |

**範例請求：**
```bash
curl "https://your-poc.vercel.app/api/sheets/read?range=Sheet1!A1:K100"
```

**成功回應：**
```json
{
  "ok": true,
  "range": "Sheet1!A1:K100",
  "values": [["A1", "B1", ...], ["A2", "B2", ...], ...],
  "meta": { "rows": 100, "cols": 11 },
  "serverTime": "2026-02-14T01:35:00.000Z"
}
```

**錯誤回應：**
```json
{
  "ok": false,
  "error": "Missing required parameter: range"
}
```

### POST /api/sheets/write

寫入 Google Sheet 資料。

**Body：**
```json
{
  "range": "Sheet1!C2:C2",
  "values": [["寫入內容"]]
}
```

**成功回應：**
```json
{
  "ok": true,
  "serverTime": "2026-02-14T01:35:00.000Z"
}
```

---

## 🚀 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

注意：本地開發時 `/api/*` 端點不會運作，需要部署到 Vercel 才能測試 API。

---

## 📊 驗收標準

1. **DevTools Network**：`/api/sheets/read` 回應是 JSON，沒有 302/307 redirect
2. **即時同步**：在 Google Sheet 改一格 → 刷新 PoC → 必須讀到新值
3. **性能**：連續測 5 次，記錄 min/avg/max（目標 < 2 秒）

---

## ⚠️ 注意事項

- **禁止快取**：API 回應 `Cache-Control: no-store, max-age=0`
- **禁止提交 Service Account JSON**：只能放在 Vercel 環境變數
- **此專案不影響正式版**

---

## 📁 專案結構

```
poc-sheets-api/
├── api/
│   └── sheets/
│       ├── read.js      # 讀取 API
│       └── write.js     # 寫入 API
├── src/
│   ├── lib/
│   │   └── dataClient.js  # 資料存取模組
│   ├── App.jsx          # 主要 UI
│   ├── main.jsx         # 入口
│   └── index.css        # 樣式
├── vercel.json          # Vercel 設定
├── package.json
└── README.md
```
