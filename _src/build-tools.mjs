// 產生 /tools/ 試算工具頁。執行：node _src/build-tools.mjs（在 repo 根目錄）
import { writeFileSync, mkdirSync } from "node:fs";

const SITE = "https://fangjiatw.com";
const UPDATED = "2026-11-01";
const NAV = `<nav><a href="/#planner">請假計算器</a><a href="/tools/">試算工具</a><a href="/concert/">演唱會住宿</a><a href="/#calendar">全年行事曆</a></nav>`;
const esc = s => s.replace(/"/g, "&quot;");

function page({ path, title, h1, desc, crumb, faq = [], body, scripts = true }) {
  const url = SITE + path;
  const graph = [
    { "@type": "WebPage", name: title, url, inLanguage: "zh-Hant-TW", dateModified: UPDATED,
      publisher: { "@type": "Organization", name: "放假日曆", url: SITE + "/" } },
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
${scripts ? `<script src="/assets/tools/calc.js?v=1"></script>
<script src="/assets/tools/ui.js?v=1"></script>` : ""}
</body>
</html>
`;
}

const TOOLS = [
  { path: "/tools/income-tax/", name: "所得稅試算", sub: "115 年度綜所稅，明年 5 月報稅用", pill: "報稅" },
  { path: "/tools/annual-leave/", name: "特休計算機", sub: "輸入到職日，算出今年有幾天特休", pill: "勞工" },
  { path: "/tools/overtime/", name: "加班費計算機", sub: "平日、休息日、國定假日加班費", pill: "勞工" },
  { path: "/tools/workdays/", name: "工作天數計算", sub: "扣掉國定假日＋Excel NETWORKDAYS 公式", pill: "Excel" },
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
  title: "生活試算工具｜報稅、特休、加班費、Excel 工作天數計算",
  h1: "生活試算工具",
  desc: "免費線上試算工具：115 年度綜所稅試算、特休天數計算、加班費計算、扣除台灣國定假日的工作天數計算，每個工具都附 Excel 公式。",
  body: `
  <div class="answer">報稅、特休、加班費、工作天數，輸入數字就算好。<b>每個工具都附 Excel 公式</b>，想自己做表也能直接複製。</div>

  <section>
    <h2>選一個工具開始</h2>
    <div class="toolgrid">
${TOOLS.map(t => `      <a href="${t.path}"><span class="pill">${t.pill}</span><b>${t.name}</b><small>${t.sub}</small><span class="go">開始試算 →</span></a>`).join("\n")}
      <a class="soon" aria-disabled="true"><span class="pill">即將推出</span><b>勞健保自付額</b><small>依月薪算出每月勞保、健保自付金額</small></a>
      <a class="soon" aria-disabled="true"><span class="pill">即將推出</span><b>資遣費計算</b><small>依年資與平均工資試算資遣費</small></a>
    </div>
  </section>

  <section>
    <h2>為什麼每個工具都附 Excel 公式？</h2>
    <p>線上試算適合算一次；但如果你是人資、會計，或要幫整個部門算特休、加班費，用 Excel 一次算一整排更有效率。</p>
    <p>所以每個工具下面都有對應的 Excel 公式，複製貼上就能用；也可以直接<b>下載已經寫好公式的 Excel 範本</b>，填入數字就會自動計算，也會說明公式怎麼運作，之後規定調整時你也知道要改哪裡。</p>
  </section>

  <section>
    <h2>資料怎麼來</h2>
    <p>稅額依財政部公告的 115 年度免稅額、扣除額及課稅級距；特休與加班費依勞動基準法；國定假日依人事行政總處公布的辦公日曆表。規定有更新時，我們會同步修正，並在頁面標示更新日期。</p>
    <p class="note">試算結果僅供參考。個人情況較複雜（例如有股利、海外所得或特殊排班）時，請以官方系統或專業人士的計算為準。</p>
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
  ["單身上班族年薪多少以下不用繳稅？", "單身、只有薪資所得、用標準扣除額時，年薪 46.4 萬元以下不用繳稅；如果是無自有房屋的租屋族，可以再減除房屋租金支出特別扣除額 18 萬元，年薪 64.4 萬元以下不用繳稅。"],
  ["夫妻要合併還是分開計稅？", "夫妻要合併申報，但稅額可以選擇薪資分開計稅或各類所得分開計稅。報稅系統會自動比較，幫你選最省的方式；本試算也會比較這幾種方式，顯示最省的結果。"],
  ["試算結果和實際報稅不一樣？", "本試算只計算薪資、其他所得和常見的免稅額、扣除額，沒有包含股利、儲蓄投資特別扣除額、教育學費、最低稅負制等項目；基本生活費也暫用 114 年度金額。實際稅額請以財政部報稅系統為準。"],
];
const tax = page({
  path: "/tools/income-tax/", crumb: "所得稅試算",
  title: "2027 報稅試算｜115 年度綜所稅計算機（免稅額、扣除額、級距）",
  h1: "115 年度綜所稅試算<br>明年 5 月報稅前先算一次",
  desc: "115 年度綜合所得稅試算：免稅額 10.1 萬、未成年子女 15.15 萬、標準扣除額 13.6 萬、薪資特別扣除額 22.7 萬，淨所得 61 萬以下稅率 5%。輸入薪資立即算出應納稅額，附 Excel 公式。",
  faq: taxFaq,
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
        </div>
        <label class="check"><input type="checkbox" name="rent">租屋，且全家沒有自有房屋</label>
      </fieldset>
      <div class="result" id="taxOut" aria-live="polite"></div>
    </form>
    <p class="note" style="margin-top:8px">本試算未包含股利、儲蓄投資、教育學費等項目；基本生活費 115 年度金額公告前，暫以 114 年度每人 21.3 萬元計算。你輸入的數字只存在自己的瀏覽器，不會傳到本站。</p>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>115 年度免稅額、扣除額一覽</h2>
    <div class="tbl"><table>
      <thead><tr><th>項目</th><th>115 年度</th><th>114 年度</th></tr></thead>
      <tbody>
        <tr><td>免稅額</td><td class="num">101,000</td><td class="num">97,000</td></tr>
        <tr><td>免稅額（70 歲以上、未成年子女）</td><td class="num">151,500</td><td class="num">145,500（70 歲以上）</td></tr>
        <tr><td>標準扣除額（單身／有配偶）</td><td class="num">136,000／272,000</td><td class="num">131,000／262,000</td></tr>
        <tr><td>薪資所得特別扣除額</td><td class="num">227,000</td><td class="num">218,000</td></tr>
        <tr><td>身心障礙特別扣除額</td><td class="num">227,000</td><td class="num">218,000</td></tr>
        <tr><td>幼兒學前特別扣除額</td><td class="num">第 1 名 150,000，第 2 名起 225,000</td><td class="num">同左</td></tr>
        <tr><td>長期照顧特別扣除額</td><td class="num">180,000</td><td class="num">180,000</td></tr>
        <tr><td>房屋租金支出特別扣除額</td><td class="num">180,000</td><td class="num">180,000</td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">幼兒學前、長期照顧及房屋租金支出特別扣除額，適用稅率 20% 以上者不適用。</p>
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
  faq: leaveFaq,
  body: `
  <div class="answer">依勞基法，工作滿 <b>6 個月有 3 天</b>特休、<b>滿 1 年 7 天</b>、滿 2 年 10 天，<b>滿 3 年 14 天</b>、滿 5 年 15 天，之後每多一年加一天，<b>最多 30 天</b>。</div>

  <section>
    <h2>特休天數計算</h2>
    <form class="tool" data-tool="leave" autocomplete="off">
      <div class="fields">
        <label class="field">到職日<input type="date" name="hire" min="1970-01-01"></label>
        <label class="field">計算日（預設今天）<input type="date" name="asOf"></label>
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
    <h2>特休沒休完，可以換錢嗎？</h2>
    <p>可以。年度結束或離職時還沒休完的特休，<b>雇主應該發給工資</b>，一天的金額通常以月薪 ÷ 30 計算。</p>
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
];
const overtime = page({
  path: "/tools/overtime/", crumb: "加班費計算機",
  title: "加班費計算機｜平日、休息日、國定假日加班費怎麼算",
  h1: "加班費計算機<br>平日、休息日、國定假日一次算",
  desc: "加班費計算機：輸入月薪與加班時數，依勞基法算出平日加班（1⅓、1⅔ 倍）、休息日加班與國定假日出勤的加班費，附 Excel 公式。",
  faq: otFaq,
  body: `
  <div class="answer">時薪 ＝ 月薪 ÷ 240。<b>平日加班</b>前 2 小時 1⅓ 倍、再 2 小時 1⅔ 倍；<b>休息日</b>前 2 小時 1⅓ 倍、3～8 小時 1⅔ 倍、9～12 小時 2⅔ 倍；<b>國定假日</b>出勤加發 1 日工資。</div>

  <section>
    <h2>加班費試算</h2>
    <form class="tool" data-tool="overtime" autocomplete="off">
      <div class="fields">${field("salary", "月薪（元）", 'placeholder="例如 36000"')}</div>
      <fieldset>
        <legend>平日加班</legend>
        <div class="fields">${field("wdH", "每次幾小時（最多 4）")}${field("wdN", "幾次", 'value="1"')}</div>
      </fieldset>
      <fieldset>
        <legend>休息日加班（通常是週六）</legend>
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

  <div class="ad">廣告版位 336×280</div>

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
    <p>國定假日遇到週末時，政府機關會在週五或週一補假，但<b>民間企業的補假日期由勞雇雙方協商</b>，不一定和政府相同。補假那天如果要上班，一樣算國定假日出勤。2027 年各連假的補假日期，可以看<a href="/#calendar">全年行事曆</a>。</p>
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
  faq: wdFaq,
  body: `
  <div class="answer">2026 年共有 <b>245 個</b>工作天，2027 年共有 <b>244 個</b>（以政府辦公日曆計算）。下面的工具能算任兩個日期之間的工作天數，也附上可直接貼進 Excel 的<b>台灣假日清單</b>。</div>

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
    <p class="note" style="margin-top:8px">以人事行政總處辦公日曆表計算，涵蓋 2026～2027 年。民間企業的補假日期可能不同。</p>
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

const out = { "tools/index.html": hub, "tools/income-tax/index.html": tax, "tools/annual-leave/index.html": leave, "tools/overtime/index.html": overtime, "tools/workdays/index.html": workdays };
for (const [f, html] of Object.entries(out)) {
  mkdirSync(f.replace(/\/[^/]+$/, ""), { recursive: true });
  writeFileSync(f, html);
  console.log("wrote", f);
}
