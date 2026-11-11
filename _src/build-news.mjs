// Generates /news/（生活時事整理）from _src/news/*.html. Run from the repo root: node _src/build-news.mjs
// _src/news/drafts/ 是草稿區，產生器不會讀；人工查證後把檔案搬到 _src/news/ 才算發布。格式見 _src/news/README.md。
// 也會更新 sitemap.xml 的 /news/ 網址，以及首頁 <!-- news:start --> 區塊（滿 5 篇才顯示）。
import fs from "node:fs";

const HEADER = fs.readFileSync(new URL("./header.html", import.meta.url), "utf8").trim();
const SITE = "https://fangjiatw.com";
const SRC = "_src/news";
const CATS = ["職場勞工", "財稅理財"];   // 只收和現有試算工具直接相關的題目
const HOME_MIN = 5;                     // 首頁區塊至少要有幾篇才出現
const HOME_FRESH_DAYS = 30;             // 最新一篇超過幾天沒更新，首頁區塊自動隱藏

const zh = d => { const [y, m, dd] = d.split("-").map(Number); return `${y} 年 ${m} 月 ${dd} 日`; };
const slash = d => d.replace(/-/g, "/");
const esc = s => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const strip = s => s.replace(/<[^>]+>/g, "");

// 試算工具名稱從工具頁 <title> 讀，工具改名時這裡自動跟上
const toolName = slug => {
  const f = `tools/${slug}/index.html`;
  if (!fs.existsSync(f)) return null;
  return fs.readFileSync(f, "utf8").match(/<title>([^｜<]+)/)[1].trim();
};

// ---- 讀檔與檢查 ----
function parse(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`${file}: 開頭要有 --- 包住的欄位區`);
  const a = { slug: file.replace(/^.*[\\/]/, "").replace(/\.html$/, ""), body: m[2].trim(), sources: [], tools: [], faq: [] };
  let list = null;
  for (const line of m[1].split("\n")) {
    if (!line.trim()) continue;
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && list) { a[list].push(item[1].split(/\s*\|\s*/)); continue; }
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) throw new Error(`${file}: 看不懂這行：${line}`);
    list = null;
    if (["sources", "faq"].includes(kv[1])) list = kv[1];
    else if (kv[1] === "tools") a.tools = kv[2].split(/[,，\s]+/).filter(Boolean);
    else a[kv[1]] = kv[2].trim();
  }
  const err = [];
  if (!/^[a-z0-9-]+$/.test(a.slug)) err.push("檔名只能用小寫英數和 -");
  for (const k of ["title", "short", "desc", "cat", "published", "verified", "answer"]) if (!a[k]) err.push(`缺少 ${k}`);
  if (a.cat && !CATS.includes(a.cat)) err.push(`cat 只能是 ${CATS.join("、")}`);
  for (const k of ["published", "verified"]) if (a[k] && !/^20\d\d-\d\d-\d\d$/.test(a[k])) err.push(`${k} 要寫成 YYYY-MM-DD`);
  if (a.verified < a.published) err.push("verified 不能早於 published");
  if (a.desc && (a.desc.length < 40 || a.desc.length > 160)) err.push(`desc 要 40～160 字（現在 ${a.desc.length}）`);
  if (!a.sources.length) err.push("至少要有一個資料來源");
  for (const s of a.sources) if (s.length !== 2 || !/^https:\/\//.test(s[1])) err.push(`來源格式要是「名稱 | https://…」：${s.join(" | ")}`);
  for (const q of a.faq) if (q.length !== 2) err.push(`FAQ 格式要是「問題 | 答案」：${q.join(" | ")}`);
  if (!a.tools.length) err.push("至少連到一個試算工具（tools:）");
  for (const t of a.tools) if (!toolName(t)) err.push(`找不到工具 tools/${t}/`);
  if (/TODO|待查|\?\?/.test(raw)) err.push("文中還有 TODO／待查／?? 記號");
  if (err.length) throw new Error(`${file}:\n  - ${err.join("\n  - ")}`);
  return a;
}

const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter(f => f.endsWith(".html")).map(f => `${SRC}/${f}`) : [];
const NEWS = files.map(parse).sort((x, y) => y.published.localeCompare(x.published) || x.slug.localeCompare(y.slug));

