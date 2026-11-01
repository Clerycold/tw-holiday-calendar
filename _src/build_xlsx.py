"""產生 /downloads/ 的 Excel 範本。
執行（repo 根目錄）：PYTHONPATH=C:/Users/Administrator/tools/pylib python _src/build_xlsx.py
國定假日清單從 assets/tools/calc.js 讀取，和網站工具共用同一份資料。
"""
import json, subprocess, datetime as dt
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.workbook.properties import CalcProperties

OUT = "downloads"
HOL = json.loads(subprocess.check_output(
    ["node", "-e", "process.stdout.write(JSON.stringify(require('./assets/tools/calc.js').TW_HOL))"]))

INPUT = PatternFill("solid", fgColor="FFF4C2")   # 黃底：請填寫
HEAD = PatternFill("solid", fgColor="0F7B6C")
OUTF = PatternFill("solid", fgColor="DFF3EF")    # 綠底：自動計算
thin = Side(style="thin", color="D0D0D0")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
FONT = "Microsoft JhengHei"
MONEY = '#,##0'
DATE = 'yyyy/m/d'


def book():
    wb = Workbook()
    wb.calculation = CalcProperties(fullCalcOnLoad=True)
    return wb


def base(ws, title, note):
    ws.sheet_view.showGridLines = False
    ws["A1"] = title
    ws["A1"].font = Font(name=FONT, size=16, bold=True)
    ws["A2"] = note
    ws["A2"].font = Font(name=FONT, size=10, color="6B6F78")
    ws["A3"] = "黃底格子請填寫，綠底格子會自動計算。來源：放假日曆 fangjiatw.com/tools/"
    ws["A3"].font = Font(name=FONT, size=10, color="6B6F78")


def style(ws, ref, fill=None, fmt=None, bold=False, color=None):
    for row in ws[ref] if ":" in ref else [[ws[ref]]]:
        for c in row:
            c.font = Font(name=FONT, bold=bold, color=color)
            c.border = BOX
            if fill: c.fill = fill
            if fmt: c.number_format = fmt


def header(ws, row, labels, widths=None):
    for i, t in enumerate(labels):
        c = ws.cell(row=row, column=i + 1, value=t)
        c.font = Font(name=FONT, bold=True, color="FFFFFF")
        c.fill = HEAD
        c.border = BOX
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    for i, w in enumerate(widths or []):
        ws.column_dimensions[chr(65 + i)].width = w


def holiday_sheet(wb, title="假日"):
    ws = wb.create_sheet(title)
    ws["A1"], ws["B1"] = "日期", "名稱"
    style(ws, "A1:B1", HEAD, bold=True, color="FFFFFF")
    for i, (k, name) in enumerate(sorted(HOL.items()), start=2):
        ws.cell(row=i, column=1, value=dt.date.fromisoformat(k)).number_format = DATE
        ws.cell(row=i, column=2, value=name)
    ws.column_dimensions["A"].width = 14
    ws.column_dimensions["B"].width = 18
    ws["D1"] = "政府行政機關辦公日曆表 2026～2027 年的國定假日與補假。民間企業補假日期可能不同，請依公司公告增刪。"
    ws["D1"].font = Font(name=FONT, size=10, color="6B6F78")
    return ws


