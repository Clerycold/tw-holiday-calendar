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
    function run(){
      save("penForm", ids.map(k => f[k].value));
      const age = num(f.age), salary = num(f.salary);
      if(!age || !salary){ out.innerHTML = `<div class="note">輸入目前年齡和月薪，就會算出退休時勞退專戶大約有多少錢。</div>`; return; }
      const claim = +f.claimAge.value;
      const r = C.pension({age, claimAge:claim, salary, balance:num(f.balance), years:num(f.years), selfPct:num(f.selfPct),
        erPct:num(f.erPct), growth:dec(f.growth), ret:dec(f.ret)});
      const self = num(f.selfPct), wan = v => (Math.round(v/1000)/10).toLocaleString("zh-TW");
      const yearSelf = r.rows.length ? r.rows[0].cSelf*12 : 0;
      out.innerHTML = `
        <div>${r.claim} 歲時，勞退專戶預估累積</div>
        <div class="big">${money(r.total)} <small>元（約 ${wan(r.total)} 萬）</small></div>
        <dl class="kv">
          <dt>目前月提繳工資</dt><dd>${money(r.firstGrade)}</dd>
          ${r.years ? `<dt>再提繳 ${r.years} 年：雇主提繳</dt><dd>${money(r.er)}</dd>` : ""}
          ${r.self ? `<dt>自提</dt><dd>${money(r.self)}</dd>` : ""}
          ${num(f.balance) ? `<dt>目前已累積</dt><dd>${money(num(f.balance))}</dd>` : ""}
          ${r.years ? `<dt>投資收益</dt><dd>${money(r.gain)}</dd>` : ""}
          <dt class="sum">${r.canMonthly ? `月退休金（領到 ${r.endAge} 歲）` : "請領方式"}</dt><dd class="sum">${r.canMonthly ? `每月約 ${money(r.monthly)}` : "只能一次領"}</dd>
        </dl>
        ${r.canMonthly ? `<div class="note">月退休金依勞保局公式：專戶金額 ÷ 期初年金現值因子（${r.claim} 歲平均餘命 ${r.T} 年、利率 1.1473%）÷ 12，每季發一次。<b>只領到平均餘命為止</b>，活得比 ${r.endAge} 歲久，專戶就領完了；也可以選擇一次領 ${money(r.total)} 元。</div>`
          : `<div class="warn">請領時提繳年資約 ${r.contribYears} 年，未滿 15 年，只能一次領取。</div>`}
        ${self ? `<div class="note">自提 ${self}% 讓退休時多累積 <b>${money(r.selfGain)} 元</b>${r.canMonthly ? `，月退休金從 ${money(r.monthlyNoSelf)} 元變成 ${money(r.monthly)} 元` : ""}。今年自提約 ${money(yearSelf)} 元可以從薪資所得中減除，稅率 5% 約少繳 ${money(yearSelf*.05)} 元、12% 約少繳 ${money(yearSelf*.12)} 元。</div>`
          : !r.years ? "" : `<div class="note">自提 6% 的話，每個月存進專戶的錢會變成兩倍，而且自提的錢可以從當年度薪資所得中減除。上方選擇自提比例就能比較。</div>`}
        ${age >= claim ? `<div class="note">你已經達到請領年齡，上方金額就是目前的專戶累積。</div>` : ""}
        <div class="note">試算假設薪資每年成長 ${dec(f.growth)}%、投資報酬率每年 ${dec(f.ret)}%，實際收益每年不同，結果僅供參考。</div>`;
    }
    const s = load("penForm"); if(s){ ids.forEach((k,i) => { if(s[i] != null && s[i] !== "") f[k].value = s[i]; }); }
    pen.addEventListener("input", run); pen.addEventListener("change", run); pen.addEventListener("submit", e => { e.preventDefault(); run(); });
    run();
  }
})();
