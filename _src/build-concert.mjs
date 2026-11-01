// Generates /concert/ pages from venue data. Run from the repo root: node _src/build-concert.mjs
// Venue facts verified 2026-11-01. A venue with `page` gets its own page; others show as 整理中 on the hub.
import fs from "node:fs";

const SITE = "https://fangjiatw.com";
const TODAY = "2026-11-01";
const TODAY_ZH = "2026 年 11 月 1 日";

const VENUES = [
  { slug:"taipei-dome", city:"台北", name:"臺北大巨蛋", short:"大巨蛋", cap:"固定席約 4 萬，演唱會最多約 6 萬人",
    addr:"台北市信義區忠孝東路四段 515 號",
    mrt:"板南線 國父紀念館站 5 號出口直達園區；4 號出口可走忠孝東路地下通廊",
    page:{
      title:"大巨蛋住宿推薦｜看演唱會住哪最方便？4 區比較＋散場交通攻略",
      desc:"看大巨蛋演唱會住哪裡？整理信義區、國父紀念館、東區、台北車站 4 個住宿區域的步行時間、捷運站數和房價，加上散場避開人潮的走法。",
      answer:`看大巨蛋演唱會，最推薦住<b>市政府站周邊（信義區）</b>，走路 10～15 分鐘就到場館，散場也能避開國父紀念館站的人潮。外縣市來、隔天要搭高鐵的人，住<b>台北車站周邊</b>最順。`,
      hook:"大巨蛋一場演唱會動輒 4～6 萬人，散場時國父紀念館站常常要排隊管制進站。住得近一點，看完不用跟人潮擠，慢慢走回飯店就好；從外縣市來的話，住一晚也不用擔心趕不上高鐵。",
      exit:[
        "散場人潮會集中在<b>國父紀念館站</b>，進站常需排隊。往東走到<b>市政府站</b>約 10 分鐘，往西走到<b>忠孝敦化站</b>約 15 分鐘，通常比在原站排隊快。",
        "住信義區或國父紀念館周邊的話，直接走回飯店最省事；住台北車站一帶，可以先走一站再搭板南線，避開最擠的那一段。"
      ],
      faq:[
        ["大巨蛋最近的捷運站是哪一站？","板南線國父紀念館站。5 號出口可直達大巨蛋園區，4 號出口可以走忠孝東路的地下通廊。"],
        ["看大巨蛋演唱會住哪裡最方便？","想走路回飯店，選市政府站周邊（信義區）或國父紀念館周邊；外縣市來、隔天要搭高鐵，選台北車站周邊，搭板南線 5 站就到場館。"],
        ["大巨蛋演唱會散場怎麼走比較快？","國父紀念館站散場常排隊，可以往東步行約 10 分鐘到市政府站，或往西步行到忠孝敦化站再搭車。"],
        ["大巨蛋可以容納多少人？","固定觀眾席約 4 萬席，舉辦演唱會時加開草皮區，最多可容納約 6 萬人。"]
      ]
    },
    zones:[
      {name:"信義計畫區", sub:"市政府站周邊", walk:"步行 10～15 分", mrt:"板南線 1 站", price:"偏高", text:"百貨、餐廳最多，散場後還能吃宵夜。房價偏高，熱門場次要很早訂。", who:"適合：想看完逛街吃飯、預算較寬的人"},
      {name:"國父紀念館、光復南路", sub:"場館正對面一帶", walk:"步行 3～8 分", mrt:"不用搭車", price:"中等", text:"離場館最近，走路就到。房源少，以商務旅館和小型旅店為主。", who:"適合：只想看完馬上回房休息的人"},
      {name:"忠孝復興、東區", sub:"板南線往西 2 站", walk:"步行 20 分以上", mrt:"板南線 2 站", price:"中等", text:"選擇多、價位跨度大，避開國父紀念館站的散場人潮，搭兩站就到。", who:"適合：想兼顧預算和方便的人"},
      {name:"台北車站周邊", sub:"高鐵、台鐵轉乘點", walk:"", mrt:"板南線 5 站", price:"平價～中等", text:"隔天要搭高鐵回家最順，平價旅館多，同樣價錢房間通常比信義區大。", who:"適合：外縣市來、隔天一早要搭車的人"}
    ]},
  { slug:"kaohsiung-stadium", city:"高雄", name:"高雄國家體育場（世運主場館）", short:"世運", cap:"約 5.5 萬席，全台最大戶外體育場",
    addr:"高雄市左營區世運大道 100 號",
    mrt:"紅線 世運站（R17）1 號出口，步行約 10～15 分",
    page:{
      title:"世運演唱會住哪？高雄世運主場館住宿推薦＋散場交通攻略",
      desc:"看高雄世運演唱會住哪裡？整理高鐵左營站、巨蛋、市中心 3 個住宿區的捷運站數與房價，加上散場接駁車、步行到左營站的走法。",
      answer:`看世運演唱會，外縣市來最推薦住<b>高鐵左營站周邊</b>：捷運只要 1 站，隔天搭高鐵直接回家。想避開房價高峰，可以住<b>巨蛋</b>或<b>市中心</b>，搭紅線 3～7 站就到。`,
      hook:"世運主場館可以容納約 5.5 萬人，是全台最大的戶外場館，大型演唱會的觀眾有很多是從北部、中部南下。散場後世運站排隊進站常要等很久，如果當晚還要趕高鐵，時間會非常緊，住一晚會輕鬆很多。",
      exit:[
        "散場時<b>世運站</b>人潮最集中。可以沿翠華路步行約 25 分鐘到<b>左營站</b>，那裡同時有高鐵、台鐵和捷運。",
        "大型演唱會常有往<b>高鐵左營站／台鐵新左營站</b>的免費接駁車，班次和上車地點依各場次公告為準。",
        "演唱會期間世運大道常實施交通管制，也不一定開放汽車停車，建議搭大眾運輸。"
      ],
      faq:[
        ["世運主場館要從捷運幾號出口出去？","搭高雄捷運紅線到世運站（R17），從 1 號出口出站，步行約 10～15 分鐘。"],
        ["看世運演唱會住哪裡最方便？","外縣市來的人最推薦高鐵左營站周邊，捷運 1 站就到場館，隔天直接搭高鐵。想找比較穩定的房價，可以住巨蛋或美麗島一帶。"],
        ["世運演唱會散場怎麼去高鐵左營站？","可以搭捷運紅線 1 站，或沿翠華路步行約 25 分鐘。大型演唱會通常也有往高鐵左營站的免費接駁車，依各場次公告為準。"],
        ["世運主場館可以容納多少人？","約 5.5 萬席，是全台灣最大的戶外體育場。"],
        ["世運演唱會可以開車去嗎？","不建議。大型演唱會期間世運大道周邊常有交通管制，也不一定開放汽車停車，搭捷運或接駁車比較保險。"]
      ]
    },
    zones:[
      {name:"高鐵左營站周邊", sub:"高鐵、台鐵、捷運轉乘點", walk:"步行約 25 分", mrt:"紅線 1 站", price:"中等", text:"隔天搭高鐵最方便，但大型演唱會時房價會跟著跳漲，要提早訂。", who:"適合：從北部或中部來的人"},
      {name:"巨蛋、北高雄", sub:"博愛路一帶", walk:"", mrt:"紅線 3 站", price:"中等", text:"飯店選擇多，餐廳也多，可避開世運站周邊的房價高峰。", who:"適合：想要飯店選擇多一點的人"},
      {name:"美麗島、新堀江", sub:"市中心", walk:"", mrt:"紅線 7 站", price:"平價～中等", text:"離場館比較遠，但房價相對穩定，順便逛六合夜市、駁二。", who:"適合：想順便玩高雄、預算有限的人"}
    ]},
  { slug:"taipei-arena", city:"台北", name:"臺北小巨蛋", cap:"約 1.1～1.5 萬人" },
  { slug:"kaohsiung-arena", city:"高雄", name:"高雄巨蛋", cap:"約 1.5 萬人" },
  { slug:"taipei-music-center", city:"台北", name:"台北流行音樂中心", cap:"約 3 千～5 千人" },
  { slug:"zepp-new-taipei", city:"新北", name:"Zepp New Taipei", cap:"約 2 千人" }
];