# ---------------- 1. 所得稅 ----------------
def income_tax():
    wb = book(); ws = wb.active; ws.title = "試算"
    base(ws, "115 年度綜合所得稅試算（116 年 5 月申報）",
         "簡化試算：全部合併計稅，未含分開計稅、股利、儲蓄投資等項目；基本生活費暫用 114 年度 213,000 元。")
    ws.column_dimensions["A"].width = 34; ws.column_dimensions["B"].width = 16; ws.column_dimensions["C"].width = 44
    rows = [
        # (label, value/formula, kind, note)
        ("申報身分", "單身", "in", "選「單身」或「已婚」"),
        ("本人全年薪資", 600000, "in", ""),
        ("配偶全年薪資", 0, "in", "單身填 0"),
        ("其他所得（利息、租金等）", 0, "in", "全戶合計"),
        ("一般免稅人數", 1, "in", "本人、配偶及一般受扶養親屬（未滿 70 歲、已成年）"),
        ("70 歲以上或未成年子女人數", 0, "in", "免稅額 151,500 元的人數（含本人、配偶）"),
        ("其中 6 歲以下子女人數", 0, "in", "幼兒學前特別扣除額"),
        ("列舉扣除額合計", 0, "in", "沒有就填 0，會自動比較標準扣除額"),
        ("全年房租", 0, "in", "全家無自有房屋、租屋自住才填；扣除上限 18 萬"),
        ("已被扣繳的稅款", 0, "in", "看扣繳憑單，算退補稅用"),
        (None,),
        ("所得總額", "=B6+B7+B8", "out", ""),
        ("免稅額", "=B9*101000+B10*151500", "out", ""),
        ("一般扣除額（標準或列舉取大）", '=MAX(IF(B5="已婚",272000,136000),B12)', "out", ""),
        ("薪資所得特別扣除額", "=MIN(B6,227000)+MIN(B7,227000)", "out", ""),
        ("幼兒學前＋房屋租金特別扣除額", '=IF(B11>0,150000+(B11-1)*225000,0)+MIN(B13,180000)', "out", "適用稅率 20% 以上不適用"),
        ("基本生活費差額", "=MAX(0,213000*(B9+B10)-(B17+B18+B20))", "out", ""),
        ("淨額（含幼兒、租金扣除）", "=MAX(0,B16-B17-B18-B19-B20-B21)", "out", ""),
        ("適用以上扣除後稅率", "=VLOOKUP(B22,級距!$A$2:$C$6,2,TRUE)", "out", ""),
        ("綜合所得淨額", "=IF(B23>=0.2,MAX(0,B16-B17-B18-B19-MAX(0,213000*(B9+B10)-(B17+B18))),B22)", "out", "稅率 20% 以上時，扣除額改為不含幼兒、租金"),
        ("適用稅率", "=VLOOKUP(B24,級距!$A$2:$C$6,2,TRUE)", "out", ""),
        ("應納稅額", "=ROUND(MAX(0,B24*B25-VLOOKUP(B24,級距!$A$2:$C$6,3,TRUE)),0)", "out", ""),
        ("退稅（正數）／補稅（負數）", "=B14-B26", "out", ""),
    ]
    r = 5
    for item in rows:
        if item[0] is None:
            r += 1; continue
        label, val, kind, note = item
        ws.cell(row=r, column=1, value=label); ws.cell(row=r, column=2, value=val); ws.cell(row=r, column=3, value=note)
        style(ws, f"A{r}", bold=(kind == "out" and label in ("應納稅額", "退稅（正數）／補稅（負數）")))
        fmt = "0%" if "稅率" in label else (None if label == "申報身分" or "人數" in label else MONEY)
        style(ws, f"B{r}", INPUT if kind == "in" else OUTF, fmt)
        ws.cell(row=r, column=3).font = Font(name=FONT, size=10, color="6B6F78")
        r += 1
    ws["B26"].font = Font(name=FONT, bold=True, size=13)
    dv = DataValidation(type="list", formula1='"單身,已婚"', allow_blank=False); ws.add_data_validation(dv); dv.add("B5")
    pass  # 房租改為輸入金額
    ws.freeze_panes = "A5"

    lv = wb.create_sheet("級距")
    header(lv, 1, ["淨額下限", "稅率", "累進差額"], [14, 10, 12])
    for i, (lo, rate, d) in enumerate([(0, .05, 0), (610001, .12, 42700), (1380001, .2, 153100), (2770001, .3, 430100), (5190001, .4, 949100)], start=2):
        lv.cell(row=i, column=1, value=lo).number_format = MONEY
        lv.cell(row=i, column=2, value=rate).number_format = "0%"
        lv.cell(row=i, column=3, value=d).number_format = MONEY
    lv["E1"] = "115 年度課稅級距（財政部公告）。應納稅額 ＝ 淨額 × 稅率 − 累進差額。"
    wb.save(f"{OUT}/fangjiatw-income-tax-115.xlsx")


