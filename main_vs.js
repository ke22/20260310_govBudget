// --- 1. Constants & Variables ---
// 115年預算案_各機關別_給美編：https://docs.google.com/spreadsheets/d/11OXVLqRUfySckHFAWJLEciSxqA-XmTqAUS62j59Syzs/edit?usp=sharing
const FILE_ID = '11OXVLqRUfySckHFAWJLEciSxqA-XmTqAUS62j59Syzs';
const getQueryUrl = (gid) => `https://docs.google.com/spreadsheets/d/${FILE_ID}/gviz/tq?tqx=out:json&tq&gid=${gid}&_=${new Date().getTime()}`;

const dataSources = {
    'page-a': './data_page_a.json',
    'page-b': './data_page_b.json',
    'page-c': './data_page_c.json',
    'page-d': './data_page_d.json'
};

// Global Chart.js theme (align with civic-ledger typography/colors)
(() => {
    if (typeof Chart === 'undefined') return;
    Chart.defaults.font.family = '"IBM Plex Mono","Noto Sans TC",ui-sans-serif,system-ui,sans-serif';
    Chart.defaults.font.weight = '600';
    Chart.defaults.color = 'rgba(20,22,29,0.82)';
    Chart.defaults.borderColor = 'rgba(20,22,29,0.12)';
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.pointStyle = 'rectRounded';
    Chart.defaults.plugins.legend.labels.boxWidth = 10;
})();

// Mock Data
const MOCK_DATA_A = [{ '計畫編號': 'TEST001', '所屬部會': '行政院', '主管機關': '國防部', '計畫名稱': '國防自主強化計畫 (測試資料)', '預算金額': '5000000000', '114年預算金額': '4800000000', '政事別': '國防', '工作內容': '測試說明。', '分支計畫': '潛艦國造:3000000000:這是潛艦的詳細說明|無人機研發:2000000000:這是無人機的詳細說明', '用途比例': '人事費:50000000|業務費:30000000|設備及投資:4000000000|獎補助費:10000000|債務費:0|預備金:0' }];
const MOCK_DATA_B = [{ '計畫編號': 'TEST001', '計畫名稱': '國防自主強化計畫', '主管機關': '國防部', '預算金額': '5000000000', '刪減金額': '1000000', '凍結金額': '50000000', '委員會刪減': '500000', '委員會凍結': '20000000', '院會表決刪減': '500000', '院會表決凍結': '30000000', '通案刪減': '100000', '通案凍結': '0', '提案紀錄': '王小明:凍結:人事費:理由A', '資料類型': '計畫' }];
const MOCK_DATA_C = [{ '委員姓名': '王小明', '黨籍': '無黨籍', '刪減案數': '5', '凍結案數': '10', '主決議數': '2', '照片': '', '更新時間': '2026/01/20', '提案明細': '刪減#國防自主強化計畫 (測試資料)#設備採購#100萬#理由B#TEST001#通過#114/05/20' }];
const MOCK_DATA_D = [{ '日期': '113/08/22', '事項': '行政院通過總預算案', '連結': '' }, { '日期': '113/08/30', '事項': '預算案送立法院審議', '連結': '' }, { '日期': '113/11/08', '事項': '付委審查', '連結': '' }];

let allDataPageA = [], allDataPageB = [], allDataPageB_Plans = [], allDataPageC = [], allDataPageD = [];
let mainChartsRendered = false;
let isDemoMode = false;

// Chart Instances
let chartStatusInstance = null;
let chartAllocationInstance = null;
let chartMinistryBar = null;
let chartMinistryPie = null;

// Modal Chart Instances
let chartModalPlanRatio = null;
let chartModalCatRatio = null;
let chartModalAgencyReview = null;
let chartBranchRatio = null; // [v163] New Chart Instance
let chartPieA = null, chartB1 = null, chartB2 = null;

let chartMilMndRatio = null, chartMilUnitRatio = null, chartMilMndCat = null, chartMilUnitCat = null;

const categoryColorMap = {
    '社會福利': '#ce696d',
    '教育科學文化': '#F0C808',
    '國防': '#97b1de',
    '經濟發展': '#5591bf',
    '一般政務': '#315493',
    '退休撫卹': '#c63f3f',
    '債務還本付息': '#c7c7cc',
    '補助及其他': '#f4f6f8',
    '社區發展及環境保護': '#1c1c1e',
    '其他': '#8e8e93'
};

function isCaucusName(name) {
    return typeof name === 'string' && name.includes('黨團');
}

function getPartyTheme(partyOrName) {
    const s = (partyOrName || '').toString();
    if (s.includes('民進')) return { bg: '#127A4A', fg: '#FFFFFF' };
    if (s.includes('國民')) return { bg: '#1E4DB7', fg: '#FFFFFF' };
    if (s.includes('民眾')) return { bg: '#0D9AA6', fg: '#FFFFFF' };
    return { bg: '#6B7280', fg: '#FFFFFF' };
}

