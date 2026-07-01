# FTP 上傳清單（img 主機）

## 目標主機路徑

- 上傳根目錄：`/missions/M2/`
- 目錄對照：
  - 本機 `M2/img/*` → 主機 `/missions/M2/img/*`
  - 本機 `M2/photos/*` → 主機 `/missions/M2/photos/*`

## CDN 對外路徑（已在 `M2/` 程式碼使用）

- Base：`https://imgcdn.cna.com.tw/missions/M2/`
- 版號：全部加 `?v=1`（若檔案內容更新，請把 `v` 改成 `2/3/...`）

## 需要上傳：`img/`（7 檔）

| 本機 | 主機目標 |
| --- | --- |
| `M2/img/1000.png` | `/missions/M2/img/1000.png` |
| `M2/img/image 10.jpg` | `/missions/M2/img/image 10.jpg` |
| `M2/img/cna_logo.svg` | `/missions/M2/img/cna_logo.svg` |
| `M2/img/Threads_(app)_logo.svg` | `/missions/M2/img/Threads_(app)_logo.svg` |
| `M2/img/dpp.svg` | `/missions/M2/img/dpp.svg` |
| `M2/img/kmt..png` | `/missions/M2/img/kmt..png` |
| `M2/img/tpp.svg` | `/missions/M2/img/tpp.svg` |

## 需要上傳：`photos/`（114 檔，全部）

> `M2/main_vs.js` 會以立委姓名動態組出 `photos/<name>.jpg`，因此此資料夾內所有檔案都必須上傳到 `/missions/M2/photos/`。

下列每一檔：本機 `M2/photos/<檔名>.jpg` → 主機 `/missions/M2/photos/<檔名>.jpg`

- `M2/photos/丁學忠.jpg`
- `M2/photos/伍麗華Saidhai‧Tahovecahe.jpg`
- `M2/photos/何欣純.jpg`
- `M2/photos/傅崐萁.jpg`
- `M2/photos/劉建國.jpg`
- `M2/photos/劉書彬.jpg`
- `M2/photos/吳宗憲.jpg`
- `M2/photos/吳思瑤.jpg`
- `M2/photos/吳沛憶.jpg`
- `M2/photos/吳琪銘.jpg`
- `M2/photos/吳秉叡.jpg`
- `M2/photos/呂玉玲.jpg`
- `M2/photos/廖偉翔.jpg`
- `M2/photos/廖先翔.jpg`
- `M2/photos/張啓楷.jpg`
- `M2/photos/張嘉郡.jpg`
- `M2/photos/張宏陸.jpg`
- `M2/photos/張智倫.jpg`
- `M2/photos/張雅琳.jpg`
- `M2/photos/徐富癸.jpg`
- `M2/photos/徐巧芯.jpg`
- `M2/photos/徐欣瑩.jpg`
- `M2/photos/李坤城.jpg`
- `M2/photos/李彥秀.jpg`
- `M2/photos/李昆澤.jpg`
- `M2/photos/李柏毅.jpg`
- `M2/photos/林俊憲.jpg`
- `M2/photos/林倩綺.jpg`
- `M2/photos/林國成.jpg`
- `M2/photos/林宜瑾.jpg`
- `M2/photos/林岱樺.jpg`
- `M2/photos/林德福.jpg`
- `M2/photos/林思銘.jpg`
- `M2/photos/林憶君.jpg`
- `M2/photos/林月琴.jpg`
- `M2/photos/林楚茵.jpg`
- `M2/photos/林沛祥.jpg`
- `M2/photos/林淑芬.jpg`
- `M2/photos/林淑芳.jpg`
- `M2/photos/柯建銘.jpg`
- `M2/photos/柯志恩.jpg`
- `M2/photos/楊曜.jpg`
- `M2/photos/楊瓊瓔.jpg`
- `M2/photos/江啟臣.jpg`
- `M2/photos/沈伯洋.jpg`
- `M2/photos/沈發惠.jpg`
- `M2/photos/洪孟楷.jpg`
- `M2/photos/涂權吉.jpg`
- `M2/photos/游顥.jpg`
- `M2/photos/牛煦庭.jpg`
- `M2/photos/王世堅.jpg`
- `M2/photos/王定宇.jpg`
- `M2/photos/王正旭.jpg`
- `M2/photos/王美惠.jpg`
- `M2/photos/王義川.jpg`
- `M2/photos/王育敏.jpg`
- `M2/photos/王鴻薇.jpg`
- `M2/photos/盧縣一.jpg`
- `M2/photos/羅廷瑋.jpg`
- `M2/photos/羅明才.jpg`
- `M2/photos/羅智強.jpg`
- `M2/photos/羅美玲.jpg`
- `M2/photos/翁曉玲.jpg`
- `M2/photos/范雲.jpg`
- `M2/photos/莊瑞雄.jpg`
- `M2/photos/萬美玲.jpg`
- `M2/photos/葉元之.jpg`
- `M2/photos/葛如鈞.jpg`
- `M2/photos/蔡其昌.jpg`
- `M2/photos/蔡易餘.jpg`
- `M2/photos/蘇巧慧.jpg`
- `M2/photos/蘇清泉.jpg`
- `M2/photos/許宇甄.jpg`
- `M2/photos/許智傑.jpg`
- `M2/photos/謝衣鳳.jpg`
- `M2/photos/謝龍介.jpg`
- `M2/photos/賴士葆.jpg`
- `M2/photos/賴惠員.jpg`
- `M2/photos/賴瑞隆.jpg`
- `M2/photos/邱志偉.jpg`
- `M2/photos/邱若華.jpg`
- `M2/photos/邱議瑩.jpg`
- `M2/photos/邱鎮軍.jpg`
- `M2/photos/郭國文.jpg`
- `M2/photos/郭昱晴.jpg`
- `M2/photos/鄭天財Sra Kacaw.jpg`
- `M2/photos/鄭正鈐.jpg`
- `M2/photos/鍾佳濱.jpg`
- `M2/photos/陳亭妃.jpg`
- `M2/photos/陳俊宇.jpg`
- `M2/photos/陳冠廷.jpg`
- `M2/photos/陳培瑜.jpg`
- `M2/photos/陳昭姿.jpg`
- `M2/photos/陳永康.jpg`
- `M2/photos/陳玉珍.jpg`
- `M2/photos/陳瑩.jpg`
- `M2/photos/陳秀寳.jpg`
- `M2/photos/陳素月.jpg`
- `M2/photos/陳菁徽.jpg`
- `M2/photos/陳超明.jpg`
- `M2/photos/陳雪生.jpg`
- `M2/photos/韓國瑜.jpg`
- `M2/photos/顏寬恒.jpg`
- `M2/photos/馬文君.jpg`
- `M2/photos/高金素梅.jpg`
- `M2/photos/魯明哲.jpg`
- `M2/photos/麥玉珍.jpg`
- `M2/photos/黃仁.jpg`
- `M2/photos/黃健豪.jpg`
- `M2/photos/黃國昌.jpg`
- `M2/photos/黃建賓.jpg`
- `M2/photos/黃捷.jpg`
- `M2/photos/黃珊珊.jpg`
- `M2/photos/黃秀芳.jpg`

