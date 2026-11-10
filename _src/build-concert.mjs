// Generates /concert/ pages from venue data. Run from the repo root: node _src/build-concert.mjs
// Venue facts verified 2026-11-01. A venue with `page` gets its own page; others show as 整理中 on the hub.
import fs from "node:fs";

const HEADER = fs.readFileSync(new URL("./header.html", import.meta.url), "utf8").trim(); // 與首頁一致的共用 Header
const SITE = "https://fangjiatw.com";
const TODAY = "2026-11-01";
const UPDATED = "2026-11-07";
const UPDATED_ZH = "2026 年 11 月 7 日";
const TODAY_ZH = "2026 年 11 月 1 日";

// 各住宿區的代表飯店（2026-11-07 查證：飯店官網、訂房平台與媒體報導）。只列查得到地址或交通資訊的飯店；
// 步行時間為一般速度估算。不是業配，之後若放聯盟連結，連結本身要在頁面標示。
const H = {
  "國父紀念館、光復南路":[
    {n:"誠品行旅", loc:"松山文創園區內（菸廠路 98 號），步行約 5 分到大巨蛋", why:"離場館最近的飯店之一，散場直接走回房間"},
    {n:"國聯大飯店", loc:"光復南路 200 號，步行約 10 分到國父紀念館", why:"老字號飯店，2024 年完成第一階段客房與餐廳翻新"}],
  "信義計畫區":[
    {n:"台北 W 飯店", loc:"忠孝東路五段 10 號，捷運市政府站旁", why:"散場往市政府站走就是回飯店的路，順便避開國父紀念館站人潮"}],
  "台北車站周邊":[
    {n:"君品酒店", loc:"與台北轉運站、京站共構，捷運台北車站 Y5 出口", why:"高鐵、台鐵、機場捷運、客運都在樓下，隔天回家最省事"}],
  "南京復興、遼寧夜市":[
    {n:"兄弟大飯店", loc:"南京東路三段 255 號，南京復興站 6、7 號出口", why:"出捷運就到，往小巨蛋走一站路約 10 分"},
    {n:"柯達大飯店 台北南京館", loc:"步行約 3 分到南京復興站", why:"商務旅館，價位比南京東路上的大飯店親民"}],
  "南京三民、松山":[
    {n:"小公館人文旅舍", loc:"捷運南京三民站附近", why:"平價選擇，房價含早餐"}],
  "巨蛋商圈":[
    {n:"巨蛋旅店", loc:"文忠路 1 號，巨蛋站 2 號出口步行約 1 分", why:"自助報到，到高雄巨蛋、瑞豐夜市都約 5 分鐘"},
    {n:"帕可麗酒店", loc:"文信路 192 號，巨蛋站步行約 5 分", why:"巨蛋商圈內，散場走回飯店不用搭車"}],
  "凹子底、美術館":[
    {n:"高雄萬豪酒店", loc:"鼓山區龍德新路 222 號，凹子底站步行約 7 分", why:"大型國際飯店，鄰近漢神巨蛋、瑞豐夜市"}],
  "高鐵左營站周邊":[
    {n:"水木商旅 高鐵左營館", loc:"高鐵左營站步行約 5 分", why:"隔天搭高鐵最方便，評價穩定的商務旅館"}],
  "巨蛋、北高雄":[
    {n:"巨蛋旅店", loc:"文忠路 1 號，巨蛋站 2 號出口步行約 1 分", why:"捷運紅線巨蛋站到世運站 2 站，晚上還能逛瑞豐夜市"}],
  "南港車站周邊":[
    {n:"台北六福萬怡酒店", loc:"南港車站共構大樓 7～30 樓", why:"樓下就是高鐵、台鐵、捷運，還有 CITYLINK、環球購物中心"},
    {n:"洛碁大飯店 南港館", loc:"捷運南港站 2 號出口步行約 5～8 分", why:"南港車站周邊的另一個選擇，房價通常比共構飯店低"}],
  "信義區、市政府":[
    {n:"台北 W 飯店", loc:"忠孝東路五段 10 號，捷運市政府站旁", why:"板南線往昆陽 3 站，看完回信義區吃宵夜"}],
  "新莊副都心":[
    {n:"新北新莊凱悅嘉軒酒店", loc:"宏匯廣場附近，步行約 5 分到 Zepp New Taipei", why:"離場館最近的國際連鎖飯店，有健身房和季節性戶外泳池"}],
};
const mapUrl = n => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(n);

