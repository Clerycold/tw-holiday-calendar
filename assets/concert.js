// 演唱會住宿：「看完要不要住一晚」小幫手。用法：<div class="helper" data-helper data-venue="臺北大巨蛋" data-anchor="#zones"></div>
(function(){
  const FROM = [["same","同城市"],["near","鄰近縣市（1 小時內）"],["far","要搭高鐵／跨區"],["fly","外島或國外"]];
  const END = [["early","22:00 前"],["late","22:00 以後"]];

  function advise(from, end){
    if(from==="same") return ["go","不用住，搭車回家就好","散場後別急著擠最近的捷運站，走一站去搭車通常更快。"];
    if(from==="near") return end==="late"
      ? ["maybe","可以當天來回，但要算好末班車","散場加上排隊進站可能要 40 分鐘以上，先查好客運或台鐵末班車；怕趕不上就住一晚。"]
      : ["go","當天來回沒問題","記得預留散場排隊時間，安排晚一點的回程車次。"];
    if(from==="far") return end==="late"
      ? ["stay","建議住一晚","散場後要趕高鐵末班車很吃緊，人潮一多就容易錯過。住一晚，隔天睡飽再回家。"]
      : ["stay","建議住一晚","早一點散場也許趕得上高鐵，但沒有緩衝時間。訂一間可免費取消的房比較保險。"];
    return ["stay","一定要住，最好住兩晚","前一天到、看完隔天再走，避開航班延誤的風險。住在能直達機場或高鐵的區域最方便。"];
  }

  document.querySelectorAll("[data-helper]").forEach(el=>{
    let from = "far", end = "late";
    const venue = el.dataset.venue, anchor = el.dataset.anchor || "#zones";
    function seg(list, cur){ return list.map(([k,t])=>`<button type="button" aria-pressed="${k===cur}" data-k="${k}">${t}</button>`).join(""); }
    function draw(){
      const [cls,title,body] = advise(from,end);
      el.innerHTML = `
        <div class="q"><b>你從哪裡出發？</b><div class="seg" data-g="from">${seg(FROM,from)}</div></div>
        <div class="q"><b>預計散場時間</b><div class="seg" data-g="end">${seg(END,end)}</div></div>
        <div class="verdict ${cls}" aria-live="polite"><strong>${title}</strong><p>${body}</p>${cls!=="go"&&venue?`<p><a href="${anchor}">看${venue}周邊的住宿區域 ↑</a></p>`:""}</div>`;
      el.querySelectorAll(".seg button").forEach(b=>b.addEventListener("click",()=>{
        if(b.parentElement.dataset.g==="from") from=b.dataset.k; else end=b.dataset.k;
        draw();
      }));
    }
    draw();
  });
})();
