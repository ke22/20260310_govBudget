# 現有架構與標籤

## 一、index-v2.html（新版單頁）

### 1. 整體結構

```
<body>
  <header class="nav">           ← 頂部導覽（sticky）
  <main>
    <section id="home" class="hero">           ← 首頁 Hero
    <section id="section-news">                ← 相關新聞
    <section id="section-progress">            ← 預算審查進度
    <section id="section-allocation">          ← 115 年度預算案分配概況
    <section id="section-agency">              ← 各機關審查結果
    <section id="section-compare">             ← 各部會今年去年預算比較
    <section id="section-ministry-detail">     ← 部會預算詳細分析
    <section id="section-search">              ← 預算計畫搜尋
    <section id="section-legislator">          ← 立委把關
  </main>
  <button class="float-home">                 ← 浮動回首頁
  <div id="loader">                           ← Loading 遮罩
  <div id="error-toast">                      ← 錯誤提示
</body>
```

### 2. Section ID 與錨點對應（同頁捲動用）

| Section ID | 區塊名稱 | data-scroll-to 對應 |
|------------|----------|----------------------|
| `home` | 首頁 Hero | `home` |
| `section-news` | 相關新聞 | `section-news` |
| `section-progress` | 預算審查進度 | `section-progress` |
| `section-allocation` | 115 年度預算案分配概況 | `section-allocation` |
| `section-agency` | 各機關審查結果 | `section-agency` |
| `section-compare` | 各部會今年去年預算比較 | `section-compare` |
| `section-ministry-detail` | 部會預算詳細分析 | `section-ministry-detail` |
| `section-search` | 預算計畫搜尋 | `section-search` |
| `section-legislator` | 立委把關 | `section-legislator` |

### 3. 重要元素 ID（JS 綁定／資料寫入）

| ID | 用途 | 所屬區塊 |
|----|------|----------|
| `summary-cut-amount` | 已刪減金額 | Hero 摘要卡 |
| `summary-cut-yoy` | 已刪減「較去年」% | Hero 摘要卡 |
| `summary-freeze-amount` | 已凍結金額 | Hero 摘要卡 |
| `summary-freeze-yoy` | 已凍結「較去年」% | Hero 摘要卡 |
| `hero-nav-list` | 快速導覽清單（滾筒） | Hero 右側 |
| `chartStatusB` | 總體審查結果長條圖 | section-progress |
| `timeline-shell` | 時間軸容器 | section-progress |
| `chartAllocation` | 115 分配概況圖 | section-allocation |
| `agency-summary-grid` | 各機關摘要卡片容器 | section-agency |
| `chartMinistryCompare` | 各部會今年去年比較圖 | section-compare |
| `ministry-select` | 部會下拉選單 | section-ministry-detail |
| `chartMinistryPie` | 部會圓餅圖 | section-ministry-detail |
| `chartMinistryBars` | 通過／凍結／刪減長條圖 | section-ministry-detail |
| `search-input` | 搜尋輸入框 | section-search |
| `search-btn` | 搜尋按鈕 | section-search |
| `search-count-label` | 搜尋結果筆數說明 | section-search |
| `search-results` | 搜尋結果列表 | section-search |
| `leg-sort-select` | 立委排序選單 | section-legislator |
| `legislator-grid` | 立委卡片容器 | section-legislator |
| `loader` | 讀取中遮罩 | 全域 |
| `error-toast` | 錯誤訊息 toast | 全域 |

### 4. 主要 CSS class（版型／元件）