function toSvgDataUri(svg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function makeCaucusAvatarDataUri(label, partyOrName) {
    const { bg, fg } = getPartyTheme(partyOrName || label);
    const text = (label || '').toString().slice(0, 6);
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="#0B1220"/>
    </linearGradient>
    <pattern id="p" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
      <rect width="14" height="14" fill="none"/>
      <path d="M0 13 L14 13" stroke="rgba(255,255,255,0.18)" stroke-width="2" />
    </pattern>
  </defs>
  <rect x="16" y="16" width="224" height="224" rx="64" fill="url(#g)"/>
  <rect x="16" y="16" width="224" height="224" rx="64" fill="url(#p)" opacity="0.85"/>
  <circle cx="196" cy="72" r="10" fill="rgba(255,255,255,0.35)"/>
  <text x="128" y="142" text-anchor="middle" font-size="44" font-weight="900"
        font-family="Noto Serif TC, Noto Sans TC, ui-serif, serif"
        fill="${fg}" letter-spacing="2">${text}</text>
  <text x="128" y="182" text-anchor="middle" font-size="18" font-weight="600"
        font-family="IBM Plex Mono, Noto Sans TC, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        fill="rgba(255,255,255,0.85)">CAUCUS</text>
</svg>`;
    return toSvgDataUri(svg);
}

function getLegislatorPhotoSrc(name, party) {
    if (!name) return null;
    if (isCaucusName(name)) return makeCaucusAvatarDataUri(name, party || name);
    return `./photos/${name}.jpg`;
}
// --- [v172] 工作內容分頁：機關審查結果儀表板 ---

let chartBudgetPageReview = null; // 全域變數儲存圖表實例

// 1. 初始化下拉選單
function initBudgetPageFilters() {
    const ministrySelect = document.querySelector(".js-bp-filter-ministry");
    if (!allDataPageA || allDataPageA.length === 0) return;

    // 取得所有部會清單
    const ministries = [...new Set(allDataPageA.map(item => item['所屬部會']))].filter(m => m).sort();

    let html = '<option value="">請選擇所屬部會</option>';
    ministries.forEach(m => { html += `<option value="${m}">${m}</option>`; });
    ministrySelect.innerHTML = html;

    // [關鍵修正] 選單建立後，立刻執行一次更新，顯示「全國總覽」
    updateBudgetPageReview();
}

// 2. 更新圖表與連動選單
function updateBudgetPageReview() {
    const ministrySelect = document.querySelector(".js-bp-filter-ministry");
    const unitSelect = document.querySelector(".js-bp-filter-unit");
    const selectedMinistry = ministrySelect.value;

    // 連動邏輯：選部會 -> 更新機關選單
    if (selectedMinistry) {
        const agencies = [...new Set(allDataPageA
            .filter(d => d['所屬部會'] === selectedMinistry)
            .map(d => d['主管機關']))]
            .filter(a => a).sort();

        const lastMinistry = unitSelect.getAttribute('data-last-ministry');
        if (lastMinistry !== selectedMinistry) {
            let html = '<option value="">請選擇主管機關 (全部)</option>';
            agencies.forEach(a => { html += `<option value="${a}">${a}</option>`; });
            unitSelect.innerHTML = html;
            unitSelect.value = "";
            unitSelect.setAttribute('data-last-ministry', selectedMinistry);
        }
    } else {
        unitSelect.innerHTML = '<option value="">請選擇主管機關</option>';
        unitSelect.value = "";
    }

    const selectedAgency = unitSelect.value;
    const captionEl = document.querySelector(".js-bp-review-caption");

    // --- 計算邏輯 ---
    let totalBudget = 0;
    let totalCut = 0;
    let totalFreeze = 0;
    let titleText = "";

    if (selectedAgency) {
        // [情境 3] 已選擇特定機關
        const stats = calculateAgencyStats(selectedAgency);
        totalBudget = stats.totalBudget;
        totalCut = stats.totalCut;
        totalFreeze = stats.totalFreeze;
        titleText = selectedAgency;
    } else if (selectedMinistry) {
        // [情境 2] 只選部會
        titleText = selectedMinistry + " (全體)";
        const ministryProjects = allDataPageA.filter(d => d['所屬部會'] === selectedMinistry);

        if (selectedMinistry === '國防部') {
            const statsMND = calculateAgencyStats('國防部');
            const statsSub = calculateAgencyStats('國防部所屬');
            totalBudget = statsMND.totalBudget + statsSub.totalBudget;
            totalCut = statsMND.totalCut + statsSub.totalCut;
            totalFreeze = statsMND.totalFreeze + statsSub.totalFreeze;
        } else {
            ministryProjects.forEach(p => { totalBudget += parseMoney(p['預算金額']); });

            // 找出該部會的機關清單，再從B表加總
            const agenciesInMinistry = [...new Set(ministryProjects.map(p => p['主管機關']))];
            allDataPageB.forEach(r => {
                if (agenciesInMinistry.includes(r['主管機關'])) {
                    totalCut += parseMoney(r['刪減金額']);
                    totalFreeze += parseMoney(r['凍結金額']);
                }
            });
        }

    } else {
        // [情境 1] 兩個都沒選 (預設狀態) -> 加總全部
        titleText = "中央政府總預算案 (全體)";

        // 預算總額 (A表) + 國防部機密預算補正
        let rawTotalA = 0;
        allDataPageA.forEach(p => rawTotalA += parseMoney(p['預算金額']));

        const mndExisting = allDataPageA.filter(p => {
            const id = String(p['計畫編號']).trim();
            return id.startsWith('0901') || id.startsWith('0902');
        }).reduce((sum, p) => sum + parseMoney(p['預算金額']), 0);

        const mndTarget = 1750857000 + 559611869000;
        const diff = mndTarget - mndExisting;

        totalBudget = rawTotalA + (diff > 0 ? diff : 0);

        // 刪減凍結總額 (B表)
        allDataPageB.forEach(r => {
            totalCut += parseMoney(r['刪減金額']);
            totalFreeze += parseMoney(r['凍結金額']);
        });
    }

    // --- 繪圖數據準備 ---
    const totalPass = totalBudget - totalCut - totalFreeze;
    // 避免分母為0
    const pctPass = (totalBudget > 0) ? (totalPass / totalBudget * 100).toFixed(1) : 0;
    const pctCut = (totalBudget > 0) ? (totalCut / totalBudget * 100).toFixed(1) : 0;
    const pctFreeze = (totalBudget > 0) ? (totalFreeze / totalBudget * 100).toFixed(1) : 0;

    // 更新文字說明
    captionEl.innerHTML = `
        <span style="color:#315493; font-weight:bold;">${titleText}</span> 總預算：${formatCurrency(totalBudget)}<br>
        通過：<b>${pctPass}%</b> | 
        <span style="color:#c63f3f">刪減：<b>${pctCut}%</b> (${formatCurrency(totalCut)})</span> | 
        <span style="color:#F0C808">凍結：<b>${pctFreeze}%</b> (${formatCurrency(totalFreeze)})</span>
    `;

    // 繪製圖表
    const ctx = document.querySelector(".js-chartBudgetPageReview").getContext('2d');
    if (chartBudgetPageReview) chartBudgetPageReview.destroy();

    chartBudgetPageReview = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['審查結果'],
            datasets: [
                { label: '通過', data: [totalPass], backgroundColor: '#315493', barThickness: 50 },
                { label: '凍結', data: [totalFreeze], backgroundColor: '#F0C808', barThickness: 50 },
                { label: '刪減', data: [totalCut], backgroundColor: '#c63f3f', barThickness: 50 }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, display: false, max: totalBudget },
                y: { stacked: true, display: false }
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipCurrencyCallback
            }
        }
    });
}
// --- 2. Helper Functions ---
function parseMoney(str) {
    if (!str) return 0;
    let s = str + '';
    let val = parseFloat(s.replace(/,/g, '').replace(/[^0-9.-]/g, ''));
    if (isNaN(val)) return 0;
    if (s.includes('億')) return val * 100000000;
    else if (s.includes('萬')) return val * 10000;
    else return val * 1000;
}
function formatCurrency(num) {
    let val = parseFloat(num);
    if (isNaN(val) || val === 0) return "0";
    let absVal = Math.abs(val);
    if (absVal >= 1000000000000) return (val / 1000000000000).toFixed(1).replace(/\.0$/, '') + "兆";
    else if (absVal >= 100000000) return (val / 100000000).toFixed(1).replace(/\.0$/, '') + "億";
    else if (absVal >= 10000) return (val / 10000).toFixed(1).replace(/\.0$/, '') + "萬";
    else return val.toLocaleString() + "元";
}
function getColorByType(type) {
    for (const key in categoryColorMap) {
        if (type && type.includes(key)) return categoryColorMap[key];
    }
    return categoryColorMap['其他'];
}
const tooltipCurrencyCallback = {
    callbacks: {
        label: function (context) {
            let label = context.dataset.label || '';
            if (label) { label += ': '; }
            let value = context.raw;
            if (value !== null && value !== undefined) { label += formatCurrency(value); }
            return label;
        }
    }
};

// --- 3. Chart & Render Functions ---

// [v163] Completely Overhauled for Interactive Branch Plans
// [v171] 修正分支計畫分隔符號為 #，避免與文字內容冒號衝突
function renderDetailChartsA(row) {
    // 1. Pie Chart (用途比例) - 維持使用冒號 : 分隔
    let pieLabels = [], pieData = [];
    let usageString = row['用途比例'] || '';
    if (usageString && usageString.includes(':')) {
        usageString.split('|').forEach(item => {
            let parts = item.split(':');
            if (parts.length === 2) {
                pieLabels.push(parts[0].trim());
                pieData.push(parseInt(parts[1].trim()));
            }
        })
    }
    const ctxPie = document.querySelector(".js-chartDetailPie").getContext('2d');
    if (chartPieA) chartPieA.destroy();
    chartPieA = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: pieLabels,
            datasets: [{
                data: pieData,
                backgroundColor: ['#c63f3f', '#F0C808', '#315493', '#5591bf', '#97b1de']
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipCurrencyCallback
            }
        }
    });

    // 2. Branch Plans (分支計畫) - [修改] 改用 # 分隔
    const btnContainer = document.querySelector(".js-branch-btn-container");
    const detailDisplay = document.querySelector(".js-branch-detail-display");
    const noDataMsg = document.querySelector(".js-branch-no-data");
    const totalProjectBudget = parseMoney(row['預算金額']);

    btnContainer.innerHTML = ''; // 清空舊按鈕

    let branchString = row['分支計畫'] || '';
    let branches = [];

    if (branchString && (branchString.includes('#') || branchString.includes(':'))) {
        branchString.split('|').forEach(item => {
            // [修改] 優先支援 # 分隔 (新格式)，但也保留對 : 的兼容性 (若未更新資料庫)
            let separator = item.includes('#') ? '#' : ':';
            let parts = item.split(separator);

            if (parts.length >= 2) {
                // 處理說明文字中可能包含分隔符號的情況
                // 名稱 = parts[0], 金額 = parts[1], 說明 = 剩下的全部接起來
                let descText = parts.length > 2 ? parts.slice(2).join(separator).trim() : '無詳細說明';

                branches.push({
                    name: parts[0].trim(),
                    amount: parseMoney(parts[1].trim()),
                    desc: descText
                });
            }
        });
    }

    if (branches.length === 0) {
        detailDisplay.style.display = 'none';
        noDataMsg.style.display = 'block';
        return;
    }

    noDataMsg.style.display = 'none';
    detailDisplay.style.display = 'block';

    // 生成按鈕
    branches.forEach((branch, index) => {
        const btn = document.createElement('button');
        btn.className = 'branch-tag';
        btn.innerText = branch.name;
        btn.onclick = () => showBranchDetail(index, branch, totalProjectBudget, branches);
        btnContainer.appendChild(btn);
    });

    // 初始化顯示第一個分支
    showBranchDetail(0, branches[0], totalProjectBudget, branches);
}

// [v163] New Helper Function for Branch Switching
function showBranchDetail(index, branch, total, allBranches) {
    // Update Active Button
    const btns = document.querySelector(".js-branch-btn-container").children;
    for (let btn of btns) btn.classList.remove('active');
    if (btns[index]) btns[index].classList.add('active');

    // Update Description
    document.querySelector(".js-b-desc-text").innerText = branch.desc;
    document.querySelector(".js-b-desc-container").classList.remove('expanded');
    document.querySelector(".js-b-toggle-btn").innerText = '展開說明';

    // Render Ratio Bar Chart
    const ctx = document.querySelector(".js-chartBranchRatio").getContext('2d');
    if (chartBranchRatio) chartBranchRatio.destroy();

    const restAmount = total - branch.amount;
    const ratio = (total > 0) ? (branch.amount / total * 100).toFixed(1) : 0;

    chartBranchRatio = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['預算比例'],
            datasets: [
                { label: branch.name, data: [branch.amount], backgroundColor: '#315493', barPercentage: 0.6 },
                { label: '其他計畫', data: [restAmount], backgroundColor: '#f4f6f8', barPercentage: 0.6 }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true, display: false }, y: { stacked: true, display: false } },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipCurrencyCallback,
                title: { display: true, text: `該分支佔總計畫 ${ratio}%` }
            }
        }
    });
}

// [v163] Toggle function for Branch Description
function toggleBranchDesc() {
    const container = document.querySelector(".js-b-desc-container");
    const btn = document.querySelector(".js-b-toggle-btn");
    if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        btn.innerText = '展開說明';
    } else {
        container.classList.add('expanded');
        btn.innerText = '收合說明';
    }
}

function renderDetailChartsB(row) {
    const total = parseMoney(row['預算金額']);
    const cut = parseMoney(row['刪減金額']);
    const freeze = parseMoney(row['凍結金額']);
    const pass = total - cut - freeze;

    const ctx1 = document.querySelector(".js-chartBResult").getContext('2d');
    if (chartB1) chartB1.destroy();
    chartB1 = new Chart(ctx1, { type: 'bar', data: { labels: ['結果'], datasets: [{ label: '通過', data: [pass], backgroundColor: '#315493' }, { label: '凍結', data: [freeze], backgroundColor: '#F0C808' }, { label: '刪減', data: [cut], backgroundColor: '#c63f3f' }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, display: false }, y: { stacked: true, display: false } }, plugins: { tooltip: tooltipCurrencyCallback } } });

    const cCut = parseMoney(row['委員會刪減']);
    const cFreeze = parseMoney(row['委員會凍結']);
    const nCut = parseMoney(row['院會表決刪減'] || row['協商刪減']);
    const nFreeze = parseMoney(row['院會表決凍結'] || row['協商凍結']);
    const fCut = parseMoney(row['通案刪減'] || row['院會刪減']);
    const fFreeze = parseMoney(row['通案凍結'] || row['院會凍結']);

    const ctx2 = document.querySelector(".js-chartBStages").getContext('2d');
    if (chartB2) chartB2.destroy();
    chartB2 = new Chart(ctx2, {
        type: 'bar', data: {
            labels: ['委員會', '院會表決', '通案'],
            datasets: [{ label: '刪減', data: [cCut, nCut, fCut], backgroundColor: '#c63f3f' }, { label: '凍結', data: [cFreeze, nFreeze, fFreeze], backgroundColor: '#F0C808' }]
        }, options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: tooltipCurrencyCallback } }
    });
}

function renderMainCharts() {
    if (mainChartsRendered) return;
    new Chart(document.querySelector(".js-chartYearly").getContext('2d'), { type: 'bar', data: { labels: ['115年度', '114年度', '113年度', '112年度', '111年度', '110年度', '109年度', '108年度', '107年度', '106年度'], datasets: [{ label: '歲出總額', data: [3034974371000, 3132468909000, 2881782095000, 2719098790000, 2262064189000, 2161517070000, 2102196982000, 2022029637000, 1991773071000, 1997995520000], backgroundColor: '#315493' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: tooltipCurrencyCallback }, scales: { y: { ticks: { callback: function (value) { return formatCurrency(value); } } } } } });

    const budgetDetails = [
        { label: '社會福利', value: 831800000000, color: 'rgba(231, 76, 60, 0.5)', arrow: '▲', display: '8318億' },
        { label: '教育科學文化', value: 556600000000, color: 'rgba(240, 200, 8, 0.5)', arrow: '▼', display: '5566億' },
        { label: '國防', value: 548800000000, color: 'rgba(8, 103, 136, 0.5)', arrow: '▲', display: '5488億' },
        { label: '經濟發展', value: 427500000000, color: 'rgba(46, 204, 113, 0.5)', arrow: '▲', display: '4275億' },
        { label: '一般政務', value: 302600000000, color: 'rgba(155, 89, 182, 0.5)', arrow: '▲', display: '3026億' },
        { label: '退休撫卹', value: 184400000000, color: 'rgba(52, 152, 219, 0.5)', arrow: '▲', display: '1844億' },
        { label: '債務還本付息', value: 106300000000, color: 'rgba(230, 126, 34, 0.5)', arrow: '–', display: '1063億' },
        { label: '補助及其他', value: 50400000000, color: 'rgba(26, 188, 156, 0.5)', arrow: '▼', display: '504億' },
        { label: '社區發展及環境保護', value: 26600000000, color: 'rgba(52, 73, 94, 0.5)', arrow: '▼', display: '266億' }
    ];

    const ctx = document.querySelector(".js-chartAllocation").getContext('2d');
    const totalBudget = budgetDetails.reduce((acc, curr) => acc + curr.value, 0);

    chartAllocationInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['115年度預算結構'], datasets: budgetDetails.map(d => ({ label: d.label, data: [d.value], backgroundColor: d.color, barPercentage: 1.0, categoryPercentage: 1.0 })) },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, display: false, min: 0, max: totalBudget }, y: { stacked: true, display: false } }, plugins: { legend: { display: false }, tooltip: { enabled: false } }, layout: { padding: 0 } }
    });

    const legendContainer = document.querySelector(".js-chartAllocationLegend");
    if (legendContainer) {
        let legendHtml = '';
        budgetDetails.forEach((ds, index) => {
            let color = ds.color.replace('0.5', '1');
            legendHtml += `<div class="legend-item" onclick="updateBillOverlay(${index}, '${ds.label}', '${ds.display}', '${ds.arrow}')"><div class="legend-color-box" style="background-color:${color}; border:none;"></div><span>${ds.label}</span></div>`;
        });
        legendContainer.innerHTML = legendHtml;
    }

    window.updateBillOverlay = function (index, label, display, arrow) {
        const infoOverlay = document.querySelector(".js-bill-info-overlay");
        const arrowLine = document.querySelector(".js-dynamic-arrow");
        infoOverlay.innerHTML = `<p class="bill-info-text">${label} ${display} (${arrow})</p>`;
        document.querySelectorAll('.legend-item').forEach((el, i) => { if (i === index) el.classList.add('active'); else el.classList.remove('active'); });

        if (!chartAllocationInstance) return;

        const meta = chartAllocationInstance.getDatasetMeta(index);
        const bar = meta.data[0];

        if (bar) {
            const containerRect = document.querySelector('.bill-container').getBoundingClientRect();
            const canvasRect = chartAllocationInstance.canvas.getBoundingClientRect();

            const startX_CSS = containerRect.width / 2;
            const startY_CSS = containerRect.height - 5;

            const scaleX_ChartToCSS = canvasRect.width / chartAllocationInstance.width;
            const scaleY_ChartToCSS = canvasRect.height / chartAllocationInstance.height;

            const barCenterX_Internal = (bar.x + bar.base) / 2;
            const barCenterY_Internal = bar.y;

            const targetX_CSS = (canvasRect.left - containerRect.left) + (barCenterX_Internal * scaleX_ChartToCSS);
            const targetY_CSS = (canvasRect.top - containerRect.top) + (barCenterY_Internal * scaleY_ChartToCSS);

            const pathData = `M ${startX_CSS} ${startY_CSS} L ${targetX_CSS} ${targetY_CSS}`;
            arrowLine.setAttribute('d', pathData);
            arrowLine.style.opacity = '1';
        }
    };
    mainChartsRendered = true;
}

// [v175 新增] 首頁總預算圖表 (邏輯同步工作分頁：A表算總額+國防校正、B表算刪凍)
function computeCutFreezeStatsFromPageB(rows) {
    const data = Array.isArray(rows) ? rows : [];

    let cutCount = 0;
    let cutTotal = 0;
    let freezeCount = 0;
    let freezeTotal = 0;

    data.forEach((row) => {
        const type = String(row['資料類型'] || '計畫').trim();
        if (type !== '計畫') return;

        const planId = String(row['計畫編號'] || '').trim();
        const planName = String(row['計畫名稱'] || '').trim();
        if (planId.includes('000000')) return;
        if (planName.includes('統刪')) return;

        const cutMoney = parseMoney(row['刪減金額']);
        const freezeMoney = parseMoney(row['凍結金額']);

        const committeeCut = parseMoney(row['委員會刪減']);
        const committeeFreeze = parseMoney(row['委員會凍結']);
        const floorCut = parseMoney(row['院會表決刪減'] || row['協商刪減']);
        const floorFreeze = parseMoney(row['院會表決凍結'] || row['協商凍結']);
        const generalCut = parseMoney(row['通案刪減'] || row['院會刪減']);
        const generalFreeze = parseMoney(row['通案凍結'] || row['院會凍結']);

        const cutDetailSum = committeeCut + floorCut + generalCut;
        const freezeDetailSum = committeeFreeze + floorFreeze + generalFreeze;

        const isCutCase = (cutMoney > 0) || (cutDetailSum > 0);
        const isFreezeCase = (freezeMoney > 0) || (freezeDetailSum > 0);

        if (isCutCase) {
            cutCount += 1;
            cutTotal += (cutMoney > 0 ? cutMoney : cutDetailSum);
        }
        if (isFreezeCase) {
            freezeCount += 1;
            freezeTotal += (freezeMoney > 0 ? freezeMoney : freezeDetailSum);
        }
    });

    return { cutCount, cutTotal, freezeCount, freezeTotal };
}

function initScrollToTriggers() {
    document.querySelectorAll('.js-scroll-to').forEach((el) => {
        if (el.__scrollToBound) return;
        el.__scrollToBound = true;
        // Make non-button elements keyboard-accessible
        if (el.tagName !== 'BUTTON' && el.tagName !== 'A') {
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
            if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
        }

        const run = () => {
            const target = (el.getAttribute('data-target') || '').trim();
            if (!target) return;
            if (target.startsWith('http://') || target.startsWith('https://')) {
                window.open(target, '_blank');
                return;
            }
            if (target === 'page-budget' || target === 'page-legislator' || target === 'home') {
                showPage(target);
                return;
            }
            scrollToSection(target);
        };

        const maybeSetActive = () => {
            if (!el.classList.contains('nav-wheel__item')) return;
            document.querySelectorAll('.nav-wheel__item').forEach((n) => n.classList.remove('is-active'));
            el.classList.add('is-active');
            updateNavWheelIndicator();
        };

        el.addEventListener('click', () => {
            maybeSetActive();
            run();
        });
        el.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            maybeSetActive();
            run();
        });

        // Hover 時讓指示條跟著滑鼠所在的 nav-wheel 項目
        if (el.classList.contains('nav-wheel__item')) {
            el.addEventListener('mouseenter', () => {
                updateNavWheelIndicator(el);
            });
            el.addEventListener('mouseleave', () => {
                updateNavWheelIndicator();
            });
        }
    });
}

function updateNavWheelIndicator(targetEl) {
    const indicator = document.querySelector('.nav-wheel__indicator');
    const list = document.querySelector('.nav-wheel__list');
    if (!indicator || !list) return;
    const base = targetEl || list.querySelector('.nav-wheel__item.is-active') || list.querySelector('.nav-wheel__item');
    if (!base) return;

    const activeRect = base.getBoundingClientRect();
    const bodyRect = indicator.parentElement?.getBoundingClientRect();
    if (!bodyRect) return;

    const indicatorHeight = Math.min(46, Math.max(28, activeRect.height));
    const top = Math.max(0, (activeRect.top - bodyRect.top) + (activeRect.height - indicatorHeight) / 2);

    indicator.style.height = `${indicatorHeight}px`;
    indicator.style.setProperty('--nav-wheel-indicator-y', `${top}px`);
}

function renderHomeCutFreezeCards() {
    const stats = computeCutFreezeStatsFromPageB(allDataPageB);

    const cutCountEls = document.querySelectorAll(".js-summary-cut-count");
    const freezeCountEls = document.querySelectorAll(".js-summary-freeze-count");
    cutCountEls.forEach((el) => { el.textContent = String(stats.cutCount); });
    freezeCountEls.forEach((el) => { el.textContent = String(stats.freezeCount); });

    const cutAmountEls = document.querySelectorAll(".js-summary-cut-amount");
    const freezeAmountEls = document.querySelectorAll(".js-summary-freeze-amount");

    // For hero summary cards (amount-only), show "X 件 / NT$ Y"
    const cutCombined = `${stats.cutCount} 件 / NT$ ${formatCurrency(stats.cutTotal)}`;
    const freezeCombined = `${stats.freezeCount} 件 / NT$ ${formatCurrency(stats.freezeTotal)}`;

    cutAmountEls.forEach((el) => {
        if (cutCountEls.length === 0) el.textContent = cutCombined;
        else if (el.closest('.summary-card')) el.textContent = cutCombined;
        else el.textContent = formatCurrency(stats.cutTotal);
    });
    freezeAmountEls.forEach((el) => {
        if (freezeCountEls.length === 0) el.textContent = freezeCombined;
        else if (el.closest('.summary-card')) el.textContent = freezeCombined;
        else el.textContent = formatCurrency(stats.freezeTotal);
    });

    const cutNoteEls = document.querySelectorAll(".js-summary-cut-note");
    const freezeNoteEls = document.querySelectorAll(".js-summary-freeze-note");
    const showCutNote = (stats.cutCount === 0 && stats.cutTotal === 0);
    const showFreezeNote = (stats.freezeCount === 0 && stats.freezeTotal === 0);
    cutNoteEls.forEach((el) => { el.hidden = !showCutNote; });
    freezeNoteEls.forEach((el) => { el.hidden = !showFreezeNote; });
}

function renderHomeStatusChart() {
    // 1. 計算總預算 (來源 Page A + 國防部強制校正)
    let rawTotalA = 0;
    // 計算目前資料庫中 0901 和 0902 的總額
    let mndExisting = 0;

    allDataPageA.forEach(p => {
        const amt = parseMoney(p['預算金額']);
        rawTotalA += amt;

        const id = String(p['計畫編號'] || '').trim();
        if (id.startsWith('0901') || id.startsWith('0902')) {
            mndExisting += amt;
        }
    });

    // 國防部正確總額 (本部 17.5億 + 所屬 5596億)
    const mndTarget = 1750857000 + 559611869000;
    const diff = mndTarget - mndExisting;

    // 最終總預算 (A表總和 + 補上國防部差額)
    const totalBudget = rawTotalA + (diff > 0 ? diff : 0);

    // 2. 計算刪減與凍結 (來源 Page B)
    let totalCut = 0;
    let totalFreeze = 0;

    allDataPageB.forEach(r => {
        totalCut += parseMoney(r['刪減金額']);
        totalFreeze += parseMoney(r['凍結金額']);
    });

    // 3. 計算通過金額
    const totalPass = totalBudget - totalCut - totalFreeze;

    // 4. 繪製圖表
    const ctxStatus = document.querySelector(".js-chartStatusB");
    if (ctxStatus) {
        if (chartStatusInstance) { chartStatusInstance.destroy(); }

        chartStatusInstance = new Chart(ctxStatus.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['總體審查結果'],
                datasets: [
                    { label: '通過', data: [totalPass], backgroundColor: '#315493', barThickness: 40 },
                    { label: '凍結', data: [totalFreeze], backgroundColor: '#F0C808', barThickness: 40 },
                    { label: '刪減', data: [totalCut], backgroundColor: '#c63f3f', barThickness: 40 }
                ]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, display: false, max: totalBudget }, // 設定 max 確保比例正確
                    y: { stacked: true, display: false }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: tooltipCurrencyCallback
                }
            }
        });
    }
}
// --- 4. UI & Data Functions ---
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);

    const navBtns = document.querySelectorAll('.js-nav-home, .js-nav-budget, .js-nav-legislator');
    navBtns.forEach(b => {
        b.classList.remove('nav-active');
        b.removeAttribute('aria-current');
    });

    if (pageId === 'home') {
        document.querySelectorAll(".js-nav-home").forEach(b => { b.classList.add('nav-active'); b.setAttribute('aria-current', 'page'); });
    }
    if (pageId === 'page-budget') {
        document.querySelectorAll(".js-nav-budget").forEach(b => { b.classList.add('nav-active'); b.setAttribute('aria-current', 'page'); });
    }
    if (pageId === 'page-legislator') {
        document.querySelectorAll(".js-nav-legislator").forEach(b => { b.classList.add('nav-active'); b.setAttribute('aria-current', 'page'); });
    }

    if (pageId === 'page-legislator' && allDataPageC.length === 0 && !isDemoMode) fetchData('page-c');
    if (window.NavigationState) window.NavigationState.savePage(pageId);
}

// SPEC v1: 錨點捲動（先切回首頁再捲動）
function scrollToSection(sectionId) {
    const resolvedId = window.NavigationState ? window.NavigationState.resolveSectionId(sectionId) : sectionId;
    const el = document.getElementById(resolvedId);
    if (!el) return;

    const hostPage = el.closest('.page-section');
    if (hostPage && !hostPage.classList.contains('active')) {
        showPage(hostPage.id);
    }

    setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// SPEC v1: Nav 搜尋框（帶入關鍵字並捲動至首頁搜尋區）
function handleNavSearch(val) {
    const homeInput = document.querySelector(".js-search-home-input");
    if (homeInput) { homeInput.value = val; handleSearchBudget(val); }
    scrollToSection('section-plan-search-home');
}

// SPEC v1: 側欄點擊（外連 / 切頁 / 錨點）
function initSidebarNav() {
    const list = document.querySelector(".js-sidebar-nav-list");
    if (!list) return;
    list.addEventListener('click', function (e) {
        const a = e.target.closest('a[data-action]');
        if (!a) return;
        e.preventDefault();
        const action = a.getAttribute('data-action');
        if (action === 'external') {
            window.open(a.getAttribute('data-href'), '_blank');
            return;
        }
        if (action === 'page') {
            showPage(a.getAttribute('data-page'));
            return;
        }
        if (action === 'anchor') {
            const id = a.getAttribute('href').replace('#', '');
            scrollToSection(id);
        }
    });
}

// SPEC v1: 浮動回到頁首
function initFloatBackTop() {
    const btn = document.querySelector(".js-float-back-top");
    if (!btn) return;
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// SPEC v1: Nav 選單展開（手機）
function initNavToggle() {
    const toggle = document.querySelector(".js-nav-toggle");
    const menu = document.querySelector(".js-nav-menu");
    if (toggle && menu) toggle.addEventListener('click', () => menu.classList.toggle('is-open'));
}

function switchTab(tabName) {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (tabName === 'plan') {
        document.querySelector('.modal-tab:first-child').classList.add('active');
        document.querySelector(".js-tab-content-plan").classList.add('active');
    } else {
        document.querySelector('.modal-tab:last-child').classList.add('active');
        document.querySelector(".js-tab-content-review").classList.add('active');
    }
    setTimeout(() => {
        const modalBody = document.querySelector('#unifiedModal .modal-body-area');
        if (modalBody) modalBody.scrollTop = 0;
    }, 0);
}

function toggleDesc() {
    const container = document.querySelector(".js-u-desc-container");
    const btn = document.querySelector(".js-toggle-desc-btn");
    if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        btn.innerText = '展開閱讀全文';
    } else {
        container.classList.add('expanded');
        btn.innerText = '收合內容';
    }
}

function closeModal(e, modalId) {
    if (e && e.target !== e.currentTarget && e.target.className !== 'close-btn') return;
    if (window.ModalRenderers && typeof window.ModalRenderers.hideModal === 'function') {
        window.ModalRenderers.hideModal(modalId);
        return;
    }
    document.getElementById(modalId).style.display = 'none';
}

async function jumpToProjectB(projectId) {
    const loader = document.querySelector(".js-loader"); loader.style.display = 'flex';
    closeModal(null, 'detailModalC'); showPage('page-budget');
    if (allDataPageA.length === 0) await fetchData('page-a', true);
    if (allDataPageB.length === 0) await fetchData('page-b', true);
    const targetId = String(projectId).trim(); openUnifiedDetail(targetId); switchTab('review');
    loader.style.display = 'none';
}

async function jumpToC(name) {
    const loader = document.querySelector(".js-loader"); loader.style.display = 'flex';
    closeModal(null, 'unifiedModal');
    if (allDataPageC.length === 0) { try { await fetchData('page-c'); } catch (e) { loader.style.display = 'none'; return; } }
    const targetName = String(name).trim();
    const target = allDataPageC.find(r => String(r['委員姓名']).trim() === targetName);
    loader.style.display = 'none';
    if (target) { const str = encodeURIComponent(JSON.stringify(target)); openDetailC(str); }
    else { alert(`查無此委員資料 (${targetName})`); }
}

// [v162] Restored openDetailC Function + Update button logic to includes('000000')
// [v166/167 新增功能] 支援時間戳記與進度日期
// [v170] 立委詳情函式：含時間戳記 + 日期格式化 (YYYY/MM/DD)
// [v171] 支援雙表格獨立時間戳記 (右下角顯示)
function openDetailC(jsonStr) {
    const data = JSON.parse(decodeURIComponent(jsonStr));

    // 1. 設定基本資料
    document.querySelector(".js-mc-name").innerText = data['委員姓名'] || '-';

    const party = data['黨籍'] || '無黨籍';
    const partyEl = document.querySelector(".js-mc-party");
    partyEl.innerText = party;

    let partyClass = 'tag-other';
    if (party.includes('民進')) partyClass = 'tag-dpp';
    else if (party.includes('國民')) partyClass = 'tag-kmt';
    else if (party.includes('民眾')) partyClass = 'tag-tpp';

    partyEl.className = `leg-party-tag ${partyClass}`;

    // 2. [修改] 處理兩個不同的更新時間

    // Helper: 日期格式化函式
    const formatUpdateDate = (dateStr) => {
        if (!dateStr) return '無更新紀錄';
        if (typeof dateStr === 'number' && !Number.isNaN(dateStr)) {
            const d = new Date(dateStr);
            if (!Number.isNaN(d.getTime())) {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}/${m}/${day}`;
            }
        }

        let str = dateStr.toString();
        if (/^\d{12,14}$/.test(str)) {
            const n = parseInt(str, 10);
            if (!Number.isNaN(n)) return formatUpdateDate(n);
        }
        if (str.startsWith('Date')) {
            const dParts = str.match(/\d+/g);
            if (dParts && dParts.length >= 3) {
                const y = parseInt(dParts[0]);
                const m = parseInt(dParts[1]) + 1;
                const d = parseInt(dParts[2]);
                const mm = m < 10 ? '0' + m : m;
                const dd = d < 10 ? '0' + d : d;
                return `${y}/${mm}/${dd}`;
            }
        }
        return str;
    };

    // 讀取並填入「刪減案」更新時間
    const cutTime = formatUpdateDate(data['刪減案更新時間']); // 需確認資料庫欄位名稱
    const cutEl = document.querySelector(".js-mc-updated-cut");
    if (cutEl) cutEl.innerText = `資料更新時間：${cutTime}`;

    // 讀取並填入「凍結案」更新時間
    const freezeTime = formatUpdateDate(data['凍結案更新時間']); // 需確認資料庫欄位名稱
    const freezeEl = document.querySelector(".js-mc-updated-freeze");
    if (freezeEl) freezeEl.innerText = `資料更新時間：${freezeTime}`;


    // 3. 設定頭像 (不變)
    const avatarEl = document.querySelector(".js-mc-avatar");
    avatarEl.innerHTML = '';
    const imgPath = getLegislatorPhotoSrc(data['委員姓名'], party);

    const iconSpan = document.createElement('span');
    iconSpan.className = 'default-icon';
    iconSpan.style.zIndex = '1';
    iconSpan.innerText = '🧑‍💼';

    const imgEl = document.createElement('img');
    if (imgPath) imgEl.src = imgPath;
    imgEl.style.position = 'absolute';
    imgEl.style.top = '0'; imgEl.style.left = '0';
    imgEl.style.width = '100%'; imgEl.style.height = '100%';
    imgEl.style.objectFit = 'cover'; imgEl.style.objectPosition = 'center 25%';
    imgEl.style.display = 'none';

    imgEl.onload = function () { this.style.display = 'block'; iconSpan.style.display = 'none'; };
    imgEl.onerror = function () { this.style.display = 'none'; };

    avatarEl.appendChild(iconSpan);
    avatarEl.appendChild(imgEl);

    // 4. 生成提案表格 (含日期欄位與格式化) (不變)
    const details = data['提案明細'] || '';
    const cutsTbody = document.querySelector(".js-table-cut-c");
    const freezesTbody = document.querySelector(".js-table-freeze-c");
    cutsTbody.innerHTML = ''; freezesTbody.innerHTML = '';

    const noDataHtml = '<tr><td colspan="6" style="text-align:center; color:#999;">無資料</td></tr>';

    if (!details) {
        cutsTbody.innerHTML = noDataHtml;
        freezesTbody.innerHTML = noDataHtml;
    } else {
        details.split('|').forEach(item => {
            const parts = item.split('#');
            if (parts.length >= 8) {
                const projectId = parts[5] ? parts[5].trim() : '';
                const isAgencyLevel = projectId.includes('000000') || parts[1].includes('統刪');
                const btnHtml = (projectId && !isAgencyLevel) ? `<br><button class="jump-btn" onclick="jumpToProjectB('${projectId}')">查看計畫</button>` : '';

                const manualResult = parts[6] ? parts[6].trim() : '-';
                const dateRaw = parts[7] ? parts[7].trim() : '-';

                // 表格內的日期也套用同樣的格式化 (選用)
                let displayDate = formatUpdateDate(dateRaw);
                if (displayDate === '無更新紀錄') displayDate = '-';

                let resultText = `<span style="font-weight:bold; color:var(--primary-color);">${manualResult}</span>`;

                const rowHtml = `<tr>
                            <td style="font-size:0.85rem; color:#666; font-weight:bold; white-space:nowrap;">${displayDate}</td>
                            <td>${parts[1]}${btnHtml}</td>
                            <td>${parts[2]}</td>
                            <td>${parts[3]}</td>
                            <td>${parts[4]}</td>
                            <td>${resultText}</td>
                        </tr>`;

                if (parts[0].includes('刪減')) cutsTbody.innerHTML += rowHtml;
                else freezesTbody.innerHTML += rowHtml;
            }
            // Fallback (舊格式)
            else if (parts.length === 7) {
                const projectId = parts[5] ? parts[5].trim() : '';
                const isAgencyLevel = projectId.includes('000000') || parts[1].includes('統刪');
                const btnHtml = (projectId && !isAgencyLevel) ? `<br><button class="jump-btn" onclick="jumpToProjectB('${projectId}')">查看計畫</button>` : '';
                const manualResult = parts[6] ? parts[6].trim() : '-';
                let resultText = `<span style="font-weight:bold; color:var(--primary-color);">${manualResult}</span>`;

                const rowHtml = `<tr>
                            <td>-</td>
                            <td>${parts[1]}${btnHtml}</td>
                            <td>${parts[2]}</td>
                            <td>${parts[3]}</td>
                            <td>${parts[4]}</td>
                            <td>${resultText}</td>
                        </tr>`;
                if (parts[0].includes('刪減')) cutsTbody.innerHTML += rowHtml;
                else freezesTbody.innerHTML += rowHtml;
            }
        });
    }

    if (cutsTbody.innerHTML === '') cutsTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999">無刪減提案</td></tr>';
    if (freezesTbody.innerHTML === '') freezesTbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999">無凍結提案</td></tr>';

    if (window.ModalRenderers && typeof window.ModalRenderers.showModal === 'function') {
        window.ModalRenderers.showModal('detailModalC');
    } else {
        document.querySelector(".js-detailModalC").style.display = 'flex';
    }
}