const head = (title, desc, path, ld) => `<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}｜放假日曆</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="article">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${SITE}${path}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@600;900&family=Noto+Sans+TC:wght@400;500;700&family=JetBrains+Mono:wght@500&display=swap">
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/assets/concert.css">
<script type="application/ld+json">
${JSON.stringify(ld, null, 1)}
</script>
</head>
<body>
<header class="top">
  <a class="logo" href="/">放假<span>日曆</span></a>
  <nav><a href="/#planner">請假計算器</a><a href="/concert/">演唱會住宿</a><a href="/#calendar">全年行事曆</a></nav>
</header>
`;

const STEPS = `<div class="steps">
      <div class="step"><div class="when">公布場次當天</div><h3>先訂可免費取消的房</h3><p>還沒搶到票也可以先卡位，選「免費取消」的方案，沒搶到再退。</p></div>
      <div class="step"><div class="when">搶票結束後</div><h3>確認日期，取消多訂的</h3><p>加場常在這時公布，日期確定後把用不到的訂單取消。</p></div>
      <div class="step"><div class="when">演出前 1 週</div><h3>查好散場路線</h3><p>記下最近的捷運出口和替代路線，走一站去搭車常常比較快。</p></div>
      <div class="step"><div class="when">演出當天</div><h3>先去飯店寄放行李</h3><p>多數飯店入住前可寄放行李，輕裝進場。</p></div>
    </div>`;

