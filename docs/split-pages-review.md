# 拆頁後品質檢核 — 審查報告

依 `docs/split-pages-plan.md` 第 130–139 行「拆頁後品質檢核流程」四步驟，對目前四頁（總覽、查預算、立委把關、更多資訊）進行檢核。

---

## 1. frontend-design（版面、排版、CTA、導覽層次、視覺一致性）

### 已符合
- **設計系統**：`styles_vs.css` 具備完整 design tokens（顏色、字型、陰影、圓角、間距），四頁共用，視覺一致。
- **字型**：Noto Sans TC + Inter，適合 civic/政府類介面。
- **Hero / CTA**：總覽頁 Hero 有明確標題、摘要卡與 CTA；查預算／立委把關各有清楚任務導向內容。

### 待改進
- ~~**導覽視覺／順序不一致**~~ **已修正**：budget / legislators / other 的 nav 已改為與 index 一致（品牌 → 選單鈕 → 頁籤 → 搜尋鈕 → 搜尋彈窗）。
- **Nav 標題字不一致**  
  - index：`115 年度中央政府總預算案`；其餘三頁：`總預算觀測站`。  
  - 若希望「總覽＝完整標題、他頁＝短標」可保留；否則建議統一用同一組文案。
- **frontend-design skill 建議**：可再強化「一個讓人記住的點」——例如 Hero 區的動態或圖表進場動效、或 CTA 的 hover/focus 動效，讓整體更有辨識度。

---

## 2. Vercel Web Design Guidelines（語意化 HTML、label、鍵盤、焦點、導覽一致性）

### 已符合
- **Skip link**：四頁皆有 `<a href="#main-content" class="skip-link">跳至主內容</a>`。
- **Landmark**：`<main id="main-content">`、`<nav aria-label="全站導覽">`、表單 `role="search"`、`aria-label` 得當。
- **表單 label**：搜尋輸入框有 `<label for="nav-search-input" class="visually-hidden">`。
- **焦點樣式**：`.skip-link:focus-visible`、`.float-nav :focus-visible`、`.btn:focus-visible`、輸入框 focus 等皆有可見 ring/outline（`styles_vs.css`）。
- **立委 modal**：`.leg-modal-body`、`.table-scroll` 已設 `tabindex="0"`，可鍵盤聚焦捲動。
- **選單按鈕**：`aria-expanded`、`aria-controls` 正確。

### 待改進
- ~~**Modal 關閉鈕語意與鍵盤**~~ **已修正**：unifiedModal（budget）與 detailModalC（legislators）的關閉已改為 `<button type="button" class="close-btn" aria-label="關閉">`，並加上 `.close-btn:focus-visible` 樣式。
- ~~**導覽順序一致性**~~ **已修正**：見「1. frontend-design」。

---

## 3. web-quality-skills（效能、Core Web Vitals、blocking、資源載入）

### 已符合
- **preconnect**：四頁皆對 `fonts.googleapis.com` / `fonts.gstatic.com` 設 `preconnect`。
- **JS 載入**：共用的 `main_vs.js` 與 `vs-modules/*.js` 皆以 `defer` 載入，不阻塞解析。
- **other.html**：未載入 Chart.js、PapaParse，僅字型與 CSS，負載最輕。
- **Lighthouse CI**：專案已有 `lighthouserc.cjs`，可對指定 URL 做效能／a11y 預算檢查。

### 待改進
- **Chart.js / PapaParse 僅部分頁面需要**  
  - 總覽、查預算：需要 Chart.js（與 PapaParse，若用於資料）。  
  - 立委把關：主內容無圖表，僅表格；若 modal 也無圖表，則不需 Chart.js。目前四頁共用同一套 `<head>` 的 script，legislators 仍會載入 Chart.js，屬多餘 payload。  
  - 建議：legislators（與 other）不載入 Chart.js / PapaParse；或改為動態 import（僅在需要圖表的頁面載入）。需搭配 `main_vs.js` 內「節點存在才執行」的守衛，避免未載入 Chart 時報錯。
- **字型載入**  
  - 目前為 `stylesheet` 同步載入 Google Fonts，可能造成 FOUT 或輕微阻塞。若 LHCI 報告 LCP 受字型影響，可考慮 `font-display: swap` 或 preload 關鍵字型。
- **建議**：對四頁與主要互動路徑跑一次 LHCI（含 mobile），確認 LCP、CLS、INP 是否在預算內。

---

## 4. AccessLint（選用：對比度、link purpose、僅靠顏色區分的提示）

- 專案已有 Playwright + `@axe-core/playwright` 的 a11y smoke（見 `tests/a11y/`），且已關閉 `color-contrast` 以減少雜訊。
- **建議**：若需嚴格 WCAG，可另用 AccessLint 或 axe 完整規則跑一次，特別檢查：  
  - 對比度（文字／背景、按鈕／圖表）。  
  - 連結目的（避免僅「點這裡」）。  
  - 錯誤／成功狀態是否僅用顏色區分（應輔以圖示或文字）。

---

## 總結與建議優先順序

| 優先 | 項目 | 說明 |
|------|------|------|
| ~~高~~ | ~~統一四頁 nav 的 DOM 順序~~ | ✅ 已完成。 |
| ~~高~~ | ~~Modal 關閉改為 `<button>` + `aria-label`~~ | ✅ 已完成（budget + legislators）。 |
| 中 | legislators（及 other）不載入 Chart.js/PapaParse | 減少不必要 JS，利於效能與 CWV。 |
| 中 | Nav 標題文案統一或明確定義 | 總覽 vs 他頁的標題差異是否為設計意圖。 |
| 低 | 字型載入策略、Hero/CTA 動效 | 依 LHCI 與設計資源再細調。 |

完成上述高優先項目後，建議再跑一輪 E2E、a11y smoke 與 LHCI，並可依需要加上 AccessLint 做細部 WCAG 檢查。