// --- 5. Data Processing Logic (ALL functions here) ---
function parseUsageString(usageStr) {
    let breakdown = { '人事費': 0, '業務費': 0, '設備及投資': 0, '獎補助費': 0, '債務費': 0, '預備金': 0 };
    if (!usageStr) return breakdown;
    usageStr.split('|').forEach(item => {
        const parts = item.split(':');
        if (parts.length === 2) {
            let key = parts[0].trim();
            let val = parseMoney(parts[1]);
            if (key.includes('人事')) breakdown['人事費'] += val;
            else if (key.includes('業務')) breakdown['業務費'] += val;
            else if (key.includes('設備') || key.includes('投資')) breakdown['設備及投資'] += val;
            else if (key.includes('補助') || key.includes('獎助')) breakdown['獎補助費'] += val;
            else if (key.includes('債務')) breakdown['債務費'] += val;
            else if (key.includes('預備')) breakdown['預備金'] += val;
        }
    });
    return breakdown;
}

// [v155] Fixed calculateAgencyStats to handle loose match
function calculateAgencyStats(agencyName) {
    // [v155 Fix] Separate 0901 and 0902 Logic
    let agencyProjects = [];
    let agencyTotalBudget = 0;
    let forceValue = 0;

    if (agencyName === '國防部' || (agencyName.includes('國防') && !agencyName.includes('所屬'))) {
        // 0901 Case
        agencyProjects = allDataPageA.filter(p => String(p['計畫編號']).trim().startsWith('0901'));
        agencyTotalBudget = agencyProjects.reduce((sum, p) => sum + parseMoney(p['預算金額']), 0);
        forceValue = 1750857000;
    } else if (agencyName.includes('國防部所屬') || (agencyName.includes('國防') && agencyName.includes('所屬'))) {
        // 0902 Case
        agencyProjects = allDataPageA.filter(p => String(p['計畫編號']).trim().startsWith('0902'));
        agencyTotalBudget = agencyProjects.reduce((sum, p) => sum + parseMoney(p['預算金額']), 0);
        forceValue = 559611869000;
    } else {
        // Normal Case
        agencyProjects = allDataPageA.filter(p => (p['主管機關'] || '').includes(agencyName));
        agencyTotalBudget = agencyProjects.reduce((sum, p) => sum + parseMoney(p['預算金額']), 0);
    }

    // Apply Force Value if incomplete
    if (forceValue > 0 && agencyTotalBudget < forceValue) {
        agencyTotalBudget = forceValue;
    }

    let agencyUsageTotal = { '人事費': 0, '業務費': 0, '設備及投資': 0, '獎補助費': 0, '債務費': 0, '預備金': 0 };
    agencyProjects.forEach(p => {
        const breakdown = parseUsageString(p['用途比例']);
        for (let k in agencyUsageTotal) {
            agencyUsageTotal[k] += breakdown[k];
        }
    });

    const agencyReviews = allDataPageB.filter(r => (r['主管機關'] || '').includes(agencyName));
    let totalCut = 0, totalFreeze = 0;
    agencyReviews.forEach(r => {
        totalCut += parseMoney(r['刪減金額']);
        totalFreeze += parseMoney(r['凍結金額']);
    });

    return {
        totalBudget: agencyTotalBudget,
        usageBreakdown: agencyUsageTotal,
        totalCut: totalCut,
        totalFreeze: totalFreeze
    };
}