const foot = `<footer>場館資料查證日期：${TODAY_ZH}。交通與容納人數依場館及主辦單位公告為準；步行時間為一般速度估算，散場人潮時會更久。住宿房價等級為一般情況參考，演唱會期間可能大幅上漲。</footer>
<script src="/assets/concert.js"></script>
</body>
</html>
`;

function venuePage(v){
  const p = v.page, path = `/concert/${v.slug}/`;
  const ld = {"@context":"https://schema.org","@graph":[
    {"@type":"Article","headline":p.title,"datePublished":TODAY,"dateModified":TODAY,"inLanguage":"zh-Hant-TW","mainEntityOfPage":SITE+path,"publisher":{"@type":"Organization","name":"放假日曆","url":SITE+"/"}},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"放假日曆","item":SITE+"/"},
      {"@type":"ListItem","position":2,"name":"演唱會住宿","item":SITE+"/concert/"},
      {"@type":"ListItem","position":3,"name":`${v.short}住宿`,"item":SITE+path}]},
    {"@type":"FAQPage","mainEntity":p.faq.map(([q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}
  ]};
  const others = VENUES.filter(o=>o.page && o.slug!==v.slug);
  return head(p.title, p.desc, path, ld) + `
<main class="article">
  <div>
    <div class="crumb"><a href="/">放假日曆</a> › <a href="/concert/">演唱會住宿</a> › ${v.short}</div>
    <h1>${p.title.replace("｜","<br>")}</h1>
    <div class="meta">更新日期：${TODAY_ZH}</div>
  </div>

  <div class="answer">${p.answer}</div>
  <p>${p.hook}</p>

  <section>
    <h2>${v.short}住宿區懶人比較</h2>
    <div class="tbl"><table>
      <thead><tr><th>區域</th><th>到場館</th><th>捷運</th><th>房價</th><th>適合</th></tr></thead>
      <tbody>
${v.zones.map(z=>`        <tr><td>${z.name}</td><td>${z.walk||"搭捷運"}</td><td>${z.mrt}</td><td>${z.price}</td><td>${z.who.replace("適合：","")}</td></tr>`).join("\n")}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">步行時間為一般速度估算；房價等級為平常日參考，演唱會期間通常會上漲。</p>
  </section>

  <section>
    <h2>${v.short}交通與場館資訊</h2>
    <dl class="facts">
      <dt>場館</dt><dd>${v.name}</dd>
      <dt>容納</dt><dd>${v.cap}</dd>
      <dt>地址</dt><dd>${v.addr}</dd>
      <dt>捷運</dt><dd>${v.mrt}</dd>
    </dl>
  </section>

  <section>
    <h2>${v.short}演唱會散場怎麼走？</h2>
    <div class="tip">${p.exit.map(t=>`<p>${t}</p>`).join("")}</div>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section id="zones">
    <h2>${v.short}周邊住宿區域推薦</h2>
${v.zones.map(z=>`    <article class="zone">
      <div><h3>${z.name}</h3><div class="sub">${z.sub}</div></div>
      <div class="chips">${z.walk?`<span class="chip walk">${z.walk}</span>`:""}<span class="chip mrt">${z.mrt}</span><span class="chip">房價${z.price}</span></div>
      <p>${z.text}</p>
      <div class="who">${z.who}</div>
    </article>`).join("\n")}
  </section>

  <section>
    <h2>看完要不要住一晚？</h2>
    <p>回答兩個問題，馬上告訴你當天回家來不來得及。</p>
    <div class="helper" data-helper data-venue="${v.short}" data-anchor="#zones"></div>
  </section>

  <section>
    <h2>演唱會訂房時間表</h2>
    ${STEPS}
  </section>

  <section>
    <h2>常見問題</h2>
${p.faq.map(([q,a])=>`    <details><summary>${q}</summary><p>${a}</p></details>`).join("\n")}
  </section>

  <section>
    <h2>開始規劃你的演唱會行程</h2>
    <p>搶票前先把住宿卡位，搶到票再確認就好。演唱會剛好接在連假前後？到<a href="/#calendar">全年行事曆</a>看看，順便把請假一起排好。</p>
  </section>

  <section>
    <h2>延伸閱讀</h2>
    <div class="related">
      <a href="/concert/">全台演唱會場館住宿<small>${VENUES.length} 個場館一次看</small></a>
${others.map(o=>`      <a href="/concert/${o.slug}/">${o.short}住宿推薦<small>${o.name}</small></a>`).join("\n")}
      <a href="/#planner">請假攻略計算器<small>演唱會接連假，特休怎麼排</small></a>
    </div>
  </section>
</main>
` + foot;
}