// ---- 頁面 ----
const head = (title, desc, path, ld) => `<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}｜放假日曆</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${SITE}/assets/og/${path.replace(/^\/|\/$/g, "").replace(/\//g, "-")}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=9">
<style>
.news-tag{display:inline-block;font-size:.78rem;font-weight:700;color:var(--brand);background:var(--brand-soft);border-radius:999px;padding:2px 10px;margin-right:6px}
.sources{padding-left:1.2em;margin:0}
.sources li{margin:4px 0}
.news-list{display:grid;gap:12px}
.news-item{display:block;border:1px solid var(--rule);border-radius:8px;padding:14px 16px;background:var(--sheet);color:var(--ink);text-decoration:none}
.news-item:hover{border-color:var(--brand)}
.news-item b{display:block;font-size:1.05rem;margin:6px 0 4px}
.news-item small{color:var(--muted);font-size:.85rem}
.faq-list details{border-bottom:1px solid var(--rule)}
.faq-list summary{cursor:pointer;font-weight:700}
</style>
<script type="application/ld+json">
${JSON.stringify(ld, null, 1)}
</script>
</head>
<body>
${HEADER}
`;

const foot = note => `<footer><a href="/about/">關於我們</a> · <a href="/privacy/">隱私權政策</a> · <a href="/disclosure/">聯盟連結揭露</a><br>放假日曆｜台灣生活資訊與免費試算工具。<br>${note}</footer>
<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "4c058fe6d8d047d290cd5fe7c73a3d15"}'></script><!-- End Cloudflare Web Analytics -->
</body>
</html>
`;

const crumbLd = items => ({ "@type": "BreadcrumbList", "itemListElement": items.map(([name, url], i) => ({ "@type": "ListItem", "position": i + 1, name, "item": SITE + url })) });

function articlePage(a) {
  const path = `/news/${a.slug}/`;
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "Article", "headline": a.title, "description": a.desc, "datePublished": a.published, "dateModified": a.verified, "inLanguage": "zh-Hant-TW",
      "mainEntityOfPage": SITE + path, "author": { "@type": "Organization", "name": "放假日曆", "url": SITE + "/about/" }, "publisher": { "@type": "Organization", "name": "放假日曆", "url": SITE + "/" } },
    crumbLd([["放假日曆", "/"], ["生活時事整理", "/news/"], [a.short, path]]),
    ...(a.faq.length ? [{ "@type": "FAQPage", "mainEntity": a.faq.map(([q, ans]) => ({ "@type": "Question", "name": q, "acceptedAnswer": { "@type": "Answer", "text": strip(ans) } })) }] : [])
  ] };
  const more = NEWS.filter(o => o.slug !== a.slug).slice(0, 4);
  return head(a.title, a.desc, path, ld) + `
<main class="article">
  <div>
    <div class="crumb"><a href="/">放假日曆</a> › <a href="/news/">生活時事整理</a> › ${a.short}</div>
    <h1>${a.title.replace("｜", "<br>")}</h1>
    <div class="meta"><span class="news-tag">${a.cat}</span>發布日期：${zh(a.published)} · 最後查證：${zh(a.verified)}</div>
  </div>

  <div class="answer">${a.answer}</div>

${a.body}

  <section>
    <h2>算算看對你的影響</h2>
    <div class="related">
${a.tools.map(t => `      <a href="/tools/${t}/">${toolName(t)}<small>免費線上試算，輸入自己的數字就能算</small></a>`).join("\n")}
    </div>
  </section>
${a.faq.length ? `
  <section class="faq-list">
    <h2>常見問題</h2>
${a.faq.map(([q, ans]) => `    <details><summary>${q}</summary><p>${ans}</p></details>`).join("\n")}
  </section>
` : ""}
  <section>
    <h2>資料來源</h2>
    <ul class="sources">
${a.sources.map(([n, u]) => `      <li><a href="${esc(u)}" rel="noopener">${n}</a></li>`).join("\n")}
    </ul>
    <p class="note" style="margin-top:8px">本文整理自上列公告與資料，最後查證日期為 ${zh(a.verified)}。政策可能再調整，請以主管機關最新公告為準。</p>
  </section>
${more.length ? `
  <section>
    <h2>其他生活時事</h2>
    <div class="related">
${more.map(o => `      <a href="/news/${o.slug}/">${o.short}<small>${o.cat} · ${slash(o.published)}</small></a>`).join("\n")}
    </div>
  </section>
` : ""}</main>
` + foot("本站僅供參考，不構成法律或財務建議。");
}