// [v175 修改] 只負責計算排行榜，移除圖表繪製 (移至 renderHomeStatusChart)
function processPageBData(data) {
    let deptStats = {};
    allDataPageB_Plans = [];

    data.forEach(row => {
        const cut = parseMoney(row['刪減金額']);
        const freeze = parseMoney(row['凍結金額']);
        const dept = row['主管機關'] || '其他';
        const type = row['資料類型'] || '計畫';

        // 排行榜統計
        if (!deptStats[dept]) deptStats[dept] = { name: dept, cut: 0, freeze: 0 };
        deptStats[dept].cut += cut;
        deptStats[dept].freeze += freeze;

        // 收集計畫資料給排行榜用
        if (type === '計畫') {
            allDataPageB_Plans.push(row);
        }
    });

    // 渲染部會排行榜
    const deptArray = Object.values(deptStats);
    renderRankList('rank-dept-cut', [...deptArray].sort((a, b) => b.cut - a.cut).slice(0, 5), 'cut');
    renderRankList('rank-dept-freeze', [...deptArray].sort((a, b) => b.freeze - a.freeze).slice(0, 5), 'freeze');

    // 渲染計畫排行榜
    const planArray = allDataPageB_Plans.map(r => ({
        name: (r['主管機關'] ? r['主管機關'] + '/' : '') + r['計畫名稱'],
        cut: parseMoney(r['刪減金額']),
        freeze: parseMoney(r['凍結金額'])
    })).filter(r => r.name);

    renderRankList('rank-plan-cut', [...planArray].sort((a, b) => b.cut - a.cut).slice(0, 5), 'cut');
    renderRankList('rank-plan-freeze', [...planArray].sort((a, b) => b.freeze - a.freeze).slice(0, 5), 'freeze');
}