function hubPage(){
  const path = "/concert/";
  const title = "演唱會住哪？全台演唱會場館住宿＋散場交通攻略";
  const desc = "大巨蛋、小巨蛋、世運、高雄巨蛋、北流、Zepp New Taipei 演唱會住哪裡最方便？各場館周邊住宿區域、捷運出口和散場交通一次整理。";
  const ld = {"@context":"https://schema.org","@graph":[
    {"@type":"CollectionPage","name":title,"url":SITE+path,"inLanguage":"zh-Hant-TW"},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"放假日曆","item":SITE+"/"},
      {"@type":"ListItem","position":2,"name":"演唱會住宿","item":SITE+path}]}
  ]};
  return head(title, desc, path, ld) + `
<main class="article">
  <div>
    <div class="crumb"><a href="/">放假日曆</a> › 演唱會住宿</div>
    <h1>演唱會住哪？<br>全台場館住宿＋散場交通攻略</h1>
    <div class="meta">更新日期：${TODAY_ZH}</div>
  </div>

  <div class="answer">搶到票之後，下一件事就是住哪。這裡整理台灣主要演唱會場館周邊的<b>住宿區域</b>：走路能到哪裡、搭幾站捷運、房價大概多少，還有<b>散場怎麼避開人潮</b>。</div>

  <section>
    <h2>選擇場館</h2>
    <div class="venues">
${VENUES.map(v=> v.page
  ? `      <a class="venue" href="/concert/${v.slug}/"><span class="city">${v.city}</span><span class="nm">${v.name}</span><small>${v.cap}</small></a>`
  : `      <div class="venue soon"><span class="city">${v.city}</span><span class="nm">${v.name}</span><small>${v.cap} · 整理中</small></div>`).join("\n")}
    </div>
  </section>

  <div class="ad">廣告版位 336×280</div>

  <section>
    <h2>看完要不要住一晚？</h2>
    <p>從外縣市來看演唱會，最怕散場後趕不上末班車。回答兩個問題，馬上給你建議。</p>
    <div class="helper" data-helper></div>
  </section>

  <section>
    <h2>演唱會訂房時間表</h2>
    <p>熱門場次一公布，周邊房價常常跟著跳漲。照這個順序來，比較不會訂不到或買貴。</p>
    ${STEPS}
  </section>

  <section>
    <h2>延伸閱讀</h2>
    <div class="related">
      <a href="/#calendar">2027 全年行事曆<small>演唱會接連假，一次排好</small></a>
      <a href="/#planner">請假攻略計算器<small>輸入特休天數，排出最長連休</small></a>
    </div>
  </section>
</main>
` + foot;
}

fs.mkdirSync("concert", {recursive:true});
fs.writeFileSync("concert/index.html", hubPage());
for(const v of VENUES.filter(v=>v.page)){
  fs.mkdirSync(`concert/${v.slug}`, {recursive:true});
  fs.writeFileSync(`concert/${v.slug}/index.html`, venuePage(v));
}
console.log("built:", ["concert/", ...VENUES.filter(v=>v.page).map(v=>`concert/${v.slug}/`)].join(", "));