# ---------------- 2. 特休 ----------------
def annual_leave():
    wb = book(); ws = wb.active; ws.title = "特休"
    base(ws, "員工特休天數計算表（勞基法第 38 條，週年制）", "填入姓名、到職日與月薪，會自動算出年資、今年特休、下次增加日與未休特休工資。")
    header(ws, 5, ["姓名", "到職日", "計算日", "年資（月）", "年資", "目前特休（天）", "下次增加日", "下次特休（天）", "月薪", "已休（天）", "未休（天）", "未休工資"],
           [12, 12, 12, 10, 14, 12, 12, 12, 12, 10, 10, 12])
    samples = [("王小明", dt.date(2020, 8, 31), 45000, 5), ("陳小華", dt.date(2024, 3, 15), 38000, 2), ("林大同", dt.date(2013, 1, 2), 60000, 10)]
    for i in range(20):
        r = 6 + i
        if i < len(samples):
            n, d, s, used = samples[i]
            ws.cell(row=r, column=1, value=n); ws.cell(row=r, column=2, value=d); ws.cell(row=r, column=9, value=s); ws.cell(row=r, column=10, value=used)
        ws[f"C{r}"] = f'=IF(B{r}="","",TODAY())'
        ws[f"D{r}"] = f'=IF(B{r}="","",DATEDIF(B{r},C{r},"M"))'
        ws[f"E{r}"] = f'=IF(B{r}="","",INT(D{r}/12)&" 年 "&MOD(D{r},12)&" 個月")'
        ws[f"F{r}"] = f'=IF(B{r}="","",IF(D{r}<6,0,IF(D{r}<12,3,IF(D{r}<24,7,IF(D{r}<36,10,IF(D{r}<60,14,IF(D{r}<120,15,MIN(30,6+INT(D{r}/12)))))))))'
        ws[f"G{r}"] = f'=IF(B{r}="","",IF(D{r}<6,EDATE(B{r},6),EDATE(B{r},(INT(D{r}/12)+1)*12)))'
        m = f"IF(D{r}<6,6,(INT(D{r}/12)+1)*12)"
        ws[f"H{r}"] = f'=IF(B{r}="","",IF({m}<12,3,IF({m}<24,7,IF({m}<36,10,IF({m}<60,14,IF({m}<120,15,MIN(30,6+INT({m}/12))))))))'
        ws[f"K{r}"] = f'=IF(B{r}="","",MAX(0,F{r}-J{r}))'
        ws[f"L{r}"] = f'=IF(OR(B{r}="",I{r}=""),"",ROUND(I{r}/30*K{r},0))'
        for col, fill, fmt in [("A", INPUT, None), ("B", INPUT, DATE), ("C", OUTF, DATE), ("D", OUTF, None), ("E", OUTF, None), ("F", OUTF, None),
                               ("G", OUTF, DATE), ("H", OUTF, None), ("I", INPUT, MONEY), ("J", INPUT, None), ("K", OUTF, None), ("L", OUTF, MONEY)]:
            style(ws, f"{col}{r}", fill, fmt)
    ws.freeze_panes = "B6"
    ws["A27"] = "特休天數：滿 6 個月 3 天、1 年 7 天、2 年 10 天、3 年 14 天、5 年 15 天，滿 10 年起每年加 1 天，最多 30 天。未休工資以月薪 ÷ 30 估算。"
    ws["A27"].font = Font(name=FONT, size=10, color="6B6F78")
    wb.save(f"{OUT}/fangjiatw-annual-leave.xlsx")


# ---------------- 3. 加班費 ----------------
def overtime():
    wb = book(); ws = wb.active; ws.title = "加班紀錄"
    base(ws, "加班費計算表（勞基法第 24、39 條）", "填入月薪後，每次加班記一列：日期、類型、時數，會自動算出加班費與當月合計。")
    ws["A5"], ws["B5"] = "月薪", 36000
    ws["A6"], ws["B6"] = "時薪（月薪 ÷ 240）", "=B5/240"
    ws["A7"], ws["B7"] = "本月加班費合計", "=SUM(D11:D60)"
    style(ws, "A5:A7", bold=True); style(ws, "B5", INPUT, MONEY); style(ws, "B6", OUTF, '#,##0.00'); style(ws, "B7", OUTF, MONEY)
    ws["B7"].font = Font(name=FONT, bold=True, size=13)
    header(ws, 10, ["日期", "類型", "時數", "加班費", "說明"], [14, 12, 8, 12, 44])
    samples = [(dt.date(2027, 3, 2), "平日", 3), (dt.date(2027, 3, 6), "休息日", 9), (dt.date(2027, 4, 5), "國定假日", 10)]
    for i in range(50):
        r = 11 + i
        if i < len(samples):
            d, t, h = samples[i]
            ws.cell(row=r, column=1, value=d); ws.cell(row=r, column=2, value=t); ws.cell(row=r, column=3, value=h)
        h = f"MIN(C{r},12)"
        ws[f"D{r}"] = (f'=IF(OR(B{r}="",C{r}=""),"",ROUND($B$6*IF(B{r}="平日",MIN(C{r},2)*4/3+MAX(MIN(C{r},4)-2,0)*5/3,'
                       f'IF(B{r}="休息日",MIN({h},2)*4/3+MAX(MIN({h},8)-2,0)*5/3+MAX({h}-8,0)*8/3,'
                       f'IF(B{r}="國定假日",8+MIN(MAX({h}-8,0),2)*4/3+MAX(MIN(MAX({h}-8,0),4)-2,0)*5/3,0))),0))')
        ws[f"E{r}"] = (f'=IF(B{r}="平日","前 2 小時 ×1⅓，第 3～4 小時 ×1⅔（每天最多 4 小時）",IF(B{r}="休息日","前 2 小時 ×1⅓，3～8 小時 ×1⅔，9～12 小時 ×2⅔",'
                       f'IF(B{r}="國定假日","加發 1 日工資，超過 8 小時同平日加班","")))')
        style(ws, f"A{r}", INPUT, DATE); style(ws, f"B{r}", INPUT); style(ws, f"C{r}", INPUT); style(ws, f"D{r}", OUTF, MONEY); style(ws, f"E{r}")
        ws[f"E{r}"].font = Font(name=FONT, size=9, color="6B6F78")
    dv = DataValidation(type="list", formula1='"平日,休息日,國定假日"', allow_blank=True); ws.add_data_validation(dv); dv.add("B11:B60")
    ws["A8"] = "國定假日、補假日期可對照「假日」工作表；民間企業補假日期可能不同。"
    ws["A8"].font = Font(name=FONT, size=10, color="6B6F78")
    ws.freeze_panes = "A11"
    holiday_sheet(wb)
    wb.save(f"{OUT}/fangjiatw-overtime.xlsx")


