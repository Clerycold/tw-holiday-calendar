// 產生 /tools/ 試算工具頁。執行：node _src/build-tools.mjs（在 repo 根目錄）
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require_ = createRequire(import.meta.url);
const { TW_HOL } = require_("../assets/tools/calc.js");

const SITE = "https://fangjiatw.com";
const UPDATED = "2026-11-01";
const NAV = `<nav><a href="/#planner">請假計算器</a><a href="/tools/">試算工具</a><a href="/concert/">演唱會住宿</a><a href="/#calendar">全年行事曆</a></nav>`;
const esc = s => s.replace(/"/g, "&quot;");

function page({ path, title, h1, desc, crumb, faq = [], body, scripts = true, app }) {
  const url = SITE + path;
  const graph = [
    { "@type": "WebPage", name: title, url, inLanguage: "zh-Hant-TW", dateModified: UPDATED,
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
<link rel="stylesheet" href="/assets/tools/tools.css?v=2">
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
    <div class="meta">更新日期：2026 年 11 月 1 日</div>
  </div>
${body}${faqHtml}
${path === "/tools/" ? "" : related(path)}
</main>

<footer><a href="/about/">關於我們</a> · <a href="/privacy/">隱私權政策</a> · <a href="/disclosure/">聯盟連結揭露</a><br>本站試算結果僅供參考，實際金額以主管機關規定、公司制度及官方系統計算為準。</footer>
${scripts ? `<script src="/assets/tools/calc.js?v=3"></script>
<script src="/assets/tools/ui.js?v=3"></script>` : ""}
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
];
function related(path) {
  const others = TOOLS.filter(t => t.path !== path).map(t => `      <a href="${t.path}">${t.name}<small>${t.sub}</small></a>`);
  return `
  <section>
    <h2>其他試算工具</h2>
    <div class="related">
${others.join("\n")}
      <a href="/#planner">請假計算器<small>輸入特休天數，排出最長連休</small></a>
    </div>
  </section>`;
}
const field = (name, label, attrs = "") => `<label class="field">${label}<input name="${name}" inputmode="numeric" ${attrs}></label>`;
const dl = (file, name, what) => `<div class="dl"><a href="/downloads/${file}" download="${name}">⬇ 下載 Excel 範本</a><span>${what}</span></div>`;
const formula = (id, text) => `<div class="formula"><code id="${id}">${text}</code><button type="button" class="copy" data-copy="${id}">複製</button></div>`;

// ---------------- 試算工具總覽 ----------------
const hub = page({
  path: "/tools/", crumb: "試算工具",
  title: "生活計算工具｜報稅、特休、加班費、工作天數一次搞定",
  h1: "生活計算工具<br>報稅、特休、加班費、工作天數一次搞定",
  desc: "不用下載軟體、不用自己研究公式：115 年度綜所稅試算、特休計算、加班費計算、扣除台灣國定假日的工作天數計算。每項工具附計算說明、Excel 公式及免費範本。",
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
${TOOLS.map(t => `        <tr><td>${t.xlsName}</td><td>${t.xlsFor}</td><td><a href="/downloads/${t.xls}" download="${t.xlsName}_放假日曆.xlsx">下載 .xlsx</a></td></tr>`).join("\n")}
      </tbody>
    </table></div>
  </section>

  <section>
    <h2>開發中的工具</h2>
    <p>以下工具還在製作，<b>目前還不能使用</b>，完成後會出現在上方的工具列表：</p>
    <div class="toolgrid">
      <div class="soon" style="border:1px dashed var(--rule);border-radius:8px;padding:16px"><span class="pill">開發中</span><b style="display:block;margin:6px 0">薪資實領計算</b><small class="note">月薪扣掉勞健保、所得稅預扣後，實際入帳多少。</small></div>
      <div class="soon" style="border:1px dashed var(--rule);border-radius:8px;padding:16px"><span class="pill">開發中</span><b style="display:block;margin:6px 0">資遣費計算</b><small class="note">輸入到職日、離職日與平均工資，計算新舊制資遣費。</small></div>
    </div>
  </section>

  <section>
    <h2>資料來源與更新紀錄</h2>
    <p>稅額依財政部公告的 115 年度免稅額、扣除額及課稅級距；特休與加班費依勞動基準法；國定假日依人事行政總處公布的辦公日曆表。規定更新時，我們會同步修正工具與 Excel 範本，並在各工具頁的「法規更新紀錄」註明修法日期、適用年度和官方連結。</p>
    <p class="note">所有計算都在你的瀏覽器裡完成，輸入的薪資、所得等數字不會傳到本站或任何第三方。試算結果僅供參考，個人情況較複雜（例如有股利、海外所得或特殊排班）時，請以官方系統或專業人士的計算為準。</p>
  </section>

  <section>
    <h2>放假與請假</h2>
    <div class="related">
      <a href="/#planner">請假計算器<small>輸入特休天數，排出最長連休</small></a>
      <a href="/2027/chunjie/">2027 春節連假攻略<small>請 5 天休 16 天</small></a>
      <a href="/2027/228/">2027 228 連假攻略<small>請 4 天連休 9 天</small></a>
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

const out = { "tools/index.html": hub, "tools/insurance/index.html": insurance, "tools/income-tax/index.html": tax, "tools/annual-leave/index.html": leave, "tools/overtime/index.html": overtime, "tools/workdays/index.html": workdays };
for (const [f, html] of Object.entries(out)) {
  mkdirSync(f.replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(f, html);
  console.log("wrote", f);
}
