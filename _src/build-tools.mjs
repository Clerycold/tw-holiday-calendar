// 產生 /tools/ 試算工具頁。執行：node _src/build-tools.mjs（在 repo 根目錄）
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require_ = createRequire(import.meta.url);
const { TW_HOL } = require_("../assets/tools/calc.js");

const SITE = "https://fangjiatw.com";
const UPDATED = "2026-11-01";
const NAV = `<nav><a href="/#planner">請假計算器</a><a href="/tools/">試算工具</a><a href="/concert/">演唱會住宿</a><a href="/#calendar">全年行事曆</a></nav>`;
const esc = s => s.replace(/"/g, "&quot;");

function page({ path, title, h1, desc, crumb, faq = [], body, scripts = true, app, updated = UPDATED, disclaimer }) {
  const url = SITE + path;
  const graph = [
    { "@type": "WebPage", name: title, url, inLanguage: "zh-Hant-TW", dateModified: updated,
      publisher: { "@type": "Organization", name: "放假日曆", url: SITE + "/" } },
    ...(app ? [{ "@type": "WebApplication", name: app, url, applicationCategory: "FinanceApplication", operatingSystem: "Any",
      inLanguage: "zh-Hant-TW", isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" } }] : []),
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "放假日曆", item: SITE + "/" },
      ...(path === "/tools/" ? [{ "@type": "ListItem", position: 2, name: "試算工具", item: url }]
        : [{ "@type": "ListItem", position: 2, name: "試算工具", item: SITE + "/tools/" },
           { "@type": "ListItem", position: 3, name: crumb, item: url }]) ] },
  ];
  if (faq.length) graph.push({ "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });
  const faqHtml = faq.length ? `
  <section>
    <h2>常見問題</h2>
${faq.map(([q, a]) => `    <details><summary>${q}</summary><p>${a}</p></details>`).join("\n")}
  </section>` : "";
  return `<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}｜放假日曆</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;900&family=Noto+Sans+TC:wght@400;500;700&family=JetBrains+Mono:wght@500&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=3">
<link rel="stylesheet" href="/assets/tools/tools.css?v=3">
<script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 1)}
</script>
</head>
<body>
<header class="top">
  <a class="logo" href="/">放假<span>日曆</span></a>
  ${NAV}
</header>

<main class="article">
  <div>
    <div class="crumb"><a href="/">放假日曆</a> › ${path === "/tools/" ? "試算工具" : `<a href="/tools/">試算工具</a> › ${crumb}`}</div>
    <h1>${h1}</h1>
    <div class="meta">更新日期：${(([y, m, d]) => `${+y} 年 ${+m} 月 ${+d} 日`)(updated.split("-"))}</div>
  </div>
${body}${faqHtml}
${path === "/tools/" ? "" : related(path)}
</main>

<footer><a href="/about/">關於我們</a> · <a href="/privacy/">隱私權政策</a> · <a href="/disclosure/">聯盟連結揭露</a><br>${disclaimer || "本站試算結果僅供參考，實際金額以主管機關規定、公司制度及官方系統計算為準。"}</footer>
${scripts ? `<script src="/assets/tools/calc.js?v=10"></script>
<script src="/assets/tools/ui.js?v=15"></script>` : ""}
</body>
</html>
`;
}

const TOOLS = [
  { path: "/tools/income-tax/", name: "所得稅試算", sub: "115 年度綜所稅，明年 5 月報稅用", pill: "報稅",
    ask: "想知道明年報稅要繳多少？", cta: "115 年度綜所稅試算",
    xls: "fangjiatw-income-tax-115.xlsx", xlsName: "115年度綜所稅試算", xlsFor: "個人、家庭估算稅額與退補稅" },
  { path: "/tools/annual-leave/", name: "特休計算機", sub: "輸入到職日，算出今年有幾天特休", pill: "勞工",
    ask: "到職多久了？今年可以休幾天？", cta: "計算可休特休天數",
    xls: "fangjiatw-annual-leave.xlsx", xlsName: "員工特休計算表", xlsFor: "人資一次算多位員工的特休與未休工資" },
  { path: "/tools/overtime/", name: "加班費計算機", sub: "平日、休息日、國定假日加班費", pill: "勞工",
    ask: "平日、休息日加班到底能領多少？", cta: "計算加班費",
    xls: "fangjiatw-overtime.xlsx", xlsName: "加班費計算表", xlsFor: "逐筆記錄加班，自動加總當月加班費" },
  { path: "/tools/workdays/", name: "工作天數計算", sub: "扣掉國定假日＋Excel NETWORKDAYS 公式", pill: "Excel",
    ask: "扣掉國定假日，還有幾個工作天？", cta: "計算工作天數",
    xls: "fangjiatw-workdays.xlsx", xlsName: "工作天數計算表", xlsFor: "算交期、請款天數，內建台灣國定假日" },
  { path: "/tools/insurance/", name: "勞健保費計算機", sub: "勞保、健保、勞退每月扣多少", pill: "薪資",
    ask: "薪水每個月被扣多少勞健保？", cta: "計算勞健保費",
    xls: "fangjiatw-insurance-115.xlsx", xlsName: "115年勞健保勞退計算表", xlsFor: "人資一次算全公司的勞健保、勞退與人事成本" },
  { path: "/tools/take-home-pay/", name: "薪資實領計算", sub: "月薪扣完勞健保、所得稅實際入帳多少", pill: "薪資",
    ask: "月薪 4 萬，實際入帳多少？", cta: "計算實領薪資",
    xls: "fangjiatw-payroll-115.xlsx", xlsName: "115年薪資條試算表", xlsFor: "每月薪資條：應發、各項扣款與實領一次算好" },
  { path: "/tools/severance/", name: "資遣費計算", sub: "新制、舊制、新舊制併用資遣費", pill: "勞工",
    ask: "被資遣了，可以拿多少？", cta: "計算資遣費",
    xls: "fangjiatw-severance.xlsx", xlsName: "資遣費計算表", xlsFor: "人資一次算多位員工的新舊制資遣費與預告期間" },
  { path: "/tools/pension/", name: "勞退退休金試算", sub: "勞退專戶退休時累積多少、月領多少", pill: "退休",
    ask: "退休時勞退專戶有多少錢？", cta: "試算勞退退休金",
    xls: "fangjiatw-pension.xlsx", xlsName: "勞退退休金試算表", xlsFor: "逐年列出提繳、收益與累積，比較自提效果" },
  { path: "/tools/labor-insurance-pension/", name: "勞保老年年金試算", sub: "勞保年金月領多少，加上勞退看退休月收入", pill: "退休",
    ask: "退休後勞保每個月可以領多少？", cta: "試算勞保老年年金",
    xls: "fangjiatw-labor-insurance-pension.xlsx", xlsName: "勞保老年年金試算表", xlsFor: "A/B 式擇優、提前延後、一次請領回本年數" },
  { path: "/tools/loan/", name: "房貸、信貸試算", sub: "每月還多少、總利息、寬限期", pill: "貸款",
    ask: "貸款 1,000 萬，每月要還多少？", cta: "試算每月還款" },
  { path: "/tools/interest/", name: "存款利息計算", sub: "定存、存本取息、零存整付利息", pill: "存款",
    ask: "定存一年可以拿多少利息？", cta: "計算存款利息" },
  { path: "/tools/currency/", name: "匯率換算", sub: "日圓、美元、韓元換台幣多少", pill: "旅遊",
    ask: "1 萬日圓是多少台幣？", cta: "換算匯率" },
  { path: "/tools/unit/", name: "單位換算", sub: "坪、台斤、吋等台灣常用單位", pill: "生活",
    ask: "30 坪是幾平方公尺？", cta: "換算單位" },
];
function related(path) {
  const others = TOOLS.filter(t => t.path !== path).map(t => `      <a href="${t.path}">${t.name}<small>${t.sub}</small></a>`);
  return `
  <section>
    <h2>其他試算工具</h2>
    <div class="related">
${others.join("\n")}
      <a href="/#planner">請假計算器<small>輸入特休天數，排出最長連休</small></a>
      <a href="/2027/qingjia/">2027 全年請假攻略<small>9 個連假一次排好</small></a>
    </div>
  </section>`;
}
const field = (name, label, attrs = "") => `<label class="field">${label}<input name="${name}" inputmode="numeric" ${attrs}></label>`;
const dl = (file, name, what) => `<div class="dl"><a href="/downloads/${file}" download="${name}">⬇ 下載 Excel 範本</a><span>${what}</span></div>`;
const formula = (id, text) => `<div class="formula"><code id="${id}">${text}</code><button type="button" class="copy" data-copy="${id}">複製</button></div>`;

// ---------------- 試算工具總覽 ----------------
const hub = page({
  path: "/tools/", crumb: "試算工具",
  title: "生活計算工具｜報稅、薪資、退休金、房貸、利息、匯率一次搞定", updated: "2026-11-03",
  h1: "生活計算工具<br>報稅、薪資、房貸、匯率一次搞定",
  desc: "不用下載軟體、不用自己研究公式：綜所稅、特休、加班費、薪資實領、勞健保、資遣費、勞退與勞保年金、房貸、存款利息、匯率與單位換算。每項工具附計算說明與 Excel 公式。",
  body: `
  <div class="answer">不用下載軟體、不用自己研究公式，<b>輸入資料就能快速算出結果</b>。每項工具都附計算說明、Excel 公式及<b>免費 Excel 範本</b>。</div>

  <section>
    <h2>你想算什麼？</h2>
    <div class="toolgrid">
${TOOLS.map(t => `      <a href="${t.path}"><span class="pill">${t.pill}</span><b>${t.ask}</b><small>${t.sub}</small><span class="go">${t.cta} →</span></a>`).join("\n")}
    </div>
  </section>

  <section>
    <h2>免費 Excel 試算範本，下載即可使用</h2>
    <p>公式都已經寫好，黃底格子填數字、綠底格子自動計算。適合人資、會計或需要一次算很多筆的人。</p>
    <div class="tbl"><table>
      <thead><tr><th>範本</th><th>適合</th><th>下載</th></tr></thead>
      <tbody>
${TOOLS.filter(t => t.xls).map(t => `        <tr><td>${t.xlsName}</td><td>${t.xlsFor}</td><td><a href="/downloads/${t.xls}" download="${t.xlsName}_放假日曆.xlsx">下載 .xlsx</a></td></tr>`).join("\n")}
      </tbody>
    </table></div>
  </section>


  <section>
    <h2>資料來源與更新紀錄</h2>
    <p>稅額依財政部公告的 115 年度免稅額、扣除額及課稅級距；特休與加班費依勞動基準法；國定假日依人事行政總處公布的辦公日曆表；匯率換算使用每日更新的國際市場參考匯率。規定更新時，我們會同步修正工具與 Excel 範本，並在各工具頁的「法規更新紀錄」註明修法日期、適用年度和官方連結。</p>
    <p class="note">所有計算都在你的瀏覽器裡完成，輸入的薪資、所得、存款等數字不會傳到本站或任何第三方（匯率換算頁只會下載公開的參考匯率）。試算結果僅供參考，個人情況較複雜（例如有股利、海外所得或特殊排班）時，請以官方系統或專業人士的計算為準。</p>
  </section>

  <section>
    <h2>放假與請假</h2>
    <div class="related">
      <a href="/#planner">請假計算器<small>輸入特休天數，排出最長連休</small></a>
      <a href="/2027/chunjie/">2027 春節連假攻略<small>請 5 天休 16 天</small></a>
      <a href="/2027/228/">2027 228 連假攻略<small>請 4 天連休 9 天</small></a>
      <a href="/2027/qingming/">2027 清明連假攻略<small>請 3 天連休 9 天</small></a>
      <a href="/2027/laodong/">2027 勞動節連假攻略<small>請 4 天連休 9 天</small></a>
      <a href="/2027/guoqing/">2027 國慶連假攻略<small>請 4 天休 9 天，接光復節休 17 天</small></a>
      <a href="/2027/guangfu/">2027 光復節連假攻略<small>10/25 週一，請 4 天休 9 天</small></a>
      <a href="/2027/xingxian/">2027 年底行憲跨年連假<small>請 4 天連休 10 天</small></a>
    </div>
  </section>`,
  scripts: false,
});

// ---------------- 所得稅 ----------------
const taxFaq = [
  ["115 年度綜所稅什麼時候申報？", "115 年（2026 年）的所得，在 116 年（2027 年）5 月 1 日到 5 月 31 日申報，實際日期以財政部公告為準。"],
  ["115 年度免稅額是多少？", "每人 10.1 萬元；本人、配偶或受扶養直系尊親屬年滿 70 歲為 15.15 萬元。另依 2026 年 8 月三讀的所得稅法修正，扶養未成年子女的免稅額也提高為每人 15.15 萬元。"],
  ["單身上班族年薪多少以下不用繳稅？", "單身、只有薪資所得、用標準扣除額時，年薪 46.4 萬元以下不用繳稅；如果是全家無自有房屋的租屋族，還可以減除實際支付的房租（最多 18 萬元），年房租達 18 萬元時，年薪 64.4 萬元以下不用繳稅。"],
  ["夫妻要合併還是分開計稅？", "夫妻要合併申報，但稅額可以選擇薪資分開計稅或各類所得分開計稅。報稅系統會自動比較，幫你選最省的方式；本試算也會比較這幾種方式，顯示最省的結果。"],
  ["試算結果和實際報稅不一樣？", "本試算只計算薪資、其他所得和常見的免稅額、扣除額，沒有包含股利、儲蓄投資特別扣除額、教育學費、最低稅負制等項目；基本生活費也暫用 114 年度金額。實際稅額請以財政部報稅系統為準。"],
];
const tax = page({
  path: "/tools/income-tax/", crumb: "所得稅試算",
  title: "2027 報稅試算｜115 年度綜所稅計算機（免稅額、扣除額、級距）",
  h1: "115 年度綜所稅試算<br>明年 5 月報稅前先算一次",
  desc: "115 年度綜合所得稅試算：免稅額 10.1 萬、未成年子女 15.15 萬、標準扣除額 13.6 萬、薪資特別扣除額 22.7 萬，淨所得 61 萬以下稅率 5%。輸入薪資立即算出應納稅額，附 Excel 公式。",
  faq: taxFaq, app: "115 年度綜所稅試算",
  body: `
  <div class="answer">2027 年 5 月申報的是 <b>115 年度</b>所得。115 年度起免稅額、扣除額和級距全面調高，<b>未成年子女免稅額更提高到 15.15 萬</b>。單身租屋族年薪 <b>64.4 萬</b>以下不用繳稅。</div>

  <section>
    <h2>綜所稅試算</h2>
    <form class="tool" data-tool="tax" autocomplete="off">
      <div class="seg" role="group" aria-label="申報身分"><button type="button" data-v="0" aria-pressed="true">單身</button><button type="button" data-v="1" aria-pressed="false">已婚</button></div>
      <fieldset>
        <legend>本人</legend>
        <div class="fields">
          ${field("selfSalary", "全年薪資（元）", 'placeholder="例如 600000"')}
          ${field("selfOther", "其他所得（利息、租金等）")}
        </div>
        <label class="check"><input type="checkbox" name="selfSenior">年滿 70 歲</label>
        <label class="check"><input type="checkbox" name="selfDisabled">領有身心障礙證明</label>
      </fieldset>
      <fieldset data-spouse hidden>
        <legend>配偶</legend>
        <div class="fields">
          ${field("spSalary", "全年薪資（元）")}
          ${field("spOther", "其他所得")}
        </div>
        <label class="check"><input type="checkbox" name="spSenior">年滿 70 歲</label>
        <label class="check"><input type="checkbox" name="spDisabled">領有身心障礙證明</label>
      </fieldset>
      <fieldset>
        <legend>扶養與扣除</legend>
        <div class="fields">
          ${field("minors", "未成年子女（人）")}
          ${field("preschool", "其中 6 歲以下（人）")}
          ${field("adults", "其他扶養親屬（人）")}
          ${field("seniorDeps", "扶養 70 歲以上父母、祖父母（人）")}
          ${field("disabledDeps", "受扶養者有身心障礙證明（人）")}
          ${field("ltc", "符合長期照顧需要（人）")}
          ${field("itemized", "列舉扣除額合計（沒有就空白）")}
          ${field("withheld", "已被扣繳的稅款（選填）")}
          ${field("rent", "全年房租（全家無自有房屋才填）")}
        </div>
      </fieldset>
      <div class="result" id="taxOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">本試算未包含股利、儲蓄投資、教育學費、最低稅負制等項目。<b>基本生活費 115 年度金額尚未公告</b>，暫以 114 年度每人 21.3 萬元計算，只會影響扶養人數多、扣除額少的家庭（詳見下方說明）。計算都在你的瀏覽器裡完成，輸入的數字不會傳到本站。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>115 年度免稅額、扣除額一覽</h2>
    <div class="tbl"><table>
      <thead><tr><th>項目</th><th>115 年度</th><th>114 年度</th></tr></thead>
      <tbody>
        <tr><td>免稅額</td><td class="num">101,000</td><td class="num">97,000</td></tr>
        <tr><td>免稅額：本人、配偶或受扶養直系尊親屬年滿 70 歲</td><td class="num">151,500</td><td class="num">145,500</td></tr>
        <tr><td>免稅額：受扶養未成年子女（2026/8 修法）</td><td class="num">151,500</td><td class="num">97,000</td></tr>
        <tr><td>標準扣除額（單身／有配偶）</td><td class="num">136,000／272,000</td><td class="num">131,000／262,000</td></tr>
        <tr><td>薪資所得特別扣除額</td><td class="num">227,000</td><td class="num">218,000</td></tr>
        <tr><td>身心障礙特別扣除額</td><td class="num">227,000</td><td class="num">218,000</td></tr>
        <tr><td>幼兒學前特別扣除額</td><td class="num">第 1 名 150,000，第 2 名起 225,000</td><td class="num">同左</td></tr>
        <tr><td>長期照顧特別扣除額</td><td class="num">180,000</td><td class="num">180,000</td></tr>
        <tr><td>房屋租金支出特別扣除額</td><td class="num">實際房租，每戶上限 180,000</td><td class="num">同左</td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">幼兒學前、長期照顧及房屋租金支出特別扣除額，適用稅率 20% 以上、選擇股利按 28% 分開計稅，或基本所得額超過 750 萬元者不適用。</p>
  </section>

  <section>
    <h2>法規更新紀錄</h2>
    <div class="tbl"><table>
      <thead><tr><th>日期</th><th>內容</th><th>適用</th></tr></thead>
      <tbody>
        <tr><td class="num">2025/11/27</td><td>財政部公告 115 年度免稅額、標準扣除額、薪資及身障特別扣除額、課稅級距調高（物價上漲 4.13%）</td><td>115 年度</td></tr>
        <tr><td class="num">2026/8/21</td><td>所得稅法修正三讀：受扶養未成年子女免稅額提高 50% 為 151,500 元；勞保、農保等社會保險費不再受每人 2.4 萬元保險費列舉扣除上限限制</td><td>115 年度起</td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">官方來源：<a href="https://www.mof.gov.tw/singlehtml/384fb3077bb349ea973e7fc6f13b6974?cntId=34b463dc8f1b49f29d440d92a6fd5139" rel="nofollow">財政部 115 年度公告</a>、<a href="https://gazette.nat.gov.tw/EG_FileManager/eguploadpub/eg031224/ch04/type3/gov30/num12/Eg.htm" rel="nofollow">行政院公報</a>。本站在規定更新後同步修正試算與 Excel 範本。</p>
  </section>

  <section>
    <h2>房屋租金支出特別扣除額：誰可以扣、能扣多少？</h2>
    <p><b>能扣多少</b>：實際支付的房租，每一申報戶全年最多 18 萬元。年房租 12 萬元就扣 12 萬元，不是一律扣 18 萬。</p>
    <p><b>適用條件</b>：本人、配偶或受扶養直系親屬在國內租屋<b>自住</b>，不是做營業或執行業務使用；而且本人、配偶及受扶養直系親屬在國內<b>沒有自有房屋</b>。</p>
    <p><b>不適用</b>：適用稅率 20% 以上、選擇股利分開計稅，或基本所得額超過 750 萬元。有自有房屋的人原則上不能扣，但因工作、就學、就醫需要異地租屋等少數情況例外，申報前請看財政部說明。</p>
  </section>

  <section>
    <h2>基本生活費差額是什麼？會影響我嗎？</h2>
    <p>政府每年公告「每人基本生活所需費用」。如果全家人數 × 基本生活費，比免稅額、一般扣除額和部分特別扣除額的合計還多，差額可以再從所得中減除。</p>
    <p><b>115 年度的金額目前尚未公告</b>（通常在年底前後公告），本試算暫用 114 年度的每人 21.3 萬元。多數單身或雙薪小家庭用不到這項；<b>扶養人數多、扣除額少的家庭</b>才會受影響。正式金額若調高，實際稅額可能比本試算低一些，公告後我們會更新。</p>
  </section>

  <section>
    <h2>115 年度綜所稅課稅級距</h2>
    <div class="tbl"><table>
      <thead><tr><th>綜合所得淨額</th><th>稅率</th><th>累進差額</th></tr></thead>
      <tbody>
        <tr><td class="num">0～610,000</td><td class="num">5%</td><td class="num">0</td></tr>
        <tr><td class="num">610,001～1,380,000</td><td class="num">12%</td><td class="num">42,700</td></tr>
        <tr><td class="num">1,380,001～2,770,000</td><td class="num">20%</td><td class="num">153,100</td></tr>
        <tr><td class="num">2,770,001～5,190,000</td><td class="num">30%</td><td class="num">430,100</td></tr>
        <tr><td class="num">5,190,001 以上</td><td class="num">40%</td><td class="num">949,100</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px">應納稅額 ＝ 綜合所得淨額 × 稅率 − 累進差額。例如淨額 80 萬元：800,000 × 12% − 42,700 ＝ 53,300 元。</p>
  </section>

  <section>
    <h2>用 Excel 算綜所稅</h2>
    ${dl("fangjiatw-income-tax-115.xlsx", "115年度綜所稅試算_放假日曆.xlsx", "公式都已寫好，填入薪資和扶養人數就會算出稅額。")}
    <p>把綜合所得淨額放在 A2，這條公式會自動套用正確級距：</p>
    ${formula("taxFormula", "=MAX(A2*{0.05,0.12,0.2,0.3,0.4}-{0,42700,153100,430100,949100},0)")}
    <p style="margin-top:12px"><b>原理</b>：公式同時用 5 個級距去算「淨額 × 稅率 − 累進差額」，正確的那一級一定是最大值，所以取 MAX 就好，不用寫一長串 IF。</p>
    <p>綜合所得淨額可以這樣算（單身、標準扣除額，薪資在 B2）：</p>
    ${formula("netFormula", "=MAX(B2-101000-136000-MIN(B2,227000),0)")}
    <p style="margin-top:12px">有房子的人，11 月還有地價稅要繳，可以看<a href="/2026/land-value-tax/">2026 地價稅怎麼算</a>。</p>
  </section>`,
});

// ---------------- 特休 ----------------
const leaveFaq = [
  ["到職滿半年有特休嗎？", "有。依勞基法第 38 條，工作滿 6 個月未滿 1 年有 3 天特休。"],
  ["特休天數怎麼算？", "滿 6 個月 3 天、滿 1 年 7 天、滿 2 年 10 天、滿 3 年 14 天、滿 5 年 15 天；滿 10 年起每多 1 年加 1 天，最多 30 天。"],
  ["特休沒休完怎麼辦？", "年度終結或離職時沒休完的特休，雇主應該發給工資；也可以經勞雇雙方協商，遞延到下一個年度休，遞延的天數到下一年度結束仍沒休完，就要發給工資。"],
  ["公司用曆年制算特休合法嗎？", "可以。勞基法允許雇主用曆年制、會計年度等方式計算，但給的天數不能少於週年制。本工具以法定的週年制計算。"],
];
const leave = page({
  path: "/tools/annual-leave/", crumb: "特休計算機",
  title: "特休計算機｜輸入到職日算特休天數（勞基法週年制）",
  h1: "特休計算機<br>輸入到職日，算出今年幾天特休",
  desc: "特休天數計算機：輸入到職日，依勞基法第 38 條算出今年特休天數、下一次增加日期，以及未休特休可折算的工資，附 Excel 公式。",
  faq: leaveFaq, app: "特休計算機",
  body: `
  <div class="answer">依勞基法，工作滿 <b>6 個月有 3 天</b>特休、<b>滿 1 年 7 天</b>、滿 2 年 10 天，<b>滿 3 年 14 天</b>、滿 5 年 15 天，之後每多一年加一天，<b>最多 30 天</b>。</div>

  <section>
    <h2>特休天數計算</h2>
    <form class="tool" data-tool="leave" autocomplete="off">
      <div class="fields">
        <label class="field">到職日<input type="date" name="hire" min="1970-01-01"></label>
        <label class="field">計算日（預設今天）<input type="date" name="asOf"></label>
        ${field("used", "今年已休（天，選填）")}
        ${field("salary", "月薪（選填，算未休工資）")}
      </div>
      <div class="result" id="leaveOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">本工具以法定週年制計算；公司若採曆年制，天數分配會不同，但全年合計不得少於週年制。</p>
  </section>

  <section>
    <h2>知道特休天數之後</h2>
    <p>特休請在連假旁邊最划算。2027 年請 5 天特休，春節就能連休 16 天。用<a href="/#planner">請假計算器</a>輸入你的特休天數，自動排出全年最長的連假。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>勞基法特休天數表</h2>
    <div class="tbl"><table>
      <thead><tr><th>年資</th><th>特休天數</th></tr></thead>
      <tbody>
        <tr><td>6 個月以上，未滿 1 年</td><td class="num">3 天</td></tr>
        <tr><td>1 年以上，未滿 2 年</td><td class="num">7 天</td></tr>
        <tr><td>2 年以上，未滿 3 年</td><td class="num">10 天</td></tr>
        <tr><td>3 年以上，未滿 5 年</td><td class="num">每年 14 天</td></tr>
        <tr><td>5 年以上，未滿 10 年</td><td class="num">每年 15 天</td></tr>
        <tr><td>10 年以上</td><td class="num">每 1 年加 1 天，最多 30 天</td></tr>
      </tbody>
    </table></div>
  </section>

  <section>
    <h2>週年制和曆年制差在哪？</h2>
    <p><b>週年制</b>是勞基法的基本算法：以到職日為準，每滿一個週年取得一次特休。例如 2025/7/1 到職，2026/1/1 滿半年取得 3 天、2026/7/1 滿 1 年取得 7 天。</p>
    <p><b>曆年制</b>是很多公司為了方便管理，改用每年 1/1 一起計算。常見做法是把每個週年的特休，依落在各年度的天數比例分配。同一個例子，2026 年會分到 3 天 ＋ 7 天的一半 ＝ 6.5 天，剩下的 3.5 天算在 2027 年。</p>
    <p>兩種制度短期內每年的天數不同，但<b>長期合計不能少於週年制</b>。上方工具輸入到職日後，會列出近幾年兩種制度的天數比較。</p>
  </section>

  <section>
    <h2>特休沒休完，可以換錢嗎？</h2>
    <p>可以。年度結束或離職時還沒休完的特休，<b>雇主應該發給工資</b>。依勞基法施行細則，一日工資是以<b>年度終結或離職前最近一個月「正常工作時間」所得的工資 ÷ 30</b> 計算。</p>
    <p>「正常工作時間工資」包含本薪和每月固定發給的津貼（例如職務加給），但不含加班費，也不含年終獎金、三節獎金這類非經常性給與。本工具用你輸入的月薪 ÷ 30 估算，若有固定津貼，請一起加進月薪。</p>
    <p>另外，勞雇雙方也可以協商把沒休完的特休<b>遞延到下一年度</b>；遞延的天數到下一年度結束還沒休完，一樣要發給工資。</p>
  </section>

  <section>
    <h2>用 Excel 算年資和特休</h2>
    ${dl("fangjiatw-annual-leave.xlsx", "員工特休計算表_放假日曆.xlsx", "人資適用：一次填入多位員工的到職日，自動算出特休、下次增加日和未休工資。")}
    <p>到職日在 A2，B2 先算出年資（滿幾個月）：</p>
    ${formula("monthFormula", '=DATEDIF(A2,TODAY(),"M")')}
    <p style="margin-top:12px">C2 依年資換算成特休天數：</p>
    ${formula("leaveDaysFormula", "=IF(B2<6,0,IF(B2<12,3,IF(B2<24,7,IF(B2<36,10,IF(B2<60,14,IF(B2<120,15,MIN(30,6+INT(B2/12))))))))")}
    <p style="margin-top:12px">滿 10 年以後，特休 ＝ 15 ＋（年資 − 9），也就是「6 ＋ 年資」，最多 30 天，所以最後一段寫成 MIN(30, 6 + 年資)。</p>
    <p>你剛才輸入的到職日，換成 Excel 算年資（滿幾年）是：</p>
    ${formula("leaveFormula", '=DATEDIF(DATE(2020,1,1),TODAY(),"Y")')}
  </section>`,
});

// ---------------- 加班費 ----------------
const otFaq = [
  ["加班費的時薪怎麼算？", "月薪制的平日每小時工資，一般以月薪 ÷ 30 ÷ 8，也就是月薪 ÷ 240 計算。月薪應包含經常性給與，例如固定發放的津貼。"],
  ["平日加班費怎麼算？", "平日加班前 2 小時，每小時給時薪的 1⅓ 倍；第 3、4 小時給 1⅔ 倍。平日加班一天最多 4 小時。"],
  ["休息日加班費怎麼算？", "休息日（通常是週六）出勤，前 2 小時每小時給 1⅓ 倍，第 3 到 8 小時給 1⅔ 倍，第 9 到 12 小時給 2⅔ 倍，按實際工作時數計算。"],
  ["國定假日上班怎麼算？", "國定假日出勤，工作 8 小時以內，月薪制勞工要再加發 1 日工資；超過 8 小時的部分，按平日加班的 1⅓、1⅔ 倍計算。"],
  ["加班可以換補休嗎？", "可以，但要由勞工自己選擇，雇主不能強制。補休期限由勞雇雙方協商，期限到了還沒休完，雇主要依加班當時的標準發給加班費。"],
  ["月薪 36,000 元，加班一小時多少錢？", "時薪是 36,000 ÷ 240 ＝ 150 元。平日加班第 1、2 小時每小時 200 元（150 × 1⅓），第 3、4 小時每小時 250 元（150 × 1⅔）。"],
  ["月薪 36,000 元，休息日加班 8 小時多少錢？", "前 2 小時 2 × 200 ＝ 400 元，第 3 到 8 小時 6 × 250 ＝ 1,500 元，合計 1,900 元。"],
];
const overtime = page({
  path: "/tools/overtime/", crumb: "加班費計算機",
  title: "加班費計算機｜平日、休息日、國定假日加班費怎麼算",
  h1: "加班費計算機<br>平日、休息日、國定假日一次算",
  desc: "加班費計算機：輸入月薪與加班時數，依勞基法算出平日加班（1⅓、1⅔ 倍）、休息日加班與國定假日出勤的加班費，附 Excel 公式。",
  faq: otFaq, app: "加班費計算機",
  body: `
  <div class="answer">時薪 ＝（月薪＋固定津貼）÷ 240。<b>平日加班</b>前 2 小時 1⅓ 倍、再 2 小時 1⅔ 倍；<b>休息日</b>前 2 小時 1⅓ 倍、3～8 小時 1⅔ 倍、9～12 小時 2⅔ 倍；<b>國定假日</b>出勤加發 1 日工資。</div>

  <section>
    <h2>加班費試算</h2>
    <form class="tool" data-tool="overtime" autocomplete="off">
      <div class="fields">${field("salary", "月薪（本薪，元）", 'placeholder="例如 36000"')}${field("allow", "每月固定津貼（選填）")}</div>
      <fieldset>
        <legend>平日加班（正常工作日下班後）</legend>
        <div class="fields">${field("wdH", "每次幾小時（最多 4）")}${field("wdN", "幾次", 'value="1"')}</div>
      </fieldset>
      <fieldset>
        <legend>休息日加班（依公司排班，常見是週六）</legend>
        <div class="fields">${field("rdH", "每次幾小時（最多 12）")}${field("rdN", "幾次", 'value="1"')}</div>
      </fieldset>
      <fieldset>
        <legend>國定假日出勤</legend>
        <div class="fields">${field("hdH", "每次幾小時（最多 12）")}${field("hdN", "幾次", 'value="1"')}</div>
      </fieldset>
      <div class="result" id="otOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">本工具適用一般月薪制勞工；變形工時、責任制或排班制行業規定不同，請以勞動契約及勞動部說明為準。</p>
  </section>

  <section>
    <h2>實際算一次：月薪 36,000 元</h2>
    <p>時薪 ＝ 36,000 ÷ 240 ＝ <b>150 元</b>。</p>
    <div class="tbl"><table>
      <thead><tr><th>情況</th><th>計算過程</th><th>加班費</th></tr></thead>
      <tbody>
        <tr><td>平日加班 3 小時</td><td class="num">2 × 150 × 1⅓ ＋ 1 × 150 × 1⅔ ＝ 400 ＋ 250</td><td class="num">650 元</td></tr>
        <tr><td>休息日加班 8 小時</td><td class="num">2 × 150 × 1⅓ ＋ 6 × 150 × 1⅔ ＝ 400 ＋ 1,500</td><td class="num">1,900 元</td></tr>
        <tr><td>國定假日上班 8 小時</td><td class="num">加發 1 日工資 ＝ 150 × 8</td><td class="num">1,200 元</td></tr>
        <tr><td>國定假日上班 10 小時</td><td class="num">1,200 ＋ 2 × 150 × 1⅓ ＝ 1,200 ＋ 400</td><td class="num">1,600 元</td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">國定假日的 1,200 元是月薪以外「另外加發」的金額；那天原本的薪水已經包含在月薪裡。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>時薪要用哪些薪水來算？</h2>
    <p>加班費的時薪是「平日每小時工資額」，計算基礎是<b>正常工作時間的工資</b>，也就是本薪加上<b>每月固定發給的津貼</b>，例如職務加給、固定的伙食津貼、全勤獎金等經常性給與。</p>
    <p><b>不算進去的</b>：年終獎金、三節獎金、績效紅利這類非經常性給與，以及加班費本身。</p>
    <p>所以如果你的薪資單上有固定津貼，請填進上方的「每月固定津貼」，算出的時薪和加班費才會正確。</p>
  </section>

  <section>
    <h2>工作日、休息日、例假、國定假日怎麼分？</h2>
    <div class="tbl"><table>
      <thead><tr><th>類型</th><th>是什麼</th><th>出勤怎麼算</th></tr></thead>
      <tbody>
        <tr><td>工作日</td><td>正常上班的日子</td><td>下班後加班，按平日加班計算</td></tr>
        <tr><td>休息日</td><td>每 7 天中的 1 天，由公司排定（常見是週六）</td><td>可以請勞工出勤，按休息日加班計算</td></tr>
        <tr><td>例假</td><td>每 7 天中的另 1 天，由公司排定（常見是週日）</td><td>原則上不能叫勞工上班，只有天災、事變等特殊情況例外</td></tr>
        <tr><td>國定假日</td><td>勞基法規定的紀念日、節日與勞動節</td><td>出勤加發 1 日工資</td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">休息日和例假<b>不一定是週六、週日</b>，要看公司的排班。輪班、排班制的人請依自己的班表判斷。</p>
  </section>

  <section>
    <h2>加班費倍率一覽</h2>
    <div class="tbl"><table>
      <thead><tr><th>情況</th><th>時數</th><th>每小時給</th></tr></thead>
      <tbody>
        <tr><td>平日加班</td><td class="num">第 1～2 小時</td><td class="num">時薪 × 1⅓</td></tr>
        <tr><td>平日加班</td><td class="num">第 3～4 小時</td><td class="num">時薪 × 1⅔</td></tr>
        <tr><td>休息日加班</td><td class="num">第 1～2 小時</td><td class="num">時薪 × 1⅓</td></tr>
        <tr><td>休息日加班</td><td class="num">第 3～8 小時</td><td class="num">時薪 × 1⅔</td></tr>
        <tr><td>休息日加班</td><td class="num">第 9～12 小時</td><td class="num">時薪 × 2⅔</td></tr>
        <tr><td>國定假日出勤</td><td class="num">8 小時以內</td><td class="num">加發 1 日工資</td></tr>
        <tr><td>國定假日出勤</td><td class="num">超過 8 小時</td><td class="num">同平日加班</td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">例假（通常是週日）除天災、事變等特殊情況外，雇主不得要求勞工出勤。</p>
  </section>

  <section>
    <h2>國定假日上班，要特別注意補假</h2>
    <p>國定假日遇到週末時，政府機關會在週五或週一補假，但<b>民間企業的補假日期由勞雇雙方協商</b>，不一定和政府相同。公司安排的補假日如果要上班，視同國定假日出勤。2027 年各連假的補假日期，可以看<a href="/#calendar">全年行事曆</a>。</p>
  </section>

  <section>
    <h2>用 Excel 算加班費</h2>
    ${dl("fangjiatw-overtime.xlsx", "加班費計算表_放假日曆.xlsx", "每次加班記一列，自動算出每筆加班費和當月合計，附國定假日清單。")}
    <p>時薪在 A2、平日加班時數在 B2：</p>
    ${formula("wdFormula", "=A2*(MIN(B2,2)*4/3+MAX(MIN(B2,4)-2,0)*5/3)")}
    <p style="margin-top:12px">休息日加班時數在 C2：</p>
    ${formula("rdFormula", "=A2*(MIN(C2,2)*4/3+MAX(MIN(C2,8)-2,0)*5/3+MAX(MIN(C2,12)-8,0)*8/3)")}
    <p style="margin-top:12px"><b>原理</b>：MIN 和 MAX 把時數切成幾段，每段乘上自己的倍率再加總。例如 MAX(MIN(B2,4)-2,0) 就是「第 3、4 小時有幾小時」。</p>
  </section>`,
});

// ---------------- 工作天數 ----------------
const wdFaq = [
  ["NETWORKDAYS 會把開始和結束那天算進去嗎？", "會。NETWORKDAYS 計算的天數包含開始日和結束日；WORKDAY 則是從開始日的下一個工作天開始數。"],
  ["2026、2027 年有補班日嗎？", "沒有。2026、2027 年政府行政機關辦公日曆表都沒有補班日，所以只要扣掉週末和平日放假的國定假日、補假就好。"],
  ["一週只休週日，怎麼算工作天？", "用 NETWORKDAYS.INTL，週末參數填 \"0000001\"（從週一到週日，1 代表休息），公式為 =NETWORKDAYS.INTL(A2,B2,\"0000001\",假日!A:A)。"],
  ["民間企業的國定假日跟政府一樣嗎？", "國定假日本身相同，但遇到週末時，民間企業的補假日期由勞雇雙方協商，不一定和政府機關相同。請依公司公告調整假日清單。"],
];
const workdays = page({
  path: "/tools/workdays/", crumb: "工作天數計算",
  title: "工作天數計算機｜扣除台灣國定假日＋Excel NETWORKDAYS 公式（2026–2027）",
  h1: "工作天數計算<br>扣掉國定假日＋Excel 公式",
  desc: "工作天數計算機：輸入兩個日期，自動扣除週末與台灣國定假日、補假，算出工作天數；也能算 N 個工作天後是哪天。提供 2026–2027 台灣假日清單，搭配 Excel NETWORKDAYS、WORKDAY 公式。",
  faq: wdFaq, app: "工作天數計算機",
  body: `
  <div class="answer">依人事行政總處公布的辦公日曆表，2026 年共有 <b>245 個</b>工作天，2027 年共有 <b>244 個</b>（扣除週末、國定假日與補假，兩年都沒有補班日）。下面的工具能算任兩個日期之間的工作天數，也附上可直接貼進 Excel 的<b>台灣假日清單</b>。</div>

  <section>
    <h2>工作天數計算</h2>
    <form class="tool" data-tool="workdays" autocomplete="off">
      <fieldset>
        <legend>兩個日期之間有幾個工作天？</legend>
        <div class="fields">
          <label class="field">開始日<input type="date" name="from" value="2027-01-01"></label>
          <label class="field">結束日<input type="date" name="to" value="2027-01-31"></label>
        </div>
      </fieldset>
      <fieldset>
        <legend>公司的休假規則（選填）</legend>
        <label class="check"><input type="checkbox" name="sixDay">只休週日（週六要上班）</label>
        <label class="field">公司額外放假日（例如公司紀念日、民間補假日），一行一個或用逗號分隔，格式 2027/3/15
          <textarea name="extra" rows="2" style="font:inherit;font-size:1rem;color:var(--ink);background:var(--paper);border:1px solid var(--rule);border-radius:6px;padding:9px 10px;width:100%;box-sizing:border-box"></textarea></label>
      </fieldset>
      <div class="result" id="wdOut" aria-live="polite"></div>
      <fieldset>
        <legend>N 個工作天後是哪一天？</legend>
        <div class="fields">
          <label class="field">起始日<input type="date" name="start" value="2027-02-01"></label>
          ${field("n", "幾個工作天", 'value="10"')}
        </div>
      </fieldset>
      <div class="result" id="addOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">以人事行政總處辦公日曆表計算，涵蓋 2026～2027 年。民間企業的補假日期可能不同，可以用上方「公司額外放假日」自行加入。</p>
  </section>

  <section>
    <h2>2026、2027 年國定假日與補假完整清單</h2>
    <p>以下是本工具和 Excel 範本共用的同一份假日資料。資料來源：<a href="https://www.dgpa.gov.tw/" rel="nofollow">行政院人事行政總處</a>「中華民國 115 年、116 年政府行政機關辦公日曆表」，最後同步日期：2026 年 11 月 1 日。</p>
    <div class="tbl"><table>
      <thead><tr><th>日期</th><th>星期</th><th>名稱</th></tr></thead>
      <tbody>
${Object.entries(TW_HOL).sort().map(([k, n]) => { const d = new Date(k + "T00:00"); return `        <tr><td class="num">${k.replace(/-/g, "/")}</td><td>${"日一二三四五六"[d.getDay()]}</td><td${n.includes("補假") ? ' class="mk"' : ""}>${n}</td></tr>`; }).join("\n")}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">落在週末的假日也列出來供參考；計算工作天數時，週末本來就會扣掉。想看月曆形式，請到 <a href="/#calendar">2027 全年行事曆</a>。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>用 Excel 算工作天數（扣台灣國定假日）</h2>
    ${dl("fangjiatw-workdays.xlsx", "工作天數計算表_放假日曆.xlsx", "已內建 2026～2027 台灣國定假日清單，填入日期就能算，週休二日和單休都有。")}
    <p style="margin-top:12px">想自己做的話，照下面三步：</p>
    <p><b>第 1 步</b>：在 Excel 新增一個工作表，命名為「假日」，把下面的清單複製貼到 A 欄。清單只列出<b>平日</b>放假的國定假日和補假（週末本來就會被扣掉）。</p>
    <div class="formula"><textarea id="holList" class="field" rows="6" readonly style="flex:1;min-width:0;font-family:var(--f-num);font-size:.9rem;background:var(--paper);color:var(--ink);border:1px solid var(--rule);border-radius:6px;padding:9px 10px"></textarea><button type="button" class="copy" data-copy="holList">複製清單</button></div>
    <p style="margin-top:12px"><b>第 2 步</b>：開始日在 A2、結束日在 B2，計算工作天數：</p>
    ${formula("nwFormula", "=NETWORKDAYS(A2,B2,假日!A:A)")}
    <p style="margin-top:12px"><b>第 3 步</b>：想知道 A2 之後第 10 個工作天是哪天，用 WORKDAY：</p>
    ${formula("wkFormula", "=WORKDAY(A2,10,假日!A:A)")}
    <p style="margin-top:12px">如果公司是<b>單休</b>（只休週日），改用 NETWORKDAYS.INTL，第三個參數的 7 個數字依序代表週一到週日，1 是休息：</p>
    ${formula("intlFormula", '=NETWORKDAYS.INTL(A2,B2,"0000001",假日!A:A)')}
  </section>

  <section>
    <h2>為什麼不能只用 NETWORKDAYS？</h2>
    <p>NETWORKDAYS 預設只會扣掉週六、週日，<b>不知道台灣的國定假日</b>。像 2027 年 2 月有春節，如果不加假日清單，會多算 5 個工作天，算交期、請款天數就會出錯。</p>
    <p>另外，以前有補班日的年份，NETWORKDAYS 無法把「週六要上班」加回來，要另外處理。好消息是 <b>2026、2027 年都沒有補班日</b>，照上面的做法就能算準。</p>
  </section>`,
});

// ---------------- 勞健保 ----------------
const INS = require_("../assets/tools/calc.js");
const sampleRows = [29500, 32000, 36000, 40000, 45000, 50000, 60000, 80000, 100000].map(s => {
  const r = INS.laborIns({ salary: s });
  return `        <tr><td class="num">${s.toLocaleString()}</td><td class="num">${(r.li.emp + r.ei.emp).toLocaleString()}</td><td class="num">${r.nhi.emp.toLocaleString()}</td><td class="num">${r.pen.er.toLocaleString()}</td><td class="num">${(r.li.emp + r.ei.emp + r.nhi.emp).toLocaleString()}</td></tr>`;
}).join("\n");
const insFaq = [
  ["2026 年勞保費率是多少？", "勞保普通事故保險費率 11.5%，加上就業保險費率 1%，合計 12.5%。勞工負擔 20%、雇主 70%、政府 10%。"],
  ["月薪 36,000 元，勞健保要扣多少？", "勞保投保級距 36,300 元，勞保加就保自付 908 元；健保投保級距 36,300 元，本人自付 563 元。合計每月約扣 1,471 元，不含勞退自提。"],
  ["月薪超過 45,800 元，勞保費會一直增加嗎？", "不會。勞保投保薪資最高 45,800 元，月薪超過 43,900 元就按最高級距計算；但健保最高到 313,000 元、勞退提繳工資最高到 150,000 元，會隨薪水增加。"],
  ["健保眷屬要另外付錢嗎？", "要。每多 1 位眷屬，就多 1 份本人的健保費，最多算 3 口；超過 3 口的眷屬不用再加錢。"],
  ["勞退自提划算嗎？", "勞退自提最多 6%，會存進你的勞退個人專戶，而且自提金額可以從當年度薪資所得中全數減除，等於少繳一些所得稅；缺點是要到 60 歲才能領出來。"],
];
const insurance = page({
  path: "/tools/insurance/", crumb: "勞健保費計算機",
  title: "勞健保費計算機｜2026 勞保、健保、勞退自付額試算（115 年級距）",
  h1: "勞健保費計算機<br>薪水每個月被扣多少？",
  desc: "2026（115 年）勞健保費計算機：輸入月薪，依官方投保級距算出勞保、就保、健保個人自付額、雇主負擔與勞退 6% 提繳，含眷屬與勞退自提，附 Excel 範本。",
  faq: insFaq, app: "勞健保費計算機",
  body: `
  <div class="answer">2026 年基本工資 <b>29,500 元</b>。勞保＋就保費率 <b>12.5%</b>（你付 20%），健保費率 <b>5.17%</b>（你付 30%），公司另外幫你提繳 <b>6% 勞退</b>。月薪 3 萬左右，每月勞健保自付大約 <b>1,200～1,300 元</b>。</div>

  <section>
    <h2>勞健保費試算</h2>
    <form class="tool" data-tool="insurance" autocomplete="off">
      <div class="fields">
        ${field("salary", "月薪（含固定津貼，元）", 'placeholder="例如 36000"')}
        <label class="field">健保眷屬人數<select name="deps"><option value="0">0（只有本人）</option><option value="1">1 人</option><option value="2">2 人</option><option value="3">3 人以上</option></select></label>
        <label class="field">勞退自提<select name="selfPct">${[0,1,2,3,4,5,6].map(v => `<option value="${v}">${v}%</option>`).join("")}</select></label>
      </div>
      <label class="check"><input type="checkbox" name="noEI">不適用就業保險（例如年滿 65 歲、已領勞保老年給付、外籍人士）</label>
      <div class="result" id="insOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">依勞保局、健保署公告的 115 年 1 月 1 日起投保級距計算，適用一般全職受僱勞工。職災保險費由公司全額負擔，未列入。計算都在你的瀏覽器裡完成。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>常見月薪的勞健保自付額</h2>
    <div class="tbl"><table>
      <thead><tr><th>月薪</th><th>勞保＋就保自付</th><th>健保自付（本人）</th><th>公司提繳勞退</th><th>每月自付合計</th></tr></thead>
      <tbody>
${sampleRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">每多 1 位健保眷屬，健保自付再加 1 份本人金額（最多加 3 份）。</p>
  </section>

  <section>
    <h2>勞健保費怎麼算？</h2>
    <p><b>第 1 步：找投保級距</b>。把月薪（含固定津貼、全勤獎金等經常性給與）對到分級表，<b>往上取最接近的級距</b>。例如月薪 36,000 元，勞保、健保都落在 36,300 元這一級。</p>
    <p><b>第 2 步：乘上費率和負擔比例</b>：</p>
    <div class="tbl"><table>
      <thead><tr><th>項目</th><th>費率</th><th>你付</th><th>公司付</th><th>級距上限</th></tr></thead>
      <tbody>
        <tr><td>勞保（普通事故）</td><td class="num">11.5%</td><td class="num">20%</td><td class="num">70%</td><td class="num">45,800</td></tr>
        <tr><td>就業保險</td><td class="num">1%</td><td class="num">20%</td><td class="num">70%</td><td class="num">45,800</td></tr>
        <tr><td>健保</td><td class="num">5.17%</td><td class="num">30% ×（1＋眷屬數）</td><td class="num">60% × 1.56</td><td class="num">313,000</td></tr>
        <tr><td>勞退</td><td class="num">6%</td><td class="num">自提 0～6%</td><td class="num">6%</td><td class="num">150,000</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px">以月薪 36,000 元為例：勞保 36,300 × 11.5% × 20% ＝ 835 元，就保 36,300 × 1% × 20% ＝ 73 元，健保 36,300 × 5.17% × 30% ＝ 563 元，<b>合計 1,471 元</b>。</p>
    <p class="note">公司的健保負擔乘以 1.56，是因為要幫員工的「平均眷口數 0.56 人」一起付。</p>
  </section>

  <section>
    <h2>2026 年勞保投保薪資分級表</h2>
    <div class="tbl"><table>
      <thead><tr><th>等級</th><th>月薪資總額</th><th>月投保薪資</th></tr></thead>
      <tbody>
${INS.INS115.li.map(([cap, g], i, a) => `        <tr><td>第 ${i + 1} 級</td><td class="num">${i === 0 ? "29,500 以下" : `${(a[i - 1][0] + 1).toLocaleString()}${cap === Infinity ? " 以上" : "～" + cap.toLocaleString()}`}</td><td class="num">${g.toLocaleString()}</td></tr>`).join("\n")}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">注意第 11 級：月薪 43,901 元以上就直接按 45,800 元投保。來源：<a href="https://www.bli.gov.tw/0005475.html" rel="nofollow">勞保局勞工保險投保薪資分級表</a>（115 年 1 月 1 日施行）。</p>
  </section>

  <section>
    <h2>報稅時，勞健保費可以扣除</h2>
    <p>你自己繳的勞保、就保、健保費，報稅時可以列入「保險費列舉扣除額」。健保費沒有上限；2026 年修法後，勞保等社會保險費也不再受每人 2.4 萬元的限制。勞退自提則是直接從薪資所得中減除。想知道明年要繳多少稅，可以用<a href="/tools/income-tax/">所得稅試算</a>。</p>
  </section>

  <section>
    <h2>用 Excel 算勞健保</h2>
    ${dl("fangjiatw-insurance-115.xlsx", "115年勞健保勞退計算表_放假日曆.xlsx", "內建 115 年勞保、健保、勞退三張官方級距表，輸入員工月薪和眷屬人數，自動算出每人自付額與公司成本。")}
    <p>級距表放在「級距」工作表，月薪在 B2 時，健保投保金額可以用「往上找最接近級距」的公式：</p>
    ${formula("nhiGradeFormula", "=INDEX(級距!C:C,MATCH(TRUE,INDEX(級距!C2:C59>=B2,0),0)+1)")}
    <p style="margin-top:12px">勞保自付（含就保）：</p>
    ${formula("liFormula", "=ROUND(C2*11.5%*20%,0)+ROUND(C2*1%*20%,0)")}
    <p style="margin-top:12px">C2 是勞保投保薪資。勞保和就保要<b>分開四捨五入</b>再相加，才會和勞保局的分擔金額表一致。</p>
  </section>`,
});

// ---------------- 薪資實領 ----------------
const payRows = [29500, 33000, 36000, 40000, 45000, 50000, 60000, 80000].map(s => {
  const r = INS.netPay({ salary: s });
  return `        <tr><td class="num">${s.toLocaleString()}</td><td class="num">${(r.ins.li.emp + r.ins.ei.emp).toLocaleString()}</td><td class="num">${r.ins.nhi.emp.toLocaleString()}</td><td class="num">${r.net.toLocaleString()}</td></tr>`;
}).join("\n");
const ex40 = INS.netPay({ salary: 40000 });
const payFaq = [
  ["月薪 40,000 元，實領多少？", `沒有眷屬、沒有勞退自提時，每月扣勞保＋就保 ${(ex40.ins.li.emp + ex40.ins.ei.emp).toLocaleString()} 元、健保 ${ex40.ins.nhi.emp.toLocaleString()} 元，實領約 ${ex40.net.toLocaleString()} 元；月薪未達起扣標準，不會預扣所得稅。`],
  ["薪水多少才會被預扣所得稅？", "有填免稅額申報表、按扣繳稅額表扣繳時，2026 年月薪 90,501 元以上（無配偶及受扶養親屬）才開始預扣，扶養人數越多起扣點越高。選擇按 5% 扣繳時，5% 稅額超過 2,000 元，也就是月薪超過約 4 萬元就會扣。"],
  ["年終獎金會被扣稅嗎？", "單次發放達 90,501 元以上，公司要先預扣 5% 所得稅；未達就不扣。另外，今年獎金累計超過健保投保金額 4 倍的部分，還要扣 2.11% 二代健保補充保費。"],
  ["加班費要扣稅嗎？", "依法給付的加班費，每月 46 小時以內免稅，不會預扣所得稅，也不用計入勞健保投保薪資。"],
  ["預扣的所得稅可以退嗎？", "可以。預扣只是先繳，明年 5 月申報綜所稅時會和實際應納稅額比較，扣多了就退稅、扣少了就補稅。"],
];
const takeHome = page({
  path: "/tools/take-home-pay/", crumb: "薪資實領計算",
  title: "薪資實領計算機｜月薪扣完勞健保、所得稅實際入帳多少（2026）",
  h1: "薪資實領計算<br>月薪扣完之後，實際入帳多少？",
  desc: "2026 薪資實領計算機：輸入月薪、加班費、獎金，依 115 年勞健保級距、薪資扣繳規定與二代健保補充保費，算出每月實際入帳金額，附薪資條 Excel 範本。",
  faq: payFaq, app: "薪資實領計算機",
  body: `
  <div class="answer">實領 ＝ 月薪＋加班費＋獎金 −（勞保＋就保＋健保＋勞退自提）− 所得稅預扣 − 補充保費。月薪 4 萬、沒有眷屬，<b>每月約實領 ${ex40.net.toLocaleString()} 元</b>；月薪未達 <b>90,501 元</b>，通常不會預扣所得稅。</div>

  <section>
    <h2>薪資實領試算</h2>
    <form class="tool" data-tool="pay" autocomplete="off">
      <fieldset>
        <legend>本月應發</legend>
        <div class="fields">
          ${field("salary", "月薪（本薪＋固定津貼）", 'placeholder="例如 40000"')}
          ${field("overtime", "加班費（選填）")}
          ${field("bonus", "本月獎金（選填，如年終）")}
          ${field("bonusYTD", "今年之前已領獎金（選填）")}
        </div>
      </fieldset>
      <fieldset>
        <legend>扣款設定</legend>
        <div class="fields">
          <label class="field">健保眷屬人數<select name="deps"><option value="0">0（只有本人）</option><option value="1">1 人</option><option value="2">2 人</option><option value="3">3 人以上</option></select></label>
          <label class="field">勞退自提<select name="selfPct">${[0,1,2,3,4,5,6].map(v => `<option value="${v}">${v}%</option>`).join("")}</select></label>
          <label class="field">所得稅預扣方式<select name="taxMethod"><option value="table">依扣繳稅額表（有填免稅額申報表）</option><option value="five">按月薪 5% 扣繳</option></select></label>
          <span id="taxManualWrap" hidden>${field("taxManual", "薪資單上的所得稅（元）")}</span>
          ${field("other", "其他扣款（福利金、伙食費等）")}
        </div>
        <label class="check"><input type="checkbox" name="noEI">不適用就業保險（例如年滿 65 歲、外籍人士）</label>
      </fieldset>
      <div class="result" id="payOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">依 115 年勞健保級距、財政部薪資扣繳規定計算，適用一般全職受僱勞工。計算都在你的瀏覽器裡完成。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>常見月薪實領對照表</h2>
    <div class="tbl"><table>
      <thead><tr><th>月薪</th><th>勞保＋就保</th><th>健保（本人）</th><th>實領</th></tr></thead>
      <tbody>
${payRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">沒有眷屬、沒有勞退自提、依扣繳稅額表（月薪未達起扣標準不預扣）的情況。勞退 6% 由公司另外提繳，不從薪水扣。</p>
  </section>

  <section>
    <h2>薪水會被扣哪些錢？</h2>
    <div class="tbl"><table>
      <thead><tr><th>項目</th><th>怎麼算</th><th>可以少扣嗎？</th></tr></thead>
      <tbody>
        <tr><td>勞保＋就保</td><td>投保薪資 × 12.5% × 20%</td><td>不行，依薪資對應級距</td></tr>
        <tr><td>健保</td><td>投保金額 × 5.17% × 30% ×（1＋眷屬數）</td><td>眷屬可以改依附有工作的家人投保</td></tr>
        <tr><td>勞退自提</td><td>自己選 0～6%</td><td>可以，自提是自願的</td></tr>
        <tr><td>所得稅預扣</td><td>依扣繳稅額表或 5%</td><td>報稅時多退少補</td></tr>
        <tr><td>補充保費</td><td>獎金超過投保金額 4 倍的部分 × 2.11%</td><td>依規定扣取</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px">勞健保的細節，可以用<a href="/tools/insurance/">勞健保費計算機</a>看公司負擔和級距；想知道全年稅額，用<a href="/tools/income-tax/">所得稅試算</a>。</p>
  </section>

  <section>
    <h2>所得稅預扣：稅額表和 5% 差在哪？</h2>
    <p><b>依扣繳稅額表</b>：到職時有填「免稅額申報表」的人適用，大多數上班族屬於這種。2026 年無配偶及受扶養親屬者，<b>月薪 90,501 元以上</b>才開始預扣；扶養人數越多，起扣點越高。實際金額請看薪資單或財政部公告的扣繳稅額表。</p>
    <p><b>按 5% 扣繳</b>：沒填免稅額申報表，或自己選擇時適用，按月薪的 5% 預扣；算出來不超過 2,000 元就免扣，所以<b>月薪約 4 萬元以下不會扣</b>。</p>
    <p>兩種都只是「預扣」。如果每月被扣太多，明年報稅可以退回來；如果太少，報稅時要補繳。</p>
  </section>

  <section>
    <h2>年終獎金會扣多少？</h2>
    <p>以月薪 45,000 元（健保投保金額 45,800 元）、年終 20 萬元為例：</p>
    <p><b>所得稅預扣</b>：20 萬 ≥ 90,501 元，扣 5% ＝ <b>10,000 元</b>。</p>
    <p><b>二代健保補充保費</b>：投保金額 4 倍 ＝ 183,200 元，超過的 16,800 元 × 2.11% ＝ <b>354 元</b>。</p>
    <p>所以年終入帳約 189,646 元。上方工具填入「本月獎金」就能自動算。</p>
  </section>

  <section>
    <h2>用 Excel 做薪資條</h2>
    ${dl("fangjiatw-payroll-115.xlsx", "115年薪資條試算表_放假日曆.xlsx", "每位員工一列：填入月薪、加班費、獎金和扣款設定，自動算出勞健保、預扣稅、補充保費與實領，內建 115 年級距表。")}
    <p>月薪在 B2，按 5% 扣繳的所得稅（不超過 2,000 免扣）：</p>
    ${formula("fiveFormula", "=IF(ROUND(B2*5%,0)>2000,ROUND(B2*5%,0),0)")}
    <p style="margin-top:12px">獎金在 C2、健保投保金額在 D2，補充保費（假設今年第一次領獎金）：</p>
    ${formula("suppFormula", "=ROUND(MAX(0,C2-4*D2)*2.11%,0)")}
  </section>`,
});

// ---------------- 資遣費 ----------------
const D_ = (y, m, d) => new Date(y, m - 1, d);
const sevYears = [1, 2, 3, 5, 10, 12, 20];
const sevRows = sevYears.map(y => {
  const a = INS.severance({ hire: D_(2000, 1, 1), leave: D_(2000 + y, 1, 0), avg: 40000, scheme: "new" }).amount;
  const b = INS.severance({ hire: D_(2000, 1, 1), leave: D_(2000 + y, 1, 0), avg: 40000, scheme: "old" }).amount;
  return `        <tr><td>${y} 年</td><td class="num">${a.toLocaleString()}</td><td class="num">${b.toLocaleString()}</td></tr>`;
}).join("\n");
const molNew = INS.severance({ hire: D_(2023, 1, 1), leave: D_(2026, 7, 15), avg: 30000, scheme: "new" }).amount;
const molOld = INS.severance({ hire: D_(2023, 1, 1), leave: D_(2026, 7, 15), avg: 30000, scheme: "old" }).amount;
const sevFaq = [
  ["資遣費怎麼算？", "新制每滿 1 年給 0.5 個月平均工資，未滿 1 年按比例計算，最多 6 個月；舊制每滿 1 年給 1 個月平均工資，沒有上限。2005 年 7 月 1 日以後到職的人都是新制。"],
  ["平均工資包含哪些？", "離職前 6 個月內的工資總額，包括本薪、固定津貼、加班費、全勤獎金等經常性給與；年終獎金、三節獎金這類非經常性給與不算。"],
  ["新制資遣費最多可以拿多少？", "最多 6 個月平均工資。新制每年 0.5 個月，所以年資滿 12 年就到上限，之後年資再多也是 6 個月。"],
  ["資遣費什麼時候要發？", "公司要在勞動契約終止後 30 日內發給資遣費。另外要提前預告：年資 3 個月以上未滿 1 年 10 天、1 年以上未滿 3 年 20 天、3 年以上 30 天；沒有預告的話，要給付預告期間的工資。"],
  ["資遣費要繳稅嗎？", "資遣費屬於退職所得。115 年一次領取時，206,000 元 × 退職服務年資以內免稅，大多數人的資遣費都在免稅範圍內。"],
  ["被資遣可以領失業給付嗎？", "可以。被資遣屬於非自願離職，請公司開立非自願離職證明，到就業服務站辦理求職登記，符合加保年資等條件就能申請失業給付。"],
];
const severancePage = page({
  path: "/tools/severance/", crumb: "資遣費計算",
  title: "資遣費計算機｜新制、舊制資遣費怎麼算（2026）",
  h1: "資遣費計算<br>被資遣了，可以拿多少？",
  desc: "2026 資遣費計算機：輸入到職日、離職日與月平均工資，依勞基法及勞工退休金條例算出新制、舊制或新舊制併用的資遣費，附預告期間、退職所得免稅額與 Excel 範本。",
  faq: sevFaq, app: "資遣費計算機",
  body: `
  <div class="answer">新制資遣費 ＝ 月平均工資 × 年資 × 0.5，<b>最多 6 個月</b>；舊制 ＝ 月平均工資 × 年資，沒有上限。月平均工資 4 萬、年資 3 年，新制資遣費是 <b>60,000 元</b>。2005 年 7 月 1 日以後到職的人都適用新制。</div>

  <section>
    <h2>資遣費試算</h2>
    <form class="tool" data-tool="severance" autocomplete="off">
      <div class="fields">
        <label class="field">到職日<input type="date" name="hire" min="1970-01-01"></label>
        <label class="field">離職日（最後工作日）<input type="date" name="leave" min="1970-01-01"></label>
        ${field("avg", "月平均工資（離職前 6 個月平均）", 'placeholder="例如 40000"')}
        <label class="field">適用制度<select name="scheme"><option value="new">新制（2005/7/1 後到職，或選新制且結清舊年資）</option><option value="mixed">新舊制併用（選新制並保留舊制年資）</option><option value="old">舊制（一直沒有改選新制）</option></select></label>
        <span id="switchWrap" hidden><label class="field">改選新制的日期<input type="date" name="switchDate" value="2005-07-01" min="2005-07-01"></label></span>
      </div>
      <label class="check"><input type="checkbox" name="noNotice">公司沒有提前預告（一併計算預告期間工資）</label>
      <div class="result" id="sevOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">依勞動基準法第 16、17 條及勞工退休金條例第 11、12 條計算，年資算到離職日當天。計算都在你的瀏覽器裡完成。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>新制和舊制差在哪？</h2>
    <div class="tbl"><table>
      <thead><tr><th></th><th>新制（勞退條例）</th><th>舊制（勞基法）</th></tr></thead>
      <tbody>
        <tr><td>適用對象</td><td>2005/7/1 以後到職，或改選新制後的年資</td><td>2005/7/1 以前到職、沒有改選新制</td></tr>
        <tr><td>每滿 1 年</td><td>0.5 個月平均工資</td><td>1 個月平均工資</td></tr>
        <tr><td>未滿 1 年</td><td>按比例（月、日都算）</td><td>按比例，未滿 1 個月以 1 個月計</td></tr>
        <tr><td>上限</td><td>最多 6 個月</td><td>沒有上限</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px">2005 年 7 月 1 日以前到職、後來改選新制的人，如果保留了舊制年資，要分兩段算：改制前的年資用舊制，改制後的年資用新制，再加起來。上方工具選「新舊制併用」就會自動分段。</p>
  </section>

  <section>
    <h2>月平均工資 4 萬元，資遣費對照表</h2>
    <div class="tbl"><table>
      <thead><tr><th>年資</th><th>新制</th><th>舊制</th></tr></thead>
      <tbody>
${sevRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">新制年資滿 12 年就達到 6 個月上限（240,000 元），之後不再增加。</p>
  </section>

  <section>
    <h2>年資有零頭怎麼算？</h2>
    <p>以勞動部的範例：月平均工資 30,000 元，年資 3 年 6 個月 15 天。</p>
    <p><b>新制</b>：零頭的 15 天換算成 15/30 個月，30,000 × 1/2 × [3 + (6 + 15/30) ÷ 12] ≈ <b>${molNew.toLocaleString()} 元</b>。</p>
    <p><b>舊制</b>：未滿 1 個月的 15 天當作 1 個月，30,000 × [3 + (6 + 1) ÷ 12] ≈ <b>${molOld.toLocaleString()} 元</b>。</p>
    <p>上方工具用同樣的方法換算，結果和勞動部範例一致。</p>
  </section>

  <section>
    <h2>月平均工資怎麼算？</h2>
    <p>平均工資是離職前 <b>6 個月內</b>拿到的工資總額平均，實務上常用「6 個月工資總額 ÷ 6」。要算進去的是經常性給與：本薪、固定津貼、加班費、全勤獎金等；<b>年終獎金、三節獎金</b>這類非經常性給與不算。</p>
    <p>例如 6 個月本薪各 40,000 元，其中 2 個月各有 3,000 元加班費：(240,000 + 6,000) ÷ 6 ＝ 41,000 元。</p>
  </section>

  <section>
    <h2>預告期間和謀職假</h2>
    <div class="tbl"><table>
      <thead><tr><th>年資</th><th>公司要提前幾天預告</th></tr></thead>
      <tbody>
        <tr><td>未滿 3 個月</td><td>不用預告</td></tr>
        <tr><td>3 個月以上未滿 1 年</td><td>10 天</td></tr>
        <tr><td>1 年以上未滿 3 年</td><td>20 天</td></tr>
        <tr><td>3 年以上</td><td>30 天</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px">公司沒有預告就資遣，要另外給付預告期間的工資。預告期間內，勞工可以請<b>謀職假</b>去找工作，每星期不超過 2 天，工資照給。</p>
  </section>

  <section>
    <h2>被資遣時要注意的事</h2>
    <p><b>30 天內發給</b>：資遣費要在勞動契約終止後 30 日內發給。</p>
    <p><b>非自願離職證明</b>：請公司開立，之後申請失業給付會用到。</p>
    <p><b>特休未休工資</b>：還沒休完的特休，公司要折算工資，可以用<a href="/tools/annual-leave/">特休計算機</a>算剩幾天。</p>
    <p><b>稅</b>：資遣費屬於退職所得，115 年一次領取時，<b>206,000 元 × 退職服務年資</b>以內免稅；超過的部分到 414,000 元 × 年資之間半數課稅，再超過的全數課稅。退職服務年資的零頭未滿 6 個月算半年、滿 6 個月算 1 年。新制資遣費最多 6 個月，大多數人都在免稅範圍內。</p>
  </section>

  <section>
    <h2>用 Excel 算資遣費</h2>
    ${dl("fangjiatw-severance.xlsx", "資遣費計算表_放假日曆.xlsx", "每位員工一列：填入到職日、離職日、月平均工資和適用制度，自動算出新舊制年資、資遣費、預告天數與預告期間工資。")}
    <p>到職日在 B2、離職日在 C2、月平均工資在 D2，新制資遣費（先算滿幾個月，再把零頭天數換成 /30 個月）：</p>
    ${formula("sevFormula", "=ROUND(D2*MIN(6,(DATEDIF(B2,C2+1,\"m\")+(C2+1-EDATE(B2,DATEDIF(B2,C2+1,\"m\")))/30)/12*0.5),0)")}
    <p style="margin-top:12px">C2+1 是因為年資要算到離職日當天。範本裡用的是更完整的寫法，月底到職等特殊日期也能正確計算。</p>
  </section>`,
});

// ---------------- 勞退退休金 ----------------
const penEx = INS.pension({ age: 30, claimAge: 65, salary: 40000, growth: 1.44, ret: 3 });
const penEx6 = INS.pension({ age: 30, claimAge: 65, salary: 40000, growth: 1.44, ret: 3, selfPct: 6 });
const molEx = INS.pension({ age: 25, claimAge: 65, salary: 30000, growth: 1.44, ret: 6.09 });
const molEx6 = INS.pension({ age: 25, claimAge: 65, salary: 30000, growth: 1.44, ret: 6.09, selfPct: 6 });
const wan = v => (Math.round(v / 1000) / 10).toLocaleString();
const penRows = [[25, 35000], [30, 40000], [35, 50000], [40, 60000], [45, 50000]].map(([a, s]) => {
  const x = INS.pension({ age: a, claimAge: 65, salary: s, growth: 1.44, ret: 3 }), y = INS.pension({ age: a, claimAge: 65, salary: s, growth: 1.44, ret: 3, selfPct: 6 });
  return `        <tr><td>${a} 歲・月薪 ${s.toLocaleString()}</td><td class="num">${wan(x.total)} 萬<br><small>月領 ${x.monthly.toLocaleString()}</small></td><td class="num">${wan(y.total)} 萬<br><small>月領 ${y.monthly.toLocaleString()}</small></td></tr>`;
}).join("\n");
const lifeRows = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70].map(a => {
  const T = INS.penLife(a), fct = INS.annuityFactor(T, INS.PEN.rate);
  return `        <tr><td>${a} 歲</td><td class="num">約 ${T} 年</td><td class="num">${fct.toFixed(9)}</td><td class="num">${Math.round(1e6 / fct / 12).toLocaleString()}</td></tr>`;
}).join("\n");
const g40 = INS.laborIns({ salary: 40000 }).pen.grade, self40 = Math.round(g40 * 0.06) * 12;
const penFaq = [
  ["勞退幾歲可以領？", "年滿 60 歲才可以請領。年滿 60 歲且提繳年資滿 15 年，可以選月退休金或一次領；未滿 15 年只能一次領。也可以延後請領，專戶會繼續累積收益。"],
  ["勞退月退休金可以領多久？", "勞退月退休金不是終身俸，是用專戶金額依平均餘命分期發給，專戶領完就停止。例如 60 歲請領，依平均餘命估算給付期間約 23 年；65 歲請領約 19 年。這只是估算，並非保證領到幾歲，利率調整時月退金額也會重新計算。如果提早過世，專戶剩下的錢由遺屬或指定請領人領回。"],
  ["勞退自提划算嗎？", "自提的錢可以從當年度薪資所得中全額減除，稅率越高省越多；專戶收益也有最低保證，不低於當地銀行 2 年期定存利率。缺點是錢要到 60 歲才能領，短期需要用錢的人要考慮。"],
  ["公司可以拒絕我自提嗎？", "2026 年 8 月 1 日起，勞工申請自提或停止自提，雇主不得拒絕；雇主不配合時，勞工可以直接向勞保局申請。"],
  ["勞退和勞保老年年金一樣嗎？", "不一樣。勞退是雇主每月提繳到你個人專戶的錢，領完就沒有；勞保老年年金是勞保給付，可以領到終身。退休後兩筆可以同時領。"],
  ["怎麼查自己的勞退專戶有多少錢？", "可以用勞保局 e 化服務系統、勞動保障卡，或勞保局的行動 App 查詢個人專戶累積金額。查到後填入上方工具，試算會更準確。"],
];
const pensionPage = page({
  path: "/tools/pension/", crumb: "勞退退休金試算",
  title: "勞退退休金試算｜退休時專戶有多少、月領多少（2026）",
  h1: "勞退退休金試算<br>退休時勞退專戶有多少錢？",
  desc: "2026 勞退新制退休金試算：輸入年齡、月薪與自提比例，估算 60～70 歲請領時個人專戶累積金額與月退休金，依勞保局公告的平均餘命與年金現值公式計算，附 Excel 範本。",
  faq: penFaq, app: "勞退退休金試算",
  body: `
  <div class="answer">雇主每月提繳月薪的 <b>6%</b> 到你的勞退個人專戶，60 歲起可以請領。30 歲、月薪 4 萬、每年調薪 1.44%、報酬率 3%，65 歲時約累積 <b>${wan(penEx.total)} 萬元</b>，月領約 <b>${penEx.monthly.toLocaleString()} 元</b>；如果自提 6%，約 ${wan(penEx6.total)} 萬元、月領 ${penEx6.monthly.toLocaleString()} 元。3% 是模擬用的年化報酬率，不是勞退基金保證報酬。</div>

  <section>
    <h2>勞退退休金試算</h2>
    <form class="tool" data-tool="pension" autocomplete="off">
      <fieldset>
        <legend>你的資料</legend>
        <div class="fields">
          ${field("age", "目前年齡", 'placeholder="例如 30"')}
          <label class="field">預計請領年齡<select name="claimAge">${Array.from({ length: 11 }, (_, i) => 60 + i).map(v => `<option value="${v}"${v === 65 ? " selected" : ""}>${v} 歲</option>`).join("")}</select></label>
          ${field("salary", "目前月薪", 'placeholder="例如 40000"')}
          ${field("balance", "專戶目前累積金額（選填）")}
          ${field("years", "已提繳年資（選填，年）")}
        </div>
        <details><summary>勞退是用「月提繳工資」計算，不是實際月薪</summary>
          <p class="note">月薪會對照勞工退休金月提繳分級表，取大於或等於月薪的那一級，所以可能和實際月薪不同。例如月薪 40,000 元，月提繳工資是 40,100 元；月薪超過 147,900 元，以最高 150,000 元計。115 年 1 月 1 日起適用的級距：</p>
          <p class="note">${INS.INS115.pension.map(v => v.toLocaleString()).join("、")}</p>
        </details>
      </fieldset>
      <fieldset>
        <legend>提繳與假設</legend>
        <div class="fields">
          <label class="field">自提比例<select name="selfPct">${[0, 1, 2, 3, 4, 5, 6].map(v => `<option value="${v}">${v}%</option>`).join("")}</select></label>
          <label class="field">雇主提繳<select name="erPct">${[6, 7, 8, 9, 10].map(v => `<option value="${v}">${v}%${v === 6 ? "（法定最低）" : ""}</option>`).join("")}</select></label>
          <label class="field">薪資年成長率（%）<input name="growth" inputmode="decimal" value="1.44"></label>
          <label class="field">投資報酬率（%／年）<input name="ret" inputmode="decimal" value="3"></label>
        </div>
      </fieldset>
      <div><button type="button" class="copy" id="penReset" style="padding:6px 14px">重設</button></div>
      <div class="result" id="penOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">薪資成長率預設 1.44% 是勞動部試算表提供的經常性薪資年化成長率；報酬率預設 3% 是模擬用的年化報酬率，不是勞退基金保證報酬，也不代表未來實際收益，可以自行調整。月提繳工資依 115 年勞工退休金月提繳分級表，最高 150,000 元。計算都在你的瀏覽器裡完成。</p>
    <p style="margin-top:12px">勞退之外，勞保老年年金是另一筆終身的退休收入。用<a href="/tools/labor-insurance-pension/">勞保老年年金試算</a>，可以把兩筆加起來，看退休後每月大約有多少收入。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>65 歲退休，勞退專戶大約有多少？</h2>
    <div class="tbl"><table>
      <thead><tr><th>開始年齡・目前月薪</th><th>只有雇主提繳 6%</th><th>再自提 6%</th></tr></thead>
      <tbody>
${penRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">假設薪資每年成長 1.44%、投資報酬率 3%、65 歲請領、專戶目前為 0。月領是 65 歲請領的月退休金，領 19 年。</p>
    <p style="margin-top:12px">用勞動部的試算範例對照：25 歲工作到 65 歲、提繳工資 3 萬元、報酬率 6.09%，只有雇主提繳約 433 萬元、自提 6% 約 866 萬元。本工具用同樣條件算出 ${wan(molEx.total)} 萬元和 ${wan(molEx6.total)} 萬元，結果一致。</p>
  </section>

  <section>
    <h2>月退休金怎麼算？</h2>
    <p>勞保局的公式是：<b>月退休金 ＝ 專戶金額 ÷ 期初年金現值因子 ÷ 12</b>。年金現值因子由兩個數字決定：</p>
    <p><b>平均餘命</b>：依內政部 111 年全國簡易生命表，請領年齡對應的平均餘命，四捨五入到整數年。</p>
    <p><b>利率</b>：1.1473%，是勞退新制基金 110～112 年平均保證收益率。</p>
    <p>勞保局範例：60 歲請領、專戶 200 萬元，因子 20.239737682，月退休金 2,000,000 ÷ 20.239737682 ÷ 12 ≈ <b>8,235 元</b>。本工具用同一公式計算。</p>
    <div class="tbl"><table>
      <thead><tr><th>請領年齡</th><th>平均餘命（預計給付期間）</th><th>期初年金現值因子</th><th>專戶每 100 萬月領</th></tr></thead>
      <tbody>
${lifeRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">平均餘命和利率自 113 年 4 月 1 日起適用，勞保局至少每 3 年檢討一次。平均餘命只是用來估算給付期間，<b>並非保證可以領到幾歲</b>；月退休金每季發給，專戶領完即停止，利率調整時會依專戶剩餘金額重新計算。</p>
  </section>

  <section>
    <h2>月領還是一次領？</h2>
    <div class="tbl"><table>
      <thead><tr><th></th><th>月退休金</th><th>一次退休金</th></tr></thead>
      <tbody>
        <tr><td>資格</td><td>年滿 60 歲，且提繳年資滿 15 年</td><td>年滿 60 歲，年資不限</td></tr>
        <tr><td>領多久</td><td>依平均餘命估算給付期間，專戶領完即停止，不是終身</td><td>一次領完</td></tr>
        <tr><td>總共領多少</td><td>專戶金額加上給付期間的收益</td><td>請領當時的專戶金額</td></tr>
        <tr><td>剩下的錢</td><td>留在專戶繼續有收益，過世後由遺屬或指定請領人領回</td><td>自己管理</td></tr>
        <tr><td>風險</td><td>活得比估算期間久，專戶會領完</td><td>花太快、投資虧損或被借走，就沒有後續收入</td></tr>
        <tr><td>適合</td><td>怕一次花掉、想要固定現金流的人</td><td>有明確用途或自己會理財的人</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px"><b>選錯可以改一次</b>：2026 年 2 月 27 日起，選擇月退休金的人，在月退休金<b>首次撥付入帳之日起 30 日內</b>，可以申請改為一次退休金，以一次為限（勞工退休金條例施行細則第 33 條之 1）。勞保局會把專戶金額扣掉已撥付的部分，一次補發差額。</p>
    <p>越晚請領，平均餘命越短，每月領得越多，而且延後期間專戶還會繼續累積收益；但如果需要早點用錢，60 歲就可以開始領。上方工具可以切換請領年齡比較。</p>
  </section>

  <section>
    <h2>勞退自提划算嗎？</h2>
    <p><b>節稅</b>：自提的錢可以從當年度薪資所得中全額減除。月薪 4 萬（月提繳工資 ${g40.toLocaleString()} 元）自提 6%，一年 ${self40.toLocaleString()} 元可以從薪資所得中減除；如果適用稅率 12%，大約少繳 ${Math.round(self40 * 0.12).toLocaleString()} 元。實際節稅效果取決於你的所得和適用稅率，免稅或稅率 5% 的人省得比較少。</p>
    <p><b>保證收益</b>：專戶收益不低於當地銀行 2 年期定存利率，不足的部分由國庫補足。</p>
    <p><b>缺點</b>：自提的錢要到 60 歲才能領，中途不能提出來。</p>
    <p><b>2026 年 8 月 1 日起，勞工申請自提或停止自提，雇主不得拒絕</b>；雇主不配合時可以直接向勞保局申請。每月自提會從薪水扣，可以用<a href="/tools/take-home-pay/">薪資實領計算</a>看實際入帳的變化。</p>
  </section>

  <section>
    <h2>計算依據與資料來源</h2>
    <div class="tbl"><table>
      <thead><tr><th>項目</th><th>依據</th></tr></thead>
      <tbody>
        <tr><td>雇主提繳 6%、自提 0～6%、請領資格</td><td><a href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=N0030020" rel="noopener">勞工退休金條例</a></td></tr>
        <tr><td>月提繳工資級距</td><td>勞保局勞工退休金月提繳分級表（115 年 1 月 1 日起適用）</td></tr>
        <tr><td>月退休金公式、利率 1.1473%</td><td><a href="https://www.bli.gov.tw/0018437.html" rel="noopener">勞保局「月退休金計算基礎」</a>（113 年 4 月 1 日起適用）</td></tr>
        <tr><td>平均餘命</td><td>內政部 111 年全國簡易生命表，經勞保局四捨五入到整數年</td></tr>
        <tr><td>最低保證收益</td><td>勞工退休金條例第 23 條：不低於當地銀行 2 年期定存利率</td></tr>
        <tr><td>月退改一次領（30 天）</td><td>勞工退休金條例施行細則第 33 條之 1</td></tr>
      </tbody>
    </table></div>
    <h3 style="margin-top:16px">更新紀錄</h3>
    <div class="tbl"><table>
      <thead><tr><th>更新日期</th><th>內容</th><th>適用</th></tr></thead>
      <tbody>
        <tr><td>2026/11/01</td><td>上線：115 年月提繳級距、勞保局 113 年 4 月起的平均餘命與利率；納入 2026/2/27 月退改一次領、2026/8/1 雇主不得拒絕自提</td><td>2026 年</td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">勞保局公告新的平均餘命或利率、或月提繳級距調整時，我們會更新公式並在這裡記錄。</p>
  </section>

  <section>
    <h2>用 Excel 試算勞退</h2>
    ${dl("fangjiatw-pension.xlsx", "勞退退休金試算表_放假日曆.xlsx", "填入年齡、月薪、自提比例和報酬率，逐年列出月提繳工資、雇主提繳、自提和年底累積，最後算出月退休金。內建 115 年月提繳分級表與勞保局平均餘命表。")}
    <p>專戶金額在 B2、請領時的平均餘命在 B3，月退休金：</p>
    ${formula("penFormula", "=ROUND(B2/((1-(1+1.1473%)^-B3)/(12*((1+1.1473%)^(1/12)-1))*(1+1.1473%)^(1/12))/12,0)")}
    <p style="margin-top:12px">例如 B2 填 2000000、B3 填 23，會得到勞保局範例的 8,235 元。</p>
  </section>`,
});

// ---------------- 勞保老年年金 ----------------
const LO = INS.laborOldAge;
const loEx = LO({ birth: 51, age: 65, years: 30, avg: 45800, claimAge: 65 });
const loEarly = LO({ birth: 51, age: 60, years: 30, avg: 45800, claimAge: 60 });
const loLate = LO({ birth: 51, age: 70, years: 30, avg: 45800, claimAge: 70 });
const loAgeRows = [["46 年次以前", 46], ["47 年次", 47], ["48 年次", 48], ["49 年次", 49], ["50 年次", 50], ["51 年次以後", 51]].map(([t, b]) => {
  const g = INS.legalAge(b);
  return `        <tr><td>${t}</td><td class="num">${g} 歲</td><td class="num">${g - 5} 歲（減給 20%）</td></tr>`;
}).join("\n");
const loAdjRows = [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70].map(c => {
  const a = LO({ birth: 51, age: c, years: 30, avg: 45800, claimAge: c }), b = LO({ birth: 51, age: c, years: 25, avg: 36300, claimAge: c });
  const pct = Math.round(a.adj * 100);
  return `        <tr><td>${c} 歲${c === 65 ? "（法定）" : ""}</td><td class="num">${pct > 0 ? "+" : ""}${pct}%</td><td class="num">${a.monthly.toLocaleString()}</td><td class="num">${b.monthly.toLocaleString()}</td></tr>`;
}).join("\n");
const loSampleRows = [[29500, 15], [36300, 20], [40100, 25], [45800, 30], [45800, 35], [45800, 40]].map(([g, y]) => {
  const r = LO({ birth: 51, age: 65, years: y, avg: g, claimAge: 65 });
  return `        <tr><td class="num">${g.toLocaleString()}</td><td class="num">${y} 年</td><td class="num">${r.A.toLocaleString()}</td><td class="num">${r.B.toLocaleString()}</td><td class="num"><b>${r.monthly.toLocaleString()}</b></td></tr>`;
}).join("\n");
const loOne = LO({ birth: 54, age: 65, years: 35, avg: 45800, claimAge: 65, pre98: true });
const loOneAt60 = LO({ birth: 54, age: 60, years: 30, avg: 45800, claimAge: 60, pre98: true });
const loLump = LO({ birth: 51, age: 65, years: 10, avg: 40100, claimAge: 65 });
const loPen = INS.pension({ age: 35, claimAge: 65, salary: 45000, growth: 1.44, ret: 3 });
const loMix = LO({ birth: 80, age: 35, years: 10, salary: 45000, claimAge: 65, working: true });
const loFaq = [
  ["勞保老年年金幾歲可以領？", "依出生年次決定：46 年次以前 60 歲，47 年次 61 歲，之後每晚 1 個年次加 1 歲，51 年次以後要滿 65 歲。年資滿 15 年可以提前最多 5 年請領，每提前 1 年減給 4%。"],
  ["勞保老年年金怎麼算？", "有兩個公式擇優發給：A 式是平均月投保薪資 × 年資 × 0.775% ＋ 3,000 元，B 式是平均月投保薪資 × 年資 × 1.55%。平均月投保薪資取加保期間最高 60 個月的平均。例如投保 45,800 元、年資 30 年，B 式每月約 21,297 元。"],
  ["勞保年資未滿 15 年可以領年金嗎？", "不能領年金，但到了法定請領年齡可以領老年一次金：平均月投保薪資 × 年資，每滿 1 年給 1 個月。例如投保 40,100 元、年資 10 年，約 40.1 萬元。老年一次金不能提前請領。"],
  ["勞保年金提前領還是延後領比較好？", "提前 1 年減 4%、延後 1 年加 4%，最多各 5 年，而且是終身適用。提前領每月較少但多領幾年，延後領每月較多但少領幾年，沒有一定比較好，要看健康狀況、退休後的現金需求和其他收入。"],
  ["勞保年金和勞退可以一起領嗎？", "可以。勞保老年年金是勞保給付，勞退是雇主提繳到個人專戶的退休金，兩筆互不影響，符合條件就可以同時請領。勞保年金可以領到終身，勞退月退休金是專戶領完為止。"],
  ["勞保年金會隨物價調整嗎？", "會。依勞工保險條例第 65-4 條，消費者物價指數累計成長率達正負 5% 時，年金給付金額依成長率調整。本工具算的是依公式計算的金額，不含日後的物價調整。"],
];
const laborInsPensionPage = page({
  path: "/tools/labor-insurance-pension/", crumb: "勞保老年年金試算",
  title: "勞保老年年金試算｜幾歲可以領、月領多少、加上勞退退休月收入（2026）",
  h1: "勞保老年年金試算<br>退休後勞保每月可以領多少？",
  desc: "2026 勞保老年年金試算：輸入出生年次、勞保年資與投保薪資，依勞工保險條例 A、B 式擇優計算月領金額，含提前減給、延後增給、老年一次金與一次請領比較，再加上勞退月退休金估算退休後每月收入，附 Excel 範本。",
  faq: loFaq, app: "勞保老年年金試算",
  body: `
  <div class="answer">勞保老年年金 ≈ <b>平均月投保薪資 × 年資 × 1.55%</b>（另一個公式是 × 0.775% ＋ 3,000 元，兩者擇優）。51 年次以後要滿 <b>65 歲</b>才能領全額。投保 45,800 元、年資 30 年，65 歲請領每月約 <b>${loEx.monthly.toLocaleString()} 元</b>；提前到 60 歲領約 ${loEarly.monthly.toLocaleString()} 元，延後到 70 歲領約 ${loLate.monthly.toLocaleString()} 元，而且是領到終身。</div>

  <section>
    <h2>勞保老年年金試算</h2>
    <p>填入出生年次、勞保年資和月薪，就能算出勞保年金每月領多少。再填勞退專戶，可以一起看到退休後每個月大約有多少收入。</p>
    <form class="tool" data-tool="labor-old-age" autocomplete="off">
      <fieldset>
        <legend>勞保資料</legend>
        <div class="fields">
          ${field("birth", "出生年次（民國）", 'placeholder="例如 79"')}
          ${field("age", "目前年齡", 'placeholder="例如 36"')}
          <label class="field">目前勞保年資（年）<input name="years" inputmode="decimal" placeholder="例如 12.5"></label>
          ${field("salary", "目前月薪", 'placeholder="例如 45000"')}
          ${field("avg", "平均月投保薪資（選填）", 'placeholder="不知道就留空"')}
          <label class="field">預計請領年齡<select name="claimAge">${Array.from({ length: 16 }, (_, i) => 55 + i).map(v => `<option value="${v}"${v === 65 ? " selected" : ""}>${v} 歲</option>`).join("")}</select></label>
        </div>
        <label class="check"><input type="checkbox" name="working" checked> 會持續工作、加保到請領年齡（年資會一路累積）</label>
        <label class="check"><input type="checkbox" name="pre98"> 民國 97 年 7 月 17 日以前就有勞保年資（可以比較一次請領）</label>
        <details><summary>平均月投保薪資是什麼？不知道怎麼填？</summary>
          <p class="note">勞保年金用的是「加保期間最高 60 個月的月投保薪資平均」，不是實際月薪。留空的話，本工具用目前月薪對照 115 年勞保投保薪資分級表推算，月薪 43,901 元以上都以最高 45,800 元計。如果年輕時投保薪資比較低、最近 5 年才調高，這樣推算會接近實際；可以登入勞保局 e 化服務系統查詢投保紀錄後自行填入。</p>
        </details>
      </fieldset>
      <fieldset>
        <legend>加上勞退（選填）</legend>
        <div class="fields">
          ${field("penBalance", "勞退專戶目前累積")}
          ${field("penYears", "勞退已提繳年資（年）")}
          <label class="field">勞退自提比例<select name="selfPct">${[0, 1, 2, 3, 4, 5, 6].map(v => `<option value="${v}">${v}%</option>`).join("")}</select></label>
        </div>
        <p class="note">勞退依雇主提繳 6%、薪資年成長 1.44%、模擬報酬率 3% 估算，詳細試算請用<a href="/tools/pension/">勞退退休金試算</a>。</p>
      </fieldset>
      <div><button type="button" class="copy" id="loReset" style="padding:6px 14px">重設</button></div>
      <div class="result" id="loOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">依勞工保險條例第 58～59 條計算，投保薪資依 115 年勞保投保薪資分級表（最高 45,800 元）。結果是依公式計算的估算值，不含日後物價調整，實際金額以勞保局核定為準。計算都在你的瀏覽器裡完成。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>勞保老年年金幾歲可以領？</h2>
    <p>法定請領年齡依出生年次逐步提高，<b>51 年次以後都是 65 歲</b>。勞保年資滿 15 年，可以提前最多 5 年請領，但每提前 1 年少領 4%。</p>
    <div class="tbl"><table>
      <thead><tr><th>出生年次（民國）</th><th>全額請領年齡</th><th>最早可提前請領</th></tr></thead>
      <tbody>
${loAgeRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">請領時要已經離職退保。依勞工保險條例第 58 條，請領年齡自 98 年起為 60 歲，第 10 年起提高 1 歲，之後每 2 年提高 1 歲，到 65 歲為止。</p>
  </section>

  <section>
    <h2>勞保老年年金怎麼算？A 式和 B 式</h2>
    <p>勞保局會用兩個公式計算，<b>哪個高就發哪個</b>：</p>
    <p><b>A 式</b>：平均月投保薪資 × 年資 × 0.775% ＋ 3,000 元</p>
    <p><b>B 式</b>：平均月投保薪資 × 年資 × 1.55%</p>
    <p>兩式在「平均月投保薪資 × 年資」約 387,097 元時打平，低於這個數字 A 式較高。現在最低投保薪資 29,500 元、年資 15 年就有 442,500 元，所以<b>大多數人是 B 式比較高</b>；投保薪資偏低的部分工時者，或早年投保薪資低的人，才可能適用 A 式。</p>
    <div class="tbl"><table>
      <thead><tr><th>平均月投保薪資</th><th>年資</th><th>A 式</th><th>B 式</th><th>每月領</th></tr></thead>
      <tbody>
${loSampleRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">以 65 歲（法定年齡）請領計算。年資未滿 1 年的部分按加保月數比例計算。</p>
  </section>

  <section>
    <h2>提前領還是延後領？差多少</h2>
    <p>以 51 年次、法定請領年齡 65 歲為例，提前或延後請領的增減比例<b>會跟著你一輩子</b>，不是只有前幾年：</p>
    <div class="tbl"><table>
      <thead><tr><th>請領年齡</th><th>增減給</th><th>投保 45,800・年資 30 年</th><th>投保 36,300・年資 25 年</th></tr></thead>
      <tbody>
${loAdjRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">假設請領前已經退保、年資不再增加。如果延後期間繼續工作加保，年資也會增加，金額會比表上更高。</p>
    <p style="margin-top:12px">提前領的好處是早幾年開始有收入，延後領則是每月領得多。哪個比較好沒有標準答案，要看你的健康狀況、退休後的現金需求，以及有沒有勞退、存款等其他收入可以先用。</p>
  </section>

  <section>
    <h2>年資未滿 15 年：老年一次金</h2>
    <p>勞保年資未滿 15 年，不能領年金，到了法定請領年齡可以請領<b>老年一次金</b>：平均月投保薪資 × 年資，每滿 1 年給 1 個月。例如投保 40,100 元、年資 10 年，約 <b>${loLump.lump.toLocaleString()} 元</b>。老年一次金不能提前請領。</p>
    <p>如果年資只差幾年就滿 15 年，可以考慮繼續工作加保，或用國民年金年資合併計算，達到 15 年就能改領終身年金。</p>
  </section>

  <section>
    <h2>月領還是一次領？（97 年以前就有勞保年資的人）</h2>
    <p>民國 97 年 7 月 17 日以前就有勞保年資的人，除了月領年金，也可以選擇<b>一次請領老年給付</b>：年資前 15 年每年 1 個月，超過 15 年的部分每年 2 個月，最高 45 個月；60 歲以後的年資最多再算 5 年，合計最高 50 個月。一次請領的平均月投保薪資取退保前 3 年平均。</p>
    <div class="tbl"><table>
      <thead><tr><th>例子：54 年次、投保 45,800 元</th><th>月領年金</th><th>一次請領</th><th>回本年數</th></tr></thead>
      <tbody>
        <tr><td>60 歲退休、年資 30 年</td><td class="num">${loOneAt60.monthly.toLocaleString()}<br><small>提前 5 年，減給 20%</small></td><td class="num">${(loOneAt60.oneTime / 10000).toLocaleString()} 萬<br><small>${loOneAt60.months} 個月</small></td><td class="num">約 ${loOneAt60.breakEven.toFixed(1)} 年</td></tr>
        <tr><td>工作到 65 歲、年資 35 年</td><td class="num">${loOne.monthly.toLocaleString()}</td><td class="num">${(loOne.oneTime / 10000).toLocaleString()} 萬<br><small>${loOne.months} 個月</small></td><td class="num">約 ${loOne.breakEven.toFixed(1)} 年</td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">回本年數 ＝ 一次請領金額 ÷ 每年領的年金，不計物價調整和利息。</p>
    <p style="margin-top:12px">月領的年金是<b>終身給付</b>，活得越久領越多，還會隨物價調整；一次領則是馬上拿到一筆錢，可以自己運用。選擇後就不能更改，建議先想清楚自己的現金需求再決定。</p>
  </section>

  <section>
    <h2>勞保年金加勞退：退休後每月收入</h2>
    <p>退休後的固定收入，通常有兩筆：勞保老年年金和勞退退休金，兩筆可以同時領。例如 80 年次、35 歲、月薪 45,000 元、目前勞保年資 10 年，工作到 65 歲：</p>
    <div class="tbl"><table>
      <thead><tr><th></th><th>每月約</th><th>領多久</th></tr></thead>
      <tbody>
        <tr><td>勞保老年年金</td><td class="num">${loMix.monthly.toLocaleString()}</td><td>終身</td></tr>
        <tr><td>勞退月退休金（只有雇主提繳 6%）</td><td class="num">${loPen.monthly.toLocaleString()}</td><td>依平均餘命估算約 ${loPen.T} 年，專戶領完為止</td></tr>
        <tr><td class="sum"><b>合計</b></td><td class="num"><b>${(loMix.monthly + loPen.monthly).toLocaleString()}</b></td><td></td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">勞退假設勞退專戶目前為 0、薪資年成長 1.44%、模擬報酬率 3%（不是保證報酬）。勞保年資從 10 年累積到 40 年。</p>
  </section>

  <section>
    <h2>勞保和勞退有什麼不同？</h2>
    <div class="tbl"><table>
      <thead><tr><th></th><th>勞保老年年金</th><th>勞退（新制）</th></tr></thead>
      <tbody>
        <tr><td>錢從哪裡來</td><td>勞保保費（勞工、雇主、政府分擔）</td><td>雇主每月提繳 6%，加上個人自提</td></tr>
        <tr><td>幾歲可以領</td><td>依出生年次 60～65 歲，可提前 5 年</td><td>60 歲</td></tr>
        <tr><td>月領條件</td><td>勞保年資滿 15 年</td><td>提繳年資滿 15 年</td></tr>
        <tr><td>金額怎麼決定</td><td>平均月投保薪資 × 年資 × 1.55%</td><td>個人專戶累積的本金和收益</td></tr>
        <tr><td>領多久</td><td>終身</td><td>專戶領完為止</td></tr>
        <tr><td>物價調整</td><td>物價指數累計漲跌 5% 時調整</td><td>無</td></tr>
      </tbody>
    </table></div>
  </section>

  <section>
    <h2>計算依據與資料來源</h2>
    <div class="tbl"><table>
      <thead><tr><th>項目</th><th>依據</th></tr></thead>
      <tbody>
        <tr><td>請領資格、法定請領年齡</td><td><a href="https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=N0050001&amp;flno=58" rel="noopener">勞工保險條例第 58 條</a></td></tr>
        <tr><td>A 式、B 式擇優</td><td><a href="https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=N0050001&amp;flno=58-1" rel="noopener">勞工保險條例第 58-1 條</a></td></tr>
        <tr><td>延後增給、提前減給 4%</td><td><a href="https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=N0050001&amp;flno=58-2" rel="noopener">勞工保險條例第 58-2 條</a></td></tr>
        <tr><td>老年一次金、一次請領給付月數</td><td><a href="https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=N0050001&amp;flno=59" rel="noopener">勞工保險條例第 59 條</a></td></tr>
        <tr><td>平均月投保薪資</td><td><a href="https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=N0050001&amp;flno=19" rel="noopener">勞工保險條例第 19 條</a></td></tr>
        <tr><td>物價調整</td><td><a href="https://law.moj.gov.tw/LawClass/LawSingle.aspx?pcode=N0050001&amp;flno=65-4" rel="noopener">勞工保險條例第 65-4 條</a></td></tr>
        <tr><td>投保薪資級距</td><td>勞保局勞工保險投保薪資分級表（115 年 1 月 1 日起適用，最高 45,800 元）</td></tr>
      </tbody>
    </table></div>
    <h3 style="margin-top:16px">更新紀錄</h3>
    <div class="tbl"><table>
      <thead><tr><th>更新日期</th><th>內容</th><th>適用</th></tr></thead>
      <tbody>
        <tr><td>2026/11/01</td><td>上線：依勞工保險條例第 58～59 條、115 年投保薪資分級表；51 年次以後法定請領年齡 65 歲</td><td>2026 年</td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">勞工保險條例修法或投保薪資級距調整時，我們會更新公式並在這裡記錄。</p>
  </section>

  <section>
    <h2>用 Excel 試算勞保年金</h2>
    ${dl("fangjiatw-labor-insurance-pension.xlsx", "勞保老年年金試算表_放假日曆.xlsx", "填入出生年次、年資、平均月投保薪資和請領年齡，自動算出 A、B 式、提前或延後增減給、老年一次金，以及一次請領金額和回本年數。")}
    <p>平均月投保薪資在 B2、年資在 B3、增減給比例在 B4（提前 2 年填 -8%，延後 1 年填 4%），每月年金：</p>
    ${formula("loFormula", "=ROUND(MAX(B2*B3*0.775%+3000,B2*B3*1.55%)*(1+B4),0)")}
    <p style="margin-top:12px">例如 B2 填 45800、B3 填 30、B4 填 0，會得到 ${loEx.monthly.toLocaleString()} 元。</p>
  </section>`,
});

// ---------------- 貸款試算 ----------------
const NEW = "2026-11-03";
const lnEx = INS.loan({ amount: 10e6, rate: 2.2, years: 30 });
const lnExP = INS.loan({ amount: 10e6, rate: 2.2, years: 30, method: "principal" });
const lnExG = INS.loan({ amount: 10e6, rate: 2.2, years: 30, grace: 3 });
const lnChg = INS.loan({ amount: 10e6, rate: 2.2, years: 30, changes: [{ from: 13, rate: 2.5 }, { from: 25, rate: 2.8 }] });
const lnRed = INS.loan({ amount: 10e6, rate: 2.2, years: 30, prepay: { month: 60, amount: 1e6, mode: "reduce" } });
const lnSh = INS.loan({ amount: 10e6, rate: 2.2, years: 30, prepay: { month: 60, amount: 1e6, mode: "shorten" } });
const yms = m => `${Math.floor(m / 12)} 年${m % 12 ? ` ${m % 12} 個月` : ""}`;
const n0 = v => Math.round(v).toLocaleString();
const lnRows = [300, 500, 800, 1000, 1500, 2000].map(w => `        <tr><td>${w.toLocaleString()} 萬</td>${[20, 30, 40].map(y => `<td class="num">${n0(INS.loan({ amount: w * 1e4, rate: 2.2, years: y }).firstPay)}</td>`).join("")}</tr>`).join("\n");
const capRows = [40000, 60000, 80000, 100000, 150000].map(inc => `        <tr><td>${inc.toLocaleString()}</td><td class="num">${n0(inc / 3)}</td><td class="num">約 ${n0(INS.loanCap(inc / 3, 2.2, 30) / 1e4)} 萬</td></tr>`).join("\n");
const aprOf = (rate, fee, y) => { const x = INS.loan({ amount: 6e5, rate, years: y }); return { apr: INS.loanApr({ amount: 6e5, rows: x.rows, upfront: fee }), total: x.total + fee }; };
const aprRows = [2, 3, 5, 7].map(y => { const a = aprOf(3, 3000, y), b = aprOf(2.5, 9000, y), win = a.total < b.total ? "A" : "B";
  return `        <tr><td>${y} 年</td><td class="num">${a.apr.toFixed(2)}%<br><small>${n0(a.total)}</small></td><td class="num">${b.apr.toFixed(2)}%<br><small>${n0(b.total)}</small></td><td>${win} 銀行</td></tr>`; }).join("\n");
const loanFaq = [
  ["本息平均攤還和本金平均攤還哪個比較划算？", "本金平均攤還的總利息比較少，因為本金還得比較快；但前期每月要繳的錢比較多。本息平均攤還每月金額固定、前期壓力小，是多數人選的方式。總利息相差多少，可以在上方工具切換比較。"],
  ["貸款 30 年、寬限期 3 年，是總共還幾年？", "總共 30 年。貸款年限包含寬限期，前 3 年只繳利息，後 27 年攤還本金和利息，所以寬限期結束後的月付金會比沒有寬限期時高。"],
  ["寬限期要不要用？", "寬限期內只繳利息、本金不會減少，之後要用比較短的時間還完本金，月付金會明顯變高，總利息也比較多。除非前幾年確實有資金壓力，否則不建議為了月付金低而使用。另外，依央行選擇性信用管制，名下已有房屋者的購屋貸款（含第 2 戶以上）、高價住宅貸款、公司法人購屋貸款等不得有寬限期，能不能申請要先問銀行。"],
  ["提前還款要選縮短年限還是降低月付金？", "縮短年限（月付金不變）省下的利息比較多；降低月付金（年限不變）每月負擔比較輕。以貸款 1,000 萬、2.2%、30 年，第 5 年底提前還 100 萬為例，縮短年限約省 " + n0(lnEx.totalInt - lnSh.totalInt) + " 元利息，降低月付金約省 " + n0(lnEx.totalInt - lnRed.totalInt) + " 元。提前還款前要先確認有沒有違約金。"],
  ["房貸月付金占收入多少比較安全？", "一般可以先把房貸月付金控制在家庭月收入的三分之一以內，但這只是初步參考，不是銀行核貸標準，也不代表符合比例就一定貸得到。實際負擔能力還要考慮其他貸款、生活支出、扶養費用和緊急預備金。"],
  ["信貸怎麼比較哪一家比較便宜？", "不要只看名目利率。信貸常有開辦費、帳戶管理費等費用，各家銀行收取方式也不同，比較時要看總費用年百分率和總還款金額。費用越高、貸款期間越短，利率低的方案越可能反而比較貴。上方工具填入費用，就會算出總費用年百分率。"],
  ["利率調整後月付金會變嗎？", "會。房貸多是機動利率，跟著銀行指數利率調整，月付金會依當時的剩餘本金和剩餘期數重新計算。上方工具的「利率變動」可以填入最多 3 次調整，看月付金和總利息會增加多少。"],
];
const loanPage = page({
  path: "/tools/loan/", crumb: "貸款試算", updated: NEW,
  title: "房貸計算機｜每月還多少、總利息、寬限期、提前還款試算（本息、本金攤還）",
  h1: "房貸、信貸試算<br>每月要還多少？總利息多少？",
  desc: "房貸、信貸計算機：輸入貸款金額、年利率、年限與寬限期，算出本息或本金平均攤還的每月還款、總利息；可試算利率變動、提前還款（縮短年限或降低月付金），並計算信貸總費用年百分率，附逐月明細與 CSV 下載。",
  faq: loanFaq, app: "貸款計算機",
  disclaimer: "本工具試算結果僅供財務規劃參考，實際貸款利率、還款金額、相關費用及還款方式，應以金融機構核貸條件與正式貸款契約為準。本工具不考慮逾期費用及其他未輸入的費用。",
  body: `
  <div class="answer">貸款 1,000 萬、年利率 2.2%、30 年，本息平均攤還每月約 <b>${n0(lnEx.firstPay)} 元</b>，30 年總利息約 <b>${n0(lnEx.totalInt / 1e4)} 萬元</b>。改用本金平均攤還，總利息約 ${n0(lnExP.totalInt / 1e4)} 萬元，但第 1 個月要繳 ${n0(lnExP.firstPay)} 元。</div>

  <section>
    <h2>貸款試算</h2>
    <form class="tool" data-tool="loan" autocomplete="off" novalidate>
      <div class="fields">
        <label class="field">貸款金額（萬元）<input name="amount" inputmode="decimal" placeholder="例如 1000"></label>
        <label class="field">年利率（%）<input name="rate" inputmode="decimal" placeholder="例如 2.2"></label>
        <label class="field">貸款總年限（年，含寬限期）<input name="years" inputmode="decimal" value="30"></label>
        <label class="field">寬限期（年，沒有填 0）<input name="grace" inputmode="decimal" value="0"></label>
        <label class="field">還款方式<select name="method"><option value="pmt">本息平均攤還（每月金額固定）</option><option value="principal">本金平均攤還（每月本金固定）</option></select></label>
      </div>
      <p class="note" style="margin:0">貸款總年限包含寬限期。例如貸款 30 年、寬限期 3 年，代表前 3 年只繳利息，後 27 年攤還本金及利息。</p>
      <details>
        <summary>利率變動（選填）</summary>
        <p class="note">從第幾個月（期）起改用新利率，最多 3 次。例如第 13 個月起 2.5%、第 25 個月起 2.8%。</p>
        <div class="fields">
          <label class="field">第幾個月起<input name="c1m" inputmode="numeric" placeholder="例如 13"></label>
          <label class="field">新年利率（%）<input name="c1r" inputmode="decimal" placeholder="例如 2.5"></label>
          <label class="field">第幾個月起<input name="c2m" inputmode="numeric"></label>
          <label class="field">新年利率（%）<input name="c2r" inputmode="decimal"></label>
          <label class="field">第幾個月起<input name="c3m" inputmode="numeric"></label>
          <label class="field">新年利率（%）<input name="c3r" inputmode="decimal"></label>
        </div>
      </details>
      <details>
        <summary>提前還款（選填）</summary>
        <p class="note">繳完第幾期後提前還一筆本金，會同時比較「縮短年限」和「降低月付金」兩種方式。</p>
        <div class="fields">
          <label class="field">繳完第幾期後<input name="pm" inputmode="numeric" placeholder="例如 60"></label>
          <label class="field">提前還款金額（萬元）<input name="pa" inputmode="decimal" placeholder="例如 100"></label>
          <label class="field">違約金（提前還款金額的 %，沒有填 0）<input name="pen" inputmode="decimal" placeholder="例如 1"></label>
        </div>
      </details>
      <details>
        <summary>貸款費用（選填，算總費用年百分率）</summary>
        <p class="note">撥款時一次收取的費用，以及每月另外收取的費用。</p>
        <div class="fields">
          <label class="field">開辦費（元）<input name="fee1" inputmode="numeric" placeholder="例如 5000"></label>
          <label class="field">帳戶管理費（元）<input name="fee2" inputmode="numeric"></label>
          <label class="field">其他一次性費用（元）<input name="fee3" inputmode="numeric"></label>
          <label class="field">每月費用（元）<input name="feeM" inputmode="numeric"></label>
        </div>
      </details>
      <div class="result" id="loanOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">利率請填銀行核貸的年利率，以月利率＝年利率 ÷ 12 計算；年限以月為單位，例如 2.5 年 ＝ 30 期。零利率會直接以本金 ÷ 期數計算。計算都在你的瀏覽器裡完成。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>房貸每月還多少？金額對照表</h2>
    <p>以年利率 2.2%、本息平均攤還、沒有寬限期為例（單位：元／月）：</p>
    <div class="tbl"><table>
      <thead><tr><th>貸款金額</th><th>20 年</th><th>30 年</th><th>40 年</th></tr></thead>
      <tbody>
${lnRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">2.2% 只是舉例，實際利率依銀行、貸款方案和個人條件而定，請把你的利率填進上方工具計算。</p>
  </section>

  <section>
    <h2>本息平均攤還和本金平均攤還差在哪？</h2>
    <div class="tbl"><table>
      <thead><tr><th></th><th>本息平均攤還</th><th>本金平均攤還</th></tr></thead>
      <tbody>
        <tr><td>每月還款</td><td>每月固定</td><td>第 1 個月最高，之後逐月減少</td></tr>
        <tr><td>前期壓力</td><td>較小</td><td>較大</td></tr>
        <tr><td>總利息</td><td>較多</td><td>較少</td></tr>
        <tr><td>1,000 萬・2.2%・30 年</td><td>每月 ${n0(lnEx.firstPay)}，總利息 ${n0(lnEx.totalInt / 1e4)} 萬</td><td>首月 ${n0(lnExP.firstPay)}、末月 ${n0(lnExP.lastPay)}，總利息 ${n0(lnExP.totalInt / 1e4)} 萬</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px">本息平均攤還前期繳的錢大多是利息，本金減少得慢。以上面的例子，第 1 期繳 ${n0(lnEx.firstPay)} 元，其中利息 ${n0(lnEx.rows[0].int)} 元、本金只有 ${n0(lnEx.rows[0].prin)} 元。本金平均攤還每月固定還一樣多的本金，本金減少得快，所以總利息比較少。</p>
  </section>

  <section>
    <h2>寬限期是什麼？用了會多付多少？</h2>
    <p>寬限期內每月只繳利息、不還本金。<b>貸款總年限包含寬限期</b>：貸款 30 年、寬限期 3 年，是前 3 年只繳利息，後 27 年攤還本金和利息，不是寬限期結束後再還 30 年。以 1,000 萬、2.2% 為例：</p>
    <dl class="kv" style="max-width:520px">
      <dt>前 3 年每月（只繳利息）</dt><dd>${n0(lnExG.gracePay)} 元</dd>
      <dt>第 4 年起每月（27 年攤還）</dt><dd>${n0(lnExG.firstPay)} 元</dd>
      <dt>總利息</dt><dd>${n0(lnExG.totalInt)} 元</dd>
      <dt>不用寬限期：每月</dt><dd>${n0(lnEx.firstPay)} 元</dd>
      <dt>不用寬限期：總利息</dt><dd>${n0(lnEx.totalInt)} 元</dd>
    </dl>
    <p style="margin-top:12px">寬限期結束後，月付金從 ${n0(lnExG.gracePay)} 元跳到 ${n0(lnExG.firstPay)} 元，比不用寬限期還高，總利息也多了 ${n0(lnExG.totalInt - lnEx.totalInt)} 元。申請前要先確認寬限期後的月付金負擔得起。</p>
    <p class="note">不是所有房貸都能申請寬限期。依<a href="https://www.law.cbc.gov.tw/Law/ShowAll?LawID=LA03B026002&amp;LawDataType=1" rel="noopener">中央銀行對金融機構辦理不動產抵押貸款業務規定</a>（選擇性信用管制），名下已有房屋者的購屋貸款（含第 2 戶以上）、高價住宅貸款和公司法人購屋貸款，都不得有寬限期；有換屋需求、承諾在撥款後一定期間內出售原有房屋的人，可以向銀行申請例外。規定可能調整，能不能申請請以銀行說明為準。</p>
  </section>

  <section>
    <h2>利率變動，月付金會增加多少？</h2>
    <p>房貸多是機動利率，利率調整時，銀行會用當時的剩餘本金和剩餘期數重新計算月付金。以 1,000 萬、30 年、本息平均攤還為例：</p>
    <div class="tbl"><table>
      <thead><tr><th>期間</th><th>年利率</th><th>每月還款</th></tr></thead>
      <tbody>
        <tr><td>第 1～12 個月</td><td class="num">2.2%</td><td class="num">${n0(lnChg.rows[0].pay)}</td></tr>
        <tr><td>第 13～24 個月</td><td class="num">2.5%</td><td class="num">${n0(lnChg.rows[12].pay)}</td></tr>
        <tr><td>第 25 個月起</td><td class="num">2.8%</td><td class="num">${n0(lnChg.rows[24].pay)}</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px">利率從 2.2% 升到 2.8%，每月多繳約 ${n0(lnChg.rows[24].pay - lnChg.rows[0].pay)} 元，30 年總利息從 ${n0(lnEx.totalInt / 1e4)} 萬增加到約 ${n0(lnChg.totalInt / 1e4)} 萬。打開上方工具的「利率變動」就能用自己的條件試算。</p>
  </section>

  <section>
    <h2>提前還款：縮短年限還是降低月付金？</h2>
    <p>貸款 1,000 萬、2.2%、30 年，繳完第 60 期（第 5 年底）後提前還 100 萬：</p>
    <div class="tbl"><table>
      <thead><tr><th></th><th>不提前還</th><th>縮短年限<br><small>月付金不變</small></th><th>降低月付金<br><small>年限不變</small></th></tr></thead>
      <tbody>
        <tr><td>第 61 期起每月</td><td class="num">${n0(lnEx.firstPay)}</td><td class="num">${n0(lnSh.rows[60].pay)}</td><td class="num">${n0(lnRed.rows[60].pay)}</td></tr>
        <tr><td>還清時間</td><td class="num">30 年</td><td class="num">${yms(lnSh.months)}</td><td class="num">30 年</td></tr>
        <tr><td>總利息</td><td class="num">${n0(lnEx.totalInt)}</td><td class="num">${n0(lnSh.totalInt)}</td><td class="num">${n0(lnRed.totalInt)}</td></tr>
        <tr><td>省下利息</td><td class="num">－</td><td class="num"><b>${n0(lnEx.totalInt - lnSh.totalInt)}</b></td><td class="num"><b>${n0(lnEx.totalInt - lnRed.totalInt)}</b></td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px"><b>縮短年限</b>省下的利息比較多，提早約 ${yms(360 - lnSh.months)} 還完；<b>降低月付金</b>每月少繳約 ${n0(lnEx.firstPay - lnRed.rows[60].pay)} 元，適合想保留每月現金流的人。</p>
    <p class="note">部分房貸、信貸在綁約期間內提前清償要付違約金，常見依提前還款金額的一定比例計算。提前還款前請先看貸款契約，並向銀行確認可以選哪一種方式。</p>
  </section>

  <section>
    <h2>信貸怎麼比較？看總費用年百分率</h2>
    <p>名目利率不等於實際借款成本。信貸常有開辦費、帳戶管理費等費用，各家銀行的收取方式也不同。例如同樣借 60 萬：</p>
    <div class="tbl"><table>
      <thead><tr><th>貸款年限</th><th>A 銀行<br><small>利率 3%・開辦費 3,000</small></th><th>B 銀行<br><small>利率 2.5%・開辦費 9,000</small></th><th>總還款較少</th></tr></thead>
      <tbody>
${aprRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">上排是總費用年百分率，下排是總還款金額（本金＋利息＋費用）。</p>
    <p style="margin-top:12px">B 銀行利率比較低，但開辦費多 6,000 元。借的時間短，利息差距不夠抵銷費用，A 銀行反而比較便宜；借得越久，低利率的效果越明顯。所以比較貸款方案時，要同時看<b>總費用年百分率</b>和<b>總還款金額</b>。</p>
    <p>總費用年百分率不是把費用直接加到利率上，而是用實際拿到的錢（貸款金額扣掉前期費用）和每期還款的現金流，算出相當於多少年利率，計算方式可參考<a href="https://www.cpc.ey.gov.tw/" rel="noopener">行政院消費者保護會</a>的說明。上方工具在「貸款費用」填入金額就會自動計算。</p>
  </section>

  <section>
    <h2>月收入多少可以貸多少？</h2>
    <p>一般可以先把房貸月付金控制在家庭月收入的三分之一以內。以這個比例、年利率 2.2%、30 年本息平均攤還推算：</p>
    <div class="tbl"><table>
      <thead><tr><th>家庭月收入</th><th>月付金（1/3）</th><th>約可貸金額</th></tr></thead>
      <tbody>
${capRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">三分之一只是初步參考，不是銀行核貸標準，也不代表符合比例就一定能取得貸款。實際負擔能力還要考慮其他貸款、家庭生活支出、扶養費用和緊急預備金；可貸金額則要看房屋鑑價、貸款成數、信用紀錄和負債比，以銀行核貸為準。</p>
  </section>

  <section>
    <h2>用 Excel 算月付金</h2>
    <p>上方試算結果可以按「下載逐月明細 CSV」，用 Excel 開啟就有每一期的本金、利息和剩餘本金。自己用公式算的話，貸款金額在 B1、年利率在 B2（填 2.2%）、年限在 B3，本息平均攤還每月還款：</p>
    ${formula("pmtFormula", "=PMT(B2/12,B3*12,-B1)")}
    <p style="margin-top:12px">全期總利息（本息平均攤還）：</p>
    ${formula("ipmtFormula", "=PMT(B2/12,B3*12,-B1)*B3*12-B1")}
    <p style="margin-top:12px">第 n 個月的利息和本金可以用 <code>IPMT</code>、<code>PPMT</code>，例如第 1 個月利息 <code>=IPMT(B2/12,1,B3*12,-B1)</code>。年利率填 0 時 PMT 會直接用本金 ÷ 期數。</p>
  </section>

  <section>
    <h2>計算依據與更新紀錄</h2>
    <p>本息平均攤還依年金現值公式：月付金 ＝ 剩餘本金 × 月利率 ÷ [1 −（1 ＋ 月利率）^−剩餘期數]，與 Excel PMT 函數相同；本金平均攤還每月本金 ＝ 剩餘本金 ÷ 剩餘期數，利息依剩餘本金計算。利率變動或提前還款（降低月付金）時，以當時的剩餘本金和剩餘期數重新計算；縮短年限則維持原月付金，重新計算還款期數。總費用年百分率以撥款淨額與每期還款的內部報酬率換算成年利率。</p>
    <div class="tbl"><table>
      <thead><tr><th>更新日期</th><th>內容</th></tr></thead>
      <tbody>
        <tr><td>2026/11/03</td><td>上線：本息平均攤還、本金平均攤還、寬限期、逐年還款明細</td></tr>
        <tr><td>2026/11/03</td><td>新增利率變動、提前還款（縮短年限／降低月付金）、貸款費用與總費用年百分率、逐月明細、本金利息比例圖、剩餘本金走勢圖、CSV 下載與複製結果；補充寬限期年限說明、央行寬限期限制與輸入檢查</td></tr>
      </tbody>
    </table></div>
  </section>`,
});

// ---------------- 存款利息 ----------------
const dpEx = INS.deposit({ amount: 1e6, rate: 1.7, months: 12 });
const dpExP = INS.deposit({ amount: 1e6, rate: 1.7, months: 12, mode: "payout" });
const dpExM = INS.deposit({ amount: 10000, rate: 1.7, months: 12, mode: "monthly" });
const dpExME = INS.deposit({ amount: 10000, rate: 1.7, months: 12, mode: "monthly", timing: "end" });
const nhiRows = [19999, 20000, 30000, 50000].map(v => `        <tr><td class="num">${v.toLocaleString()}</td><td class="num">${(v >= INS.DEP.nhiMin ? Math.round(v * INS.DEP.nhi) : 0).toLocaleString()}</td></tr>`).join("\n");
const dpRows = [100000, 500000, 1000000, 3000000].map(a => `        <tr><td>${(a / 1e4).toLocaleString()} 萬</td>${[1, 1.5, 2].map(r => `<td class="num">${INS.deposit({ amount: a, rate: r, months: 12 }).interest.toLocaleString()}</td>`).join("")}</tr>`).join("\n");
const depFaq = [
  ["定存利息怎麼算？", "整存整付按月複利：本利和 ＝ 本金 ×（1 ＋ 年利率 ÷ 12）^月數。存本取息每月領息、本金不變：每月利息 ＝ 本金 × 年利率 ÷ 12。100 萬元、年利率 1.7%、存 1 年，整存整付利息約 " + dpEx.interest.toLocaleString() + " 元，存本取息每月約 " + dpExP.monthlyPay.toLocaleString() + " 元。"],
  ["存款利息要繳稅嗎？", "要併入綜合所得申報。納稅義務人、合併申報的配偶及受扶養親屬，符合規定的存款利息等所得，全年合計最高可扣除 27 萬元（儲蓄投資特別扣除額）；這是全戶合計的額度，不是每個帳戶各有 27 萬，超過部分仍要依規定計稅。"],
  ["定存利息會被扣二代健保嗎？", "單次給付的利息達 2 萬元，銀行會以這次利息的全額扣 2.11% 補充保費，例如 2 萬元扣 422 元；未達 2 萬元不扣。27 萬元儲蓄投資特別扣除額是所得稅的規定，不代表二代健保也有 27 萬元免扣額度。存本取息每月領息，每次金額較小，比較不容易達到門檻。"],
  ["定存利息超過 2 萬元一定會被扣 10% 稅嗎？", "境內居住個人的一般銀行存款利息，原則上每次給付超過 2 萬元時，按給付總額扣繳 10% 所得稅；辦理儲蓄免扣證並向銀行登記的人，在登記額度內可以免扣繳。扣繳只是預繳，實際稅負以綜合所得稅申報結果為準。"],
  ["機動利率和固定利率怎麼選？", "固定利率在存款期間不變；機動利率會跟著銀行牌告利率調整。預期利率會上升時選機動比較有利，預期會下降時選固定可以鎖住利率。"],
  ["定存提前解約會怎樣？", "定期存款提前解約時，通常依銀行約定的提前解約規則，以實際存款期間適用的利率及一定比例計算利息；未滿一個月是否計息、如何計算，依各銀行契約為準。"],
  ["零存整付月初存和月底存差多少？", "月初存入的每一筆都從當月開始計息，月底存入則少算一個月利息。每月存 1 萬元、年利率 1.7%、存 1 年，月初存入利息約 " + dpExM.interest.toLocaleString() + " 元，月底存入約 " + dpExME.interest.toLocaleString() + " 元。"],
];
const depositPage = page({
  path: "/tools/interest/", crumb: "利息計算", updated: "2026-11-04",
  title: "定存利息計算機｜整存整付、存本取息、零存整付利息怎麼算",
  h1: "存款利息計算<br>定存一年可以拿多少利息？",
  desc: "定存利息計算機：輸入存款金額、年利率與期間，算出整存整付、存本取息、零存整付的利息與本利和，並提醒二代健保補充保費、利息扣繳與 27 萬儲蓄投資特別扣除額，附 Excel FV 公式。",
  faq: depFaq, app: "存款利息計算機",
  disclaimer: "本工具試算結果僅供參考，實際利息、補充保費及扣繳稅額，應以金融機構計算及稅務、健保主管機關規定為準。",
  body: `
  <div class="answer">100 萬元、年利率 1.7%、存 1 年：<b>整存整付</b>到期利息約 <b>${dpEx.interest.toLocaleString()} 元</b>；<b>存本取息</b>每月領約 <b>${dpExP.monthlyPay.toLocaleString()} 元</b>。每月月初存 1 萬元<b>零存整付</b> 1 年，利息約 ${dpExM.interest.toLocaleString()} 元。</div>

  <section>
    <h2>存款利息試算</h2>
    <form class="tool" data-tool="deposit" autocomplete="off">
      <div class="fields">
        <label class="field">存款方式<select name="mode"><option value="compound">整存整付（到期領本金＋利息）</option><option value="payout">存本取息（每月領利息）</option><option value="monthly">零存整付（每月存固定金額）</option></select></label>
        <label class="field" id="depAmtLabel">存款金額（元）<input name="amount" inputmode="numeric" placeholder="例如 1000000"></label>
        <label class="field">年利率（%）<input name="rate" inputmode="decimal" placeholder="例如 1.7"></label>
        <label class="field">存款期間（月）<input name="months" inputmode="numeric" value="12"></label>
        <span id="depTiming" hidden><label class="field">每月存入時間<select name="timing"><option value="begin">每月月初存入</option><option value="end">每月月底存入</option></select></label></span>
      </div>
      <div class="result" id="depOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">年利率請填銀行牌告的定存或活存利率。本工具採月利率（年利率 ÷ 12）估算，整存整付、零存整付按月複利；實際銀行利息可能因計息天數、存入日期、利率調整及金額進位規則而不同。計算都在你的瀏覽器裡完成。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>定存 1 年利息對照表</h2>
    <p>整存整付、存 12 個月（單位：元）：</p>
    <div class="tbl"><table>
      <thead><tr><th>存款金額</th><th>年利率 1%</th><th>1.5%</th><th>2%</th></tr></thead>
      <tbody>
${dpRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">利率只是舉例，各銀行、各期別的利率不同，也會隨央行調整利率而變動。</p>
  </section>

  <section>
    <h2>整存整付、存本取息、零存整付差在哪？</h2>
    <div class="tbl"><table>
      <thead><tr><th>方式</th><th>怎麼存</th><th>怎麼領息</th><th>適合</th></tr></thead>
      <tbody>
        <tr><td>整存整付</td><td>一次存入</td><td>利息每月滾入本金（複利），到期一次領</td><td>短期用不到的錢，想多賺一點複利</td></tr>
        <tr><td>存本取息</td><td>一次存入</td><td>每月領利息，本金到期領回</td><td>退休族、想每月有固定收入</td></tr>
        <tr><td>零存整付</td><td>每月存固定金額</td><td>按月複利，到期一次領；月初存入比月底存入多一個月利息</td><td>小資族強迫儲蓄</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px">同樣金額、利率和期間，整存整付因為利息會再生利息，總利息比存本取息多一點。</p>
  </section>

  <section>
    <h2>利息的稅和二代健保</h2>
    <p>利息會碰到三種不同的制度：報稅時的扣除額、領息時的二代健保補充保費，以及領息時的扣繳所得稅。三者門檻和算法都不一樣，不能互相抵用。</p>
    <h3 style="margin:16px 0 8px">1. 儲蓄投資特別扣除額 27 萬元（報稅時）</h3>
    <p>存款利息要併入綜合所得。納稅義務人、合併申報的配偶及受扶養親屬，符合規定的存款利息等所得，<b>全年合計</b>最高可扣除 27 萬元；不是每個銀行帳戶各有 27 萬，也不是所有利息都適用，超過部分仍要依個人所得稅規定計算。以年利率 1.7% 估算，全戶存款大約 1,500 多萬元，利息才會超過 27 萬。郵局存簿儲金本金 100 萬元以內的利息依法免稅，不用計入。報稅時可以用<a href="/tools/income-tax/">所得稅試算</a>估算稅額。</p>
    <h3 style="margin:16px 0 8px">2. 二代健保補充保費 2.11%（領息時）</h3>
    <p>單次給付的利息達 2 萬元，銀行會以<b>這次利息的全額</b>扣 2.11%，不是只算超過 2 萬元的部分：</p>
    <div class="tbl"><table>
      <thead><tr><th>單次利息（元）</th><th>補充保費（元）</th></tr></thead>
      <tbody>
${nhiRows}
      </tbody>
    </table></div>
    <p style="margin-top:12px">27 萬元儲蓄投資特別扣除額是所得稅的規定，<b>不代表二代健保也有 27 萬元免扣額度</b>，兩者是不同制度。</p>
    <h3 style="margin:16px 0 8px">3. 扣繳所得稅 10%（領息時）</h3>
    <p>境內居住個人的一般銀行存款利息，原則上每次給付超過 2 萬元時，按給付總額扣繳 10% 所得稅。符合條件、向國稅局申請<a href="https://www.etax.nat.gov.tw/etwmain/tax-info/understanding/tax-q-and-a/national/individual-income-tax/other-and-consolidation/koV3Vg9" rel="noopener">儲蓄免扣證</a>並向銀行登記的人，在登記額度內可以免扣繳。扣繳只是預繳，實際年度稅負仍以綜合所得稅申報結果為準，扣多了會在報稅時退回。</p>
  </section>

  <section>
    <h2>用 Excel 算利息</h2>
    <p>本金在 B1、年利率在 B2（填 1.7%）、月數在 B3，整存整付到期利息：</p>
    ${formula("fvFormula", "=ROUND(FV(B2/12,B3,0,-B1)-B1,0)")}
    <p style="margin-top:12px">零存整付（B1 改填每月存入金額），每月<b>月初</b>存入的到期本利和（最後的 1 代表期初存入）：</p>
    ${formula("fvmFormula", "=ROUND(FV(B2/12,B3,-B1,0,1),0)")}
    <p style="margin-top:12px">每月<b>月底</b>存入，最後一個參數改成 0：</p>
    ${formula("fvmeFormula", "=ROUND(FV(B2/12,B3,-B1,0,0),0)")}
    <p style="margin-top:12px">存本取息每月利息：<code>=ROUND(B1*B2/12,0)</code>。</p>
  </section>

  <section>
    <h2>計算依據與更新紀錄</h2>
    <p>以月利率＝年利率 ÷ 12 計算。整存整付與零存整付按月複利（零存整付可選月初或月底存入），存本取息每月以本金計息。二代健保補充保費費率 2.11%、單次給付達 2 萬元以全額計收，依<a href="https://www.nhi.gov.tw/" rel="noopener">衛福部中央健康保險署</a>規定；儲蓄投資特別扣除額 27 萬元依所得稅法第 17 條；利息扣繳 10% 依各類所得扣繳率標準，儲蓄免扣證依<a href="https://www.etax.nat.gov.tw/etwmain/tax-info/understanding/tax-q-and-a/national/individual-income-tax/other-and-consolidation/koV3Vg9" rel="noopener">財政部稅務入口網</a>說明。</p>
    <div class="tbl"><table>
      <thead><tr><th>更新日期</th><th>內容</th></tr></thead>
      <tbody>
        <tr><td>2026/11/03</td><td>上線：整存整付、存本取息、零存整付；二代健保補充保費與扣繳提醒</td></tr>
        <tr><td>2026/11/04</td><td>零存整付新增月初／月底存入選項與對應 Excel 公式；補充二代健保全額計收對照表、儲蓄免扣證、27 萬元扣除額適用範圍、計息假設與提前解約說明</td></tr>
      </tbody>
    </table></div>
  </section>`,
});

// ---------------- 匯率換算 ----------------
const CUR = [["JPY", "日圓"], ["USD", "美元"], ["KRW", "韓元"], ["EUR", "歐元"], ["CNY", "人民幣"], ["HKD", "港幣"], ["THB", "泰銖"], ["VND", "越南盾"], ["SGD", "新加坡幣"], ["GBP", "英鎊"], ["AUD", "澳幣"], ["CAD", "加幣"], ["NZD", "紐西蘭幣"], ["MYR", "馬來西亞令吉"], ["PHP", "菲律賓披索"], ["IDR", "印尼盾"], ["CHF", "瑞士法郎"]];
const fxFaq = [
  ["這裡的匯率和銀行一樣嗎？", "不一樣。預設帶入的是國際市場參考匯率（中間價，每天更新一次），不是任何銀行的牌告。銀行換匯會再加上買賣價差，要精準換算，請把匯率類型改成「銀行現金」或「銀行即期」，填入銀行牌告匯率。"],
  ["銀行的買入、賣出匯率要看哪一個？", "站在銀行的角度看：你拿台幣去買外幣，看銀行的「賣出」匯率；你把外幣換回台幣，看銀行的「買入」匯率。賣出匯率比較高、買入比較低，中間的差價就是換匯成本。"],
  ["現金匯率和即期匯率差在哪？", "現金匯率是換實體鈔票用的，銀行要負擔運鈔、保管成本，價差比較大；即期匯率用在外幣帳戶之間轉帳，價差比較小。只有要拿現金出國時才需要用現金匯率。"],
  ["怎麼比較哪一家銀行換匯比較划算？", "用頁面上的「銀行換匯成本比較」，填入要換的外幣金額和各家銀行的牌告匯率、手續費，就會算出各家需要付多少台幣、哪一家最划算。只比匯率不夠，有些銀行或通路另外收手續費。"],
  ["出國刷卡還是換現金比較划算？", "看你的卡。刷卡用發卡組織的匯率結算，再加上國外交易手續費，常見合計約 1.5%，但不同銀行、發卡組織和卡別可能不同，有海外回饋的卡可以抵銷；換現金則要承擔現金匯率的價差。用頁面上的「刷卡和換現金比較」填入自己的手續費率和回饋，就能算出哪個便宜。"],
  ["在海外網站用台幣結帳，還會收國外交易手續費嗎？", "可能會。國外交易手續費看的是交易的收單機構在不在國外，不只看幣別，有些海外網站即使用新台幣結帳，仍會被視為國外交易而收費，實際以發卡銀行規定為準。"],
  ["DCC 動態貨幣轉換是什麼？", "DCC 是在國外刷卡時，店家直接幫你換成台幣結帳。看起來清楚，但匯率通常比較差，而且仍可能被收國外交易手續費。店家詢問時，選擇用當地貨幣付款通常比較划算。"],
];
const fxPage = page({
  path: "/tools/currency/", crumb: "匯率換算", updated: "2026-11-04",
  title: "匯率換算｜日圓、美元、韓元換台幣多少，銀行換匯、刷卡成本比較",
  h1: "匯率換算<br>日圓、美元、韓元換台幣多少？",
  desc: "匯率換算工具：日圓、美元、韓元、歐元等 17 種外幣與新台幣互換，可選市場參考、銀行現金或即期匯率；比較各家銀行換匯成本、刷卡和換現金哪個划算，並顯示參考匯率實際更新時間。",
  faq: fxFaq, app: "匯率換算",
  disclaimer: "本工具試算結果僅供參考。市場參考匯率不是銀行牌告，實際換匯金額、手續費與刷卡入帳金額，以銀行及發卡機構公告為準。",
  body: `
  <div class="answer">選擇幣別、輸入金額，就會換算成新台幣，也可以反過來算台幣能換多少外幣。預設用<b>市場參考匯率</b>初步估算；到銀行換匯時，買外幣看銀行的<b>「賣出」</b>匯率，換回台幣看<b>「買入」</b>匯率，可以改選「銀行現金」或「銀行即期」填入牌告匯率。</div>

  <section>
    <h2>外幣、台幣換算</h2>
    <div class="note" id="fxStatus" style="border:1px solid var(--rule);border-radius:8px;padding:10px 12px;margin-bottom:12px;line-height:1.7">正在取得參考匯率…</div>
    <form class="tool" data-tool="fx" autocomplete="off" novalidate>
      <div class="fields">
        <label class="field">幣別<select name="cur">${CUR.map(([c, n]) => `<option value="${c}">${n}（${c}）</option>`).join("")}</select></label>
        <label class="field">換算方向<select name="dir"><option value="to-twd">外幣換台幣</option><option value="from-twd">台幣換外幣</option></select></label>
        <label class="field">匯率類型<select name="kind"><option value="market">市場參考</option><option value="cash">銀行現金（自行輸入）</option><option value="spot">銀行即期（自行輸入）</option></select></label>
        <label class="field">金額<input name="amount" inputmode="decimal" value="10000"></label>
        <label class="field" id="fxRateLabel">匯率（1 外幣 ＝ ? 新台幣）<input name="rate" inputmode="decimal"></label>
      </div>
      <p class="note" id="fxKindNote" style="margin:0"></p>
      <div class="result" id="fxOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">頁面只會向匯率資料來源下載公開匯率，你輸入的金額和銀行匯率只存在你的瀏覽器裡，不會傳出去。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>銀行換匯成本比較</h2>
    <p>同樣換 1,000 美元，各家銀行的牌告匯率和手續費都不一樣。填入你查到的匯率，看哪一家最划算（幣別依上方選擇）：</p>
    <form class="tool" data-tool="fxcmp" autocomplete="off" novalidate>
      <div class="fields">
        <label class="field">我要<select name="act"><option value="buy">用台幣買外幣（看銀行賣出）</option><option value="sell">把外幣換回台幣（看銀行買入）</option></select></label>
        <label class="field">外幣金額（<span data-cur>日圓</span>）<input name="amt" inputmode="decimal" placeholder="例如 1000"></label>
      </div>
      <div class="fields">
        <label class="field">銀行名稱<input name="n1" placeholder="銀行 A"></label>
        <label class="field"><span id="fxCmpRateHead">賣出匯率</span><input name="r1" inputmode="decimal" placeholder="例如 32.5"></label>
        <label class="field">手續費（元）<input name="f1" inputmode="decimal" placeholder="0"></label>
      </div>
      <div class="fields">
        <label class="field">銀行名稱<input name="n2" placeholder="銀行 B"></label>
        <label class="field">匯率<input name="r2" inputmode="decimal" placeholder="例如 32.35"></label>
        <label class="field">手續費（元）<input name="f2" inputmode="decimal" placeholder="0"></label>
      </div>
      <div class="fields">
        <label class="field">銀行名稱<input name="n3" placeholder="銀行 C"></label>
        <label class="field">匯率<input name="r3" inputmode="decimal"></label>
        <label class="field">手續費（元）<input name="f3" inputmode="decimal" placeholder="0"></label>
      </div>
      <div class="result" id="fxCmpOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">例如換 1,000 美元現金：銀行 A 現金賣出 32.50 要付 32,500 元，銀行 B 現金賣出 32.35 要付 32,350 元，選銀行 B 省 150 元。數字只是舉例，請填各銀行官網當下的牌告。</p>
  </section>

  <section>
    <h2>刷卡和換現金比較</h2>
    <p>出國刷卡用發卡組織的匯率結算，再加上國外交易手續費；換現金則要付現金匯率的價差。填入你的卡片條件比較看看（幣別依上方選擇）：</p>
    <form class="tool" data-tool="fxcard" autocomplete="off" novalidate>
      <div class="fields">
        <label class="field">消費金額（<span data-cur>日圓</span>）<input name="amt" inputmode="decimal" placeholder="例如 50000"></label>
        <label class="field">刷卡匯率（留空＝市場參考）<input name="crate" inputmode="decimal"></label>
        <label class="field">國外交易手續費（%）<input name="fee" inputmode="decimal" value="1.5"></label>
        <label class="field">海外消費回饋（%）<input name="back" inputmode="decimal" value="0"></label>
        <label class="field">銀行現金賣出匯率<input name="cash" inputmode="decimal" placeholder="填入要比較的現金匯率"></label>
      </div>
      <div class="result" id="fxCardOut" aria-live="polite"></div>
    </form>
  </section>

  <section>
    <h2>銀行匯率怎麼看？</h2>
    <div class="tbl"><table>
      <thead><tr><th></th><th>銀行買入</th><th>銀行賣出</th></tr></thead>
      <tbody>
        <tr><td>什麼時候用</td><td>你把外幣換回台幣</td><td>你用台幣買外幣</td></tr>
        <tr><td>數字</td><td>比較低</td><td>比較高</td></tr>
        <tr><td>現金</td><td colspan="2">換實體鈔票，價差較大</td></tr>
        <tr><td>即期</td><td colspan="2">外幣帳戶之間轉帳，價差較小</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px">例如出國前要換日圓現金，看的是銀行的「現金賣出」匯率；把旅行剩下的日圓換回台幣，看的是「現金買入」匯率。一買一賣之間的價差，就是換匯的成本。</p>
    <p><b>市場參考匯率不等於銀行匯率</b>：本頁自動帶入的是國際市場的中間價，介於銀行買入和賣出之間，只適合初步估算。實際換匯請用銀行牌告。</p>
  </section>

  <section>
    <h2>出國換匯怎麼比較省？</h2>
    <p><b>先比價</b>：各銀行的牌告匯率和手續費不同，可以先在銀行官網查詢，再用上面的比較工具算出差多少。部分銀行的線上結匯、外幣帳戶提供比臨櫃更好的匯率。</p>
    <p><b>刷卡看總成本</b>：國外交易手續費常見合計約 1.5%（包含發卡組織和發卡銀行收取的費用），但不同銀行、發卡組織及卡別可能不同。另外要注意：</p>
    <ul>
      <li>國外交易手續費不一定只限外幣交易，有些海外網站用新台幣結帳，仍可能被視為國外交易而收費。</li>
      <li>店家問要不要用台幣結帳時（DCC 動態貨幣轉換），匯率通常比較差，選當地貨幣付款通常比較划算。</li>
      <li>有海外回饋的卡片可以抵銷手續費，上方工具可以填入自己的費率和回饋比較。</li>
    </ul>
    <p><b>只換需要的量</b>：現金買賣價差大，旅行回來剩太多外幣，換回台幣時又要再付一次價差。</p>
    <p>規劃連假出國，可以先看 <a href="/2027/qingjia/">2027 全年請假攻略</a>，搭配特休排出最長的假期。</p>
  </section>

  <section>
    <h2>用 Excel 或 Google 試算表換算</h2>
    <p>外幣金額在 A2、匯率（1 外幣 ＝ ? 台幣）在 B2，換成台幣：</p>
    ${formula("fxFormula", "=A2*B2")}
    <p style="margin-top:12px">中間計算不要先四捨五入，避免連續換算累積誤差；最後要顯示時再依幣別處理小數：</p>
    <div class="tbl"><table>
      <thead><tr><th>情境</th><th>建議顯示</th><th>公式</th></tr></thead>
      <tbody>
        <tr><td>外幣換台幣</td><td>小數 2 位（付款時通常取整數）</td><td><code>=ROUND(A2*B2,2)</code></td></tr>
        <tr><td>台幣換美元、歐元等</td><td>小數 2 位</td><td><code>=ROUND(A2/B2,2)</code></td></tr>
        <tr><td>台幣換日圓、韓元</td><td>整數</td><td><code>=ROUND(A2/B2,0)</code></td></tr>
        <tr><td>比較匯率差距</td><td>保留更多位數</td><td><code>=A2*B2</code>（不取整）</td></tr>
      </tbody>
    </table></div>
    <p style="margin-top:12px">Google 試算表可以直接抓參考匯率，例如日圓換台幣：</p>
    ${formula("gfFormula", "=A2*GOOGLEFINANCE(\"CURRENCY:JPYTWD\")")}
  </section>

  <section>
    <h2>資料來源與更新紀錄</h2>
    <p>市場參考匯率由 <a href="https://www.exchangerate-api.com" rel="noopener">ExchangeRate-API</a> 提供，每天更新一次，頁面上方會顯示這份資料實際的最後更新時間和下次預計更新時間；資料超過 48 小時沒有更新，或暫時連不上資料來源時，會標示提醒並使用上次成功取得的資料。這不是任何銀行的牌告匯率，實際換匯請以銀行公告為準。頁面標題下方的「更新日期」是本頁內容的更新日期，不是匯率的日期。</p>
    <div class="tbl"><table>
      <thead><tr><th>更新日期</th><th>內容</th></tr></thead>
      <tbody>
        <tr><td>2026/11/03</td><td>上線：17 種外幣與新台幣互換，可自行填入銀行牌告匯率</td></tr>
        <tr><td>2026/11/04</td><td>顯示參考匯率實際更新時間與資料狀態（過期、連線失敗提醒）；新增匯率類型（市場參考、銀行現金、銀行即期）、銀行換匯成本比較、刷卡和換現金比較、複製換算結果；依幣別處理小數位數；補充國外交易手續費與 DCC 說明</td></tr>
      </tbody>
    </table></div>
  </section>`,
});

// ---------------- 單位換算 ----------------
const U = INS.UNITS, cv = INS.convertUnit, r2 = (v, d = 2) => (Math.round(v * 10 ** d) / 10 ** d).toLocaleString();
const pingRows = [10, 15, 20, 25, 30, 35, 40, 50, 60].map(p => `        <tr><td>${p} 坪</td><td class="num">${r2(cv("area", p, "坪", "平方公尺"))}</td></tr>`).join("\n");
const sqmRows = [30, 50, 66, 80, 100, 120, 150].map(m => `        <tr><td>${m} 平方公尺</td><td class="num">${r2(cv("area", m, "平方公尺", "坪"))}</td></tr>`).join("\n");
const jinRows = [0.5, 1, 2, 3, 5, 10].map(j => `        <tr><td>${j} 台斤</td><td class="num">${r2(cv("weight", j, "台斤", "公斤"), 3)}</td><td class="num">${r2(cv("weight", j, "台斤", "兩"), 1)}</td></tr>`).join("\n");
const inchRows = [13, 15.6, 24, 27, 32, 43, 55, 65, 75].map(i => `        <tr><td>${i} 吋</td><td class="num">${r2(cv("length", i, "吋", "公分"), 1)}</td></tr>`).join("\n");
const qb = (label, v) => `<button type="button" class="copy" data-unit="${v}" style="padding:8px 12px">${label}</button>`;
const unitFaq = [
  ["1 坪等於幾平方公尺？", "1 坪 ＝ 400/121 平方公尺，約 3.3058 平方公尺；1 平方公尺約 0.3025 坪。換算時用「平方公尺 × 0.3025」就能快速得到坪數。"],
  ["1 台斤是幾公斤？", "1 台斤 ＝ 600 公克 ＝ 0.6 公斤，1 台斤 ＝ 16 兩，1 兩 ＝ 37.5 公克。傳統市場、菜市場常用台斤計價。"],
  ["電視 55 吋是多大？", "電視、螢幕的吋數指的是螢幕對角線長度。1 吋 ＝ 2.54 公分，55 吋約 139.7 公分；16:9 的 55 吋電視，畫面寬約 121.8 公分、高約 68.5 公分。"],
  ["權狀坪數和室內坪數一樣嗎？", "不一樣。權狀坪數包含主建物、附屬建物（陽台等）和公共設施的持分，實際室內使用的坪數會比較小。看房時要問清楚公設比。"],
  ["攝氏和華氏怎麼換算？", "°F ＝ °C × 9/5 ＋ 32，°C ＝（°F − 32）× 5/9。例如體溫 37°C 約 98.6°F，美國天氣預報的 77°F 是 25°C。"],
];
const unitPage = page({
  path: "/tools/unit/", crumb: "單位換算", updated: NEW,
  title: "單位換算｜坪、平方公尺、台斤、公斤、吋、公分換算（台灣常用單位）",
  h1: "單位換算<br>坪、台斤、吋換算一次搞定",
  desc: "台灣常用單位換算：坪與平方公尺、台斤與公斤、兩、吋與公分、英尺、加侖、攝氏華氏一鍵換算，附坪數對照表、台斤對照表、電視吋數對照表與 Excel 公式。",
  faq: unitFaq, app: "單位換算",
  body: `
  <div class="answer"><b>1 坪 ≈ 3.3058 平方公尺</b>（1 平方公尺 ≈ 0.3025 坪）；<b>1 台斤 ＝ 600 公克</b> ＝ 16 兩；<b>1 吋 ＝ 2.54 公分</b>。選擇類別、輸入數值，就會換算成所有常用單位。</div>

  <section>
    <h2>單位換算</h2>
    <form class="tool" data-tool="unit" autocomplete="off">
      <div class="fields">
        <label class="field">類別<select name="cat">${Object.entries(U).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}<option value="temp">溫度</option></select></label>
        <label class="field">數值<input name="v" inputmode="decimal" value="30"></label>
      </div>
      <div class="fields" id="unitPair">
        <label class="field">從<select name="from"></select></label>
        <label class="field">換成<select name="to"></select></label>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="copy" id="unitSwap" style="padding:8px 12px">⇄ 對調單位</button>
        ${qb("坪 → 平方公尺", "area|坪|平方公尺|30")}
        ${qb("台斤 → 公斤", "weight|台斤|公斤|1")}
        ${qb("吋 → 公分", "length|吋|公分|55")}
        ${qb("攝氏 ⇄ 華氏", "temp|||37")}
      </div>
      <div class="result" id="unitOut" aria-live="polite"></div>
    </form>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>坪數換算對照表</h2>
    <div class="tbl"><table>
      <thead><tr><th>坪</th><th>平方公尺</th></tr></thead>
      <tbody>
${pingRows}
      </tbody>
    </table></div>
    <div class="tbl" style="margin-top:12px"><table>
      <thead><tr><th>平方公尺</th><th>坪</th></tr></thead>
      <tbody>
${sqmRows}
      </tbody>
    </table></div>
    <p style="margin-top:12px">1 坪是邊長 6 台尺的正方形，1 台尺 ＝ 10/33 公尺，所以 1 坪 ＝（60/33）² ＝ 400/121 平方公尺。土地常用的 1 甲 ＝ 2,934 坪，約 0.97 公頃。</p>
  </section>

  <section>
    <h2>台斤、兩、公斤對照表</h2>
    <div class="tbl"><table>
      <thead><tr><th>台斤</th><th>公斤</th><th>兩</th></tr></thead>
      <tbody>
${jinRows}
      </tbody>
    </table></div>
    <p style="margin-top:12px">1 台斤 ＝ 16 兩 ＝ 600 公克，1 兩 ＝ 10 錢 ＝ 37.5 公克。中國大陸的「斤」是 500 公克，和台斤不同。</p>
  </section>

  <section>
    <h2>螢幕吋數換算公分</h2>
    <div class="tbl"><table>
      <thead><tr><th>吋數（對角線）</th><th>公分</th></tr></thead>
      <tbody>
${inchRows}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">螢幕吋數是對角線長度；16:9 螢幕的寬約為對角線 × 0.87、高約為 × 0.49。</p>
  </section>

  <section>
    <h2>用 Excel 換算單位</h2>
    <p>平方公尺在 A2，換成坪：</p>
    ${formula("pingFormula", "=ROUND(A2*121/400,2)")}
    <p style="margin-top:12px">台斤在 A2，換成公斤：<code>=A2*0.6</code>。英制單位可以用 Excel 內建的 CONVERT，例如吋換公分：</p>
    ${formula("convFormula", "=CONVERT(A2,\"in\",\"cm\")")}
  </section>

  <section>
    <h2>換算依據與更新紀錄</h2>
    <p>1 坪 ＝ 400/121 平方公尺、1 台斤 ＝ 600 公克、1 甲 ＝ 2,934 坪；英制單位依國際定義（1 吋 ＝ 2.54 公分、1 磅 ＝ 453.59237 公克、1 美制加侖 ＝ 3.785411784 公升）。</p>
    <div class="tbl"><table>
      <thead><tr><th>更新日期</th><th>內容</th></tr></thead>
      <tbody>
        <tr><td>2026/11/03</td><td>上線：面積、重量、長度、容量、溫度換算</td></tr>
      </tbody>
    </table></div>
  </section>`,
});

const out = { "tools/loan/index.html": loanPage, "tools/interest/index.html": depositPage, "tools/currency/index.html": fxPage, "tools/unit/index.html": unitPage, "tools/labor-insurance-pension/index.html": laborInsPensionPage, "tools/index.html": hub, "tools/insurance/index.html": insurance, "tools/take-home-pay/index.html": takeHome, "tools/severance/index.html": severancePage, "tools/pension/index.html": pensionPage, "tools/income-tax/index.html": tax, "tools/annual-leave/index.html": leave, "tools/overtime/index.html": overtime, "tools/workdays/index.html": workdays };
for (const [f, html] of Object.entries(out)) {
  mkdirSync(f.replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(f, html);
  console.log("wrote", f);
}
