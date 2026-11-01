// 放假日曆 shared data + helpers. Source: 人事行政總處 116 年辦公日曆表.
// type: h = 國定假日, m = 補假
(function(){
  const HOL = {
    "2026-12-25":["行憲紀念日","h"],
    "2027-01-01":["元旦","h"],
    "2027-02-04":["小年夜","h"],"2027-02-05":["除夕","h"],"2027-02-06":["春節 初一","h"],
    "2027-02-07":["春節 初二","h"],"2027-02-08":["春節 初三","h"],"2027-02-09":["春節補假","m"],"2027-02-10":["春節補假","m"],
    "2027-02-28":["和平紀念日","h"],"2027-03-01":["和平紀念日補假","m"],
    "2027-04-04":["兒童節","h"],"2027-04-05":["清明節","h"],"2027-04-06":["兒童節補假","m"],
    "2027-05-01":["勞動節","h"],"2027-04-30":["勞動節補假","m"],
    "2027-06-09":["端午節","h"],
    "2027-09-15":["中秋節","h"],
    "2027-09-28":["教師節","h"],
    "2027-10-10":["國慶日","h"],"2027-10-11":["國慶日補假","m"],
    "2027-10-25":["臺灣光復節","h"],
    "2027-12-25":["行憲紀念日","h"],"2027-12-24":["行憲紀念日補假","m"],
    "2027-12-31":["元旦補假","m"],"2028-01-01":["元旦","h"]
  };
  const DOW = ["日","一","二","三","四","五","六"];
  const pad = n => String(n).padStart(2,"0");
  const key = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const isOff = d => d.getDay()===0 || d.getDay()===6 || !!HOL[key(d)];

  // Render one month grid into `el`. `leave` is a Set of date keys to mark green.
  function renderMonth(el, y, m, leave){
    const first = new Date(y,m,1), dim = new Date(y,m+1,0).getDate();
    let cells = DOW.map(x=>`<div class="dow">${x}</div>`).join("");
    for(let i=0;i<first.getDay();i++) cells += "<div></div>";
    for(let d=1; d<=dim; d++){
      const dt = new Date(y,m,d), k = key(dt), h = HOL[k];
      let cls = "d";
      if(leave && leave.has(k)) cls += " lv";
      else if(h) cls += h[1]==="h" ? " hol" : " mk";
      else if(dt.getDay()===0 || dt.getDay()===6) cls += " we";
      cells += `<div class="${cls}" title="${h ? h[0] : ""}">${d}</div>`;
    }
    el.innerHTML = `<h3>${y} 年 ${m+1} 月</h3><div class="grid7">${cells}</div>`;
  }

  window.HolidayTW = { HOL, DOW, key, isOff, renderMonth };
})();