const VENUES = [
  { slug:"taipei-dome", city:"台北", district:"台北信義區", name:"臺北大巨蛋", short:"大巨蛋", cap:"固定席約 4 萬，演唱會最多約 6 萬人",
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
      {name:"信義計畫區", hotels:H["信義計畫區"], sub:"市政府站周邊", walk:"步行 10～15 分", mrt:"板南線 1 站", price:"偏高", text:"百貨、餐廳最多，散場後還能吃宵夜。房價偏高，熱門場次要很早訂。", who:"適合：想看完逛街吃飯、預算較寬的人"},
      {name:"國父紀念館、光復南路", hotels:H["國父紀念館、光復南路"], sub:"場館正對面一帶", walk:"步行 3～8 分", mrt:"不用搭車", price:"中等", text:"離場館最近，走路就到。房源少，以商務旅館和小型旅店為主。", who:"適合：只想看完馬上回房休息的人"},
      {name:"忠孝復興、東區", sub:"板南線往西 2 站", walk:"步行 20 分以上", mrt:"板南線 2 站", price:"中等", text:"選擇多、價位跨度大，避開國父紀念館站的散場人潮，搭兩站就到。", who:"適合：想兼顧預算和方便的人"},
      {name:"台北車站周邊", hotels:H["台北車站周邊"], sub:"高鐵、台鐵轉乘點", walk:"", mrt:"板南線 5 站", price:"平價～中等", text:"隔天要搭高鐵回家最順，平價旅館多，同樣價錢房間通常比信義區大。", who:"適合：外縣市來、隔天一早要搭車的人"}
    ]},
  { slug:"kaohsiung-stadium", city:"高雄", district:"高雄左營區", name:"高雄國家體育場（世運主場館）", short:"世運", cap:"約 5.5 萬席，全台最大戶外體育場",
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
      {name:"高鐵左營站周邊", hotels:H["高鐵左營站周邊"], sub:"高鐵、台鐵、捷運轉乘點", walk:"步行約 25 分", mrt:"紅線 1 站", price:"中等", text:"隔天搭高鐵最方便，但大型演唱會時房價會跟著跳漲，要提早訂。", who:"適合：從北部或中部來的人"},
      {name:"巨蛋、北高雄", hotels:H["巨蛋、北高雄"], sub:"博愛路一帶", walk:"", mrt:"紅線 3 站", price:"中等", text:"飯店選擇多，餐廳也多，可避開世運站周邊的房價高峰。", who:"適合：想要飯店選擇多一點的人"},
      {name:"美麗島、新堀江", sub:"市中心", walk:"", mrt:"紅線 7 站", price:"平價～中等", text:"離場館比較遠，但房價相對穩定，順便逛六合夜市、駁二。", who:"適合：想順便玩高雄、預算有限的人"}
    ]},
  { slug:"taipei-arena", city:"台北", district:"台北松山區", name:"臺北小巨蛋", short:"小巨蛋", cap:"約 1.1～1.5 萬人（依舞台配置）",
    addr:"台北市松山區南京東路四段 2 號",
    mrt:"松山新店線 台北小巨蛋站 2 號出口",
    page:{
      title:"小巨蛋住宿推薦｜看演唱會住哪最方便？3 區比較＋散場交通攻略",
      desc:"看小巨蛋演唱會住哪裡？整理南京復興、南京三民、中山 3 個住宿區域的步行時間、捷運站數和房價，加上散場避開人潮的走法。",
      answer:`看小巨蛋演唱會，最推薦住<b>南京復興站周邊</b>：走路約 10 分鐘到場館，散場還能順路去遼寧街夜市吃宵夜。預算有限、隔天要搭台鐵的人，可以住<b>南京三民、松山</b>一帶。`,
      hook:"小巨蛋就在捷運站出口旁邊，交通很方便，但一場演唱會上萬人同時散場，台北小巨蛋站常常擠到要排隊進站。住在走路可到的範圍，看完不用跟人潮擠，散步回飯店就好。",
      exit:[
        "散場人潮會集中在<b>台北小巨蛋站</b>。往西步行約 10 分鐘到<b>南京復興站</b>（可轉文湖線），或往東走到<b>南京三民站</b>，通常比在原站排隊快。",
        "住中山一帶的話，從南京復興站搭松山新店線往西 2 站就到，避開最擠的小巨蛋站。"
      ],
      faq:[
        ["小巨蛋最近的捷運站是哪一站？","松山新店線台北小巨蛋站，從 2 號出口出站就到小巨蛋。"],
        ["看小巨蛋演唱會住哪裡最方便？","想走路回飯店，選南京復興站周邊；預算有限可住南京三民、松山一帶；想順便在台北玩，可以住中山站周邊，搭綠線 3 站就到。"],
        ["小巨蛋演唱會散場怎麼走比較快？","小巨蛋站散場常排隊，可以往西步行約 10 分鐘到南京復興站，或往東走到南京三民站再搭車。"],
        ["小巨蛋可以容納多少人？","約 1.1～1.5 萬人，實際人數依演唱會舞台配置而定。"]
      ]
    },
    zones:[
      {name:"南京復興、遼寧夜市", hotels:H["南京復興、遼寧夜市"], sub:"往西一站", walk:"步行約 10 分", mrt:"綠線 1 站", price:"中等", text:"商務旅館集中，散場後走去遼寧街夜市吃宵夜剛好。", who:"適合：想吃宵夜、預算中等的人"},
      {name:"南京三民、松山", hotels:H["南京三民、松山"], sub:"往東 1～2 站", walk:"步行 10～20 分", mrt:"綠線 1～2 站", price:"平價～中等", text:"價格比小巨蛋周邊低一些，靠近松山車站，隔天轉台鐵方便。", who:"適合：預算有限、隔天搭台鐵的人"},
      {name:"中山、南京西路", sub:"往西三站", walk:"", mrt:"綠線 3 站", price:"中等", text:"老牌住宿區，選擇多，周邊咖啡店和小吃很多，方便安排隔天行程。", who:"適合：想順便在台北玩一天的人"}
    ]},
  { slug:"kaohsiung-arena", city:"高雄", district:"高雄左營區", name:"高雄巨蛋", short:"高雄巨蛋", cap:"約 1.5 萬人",
    addr:"高雄市左營區博愛二路 757 號",
    mrt:"紅線 巨蛋站（R14）5 號出口，步行約 3 分",
    page:{
      title:"高雄巨蛋住宿推薦｜演唱會住哪最方便？3 區比較＋散場交通攻略",
      desc:"看高雄巨蛋演唱會住哪裡？整理巨蛋商圈、凹子底、高鐵左營站 3 個住宿區域的步行時間、捷運站數和房價，加上散場交通攻略。",
      answer:`看高雄巨蛋演唱會，想走路回飯店就住<b>巨蛋商圈</b>，5～10 分鐘就到；從外縣市來、隔天要搭高鐵，住<b>高鐵左營站周邊</b>最方便，捷運紅線只要 2 站。`,
      hook:"高雄巨蛋出了捷運站走 3 分鐘就到，周邊生活機能也好。不過上萬人一起散場時，巨蛋站一樣會排隊。如果你是從北部、中部南下，看完要趕高鐵會很趕，住一晚會輕鬆很多。",
      exit:[
        "散場人潮集中在<b>巨蛋站</b>。往南步行約 15 分鐘到<b>凹子底站</b>，或在附近吃完宵夜、等人潮散去再搭車。",
        "要回高鐵左營站，搭紅線往北 2 站就到。注意高雄巨蛋和世運主場館是兩個不同場館，別搭錯站。"
      ],
      faq:[
        ["高雄巨蛋最近的捷運站是哪一站？","高雄捷運紅線巨蛋站（R14），從 5 號出口出站，步行約 3 分鐘。"],
        ["高雄巨蛋和世運主場館是同一個地方嗎？","不是。高雄巨蛋在巨蛋站（R14），世運主場館在世運站（R17），兩站之間隔 3 站，買票和訂房前要先確認是哪個場館。"],
        ["看高雄巨蛋演唱會住哪裡最方便？","想走路回飯店，住巨蛋商圈；重視安靜可住凹子底一帶；外縣市來、隔天搭高鐵，住高鐵左營站周邊，捷運 2 站就到。"],
        ["高雄巨蛋可以容納多少人？","約 1.5 萬人。"]
      ]
    },
    zones:[
      {name:"巨蛋商圈", hotels:H["巨蛋商圈"], sub:"場館周邊", walk:"步行 5～10 分", mrt:"不用搭車", price:"中等", text:"走路就到，附近有瑞豐夜市，散場直接去吃宵夜（夜市有公休日，出發前先確認）。", who:"適合：想走路回房、順便逛夜市的人"},
      {name:"凹子底、美術館", hotels:H["凹子底、美術館"], sub:"往南一站", walk:"步行約 15 分", mrt:"紅線 1 站", price:"中等", text:"環境比較安靜，散場往這邊走剛好避開巨蛋站人潮。", who:"適合：重視休息品質的人"},
      {name:"高鐵左營站周邊", hotels:H["高鐵左營站周邊"], sub:"往北兩站", walk:"", mrt:"紅線 2 站", price:"中等", text:"外縣市來的人首選，隔天搭高鐵不用轉車。", who:"適合：從北部或中部來的人"}
    ]},
  { slug:"taipei-music-center", city:"台北", district:"台北南港區", name:"台北流行音樂中心", short:"北流", cap:"約 3 千～5 千人（依座位或站位配置）",
    addr:"台北市南港區市民大道八段 99 號",
    mrt:"板南線 昆陽站 4 號出口步行約 8 分；南港站 1A 連通道步行約 11 分",
    page:{
      title:"北流住宿推薦｜台北流行音樂中心演唱會住哪？3 區比較＋散場交通",
      desc:"看台北流行音樂中心（北流）演唱會住哪裡？整理南港車站、南港展覽館、信義區 3 個住宿區域，加上昆陽站、南港站怎麼走，散場直接搭高鐵也方便。",
      answer:`看北流演唱會，外縣市來最推薦住<b>南港車站周邊</b>：走路約 11 分鐘到場館，南港站同時有<b>高鐵、台鐵、捷運</b>，隔天直接搭車回家。`,
      hook:"台北流行音樂中心夾在昆陽站和南港站中間，兩邊都能走過去。最大的優點是南港站就有高鐵，南部、中部的歌迷看完演唱會，隔天走幾分鐘就能上車，連轉乘都省了。",
      exit:[
        "散場時可以往兩個方向分流：往西走到<b>昆陽站</b>約 8 分鐘，往東走到<b>南港站</b>約 11 分鐘。",
        "要搭高鐵或台鐵的人直接往南港站走；住信義區或台北車站一帶的人，往昆陽站搭板南線比較順。"
      ],
      faq:[
        ["台北流行音樂中心最近的捷運站是哪一站？","板南線昆陽站，從 4 號出口步行約 8 分鐘；也可以從南港站 1A 連通道出站，步行約 11 分鐘。"],
        ["看北流演唱會住哪裡最方便？","外縣市來的人最推薦南港車站周邊，走路就到，隔天還能直接搭高鐵；想逛街吃飯可以住信義區，搭板南線 3 站就到。"],
        ["北流散場可以直接搭高鐵嗎？","可以。南港站有高鐵、台鐵和捷運，從北流步行約 11 分鐘。末班車時間請先查好，散場人潮多時要預留時間。"],
        ["台北流行音樂中心可以容納多少人？","表演廳約 3 千～5 千人，實際人數依座位或站位配置而定。"]
      ]
    },
    zones:[
      {name:"南港車站周邊", hotels:H["南港車站周邊"], sub:"高鐵、台鐵、捷運三鐵共構", walk:"步行約 11 分", mrt:"不用搭車", price:"中等", text:"近幾年新開不少飯店，離場館近，隔天搭高鐵直接在樓下。", who:"適合：外縣市來、要搭高鐵的人"},
      {name:"南港展覽館、軟體園區", sub:"南港站往東一站", walk:"步行 20 分以上", mrt:"板南線 1 站", price:"中等～偏高", text:"商務飯店為主，平日房價較高，週末反而有機會撿到便宜。", who:"適合：週末場次、想住新一點的飯店"},
      {name:"信義區、市政府", hotels:H["信義區、市政府"], sub:"昆陽站往西三站", walk:"", mrt:"板南線 3 站", price:"偏高", text:"百貨、餐廳多，看完還能去吃宵夜，隔天順便逛街。", who:"適合：想順便在台北玩、預算較寬的人"}
    ]},
  { slug:"zepp-new-taipei", city:"新北", district:"新北新莊區", name:"Zepp New Taipei", short:"Zepp New Taipei", cap:"約 2 千人（1 樓站位）",
    addr:"新北市新莊區新北大道四段 3 號（宏匯廣場內）",
    mrt:"機場捷運 A4 新莊副都心站，步行約 5 分（快車不停，要搭普通車）",
    page:{
      title:"Zepp New Taipei 住宿推薦｜怎麼去、住哪方便？機捷交通攻略",
      desc:"Zepp New Taipei 怎麼去、看完住哪裡？整理新莊副都心、台北車站 2 個住宿區域，加上機場捷運快車不停的提醒，從機場來追星也方便。",
      answer:`去 Zepp New Taipei，搭<b>機場捷運普通車到 A4 新莊副都心站</b>，走路約 5 分鐘。想住近一點就住<b>新莊副都心</b>；要逛台北或隔天搭高鐵，住<b>台北車站周邊</b>，機捷普通車 3 站就到。`,
      hook:"Zepp New Taipei 在宏匯廣場裡，吃飯、逛街都在同一棟。它最大的特色是緊鄰機場捷運，從桃園機場搭機捷就能到，很適合從國外或外島來看演出的歌迷。",
      exit:[
        "機場捷運<b>快車不停新莊副都心站</b>，來回都要搭<b>普通車</b>。如果誤搭快車，到新北產業園區站下車，再換普通車坐回來。",
        "散場人數比大型場館少，但機捷普通車班距較長，建議先查好末班車時間。"
      ],
      faq:[
        ["Zepp New Taipei 要怎麼去？","搭機場捷運到 A4 新莊副都心站，步行約 5 分鐘就到宏匯廣場。"],
        ["搭機場捷運去 Zepp New Taipei 要注意什麼？","機場捷運快車不停新莊副都心站，要搭普通車。誤搭快車的話，到新北產業園區站再換普通車折返。"],
        ["看 Zepp New Taipei 演出住哪裡方便？","想住近一點選新莊副都心；想逛台北或隔天要搭高鐵，住台北車站周邊，機捷普通車 3 站就到。"],
        ["Zepp New Taipei 可以容納多少人？","約 2 千人，以 1 樓站位為主。"]
      ]
    },
    zones:[
      {name:"新莊副都心", hotels:H["新莊副都心"], sub:"場館所在商圈", walk:"步行 5～10 分", mrt:"不用搭車", price:"中等", text:"周邊新飯店陸續開幕，商場就在樓下，吃飯不用煩惱。", who:"適合：想住近一點、一路待在商場的人"},
      {name:"台北車站周邊", hotels:H["台北車站周邊"], sub:"機場捷運終點站", walk:"", mrt:"機捷普通車 3 站", price:"平價～中等", text:"住宿選擇最多，隔天轉高鐵、台鐵都方便，也很適合順便逛台北。", who:"適合：外縣市來、想順便玩台北的人"}
    ]}
];