// [v142] Restored
function filterLegislators(party) {
    document.querySelectorAll('.filter-tag').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.party === party) btn.classList.add('active');
    });
    let filtered = [];
    if (party === 'all') { filtered = allDataPageC; }
    else { filtered = allDataPageC.filter(r => (r['黨籍'] || '').includes(party)); }
    renderLegislatorGrid(filtered);
}

// [v142] Restored
function initMinistrySection() {
    const ministrySelect = document.getElementById("filter-ministry");
    if (!ministrySelect) return;
    if (!allDataPageA || allDataPageA.length === 0) return;
    const ministries = [...new Set(allDataPageA.map(item => item['所屬部會']))].filter(m => m).sort();
    let html = '<option value="">請選擇所屬部會</option>';
    ministries.forEach(m => { html += `<option value="${m}">${m}</option>`; });
    ministrySelect.innerHTML = html;
}

// [v161] Restored: Ministry Section logic with MND 0902 force fix
function updateMinistryStats() {
    const ministrySelect = document.getElementById("filter-ministry");
    const unitSelect = document.getElementById("filter-unit");
    if (!ministrySelect || !unitSelect) return;
    const selectedMinistry = ministrySelect.value;

    if (selectedMinistry) {
        const agencies = [...new Set(allDataPageA
            .filter(d => d['所屬部會'] === selectedMinistry)
            .map(d => d['主管機關']))]
            .filter(a => a).sort();

        const lastMinistry = unitSelect.getAttribute('data-last-ministry');
        if (lastMinistry !== selectedMinistry) {
            let html = '<option value="">全部主管機關 (總計)</option>';
            agencies.forEach(a => { html += `<option value="${a}">${a}</option>`; });
            unitSelect.innerHTML = html;
            unitSelect.value = "";
            unitSelect.setAttribute('data-last-ministry', selectedMinistry);
        }
    } else {
        unitSelect.innerHTML = '<option value="">請選擇主管機關 (全部)</option>';
        unitSelect.value = "";
    }

    const selectedAgency = unitSelect.value;
    let currentData = [];

    // [v161] Special Handling for MND Subordinate (0902)
    if (selectedMinistry === '國防部' && selectedAgency === '國防部所屬') {
        currentData = allDataPageA.filter(d => String(d['計畫編號']).trim().startsWith('0902'));
    } else if (selectedMinistry) {
        if (selectedAgency) { currentData = allDataPageA.filter(d => d['主管機關'] === selectedAgency); }
        else { currentData = allDataPageA.filter(d => d['所屬部會'] === selectedMinistry); }
    } else {
        const valThisYear = document.querySelector(".js-val-this-year");
        const valLastYear = document.querySelector(".js-val-last-year");
        const valGrowth = document.querySelector(".js-val-growth");
        if (valThisYear) valThisYear.innerText = '-';
        if (valLastYear) valLastYear.innerText = '-';
        if (valGrowth) valGrowth.innerText = '-';
        if (chartMinistryBar) chartMinistryBar.destroy();
        if (chartMinistryPie) chartMinistryPie.destroy();
        return;
    }

    let totalThisYear = 0, totalLastYear = 0;
    let pieMap = {};

    currentData.forEach(d => {
        const thisYear = parseMoney(d['預算金額']);
        const lastYear = parseMoney(d['114年預算金額'] || 0);
        totalThisYear += thisYear;
        totalLastYear += lastYear;
        const category = d['政事別'] || '其他';
        pieMap[category] = (pieMap[category] || 0) + thisYear;
    });

    // [v161] Force Values for MND
    if (selectedMinistry === '國防部' && selectedAgency === '國防部所屬') {
        if (totalThisYear < 559611869000) totalThisYear = 559611869000;
    } else if (selectedMinistry === '國防部' && selectedAgency === '國防部') {
        if (totalThisYear < 1750857000) totalThisYear = 1750857000;
    }

    const pieLabels = Object.keys(pieMap);
    const pieData = Object.values(pieMap);
    const pieColors = pieLabels.map(label => getColorByType(label));

    let growth = 0;
    if (totalLastYear > 0) { growth = ((totalThisYear - totalLastYear) / totalLastYear) * 100; }

    const valThisYear = document.querySelector(".js-val-this-year");
    const valLastYear = document.querySelector(".js-val-last-year");
    const growthEl = document.querySelector(".js-val-growth");

    if (valThisYear) valThisYear.innerText = formatCurrency(totalThisYear);
    if (valLastYear) valLastYear.innerText = formatCurrency(totalLastYear);

    if (growthEl) {
        if (totalLastYear === 0) {
            growthEl.innerText = "無去年資料";
            growthEl.className = 'val js-val-growth';
        } else {
            growthEl.innerText = (growth > 0 ? '+' : '') + growth.toFixed(1) + '%';
            growthEl.className = 'val js-val-growth ' + (growth > 0 ? 'm-trend-up' : 'm-trend-down');
        }
    }

    const chartBarEl = document.querySelector(".js-chartMinistryBar");
    if (chartBarEl) {
        const ctxBar = chartBarEl.getContext('2d');
        if (chartMinistryBar) chartMinistryBar.destroy();
        chartMinistryBar = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['今年預算', '去年預算'],
                datasets: [{ label: '金額', data: [totalThisYear, totalLastYear], backgroundColor: ['#315493', '#d1d1d6'], barThickness: 40 }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: tooltipCurrencyCallback }, scales: { x: { ticks: { callback: function (value) { return formatCurrency(value); } } } } }
        });

        const ctxPie = document.querySelector(".js-chartMinistryPie").getContext('2d');
        if (chartMinistryPie) chartMinistryPie.destroy();
        chartMinistryPie = new Chart(ctxPie, {
            type: 'doughnut',
            data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: pieColors }] },
        });
    }
}

// --- 6. Render Functions ---

// [v142] Restored
function renderRankList(elementId, list, type) { const el = document.getElementById(elementId); if (!list || list.length === 0) { el.innerHTML = '<li style="color:#999;">無資料</li>'; return } let html = ''; list.slice(0, 5).forEach((item, index) => { let val = type === 'cut' ? item.cut : item.freeze; let valDisplay = formatCurrency(val); let colorClass = type === 'cut' ? 'color-cut' : 'color-freeze'; html += `<li><span><span class="rank-idx">${index + 1}</span> ${item.name}</span><span class="rank-val ${colorClass}">${valDisplay}</span></li>` }); el.innerHTML = html }

