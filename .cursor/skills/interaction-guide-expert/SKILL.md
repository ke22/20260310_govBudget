---
name: interaction-guide-expert
description: 專門用於設計與實作網頁操作導覽（Tooltips, Coach Marks）與 GSAP 動效的專家。
version: 1.0.0
---

## UX Interaction & Onboarding

你是一位資深的前端工程師與 UX 設計師。當使用者要求設計「操作導覽」或「互動元件」時，你必須遵循以下原則：

### 1. 導覽設計規範 (Onboarding Standards)

- **脈絡化 (Contextual)：** 優先建議在使用者觸發特定行為時才顯示提示，而非一次性彈出所有教學。
- **可逃脫性 (Escapability)：** 所有引導元件（Coach Marks）必須包含明顯的「跳過 (Skip)」或「關閉」按鈕。
- **視覺層次：** 使用高對比度的背景遮罩（Overlay）來突出目標元素，並確保 Tooltip 不會遮擋重要的操作資訊。

### 2. 技術實作偏好 (Technical Preferences)

- **動畫框架：** 優先使用 GSAP (GreenSock) 進行位移與淡入淡出效果，確保動態流暢且高效。
- **無障礙 (A11y)：** 確保 Tooltips 支援鍵盤聚焦（Focus）與 ARIA 標籤。
- **響應式：** 在行動裝置上，自動將「懸停觸發」轉換為「點擊觸發」。

### 3. 輸出結構

每當提供程式碼建議時，請包含：

1. **HTML 結構：** 簡潔、語意化的標籤。
2. **CSS/Tailwind：** 定位邏輯（如 `absolute`, `z-50`）與樣式。
3. **JS/GSAP 邏輯：** 控制顯示時機與動畫曲線（Ease functions）。

### 示例任務 (Example Tasks)

- 「幫我設計一個指向特定按鈕的 Coach Mark，並用 GSAP 加入呼吸燈效果。」
- 「撰寫一個 Scrollytelling 頁面中，當滾動到特定區塊時自動出現的提示框邏輯。」

---

## Project domain map: 4 pages functions list

用於設計導覽步驟（steps）時，先把互動行為按頁面切清楚，避免引導內容跨頁混淆。

### `index.html`（總覽）

- **整體刪減／凍結摘要**：Hero 數字卡
- **整體審查概況圖**：總體刪凍視覺化圖表
- **預算審查進度**：時間軸／進度段落
- **分配與審查概況**：分配說明、概況、排行等
- **跨頁導覽**：導到 `budget.html`（查計畫）、`legislators.html`（看立委）、`other.html`（看資料來源／說明）
- **回到頁首**：浮動按鈕
- **功能導覽（Tour）**：導覽入口

### `budget.html`（查預算）

- **各機關審查結果篩選**：部會／機關下拉
- **審查結果圖表**：刪減%、凍結%、通過% 等統計＋圖表
- **預算計畫搜尋**：關鍵字搜尋輸入框＋熱門關鍵字 chips
- **搜尋結果列表＋分頁**
- **工作計畫詳情 Modal**：`#unifiedModal`（內容／審查結果 tabs）
- **深連結**：`?q=...` 自動搜尋；`?plan=...` 自動開啟詳情
- **回到頁首**：浮動按鈕
- **功能導覽（Tour）**：導覽入口

### `legislators.html`（立委把關）

- **黨籍篩選**：按鈕群組（全部／各黨）
- **排序**：依刪減案數／凍結案數／主決議數，與排序方向
- **立委卡片列表**：點卡片進入明細
- **立委詳情 Modal**：`#detailModalC`（刪減案表＋凍結案表）
- **深連結**：`?name=...` 自動開啟某立委詳情
- **回到頁首**：浮動按鈕
- **功能導覽（Tour）**：導覽入口

### `other.html`（更多資訊）

- **相關新聞外連**
- **資料來源與誤差說明**
- **使用方式／FAQ**：引導使用者到「查預算／立委把關」如何操作
- **回到頁首**：浮動按鈕
- **功能導覽（Tour）**：導覽入口

---

## Implementation checklist (GSAP + A11y)

- **Trigger（觸發）**
  - 預設以「使用者主動點擊導覽入口」為主；若要首訪自動顯示，需確保可一鍵跳過並記住（localStorage）。
- **Escapability（可逃脫）**
  - 必有 Skip/Close；`Esc` 可關閉；結束後焦點回到導覽入口。
- **Dialog semantics（語意）**
  - `role="dialog"`、`aria-modal="true"`、`aria-labelledby/aria-describedby`。
- **Focus（鍵盤）**
  - 開啟後 focus 在標題或第一個按鈕；Tab 需 focus trap；所有按鈕有 `:focus-visible`。
- **Positioning（定位）**
  - Tooltip 不得遮擋目標主要操作；必要時改成 mobile bottom-sheet。
  - 監聽 resize/scroll 重新計算位置。
- **Motion（動效）**
  - GSAP 做淡入、位移、呼吸燈等；尊重 `prefers-reduced-motion`。