const S = t => /[A-Za-z]$/.test(t) ? t+" " : t;
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
<meta property="og:image" content="${SITE}/assets/og/${path.replace(/^\/|\/$/g, "").replace(/\//g, "-")}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=6">
<link rel="stylesheet" href="/assets/concert.css?v=4">
<script type="application/ld+json">
${JSON.stringify(ld, null, 1)}
</script>
</head>
<body>
${HEADER}
`;

const STEPS = `<p>演唱會熱門場次一公布，周邊飯店往往很快就被訂滿，房價也可能跟著上漲。想住得近、價格又合理，建議按照以下時間安排：</p>
    <div class="steps">
      <div class="step"><div class="when">1. 演唱會公布場次</div><h3>先找飯店</h3><p>趁熱門房型還有空房，先比較場館周邊的住宿。如果選擇先訂房，優先考慮免費取消、取消期限及付款條件清楚的方案。</p></div>
      <div class="step"><div class="when">2. 搶票結束後</div><h3>確認住宿日期</h3><p>成功買到票後，確認演出日期與入住時間。如果有多訂房間或日期不符，記得在取消期限前處理。</p></div>
      <div class="step"><div class="when">3. 演出前 1 週</div><h3>規劃散場路線</h3><p>提前確認捷運末班車、公車班次與飯店位置。也可以準備替代路線，避免散場人潮影響回程。</p></div>
      <div class="step"><div class="when">4. 演唱會當天</div><h3>輕裝出門</h3><p>如果飯店提供入住前行李寄放服務，可以先寄放行李，再輕鬆前往演唱會現場。</p></div>
    </div>`;

const foot = `<footer><a href="/about/">關於我們</a> · <a href="/privacy/">隱私權政策</a> · <a href="/disclosure/">聯盟連結揭露</a><br>放假日曆｜台灣生活資訊與免費試算工具。<br>場館資料查證日期：${TODAY_ZH}。交通與容納人數依場館及主辦單位公告為準；步行時間為一般速度估算，散場人潮時會更久。住宿房價等級為一般情況參考，演唱會期間可能大幅上漲。</footer>
<script src="/assets/concert.js"></script>
<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "4c058fe6d8d047d290cd5fe7c73a3d15"}'></script><!-- End Cloudflare Web Analytics -->
</body>
</html>
`;

function venuePage(v){
  const p = v.page, path = `/concert/${v.slug}/`;
  const hz = v.zones.filter(z => z.hotels);
  const faq = hz.length ? [...p.faq, [`${S(v.short)}附近有哪些飯店？`,
    hz.map(z => `${z.name}：${z.hotels.map(h => h.n).join("、")}`).join("；") + "。實際房價與空房以訂房平台為準，演唱會日期越早訂越好。"]] : p.faq;
  const ld = {"@context":"https://schema.org","@graph":[
    {"@type":"Article","headline":p.title,"datePublished":TODAY,"dateModified":UPDATED,"inLanguage":"zh-Hant-TW","mainEntityOfPage":SITE+path,"publisher":{"@type":"Organization","name":"放假日曆","url":SITE+"/"}},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"放假日曆","item":SITE+"/"},
      {"@type":"ListItem","position":2,"name":"演唱會住宿","item":SITE+"/concert/"},
      {"@type":"ListItem","position":3,"name":`${S(v.short)}住宿`,"item":SITE+path}]},
    {"@type":"FAQPage","mainEntity":faq.map(([q,a])=>({"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}}))}
  ]};
  const others = VENUES.filter(o=>o.page && o.slug!==v.slug);
  return head(p.title, p.desc, path, ld) + `
