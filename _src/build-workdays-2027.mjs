// 產生「2027 每月工作天數」：/2027/workdays/（總覽）＋ /2027/workdays/01/～12/（單月），並更新 sitemap.xml。
// 執行：node _src/build-workdays-2027.mjs（在 repo 根目錄）
// 假日資料直接用 assets/tools/calc.js 的 TW_HOL（和 /tools/workdays/ 同一份），
// 並在建置時和首頁 index.html 的 HOL 逐筆比對，兩邊不一致就中止，避免頁面數字和工具算出來的不同。
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require_ = createRequire(import.meta.url);
const { TW_HOL } = require_("../assets/tools/calc.js");

const SITE = "https://fangjiatw.com";
const YEAR = 2027;
const UPDATED = "2026-11-26";
const HEADER = readFileSync(new URL("./header.html", import.meta.url), "utf8").trim();
const esc = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const W = "日一二三四五六";
const pad = n => String(n).padStart(2, "0");
const key = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const md = d => `${d.getMonth() + 1}/${d.getDate()}（${W[d.getDay()]}）`;
const mdY = d => (d.getFullYear() === 2027 ? "" : d.getFullYear() + "/") + md(d);  // 跨年的日期標出年份
const isWeekend = d => d.getDay() === 0 || d.getDay() === 6;

// ---------- 1. 假日資料一致性檢查：calc.js TW_HOL vs 首頁 HOL ----------
{
  const home = readFileSync("index.html", "utf8");
  const homeKeys = [...home.matchAll(/"(2027-\d\d-\d\d)":\["[^"]+","[hm]"\]/g)].map(m => m[1]).sort();
  const calcKeys = Object.keys(TW_HOL).filter(k => k.startsWith("2027")).sort();
  if (homeKeys.join() !== calcKeys.join()) {
    throw new Error(`2027 假日資料不一致\n首頁 HOL：${homeKeys}\ncalc.js TW_HOL：${calcKeys}`);
  }
}

// ---------- 2. 逐日計算 ----------
// 把同一個節日的不同名稱合併成一個（春節初一～補假都算「春節」），給描述與 FAQ 用
const fest = n => /春節|小年夜|除夕/.test(n) ? "春節" : n === "元旦補假" ? "元旦補假" : n.replace(/補假$/, "");
// 連假：連續 3 天以上的放假日（週末＋國定假日／補假），且裡面至少有 1 天國定假日
const BLOCK_PAGE = [ // 連假裡出現這些假日名稱時，帶出對應攻略頁
  [/元旦補假/, "/2027/xingxian/", "年底行憲＋跨年連假攻略"], [/元旦/, "/2027/yuandan/", "元旦連假攻略"],
  [/春節|小年夜|除夕/, "/2027/chunjie/", "春節連假攻略"], [/和平紀念日/, "/2027/228/", "228 連假攻略"],
  [/兒童節|清明節/, "/2027/qingming/", "清明連假攻略"], [/勞動節/, "/2027/laodong/", "勞動節連假攻略"],
  [/國慶日/, "/2027/guoqing/", "國慶連假攻略"], [/光復節/, "/2027/guangfu/", "光復節連假攻略"], [/行憲紀念日/, "/2027/xingxian/", "行憲紀念日連假攻略"],
];
const off = d => isWeekend(d) || !!TW_HOL[key(d)];
const blocks = [];
for (let d = new Date(YEAR - 1, 11, 20); d <= new Date(YEAR + 1, 0, 10); d.setDate(d.getDate() + 1)) {
  if (!off(d)) continue;
  const s = new Date(d); let e = new Date(d);
  while (off(new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1))) e = new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1);
  const days = []; for (let x = new Date(s); x <= e; x.setDate(x.getDate() + 1)) days.push(new Date(x));
  const names = [...new Set(days.map(x => TW_HOL[key(x)]).filter(Boolean).map(fest))];
  if (days.length >= 3 && names.length) blocks.push({ s, e, len: days.length, names });
  d = new Date(e);  // 用副本往下走，不要動到已存進 blocks 的結束日
}

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1, dim = new Date(YEAR, m, 0).getDate();
  let weekend = 0, wkHol = 0; const work = [], hol = [];
  for (let day = 1; day <= dim; day++) {
    const d = new Date(YEAR, i, day), k = key(d), h = TW_HOL[k];
    if (h) hol.push({ d, name: h, weekend: isWeekend(d) });
    if (isWeekend(d)) weekend++;
    else if (h) wkHol++;
    else work.push(d);
  }
  const mb = blocks.filter(b => b.s <= new Date(YEAR, i, dim) && b.e >= new Date(YEAR, i, 1));
  const pages = [];
  hol.forEach(h => { const p = BLOCK_PAGE.find(([re]) => re.test(h.name)); if (p && !pages.some(x => x[0] === p[1]) && mb.some(b => h.d >= b.s && h.d <= b.e)) pages.push([p[1], p[2]]); });
  const r = { m, mm: pad(m), dim, weekend, wkHol, work: work.length, hours: work.length * 8, first: work[0], last: work.at(-1), hol, blocks: mb, pages,
    festW: [...new Set(hol.filter(h => !h.weekend).map(h => fest(h.name)))] };
  if (r.work !== dim - weekend - wkHol) throw new Error(`${m} 月天數拆解對不上`);
  return r;
});
const TOTAL = MONTHS.reduce((a, x) => ({ dim: a.dim + x.dim, weekend: a.weekend + x.weekend, wkHol: a.wkHol + x.wkHol, work: a.work + x.work }), { dim: 0, weekend: 0, wkHol: 0, work: 0 });
if (TOTAL.dim !== 365) throw new Error("2027 應為 365 天");