// [v142] Restored
function renderLegislatorGrid(data) {
    const container = document.querySelector(".js-leg-container-c");
    if (!data || data.length === 0) { container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">無資料</p>'; return; }

    let html = '';
    data.forEach(row => {
        const name = row['委員姓名'] || '未知委員';
        const party = row['黨籍'] || '無黨籍';
        const photoPath = getLegislatorPhotoSrc(name, party);
        const imgHtml = photoPath
            ? `<img src="${photoPath}" 
                             style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; object-position: center 25%; display:none;" 
                             onload="this.style.display='block'; this.previousElementSibling.style.display='none';"
                             onerror="this.style.display='none';">`
            : '';

        let partyClass = 'tag-other';
        if (party.includes('民進')) partyClass = 'tag-dpp';
        else if (party.includes('國民')) partyClass = 'tag-kmt';
        else if (party.includes('民眾')) partyClass = 'tag-tpp';

        // 編碼整行資料，傳給 openDetailC
        const rowStr = encodeURIComponent(JSON.stringify(row));

        html += `
                <div class="leg-card" onclick="openDetailC('${rowStr}')">
                    <div class="leg-avatar" id="avatar-${name}" style="position:relative; overflow:hidden;">
                        <span class="default-icon" style="z-index:1;">🧑‍💼</span>
                        ${imgHtml}
                    </div>
                    <div class="leg-name">${name}</div>
                    <span class="leg-party-tag ${partyClass}">${party}</span>
                    <div class="leg-stats-box">
                        <div class="stat-item"><span class="stat-val" style="color:var(--danger-color);">${row['刪減案數'] || 0}</span><span class="stat-label">刪減案</span></div>
                        <div class="stat-item"><span class="stat-val" style="color:var(--warning-color);">${row['凍結案數'] || 0}</span><span class="stat-label">凍結案</span></div>
                        <div class="stat-item"><span class="stat-val" style="color:var(--secondary-color);">${row['主決議數'] || 0}</span><span class="stat-label">主決議</span></div>
                    </div>
                </div>`;
    });
    container.innerHTML = html;
}

// [v153] Updated renderProposalTable
function renderProposalTable(data) {
    const container = document.querySelector(".js-proposal-table-body");
    if (!container) return;
    container.innerHTML = '';

    let proposalsStr = data['提案紀錄'] || '';
    if (!proposalsStr) {
        container.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">無提案紀錄</td></tr>';
        return;
    }

    let rows = '';
    proposalsStr.split('|').forEach(p => {
        let parts = p.split(':');
        if (parts.length >= 4) { // Expect 4 parts: Name:Type:Item:Reason
            const name = parts[0].trim();
            const type = parts[1].trim();
            const item = parts[2].trim();
            const reason = parts[3].trim();

            const linkHtml = `<span class="clickable-link" onclick="jumpToC('${name}')">${name}</span>`;

            rows += `<tr>
                        <td>${linkHtml}</td>
                        <td>${item}</td>
                        <td><span class="p-tag ${type.includes('刪') ? 'p-cut' : 'p-freeze'}">${type}</span></td>
                        <td>${reason}</td>
                    </tr>`;
        } else {
            // Fallback for old data or incorrect format
            rows += `<tr><td colspan="4">${p}</td></tr>`;
        }
    });
    container.innerHTML = rows;
}

// [v162] Fixed displayUnifiedBlocks to hide agency-level or 'general cut' items
function displayUnifiedBlocks(data, targetContainer) {
    const container = targetContainer || document.querySelector(".js-results-container-budget");

    const validData = data.filter(row => {
        const amt = parseMoney(row['預算金額']);
        const cut = parseMoney(row['刪減金額']);
        const freeze = parseMoney(row['凍結金額']);
        // Allow if budget is > 0 OR if there are cuts/freezes (even if budget is 0)
        const hasValue = (amt !== 0 || cut !== 0 || freeze !== 0);

        // [v162 Fix] Using includes('000000') to catch all agency levels
        const isAgencySummary = (row['計畫編號'] || '').trim().includes('000000');
        const isGeneralCut = (row['計畫名稱'] || '').includes('統刪');

        return hasValue && !isAgencySummary && !isGeneralCut;
    });

    if (!validData || validData.length === 0) {
        container.innerHTML = '<p align="center" style="color:#999; padding:30px; font-size:1.1rem;">查無資料</p>';
        return;
    }

    let html = '';
    validData.forEach(row => {
        const id = row['計畫編號'];
        const amountRaw = parseMoney(row['預算金額']);
        html += `<div class="project-block" onclick="openUnifiedDetail('${id}')">
                    <div class="pb-info">
                        <span class="pb-dept">${row['主管機關']}</span>
                        <h3 class="pb-title">${row['計畫名稱']}</h3>
                    </div>
                    <div class="pb-amount">${formatCurrency(amountRaw)}</div>
                </div>`;
    });
    container.innerHTML = html;
}
// --- [v174] 搜尋與分頁系統 ---

// 全域變數：記錄目前的搜尋結果與頁碼
let currentSearchResults = [];
let searchCurrentPage = 1;
const ITEMS_PER_PAGE = 5;
let currentSearchKeyword = '';

function syncSearchInputs(keyword) {
    if (window.DashboardRenderers && typeof window.DashboardRenderers.syncSearchInputs === 'function') {
        window.DashboardRenderers.syncSearchInputs(keyword);
        return;
    }
    const normalized = (keyword || '').trim();
    const homeInput = document.querySelector(".js-search-home-input");
    const budgetInput = document.querySelector(".js-search-budget-input");
    if (homeInput && homeInput.value !== normalized) homeInput.value = normalized;
    if (budgetInput && budgetInput.value !== normalized) budgetInput.value = normalized;
}

function updateHomeSearchCtaVisibility() {
    if (window.DashboardRenderers && typeof window.DashboardRenderers.updateHomeSearchCtaVisibility === 'function') {
        window.DashboardRenderers.updateHomeSearchCtaVisibility(currentSearchResults.length, ITEMS_PER_PAGE);
        return;
    }
    const cta = document.querySelector(".js-home-search-cta");
    if (!cta) return;
    cta.style.display = currentSearchResults.length > ITEMS_PER_PAGE ? 'block' : 'none';
}

function goToFullSearchResults() {
    showPage('page-budget');
    setTimeout(() => {
        const section = document.getElementById('section-search');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
}
window.goToFullSearchResults = goToFullSearchResults;

// 1. 處理搜尋 (含分支計畫搜尋 + 符號過濾)
function handleSearchBudget(val) {
    const container = document.querySelector(".js-results-container-budget");
    const pagination = document.querySelector(".js-pagination-budget");
    currentSearchKeyword = (val || '').trim();
    syncSearchInputs(currentSearchKeyword);

    // 重置分頁
    searchCurrentPage = 1;

    if (!currentSearchKeyword) {
        container.innerHTML = '<p align="center" style="color:#999; padding:30px; font-size:1.1rem;">請輸入關鍵字開始搜尋...</p>';
        pagination.innerHTML = ''; // 清空分頁
        currentSearchResults = [];
        const homeContainer = document.querySelector(".js-results-container-home");
        if (homeContainer) homeContainer.innerHTML = '<p align="center" style="color:#999; padding:20px;">請輸入關鍵字開始搜尋，結果將顯示於此</p>';
        updateHomeSearchCtaVisibility();
        return;
    }

    if (window.SearchEngine && typeof window.SearchEngine.filterBudgetPlans === 'function') {
        currentSearchResults = window.SearchEngine.filterBudgetPlans(allDataPageA, currentSearchKeyword, parseMoney);
    } else {
        const keywords = currentSearchKeyword.toLowerCase().replace(/\s+and\s+/g, ' ').split(/\s+/).filter(k => k.trim() !== '');
        currentSearchResults = allDataPageA.filter(r => {
            const amt = parseMoney(r['預算金額']);
            const planId = (r['計畫編號'] || '').trim();
            const planName = (r['計畫名稱'] || '');
            if (amt === 0 && !r['刪減金額']) return false;
            if (planId.includes('000000') || planName.includes('統刪')) return false;
            const cleanText = (planName + (r['工作內容'] || '') + (r['主管機關'] || '') + (r['分支計畫'] || ''))
                .toLowerCase()
                .replace(/(\d+\.|\(\d+\)|<\d+>|（\d+）)/g, '');
            return keywords.every(k => cleanText.includes(k));
        });
    }

    renderPagedResults();
    if (document.querySelector(".js-home").classList.contains('active')) {
        const homeContainer = document.querySelector(".js-results-container-home");
        if (homeContainer && currentSearchResults.length > 0) displayUnifiedBlocks(currentSearchResults.slice(0, ITEMS_PER_PAGE), homeContainer);
        else if (homeContainer) homeContainer.innerHTML = '<p align="center" style="color:#999; padding:20px;">查無資料</p>';
    }
    updateHomeSearchCtaVisibility();
    if (window.NavigationState) window.NavigationState.saveSearchState(currentSearchKeyword, searchCurrentPage);
}

// 2. 渲染分頁結果
function renderPagedResults() {
    const container = document.querySelector(".js-results-container-budget");
    const pagination = document.querySelector(".js-pagination-budget");

    if (currentSearchResults.length === 0) {
        container.innerHTML = '<p align="center" style="color:#999; padding:30px; font-size:1.1rem;">查無資料</p>';
        pagination.innerHTML = '';
        return;
    }

    // 計算切片
    const start = (searchCurrentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageData = currentSearchResults.slice(start, end);

    // 呼叫顯示函式 (顯示區塊)
    displayUnifiedBlocks(pageData);

    // 渲染分頁按鈕
    renderPaginationControls();
}

// Use unified displayUnifiedBlocks logic (deleted duplicate declaration).

// 4. 渲染分頁按鈕控制項
function renderPaginationControls() {
    const pagination = document.querySelector(".js-pagination-budget");
    const totalPages = Math.ceil(currentSearchResults.length / ITEMS_PER_PAGE);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // 上一頁
    html += `<button class="page-btn" onclick="changeSearchPage(${searchCurrentPage - 1})" ${searchCurrentPage === 1 ? 'disabled' : ''}>&lt;</button>`;

    // 頁碼邏輯 (最多顯示 5 個數字，保持當前頁在中間)
    let startPage = Math.max(1, searchCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === searchCurrentPage ? 'active' : ''}" onclick="changeSearchPage(${i})">${i}</button>`;
    }

    // 下一頁
    html += `<button class="page-btn" onclick="changeSearchPage(${searchCurrentPage + 1})" ${searchCurrentPage === totalPages ? 'disabled' : ''}>&gt;</button>`;

    // 顯示總筆數資訊
    html += `<div style="width:100%; text-align:center; font-size:0.85rem; color:#888; margin-top:5px;">共 ${currentSearchResults.length} 筆資料</div>`;

    pagination.innerHTML = html;
}

// 5. 切換頁面函式
function changeSearchPage(page) {
    const totalPages = Math.ceil(currentSearchResults.length / ITEMS_PER_PAGE);
    if (page < 1 || page > totalPages) return;

    searchCurrentPage = page;
    renderPagedResults();
    if (window.NavigationState) window.NavigationState.saveSearchState(currentSearchKeyword, searchCurrentPage);

    // 切換頁面後滾動到搜尋段落，提升體驗
    const section = document.getElementById('section-search');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// [v172 補回/修正] 處理點擊工作計畫後的 Modal 開啟邏輯
function openUnifiedDetail(id) {
    const planData = allDataPageA.find(r => r['計畫編號'] === id);
    const reviewData = allDataPageB.find(r => r['計畫編號'] === id);
    if (!planData && !reviewData) { alert("資料讀取錯誤：找不到該計畫 (請檢查計畫編號是否正確)"); return; }
    const baseData = planData || reviewData;

    // 1. 設定 Header 資訊
    document.querySelector(".js-u-title").innerText = baseData['計畫名稱'];
    document.querySelector(".js-u-dept").innerText = baseData['主管機關'];
    document.querySelector(".js-u-amount").innerText = formatCurrency(parseMoney(baseData['預算金額']));

    // 2. 判斷軍事邏輯
    const isMilitary = (id.length === 13);
    const cleanId = String(id).trim();
    const isMndSpecial = (cleanId === '0902100000' || cleanId === '0902120000');

    // 3. 處理「工作計畫內容」分頁 (Tab 1)
    if (planData) {
        document.querySelector(".js-u-desc").innerText = planData['工作內容'] || '無';
        document.querySelector(".js-u-desc-container").classList.remove('expanded');
        document.querySelector(".js-toggle-desc-btn").innerText = '展開閱讀全文';

        renderDetailChartsA(planData);

        const normalView = document.querySelector(".js-analysis-normal");
        const militaryView = document.querySelector(".js-analysis-military");

        if (isMilitary || isMndSpecial) {
            // --- 軍事模式 ---
            normalView.style.display = 'none';
            militaryView.style.display = 'grid';

            const projectBudget = parseMoney(planData['預算金額']);
            const projectUsage = parseUsageString(planData['用途比例']);
            const agencyName = planData['主管機關'];

            let targetPrefix = '0902';
            let mndForceValue = 559611869000;
            let mndLabel = "所屬機關佔比（國防部所屬）";

            if (cleanId.startsWith('0901')) {
                targetPrefix = '0901';
                mndForceValue = 1750857000;
                mndLabel = "所屬機關佔比（國防部）";
            }

            const mndProjects = allDataPageA.filter(p => String(p['計畫編號']).trim().startsWith(targetPrefix));
            let mndTotalBudget = mndProjects.reduce((sum, p) => sum + parseMoney(p['預算金額']), 0);
            let mndUsageTotal = { '人事費': 0, '業務費': 0, '設備及投資': 0, '獎補助費': 0, '債務費': 0, '預備金': 0 };
            mndProjects.forEach(p => {
                const breakdown = parseUsageString(p['用途比例']);
                for (let k in mndUsageTotal) mndUsageTotal[k] += breakdown[k];
            });

            if (mndTotalBudget < mndForceValue) mndTotalBudget = mndForceValue;

            let unitTotalBudget = 0;
            let unitUsageTotal = { '人事費': 0, '業務費': 0, '設備及投資': 0, '獎補助費': 0, '債務費': 0, '預備金': 0 };
            let unitLabel = `所屬機關佔比（${agencyName}）`;

            if (isMndSpecial) {
                unitTotalBudget = mndTotalBudget;
                unitUsageTotal = mndUsageTotal;
                unitLabel = "所屬機關佔比（全機關）";
            } else {
                const suffix = id.slice(-2);
                const unitProjects = allDataPageA.filter(p => p['計畫編號'].length === 13 && p['計畫編號'].slice(-2) === suffix);
                unitTotalBudget = unitProjects.reduce((sum, p) => sum + parseMoney(p['預算金額']), 0);
                unitProjects.forEach(p => {
                    const breakdown = parseUsageString(p['用途比例']);
                    for (let k in unitUsageTotal) unitUsageTotal[k] += breakdown[k];
                });
            }

            document.querySelector(".js-title-mil-unit-ratio").innerText = unitLabel;

            // Render Military Charts
            if (chartMilMndRatio) chartMilMndRatio.destroy();
            const ctx1 = document.querySelector(".js-chartMilMndRatio").getContext('2d');
            const mndRatio = (mndTotalBudget > 0) ? (projectBudget / mndTotalBudget * 100).toFixed(2) : 0;
            const box1 = document.querySelector(".js-chartMilMndRatio").parentElement.parentElement;
            box1.querySelector('h4').innerText = mndLabel;
            document.querySelector(".js-caption-mil-mnd-ratio").innerText = `本計畫金額占${mndLabel.replace('所屬機關佔比（', '').replace('）', '')}預算 ${mndRatio}%`;

            chartMilMndRatio = new Chart(ctx1, {
                type: 'bar', data: { labels: ['金額'], datasets: [{ label: '本計畫', data: [projectBudget], backgroundColor: '#c63f3f', stack: 'S0' }, { label: '機關其他', data: [mndTotalBudget - projectBudget], backgroundColor: '#f4f6f8', stack: 'S0' }] },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, display: false }, y: { display: false, stacked: true } }, plugins: { legend: { position: 'bottom' }, tooltip: tooltipCurrencyCallback } }
            });

            if (chartMilUnitRatio) chartMilUnitRatio.destroy();
            const ctx2 = document.querySelector(".js-chartMilUnitRatio").getContext('2d');
            const unitRatio = (unitTotalBudget > 0) ? (projectBudget / unitTotalBudget * 100).toFixed(2) : 0;
            document.querySelector(".js-caption-mil-unit-ratio").innerText = `本計畫金額占${unitLabel.replace('所屬機關佔比（', '').replace('）', '')}預算 ${unitRatio}%`;
            chartMilUnitRatio = new Chart(ctx2, {
                type: 'bar', data: { labels: ['金額'], datasets: [{ label: '本計畫', data: [projectBudget], backgroundColor: '#c63f3f', stack: 'S0' }, { label: '單位其他', data: [unitTotalBudget - projectBudget], backgroundColor: '#f4f6f8', stack: 'S0' }] },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, display: false }, y: { display: false, stacked: true } }, plugins: { legend: { position: 'bottom' }, tooltip: tooltipCurrencyCallback } }
            });

            if (chartMilMndCat) chartMilMndCat.destroy();
            const ctx3 = document.querySelector(".js-chartMilMndCat").getContext('2d');
            const catLabels = ['人事費', '業務費', '設備及投資', '獎補助費', '債務費', '預備金'];
            const pCatData = catLabels.map(k => projectUsage[k]);
            const mndCatRest = catLabels.map(k => (mndUsageTotal[k] || 0) - (projectUsage[k] || 0));
            chartMilMndCat = new Chart(ctx3, {
                type: 'bar', data: { labels: catLabels, datasets: [{ label: '本計畫', data: pCatData, backgroundColor: '#c63f3f', stack: 'S0' }, { label: '國防部其他', data: mndCatRest, backgroundColor: '#f4f6f8', stack: 'S0' }] },
                options: {
                    indexAxis: 'y', responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', axis: 'y', intersect: false }, scales: { x: { stacked: true, ticks: { callback: function (value) { return formatCurrency(value); } } }, y: { stacked: true } }, plugins: { legend: { position: 'bottom' }, tooltip: tooltipCurrencyCallback },
                    onHover: function (e, activeEls) { if (!activeEls.length) return; const idx = activeEls[0].index; const label = this.data.labels[idx]; const pVal = pCatData[idx]; const tVal = mndUsageTotal[label]; const pct = (tVal > 0) ? (pVal / tVal * 100).toFixed(2) : 0; document.querySelector(".js-caption-mil-mnd-cat").innerHTML = `本計畫<b>${label}</b>占<b>國防部${label}</b>預算 <b>${pct}%</b>`; }
                }
            });
            document.querySelector(".js-caption-mil-mnd-cat").innerText = "請滑鼠移至(或點擊)該類別的整行區域即可查看";

            if (chartMilUnitCat) chartMilUnitCat.destroy();
            const ctx4 = document.querySelector(".js-chartMilUnitCat").getContext('2d');
            const unitCatRest = catLabels.map(k => (unitUsageTotal[k] || 0) - (projectUsage[k] || 0));
            chartMilUnitCat = new Chart(ctx4, {
                type: 'bar', data: { labels: catLabels, datasets: [{ label: '本計畫', data: pCatData, backgroundColor: '#c63f3f', stack: 'S0' }, { label: '單位其他', data: unitCatRest, backgroundColor: '#f4f6f8', stack: 'S0' }] },
                options: {
                    indexAxis: 'y', responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', axis: 'y', intersect: false }, scales: { x: { stacked: true, ticks: { callback: function (value) { return formatCurrency(value); } } }, y: { stacked: true } }, plugins: { legend: { position: 'bottom' }, tooltip: tooltipCurrencyCallback },
                    onHover: function (e, activeEls) { if (!activeEls.length) return; const idx = activeEls[0].index; const label = this.data.labels[idx]; const pVal = pCatData[idx]; const tVal = unitUsageTotal[label]; const pct = (tVal > 0) ? (pVal / tVal * 100).toFixed(2) : 0; document.querySelector(".js-caption-mil-unit-cat").innerHTML = `本計畫<b>${label}</b>占<b>該單位${label}</b>預算 <b>${pct}%</b>`; }
                }
            });
            document.querySelector(".js-caption-mil-unit-cat").innerText = "請滑鼠移至(或點擊)該類別的整行區域即可查看";

        } else {
            // --- 一般模式 ---
            normalView.style.display = 'grid';
            militaryView.style.display = 'none';

            const agencyName = planData['主管機關'];
            let agencyStats = calculateAgencyStats(agencyName);
            const projectBudget = parseMoney(planData['預算金額']);
            const projectUsage = parseUsageString(planData['用途比例']);

            if (String(id).trim().startsWith('0902')) {
                agencyStats.totalBudget = 559611869000;
            }

            if (chartModalPlanRatio) chartModalPlanRatio.destroy();
            const ctxRatio = document.querySelector(".js-chartModalPlanRatio").getContext('2d');
            const totalRatio = (agencyStats.totalBudget > 0) ? (projectBudget / agencyStats.totalBudget * 100).toFixed(2) : 0;
            document.querySelector(".js-caption-plan-ratio").innerText = `本計畫金額占${agencyName}預算 ${totalRatio}%`;

            chartModalPlanRatio = new Chart(ctxRatio, {
                type: 'bar',
                data: {
                    labels: ['金額'],
                    datasets: [
                        { label: '本計畫', data: [projectBudget], backgroundColor: '#c63f3f', stack: 'Stack 0' },
                        { label: '機關其他', data: [agencyStats.totalBudget - projectBudget], backgroundColor: '#f4f6f8', stack: 'Stack 0' }
                    ]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, display: false }, y: { display: false, stacked: true } }, plugins: { legend: { position: 'bottom' }, tooltip: tooltipCurrencyCallback } }
            });

            if (chartModalCatRatio) chartModalCatRatio.destroy();
            const ctxCat = document.querySelector(".js-chartModalCatRatio").getContext('2d');
            const catLabels = ['人事費', '業務費', '設備及投資', '獎補助費', '債務費', '預備金'];
            const projectCatData = catLabels.map(k => projectUsage[k]);
            const restCatData = catLabels.map(k => (agencyStats.usageBreakdown[k] || 0) - (projectUsage[k] || 0));
            const captionEl = document.querySelector(".js-caption-cat-ratio");
            captionEl.innerText = "請滑鼠移至(或點擊)該類別的整行區域即可查看";

            chartModalCatRatio = new Chart(ctxCat, {
                type: 'bar',
                data: {
                    labels: catLabels,
                    datasets: [
                        { label: '本計畫', data: projectCatData, backgroundColor: '#c63f3f', stack: 'Stack 0' },
                        { label: '機關其他', data: restCatData, backgroundColor: '#f4f6f8', stack: 'Stack 0' }
                    ]
                },
                options: {
                    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', axis: 'y', intersect: false },
                    scales: { x: { stacked: true, ticks: { callback: function (value) { return formatCurrency(value); } } }, y: { stacked: true } },
                    plugins: { legend: { position: 'bottom' }, tooltip: tooltipCurrencyCallback },
                    onHover: function (e, activeEls) {
                        if (!activeEls || activeEls.length === 0) return;
                        const idx = activeEls[0].index;
                        const label = this.data.labels[idx];
                        const pVal = projectCatData[idx];
                        const totalVal = agencyStats.usageBreakdown[label];
                        const pct = (totalVal > 0) ? (pVal / totalVal * 100).toFixed(2) : 0;
                        captionEl.innerHTML = `本計畫<b>${label}</b>占<b>${agencyName}${label}</b>預算 <b>${pct}%</b>`;
                    }
                }
            });
        }
    } else { document.querySelector(".js-u-desc").innerText = '此計畫無詳細編列內容資料。'; }

    // 4. 處理「審查刪減結果」分頁 (Tab 2)
    const reviewContainer = document.querySelector(".js-review-data-container");
    const reviewNoData = document.querySelector(".js-review-no-data");
    if (reviewData) {
        reviewContainer.style.display = 'block';
        reviewNoData.style.display = 'none';

        renderDetailChartsB(reviewData);
        renderProposalTable(reviewData);

        // [修正] 移除舊的「機關整體」圖表渲染，避免 innerHTML null 錯誤
    } else {
        reviewContainer.style.display = 'none';
        reviewNoData.style.display = 'block';
    }

    switchTab('plan');
    if (window.ModalRenderers && typeof window.ModalRenderers.showModal === 'function') {
        window.ModalRenderers.showModal('unifiedModal');
    } else {
        document.querySelector(".js-unifiedModal").style.display = 'flex';
    }
    setTimeout(() => {
        if (window.ModalRenderers && typeof window.ModalRenderers.resetModalScroll === 'function') {
            window.ModalRenderers.resetModalScroll('#unifiedModal .modal-body-area');
        } else {
            const modalBody = document.querySelector('#unifiedModal .modal-body-area');
            if (modalBody) modalBody.scrollTop = 0;
        }
    }, 0);
}