<main class="article">
  <div>
    <div class="crumb"><a href="/">放假日曆</a> › <a href="/concert/">演唱會住宿</a> › ${S(v.short)}</div>
    <h1>${p.title.replace("｜","<br>")}</h1>
    <div class="meta">更新日期：${UPDATED_ZH}</div>
  </div>

  <div class="answer">${p.answer}</div>
  <p>${p.hook}</p>

  <section>
    <h2>${S(v.short)}住宿區懶人比較</h2>
    <div class="tbl"><table>
      <thead><tr><th>區域</th><th>到場館</th><th>捷運</th><th>房價</th><th>適合</th></tr></thead>
      <tbody>
${v.zones.map(z=>`        <tr><td>${z.name}</td><td>${z.walk||"搭捷運"}</td><td>${z.mrt}</td><td>${z.price}</td><td>${z.who.replace("適合：","")}</td></tr>`).join("\n")}
      </tbody>
    </table></div>
    <p class="note" style="margin-top:8px">步行時間為一般速度估算；房價等級為平常日參考，演唱會期間通常會上漲。</p>
  </section>

  <section>
    <h2>${S(v.short)}交通與場館資訊</h2>
    <dl class="facts">
      <dt>場館</dt><dd>${v.name}</dd>
      <dt>容納</dt><dd>${v.cap}</dd>
      <dt>地址</dt><dd>${v.addr}</dd>
      <dt>捷運</dt><dd>${v.mrt}</dd>
    </dl>
  </section>

  <section>
    <h2>${S(v.short)}演唱會散場怎麼走？</h2>
    <div class="tip">${p.exit.map(t=>`<p>${t}</p>`).join("")}</div>
  </section>


  <section id="zones">
    <h2>${S(v.short)}周邊住宿區域推薦</h2>