// ---------- 3. 共用版型 ----------
const TITLE_SUF = "｜放假日曆";
function page({ path, title, desc, h1, crumbs, body, faq = [] }) {
  const url = SITE + path;
  if ((title + TITLE_SUF).length < 26 || (title + TITLE_SUF).length > 38) throw new Error(`標題長度 ${(title + TITLE_SUF).length}：${title}`);
  const graph = [
    { "@type": "WebPage", name: title, url, description: desc, inLanguage: "zh-Hant-TW", dateModified: UPDATED, publisher: { "@type": "Organization", name: "放假日曆", url: SITE + "/" } },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "放假日曆", item: SITE + "/" },
      ...crumbs.map(([n, u], i) => ({ "@type": "ListItem", position: i + 2, name: n, item: SITE + u }))] },
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
<meta name="google-adsense-account" content="ca-pub-1876699539464325">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}${TITLE_SUF}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/assets/og/tools-workdays.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=9">
<link rel="stylesheet" href="/assets/tools/tools.css?v=11">
<style>.wd-sum{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));margin:0}.wd-sum>div{background:var(--leave-soft);border-radius:10px;padding:10px 12px}.wd-sum dt{font-size:.8rem;color:var(--muted);font-weight:700}.wd-sum dd{margin:2px 0 0;font-weight:700;font-variant-numeric:tabular-nums}.wd-sum dd b{font-size:1.6rem;color:var(--leave)}.wd-calc{font-variant-numeric:tabular-nums}.mnav{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}.mnav a{flex:1 1 140px;min-height:44px;display:flex;align-items:center;justify-content:center;border:1px solid var(--rule);border-radius:8px;background:var(--sheet);color:var(--ink);text-decoration:none;font-weight:700;padding:8px 12px}.mnav a:hover{border-color:var(--leave);color:var(--leave)}.mlist{display:flex;flex-wrap:wrap;gap:6px}.mlist a{min-width:52px;min-height:40px;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--rule);border-radius:999px;background:var(--sheet);color:var(--ink);text-decoration:none;font-size:.9rem;padding:0 10px}.mlist a[aria-current="page"]{background:var(--leave);border-color:var(--leave);color:var(--on-brand,#fff);font-weight:700}</style>
<script type="application/ld+json">
${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 1)}
</script>
</head>
<body>
${HEADER}

<main class="article">
  <div>
    <div class="crumb"><a href="/">放假日曆</a> › ${crumbs.map(([n, u], i) => i === crumbs.length - 1 ? n : `<a href="${u}">${n}</a>`).join(" › ")}</div>
    <h1>${h1}</h1>
    <div class="meta">更新日期：2026 年 11 月 26 日 · 資料來源：人事行政總處 116 年政府行政機關辦公日曆表</div>
  </div>
${body}${faqHtml}
</main>

<footer><a href="/about/">關於我們</a> · <a href="/privacy/">隱私權政策</a> · <a href="/disclosure/">聯盟連結揭露</a><br>放假日曆｜台灣生活資訊與免費試算工具。<br>工作天數依政府行政機關辦公日曆表、週休二日計算；民間企業補假、排班制請以公司公告為準。</footer>
<script>
document.addEventListener("click", e => {
  const b = e.target.closest(".copy[data-copy]"); if(!b) return;
  const text = document.getElementById(b.dataset.copy).textContent, t = b.textContent;
  const done = ok => { b.textContent = ok ? "已複製" : "複製失敗"; setTimeout(() => b.textContent = t, 1500); };
  const legacy = () => { try{ const a = document.createElement("textarea"); a.value = text; a.setAttribute("readonly",""); a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); done(ok); }catch(err){ done(false); } };
  if(navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => done(true), legacy); else legacy();
});
</script>
<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "4c058fe6d8d047d290cd5fe7c73a3d15"}'></script><!-- End Cloudflare Web Analytics -->
</body>
</html>
`;
}
const formula = (id, text) => `<div class="formula"><code id="${id}">${text}</code><button type="button" class="copy" data-copy="${id}">複製</button></div>`;
const monthList = cur => `<nav class="mlist" aria-label="2027 各月份">${MONTHS.map(x => `<a href="/2027/workdays/${x.mm}/"${x.m === cur ? ' aria-current="page"' : ""}>${x.m} 月</a>`).join("")}</nav>`;
const holText = x => x.festW.length ? x.festW.join("、") : "";

// ---------- 4. 單月頁 ----------
const monthPage = x => {
  const prev = x.m === 1 ? ["/2027/workdays/", "← 2027 全年總覽"] : [`/2027/workdays/${pad(x.m - 1)}/`, `← ${x.m - 1} 月工作天數`];
  const next = x.m === 12 ? ["/2027/workdays/", "2027 全年總覽 →"] : [`/2027/workdays/${pad(x.m + 1)}/`, `${x.m + 1} 月工作天數 →`];
  const calc = `${x.dim} 天 − 週末 ${x.weekend} 天${x.wkHol ? ` − 平日國定假日／補假 ${x.wkHol} 天` : ""} ＝ <b>${x.work} 個工作天</b>`;
  const start = `DATE(${YEAR},${x.m},1)`, end = `DATE(${YEAR},${x.m},${x.dim})`;
  const title = `2027 年 ${x.m} 月工作天數｜上班 ${x.work} 天、工時 ${x.hours} 小時`;
  const desc = `2027 年 ${x.m} 月共 ${x.dim} 天，扣掉 ${x.weekend} 天週末${x.wkHol ? `與 ${x.wkHol} 天平日國定假日（${holText(x)}）` : "，本月平日沒有國定假日"}，實際上班 ${x.work} 天、標準工時 ${x.hours} 小時。第一個上班日 ${md(x.first)}、最後一個 ${md(x.last)}，附 Excel 公式。`;
  const holRows = x.hol.map(h => `        <tr><td class="num">${md(h.d)}</td><td>${h.name}</td><td>${h.weekend ? "落在週末，不另外扣" : "<b>平日放假，扣 1 天</b>"}</td></tr>`).join("\n");
  const faq = [
    [`2027 年 ${x.m} 月有幾個工作天？`, `${x.work} 個工作天。${x.m} 月共 ${x.dim} 天，扣掉 ${x.weekend} 天週六日${x.wkHol ? `和 ${x.wkHol} 天落在平日的國定假日或補假（${holText(x)}）` : ""}，以週休二日計算，標準工時 ${x.hours} 小時。`],
    x.hol.length
      ? [`2027 年 ${x.m} 月有哪些國定假日？`, `${x.hol.map(h => `${md(h.d)} ${h.name}${h.weekend ? "（遇週末）" : ""}`).join("、")}。${x.wkHol ? `其中落在平日、會減少工作天的有 ${x.wkHol} 天。` : "都落在週末，不影響工作天數。"}`]
      : [`2027 年 ${x.m} 月有國定假日嗎？`, `沒有。2027 年 ${x.m} 月沒有國定假日或補假，工作天數只扣掉週六、週日，共 ${x.work} 天。`],
    [`2027 年 ${x.m} 月第一個和最後一個上班日是哪天？`, `第一個上班日是 ${md(x.first)}，最後一個上班日是 ${md(x.last)}，以政府行政機關辦公日曆、週休二日計算。`],
  ];
  const body = `
  <div class="answer">2027 年 ${x.m} 月共有 <b>${x.work} 個工作天</b>，標準工時 <b>${x.hours} 小時</b>（${x.work} 天 × 8 小時）。<br><span class="wd-calc">${calc}</span></div>

  <section>
    <h2>2027 年 ${x.m} 月工作天數一覽</h2>
    <dl class="wd-sum">
      <div><dt>工作天數</dt><dd><b>${x.work}</b> 天</dd></div>
      <div><dt>標準工時</dt><dd><b>${x.hours}</b> 小時</dd></div>
      <div><dt>週六日</dt><dd>${x.weekend} 天</dd></div>
      <div><dt>平日國定假日／補假</dt><dd>${x.wkHol} 天</dd></div>
      <div><dt>第一個上班日</dt><dd>${md(x.first)}</dd></div>
      <div><dt>最後一個上班日</dt><dd>${md(x.last)}</dd></div>
    </dl>
  </section>

  <section>
    <h2>2027 年 ${x.m} 月國定假日與連假</h2>