// [v156] Fixed Military Logic
// [v172 修正] 移除 Modal 內機關整體審查結果的相關邏輯，修復 innerHTML null 錯誤
// [v173] 更新圖表與連動選單 (支援全部、部會、機關三層級)
function updateBudgetPageReview() {
    const ministrySelect = document.querySelector(".js-bp-filter-ministry");
    const unitSelect = document.querySelector(".js-bp-filter-unit");
    const selectedMinistry = ministrySelect.value;

    // 連動邏輯：選部會 -> 更新機關選單
    if (selectedMinistry) {
        const agencies = [...new Set(allDataPageA
            .filter(d => d['所屬部會'] === selectedMinistry)
            .map(d => d['主管機關']))]
            .filter(a => a).sort();

        const lastMinistry = unitSelect.getAttribute('data-last-ministry');
        if (lastMinistry !== selectedMinistry) {
            let html = '<option value="">請選擇主管機關 (全部)</option>'; // [修改] 預設為全部
            agencies.forEach(a => { html += `<option value="${a}">${a}</option>`; });
            unitSelect.innerHTML = html;
            unitSelect.value = "";
            unitSelect.setAttribute('data-last-ministry', selectedMinistry);
        }
    } else {
        unitSelect.innerHTML = '<option value="">請選擇主管機關</option>';
        unitSelect.value = "";
    }

    const selectedAgency = unitSelect.value;
    const captionEl = document.querySelector(".js-bp-review-caption");

    // --- 計算邏輯開始 ---
    let totalBudget = 0;
    let totalCut = 0;
    let totalFreeze = 0;
    let titleText = "";

    if (selectedAgency) {
        // [情境 3] 已選擇特定機關 -> 使用 calculateAgencyStats 取得該機關數據 (含國防部特殊校正)
        const stats = calculateAgencyStats(selectedAgency);
        totalBudget = stats.totalBudget;
        totalCut = stats.totalCut;
        totalFreeze = stats.totalFreeze;
        titleText = selectedAgency;
    } else if (selectedMinistry) {
        // [情境 2] 只選部會，沒選機關 -> 加總該部會下所有資料
        titleText = selectedMinistry + " (全體)";

        // 找出該部會所有計畫
        const ministryProjects = allDataPageA.filter(d => d['所屬部會'] === selectedMinistry);

        // 針對國防部做特殊處理 (加總時需注意 0901/0902 是否需要強制校正)
        // 為了簡化與保持一致性，這裡我們直接累加該部會所有計畫的金額
        // 如果是國防部，手動檢查是否包含 0902 開頭的，若有則視為機密預算加總
        if (selectedMinistry === '國防部') {
            // 國防部特殊邏輯：加總 0901 (本部) + 0902 (所屬)
            const statsMND = calculateAgencyStats('國防部');
            const statsSub = calculateAgencyStats('國防部所屬');
            totalBudget = statsMND.totalBudget + statsSub.totalBudget;
            totalCut = statsMND.totalCut + statsSub.totalCut;
            totalFreeze = statsMND.totalFreeze + statsSub.totalFreeze;
        } else {
            // 一般部會：直接遍歷 A 表與 B 表
            ministryProjects.forEach(p => {
                totalBudget += parseMoney(p['預算金額']);
            });

            // 找出該部會的審查結果 (B表)
            const ministryReviews = allDataPageB.filter(r => r['所屬部會'] === selectedMinistry || ministryProjects.some(p => p['主管機關'] === r['主管機關']));
            // 注意：B表可能沒有所屬部會欄位，需透過主管機關比對，或直接比對計畫編號
            // 更安全的做法：遍歷 B 表，若其主管機關屬於該部會則加總

            // 建立該部會的機關清單
            const agenciesInMinistry = [...new Set(ministryProjects.map(p => p['主管機關']))];

            allDataPageB.forEach(r => {
                if (agenciesInMinistry.includes(r['主管機關'])) {
                    totalCut += parseMoney(r['刪減金額']);
                    totalFreeze += parseMoney(r['凍結金額']);
                }
            });
        }

    } else {
        // [情境 1] 兩個都沒選 -> 加總資料庫所有資料 (中央政府總預算)
        titleText = "中央政府總預算案 (全體)";

        // 預算總額 (A表)
        // 注意：這裡直接加總 A 表可能會漏掉國防部強制校正的差額，建議手動校正國防部
        // 但為了效能，我們先直接加總，若有國防部再補差額
        let rawTotalA = 0;
        allDataPageA.forEach(p => rawTotalA += parseMoney(p['預算金額']));

        // 國防部校正：(17.5億 + 5596億) - (資料庫中實際的國防加總)
        // 這樣做比較複雜，簡單做法：直接加總 A 表，假設國防部資料已在 A 表完整 (若不完整則會少算)
        // 根據先前邏輯，0902 只有兩筆，所以這裡必須手動加上「看不見的機密預算」

        // 計算目前資料庫中 0901 和 0902 的總額
        const mndExisting = allDataPageA.filter(p => {
            const id = String(p['計畫編號']).trim();
            return id.startsWith('0901') || id.startsWith('0902');
        }).reduce((sum, p) => sum + parseMoney(p['預算金額']), 0);

        const mndTarget = 1750857000 + 559611869000; // 國防部正確總額
        const diff = mndTarget - mndExisting;

        totalBudget = rawTotalA + (diff > 0 ? diff : 0); // 補上差額

        // 刪減凍結總額 (B表)
        allDataPageB.forEach(r => {
            totalCut += parseMoney(r['刪減金額']);
            totalFreeze += parseMoney(r['凍結金額']);
        });
    }

    // --- 繪圖數據準備 ---
    const totalPass = totalBudget - totalCut - totalFreeze;
    const pctPass = (totalBudget > 0) ? (totalPass / totalBudget * 100).toFixed(1) : 0;
    const pctCut = (totalBudget > 0) ? (totalCut / totalBudget * 100).toFixed(1) : 0;
    const pctFreeze = (totalBudget > 0) ? (totalFreeze / totalBudget * 100).toFixed(1) : 0;

    // 更新文字說明
    captionEl.innerHTML = `
                <span style="color:#315493; font-weight:bold;">${titleText}</span> 總預算：${formatCurrency(totalBudget)}<br>
                通過：<b>${pctPass}%</b> | 
                <span style="color:#c63f3f">刪減：<b>${pctCut}%</b> (${formatCurrency(totalCut)})</span> | 
                <span style="color:#F0C808">凍結：<b>${pctFreeze}%</b> (${formatCurrency(totalFreeze)})</span>
            `;

    // 繪製圖表
    const ctx = document.querySelector(".js-chartBudgetPageReview").getContext('2d');
    if (chartBudgetPageReview) chartBudgetPageReview.destroy();

    chartBudgetPageReview = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['審查結果'],
            datasets: [
                { label: '通過', data: [totalPass], backgroundColor: '#315493', barThickness: 50 },
                { label: '凍結', data: [totalFreeze], backgroundColor: '#F0C808', barThickness: 50 },
                { label: '刪減', data: [totalCut], backgroundColor: '#c63f3f', barThickness: 50 }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, display: false, max: totalBudget },
                y: { stacked: true, display: false }
            },
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipCurrencyCallback
            }
        }
    });
}