${v.zones.map(z=>`    <article class="zone">
      <div><h3>${z.name}</h3><div class="sub">${z.sub}</div></div>
      <div class="chips">${z.walk?`<span class="chip walk">${z.walk}</span>`:""}<span class="chip mrt">${z.mrt}</span><span class="chip">房價${z.price}</span></div>
      <p>${z.text}</p>
      <div class="who">${z.who}</div>${z.hotels ? `
      <div class="hotels"><b>這區可以住</b><ul>${z.hotels.map(h => `<li><a href="${mapUrl(h.n)}" target="_blank" rel="noopener">${h.n}</a><small>${h.loc}</small><span>${h.why}</span></li>`).join("")}</ul></div>` : ""}
    </article>`).join("\n")}
    <p class="note" style="margin-top:12px">飯店是依位置挑出的代表選擇，不是業配，也不代表當天一定有房。點飯店名稱會開 Google 地圖；實際房價、空房和取消規定以訂房平台為準，演唱會日期房價通常會上漲，越早訂越好。</p>
  </section>

  <section>
    <h2>看完要不要住一晚？</h2>
    <p>回答兩個問題，馬上告訴你當天回家來不來得及。</p>
    <div class="helper" data-helper data-venue="${S(v.short)}" data-anchor="#zones"></div>
  </section>

  <section>
    <h2>演唱會訂房攻略：什麼時候訂房最適合？</h2>
    ${STEPS}
  </section>

  <section>
    <h2>常見問題</h2>