${x.hol.length ? `    <div class="tbl"><table>
      <thead><tr><th>日期</th><th>假日</th><th>對工作天數的影響</th></tr></thead>
      <tbody>
${holRows}
      </tbody>
    </table></div>
${x.blocks.length ? `    <p style="margin-top:12px">本月的連假：${x.blocks.map(b => `<b>${mdY(b.s)}～${mdY(b.e)}</b> 連休 ${b.len} 天（${b.names.join("、")}）`).join("；")}。</p>` : `    <p style="margin-top:12px">本月的國定假日都是單日放假，沒有 3 天以上的連假。</p>`}` : `    <p>2027 年 ${x.m} 月<b>沒有國定假日或補假</b>，工作天數只扣掉週六、週日：${x.dim} − ${x.weekend} ＝ ${x.work} 天。</p>`}
${x.pages.length ? `    <div class="related">\n${x.pages.map(([u, n]) => `      <a href="${u}">${n}<small>怎麼請假最划算、要請哪幾天</small></a>`).join("\n")}\n    </div>` : `    <p class="note">想在 ${x.m} 月安排休假，可以用<a href="/#planner">請假計算器</a>看全年哪幾個連假最划算。</p>`}
  </section>

  <section>
    <h2>人資與排程實用資訊</h2>
    <ul>
      <li><b>本月起訖上班日</b>：${md(x.first)} 開始、${md(x.last)} 結束，排薪資結算、交期時可以直接對照。</li>
      <li><b>月薪制換算</b>：月薪制勞工的平日每小時工資額，是用「月薪 ÷ 30 ÷ 8」換算，不會因為這個月工作天數多寡而變；加班費可以用<a href="/tools/overtime/">加班費計算機</a>算。</li>
      ${x.wkHol ? `<li><b>排班提醒</b>：本月有 ${x.wkHol} 天平日國定假日或補假，民間企業的補假日期可以勞資協商調整，以公司公告為準；國定假日出勤，工資要加倍發給。</li>` : `<li><b>排班提醒</b>：本月沒有國定假日，排班只要注意例假與休息日；需要算其他區間，可以用<a href="/tools/workdays/">工作天數計算機</a>。</li>`}
    </ul>
    <p style="margin-top:12px">用 Excel 算 2027 年 ${x.m} 月工作天數。已經照<a href="/tools/workdays/">工作天數計算</a>頁做好「假日」工作表的話：</p>
    ${formula(`f${x.mm}a`, `=NETWORKDAYS(${start},${end},假日!A:A)`)}
    <p style="margin-top:12px">不想另外建假日表，也可以用 NETWORKDAYS 算出扣週末的天數，再減掉本月平日國定假日的 ${x.wkHol} 天：</p>
    ${formula(`f${x.mm}b`, `=NETWORKDAYS(${start},${end})${x.wkHol ? `-${x.wkHol}` : ""}`)}
    <p class="note" style="margin-top:8px">兩個公式算出來都是 ${x.work}。第二種只適用本月，換月份要改減掉的天數。</p>
  </section>

  <section>
    <h2>看其他月份</h2>
    <div class="mnav"><a href="${prev[0]}">${prev[1]}</a><a href="${next[0]}">${next[1]}</a></div>
    <div style="margin-top:10px">${monthList(x.m)}</div>
  </section>

  <section>
    <h2>相關工具</h2>
    <div class="related">
      <a href="/tools/workdays/">工作天數計算機<small>任選起訖日，扣掉週末與國定假日</small></a>
      <a href="/tools/overtime/">加班費計算機<small>平日、休息日、國定假日加班費</small></a>
      <a href="/2027/qingjia/">2027 全年請假攻略<small>9 個連假怎麼請最划算</small></a>
    </div>
  </section>`;
  return page({ path: `/2027/workdays/${x.mm}/`, title, desc, h1: `2027 年 ${x.m} 月工作天數<br>上班 ${x.work} 天、<span style="white-space:nowrap">標準工時 ${x.hours} 小時</span>`,
    crumbs: [["2027 每月工作天數", "/2027/workdays/"], [`${x.m} 月`, `/2027/workdays/${x.mm}/`]], body, faq });
};

// ---------- 5. 總覽頁 ----------
const maxM = MONTHS.reduce((a, x) => x.work > a.work ? x : a), minM = MONTHS.reduce((a, x) => x.work < a.work ? x : a);
const overview = page({
  path: "/2027/workdays/",
  title: `2027 每月工作天數｜全年上班 ${TOTAL.work} 天、1～12 月一覽`,
  desc: `2027 年全年 365 天，扣掉 ${TOTAL.weekend} 天週末與 ${TOTAL.wkHol} 天平日國定假日，共 ${TOTAL.work} 個工作天。1～12 月工作天數、標準工時、國定假日一覽，${maxM.m} 月最多 ${maxM.work} 天、${minM.m} 月最少 ${minM.work} 天，附 Excel 公式。`,
  h1: `2027 每月工作天數<br>全年上班 ${TOTAL.work} 天`,
  crumbs: [["2027 每月工作天數", "/2027/workdays/"]],
  faq: [
    ["2027 年全年有幾個工作天？", `${TOTAL.work} 天。2027 年共 365 天，扣掉 ${TOTAL.weekend} 天週六日和 ${TOTAL.wkHol} 天落在平日的國定假日或補假，以週休二日、政府行政機關辦公日曆計算，標準工時 ${TOTAL.work * 8} 小時。`],
    ["2027 年哪個月工作天最少？", `${minM.m} 月，只有 ${minM.work} 個工作天${minM.festW.length ? `，因為${minM.festW.join("、")}放假` : ""}。工作天最多的是 ${maxM.m} 月，有 ${maxM.work} 天。`],
    ["2027 年有補班日嗎？", "沒有。2027 年政府行政機關全年沒有補班日，遇到週末的國定假日改用補假，所以每個月的工作天數只會比平日天數少，不會多出週六上班日。"],
  ],
  body: `
  <div class="answer">2027 年全年共有 <b>${TOTAL.work} 個工作天</b>、標準工時 <b>${TOTAL.work * 8} 小時</b>。365 天扣掉 ${TOTAL.weekend} 天週六日，再扣 ${TOTAL.wkHol} 天落在平日的國定假日與補假；全年沒有補班日。</div>

  <section>
    <h2>2027 年 1～12 月工作天數比較表</h2>
    <div class="tbl"><table>
      <thead><tr><th>月份</th><th>總天數</th><th>週末</th><th>平日國定假日</th><th>工作天數</th><th>當月節日</th></tr></thead>
      <tbody>
