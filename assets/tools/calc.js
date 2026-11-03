// 放假日曆 試算工具：純計算邏輯（瀏覽器與 node 共用）。
(function(root){
  // ---- 115 年度綜合所得稅（116 年 5 月申報）----
  // 來源：財政部 114/11/27 台財稅字第 11404664070 號公告；所得稅法 115/8/21 三讀（未成年子女免稅額 15.15 萬）。
  const TAX115 = {
    exempt:101000, exemptHigh:151500, stdSingle:136000, stdMarried:272000,
    salary:227000, disabled:227000, preschool1:150000, preschool2:225000, ltc:180000, rent:180000,
    basicLiving:213000, // 115 年度金額公告前，暫用 114 年度 21.3 萬
    brackets:[[610000,.05,0],[1380000,.12,42700],[2770000,.20,153100],[5190000,.30,430100],[Infinity,.40,949100]]
  };
  const bracketOf = net => TAX115.brackets.find(b => net <= b[0]);
  const taxOf = net => net <= 0 ? 0 : Math.round(net*bracketOf(net)[1] - bracketOf(net)[2]);
  const rateOf = net => net <= 0 ? 0 : bracketOf(net)[1];

  // p = {married, self:{salary,other,senior,disabled}, spouse:{...}, minors, adults, seniorDeps,
  //      disabledDeps, preschool, ltc, rent（全年房租）, itemized, withheld}
  function incomeTax(p){
    const T = TAX115, n = v => Math.max(0, +v || 0);
    const self = p.self, sp = p.married ? p.spouse : null;
    const earners = sp ? [self, sp] : [self];
    const exOf = x => x.senior ? T.exemptHigh : T.exempt;
    const people = earners.length + n(p.minors) + n(p.adults) + n(p.seniorDeps);
    const exemptTotal = earners.reduce((s,x)=>s+exOf(x),0) + n(p.minors)*T.exemptHigh + n(p.adults)*T.exempt + n(p.seniorDeps)*T.exemptHigh;
    const general = Math.max(p.married ? T.stdMarried : T.stdSingle, n(p.itemized));
    const usedItemized = n(p.itemized) > (p.married ? T.stdMarried : T.stdSingle);
    const salDed = x => Math.min(n(x.salary), T.salary);
    const disOf = x => x.disabled ? T.disabled : 0;
    const disabledTotal = earners.reduce((s,x)=>s+disOf(x),0) + n(p.disabledDeps)*T.disabled;
    const pre = n(p.preschool);
    const preschoolFull = pre ? T.preschool1 + (pre-1)*T.preschool2 : 0;
    const rentAmt = Math.min(n(p.rent), T.rent); // 實際支付租金，每戶上限 18 萬
    const ltcFull = n(p.ltc) * T.ltc + rentAmt; // 長照與房屋租金同屬「稅率 20% 以上不適用」

    function run(sepWho, sepAll){
      // sepWho: null | 0 (本人) | 1 (配偶)；sepAll: 各類所得分開
      const sepP = sepWho === null ? null : earners[sepWho];
      let sepNet = 0, sepTax = 0;
      if(sepP){
        sepNet = n(sepP.salary) + (sepAll ? n(sepP.other) : 0) - exOf(sepP) - salDed(sepP) - disOf(sepP);
        sepTax = taxOf(sepNet);
      }
      const gross = earners.reduce((s,x)=>s+n(x.salary)+n(x.other),0) - (sepP ? n(sepP.salary) + (sepAll ? n(sepP.other) : 0) : 0);
      const mainSalDed = earners.filter(x=>x!==sepP).reduce((s,x)=>s+salDed(x),0);
      const mainEx = exemptTotal - (sepP ? exOf(sepP) : 0);
      const mainDis = disabledTotal - (sepP ? disOf(sepP) : 0);
      function net(pre, ltc){
        const bl = Math.max(0, T.basicLiving*people - (exemptTotal + general + disabledTotal + pre + ltc));
        return {bl, net: Math.max(0, gross - mainEx - general - mainSalDed - mainDis - pre - ltc - bl)};
      }
      let pre = preschoolFull, ltc = ltcFull, r = net(pre, ltc), capped = false;
      // 幼兒學前、長照特別扣除額：適用稅率 20% 以上者不適用
      if((pre || ltc) && (rateOf(r.net) >= .2 || rateOf(sepNet) >= .2)){ pre = 0; ltc = 0; r = net(0,0); capped = true; }
      const mainTax = taxOf(r.net);
      return {sepWho, sepAll, net:r.net, sepNet:Math.max(0,sepNet), tax: mainTax + sepTax, mainTax, sepTax,
              rate: Math.max(rateOf(r.net), rateOf(sepNet)), bl:r.bl, pre, ltc: ltc ? ltc - rentAmt : 0, rentDed: ltc ? rentAmt : 0, capped, gross};
    }
    const options = [run(null,false)];
    if(sp){ options.push(run(0,false), run(1,false), run(0,true), run(1,true)); }
    const best = options.reduce((a,b)=> b.tax < a.tax ? b : a);
    const income = earners.reduce((s,x)=>s+n(x.salary)+n(x.other),0);
    return {...best, options, combinedTax: options[0].tax, people, exemptTotal, general, usedItemized,
            salaryDed: earners.reduce((s,x)=>s+salDed(x),0), disabledTotal, income,
            refund: n(p.withheld) - best.tax};
  }

  // ---- 特休（勞基法第 38 條，週年制）----
  function addMonths(d, m){
    const y = d.getFullYear(), mo = d.getMonth() + m, day = d.getDate();
    const last = new Date(y, mo + 1, 0).getDate();
    return new Date(y, mo, Math.min(day, last));
  }
  const leaveDaysForYears = y => y < 1 ? 3 : y < 2 ? 7 : y < 3 ? 10 : y < 5 ? 14 : y < 10 ? 15 : Math.min(30, 15 + (y - 9));
  function annualLeave(hire, asOf){
    const list = [{at: addMonths(hire,6), label:"滿 6 個月", days:3}];
    for(let y=1; y<=25; y++) list.push({at:addMonths(hire,12*y), label:`滿 ${y} 年`, days:leaveDaysForYears(y)});
    let cur = null, next = list[0];
    for(const m of list){ if(m.at <= asOf){ cur = m; } else { next = m; break; } }
    if(cur === list[list.length-1]) next = null;
    // 年資（年、月、日）
    let y = asOf.getFullYear()-hire.getFullYear(), mo = asOf.getMonth()-hire.getMonth(), d = asOf.getDate()-hire.getDate();
    if(d < 0){ mo--; d += new Date(asOf.getFullYear(), asOf.getMonth(), 0).getDate(); }
    if(mo < 0){ y--; mo += 12; }
    return {list, cur, next, tenure:{y, m:mo, d}};
  }
  // 曆年制（按比例）：把每個週年期間的特休，依落在各曆年的天數比例分配。實務上公司可能四捨五入或一次給足。
  function calendarYearLeave(hire, years){
    const periods = [{s:addMonths(hire,6), e:addMonths(hire,12), days:3}];
    for(let y=1; y<=30; y++) periods.push({s:addMonths(hire,12*y), e:addMonths(hire,12*(y+1)), days:leaveDaysForYears(y)});
    return years.map(Y => {
      const ys = new Date(Y,0,1), ye = new Date(Y+1,0,1);
      let cal = 0, anniv = 0;
      for(const p of periods){
        const len = (p.e - p.s)/864e5, ov = Math.max(0, (Math.min(ye, p.e) - Math.max(ys, p.s))/864e5);
        cal += p.days * ov / len;
        if(p.s >= ys && p.s < ye) anniv += p.days;
      }
      return {year:Y, calendar: Math.round(cal*10)/10, anniversary: anniv};
    });
  }

  // ---- 加班費（勞基法第 24、39 條）----
  // rows: weekday / restday / holiday：{hours, times}
  function overtime(monthly, rows){
    const h = (+monthly || 0) / 240, out = [];
    const seg = (hrs, parts) => { let left = hrs, pay = 0, used = 0, det = [];
      for(const [cap, r] of parts){ const x = Math.max(0, Math.min(left, cap - used)); if(x>0){ pay += x*h*r; det.push([x,r]); } left -= x; used += x; }
      return {pay, det}; };
    const wd = Math.min(+rows.weekday.hours||0, 4), rd = Math.min(+rows.restday.hours||0, 12), hd = Math.min(+rows.holiday.hours||0, 12);
    const W = seg(wd, [[2,4/3],[4,5/3]]);
    const R = seg(rd, [[2,4/3],[8,5/3],[12,8/3]]);
    const Hx = seg(Math.max(0, hd-8), [[2,4/3],[4,5/3]]);
    const H = {pay: hd > 0 ? 8*h + Hx.pay : 0, det: hd > 0 ? [[8,"加發 1 日工資"], ...Hx.det] : []};
    const t = k => Math.max(0, Math.floor(+rows[k].times || 0));
    out.push({key:"weekday", per: W.pay, times:t("weekday"), det:W.det});
    out.push({key:"restday", per: R.pay, times:t("restday"), det:R.det});
    out.push({key:"holiday", per: H.pay, times:t("holiday"), det:H.det});
    const total = out.reduce((s,r)=>s+r.per*r.times,0);
    return {hourly:h, rows:out, total};
  }

  // ---- 勞保、就保、健保、勞退（115 年 1 月 1 日起）----
  // 來源：勞保局勞工保險投保薪資分級表（勞動保 2 字第 1140091863 號）、勞工退休金月提繳分級表（勞動福 3 字第 1140153598 號）、
  //       健保署保險費負擔金額表(三)（115.1.1 生效）。
  const INS115 = {
    // 勞保：[月薪資上限, 月投保薪資]，第 11 級為 43,901 元以上 → 45,800
    li: [[29500,29500],[30300,30300],[31800,31800],[33300,33300],[34800,34800],[36300,36300],[38200,38200],[40100,40100],[42000,42000],[43900,43900],[Infinity,45800]],
    nhi: [29500,30300,31800,33300,34800,36300,38200,40100,42000,43900,45800,48200,50600,53000,55400,57800,60800,63800,66800,69800,72800,
          76500,80200,83900,87600,92100,96600,101100,105600,110100,115500,120900,126300,131700,137100,142500,147900,150000,156400,162800,
          169200,175600,182000,189500,197000,204500,212000,219500,228200,236900,245600,254300,263000,273000,283000,293000,303000,313000],
    pension: [1500,3000,4500,6000,7500,8700,9900,11100,12540,13500,15840,16500,17280,17880,19047,20008,21009,22000,23100,24000,25250,26400,
          27600,28590,29500,30300,31800,33300,34800,36300,38200,40100,42000,43900,45800,48200,50600,53000,55400,57800,60800,63800,66800,
          69800,72800,76500,80200,83900,87600,92100,96600,101100,105600,110100,115500,120900,126300,131700,137100,142500,147900,150000],
    liRate:.115, eiRate:.01, nhiRate:.0517, avgDeps:.56, minWage:29500
  };
  const gradeUp = (list, v) => list.find(g => v <= g) ?? list[list.length-1];
  // p = {salary, deps（健保眷屬人數）, noEI（不適用就業保險）, selfPct（勞退自提 %）}
  function laborIns(p){
    const I = INS115, n = v => Math.max(0, +v || 0), r = Math.round;
    const s = n(p.salary), deps = Math.min(3, Math.floor(n(p.deps)));
    const liGrade = I.li.find(([cap]) => s <= cap)[1];
    const nhiGrade = gradeUp(I.nhi, s), penGrade = gradeUp(I.pension, s);
    const li = {grade: liGrade, emp: r(liGrade*I.liRate*.2), er: r(liGrade*I.liRate*.7)};
    const ei = p.noEI ? {emp:0, er:0} : {emp: r(liGrade*I.eiRate*.2), er: r(liGrade*I.eiRate*.7)};
    const nhiOne = r(nhiGrade*I.nhiRate*.3);
    const nhi = {grade: nhiGrade, emp: nhiOne*(1+deps), er: r(nhiGrade*I.nhiRate*.6*(1+I.avgDeps)), deps};
    const pct = Math.min(6, n(p.selfPct));
    const pen = {grade: penGrade, er: r(penGrade*.06), emp: r(penGrade*pct/100), pct};
    const empTotal = li.emp + ei.emp + nhi.emp + pen.emp;
    const erTotal = li.er + ei.er + nhi.er + pen.er;
    return {salary:s, li, ei, nhi, pen, empTotal, erTotal, takeHome: s - empTotal, belowMin: s > 0 && s < I.minWage};
  }

  // ---- 薪資實領（115 年）----
  // 扣繳：財政部稅務入口網「薪資扣繳規定」。稅額表起扣標準（無扶養）90,501；5% 扣繳每月應扣稅額不超過 2,000 免扣；
  //       非固定薪資（獎金）每次達 90,501 扣 5%；加班費每月 46 小時內免稅。二代健保補充保費 2.11%，獎金累計超過投保金額 4 倍的部分。
  const PAY115 = {threshold:90501, fiveFree:2000, suppRate:.0211};
  // p = {salary, overtime, bonus, bonusYTD, deps, noEI, selfPct, taxMethod:"table"|"five", taxManual, other}
  function netPay(p){
    const n = v => Math.max(0, +v || 0), r = Math.round, P = PAY115;
    const salary = n(p.salary), ot = n(p.overtime), bonus = n(p.bonus), ytd = n(p.bonusYTD);
    const ins = laborIns({salary, deps:p.deps, noEI:p.noEI, selfPct:p.selfPct});
    let salaryTax = 0, needTable = false;
    if(p.taxMethod === "five"){ const v = r(salary*.05); salaryTax = v > P.fiveFree ? v : 0; }
    else if(salary >= P.threshold){ if(p.taxManual === "" || p.taxManual == null) needTable = true; else salaryTax = n(p.taxManual); }
    const bonusTax = bonus >= P.threshold ? r(bonus*.05) : 0;
    const cap = 4*ins.nhi.grade, over = x => Math.max(0, x - cap);
    const supp = r((over(ytd + bonus) - over(ytd)) * P.suppRate);
    const other = n(p.other);
    const gross = salary + ot + bonus;
    const deduct = ins.empTotal + salaryTax + bonusTax + supp + other;
    return {ins, gross, salaryTax, needTable, bonusTax, supp, suppBase: over(ytd + bonus) - over(ytd), cap, other, deduct, net: gross - deduct};
  }

  // ---- 資遣費 ----
  // 新制（勞工退休金條例第 12 條）：每滿 1 年 1/2 個月平均工資，未滿 1 年按比例，最高 6 個月。
  // 舊制（勞基法第 17 條）：每滿 1 年 1 個月平均工資，剩餘月數按比例，未滿 1 個月以 1 個月計。
  // 年資換算依勞動部範例：新制 年＋(月＋日/30)/12；舊制 年＋(月＋1)/12（有零頭日數時）。
  // 年資算到離職日（最後工作日）當天，所以期間的結束點是離職日隔天。
  // 退職所得（115 年度）：一次領取 206,000 × 年資以下免稅，超過到 414,000 × 年資的部分半數課稅。
  const SEV115 = {newSince:new Date(2005,6,1), cap:6, tax1:206000, tax2:414000};
  function monthsBetween(a, b){ // 滿幾個月＋零頭日數（a 起算、b 不含）
    if(b <= a) return {m:0, d:0};
    let k = (b.getFullYear()-a.getFullYear())*12 + b.getMonth()-a.getMonth();
    if(addMonths(a, k) > b) k--;
    return {m:k, d:Math.round((b - addMonths(a, k))/864e5)};
  }
  // p = {hire, leave: Date, avg: 月平均工資, scheme:"new"|"old"|"mixed", switchDate}
  function severance(p){
    const S = SEV115, avg = Math.max(0, +p.avg || 0);
    const end = new Date(p.leave); end.setDate(end.getDate()+1);
    const hire = p.hire;
    const sw = p.scheme === "new" ? hire : p.scheme === "old" ? end
      : new Date(Math.min(Math.max(hire, p.switchDate || S.newSince), end));
    const o = monthsBetween(hire, sw), w = monthsBetween(sw, end), t = monthsBetween(hire, end);
    const oldUnits = Math.floor(o.m/12) + (o.m%12 + (o.d > 0 ? 1 : 0))/12;
    const newRaw = (w.m + w.d/30)/12 * .5;
    const newUnits = Math.min(S.cap, newRaw);
    const oldPay = Math.round(avg*oldUnits), newPay = Math.round(avg*newUnits);
    const amount = Math.round(avg*(oldUnits + newUnits));
    const noticeDays = t.m < 3 ? 0 : t.m < 12 ? 10 : t.m < 36 ? 20 : 30;
    // 退職所得年資：尾數未滿 6 個月以半年計，滿 6 個月以 1 年計
    const rem = t.m%12, taxYears = Math.floor(t.m/12) + (rem === 0 && t.d === 0 ? 0 : rem < 6 ? .5 : 1);
    const free1 = S.tax1*taxYears, free2 = S.tax2*taxYears;
    const taxable = amount <= free1 ? 0 : amount <= free2 ? Math.round((amount-free1)/2) : Math.round((free2-free1)/2 + amount-free2);
    const fmt = x => ({y:Math.floor(x.m/12), m:x.m%12, d:x.d});
    return {old:{...fmt(o), units:oldUnits, pay:oldPay}, neu:{...fmt(w), units:newUnits, raw:newRaw, capped:newRaw > S.cap, pay:newPay},
            total:fmt(t), amount, noticeDays, noticePay:Math.round(avg/30*noticeDays), taxYears, free1, taxable, invalid: end <= hire};
  }

  // ---- 勞退新制退休金（勞工退休金條例）----
  // 雇主每月至少提繳月提繳工資 6%，勞工可自提 0～6%。年滿 60 歲可請領；提繳年資滿 15 年可選月退休金，未滿只能一次領。
  // 月退休金（勞保局，113 年 4 月 1 日起適用）：專戶金額 ÷ 期初年金現值因子 ÷ 12。
  //   因子 = (1 − (1+i)^−T) ÷ (12 × ((1+i)^(1/12) − 1)) × (1+i)^(1/12)，i = 1.1473%，T = 111 年全國簡易生命表平均餘命（四捨五入到整數）。
  const PEN = {rate:.011473, life:{60:23,61:23,62:22,63:21,64:20,65:19,66:19,67:18,68:17,69:16,70:16,71:15,72:14,73:13,74:13,75:12,
    76:11,77:11,78:10,79:9,80:9,81:8,82:8,83:7,84:6,85:6}, minAge:60, monthlyYears:15};
  const penLife = age => PEN.life[Math.min(85, Math.max(60, Math.floor(age)))];
  function annuityFactor(T, i){ const q = Math.pow(1+i, 1/12); return (1 - Math.pow(1+i, -T)) / (12*(q-1)) * q; }
  // p = {age, claimAge, salary, erPct, selfPct, balance（目前專戶累積）, years（已提繳年資）, growth（薪資年成長 %）, ret（年報酬率 %）}
  function pension(p){
    const n = v => Math.max(0, +v || 0);
    const age = Math.floor(n(p.age)), claim = Math.max(PEN.minAge, Math.floor(n(p.claimAge)) || 65);
    const g = n(p.growth)/100, r = (+p.ret || 0)/100, erPct = Math.max(6, n(p.erPct) || 6), selfPct = Math.min(6, n(p.selfPct));
    const m = Math.pow(1+r, 1/12) - 1, fvf = Math.abs(m) < 1e-12 ? 12 : (Math.pow(1+m, 12) - 1)/m;
    let bal = n(p.balance), base = n(p.balance), er = 0, self = 0;
    const rows = [];
    const yrs = Math.max(0, claim - age);
    for(let k = 0; k < yrs; k++){
      const wage = n(p.salary)*Math.pow(1+g, k), grade = gradeUp(INS115.pension, wage);
      const cEr = Math.round(grade*erPct/100), cSelf = Math.round(grade*selfPct/100);
      bal = bal*(1+r) + cEr*fvf; base = base*(1+r) + cEr*fvf;
      bal += cSelf*fvf;
      er += cEr*12; self += cSelf*12;
      rows.push({age:age+k, grade, cEr, cSelf, bal:Math.round(bal), base:Math.round(base)});
    }
    const total = Math.round(bal), noSelf = Math.round(base);
    const T = penLife(claim), factor = annuityFactor(T, PEN.rate);
    const years = n(p.years) + yrs;
    return {years:yrs, total, noSelf, selfGain: total - noSelf, er, self, principal: n(p.balance) + er + self, gain: total - n(p.balance) - er - self,
            T, factor, monthly: Math.round(total/factor/12), monthlyNoSelf: Math.round(noSelf/factor/12), endAge: claim + T,
            contribYears: years, canMonthly: years >= PEN.monthlyYears, rows, claim, firstGrade: rows.length ? rows[0].grade : gradeUp(INS115.pension, n(p.salary))};
  }

  // ---- 勞保老年給付（勞工保險條例第 58～59 條）----
  // 年金（年資滿 15 年）：A 式 平均月投保薪資 × 年資 × 0.775% + 3,000，B 式 × 1.55%，擇優發給（第 58-1 條）。
  // 延後請領每年增給 4%、提前請領每年減給 4%，各最多 5 年（第 58-2 條；提前需年資滿 15 年）。
  // 老年一次金（年資未滿 15 年）、一次請領老年給付（97/7/17 修法前有年資者）：年資每滿 1 年 1 個月，
  //   超過 15 年的部分每年 2 個月，最高 45 個月；60 歲後年資最多計 5 年，合計最高 50 個月（第 59 條）。
  // 平均月投保薪資：年金、老年一次金取加保期間最高 60 個月平均；一次請領老年給付取退保前 3 年平均（第 19 條）。
  // 法定請領年齡：46 年次以前 60 歲，之後每年次加 1 歲，51 年次以後 65 歲（第 58 條第 5 項）。
  const LOA = {a:.00775, aPlus:3000, b:.0155, step:.04, maxYears:5, minYears:15, maxGrade:45800};
  const legalAge = birth => birth <= 46 ? 60 : Math.min(65, 60 + (birth - 46));
  const lumpMonths = y => y <= 15 ? y : 15 + 2*(y - 15);
  // p = {birth（民國年次）, age（目前年齡）, years（目前勞保年資，可含小數）, salary, avg（平均月投保薪資，選填）,
  //      claimAge, working（持續加保到請領）, pre98（97/7/17 前有年資）}
  function laborOldAge(p){
    const n = v => Math.max(0, +v || 0), L = LOA;
    const birth = Math.floor(n(p.birth)), age = Math.floor(n(p.age)), claim = Math.floor(n(p.claimAge));
    const legal = legalAge(birth);
    const add = p.working ? Math.max(0, claim - age) : 0;
    const years = n(p.years) + add;
    const grade = n(p.avg) ? Math.min(L.maxGrade, n(p.avg)) : INS115.li.find(([cap]) => n(p.salary) <= cap)[1];
    const rawA = grade*years*L.a + L.aPlus, rawB = grade*years*L.b;
    const formula = rawB >= rawA ? "B" : "A";
    const diff = claim - legal, adjYears = Math.max(-L.maxYears, Math.min(L.maxYears, diff));
    const annuityOk = years >= L.minYears;
    const tooEarly = annuityOk ? diff < -L.maxYears : diff < 0;
    const adj = annuityOk ? adjYears*L.step : 0;
    const monthly = annuityOk && !tooEarly ? Math.round(Math.max(rawA, rawB)*(1 + adj)) : 0;
    // 老年一次金（年資未滿 15 年，不能提前）
    const lump = !annuityOk && !tooEarly ? Math.round(grade*years) : 0;
    // 一次請領老年給付：60 歲以後的年資最多算 5 年
    const post60 = Math.min(years, Math.max(0, (p.working ? claim : age) - 60));
    const pre = years - post60, post = Math.min(5, post60);
    const mPre = Math.min(45, lumpMonths(pre));
    const months = Math.min(post60 > 0 ? 50 : 45, mPre + lumpMonths(pre + post) - lumpMonths(pre));
    const oneTime = p.pre98 && claim >= 60 && years >= 1 ? Math.round(grade*months) : 0;
    return {legal, age, claim, diff, adjYears, adj, years, add, grade, A:Math.round(rawA), B:Math.round(rawB), formula,
            annuityOk, tooEarly, monthly, lump, months, oneTime, breakEven: oneTime && monthly ? oneTime/monthly/12 : 0};
  }

  // ---- 台灣國定假日（政府行政機關辦公日曆表 115、116 年）----
  const TW_HOL = {
    "2026-01-01":"元旦","2026-02-15":"小年夜","2026-02-16":"除夕","2026-02-17":"春節 初一","2026-02-18":"春節 初二",
    "2026-02-19":"春節 初三","2026-02-20":"小年夜補假","2026-02-27":"和平紀念日補假","2026-02-28":"和平紀念日",
    "2026-04-03":"兒童節補假","2026-04-04":"兒童節","2026-04-05":"清明節","2026-04-06":"清明節補假",
    "2026-05-01":"勞動節","2026-06-19":"端午節","2026-09-25":"中秋節","2026-09-28":"教師節",
    "2026-10-09":"國慶日補假","2026-10-10":"國慶日","2026-10-25":"臺灣光復節","2026-10-26":"臺灣光復節補假","2026-12-25":"行憲紀念日",
    "2027-01-01":"元旦","2027-02-04":"小年夜","2027-02-05":"除夕","2027-02-06":"春節 初一","2027-02-07":"春節 初二",
    "2027-02-08":"春節 初三","2027-02-09":"春節補假","2027-02-10":"春節補假","2027-02-28":"和平紀念日","2027-03-01":"和平紀念日補假",
    "2027-04-04":"兒童節","2027-04-05":"清明節","2027-04-06":"兒童節補假","2027-04-30":"勞動節補假","2027-05-01":"勞動節",
    "2027-06-09":"端午節","2027-09-15":"中秋節","2027-09-28":"教師節","2027-10-10":"國慶日","2027-10-11":"國慶日補假",
    "2027-10-25":"臺灣光復節","2027-12-24":"行憲紀念日補假","2027-12-25":"行憲紀念日","2027-12-31":"元旦補假"
  };
  const pad = x => String(x).padStart(2,"0");
  const key = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const isWeekend = d => d.getDay() === 0 || d.getDay() === 6;
  const isWorkday = d => !isWeekend(d) && !TW_HOL[key(d)];
  // opt = {sixDay: 只休週日, extra: Set("YYYY-MM-DD") 公司額外放假日}
  const isRest = (d, opt) => opt && opt.sixDay ? d.getDay() === 0 : isWeekend(d);
  const isOffDay = (d, opt) => isRest(d, opt) || !!TW_HOL[key(d)] || !!(opt && opt.extra && opt.extra.has(key(d)));
  const RANGE = [new Date(2026,0,1), new Date(2027,11,31)];
  function workdays(a, b, opt){
    let s = a <= b ? a : b, e = a <= b ? b : a, n = 0, we = 0, hol = [], extra = [];
    for(let d = new Date(s); d <= e; d.setDate(d.getDate()+1)){
      if(isRest(d, opt)) we++;
      else if(TW_HOL[key(d)]) hol.push([key(d), TW_HOL[key(d)]]);
      else if(opt && opt.extra && opt.extra.has(key(d))) extra.push(key(d));
      else n++;
    }
    const total = Math.round((e - s)/864e5) + 1;
    return {total, workdays:n, weekends:we, holidays:hol, extra, outOfRange: s < RANGE[0] || e > RANGE[1]};
  }
  function addWorkdays(start, n, opt){
    const d = new Date(start); let left = n;
    while(left > 0){ d.setDate(d.getDate()+1); if(!isOffDay(d, opt)) left--; }
    return d;
  }
  const weekdayHolidays = () => Object.keys(TW_HOL).filter(k => !isWeekend(new Date(k+"T00:00")));

  // ---- 貸款（房貸、信貸）----
  // method: "pmt" 本息平均攤還、"principal" 本金平均攤還；grace 寬限期年數（只繳利息）。
  function loan({amount, rate, years, grace = 0, method = "pmt"}){
    const n = Math.round(years*12), g = Math.min(Math.round(grace*12), Math.max(0, n-1)), m = n - g, i = rate/100/12;
    const pmt = P => i ? P*i/(1 - Math.pow(1+i, -m)) : P/m;
    const rows = []; let bal = amount, totalInt = 0;
    for(let k = 1; k <= n; k++){
      const int = bal*i; let prin = 0;
      if(k > g) prin = method === "principal" ? amount/m : (k === n ? bal : pmt(amount) - int);
      if(k === n) prin = bal;
      bal = Math.max(0, bal - prin); totalInt += int;
      rows.push({k, pay:int+prin, int, prin, bal});
    }
    const first = rows[g] || rows[0];
    return {n, g, m, rows, totalInt, total:amount+totalInt,
      gracePay: g ? rows[0].pay : 0, firstPay:first.pay, lastPay:rows[n-1].pay};
  }
  // 依每月可負擔金額反推可貸額度（本息平均攤還、無寬限期）
  const loanCap = (monthly, rate, years) => { const i = rate/100/12, n = years*12; return i ? monthly*(1 - Math.pow(1+i, -n))/i : monthly*n; };

  // ---- 存款利息 ----
  // mode: "payout" 存本取息（每月領息、單利）、"compound" 整存整付（按月複利）、"monthly" 零存整付（每月存入、按月複利）
  const DEP = {nhi:.0211, nhiMin:20000, saving:270000, withhold:.10, withholdMin:20000};
  function deposit({amount, rate, months, mode = "compound"}){
    const i = rate/100/12; let interest, principal;
    if(mode === "payout"){ principal = amount; interest = Math.round(amount*i)*months; }
    else if(mode === "monthly"){ principal = amount*months; interest = i ? Math.round(amount*(1+i)*(Math.pow(1+i, months) - 1)/i) - principal : 0; }
    else { principal = amount; interest = Math.round(amount*Math.pow(1+i, months) - amount); }
    const monthlyPay = mode === "payout" ? Math.round(amount*i) : 0;
    // 二代健保補充保費、扣繳以「單次給付」判斷：存本取息每月給付一次，其餘到期一次給付
    const single = mode === "payout" ? monthlyPay : interest;
    const nhi = single >= DEP.nhiMin ? Math.round(single*DEP.nhi) : 0;
    return {principal, interest, total:principal+interest, monthlyPay, single, nhi,
      nhiTotal: mode === "payout" ? nhi*months : nhi, overSaving: interest > DEP.saving};
  }

  // ---- 單位換算（台灣常用）----
  const UNITS = {
    area:{label:"面積", base:"平方公尺", u:{"坪":400/121, "平方公尺":1, "平方公分":1e-4, "平方英尺":0.09290304, "公畝":100, "公頃":10000, "甲":2934*400/121, "分（地）":293.4*400/121}},
    weight:{label:"重量", base:"公克", u:{"台斤":600, "兩":37.5, "錢":3.75, "公斤":1000, "公克":1, "磅":453.59237, "盎司":28.349523125}},
    length:{label:"長度", base:"公分", u:{"公分":1, "公尺":100, "公里":100000, "毫米":0.1, "吋":2.54, "英尺":30.48, "碼":91.44, "英里":160934.4, "台尺":1000/33}},
    volume:{label:"容量", base:"毫升", u:{"毫升":1, "公升":1000, "立方公尺":1e6, "美制加侖":3785.411784, "美制液量盎司":29.5735295625, "杯（240 毫升）":240}},
  };
  const convertUnit = (cat, v, from, to) => v*UNITS[cat].u[from]/UNITS[cat].u[to];
  const cToF = c => c*9/5 + 32, fToC = f => (f - 32)*5/9;

  const api = {TAX115, INS115, PAY115, SEV115, LOA, legalAge, laborOldAge, laborIns, netPay, severance, monthsBetween, PEN, pension, annuityFactor, penLife, taxOf, rateOf, incomeTax, annualLeave, calendarYearLeave, leaveDaysForYears, overtime, TW_HOL, workdays, addWorkdays, weekdayHolidays, key, loan, loanCap, DEP, deposit, UNITS, convertUnit, cToF, fToC};
  if(typeof module !== "undefined") module.exports = api; else root.Calc = api;
})(this);