${faq.map(([q,a])=>`    <details><summary>${q}</summary><p>${a}</p></details>`).join("\n")}
  </section>

  <section>
    <h2>開始規劃你的演唱會行程</h2>
    <p>搶票前先把住宿卡位，搶到票再確認就好。演唱會剛好接在連假前後？到<a href="/#calendar">全年行事曆</a>看看，順便把請假一起排好。</p>
  </section>

  <section>
    <h2>延伸閱讀</h2>
    <div class="related">
      <a href="/concert/">全台演唱會場館住宿<small>${VENUES.length} 個場館一次看</small></a>
${others.map(o=>`      <a href="/concert/${o.slug}/">${S(o.short)}住宿推薦<small>${o.name}</small></a>`).join("\n")}
      <a href="/#planner">請假攻略計算器<small>演唱會接連假，特休怎麼排</small></a>
    </div>
  </section>
</main>
` + foot;
}

function hubPage(){
  const path = "/concert/";
  const title = "演唱會住宿攻略｜全台演唱會場館附近飯店、交通與散場指南";
  const desc = "準備去看演唱會嗎？整理台灣各大演唱會場館周邊住宿、飯店推薦、交通方式與散場攻略，幫你找到適合的住宿地點，不再擔心末班車與散場人潮。";
  const ld = {"@context":"https://schema.org","@graph":[
    {"@type":"CollectionPage","name":title,"url":SITE+path,"inLanguage":"zh-Hant-TW"},
    {"@type":"BreadcrumbList","itemListElement":[
      {"@type":"ListItem","position":1,"name":"放假日曆","item":SITE+"/"},
      {"@type":"ListItem","position":2,"name":"演唱會住宿","item":SITE+path}]}
  ]};
  const ready = VENUES.filter(v=>v.page), soon = VENUES.filter(v=>!v.page);
  return head(title, desc, path, ld) + `