| Class | 用途 |
|-------|------|
| `nav`, `nav-inner`, `nav-brand`, `nav-links` | 頂部導覽 |
| `hero`, `hero-inner`, `hero-main`, `hero-sidebar` | Hero 左右欄 |
| `hero-kicker`, `hero-title`, `hero-lead`, `hero-cta-row` | Hero 文案與按鈕 |
| `hero-summary-grid`, `summary-card`, `summary-amount`, `summary-meta` | Hero 摘要卡 |
| `sidebar-wheel`, `wheel-arrow`, `wheel-list` | 右側快速導覽（滾筒） |
| `content-section` | 各區塊外層 |
| `section-head`, `section-label-row`, `section-triangle` | 區塊標題（紅三角＋標題） |
| `article-body` | 區塊說明文字 |
| `chart-shell` | 圖表外層 |
| `card-grid` | 卡片網格（機關摘要） |
| `ministry-detail-layout`, `ministry-left`, `ministry-right`, `mini-head` | 部會詳細分析左右欄 |
| `search-shell`, `search-row`, `search-meta`, `search-results` | 搜尋區 |
| `legislator-head`, `leg-filter-row`, `leg-grid` | 立委區 |
| `float-home` | 浮動回首頁按鈕 |
| `loading-overlay`, `loading-card`, `spinner` | Loading UI |
| `toast` | 錯誤 toast |

### 5. 互動屬性

| 屬性 | 用途 |
|------|------|
| `data-scroll-to="<section-id>"` | 點擊後平滑捲動到對應 section（Nav、Hero CTA、側欄清單、浮動按鈕） |

---

## 二、index.html（v1 舊版）

### 1. 主要區塊 ID（首頁＋分頁）

| ID | 區塊／用途 |
|----|------------|
| `section-review-progress` | 首頁：預算審查進度（含時間軸） |
| `section-review-stats` | 首頁：總體審查圖表（chartStatusB） |
| `section-agency-review-home` | 首頁：排行榜（Top 5） |
| `section-ministry-compare` | 首頁：各部會今年去年比較 |
| `section-allocation-115` | 首頁：115 分配概況（chartAllocation） |
| `section-ministry-detail` | 首頁：部會預算詳細分析 |
| `section-plan-search-home` | 首頁：預算計畫搜尋入口 |
| `page-budget` | 分頁：預算審查／搜尋 |
| `page-legislator` | 分頁：立委把關 |

### 2. 資料來源對應（v1／v2 共用）

| 代號 | Google Sheet gid | 內容 |
|------|------------------|------|
| page-a | 612819456 | 工作計畫（編列、部會、機關、預算金額等） |
| page-b | 1304436957 | 審查結果（刪減／凍結金額等） |
| page-c | 1025885437 | 立委（委員姓名、黨籍、刪減案數、凍結案數等） |
| page-d | 1462843513 | 時間軸（日期、事項、連結） |

### 3. v1 特有重要 ID（若需從 v1 移植邏輯可對照）

- `nav-search-input`, `nav-home`, `nav-budget`, `nav-legislator`
- `sidebar-nav-list`（首頁側欄清單）
- `chartStatusB`, `chartAllocation`, `chartAllocationLegend`
- `chartBudgetPageReview`, `bp-filter-ministry`, `bp-filter-unit`, `bp-review-caption`
- `results-container-budget`, `pagination-budget`
- `ranking-list`（Top 5 排行榜）
- `legislator-grid` 或立委列表容器
- `loader`, `error-display`

---

## 三、檔案對照

| 檔案 | 說明 |
|------|------|
| `index-v2.html` | 新版單頁，依 pencil-new.pen 版型，區塊以 section ID + 錨點捲動 |
| `index.html` | 舊版，首頁＋分頁（page-budget / page-legislator）切換 |
| `styles-v2.css` | 新版樣式（Nav、Hero、section、chart-shell、card、search、leg、float、loader、toast） |
| `main-v2.js` | 新版邏輯：fetchData、renderHomeStatusChart、updateHeroSummary、搜尋、立委排序、smoothScroll、hero 滾筒透明度 |

若要「依現有架構與標籤」接更多功能，只要對照上表 ID／class 在 `index-v2.html` 與 `main-v2.js` 裡綁定即可。
