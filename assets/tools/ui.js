// 放假日曆 試算工具：介面。每個工具頁的 <form data-tool="..."> 對應下方一段。
(function(){
  const C = window.Calc;
  const $ = (s, r=document) => r.querySelector(s);
  const money = v => Math.round(v).toLocaleString("zh-TW");
  const num = el => Math.max(0, +String(el.value).replace(/,/g,"") || 0);
  const ymd = d => `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
  const W = "日一二三四五六";
  const parseDate = v => v ? new Date(v + "T00:00") : null;
  const save = (k, v) => { try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };
  const load = k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return null; } };

  document.addEventListener("click", e => {
    const b = e.target.closest(".copy"); if(!b) return;
    const src = document.getElementById(b.dataset.copy);
    const text = src.value !== undefined ? src.value : src.textContent;
    const done = () => { const t = b.textContent; b.textContent = "已複製"; setTimeout(()=>b.textContent = t, 1500); };
    if(navigator.clipboard) navigator.clipboard.writeText(text).then(done, ()=>{});
  });

  // ---- 綜所稅 ----
  const tax = $('form[data-tool="tax"]');
  if(tax){
    const f = tax.elements, out = $("#taxOut");
    const segBtns = tax.querySelectorAll(".seg button");
    let married = false;
    segBtns.forEach(b => b.addEventListener("click", () => {
      married = b.dataset.v === "1";
      segBtns.forEach(x => x.setAttribute("aria-pressed", x === b));
      tax.querySelectorAll("[data-spouse]").forEach(el => el.hidden = !married);
      run();
    }));
    function run(){
      const p = {
        married,
        self:{salary:num(f.selfSalary), other:num(f.selfOther), senior:f.selfSenior.checked, disabled:f.selfDisabled.checked},
        spouse:{salary:num(f.spSalary), other:num(f.spOther), senior:f.spSenior.checked, disabled:f.spDisabled.checked},
        minors:num(f.minors), preschool:Math.min(num(f.preschool), num(f.minors)), adults:num(f.adults), seniorDeps:num(f.seniorDeps),
        disabledDeps:num(f.disabledDeps), ltc:num(f.ltc), rent:f.rent.checked, itemized:num(f.itemized), withheld:num(f.withheld)
      };
      const r = C.incomeTax(p);
      const how = r.sepWho === null ? "全部合併計稅" : `${r.sepWho === 0 ? "本人" : "配偶"}${r.sepAll ? "各類所得" : "薪資所得"}分開計稅`;
      out.innerHTML = `
        <div>預估應納稅額</div>
        <div class="big">${money(r.tax)} <small>元</small></div>
        ${f.withheld.value ? `<div>${r.refund >= 0 ? `預估可<b>退稅 ${money(r.refund)} 元</b>` : `預估要<b>補稅 ${money(-r.refund)} 元</b>`}（已扣繳 ${money(p.withheld)} 元）</div>` : ""}
        <dl class="kv">
          <dt>所得總額</dt><dd>${money(r.income)}</dd>
          <dt>免稅額（${r.people} 人）</dt><dd>−${money(r.exemptTotal)}</dd>
          <dt>${r.usedItemized ? "列舉扣除額" : "標準扣除額"}</dt><dd>−${money(r.general)}</dd>
          <dt>薪資所得特別扣除額</dt><dd>−${money(r.salaryDed)}</dd>
          ${r.disabledTotal ? `<dt>身心障礙特別扣除額</dt><dd>−${money(r.disabledTotal)}</dd>` : ""}
          ${r.pre ? `<dt>幼兒學前特別扣除額</dt><dd>−${money(r.pre)}</dd>` : ""}
          ${r.ltc ? `<dt>長期照顧特別扣除額</dt><dd>−${money(r.ltc)}</dd>` : ""}
          ${r.rentDed ? `<dt>房屋租金支出特別扣除額</dt><dd>−${money(r.rentDed)}</dd>` : ""}
          ${r.bl ? `<dt>基本生活費差額</dt><dd>−${money(r.bl)}</dd>` : ""}
          <dt class="sum">適用稅率</dt><dd class="sum">${Math.round(r.rate*100)}%</dd>
          <dt class="sum">計稅方式</dt><dd class="sum">${how}</dd>
        </dl>
        ${married && r.tax < r.combinedTax ? `<div class="note">比全部合併計稅省 ${money(r.combinedTax - r.tax)} 元。報稅系統會自動比較，選最省的方式。</div>` : ""}
        ${r.capped ? `<div class="warn">適用稅率達 20%，依規定不能減除幼兒學前、長期照顧及房屋租金支出特別扣除額。</div>` : ""}`;
      save("taxForm", {married, v:[...tax.querySelectorAll("input")].map(i => i.type === "checkbox" ? i.checked : i.value)});
    }
    const s = load("taxForm");
    if(s){ const ins = [...tax.querySelectorAll("input")]; s.v.forEach((v,i)=>{ if(!ins[i]) return; if(ins[i].type==="checkbox") ins[i].checked = v; else ins[i].value = v; });
      if(s.married) segBtns[1].click(); }
    tax.addEventListener("input", run); tax.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 特休 ----
  const leave = $('form[data-tool="leave"]');
  if(leave){
    const f = leave.elements, out = $("#leaveOut");
    const today = new Date(); today.setHours(0,0,0,0);
    if(!f.asOf.value) f.asOf.value = C.key(today);
    function run(){
      const hire = parseDate(f.hire.value), asOf = parseDate(f.asOf.value) || today;
      if(!hire){ out.innerHTML = `<div class="note">輸入到職日，就會算出你的特休天數。</div>`; return; }
      if(hire > asOf){ out.innerHTML = `<div class="warn">到職日晚於計算日，請確認日期。</div>`; return; }
      const r = C.annualLeave(hire, asOf), t = r.tenure;
      const pay = num(f.salary) ? num(f.salary) / 30 : 0;
      const rows = r.list.slice(0, 12).map(m => `<tr${m === r.cur ? ' style="background:var(--leave-soft)"' : ""}><td>${m.label}</td><td class="num">${ymd(m.at)}</td><td class="num">${m.days} 天</td></tr>`).join("");
      out.innerHTML = `
        <div>年資 ${t.y} 年 ${t.m} 個月 ${t.d} 天，目前這一年的特休</div>
        <div class="big">${r.cur ? r.cur.days : 0} <small>天</small></div>
        ${r.cur ? `<div class="note">${ymd(r.cur.at)}（${r.cur.label}）起算的特休，要在下一個週年前休完。</div>` : `<div class="note">還沒滿 6 個月，${ymd(r.list[0].at)} 起有 3 天特休。</div>`}
        ${r.next ? `<div>下一次：<b>${ymd(r.next.at)}</b>（${r.next.label}）起有 <b>${r.next.days} 天</b></div>` : ""}
        ${pay && r.cur ? `<div>如果年度結束還沒休完，未休的特休要折算工資：每天約 <b>${money(pay)} 元</b>，${r.cur.days} 天全部未休約 <b>${money(pay * r.cur.days)} 元</b>。</div>` : ""}
        <div class="tbl"><table><thead><tr><th>年資</th><th>日期</th><th>特休</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="note">滿 10 年後每多 1 年加 1 天，最多 30 天。</div>`;
      $("#leaveFormula").textContent = `=DATEDIF(DATE(${hire.getFullYear()},${hire.getMonth()+1},${hire.getDate()}),TODAY(),"Y")`;
      save("leaveForm", [f.hire.value, f.salary.value]);
    }
    const s = load("leaveForm"); if(s){ f.hire.value = s[0] || ""; f.salary.value = s[1] || ""; }
    leave.addEventListener("input", run); leave.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 加班費 ----
  const ot = $('form[data-tool="overtime"]');
  if(ot){
    const f = ot.elements, out = $("#otOut");
    const NAME = {weekday:"平日加班", restday:"休息日加班", holiday:"國定假日出勤"};
    const rate = r => typeof r === "string" ? r : r === 4/3 ? "×1⅓" : r === 5/3 ? "×1⅔" : "×2⅔";
    function run(){
      const r = C.overtime(num(f.salary), {
        weekday:{hours:num(f.wdH), times:num(f.wdN)}, restday:{hours:num(f.rdH), times:num(f.rdN)}, holiday:{hours:num(f.hdH), times:num(f.hdN)}
      });
      if(!num(f.salary)){ out.innerHTML = `<div class="note">輸入月薪，就會算出加班費。</div>`; return; }
      const lines = r.rows.filter(x => x.per > 0 && x.times > 0).map(x =>
        `<dt>${NAME[x.key]}：${x.det.map(([h,k]) => typeof k === "string" ? k : `${h} 小時 ${rate(k)}`).join("、")} × ${x.times} 次</dt><dd>${money(x.per * x.times)}</dd>`).join("");
      out.innerHTML = `
        <div>預估加班費</div>
        <div class="big">${money(r.total)} <small>元</small></div>
        <dl class="kv">
          <dt>時薪（月薪 ÷ 240）</dt><dd>${money(r.hourly)}</dd>
          ${lines || "<dt>輸入加班時數和次數</dt><dd>—</dd>"}
        </dl>
        ${num(f.wdH) > 4 ? `<div class="warn">平日加班每天最多 4 小時（一天總工時上限 12 小時），已以 4 小時計算。</div>` : ""}
        ${num(f.rdH) > 12 || num(f.hdH) > 12 ? `<div class="warn">一天工時上限 12 小時，超過部分未計入。</div>` : ""}`;
      save("otForm", [...ot.querySelectorAll("input")].map(i => i.value));
    }
    const s = load("otForm"); if(s){ [...ot.querySelectorAll("input")].forEach((i,k)=> i.value = s[k] ?? i.value); }
    ot.addEventListener("input", run); ot.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 工作天數 ----
  const wd = $('form[data-tool="workdays"]');
  if(wd){
    const f = wd.elements, out = $("#wdOut"), out2 = $("#addOut");
    $("#holList").value = C.weekdayHolidays().map(k => k.replace(/-/g,"/")).join("\n");
    function run(){
      const a = parseDate(f.from.value), b = parseDate(f.to.value);
      if(a && b){
        const r = C.workdays(a, b);
        out.innerHTML = `
          <div>工作天數（含頭尾）</div>
          <div class="big">${r.workdays} <small>天</small></div>
          <dl class="kv">
            <dt>期間總天數</dt><dd>${r.total}</dd>
            <dt>週六、週日</dt><dd>−${r.weekends}</dd>
            <dt>平日放假（國定假日、補假）</dt><dd>−${r.holidays.length}</dd>
          </dl>
          ${r.holidays.length ? `<div class="note">扣掉的假日：${r.holidays.map(([k,n]) => `${+k.slice(5,7)}/${+k.slice(8)}（${W[new Date(k+"T00:00").getDay()]}）${n}`).join("、")}</div>` : ""}
          ${r.outOfRange ? `<div class="warn">本工具的國定假日資料涵蓋 2026～2027 年，超出範圍的日期只扣週末。</div>` : ""}`;
      }
      const s = parseDate(f.start.value), n = Math.floor(num(f.n));
      if(s && n){
        const d = C.addWorkdays(s, n);
        out2.innerHTML = `<div>${ymd(s)} 之後第 ${n} 個工作天是</div><div class="big">${ymd(d)} <small>（${W[d.getDay()]}）</small></div>`;
      }
    }
    wd.addEventListener("input", run); wd.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }
})();