<main class="article">
  <div>
    <div class="crumb"><a href="/">放假日曆</a> › 演唱會住宿</div>
    <h1>演唱會住宿攻略<br>全台場館周邊飯店、交通與散場指南</h1>
    <div class="meta">更新日期：${UPDATED_ZH}</div>
  </div>

  <div class="answer">搶到演唱會門票，接下來就是安排一趟輕鬆的追星之旅！</div>
  <p>不論你要去台北大巨蛋、高雄世運主場館，還是其他演唱會場地，都能快速查詢周邊住宿、交通方式、步行距離與散場建議。</p>
  <p>訂好住宿，規劃好交通，看完演唱會就能安心回飯店，不必再為末班車煩惱。</p>

  <section>
    <h2>你要去哪個場館看演唱會？</h2>
    <p>每個演唱會場館周邊的住宿與交通方式都不一樣。選擇你的演唱會場地，快速找到附近住宿區域、交通資訊，以及散場後最方便的回程方式。</p>
    <div class="venues">
${ready.map(v=>`      <a class="venue" href="/concert/${v.slug}/"><span class="city">${v.district}</span><span class="nm">${v.name}</span><small>${v.cap}</small><span class="cta">查看住宿攻略 →</span></a>`).join("\n")}
    </div>
${soon.length ? `    <h3 class="group-h">即將推出</h3>
    <div class="venues">
${soon.map(v=>`      <div class="venue soon"><span class="badge">即將推出</span><span class="city">${v.district}</span><span class="nm">${v.name}</span><small>${v.cap}</small><small>交通：${v.mrt}</small></div>`).join("\n")}
    </div>` : ""}
  </section>


  <section>
    <h2>住宿區域怎麼選？</h2>
    <p>同一個場館，住在不同區域的體驗差很多。先想清楚自己最在意的是「散場走路就到」、「房價」，還是「隔天好搭車」，再挑區域。</p>
    <div class="tbl"><table>
      <thead><tr><th>住宿區域</th><th>優點</th><th>缺點</th><th>適合</th></tr></thead>
      <tbody>
        <tr><td>場館附近</td><td>散場走路回飯店，不用擠捷運</td><td>房源少，演唱會期間房價漲最多</td><td>只想看完馬上休息的人</td></tr>
        <tr><td>捷運沿線 1～3 站</td><td>選擇多、價格較穩，還能避開最擠的車站</td><td>散場後仍要搭一小段捷運</td><td>想兼顧預算和方便的人</td></tr>
        <tr><td>高鐵、火車站周邊</td><td>隔天回家最順，平價住宿多</td><td>離場館較遠，散場回程時間較長</td><td>外縣市來、隔天一早要搭車的人</td></tr>
      </tbody>
    </table></div>
  </section>

  <section>
    <h2>演唱會散場交通實戰攻略</h2>
    <p>大型演唱會散場時，最近的捷運站常常要排隊管制進站。這幾個做法可以少等很多時間：</p>
    <ul class="tips">
      <li><b>走一站再搭車</b>：往下一站走 10～15 分鐘，通常比在最近的車站排隊快。</li>
      <li><b>先查好末班車</b>：高鐵、台鐵、客運的末班時間演出前就要確認，散場加排隊可能要 40 分鐘以上。</li>
      <li><b>留意接駁車公告</b>：大型場次常有往高鐵站或火車站的接駁車，班次和上車地點依各場次公告為準。</li>
      <li><b>不要開車</b>：演唱會期間場館周邊常有交通管制，停車位也很難找。</li>
    </ul>
  </section>

  <section>
    <h2>演唱會結束太晚？幫你找出最適合的住宿方式</h2>
    <p>外縣市看演唱會，最怕的就是散場人潮、末班車，以及拖著疲憊的身體趕車。不確定該不該住一晚？回答兩個簡單問題，幫你評估是否需要住宿；需要的話，再到上面的場館頁看推薦的住宿區域。</p>
    <h3 class="group-h">看完演唱會，你打算怎麼回家？</h3>
    <div class="helper" data-helper></div>
  </section>

  <section>
    <h2>演唱會訂房攻略：什麼時候訂房最適合？</h2>
    ${STEPS}
  </section>

  <section>
    <h2>延伸閱讀</h2>
    <div class="related">
${ready.map(v=>`      <a href="/concert/${v.slug}/">${S(v.short)}住宿攻略<small>${v.name}</small></a>`).join("\n")}
      <a href="/#calendar">2027 全年行事曆<small>演唱會接連假，一次排好</small></a>
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