${MONTHS.map(x => `        <tr><td><a href="/2027/workdays/${x.mm}/">${x.m} 月</a></td><td class="num">${x.dim}</td><td class="num">${x.weekend}</td><td class="num">${x.wkHol}</td><td class="num"><b>${x.work}</b></td><td>${x.hol.length ? [...new Set(x.hol.map(h => fest(h.name)))].join("、") : "—"}</td></tr>`).join("\n")}
        <tr><td><b>全年</b></td><td class="num">${TOTAL.dim}</td><td class="num">${TOTAL.weekend}</td><td class="num">${TOTAL.wkHol}</td><td class="num"><b>${TOTAL.work}</b></td><td></td></tr>
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">以政府行政機關辦公日曆、週休二日計算。「當月節日」包含落在週末的假日；平日國定假日只算落在週一到週五、會減少工作天的。點月份可以看該月的上班日、國定假日明細與 Excel 公式。</p>
  </section>

  <section>
    <h2>用 Excel 算全年工作天數</h2>
    <p>Excel 的 NETWORKDAYS 預設只扣週六日，不知道台灣的國定假日。先照<a href="/tools/workdays/">工作天數計算</a>頁的步驟，把平日國定假日貼到「假日」工作表，再用：</p>
    ${formula("fyear", `=NETWORKDAYS(DATE(${YEAR},1,1),DATE(${YEAR},12,31),假日!A:A)`)}
    <p style="margin-top:12px">算出來應該是 ${TOTAL.work}。要算某個月，把開始、結束日改成該月的 1 號和最後一天；每個月份頁都有可以直接複製的公式。</p>
  </section>

  <section>
    <h2>各月份明細</h2>
    ${monthList(0)}
  </section>

  <section>
    <h2>算完下一步</h2>
    <div class="related">
      <a href="/tools/workdays/">工作天數計算機<small>任選起訖日，扣掉週末與國定假日</small></a>
      <a href="/2027/qingjia/">2027 全年請假攻略<small>9 個連假、特休 3～14 天怎麼排</small></a>
    </div>
  </section>`,
});

// ---------- 6. 輸出 ----------
const out = { "2027/workdays/index.html": overview };
MONTHS.forEach(x => { out[`2027/workdays/${x.mm}/index.html`] = monthPage(x); });
for (const [f, html] of Object.entries(out)) {
  mkdirSync(f.replace(/index\.html$/, ""), { recursive: true });
  writeFileSync(f, html);
}

// sitemap：先拿掉舊的 /2027/workdays/ 網址，再加回 13 頁
let sm = readFileSync("sitemap.xml", "utf8").replace(/\r\n/g, "\n");
sm = sm.replace(/  <url>\n    <loc>https:\/\/fangjiatw\.com\/2027\/workdays\/[^<]*<\/loc>\n    <lastmod>[^<]*<\/lastmod>\n  <\/url>\n/g, "");
const urls = ["/2027/workdays/", ...MONTHS.map(x => `/2027/workdays/${x.mm}/`)];
sm = sm.replace("</urlset>", urls.map(u => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${UPDATED}</lastmod>\n  </url>\n`).join("") + "</urlset>");
writeFileSync("sitemap.xml", sm);

console.log(`workdays 2027：${Object.keys(out).length} 頁，全年 ${TOTAL.work} 個工作天`);
console.table(MONTHS.map(x => ({ 月: x.m, 總天數: x.dim, 週末: x.weekend, 平日國定假日: x.wkHol, 工作天: x.work, 工時: x.hours, 第一個上班日: md(x.first), 最後一個上班日: md(x.last) })));
