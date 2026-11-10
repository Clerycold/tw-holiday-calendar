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