// [v117] Date Format Helper
function formatGoogleDate(raw) {
    // Local JSON snapshot uses epoch milliseconds
    if (typeof raw === 'number' && !Number.isNaN(raw)) {
        const d = new Date(raw);
        if (!Number.isNaN(d.getTime())) {
            const y = d.getFullYear() - 1911;
            const m = d.getMonth() + 1;
            const day = d.getDate();
            return `${y}/${m < 10 ? '0' + m : m}/${day < 10 ? '0' + day : day}`;
        }
    }

    // Sometimes epoch comes as a numeric string
    if (typeof raw === 'string') {
        const s = raw.trim();
        if (/^\d{12,14}$/.test(s)) {
            const n = parseInt(s, 10);
            if (!Number.isNaN(n)) return formatGoogleDate(n);
        }
    }

    if (typeof raw === 'string' && raw.startsWith('Date(')) {
        const parts = raw.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (parts && parts.length === 4) {
            let y = parseInt(parts[1]); let m = parseInt(parts[2]) + 1; let d = parseInt(parts[3]);
            if (y > 1911) y -= 1911;
            return `${y}/${m < 10 ? '0' + m : m}/${d < 10 ? '0' + d : d}`;
        }
    }
    return raw;
}

// [v144] Special Timeline Rendering
function renderTimeline(data) {
    const container = document.querySelector(".js-budget-timeline");
    if (!container) return;

    const sourceData = (data && data.length > 0) ? data : MOCK_DATA_D;

    const toSortKey = (raw) => {
        if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
        if (typeof raw === 'string') {
            const s = raw.trim();
            if (/^\d{12,14}$/.test(s)) {
                const n = parseInt(s, 10);
                if (!Number.isNaN(n)) return n;
            }
            const m = s.match(/Date\((\d+),(\d+),(\d+)\)/);
            if (m) {
                const y = parseInt(m[1], 10);
                const mo = parseInt(m[2], 10);
                const d = parseInt(m[3], 10);
                const dt = new Date(y, mo, d);
                if (!Number.isNaN(dt.getTime())) return dt.getTime();
            }
            const roc = s.match(/^(\d{2,4})\/(\d{1,2})\/(\d{1,2})$/);
            if (roc) {
                const yRaw = parseInt(roc[1], 10);
                const y = yRaw < 1911 ? (yRaw + 1911) : yRaw;
                const mo = parseInt(roc[2], 10) - 1;
                const d = parseInt(roc[3], 10);
                const dt = new Date(y, mo, d);
                if (!Number.isNaN(dt.getTime())) return dt.getTime();
            }
        }
        return 0;
    };

    const grouped = new Map();
    sourceData.forEach((item) => {
        const dateKey = formatGoogleDate(item['日期']);
        if (!grouped.has(dateKey)) grouped.set(dateKey, { dateKey, sortKey: toSortKey(item['日期']), events: [] });
        grouped.get(dateKey).events.push(item);
    });

    // 將日期依時間新到舊排序（未來日期在前）
    const days = Array.from(grouped.values()).sort((a, b) => (b.sortKey || 0) - (a.sortKey || 0));

    let html = '<div class="timeline-v2" role="list">';
    days.forEach((day) => {
        const events = day.events || [];
        const deadlineEvent = events.find((e) => e['事項'] && String(e['事項']).startsWith('[LINE]'));

        if (deadlineEvent) {
            const text = String(deadlineEvent['事項']).replace('[LINE]', '').trim();
            html += `
                <div class="timeline-v2__deadline" role="listitem" aria-label="${day.dateKey} ${text}">
                    <div class="timeline-v2__dot" aria-hidden="true"></div>
                    <div class="timeline-v2__deadline-inner">
                        <span class="timeline-v2__deadline-pill">${day.dateKey}</span>
                        <span class="timeline-v2__deadline-text">${text}</span>
                    </div>
                </div>
            `;
            return;
        }

        let eventsHtml = '';
        events.forEach((ev) => {
            const title = (ev && ev['事項']) ? String(ev['事項']) : '';
            const link = (ev && ev['連結']) ? String(ev['連結']) : '';
            const linkBtn = link
                ? `<a href="${link}" target="_blank" rel="noreferrer" class="timeline-v2__link">📄 相關公報</a>`
                : '';

            eventsHtml += `
                <div class="timeline-v2__event" role="listitem">
                    <div class="timeline-v2__dot" aria-hidden="true"></div>
                    <div class="timeline-v2__card">
                        <div class="timeline-v2__meta">
                            <span class="timeline-v2__date">${day.dateKey}</span>
                        </div>
                        <div class="timeline-v2__title">
                            <span>${title}</span>
                            ${linkBtn}
                        </div>
                    </div>
                </div>
            `;
        });

        html += `<div class="timeline-v2__day">${eventsHtml}</div>`;
    });

    html += '</div>';
    container.innerHTML = html;
}

// --- 10. Event Listeners ---
// --- 11. Data Loading ---
function parseQueryResponse(jsonData) {
    const table = jsonData.table;
    const cols = table.cols; // Keep original column objects
    const rows = table.rows;
    return rows.map(row => {
        let obj = {};
        row.c.forEach((cell, i) => {
            const col = cols[i];
            if (col && col.label) {
                let val = '';
                if (cell && cell.v !== null && cell.v !== undefined) {
                    val = String(cell.v);
                }
                obj[col.label] = val;
            }
        });
        return obj;
    });
}

async function fetchData(pageId, silent = false) {
    const loader = document.querySelector(".js-loader");
    const errorDisplay = document.querySelector(".js-error-display");

    let targetUrl = dataSources[pageId];
    if (pageId === 'page-budget') return [];
    if (pageId === 'page-legislator') targetUrl = dataSources['page-c'];

    if (!silent && loader) loader.style.display = 'flex';

    try {
        console.log(`[${pageId}] Fetching from: ${targetUrl}`);
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const cleanData = await response.json();
        console.log(`[${pageId}] Loaded data length:`, cleanData.length);
        if (window.DataLoaderModule && typeof window.DataLoaderModule.applyDataContract === 'function') {
            window.DataLoaderModule.applyDataContract(pageId, cleanData);
        }

        if (pageId === 'page-a') {
            allDataPageA = cleanData;
            console.log("allDataPageA updated, sample:", allDataPageA[0]);
        }
        else if (pageId === 'page-b') {
            allDataPageB = cleanData;
            processPageBData(allDataPageB);
            renderHomeCutFreezeCards();
        }
        else if (pageId === 'page-c') { allDataPageC = cleanData; filterLegislators('all'); }
        else if (pageId === 'page-d') { allDataPageD = cleanData; renderTimeline(allDataPageD); }

        if (!silent && loader) loader.style.display = 'none';
        return cleanData;

    } catch (error) {
        console.warn(`[${pageId}] Fetch failed, using Mock Data.`, error);
        isDemoMode = true;
        console.log(`[${pageId}] Entering Demo Mode`);
        let mockData = [];
        if (pageId === 'page-a') {
            mockData = MOCK_DATA_A;
            allDataPageA = mockData;
            console.log("allDataPageA set to MOCK_DATA_A, length:", allDataPageA.length);
        }
        else if (pageId === 'page-b') {
            mockData = MOCK_DATA_B;
            allDataPageB = mockData;
            processPageBData(mockData);
            renderHomeCutFreezeCards();
        }
        else if (pageId === 'page-c') { mockData = MOCK_DATA_C; allDataPageC = mockData; filterLegislators('all'); }
        else if (pageId === 'page-d') { mockData = MOCK_DATA_D; allDataPageD = mockData; renderTimeline(mockData); }
        if (window.DataLoaderModule && typeof window.DataLoaderModule.applyDataContract === 'function') {
            window.DataLoaderModule.applyDataContract(pageId, mockData);
        }

        if (!silent) {
            loader.style.display = 'none';
            if (errorDisplay && pageId === 'page-a') {
                errorDisplay.style.display = 'flex';
                if (error.message.includes("Login Page")) {
                    errorDisplay.innerHTML = `<div class="error-message"><h3>⚠️ 權限錯誤</h3><p>Google 試算表要求登入。</p></div>`;
                } else {
                    errorDisplay.innerHTML = `<div class="error-message"><h3>⚠️ 連線失敗</h3><p>無法連線至資料庫。</p></div>`;
                }
            }
            document.querySelectorAll('.demo-mode-badge').forEach(el => el.style.display = 'block');
        }
        return mockData;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initSidebarNav();
    initFloatBackTop();
    initNavToggle();
    initScrollToTriggers();
    updateNavWheelIndicator();
    renderMainCharts();
    Promise.all([
        fetchData('page-a', true),
        fetchData('page-b', true),
        fetchData('page-c', true),
        fetchData('page-d', true)
    ]).then(() => {
        // ALWAYS initialize these sections if we have any data at all (including Mock Data)
        if (allDataPageA && allDataPageA.length > 0) {
            // 1. 初始化部會分析 (首頁)
            initMinistrySection();

            // 2. 初始化搜尋頁儀表板 (分頁)
            initBudgetPageFilters();
        }

        // [v175 新增] 繪製首頁總審查圖表
        renderHomeStatusChart();
        renderHomeCutFreezeCards();

        if (isDemoMode) {
            document.querySelectorAll('.demo-mode-badge').forEach(el => el.style.display = 'block');
        }

        if (window.NavigationState) {
            const state = window.NavigationState.restoreState();
            if (state && state.searchKeyword) {
                currentSearchKeyword = state.searchKeyword;
                handleSearchBudget(state.searchKeyword);
                if (state.searchPage && state.searchPage > 1) {
                    changeSearchPage(state.searchPage);
                }
            }
            if (state && state.activePage && document.getElementById(state.activePage)) {
                showPage(state.activePage);
            }
        }
    });
});

window.addEventListener('resize', () => {
    const arrowLine = document.querySelector(".js-dynamic-arrow");
    if (arrowLine) arrowLine.style.opacity = '0';
    updateNavWheelIndicator();
});
