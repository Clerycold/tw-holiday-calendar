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
    const b = e.target.closest(".copy[data-copy]"); if(!b) return;   // 只處理有複製目標的按鈕（.copy 也被拿來當一般按鈕樣式）
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
        disabledDeps:num(f.disabledDeps), ltc:num(f.ltc), rent:num(f.rent), itemized:num(f.itemized), withheld:num(f.withheld)
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
        ${married ? `<div class="tbl"><table><thead><tr><th>計稅方式</th><th>應納稅額</th></tr></thead><tbody>${r.options.map(o => `<tr${o.tax === r.tax ? ' style="background:var(--leave-soft)"' : ""}><td>${o.sepWho === null ? "全部合併計稅" : (o.sepWho === 0 ? "本人" : "配偶") + (o.sepAll ? "各類所得分開計稅" : "薪資所得分開計稅")}</td><td class="num">${money(o.tax)}</td></tr>`).join("")}</tbody></table></div>
        <div class="note">報稅系統會自動比較這幾種方式，選最省的；綠底就是最省的方式${r.tax < r.combinedTax ? `，比全部合併省 ${money(r.combinedTax - r.tax)} 元` : ""}。</div>` : ""}
        ${r.bl ? `<div class="note">這次試算用到了「基本生活費差額」。115 年度每人基本生活費尚未公告，暫以 114 年度 213,000 元計算；正式金額若調高，你的稅額會再低一些。</div>` : ""}
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
      const pay = num(f.salary) ? num(f.salary) / 30 : 0, used = num(f.used);
      const left = r.cur ? Math.max(0, r.cur.days - used) : 0;
      const rows = r.list.slice(0, 12).map(m => `<tr${m === r.cur ? ' style="background:var(--leave-soft)"' : ""}><td>${m.label}</td><td class="num">${ymd(m.at)}</td><td class="num">${m.days} 天</td></tr>`).join("");
      out.innerHTML = `
        <div>年資 ${t.y} 年 ${t.m} 個月 ${t.d} 天，目前這一年的特休</div>
        <div class="big">${r.cur ? r.cur.days : 0} <small>天</small></div>
        ${r.cur ? `<div class="note">${ymd(r.cur.at)}（${r.cur.label}）起算的特休，要在下一個週年前休完。</div>` : `<div class="note">還沒滿 6 個月，${ymd(r.list[0].at)} 起有 3 天特休。</div>`}
        ${r.next ? `<div>下一次：<b>${ymd(r.next.at)}</b>（${r.next.label}）起有 <b>${r.next.days} 天</b></div>` : ""}
        ${r.cur ? `<dl class="kv"><dt>已取得</dt><dd>${r.cur.days} 天</dd><dt>已使用</dt><dd>${Math.min(used, r.cur.days)} 天</dd><dt class="sum">剩餘</dt><dd class="sum">${left} 天</dd></dl>` : ""}
        ${pay && r.cur ? `<div>剩餘的特休如果到年度結束都沒休，要折算工資：一日工資約 <b>${money(pay)} 元</b>（月薪 ÷ 30），${left} 天約 <b>${money(pay * left)} 元</b>。</div>` : ""}
        <div class="tbl"><table><thead><tr><th>年資</th><th>日期</th><th>特休</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="note">滿 10 年後每多 1 年加 1 天，最多 30 天。</div>
        <h3 style="margin:8px 0 0;font-size:1rem">週年制和曆年制比較（按比例試算）</h3>
        <div class="tbl"><table><thead><tr><th>年度</th><th>週年制：當年取得</th><th>曆年制：按比例</th></tr></thead><tbody>${C.calendarYearLeave(hire, [0,1,2,3,4].map(i => asOf.getFullYear() - 1 + i)).map(x => `<tr><td class="num">${x.year}</td><td class="num">${x.anniversary} 天</td><td class="num">${x.calendar} 天</td></tr>`).join("")}</tbody></table></div>
        <div class="note">曆年制是把每個週年的特休，依落在各年度的天數比例分配。實務上公司可能四捨五入或提前一次給足，但長期合計不能少於週年制。</div>`;
      $("#leaveFormula").textContent = `=DATEDIF(DATE(${hire.getFullYear()},${hire.getMonth()+1},${hire.getDate()}),TODAY(),"Y")`;
      save("leaveForm", [f.hire.value, f.salary.value, f.used.value]);
    }
    const s = load("leaveForm"); if(s){ f.hire.value = s[0] || ""; f.salary.value = s[1] || ""; f.used.value = s[2] || ""; }
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
      const r = C.overtime(num(f.salary) + num(f.allow), {
        weekday:{hours:num(f.wdH), times:num(f.wdN)}, restday:{hours:num(f.rdH), times:num(f.rdN)}, holiday:{hours:num(f.hdH), times:num(f.hdN)}
      });
      if(!num(f.salary)){ out.innerHTML = `<div class="note">輸入月薪，就會算出加班費。</div>`; return; }
      const lines = r.rows.filter(x => x.per > 0 && x.times > 0).map(x =>
        `<dt>${NAME[x.key]}：${x.det.map(([h,k]) => typeof k === "string" ? k : `${h} 小時 ${rate(k)}`).join("、")} × ${x.times} 次</dt><dd>${money(x.per * x.times)}</dd>`).join("");
      out.innerHTML = `
        <div>預估加班費</div>
        <div class="big">${money(r.total)} <small>元</small></div>
        <dl class="kv">
          <dt>時薪（月薪＋固定津貼）÷ 240</dt><dd>${money(r.hourly)}</dd>
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
    const slash = k => k.replace(/-/g,"/");
    function opts(){
      const extra = new Set(String(f.extra.value).split(/[\s,，、]+/).filter(Boolean).map(x => {
        const [y,m,d] = x.replace(/\//g,"-").split("-");
        return y && m && d ? `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}` : "";
      }).filter(k => k && !isNaN(new Date(k+"T00:00"))));
      return {sixDay: f.sixDay.checked, extra};
    }
    function holList(o){
      // 週休二日只需列平日假日；只休週日時，週六的假日也要列進去
      const base = o.sixDay ? Object.keys(C.TW_HOL).filter(k => new Date(k+"T00:00").getDay() !== 0) : C.weekdayHolidays();
      $("#holList").value = [...new Set([...base, ...o.extra])].sort().map(slash).join("\n");
    }
    function run(){
      const a = parseDate(f.from.value), b = parseDate(f.to.value), o = opts();
      holList(o);
      $("#nwFormula").textContent = o.sixDay ? '=NETWORKDAYS.INTL(A2,B2,"0000001",假日!A:A)' : "=NETWORKDAYS(A2,B2,假日!A:A)";
      $("#wkFormula").textContent = o.sixDay ? '=WORKDAY.INTL(A2,10,"0000001",假日!A:A)' : "=WORKDAY(A2,10,假日!A:A)";
      if(a && b){
        const r = C.workdays(a, b, o);
        out.innerHTML = `
          <div>工作天數（含頭尾）</div>
          <div class="big">${r.workdays} <small>天</small></div>
          <dl class="kv">
            <dt>期間總天數</dt><dd>${r.total}</dd>
            <dt>${o.sixDay ? "週日" : "週六、週日"}</dt><dd>−${r.weekends}</dd>
            <dt>國定假日、補假</dt><dd>−${r.holidays.length}</dd>
            ${r.extra.length ? `<dt>公司額外放假</dt><dd>−${r.extra.length}</dd>` : ""}
          </dl>
          ${r.holidays.length ? `<div class="note">扣掉的假日：${r.holidays.map(([k,n]) => `${+k.slice(5,7)}/${+k.slice(8)}（${W[new Date(k+"T00:00").getDay()]}）${n}`).join("、")}</div>` : ""}
          ${r.outOfRange ? `<div class="warn">本工具的國定假日資料涵蓋 2026～2027 年，超出範圍的日期只扣週末。</div>` : ""}`;
      }
      const s = parseDate(f.start.value), n = Math.floor(num(f.n));
      if(s && n){
        const d = C.addWorkdays(s, n, o);
        out2.innerHTML = `<div>${ymd(s)} 之後第 ${n} 個工作天是</div><div class="big">${ymd(d)} <small>（${W[d.getDay()]}）</small></div>`;
      }
    }
    // 快速帶入：今天到本月底／年底／明年底
    const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    wd.querySelectorAll("[data-range]").forEach(btn => btn.addEventListener("click", () => {
      const t = new Date(); t.setHours(0,0,0,0);
      const end = {month: new Date(t.getFullYear(), t.getMonth()+1, 0), year: new Date(t.getFullYear(), 11, 31), next: new Date(t.getFullYear()+1, 11, 31)}[btn.dataset.range];
      f.from.value = iso(t); f.to.value = iso(end); run();
    }));
    wd.addEventListener("input", run); wd.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 勞健保 ----
  const ins = $('form[data-tool="insurance"]');
  if(ins){
    const f = ins.elements, out = $("#insOut");
    function run(){
      const r = C.laborIns({salary:num(f.salary), deps:num(f.deps), noEI:f.noEI.checked, selfPct:num(f.selfPct)});
      if(!r.salary){ out.innerHTML = `<div class="note">輸入月薪，就會算出每月勞保、健保、勞退的金額。</div>`; return; }
      out.innerHTML = `
        <div>每月個人負擔合計</div>
        <div class="big">${money(r.empTotal)} <small>元</small></div>
        <div>扣完勞健保${r.pen.emp ? "和勞退自提" : ""}後，每月約實領 <b>${money(r.takeHome)} 元</b>（未扣所得稅、未含加班費）</div>
        <div class="tbl"><table>
          <thead><tr><th>項目</th><th>投保級距</th><th>你負擔</th><th>公司負擔</th></tr></thead>
          <tbody>
            <tr><td>勞保（普通事故 11.5%）</td><td class="num">${money(r.li.grade)}</td><td class="num">${money(r.li.emp)}</td><td class="num">${money(r.li.er)}</td></tr>
            <tr><td>就業保險（1%）</td><td class="num">${f.noEI.checked ? "不適用" : money(r.li.grade)}</td><td class="num">${money(r.ei.emp)}</td><td class="num">${money(r.ei.er)}</td></tr>
            <tr><td>健保（5.17%，本人${r.nhi.deps ? `＋眷屬 ${r.nhi.deps} 人` : ""}）</td><td class="num">${money(r.nhi.grade)}</td><td class="num">${money(r.nhi.emp)}</td><td class="num">${money(r.nhi.er)}</td></tr>
            <tr><td>勞退（雇主 6%${r.pen.pct ? `、自提 ${r.pen.pct}%` : ""}）</td><td class="num">${money(r.pen.grade)}</td><td class="num">${money(r.pen.emp)}</td><td class="num">${money(r.pen.er)}</td></tr>
            <tr><td><b>合計</b></td><td></td><td class="num"><b>${money(r.empTotal)}</b></td><td class="num"><b>${money(r.erTotal)}</b></td></tr>
          </tbody>
        </table></div>
        <div class="note">公司每月實際人事成本約 ${money(r.salary + r.erTotal)} 元（月薪＋公司負擔，未含職災保險）。${r.pen.emp ? `勞退自提的 ${money(r.pen.emp)} 元會存進你的勞退個人專戶，而且可以從當年度薪資所得中減除。` : ""}</div>
        ${r.belowMin ? `<div class="warn">月薪低於基本工資 29,500 元。全職勞工的月薪不得低於基本工資；部分工時的投保級距不同，本工具未納入。</div>` : ""}`;
      save("insForm", [f.salary.value, f.deps.value, f.selfPct.value, f.noEI.checked]);
    }
    const s = load("insForm"); if(s){ f.salary.value = s[0] || ""; f.deps.value = s[1] || "0"; f.selfPct.value = s[2] || "0"; f.noEI.checked = !!s[3]; }
    ins.addEventListener("input", run); ins.addEventListener("change", run); ins.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 薪資實領 ----
  const pay = $('form[data-tool="pay"]');
  if(pay){
    const f = pay.elements, out = $("#payOut");
    const ids = ["salary","overtime","bonus","bonusYTD","deps","selfPct","taxMethod","taxManual","other"];
    function run(){
      const five = f.taxMethod.value === "five";
      $("#taxManualWrap").hidden = five || num(f.salary) < C.PAY115.threshold;
      const r = C.netPay({salary:num(f.salary), overtime:num(f.overtime), bonus:num(f.bonus), bonusYTD:num(f.bonusYTD), deps:num(f.deps),
        noEI:f.noEI.checked, selfPct:num(f.selfPct), taxMethod:f.taxMethod.value, taxManual:f.taxManual.value, other:num(f.other)});
      if(!num(f.salary)){ out.innerHTML = `<div class="note">輸入月薪，就會算出這個月實際入帳多少。</div>`; return; }
      const row = (label, v, sign="−") => v ? `<dt>${label}</dt><dd>${sign}${money(v)}</dd>` : "";
      out.innerHTML = `
        <div>本月預估實領</div>
        <div class="big">${money(r.net)} <small>元</small></div>
        <dl class="kv">
          <dt>應發合計</dt><dd>${money(r.gross)}</dd>
          ${row("勞保＋就保", r.ins.li.emp + r.ins.ei.emp)}
          ${row(`健保（本人${r.ins.nhi.deps ? `＋眷屬 ${r.ins.nhi.deps} 人` : ""}）`, r.ins.nhi.emp)}
          ${row(`勞退自提 ${r.ins.pen.pct}%`, r.ins.pen.emp)}
          ${row(five ? "所得稅預扣（月薪 5%）" : "所得稅預扣（扣繳稅額表）", r.salaryTax)}
          ${row("獎金預扣所得稅 5%", r.bonusTax)}
          ${row("二代健保補充保費 2.11%", r.supp)}
          ${row("其他扣款", r.other)}
          <dt class="sum">扣款合計</dt><dd class="sum">−${money(r.deduct)}</dd>
        </dl>
        ${r.needTable ? `<div class="warn">月薪達 90,501 元以上，依扣繳稅額表會預扣所得稅，金額要看你的扶養人數。請在上方填入薪資單上的「所得稅」金額，或改選「按 5% 扣繳」估算。</div>` : ""}
        ${!five && !r.needTable && !r.salaryTax ? `<div class="note">月薪未達扣繳稅額表的起扣標準（無扶養 90,501 元），每月不會預扣所得稅。</div>` : ""}
        ${five && !r.salaryTax ? `<div class="note">按 5% 計算的稅額不超過 2,000 元，依規定免予扣繳。</div>` : ""}
        ${r.supp ? `<div class="note">今年獎金累計超過健保投保金額 4 倍（${money(r.cap)} 元）的部分 ${money(r.suppBase)} 元，要扣 2.11% 補充保費。</div>` : ""}
        ${num(f.overtime) ? `<div class="note">加班費每月 46 小時以內免稅，不會預扣所得稅，也不計入勞健保投保薪資。</div>` : ""}
        <div class="note">預扣的所得稅不是最後的稅額，明年 5 月報稅時會多退少補。想算全年要繳多少稅，可以用<a href="/tools/income-tax/">所得稅試算</a>。</div>`;
      save("payForm", ids.map(k => f[k].value).concat(f.noEI.checked));
    }
    const s = load("payForm"); if(s){ ids.forEach((k,i) => { if(s[i] != null) f[k].value = s[i]; }); f.noEI.checked = !!s[ids.length]; }
    pay.addEventListener("input", run); pay.addEventListener("change", run); pay.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 資遣費 ----
  const sev = $('form[data-tool="severance"]');
  if(sev){
    const f = sev.elements, out = $("#sevOut");
    const ids = ["hire","leave","avg","scheme","switchDate"];
    const tn = x => `${x.y} 年 ${x.m} 個月 ${x.d} 天`;
    function run(){
      $("#switchWrap").hidden = f.scheme.value !== "mixed";
      const hire = parseDate(f.hire.value), leave = parseDate(f.leave.value), avg = num(f.avg);
      save("sevForm", ids.map(k => f[k].value).concat(f.noNotice.checked));
      if(!hire || !leave || !avg){ out.innerHTML = `<div class="note">輸入到職日、離職日和月平均工資，就會算出資遣費。</div>`; return; }
      const r = C.severance({hire, leave, avg, scheme:f.scheme.value, switchDate:parseDate(f.switchDate.value)});
      if(r.invalid){ out.innerHTML = `<div class="warn">離職日要在到職日之後。</div>`; return; }
      const mixed = f.scheme.value === "mixed", isOld = f.scheme.value === "old", isNew = f.scheme.value === "new";
      const notice = f.noNotice.checked ? r.noticePay : 0;
      out.innerHTML = `
        <div>資遣費</div>
        <div class="big">${money(r.amount)} <small>元</small></div>
        <dl class="kv">
          <dt>總年資</dt><dd>${tn(r.total)}</dd>
          ${!isNew ? `<dt>舊制年資 ${tn(r.old)}</dt><dd>${(Math.round(r.old.units*1000)/1000)} 個月 → ${money(r.old.pay)}</dd>` : ""}
          ${!isOld ? `<dt>新制年資 ${tn(r.neu)}</dt><dd>${(Math.round(r.neu.units*1000)/1000)} 個月 → ${money(r.neu.pay)}</dd>` : ""}
          ${notice ? `<dt>預告期間工資 ${r.noticeDays} 天（估算）</dt><dd>${money(notice)}</dd>
          <dt class="sum">合計</dt><dd class="sum">${money(r.amount + notice)}</dd>` : ""}
        </dl>
        ${r.neu.capped ? `<div class="note">新制資遣費最高 6 個月平均工資。你的新制年資算出來是 ${Math.round(r.neu.raw*100)/100} 個月，以 6 個月為上限。</div>` : ""}
        ${r.noticeDays ? `<div class="note">依年資，公司要在 <b>${r.noticeDays} 天前</b>預告；沒有預告，要另外給付這 ${r.noticeDays} 天的工資。${notice ? "上方預告工資用月平均工資 ÷ 30 估算。" : "如果公司當天才通知，可以勾選「公司沒有提前預告」一起計算。"}</div>` : `<div class="note">年資未滿 3 個月，公司不用提前預告，但仍要給資遣費。</div>`}
        ${isNew && hire < C.SEV115.newSince ? `<div class="warn">你在 2005 年 7 月 1 日以前到職。如果選新制時有保留舊制年資，請改選「新舊制併用」，舊制那段年資每年算 1 個月，金額通常比較高。</div>` : ""}
        ${!isNew && hire >= C.SEV115.newSince ? `<div class="warn">2005 年 7 月 1 日以後到職的本國勞工一律適用新制，請改選「新制」。</div>` : ""}
        <div class="note">資遣費屬於退職所得。115 年領取時，年資 ${r.taxYears} 年的免稅額度是 ${money(r.free1)} 元${r.taxable ? `，超過的部分要課稅，估計應計入所得的金額約 ${money(r.taxable)} 元` : "，這筆資遣費<b>全額免稅</b>"}。</div>`;
    }
    const s = load("sevForm"); if(s){ ids.forEach((k,i) => { if(s[i] != null) f[k].value = s[i]; }); f.noNotice.checked = !!s[ids.length]; }
    sev.addEventListener("input", run); sev.addEventListener("change", run); sev.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 勞退退休金 ----
  const pen = $('form[data-tool="pension"]');
  if(pen){
    const f = pen.elements, out = $("#penOut");
    const ids = ["age","claimAge","salary","balance","years","selfPct","erPct","growth","ret"];
    const dec = el => +String(el.value).replace(/,/g,"") || 0;
    const wan = v => (Math.round(v/1000)/10).toLocaleString("zh-TW");
    // 累積曲線（SVG）：每條線是一種報酬率
    function chart(series, age){
      const W = 320, H = 150, L = 50, B = 20, all = series.flatMap(s => s.pts.map(p => p[1]));
      const max = Math.max(1, ...all), x0 = age, x1 = series[0].pts[series[0].pts.length-1][0];
      const X = a => L + (W - L - 8) * (x1 === x0 ? 1 : (a - x0)/(x1 - x0)), Y = v => 8 + (H - B - 8) * (1 - v/max);
      const lines = series.map(s => `<polyline fill="none" stroke="${s.color}" stroke-width="${s.bold ? 2.5 : 1.5}" ${s.bold ? "" : 'stroke-dasharray="4 3"'} points="${s.pts.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(" ")}"/>`).join("");
      const ticks = [0, .5, 1].map(t => `<text x="${L-4}" y="${Y(max*t)+4}" text-anchor="end">${wan(max*t)}萬</text>`).join("");
      return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="不同報酬率的專戶累積曲線" style="max-width:520px;font-size:10px;fill:var(--muted)">
        <line x1="${L}" y1="${H-B}" x2="${W-8}" y2="${H-B}" stroke="var(--rule)"/>${ticks}
        <text x="${L}" y="${H-4}">${x0} 歲</text><text x="${W-8}" y="${H-4}" text-anchor="end">${x1} 歲</text>${lines}</svg>
        <div class="note">${series.map(s => `<span style="color:${s.color}">━</span> ${s.label}`).join("　")}</div>`;
    }
    function run(){
      save("penForm", ids.map(k => f[k].value));
      const age = num(f.age), salary = num(f.salary);
      if(!age || !salary){ out.innerHTML = `<div class="note">輸入目前年齡和月薪，就會算出退休時勞退專戶大約有多少錢。</div>`; return; }
      const claim = +f.claimAge.value;
      const base = {age, claimAge:claim, salary, balance:num(f.balance), years:num(f.years), selfPct:num(f.selfPct), erPct:num(f.erPct), growth:dec(f.growth), ret:dec(f.ret)};
      const r = C.pension(base);
      const self = num(f.selfPct), bal0 = num(f.balance);
      const mon = (x, txt) => x.canMonthly ? money(x.monthly) : txt;
      // 不同報酬率
      const rets = [1, 3, 5]; if(!rets.includes(base.ret)) rets.push(base.ret); rets.sort((a,b) => a-b);
      const byRet = rets.map(v => ({v, x: C.pension({...base, ret:v})}));
      const colors = {1:"var(--muted)", 3:"var(--leave)", 5:"var(--makeup)"};
      const series = byRet.filter(o => [1,3,5].includes(o.v)).map(o => ({label:`報酬率 ${o.v}%`, color:colors[o.v], bold:o.v === base.ret,
        pts:[[age, bal0], ...o.x.rows.map(row => [row.age+1, row.bal])]}));
      // 不同自提比例
      const selfRows = [0, 1, 3, 6].map(p => {
        const x = C.pension({...base, selfPct:p}), m = x.rows.length ? x.rows[0].cSelf : 0;
        return `<tr><td>${p}%${p === self ? "（目前）" : ""}</td><td class="num">${money(m)}</td><td class="num">${money(m*12)}</td><td class="num">${money(m*12*.05)}～${money(m*12*.12)}</td><td class="num">${p ? "+" + money(x.total - x.noSelf) : "—"}</td><td class="num">${mon(x, "一次領")}</td></tr>`;
      }).join("");
      const opened = [...out.querySelectorAll("details")].map(d => d.open);
      out.innerHTML = `
        <div>${r.claim} 歲時，勞退專戶預估累積</div>
        <div class="big">${money(r.total)} <small>元（約 ${wan(r.total)} 萬）</small></div>
        <dl class="kv">
          ${bal0 ? `<dt>目前已累積</dt><dd>${money(bal0)}</dd>` : ""}
          ${r.years ? `<dt>雇主提繳本金（${r.years} 年）</dt><dd>${money(r.er)}</dd>` : ""}
          ${r.self ? `<dt>個人自提本金</dt><dd>${money(r.self)}</dd>` : ""}
          ${r.years ? `<dt>預估投資收益</dt><dd>${money(r.gain)}</dd>` : ""}
          <dt class="sum">${r.canMonthly ? "預估月退休金" : "請領方式"}</dt><dd class="sum">${r.canMonthly ? `每月約 ${money(r.monthly)}` : "只能一次領"}</dd>
        </dl>
        ${r.canMonthly ? `<div class="note">依 ${r.claim} 歲平均餘命估算，預計給付期間約 <b>${r.T} 年</b>，並非保證領到 ${r.endAge} 歲；給付期間合計約 ${money(r.monthly*12*r.T)} 元（含期間收益）。月退休金每季發給，專戶領完即停止，利率調整時會重新計算；過世時專戶剩餘金額由遺屬或指定請領人領回。也可以選擇一次領 ${money(r.total)} 元。</div>`
          : `<div class="warn">請領時提繳年資約 ${r.contribYears} 年，未滿 15 年，只能一次領取。</div>`}
        ${age >= claim ? `<div class="note">你已經達到請領年齡，上方金額就是目前的專戶累積。</div>` : ""}
        <div class="note">月提繳工資 ${money(r.firstGrade)} 元：依月薪對照勞退月提繳分級表，可能和實際月薪不同。報酬率 ${dec(f.ret)}% 是模擬用的年化報酬率，<b>不是勞退基金保證報酬</b>，也不代表未來實際收益。</div>
        ${r.years ? `<details><summary>比較不同報酬率</summary>
          ${chart(series, age)}
          <div class="tbl"><table><thead><tr><th>年化報酬率</th><th>${r.claim} 歲累積</th><th>月退休金</th></tr></thead><tbody>
          ${byRet.map(o => `<tr><td>${o.v}%${o.v === base.ret ? "（目前）" : ""}</td><td class="num">${wan(o.x.total)} 萬</td><td class="num">${mon(o.x, "只能一次領")}</td></tr>`).join("")}
          </tbody></table></div></details>
        <details><summary>自提划不划算？比較 0%、1%、3%、6%</summary>
          <div class="tbl"><table><thead><tr><th>自提</th><th>每月少領</th><th>今年投入</th><th>今年節稅（稅率 5%～12%）</th><th>退休時增加</th><th>月退休金</th></tr></thead><tbody>${selfRows}</tbody></table></div>
          <div class="note">自提金額可以從當年度薪資所得中減除，實際節稅效果取決於你的所得和適用稅率；免稅或稅率 5% 的人省得比較少。自提的錢要到 60 歲才能領。</div></details>` : ""}`;
      out.querySelectorAll("details").forEach((d, i) => { if(opened[i]) d.open = true; });
    }
    const s = load("penForm"); if(s){ ids.forEach((k,i) => { if(s[i] != null && s[i] !== "") f[k].value = s[i]; }); }
    const reset = $("#penReset");
    if(reset) reset.addEventListener("click", () => { pen.reset(); try{ localStorage.removeItem("penForm"); }catch(e){} run(); });
    pen.addEventListener("input", run); pen.addEventListener("change", run); pen.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 勞保老年年金（＋勞退）----
  const lo = $('form[data-tool="labor-old-age"]');
  if(lo){
    const f = lo.elements, out = $("#loOut");
    const ids = ["birth","age","years","salary","avg","claimAge","penBalance","penYears","selfPct"];
    const dec = el => Math.max(0, +String(el.value).replace(/,/g,"") || 0);
    const rocNow = new Date().getFullYear() - 1911;
    const yr = v => Math.round(v*10)/10;
    function run(){
      save("loForm", ids.map(k => f[k].value).concat(f.working.checked, f.pre98.checked));
      const birth = num(f.birth), salary = num(f.salary), avg = num(f.avg);
      const age = num(f.age) || (birth ? rocNow - birth : 0);
      if(!birth || !age || (!salary && !avg)){ out.innerHTML = `<div class="note">輸入出生年次、勞保年資和月薪，就會算出勞保老年年金每月大約領多少。</div>`; return; }
      const claim = +f.claimAge.value;
      const r = C.laborOldAge({birth, age, years:dec(f.years), salary, avg, claimAge:claim, working:f.working.checked, pre98:f.pre98.checked});
      const pct = Math.round(r.adj*100);
      const adjTxt = r.adjYears < 0 ? `提前 ${-r.adjYears} 年，減給 ${-pct}%` : r.adjYears > 0 ? `延後 ${r.adjYears} 年，增給 ${pct}%` : "法定年齡請領，不增減";
      // 勞退：至少 60 歲才能領
      const penClaim = Math.max(60, claim), hasPen = salary > 0;
      const p = hasPen ? C.pension({age, claimAge:penClaim, salary, balance:num(f.penBalance), years:num(f.penYears), selfPct:num(f.selfPct), growth:1.44, ret:3}) : null;
      let head, warn = "";
      if(r.tooEarly){
        head = `<div>${claim} 歲還不能請領</div><div class="big">— </div>`;
        warn = r.annuityOk ? `<div class="warn">你的法定請領年齡是 ${r.legal} 歲，最多只能提前 5 年，也就是 ${r.legal - 5} 歲起才能請領。</div>`
          : `<div class="warn">請領時勞保年資約 ${yr(r.years)} 年，未滿 15 年只能領老年一次金，而且不能提前，要等到 ${r.legal} 歲。</div>`;
      } else if(!r.annuityOk){
        head = `<div>勞保年資未滿 15 年，可領老年一次金</div><div class="big">${money(r.lump)} <small>元（一次領）</small></div>`;
        warn = `<div class="warn">請領時勞保年資約 ${yr(r.years)} 年，未滿 15 年不能領年金。再加保約 ${yr(15 - r.years)} 年達到 15 年，就能改領終身年金。</div>`;
      } else {
        head = `<div>${claim} 歲起，勞保老年年金每月約</div><div class="big">${money(r.monthly)} <small>元（終身）</small></div>`;
      }
      const combo = p && r.monthly && !p.total ? `<div class="note">填入勞退專戶目前累積和已提繳年資，就能一起估算退休後每月收入。</div>`
        : p && r.monthly ? (() => {
        const pm = p.canMonthly ? p.monthly : 0;
        return `<div class="note" style="margin-top:12px"><b>加上勞退，退休後每月收入</b></div>
        <dl class="kv">
          <dt>勞保老年年金（${claim} 歲起，終身）</dt><dd>${money(r.monthly)}</dd>
          <dt>勞退月退休金（${penClaim} 歲起，約 ${p.T} 年）</dt><dd>${p.canMonthly ? money(pm) : "年資未滿 15 年，只能一次領 " + money(p.total)}</dd>
          ${pm ? `<dt class="sum">每月合計</dt><dd class="sum">${money(r.monthly + pm)}</dd>` : ""}
        </dl>
        <div class="note">勞退以雇主提繳 6%${num(f.selfPct) ? `、自提 ${num(f.selfPct)}%` : ""}、薪資年成長 1.44%、模擬報酬率 3%（不是保證報酬）估算，${penClaim} 歲時專戶約 ${money(p.total)} 元。${!p.canMonthly && !num(f.penYears) ? "如果你已經提繳勞退多年，請填入已提繳年資，滿 15 年才能月領。" : ""}勞退月退休金依平均餘命估算給付期間，並非保證領到幾歲，專戶領完即停止；勞保年金則是終身。</div>`;
      })() : "";
      const one = r.oneTime && !r.tooEarly ? `<details><summary>月領還是一次領？</summary>
        <dl class="kv">
          <dt>一次請領老年給付（${r.months} 個月）</dt><dd>${money(r.oneTime)}</dd>
          ${r.monthly ? `<dt>回本年數（一次金 ÷ 每年年金）</dt><dd>約 ${r.breakEven.toFixed(1)} 年</dd>` : ""}
        </dl>
        <div class="note">一次請領的平均月投保薪資是退保前 3 年平均，這裡用你填的投保薪資估算。${r.monthly ? `月領 ${claim} 歲起領超過約 ${r.breakEven.toFixed(1)} 年（${Math.floor(claim + r.breakEven)} 歲左右），總額就會超過一次領，而且年金會隨物價調整。` : ""}選擇後不能更改。</div></details>` : "";
      const opened = [...out.querySelectorAll("details")].map(d => d.open);
      out.innerHTML = `${head}
        <dl class="kv">
          <dt>法定請領年齡（${birth} 年次）</dt><dd>${r.legal} 歲</dd>
          <dt>請領時勞保年資</dt><dd>約 ${yr(r.years)} 年${r.add ? `（再加保 ${r.add} 年）` : ""}</dd>
          <dt>平均月投保薪資${avg ? "" : "（依月薪推算）"}</dt><dd>${money(r.grade)}</dd>
          ${r.annuityOk ? `<dt>A 式：× 年資 × 0.775% ＋ 3,000</dt><dd>${money(r.A)}${r.formula === "A" ? "（較高）" : ""}</dd>
          <dt>B 式：× 年資 × 1.55%</dt><dd>${money(r.B)}${r.formula === "B" ? "（較高）" : ""}</dd>
          <dt>請領時間</dt><dd>${adjTxt}</dd>` : ""}
        </dl>${warn}${combo}${one}
        ${r.annuityOk && !r.tooEarly && r.diff !== 0 ? (() => {
          const L = C.laborOldAge({birth, age, years:dec(f.years), salary, avg, claimAge:Math.max(age, r.legal), working:f.working.checked});
          return L.monthly ? `<div class="note">提前或延後的增減比例終身適用。改在 ${Math.max(age, r.legal)} 歲請領${L.adjYears ? "" : "（法定年齡，不增減）"}，每月約 ${money(L.monthly)} 元。</div>` : "";
        })() : ""}
        <div class="note">依公式計算的估算值，不含日後物價調整；實際金額以勞保局核定為準。</div>`;
      out.querySelectorAll("details").forEach((d, i) => { if(opened[i]) d.open = true; });
    }
    const s = load("loForm");
    if(s){ ids.forEach((k,i) => { if(s[i] != null && s[i] !== "") f[k].value = s[i]; }); f.working.checked = s[ids.length] !== false; f.pre98.checked = !!s[ids.length+1]; }
    const reset = $("#loReset");
    if(reset) reset.addEventListener("click", () => { lo.reset(); try{ localStorage.removeItem("loForm"); }catch(e){} run(); });
    lo.addEventListener("input", run); lo.addEventListener("change", run); lo.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 貸款 ----
  const ln = $('form[data-tool="loan"]');
  if(ln){
    const f = ln.elements, out = $("#loanOut");
    const ids = ["amount","rate","years","grace","method","c1m","c1r","c2m","c2r","c3m","c3r","pm","pa","pen","fee1","fee2","fee3","feeM"];
    // 解析輸入：空白回傳 null，非數字回傳 NaN，可含千分位逗號
    const val = el => { const t = String(el.value).replace(/[,\s]/g,""); return t === "" ? null : Number(t); };
    const pct = v => `${Math.round(v*1000)/1000}%`;
    const ym = m => m % 12 ? `${Math.floor(m/12) ? Math.floor(m/12)+" 年 " : ""}${m % 12} 個月` : `${m/12} 年`;
    let last = null;
    function bad(msg){ out.innerHTML = `<div class="warn">${msg}</div>`; last = null; }
    function chart(series){
      const W = 320, H = 140, max = series[0].pts[0], n = Math.max(...series.map(s => s.pts.length - 1));
      const line = s => s.pts.map((v, j) => `${j ? "L" : "M"}${(j/n*W).toFixed(1)},${(H - v/max*H).toFixed(1)}`).join("");
      return `<figure style="margin:0"><svg viewBox="-2 -4 ${W+4} ${H+8}" style="width:100%;height:auto;max-width:520px" role="img" aria-label="剩餘本金逐年變化">
        <line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="var(--rule)"/>
        ${series.map(s => `<path d="${line(s)}" fill="none" stroke="${s.color}" stroke-width="2.5"${s.dash ? ' stroke-dasharray="5 4"' : ""}/>`).join("")}
      </svg><figcaption class="note">剩餘本金逐年變化（${n} 年）：${series.map(s => `<span style="color:${s.color}">━</span> ${s.name}`).join("　")}</figcaption></figure>`;
    }
    function run(){
      save("loanForm", ids.map(k => f[k].value));
      const A = val(f.amount), R = val(f.rate), Y = val(f.years), G = val(f.grace) ?? 0, method = f.method.value;
      if(A === null || R === null || Y === null){ out.innerHTML = `<div class="note">輸入貸款金額、年利率和貸款總年限，就會算出每月要繳多少。</div>`; last = null; return; }
      if(isNaN(A) || A <= 0) return bad("貸款金額要填大於 0 的數字（單位：萬元）。");
      if(isNaN(R)) return bad("年利率要填數字，例如 2.2。");
      if(R < 0) return bad("年利率不能是負數；無息貸款請填 0。");
      if(R > 30) return bad("年利率超過 30%，請確認是不是填錯了（例如 2.2% 請填 2.2）。");
      if(isNaN(Y)) return bad("貸款總年限要填數字。");
      if(Y <= 0) return bad("貸款總年限要大於 0。");
      if(Y > 40) return bad("貸款總年限最長填 40 年。");
      if(isNaN(G) || G < 0) return bad("寬限期不能是負數，沒有寬限期請填 0。");
      if(G >= Y) return bad("寬限期要比貸款總年限短。貸款總年限包含寬限期，例如 30 年、寬限期 3 年。");
      const amount = A*10000, n = Math.round(Y*12), g = Math.round(G*12);
      if(n < 1) return bad("貸款總年限太短，至少要 1 個月。");
      const notes = [];
      if(n !== Y*12 || g !== G*12) notes.push(`年限以月為單位計算：${Y} 年換算成 ${n} 期${G ? `，寬限期 ${g} 期` : ""}（四捨五入到整月）。`);
      // 利率變動
      const changes = [];
      [["c1m","c1r"],["c2m","c2r"],["c3m","c3r"]].forEach(([m, r], j) => {
        const M = val(f[m]), Rr = val(f[r]);
        if(M === null && Rr === null) return;
        if(M === null || Rr === null || isNaN(M) || isNaN(Rr) || M < 2 || M > n || M % 1 || Rr < 0 || Rr > 30)
          notes.push(`<span class="warn">利率變動第 ${j+1} 列沒有計入：月份要填 2～${n} 的整數，利率要填 0～30。</span>`);
        else changes.push({from:M, rate:Rr});
      });
      // 提前還款
      const PM = val(f.pm), PA = val(f.pa), PEN = val(f.pen) ?? 0;
      let prepay = null;
      if(PM !== null || PA !== null){
        if(PM === null || PA === null || isNaN(PM) || isNaN(PA) || PM < 1 || PM >= n || PM % 1 || PA <= 0)
          notes.push(`<span class="warn">提前還款沒有計入：月份要填 1～${n-1} 的整數，金額要大於 0。</span>`);
        else prepay = {month:PM, amount:PA*10000};
      }
      // 費用
      const fee = k => { const v = val(f[k]); return v === null || isNaN(v) || v < 0 ? 0 : v; };
      const upfront = fee("fee1") + fee("fee2") + fee("fee3"), monthlyFee = fee("feeM");

      const r = C.loan({amount, rate:R, years:Y, grace:G, method, changes});
      const other = C.loan({amount, rate:R, years:Y, grace:G, method: method === "pmt" ? "principal" : "pmt", changes});
      const fees = upfront + monthlyFee*r.months;
      const apr = C.loanApr({amount, rows:r.rows, upfront, monthlyFee});
      const prin = amount, intr = r.totalInt, share = intr/(prin+intr)*100;
      const yearBal = rows => [amount].concat(rows.filter((x, j) => (j+1) % 12 === 0 || j === rows.length-1).map(x => x.bal));

      let prepayHtml = "", series = [{name:"原本", color:"var(--leave)", pts:yearBal(r.rows)}];
      if(prepay){
        const red = C.loan({amount, rate:R, years:Y, grace:G, method, changes, prepay:{...prepay, mode:"reduce"}});
        const sh = C.loan({amount, rate:R, years:Y, grace:G, method, changes, prepay:{...prepay, mode:"shorten"}});
        const penalty = Math.round(red.prepaid*PEN/100), inGrace = prepay.month <= g;
        const after = x => x.rows[prepay.month] ? x.rows[prepay.month].pay : 0;
        series.push({name:"提前還款・縮短年限", color:"var(--makeup)", pts:yearBal(sh.rows), dash:true});
        prepayHtml = `
        <h3 style="margin:8px 0 0">第 ${prepay.month} 期後提前還 ${money(red.prepaid)} 元</h3>
        <div class="tbl"><table>
          <thead><tr><th></th><th>縮短年限<br><small>月付金不變</small></th><th>降低月付金<br><small>年限不變</small></th></tr></thead>
          <tbody>
            <tr><td>之後每月</td><td class="num">${money(after(sh))}</td><td class="num">${money(after(red))}</td></tr>
            <tr><td>還清時間</td><td class="num">${ym(sh.months)}<br><small>第 ${sh.months} 期</small></td><td class="num">${ym(red.months)}<br><small>第 ${red.months} 期</small></td></tr>
            <tr><td>總利息</td><td class="num">${money(sh.totalInt)}</td><td class="num">${money(red.totalInt)}</td></tr>
            <tr><td>省下利息</td><td class="num"><b>${money(r.totalInt - sh.totalInt)}</b></td><td class="num"><b>${money(r.totalInt - red.totalInt)}</b></td></tr>
            ${penalty ? `<tr><td>扣掉違約金 ${money(penalty)} 後</td><td class="num">${money(r.totalInt - sh.totalInt - penalty)}</td><td class="num">${money(r.totalInt - red.totalInt - penalty)}</td></tr>` : ""}
          </tbody></table></div>
        <div class="note">${red.prepaid < prepay.amount ? "提前還款金額已超過剩餘本金，等於一次還清。" : inGrace ? "提前還款在寬限期內，寬限期結束後會用剩下的本金重新計算月付金，兩種方式結果相同。" : `<b>縮短年限</b>省下的利息比較多，提早 ${ym(red.months - sh.months)} 還完；<b>降低月付金</b>每月少繳 ${money(after(sh) - after(red))} 元，資金比較寬裕。`}要選哪一種、要不要另外申請，請先問銀行。${PEN ? "" : "部分貸款在綁約期內提前清償要付違約金，可以在上方填入違約金比例一起計算。"}</div>`;
      }

      const head = r.g ? "寬限期後每月還款" : method === "pmt" ? (changes.length ? "第 1 期每月還款" : "每月還款") : "第 1 個月還款";
      const changeKv = changes.map(c => { const row = r.rows[c.from-1]; return row ? `<dt>第 ${c.from} 期起利率 ${pct(c.rate)}，每月</dt><dd>${money(row.pay)}</dd>` : ""; }).join("");
      const opened = [...out.querySelectorAll("details")].map(d => d.open);
      out.innerHTML = `
        <div>${head}</div>
        <div class="big">${money(r.firstPay)} <small>元</small></div>
        <dl class="kv">
          ${r.g ? `<dt>寬限期 ${ym(r.g)}（只繳利息）</dt><dd>${money(r.gracePay)}</dd>` : ""}
          ${changeKv}
          ${method === "principal" ? `<dt>最後 1 期還款</dt><dd>${money(r.lastPay)}</dd>` : ""}
          <dt>還款期數</dt><dd>${r.months} 期（${ym(r.months)}）</dd>
          <dt>總利息</dt><dd>${money(r.totalInt)}</dd>
          ${fees ? `<dt>貸款相關費用</dt><dd>${money(fees)}</dd>` : ""}
          <dt class="sum">總還款金額</dt><dd class="sum">${money(r.total + fees)}</dd>
          ${fees ? `<dt class="sum">總費用年百分率</dt><dd class="sum">${pct(Math.round(apr*100)/100)}</dd>` : ""}
        </dl>
        ${fees ? `<div class="note">名目利率 ${pct(R)}，加上 ${money(fees)} 元費用後，實際借款成本換算成年利率約 ${pct(Math.round(apr*100)/100)}。比較不同銀行時，請看總費用年百分率和總還款金額，不要只看利率。</div>` : `<div class="note">信貸常有開辦費、帳戶管理費，可以在「貸款費用」填入，算出總費用年百分率。</div>`}
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div style="width:86px;height:86px;border-radius:50%;background:conic-gradient(var(--makeup) 0 ${share}%, var(--leave) 0);display:grid;place-items:center" aria-hidden="true"><div style="width:52px;height:52px;border-radius:50%;background:var(--sheet)"></div></div>
          <div style="font-size:.9rem"><span style="color:var(--leave)">●</span> 本金 ${money(prin)}（${Math.round(100-share)}%）<br><span style="color:var(--makeup)">●</span> 利息 ${money(intr)}（${Math.round(share)}%）</div>
        </div>
        ${prepayHtml}
        ${chart(series)}
        <div class="note">改用「${method === "pmt" ? "本金平均攤還" : "本息平均攤還"}」：${method === "pmt" ? `第 1 期 ${money(other.firstPay)} 元，總利息 ${money(other.totalInt)} 元（少 ${money(r.totalInt - other.totalInt)} 元）` : `每月 ${money(other.firstPay)} 元，總利息 ${money(other.totalInt)} 元（多 ${money(other.totalInt - r.totalInt)} 元）`}。</div>
        ${r.g ? `<div class="note">寬限期內本金完全沒減少，之後只剩 ${ym(r.m)} 可以攤還，月付金會變高，總利息也比較多。不用寬限期的總利息是 ${money(C.loan({amount, rate:R, years:Y, method, changes}).totalInt)} 元。</div>` : ""}
        ${notes.map(t => `<div class="note">${t}</div>`).join("")}
        <details data-k="y"><summary>逐年還款明細</summary><div class="tbl" data-body="y"></div></details>
        <details data-k="m"><summary>逐月還款明細（${r.months} 期）</summary><div class="tbl" data-body="m"></div></details>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="copy" id="loanCopy" style="padding:8px 12px">複製試算結果</button>
          <button type="button" class="copy" id="loanCsv" style="padding:8px 12px">下載逐月明細 CSV</button>
        </div>
        <div class="note">${changes.length ? "利率變動時，依當時的剩餘本金和剩餘期數重新計算月付金。" : "假設利率全期不變。"}金額以元為單位四捨五入顯示，實際月付金依銀行計算方式、利率調整與相關費用而定。</div>`;
      last = {r, R, Y, G, method, fees, apr, amount};
      out.querySelectorAll("details").forEach((d, i) => { d.addEventListener("toggle", () => fillTable(d)); if(opened[i]){ d.open = true; fillTable(d); } });
    }
    function fillTable(d){
      if(!d.open || !last) return;
      const body = d.querySelector("[data-body]"), rows = last.r.rows;
      if(d.dataset.k === "m"){
        body.innerHTML = `<table><thead><tr><th>期數</th><th>年利率</th><th>償還本金</th><th>償還利息</th><th>當期繳款</th><th>剩餘本金</th></tr></thead><tbody>${rows.map(x => `<tr><td>第 ${x.k} 期</td><td class="num">${pct(x.rate)}</td><td class="num">${money(x.prin)}</td><td class="num">${money(x.int)}</td><td class="num">${money(x.pay)}</td><td class="num">${money(x.bal)}</td></tr>`).join("")}</tbody></table>`;
      } else {
        const ys = [];
        for(let y = 1; (y-1)*12 < rows.length; y++){
          const part = rows.slice((y-1)*12, y*12);
          ys.push(`<tr><td>第 ${y} 年</td><td class="num">${money(part.reduce((a,x)=>a+x.pay,0))}</td><td class="num">${money(part.reduce((a,x)=>a+x.prin,0))}</td><td class="num">${money(part.reduce((a,x)=>a+x.int,0))}</td><td class="num">${money(part[part.length-1].bal)}</td></tr>`);
        }
        body.innerHTML = `<table><thead><tr><th>年度</th><th>當年繳款</th><th>本金</th><th>利息</th><th>剩餘本金</th></tr></thead><tbody>${ys.join("")}</tbody></table>`;
      }
    }
    out.addEventListener("click", e => {
      if(!last) return;
      const {r, R, Y, G, method, fees, apr, amount} = last;
      if(e.target.id === "loanCopy"){
        const text = [`貸款金額：${money(amount)} 元`, `年利率：${R}%`, `貸款總年限：${Y} 年${G ? `（含寬限期 ${G} 年）` : ""}`,
          `還款方式：${method === "pmt" ? "本息平均攤還" : "本金平均攤還"}`, `${r.g ? "寬限期後" : "第 1 期"}每月還款：${money(r.firstPay)} 元`,
          `總利息：${money(r.totalInt)} 元`, fees ? `貸款相關費用：${money(fees)} 元` : "", `總還款金額：${money(r.total + fees)} 元`,
          fees ? `總費用年百分率：約 ${Math.round(apr*100)/100}%` : "", `試算來源：${location.href}`].filter(Boolean).join("\n");
        const b = e.target, done = () => { b.textContent = "已複製"; setTimeout(() => b.textContent = "複製試算結果", 1500); };
        if(navigator.clipboard) navigator.clipboard.writeText(text).then(done, () => {});
      }
      if(e.target.id === "loanCsv"){
        const csv = "﻿期數,年利率(%),償還本金,償還利息,當期繳款,剩餘本金\n" + r.rows.map(x => [x.k, x.rate, Math.round(x.prin), Math.round(x.int), Math.round(x.pay), Math.round(x.bal)].join(",")).join("\n");
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
        a.download = `貸款還款明細_${Math.round(amount/10000)}萬_${R}%_${Y}年.csv`;
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
      }
    });
    const s = load("loanForm"); if(s){ ids.forEach((k,i) => { if(s[i] != null && s[i] !== "" && f[k]) f[k].value = s[i]; }); }
    ln.addEventListener("input", run); ln.addEventListener("change", run); ln.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 存款利息 ----
  const dp = $('form[data-tool="deposit"]');
  if(dp){
    const f = dp.elements, out = $("#depOut");
    const ids = ["amount","rate","months","mode","timing"];
    const dec = el => Math.max(0, parseFloat(String(el.value).replace(/,/g,"")) || 0);
    function run(){
      save("depForm", ids.map(k => f[k].value));
      const mode = f.mode.value, amount = num(f.amount), rate = dec(f.rate), months = Math.min(600, Math.round(dec(f.months)));
      $("#depAmtLabel").firstChild.textContent = mode === "monthly" ? "每月存入金額（元）" : "存款金額（元）";
      $("#depTiming").hidden = mode !== "monthly";
      const timing = f.timing.value;
      if(!amount || !rate || !months){ out.innerHTML = `<div class="note">輸入存款金額、年利率和存款期間，就會算出利息。</div>`; return; }
      const r = C.deposit({amount, rate, months, mode, timing});
      out.innerHTML = `
        <div>${mode === "payout" ? "每月領到利息" : "到期利息"}</div>
        <div class="big">${money(mode === "payout" ? r.monthlyPay : r.interest)} <small>元</small></div>
        <dl class="kv">
          <dt>${mode === "monthly" ? `本金（${money(amount)} × ${months} 個月）` : "本金"}</dt><dd>${money(r.principal)}</dd>
          <dt>${months} 個月利息合計</dt><dd>${money(r.interest)}</dd>
          <dt class="sum">${mode === "payout" ? "到期領回本金" : "到期本利和"}</dt><dd class="sum">${money(mode === "payout" ? r.principal : r.total)}</dd>
        </dl>
        ${mode === "monthly" ? `<div class="note">假設每月${timing === "end" ? "月底" : "月初"}存入，${timing === "end" ? "最後一筆存入當月不計息" : "每筆從存入當月就開始計息"}。改成${timing === "end" ? "月初" : "月底"}存入，利息約 ${money(C.deposit({amount, rate, months, mode, timing: timing === "end" ? "begin" : "end"}).interest)} 元。</div>` : ""}
        ${r.nhi ? `<div class="warn">二代健保：單次領到的利息達 2 萬元，銀行會以<b>這次利息全額</b>扣 2.11% 補充保費，約 ${money(r.nhi)} 元${mode === "payout" ? `（每月扣一次，${months} 個月約 ${money(r.nhiTotal)} 元）` : ""}。</div>`
          : `<div class="note">二代健保：單次領到的利息未達 2 萬元，不扣補充保費。</div>`}
        ${r.single > C.DEP.withholdMin ? `<div class="warn">扣繳所得稅：單次給付超過 2 萬元，原則上按給付總額扣繳 10%，約 ${money(Math.round(r.single*C.DEP.withhold))} 元；如果已辦理儲蓄免扣證，在登記額度內可以免扣繳。扣繳只是預繳，實際稅負以綜合所得稅申報結果為準。</div>`
          : `<div class="note">扣繳所得稅：單次給付未超過 2 萬元，不用預先扣繳。</div>`}
        <div class="note">報稅：存款利息要併入綜合所得。納稅義務人、合併申報的配偶及受扶養親屬，符合規定的存款利息等所得，全年合計最高可扣除 27 萬元（儲蓄投資特別扣除額）${r.overSaving ? "；這筆利息已超過 27 萬，超過部分要依規定計稅" : ""}。這 27 萬和二代健保是不同制度，不能抵免補充保費。</div>
        <div class="note">本工具採月利率（年利率 ÷ 12）估算，整存整付、零存整付按月複利；實際銀行利息可能因計息天數、存入日期、利率調整及金額進位規則而不同。</div>`;
    }
    const s = load("depForm"); if(s){ ids.forEach((k,i) => { if(s[i] != null && s[i] !== "") f[k].value = s[i]; }); }
    dp.addEventListener("input", run); dp.addEventListener("change", run); dp.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }

  // ---- 匯率 ----
  const fx = $('form[data-tool="fx"]');
  if(fx){
    const f = fx.elements, out = $("#fxOut"), stat = $("#fxStatus");
    const cmp = $('form[data-tool="fxcmp"]'), card = $('form[data-tool="fxcard"]');
    const NAMES = {USD:"美元",JPY:"日圓",KRW:"韓元",EUR:"歐元",CNY:"人民幣",HKD:"港幣",GBP:"英鎊",AUD:"澳幣",SGD:"新加坡幣",THB:"泰銖",VND:"越南盾",MYR:"馬來西亞令吉",PHP:"菲律賓披索",CAD:"加幣",NZD:"紐西蘭幣",CHF:"瑞士法郎",IDR:"印尼盾"};
    // 沒有輔幣（實務上不用小數）的幣別
    const NODEC = new Set(["JPY","KRW","VND","IDR"]);
    // 內部全程不四捨五入，只在顯示時依幣別格式化
    const fmtC = (v, code) => v.toLocaleString("zh-TW", {maximumFractionDigits: code === "TWD" ? 2 : NODEC.has(code) ? 0 : 2});
    const fmtR = v => (+v.toPrecision(6)).toLocaleString("zh-TW", {maximumFractionDigits: 6});
    const dec = el => { const t = String(el.value).replace(/[,\s]/g,""); return t === "" ? null : Number(t); };
    const tpe = u => new Date(u*1000).toLocaleString("zh-TW", {timeZone:"Asia/Taipei", year:"numeric", month:"numeric", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:false});
    const KIND = {market:"市場參考匯率", cash:"銀行現金", spot:"銀行即期"};
    let data = load("fxRates"), state = data ? "cache" : "loading";
    const bank = load("fxBank") || {};
    const mid = c => data && data.rates && data.rates[c] ? 1/data.rates[c] : 0;

    function status(){
      if(!data){ stat.innerHTML = state === "loading" ? `<b>市場參考匯率</b>　正在取得資料…` : `<b>市場參考匯率</b>　<span class="warn">目前無法取得參考匯率</span><br>請把匯率類型改成「銀行現金」或「銀行即期」，自行輸入銀行牌告匯率。`; return; }
      const age = Date.now()/1000 - data.t, stale = age > 48*3600;
      const tag = stale ? `<span class="pill" style="background:var(--makeup);color:#fff">資料已超過 48 小時</span>`
        : state === "fail" ? `<span class="pill" style="background:var(--makeup);color:#fff">暫時無法更新</span>`
        : state === "cache" ? `<span class="pill">更新中…</span>` : `<span class="pill">資料正常</span>`;
      stat.innerHTML = `<b>市場參考匯率</b>　${tag}<br>
        匯率資料最後更新：${tpe(data.t)}（台灣時間）${data.next && !stale ? `　下次預計更新：${tpe(data.next)}` : ""}
        ${stale ? `<br><span class="warn">這份匯率已經超過 48 小時沒有更新，只能當作大概參考，換匯前請查銀行牌告。</span>` : state === "fail" ? `<br><span class="warn">目前連不上資料來源，以上是上次成功取得的資料。</span>` : ""}
        <br>資料來源：<a href="https://www.exchangerate-api.com" rel="noopener" target="_blank">Rates By Exchange Rate API</a> · 每日更新 · 非銀行即時牌告`;
    }
    function rateLabel(){
      const c = f.cur.value, k = f.kind.value, twd = f.dir.value === "to-twd";
      const side = k === "market" ? "" : twd ? "買入" : "賣出";
      return `${KIND[k]}${side}匯率（1 ${NAMES[c]} ＝ ? 新台幣）`;
    }
    const bankKey = () => `${f.cur.value}|${f.kind.value}|${f.dir.value}`;
    function syncRate(){
      const k = f.kind.value, m = mid(f.cur.value);
      $("#fxRateLabel").firstChild.textContent = rateLabel();
      f.rate.readOnly = k === "market";
      if(k === "market") f.rate.value = m ? +m.toPrecision(6) : "";
      else { f.rate.value = bank[bankKey()] || ""; f.rate.placeholder = m ? `市場參考約 ${fmtR(m)}，請填銀行牌告` : "請填銀行牌告匯率"; }
      $("#fxKindNote").textContent = k === "market" ? "使用國際市場參考匯率（中間價），適合初步估算；銀行實際換匯會再加上買賣價差。"
        : `請填銀行的「${k === "cash" ? "現金" : "即期"}${f.dir.value === "to-twd" ? "買入" : "賣出"}」匯率。${f.dir.value === "to-twd" ? "外幣換回台幣看銀行買入" : "用台幣買外幣看銀行賣出"}；${k === "cash" ? "現金是換實體鈔票，價差通常比即期大" : "即期用在外幣帳戶之間轉帳"}。`;
    }
    function run(){
      save("fxForm", [f.cur.value, f.dir.value, f.amount.value, f.kind.value]);
      const c = f.cur.value, k = f.kind.value, twd = f.dir.value === "to-twd";
      if(k !== "market") { const v = dec(f.rate); if(v) bank[bankKey()] = f.rate.value; else delete bank[bankKey()]; save("fxBank", bank); }
      const rate = dec(f.rate), amt = dec(f.amount), m = mid(c);
      if(!rate || isNaN(rate) || rate <= 0){ out.innerHTML = `<div class="note">${k === "market" ? (state === "loading" ? "正在取得參考匯率…" : "目前沒有參考匯率，請改用銀行匯率並自行輸入。") : "請在上方填入銀行牌告匯率。"}</div>`; runAll(); return; }
      if(amt === null || isNaN(amt) || amt <= 0){ out.innerHTML = `<div class="note">輸入${twd ? NAMES[c] : "新台幣"}金額就會換算。</div>`; runAll(); return; }
      const res = twd ? amt*rate : amt/rate, from = twd ? c : "TWD", to = twd ? "TWD" : c;
      const nm = x => x === "TWD" ? "新台幣" : NAMES[x];
      const examples = (twd ? [100, 1000, 10000, 50000] : [1000, 10000, 30000, 100000]).map(v =>
        `<dt>${fmtC(v, from)} ${nm(from)}</dt><dd>${fmtC(twd ? v*rate : v/rate, to)} ${nm(to)}</dd>`).join("");
      let spread = "";
      if(k !== "market" && m && Math.abs(rate - m)/m > 0.2) spread = `<div class="warn">你填的匯率和${NAMES[c]}的市場參考價（${fmtR(m)}）差超過 2 成，請確認幣別是不是選對了。</div>`;
      else if(k !== "market" && m){
        const cost = twd ? amt*m - res : amt - res*m, pctv = Math.abs(rate - m)/m*100;
        spread = `<div class="note">和市場參考價（${fmtR(m)}）相比，這筆換匯的價差成本約 <b>${fmtC(Math.abs(cost), "TWD")} 元新台幣</b>（約 ${pctv.toFixed(2)}%）。${(twd ? rate > m : rate < m) ? `<span class="warn">你填的匯率比市場參考價還有利，請確認是不是填成另一邊的價格。</span>` : ""}</div>`;
      }
      out.innerHTML = `
        <div>${fmtC(amt, from)} ${nm(from)} 約等於</div>
        <div class="big">${fmtC(res, to)} <small>${nm(to)}</small></div>
        <dl class="kv">${examples}</dl>
        <div class="note">使用${KIND[k]}${k === "market" ? "" : twd ? "買入" : "賣出"}匯率 1 ${NAMES[c]} ＝ ${fmtR(rate)} 新台幣換算。${k === "market" ? "這是國際市場參考價，不是銀行牌告；到銀行實際換匯，買外幣會比較貴、賣外幣會拿比較少。" : ""}</div>
        ${spread}
        <div><button type="button" class="copy" id="fxCopy" style="padding:8px 12px">複製換算結果</button></div>`;
      $("#fxCopy").onclick = e => {
        const text = `${fmtC(amt, from)} ${nm(from)} ≈ ${fmtC(res, to)} ${nm(to)}\n匯率：1 ${NAMES[c]} ＝ ${fmtR(rate)} 新台幣（${KIND[k]}${k === "market" ? (data ? `，資料時間 ${tpe(data.t)}` : "") : twd ? "買入" : "賣出"}）\n${location.href}`;
        const b = e.target; if(navigator.clipboard) navigator.clipboard.writeText(text).then(() => { b.textContent = "已複製"; setTimeout(() => b.textContent = "複製換算結果", 1500); }, () => {});
      };
      runAll();
    }

    // ---- 銀行換匯成本比較 ----
    function runCmp(){
      if(!cmp) return;
      const g = cmp.elements, o = $("#fxCmpOut"), c = f.cur.value, buy = g.act.value === "buy", m = mid(c);
      save("fxCmp", ["act","amt","n1","r1","f1","n2","r2","f2","n3","r3","f3"].map(x => g[x].value));
      $("#fxCmpRateHead").textContent = `${buy ? "賣出" : "買入"}匯率`;
      cmp.querySelectorAll("[data-cur]").forEach(el => el.textContent = NAMES[c]);
      const amt = dec(g.amt);
      const rows = [1,2,3].map(j => ({name: g["n"+j].value.trim() || `銀行 ${"ABC"[j-1]}`, rate: dec(g["r"+j]), fee: dec(g["f"+j]) || 0}))
        .filter(x => x.rate && !isNaN(x.rate) && x.rate > 0);
      if(!amt || isNaN(amt) || amt <= 0 || !rows.length){ o.innerHTML = `<div class="note">輸入要換的${NAMES[c]}金額，再填至少一家銀行的${buy ? "賣出" : "買入"}匯率，就會比較哪一家比較划算。</div>`; return; }
      rows.forEach(x => { x.twd = buy ? amt*x.rate + x.fee : amt*x.rate - x.fee; x.cost = m ? (buy ? x.twd - amt*m : amt*m - x.twd) : null; });
      const best = buy ? Math.min(...rows.map(x => x.twd)) : Math.max(...rows.map(x => x.twd));
      const worst = buy ? Math.max(...rows.map(x => x.twd)) : Math.min(...rows.map(x => x.twd));
      const bestRow = rows.find(x => x.twd === best);
      o.innerHTML = `
        <div class="tbl"><table>
          <thead><tr><th>銀行</th><th>${buy ? "賣出" : "買入"}匯率</th><th>手續費</th><th>${buy ? "需付台幣" : "實收台幣"}</th>${m ? "<th>換匯成本</th>" : ""}</tr></thead>
          <tbody>${rows.map(x => `<tr${x.twd === best && rows.length > 1 ? ' style="font-weight:700"' : ""}><td>${x.name}${x.twd === best && rows.length > 1 ? "（最划算）" : ""}</td><td class="num">${fmtR(x.rate)}</td><td class="num">${fmtC(x.fee, "TWD")}</td><td class="num">${fmtC(x.twd, "TWD")}</td>${m ? `<td class="num">${x.cost >= 0 ? fmtC(x.cost, "TWD") : "低於參考價"}</td>` : ""}</tr>`).join("")}</tbody>
        </table></div>
        ${rows.length > 1 && best !== worst ? `<div class="note">${buy ? `換 ${fmtC(amt, c)} ${NAMES[c]}` : `把 ${fmtC(amt, c)} ${NAMES[c]} 換回台幣`}，選<b>${bestRow.name}</b>比最貴的一家${buy ? "少付" : "多拿"} <b>${fmtC(Math.abs(best - worst), "TWD")} 元</b>。</div>` : ""}
        ${m && rows.some(x => Math.abs(x.rate - m)/m > 0.2) ? `<div class="warn">有銀行的匯率和${NAMES[c]}的市場參考價（${fmtR(m)}）差超過 2 成，請確認幣別是不是選對了。</div>` : rows.some(x => x.cost < 0) ? `<div class="warn">有銀行的匯率比市場參考價還有利，請確認是不是填成另一邊（${buy ? "買入" : "賣出"}）的價格，或參考價已經過時。</div>` : ""}
        ${m ? `<div class="note">換匯成本＝和市場參考價（1 ${NAMES[c]} ＝ ${fmtR(m)}）相比多付或少拿的台幣，包含價差和手續費。</div>` : ""}`;
    }

    // ---- 刷卡和換現金比較 ----
    function runCard(){
      if(!card) return;
      const g = card.elements, o = $("#fxCardOut"), c = f.cur.value, m = mid(c);
      save("fxCard", ["amt","crate","fee","back","cash"].map(x => g[x].value));
      card.querySelectorAll("[data-cur]").forEach(el => el.textContent = NAMES[c]);
      g.crate.placeholder = m ? `預設市場參考 ${fmtR(m)}` : "請填匯率";
      const amt = dec(g.amt), fee = dec(g.fee) ?? 1.5, back = dec(g.back) ?? 0, cash = dec(g.cash), cr = dec(g.crate) || m;
      if(!amt || isNaN(amt) || amt <= 0 || !cr){ o.innerHTML = `<div class="note">輸入消費金額就會比較刷卡和換現金的成本。</div>`; return; }
      const base = amt*cr, cardFee = base*fee/100, cardBack = base*back/100, cardTotal = base + cardFee - cardBack;
      const cashTotal = cash && cash > 0 ? amt*cash : null;
      o.innerHTML = `
        <dl class="kv">
          <dt>刷卡：${fmtC(amt, c)} ${NAMES[c]} × ${fmtR(cr)}</dt><dd>${fmtC(base, "TWD")}</dd>
          <dt>國外交易手續費 ${fee}%</dt><dd>＋${fmtC(cardFee, "TWD")}</dd>
          ${back ? `<dt>回饋 ${back}%</dt><dd>－${fmtC(cardBack, "TWD")}</dd>` : ""}
          <dt class="sum">刷卡實際成本</dt><dd class="sum">${fmtC(cardTotal, "TWD")}</dd>
          ${cashTotal ? `<dt class="sum">換現金成本（現金賣出 ${fmtR(cash)}）</dt><dd class="sum">${fmtC(cashTotal, "TWD")}</dd>` : ""}
        </dl>
        ${cashTotal ? `<div class="note">${Math.abs(cardTotal - cashTotal) < 1 ? "兩種方式成本差不多。" : cardTotal < cashTotal ? `<b>刷卡</b>比換現金便宜約 ${fmtC(cashTotal - cardTotal, "TWD")} 元。` : `<b>換現金</b>比刷卡便宜約 ${fmtC(cardTotal - cashTotal, "TWD")} 元。`}</div>` : `<div class="note">填入銀行的現金賣出匯率，就能和換現金比較。</div>`}
        <div class="note">刷卡匯率以發卡組織結算當天的匯率為準，入帳金額可能和這裡不同；如果店家問要不要用台幣結帳（DCC），選當地貨幣通常比較划算。</div>`;
    }
    function runAll(){ runCmp(); runCard(); }

    const s = load("fxForm");
    if(s){ if(s[0] && NAMES[s[0]]) f.cur.value = s[0]; if(s[1]) f.dir.value = s[1]; if(s[2]) f.amount.value = s[2]; if(s[3] && KIND[s[3]]) f.kind.value = s[3]; }
    const restore = (form, key, names) => { const v = load(key); if(form && v) names.forEach((x, j) => { if(v[j] != null && v[j] !== "") form.elements[x].value = v[j]; }); };
    restore(cmp, "fxCmp", ["act","amt","n1","r1","f1","n2","r2","f2","n3","r3","f3"]);
    restore(card, "fxCard", ["amt","crate","fee","back","cash"]);
    ["cur","dir","kind"].forEach(x => f[x].addEventListener("change", () => { syncRate(); run(); }));
    fx.addEventListener("input", e => { if(!["cur","dir","kind"].includes(e.target.name)) run(); });
    fx.addEventListener("submit", e => { e.preventDefault(); run(); });
    [cmp, card].forEach(x => { if(x){ x.addEventListener("input", runAll); x.addEventListener("change", runAll); x.addEventListener("submit", e => { e.preventDefault(); runAll(); }); } });
    status(); syncRate(); run();

    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 8000);
    fetch("https://open.er-api.com/v6/latest/TWD", ctl ? {signal: ctl.signal} : {}).then(r => r.json()).then(d => {
      clearTimeout(timer);
      if(d.result !== "success" || !d.rates) throw 0;
      data = {t: d.time_last_update_unix, next: d.time_next_update_unix, rates: d.rates};
      save("fxRates", data); state = "ok";
    }).catch(() => { clearTimeout(timer); state = "fail"; })
      .then(() => { status(); syncRate(); run(); });
  }

  // ---- 單位換算 ----
  const un = $('form[data-tool="unit"]');
  if(un){
    const f = un.elements, out = $("#unitOut"), histEl = $("#unitHist");
    const SUP = {"-":"⁻","0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"};
    // 只在顯示時處理位數，計算全程用原始數值
    function fmt(v){
      if(!isFinite(v)) return "—";
      const a = Math.abs(v), p = f.prec.value;
      if(a !== 0 && (a < 1e-6 || a >= 1e15)){ const [m, e] = v.toExponential(p === "auto" ? 4 : +p).split("e"); return `${+m} × 10${String(+e).split("").map(c => SUP[c]).join("")}`; }
      const d = p === "auto" ? (a >= 1000 ? 2 : a >= 1 ? 4 : 6) : +p;
      return v.toLocaleString("zh-TW", {maximumFractionDigits: d});
    }
    const ratioTxt = r => { if(r < 1e-6 || r >= 1e12){ const [m, e] = r.toExponential(6).split("e"); return `${+m} × 10${String(+e).split("").map(c => SUP[c]).join("")}`; } return (+r.toPrecision(10)).toLocaleString("zh-TW", {maximumFractionDigits: 10}); };
    function fill(from, to){
      const names = Object.keys(C.UNITS[f.cat.value].u);
      [f.from, f.to].forEach((sel, j) => { const want = j ? to : from; sel.innerHTML = names.map(n => `<option>${n}</option>`).join(""); sel.value = names.includes(want) ? want : names[j ? 1 : 0]; });
    }
    let hist = load("unitHist") || [], histTimer = null;
    function drawHist(){
      histEl.innerHTML = hist.length ? `<span class="note">最近換算：</span>${hist.map((h, j) => `<button type="button" class="copy" data-h="${j}" style="padding:6px 10px">${h[3]} ${h[1]} → ${h[2]}</button>`).join("")}` : "";
    }
    function remember(){
      const v = f.v.value.trim(); if(!v || isNaN(+v.replace(/,/g,""))) return;
      const h = [f.cat.value, f.from.value, f.to.value, v];
      hist = [h].concat(hist.filter(x => x.join("|") !== h.join("|"))).slice(0, 6);
      save("unitHist", hist); drawHist();
    }
    function run(){
      const cat = f.cat.value, U = C.UNITS[cat];
      save("unitForm", [cat, f.from.value, f.to.value, f.v.value, f.prec.value]);
      const raw = String(f.v.value).replace(/[,\s]/g,""), v = raw === "" ? NaN : Number(raw);
      if(isNaN(v)){ out.innerHTML = `<div class="note">${raw === "" ? "輸入數值就會換算。" : "請輸入數字，例如 30 或 1.5。"}</div>`; return; }
      if(!U.temp && v < 0){ out.innerHTML = `<div class="warn">${U.label}不能是負數。</div>`; return; }
      const from = f.from.value, to = f.to.value, res = C.convertUnit(cat, v, from, to);
      if(U.temp && C.convertUnit(cat, v, from, "克氏（K）") < 0){ out.innerHTML = `<div class="warn">低於絕對零度（0 K ＝ −273.15 °C），請確認數值。</div>`; return; }
      let formula;
      if(U.temp){
        const key = from + ">" + to;
        const T = {"攝氏（°C）>華氏（°F）":`${fmt(v)} × 9/5 ＋ 32`, "華氏（°F）>攝氏（°C）":`(${fmt(v)} − 32) × 5/9`, "攝氏（°C）>克氏（K）":`${fmt(v)} ＋ 273.15`,
          "克氏（K）>攝氏（°C）":`${fmt(v)} − 273.15`, "華氏（°F）>克氏（K）":`(${fmt(v)} − 32) × 5/9 ＋ 273.15`, "克氏（K）>華氏（°F）":`(${fmt(v)} − 273.15) × 9/5 ＋ 32`};
        formula = from === to ? `${fmt(v)}` : T[key];
      } else formula = `${fmt(v)} × ${ratioTxt(U.u[from][0]/U.u[to][0])}`;
      const defs = [from, to].filter((n, j, a) => a.indexOf(n) === j && U.u[n][U.temp ? 2 : 1] !== "基準").map(n => `1 ${n.replace(/（.*）/, "")} ＝ ${U.u[n][U.temp ? 2 : 1]}`);
      if(U.temp) defs.length = 0;
      const all = Object.keys(U.u).filter(n => n !== from).map(n => `<dt>${n}</dt><dd>${fmt(C.convertUnit(cat, v, from, n))}</dd>`).join("");
      const tw = !U.temp && (U.u[from][2] || U.u[to][2]);
      const dataNote = cat === "data" && (/i/.test(from) !== /i/.test(to)) && from !== "bit" && to !== "bit" && from !== "Byte（B）" && to !== "Byte（B）"
        ? `<div class="note">KB、MB、GB、TB 是 1,000 進位，KiB、MiB、GiB、TiB 是 1,024 進位。硬碟廠商標示用 1,000 進位，Windows 顯示的「GB」其實是 GiB，所以 1 TB 硬碟在電腦上看起來約 931 GB。</div>` : "";
      out.innerHTML = `
        <div>${fmt(v)} ${from} ＝</div>
        <div class="big">${fmt(res)} <small>${to}</small></div>
        <div class="note">算式：${formula} ＝ ${fmt(res)} ${to}${defs.length ? `<br>${defs.join("；")}` : ""}</div>
        ${tw ? `<div class="note">台斤、台兩、台錢、坪、甲、台尺等是民間慣用單位。依度量衡法，交易或證明要使用法定度量衡單位（公克、平方公尺、公分等）。</div>` : ""}
        ${dataNote}
        <h3 style="margin:6px 0 0;font-size:1rem">${fmt(v)} ${from} 換算成其他單位</h3>
        <dl class="kv">${all}</dl>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="copy" id="unitCopy" style="padding:8px 12px">複製換算結果</button></div>`;
      $("#unitCopy").onclick = e => {
        const text = `${fmt(v)} ${from} ＝ ${fmt(res)} ${to}\n算式：${formula} ＝ ${fmt(res)}\n${location.href}`;
        const b = e.target; if(navigator.clipboard) navigator.clipboard.writeText(text).then(() => { b.textContent = "已複製"; setTimeout(() => b.textContent = "複製換算結果", 1500); }, () => {});
      };
      clearTimeout(histTimer); histTimer = setTimeout(remember, 1500);
    }
    function apply(cat, from, to, v){ f.cat.value = cat; fill(from, to); f.v.value = v; clearTimeout(histTimer); run(); }
    const s = load("unitForm");
    if(s && C.UNITS[s[0]]){ f.cat.value = s[0]; fill(s[1], s[2]); }
    else { f.cat.value = "area"; fill("坪", "平方公尺（m²）"); }
    if(s && s[3] != null && s[3] !== "") f.v.value = s[3];
    if(s && s[4]) f.prec.value = s[4];
    f.cat.addEventListener("change", () => { fill(); run(); });
    $("#unitSwap").addEventListener("click", () => { const a = f.from.value; f.from.value = f.to.value; f.to.value = a; run(); });
    $("#unitClear").addEventListener("click", () => { f.v.value = ""; f.v.focus(); run(); });
    un.addEventListener("input", e => { if(e.target !== f.cat) run(); }); un.addEventListener("submit", e => { e.preventDefault(); run(); });
    histEl.addEventListener("click", e => { const b = e.target.closest("[data-h]"); if(b){ const h = hist[+b.dataset.h]; if(h && C.UNITS[h[0]]) apply(...h); } });
    document.querySelectorAll("[data-unit]").forEach(b => b.addEventListener("click", () => {
      apply(...b.dataset.unit.split("|")); un.scrollIntoView({behavior:"smooth", block:"start"});
    }));
    drawHist(); run();
  }
})();