function hubPage() {
  const path = "/news/";
  const title = "生活時事整理｜基本工資、勞保、報稅等新制重點";
  const desc = "整理和台灣上班族荷包有關的政策新制：基本工資、勞健保、勞退、報稅與房貸。每篇附官方資料來源、最後查證日期，以及可以自己試算的免費工具。";
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "CollectionPage", "name": title, "url": SITE + path, "inLanguage": "zh-Hant-TW" },
    crumbLd([["放假日曆", "/"], ["生活時事整理", path]])
  ] };
  return head(title, desc, path, ld) + `
<main class="article">
  <div>
    <div class="crumb"><a href="/">放假日曆</a> › 生活時事整理</div>
    <h1>生活時事整理<br>基本工資、勞保、報稅等新制重點</h1>
    <div class="meta">最後更新：${zh(NEWS[0].verified > NEWS[0].published ? NEWS[0].verified : NEWS[0].published)}</div>
  </div>

  <div class="answer">只整理和<b>薪水、勞保、稅金</b>直接相關的政策新制。每篇都附官方資料來源和最後查證日期，也連到可以自己試算的免費工具。</div>

  <section>
    <h2>最新整理</h2>
    <div class="news-list">
${NEWS.map(a => `      <a class="news-item" href="/news/${a.slug}/"><span class="news-tag">${a.cat}</span><small>${slash(a.published)}</small><b>${a.short}</b><small>${a.desc}</small></a>`).join("\n")}
    </div>
  </section>
</main>
` + foot("每篇文章的資料來源列在文末。政策可能再調整，請以主管機關最新公告為準。");
}

// ---- 輸出 ----
fs.rmSync("news", { recursive: true, force: true });   // 下架的文章跟著消失
if (NEWS.length) {
  fs.mkdirSync("news", { recursive: true });
  fs.writeFileSync("news/index.html", hubPage());
  for (const a of NEWS) {
    fs.mkdirSync(`news/${a.slug}`, { recursive: true });
    fs.writeFileSync(`news/${a.slug}/index.html`, articlePage(a));
  }
}

// sitemap：先拿掉所有 /news/ 網址，再依目前文章加回去
let sm = fs.readFileSync("sitemap.xml", "utf8").replace(/\r\n/g, "\n");
sm = sm.replace(/  <url>\n    <loc>https:\/\/fangjiatw\.com\/news\/[^<]*<\/loc>\n    <lastmod>[^<]*<\/lastmod>\n  <\/url>\n/g, "");
const urls = NEWS.length ? [["/news/", NEWS.map(a => a.verified).sort().at(-1)], ...NEWS.map(a => [`/news/${a.slug}/`, a.verified])] : [];
sm = sm.replace("</urlset>", urls.map(([u, d]) => `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${d}</lastmod>\n  </url>\n`).join("") + "</urlset>");
fs.writeFileSync("sitemap.xml", sm);

// 首頁區塊：滿 HOME_MIN 篇才出現；最新一篇太舊時由瀏覽器端隱藏，避免首頁掛著過期內容
let home = fs.readFileSync("index.html", "utf8");
const mk = /<!-- news:start -->[\s\S]*?<!-- news:end -->/;
if (!mk.test(home)) throw new Error("index.html 找不到 <!-- news:start --> / <!-- news:end --> 標記");
const newest = NEWS.length ? NEWS.map(a => a.verified).sort().at(-1) : "";
const block = NEWS.length >= HOME_MIN ? `<!-- news:start -->
  <section id="news" aria-labelledby="newsTitle" data-fresh="${newest}" data-days="${HOME_FRESH_DAYS}">
    <div class="sec-head">
      <div class="eyebrow">NEWS</div>
      <h2 id="newsTitle">生活時事整理</h2>
      <p>基本工資、勞保、報稅等新制重點，每篇附官方來源與查證日期。</p>
    </div>
    <div class="posts">
${NEWS.slice(0, 3).map(a => `      <article class="post post-text"><div class="post-body"><div class="post-meta"><span class="cat">${a.cat}</span><time datetime="${a.verified}">查證 ${slash(a.verified)}</time></div><h3><a href="/news/${a.slug}/">${a.short}</a></h3><p>${a.desc}</p><a class="more" href="/news/${a.slug}/" aria-label="閱讀更多：${esc(a.short)}">閱讀更多 →</a></div></article>`).join("\n")}
    </div>
    <p style="margin-top:12px"><a href="/news/">查看全部生活時事 →</a></p>
  </section>
  <script>(function(s){var d=new Date(s.dataset.fresh+"T00:00:00+08:00");if((Date.now()-d)/864e5>+s.dataset.days)s.hidden=true})(document.getElementById("news"))</script>
  <!-- news:end -->` : "<!-- news:start --><!-- news:end -->";
home = home.replace(mk, block);
fs.writeFileSync("index.html", home);

console.log(`news: ${NEWS.length} 篇${NEWS.length ? "（" + NEWS.map(a => a.slug).join(", ") + "）" : ""}；首頁區塊 ${NEWS.length >= HOME_MIN ? "顯示" : `隱藏（未滿 ${HOME_MIN} 篇）`}`);