# ---------------- 4. 工作天數 ----------------
def workdays():
    wb = book(); ws = wb.active; ws.title = "工作天數"
    base(ws, "工作天數計算表（扣除台灣國定假日，2026～2027）", "填入開始日與結束日，自動扣掉週末與「假日」工作表裡的國定假日、補假。")
    header(ws, 5, ["項目", "開始日", "結束日", "工作天數（週休二日）", "工作天數（只休週日）", "日曆天數"], [20, 12, 12, 16, 16, 10])
    samples = [("2027 年 2 月", dt.date(2027, 2, 1), dt.date(2027, 2, 28)), ("2026 全年", dt.date(2026, 1, 1), dt.date(2026, 12, 31)),
               ("2027 全年", dt.date(2027, 1, 1), dt.date(2027, 12, 31))]
    for i in range(15):
        r = 6 + i
        if i < len(samples):
            n, a, b = samples[i]
            ws.cell(row=r, column=1, value=n); ws.cell(row=r, column=2, value=a); ws.cell(row=r, column=3, value=b)
        ws[f"D{r}"] = f'=IF(OR(B{r}="",C{r}=""),"",NETWORKDAYS(B{r},C{r},假日!$A$2:$A$200))'
        ws[f"E{r}"] = f'=IF(OR(B{r}="",C{r}=""),"",_xlfn.NETWORKDAYS.INTL(B{r},C{r},"0000001",假日!$A$2:$A$200))'
        ws[f"F{r}"] = f'=IF(OR(B{r}="",C{r}=""),"",C{r}-B{r}+1)'
        style(ws, f"A{r}", INPUT); style(ws, f"B{r}", INPUT, DATE); style(ws, f"C{r}", INPUT, DATE)
        for c in "DEF": style(ws, f"{c}{r}", OUTF)
    ws["A23"] = "幾個工作天後是哪天？"; ws["A23"].font = Font(name=FONT, bold=True)
    header_row = 24
    for i, t in enumerate(["起始日", "工作天數", "到期日", "星期"]):
        c = ws.cell(row=header_row, column=i + 1, value=t); c.font = Font(name=FONT, bold=True, color="FFFFFF"); c.fill = HEAD; c.border = BOX
    ws["A25"], ws["B25"] = dt.date(2027, 2, 1), 10
    ws["C25"] = '=IF(OR(A25="",B25=""),"",WORKDAY(A25,B25,假日!$A$2:$A$200))'
    ws["D25"] = '=IF(C25="","",MID("日一二三四五六",WEEKDAY(C25),1))'
    style(ws, "A25", INPUT, DATE); style(ws, "B25", INPUT); style(ws, "C25", OUTF, DATE); style(ws, "D25", OUTF)
    ws["A27"] = "NETWORKDAYS 包含開始日與結束日；WORKDAY 從起始日的下一個工作天開始數。2026、2027 年沒有補班日。"
    ws["A27"].font = Font(name=FONT, size=10, color="6B6F78")
    holiday_sheet(wb)
    wb.save(f"{OUT}/fangjiatw-workdays.xlsx")


if __name__ == "__main__":
    import os
    os.makedirs(OUT, exist_ok=True)
    income_tax(); annual_leave(); overtime(); workdays()
    print("ok", sorted(os.listdir(OUT)))
