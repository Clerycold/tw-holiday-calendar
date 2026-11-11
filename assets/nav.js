// 內頁共用 Header：手機漢堡選單（Esc 關閉、點連結關閉）＋標示目前所在區塊（aria-current）。
(function(){
  var btn=document.querySelector(".menu-btn"), nav=document.getElementById("siteNav");
  if(!btn||!nav) return;
  function set(open){ nav.classList.toggle("open",open); btn.setAttribute("aria-expanded",String(open)); btn.setAttribute("aria-label",open?"關閉選單":"開啟選單"); }
  btn.addEventListener("click",function(){ set(btn.getAttribute("aria-expanded")!=="true"); });
  nav.addEventListener("click",function(e){ if(e.target.closest("a")) set(false); });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&nav.classList.contains("open")){ set(false); btn.focus(); } });
  document.addEventListener("click",function(e){ if(nav.classList.contains("open")&&!e.target.closest(".site-head")) set(false); });
  var p=location.pathname;
  [["/tools/","/tools/"],["/concert/","/concert/"],["/2027/chunjie/","/2027/chunjie/"]].forEach(function(r){
    if(p.indexOf(r[0])===0){ var a=nav.querySelector('a[href="'+r[1]+'"]'); if(a) a.setAttribute("aria-current","page"); }
  });
})();

// 手機底部快速導覽：標示目前所在的區塊。首頁依捲動位置切換，工具頁固定標「生活工具」。
(function(){
  var bn=document.querySelector(".bottom-nav"); if(!bn) return;
  function mark(k){ bn.querySelectorAll("a").forEach(function(a){ if(a.dataset.bn===k) a.setAttribute("aria-current","true"); else a.removeAttribute("aria-current"); }); }
  if(location.pathname.indexOf("/tools/")===0){ mark("tools"); return; }
  var ids=["planner","calendar","tools"].filter(function(id){ return document.getElementById(id); });
  if(location.pathname!=="/" || !ids.length) return;
  var ticking=false;
  function update(){
    ticking=false;
    var mid=window.innerHeight/2, cur=null;  // 區塊跨過畫面中線才算「在這裡」
    ids.forEach(function(id){ var r=document.getElementById(id).getBoundingClientRect(); if(r.top<=mid && r.bottom>mid) cur=id; });
    mark(cur||(window.scrollY<400?"home":null));
  }
  window.addEventListener("scroll",function(){ if(!ticking){ ticking=true; setTimeout(update,80); } },{passive:true});
  update();
})();
