# 產生連假文章的「請假攻略圖卡」（1080 寬直式 PNG，可存圖轉傳），並插進對應文章。
# 執行（repo 根目錄）：PYTHONPATH=C:/Users/Administrator/tools/pylib python _src/build_info.py
# 放假資料讀 assets/holiday.js（人事行政總處辦公日曆表）；連休天數由程式重新計算，和 PLANS 寫的天數不符就中止。
import datetime as dt, io, re
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = "C:/Users/Administrator/tools/fonts/"
F = lambda w, s: ImageFont.truetype(FONT_DIR + f"NotoSansTC-{w}.otf", s)
PAPER, SHEET, INK, MUTED, RULE = "#fbfbf8", "#ffffff", "#1d1f24", "#6b6f78", "#e3e2dc"
RED, RED_SOFT, MAKEUP, LEAVE, LEAVE_SOFT = "#c8102e", "#fde8ea", "#e8833a", "#0f7b6c", "#dff3ef"
W = 1080

js = io.open("assets/holiday.js", encoding="utf-8").read()
HOL = {k: (n, t) for k, n, t in re.findall(r'"(\d{4}-\d\d-\d\d)":\["([^"]+)","([hm])"\]', js)}
SHORT = {"春節 初一": "初一", "春節 初二": "初二", "春節 初三": "初三", "行憲紀念日": "行憲", "和平紀念日": "228",
         "清明節": "清明", "國慶日": "國慶", "臺灣光復節": "光復節", "中秋節": "中秋", "端午節": "端午"}
def label(name):
    return "補假" if name.endswith("補假") else SHORT.get(name, name)

# 每篇文章的最佳方案（和文章內 PLANS 的 best:true 一致）
PLANS = [
    ("2026/xingxian", "2026 行憲紀念日連跨年", ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31"], 10),
    ("2027/yuandan", "2027 元旦跨年連假", ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31"], 10),
    ("2027/chunjie", "2027 春節連假", ["2027-02-11", "2027-02-12"], 11),
    ("2027/hanjia", "2027 寒假＋春節", ["2027-02-01", "2027-02-02", "2027-02-03"], 12),
    ("2027/228", "2027 228 連假", ["2027-03-02", "2027-03-03", "2027-03-04", "2027-03-05"], 9),
    ("2027/qingming", "2027 兒童節＋清明連假", ["2027-04-07", "2027-04-08", "2027-04-09"], 9),
    ("2027/laodong", "2027 勞動節連假", ["2027-04-26", "2027-04-27", "2027-04-28", "2027-04-29"], 9),
    ("2027/guoqing", "2027 國慶連假", ["2027-10-12", "2027-10-13", "2027-10-14", "2027-10-15"], 9),
    ("2027/guangfu", "2027 光復節連假", ["2027-10-26", "2027-10-27", "2027-10-28", "2027-10-29"], 9),
    ("2027/xingxian", "2027 年底行憲跨年連假", ["2027-12-27", "2027-12-28", "2027-12-29", "2027-12-30"], 10),
]
DOW = "日一二三四五六"
D = lambda s: dt.date.fromisoformat(s)
iso = lambda d: d.isoformat()
off = lambda d, lv: d.weekday() >= 5 or iso(d) in HOL or iso(d) in lv
md = lambda d: f"{d.month}/{d.day}（{DOW[(d.weekday() + 1) % 7]}）"

def span(leave):
    lv = set(leave); a = D(min(leave)); b = D(max(leave))
    while off(a - dt.timedelta(1), lv): a -= dt.timedelta(1)
    while off(b + dt.timedelta(1), lv): b += dt.timedelta(1)
    return a, b

def draw_card(title, leave, out):
    lv = set(leave); a, b = span(leave); days = (b - a).days + 1
    start = a - dt.timedelta((a.weekday() + 1) % 7)            # 從週日開始
    end = b + dt.timedelta(6 - (b.weekday() + 1) % 7)
    rows = ((end - start).days + 1) // 7
    cell, gap, x0 = 132, 8, (W - (7 * 132 + 6 * 8)) // 2
    top = 372
    H = top + 60 + rows * (cell + gap) + 520
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 16], fill=RED)
    d.text((x0, 70), title, font=F("Bold", 40), fill=MUTED)
    hf = F("Black", 120)
    d.text((x0, 120), f"請 {len(leave)} 休 {days}", font=hf, fill=INK)
    hw = d.textlength(f"請 {len(leave)} 休 {days}", font=hf)
    d.text((x0 + hw + 24, 205), "天", font=F("Black", 56), fill=INK)
    d.text((x0, 278), f"{md(a)} ～ {md(b)}　連休 {days} 天", font=F("Bold", 38), fill=RED)
    # 星期列
    for i, ch in enumerate(DOW):
        d.text((x0 + i * (cell + gap) + cell / 2, top + 26), ch, font=F("Bold", 28), fill=RED if i in (0, 6) else MUTED, anchor="mm")
    y = top + 60
    nf, lf = F("Black", 46), F("Bold", 24)
    cur = start
    for r in range(rows):
        for c in range(7):
            k = iso(cur); x = x0 + c * (cell + gap); inside = a <= cur <= b
            h = HOL.get(k)
            if k in lv: bg, fg, tag = LEAVE, "#ffffff", "請假"
            elif h and h[1] == "h": bg, fg, tag = RED, "#ffffff", label(h[0])
            elif h: bg, fg, tag = RED_SOFT, RED, "補假"
            elif cur.weekday() >= 5: bg, fg, tag = (RED_SOFT if inside else SHEET), RED, "週末" if inside else ""
            else: bg, fg, tag = SHEET, INK, "上班" if not inside else ""
            if not inside and k not in lv:
                bg, fg = SHEET, "#b9bcc3"; tag = "" if cur.weekday() >= 5 or h else "上班"
            d.rounded_rectangle([x, y, x + cell, y + cell], radius=12, fill=bg, outline=RULE if bg == SHEET else (MAKEUP if tag == "補假" else bg), width=2 if tag == "補假" else 1)
            dl = f"{cur.month}/{cur.day}" if (cur.day == 1 or (r == 0 and c == 0)) else str(cur.day)
            d.text((x + cell / 2, y + 54), dl, font=nf if len(dl) <= 2 else F("Black", 38), fill=fg, anchor="mm")
            if tag: d.text((x + cell / 2, y + 104), tag, font=lf, fill=fg if tag != "上班" else "#b9bcc3", anchor="mm")
            cur += dt.timedelta(1)
        y += cell + gap
    # 圖例
    y += 24; lx = x0
    for color, outline, txt in [(RED, RED, "國定假日"), (RED_SOFT, MAKEUP, "補假"), (RED_SOFT, RED_SOFT, "週末"), (LEAVE, LEAVE, "要請假")]:
        d.rounded_rectangle([lx, y, lx + 34, y + 34], radius=6, fill=color, outline=outline, width=2)
        d.text((lx + 46, y + 17), txt, font=F("Medium", 28), fill=INK, anchor="lm"); lx += 46 + d.textlength(txt, font=F("Medium", 28)) + 40
    # 數字
    y += 70; bw = (W - 2 * x0 - 2 * 16) / 3
    for i, (big, small) in enumerate([(f"{len(leave)} 天", "要請的特休"), (f"{days} 天", "連續休假"), (f"{days / len(leave):.2f}".rstrip("0").rstrip(".") + " 天", "每請 1 天換")]):
        bx = x0 + i * (bw + 16)
        d.rounded_rectangle([bx, y, bx + bw, y + 120], radius=12, fill=SHEET, outline=RULE)
        d.text((bx + bw / 2, y + 46), big, font=F("Black", 48), fill=LEAVE if i == 0 else INK, anchor="mm")
        d.text((bx + bw / 2, y + 94), small, font=F("Medium", 26), fill=MUTED, anchor="mm")
    y += 150
    d.text((x0, y), "依人事行政總處辦公日曆表，以週休二日上班族計算；民間企業補假日期依公司公告。", font=F("Medium", 24), fill=MUTED)
    y += 56
    lf2 = F("Black", 40)
    d.text((x0, y + 20), "放假", font=lf2, fill=INK, anchor="lm")
    d.text((x0 + d.textlength("放假", font=lf2), y + 20), "日曆", font=lf2, fill=RED, anchor="lm")
    d.text((W - x0, y + 22), "fangjiatw.com", font=F("Medium", 28), fill=MUTED, anchor="rm")
    im = im.crop((0, 0, W, y + 70))
    im.quantize(colors=64, method=Image.Quantize.MEDIANCUT).save(out, optimize=True)
    return a, b, days, im.size

import os
os.makedirs("assets/info", exist_ok=True)
CSS = ".info{margin:0;display:grid;gap:6px}.info img{width:100%;max-width:540px;height:auto;border:1px solid var(--rule);border-radius:8px;display:block}.info figcaption{color:var(--muted);font-size:.85rem}"
for page, title, leave, want in PLANS:
    name = page.replace("/", "-")
    a, b, days, (w, h) = draw_card(title, leave, f"assets/info/{name}.png")
    assert days == want, (page, days, want)
    f = page + "/index.html"; s = io.open(f, encoding="utf-8", newline="").read()
    alt = f"{title}請假圖解：請 {len(leave)} 天特休，{a.month}/{a.day}～{b.month}/{b.day} 連休 {days} 天"
    fig = (f'<figure class="info"><img src="/assets/info/{name}.png?v={dt.date.today():%Y%m%d}" width="{w}" height="{h}" loading="lazy" alt="{alt}">'
           f'<figcaption>{alt}。手機長按圖片可存圖分享。</figcaption></figure>')
    s = re.sub(r'\n    <figure class="info">.*?</figure>', "", s)
    i = s.index('<div class="plans" id="plans">')
    s = s[:i] + fig + "\n    " + s[i:]
    if ".info{" not in s:
        s = s.replace("</head>", f"<style>{CSS}</style>\n</head>", 1)
    io.open(f, "w", encoding="utf-8", newline="").write(s)
    print(page, f"{a}~{b}", days, (w, h))

# 其他文章沿用同一張圖：(文章, 圖檔名, 插在這段文字之前)
REUSE = [("2027/chunjie-stay", "2027-chunjie", "<p><b>最推薦「請 2 休 11」</b>")]
for page, name, anchor in REUSE:
    f = page + "/index.html"; s = io.open(f, encoding="utf-8", newline="").read()
    w, h = Image.open(f"assets/info/{name}.png").size
    alt = "2027 春節連假請假圖解：請 2 天特休，2/4～2/14 連休 11 天"
    fig = (f'<figure class="info"><img src="/assets/info/{name}.png?v={dt.date.today():%Y%m%d}" width="{w}" height="{h}" loading="lazy" alt="{alt}">'
           f'<figcaption>{alt}。手機長按圖片可存圖分享。</figcaption></figure>')
    s = re.sub(r'\n    <figure class="info">.*?</figure>', "", s)
    i = s.index(anchor); s = s[:i] + fig + "\n    " + s[i:]
    if ".info{" not in s: s = s.replace("</head>", f"<style>{CSS}</style>\n</head>", 1)
    io.open(f, "w", encoding="utf-8", newline="").write(s); print("reuse", page)

# ---------------- 2027 全年請假總覽圖卡（首頁、2027 請假攻略用） ----------------
# (名稱, 要請的日期, 預期連休天數)；和 2027/qingjia 文章的「最划算請法」一致
YEAR = [
    ("元旦跨年", ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31"], 10),
    ("春節", ["2027-02-11", "2027-02-12"], 11),
    ("228 和平紀念日", ["2027-03-02", "2027-03-03", "2027-03-04", "2027-03-05"], 9),
    ("兒童節・清明節", ["2027-04-07", "2027-04-08", "2027-04-09"], 9),
    ("勞動節", ["2027-04-26", "2027-04-27", "2027-04-28", "2027-04-29"], 9),
    ("端午節", ["2027-06-07", "2027-06-08"], 5),
    ("中秋節", ["2027-09-13", "2027-09-14"], 5),
    ("教師節", ["2027-09-27"], 4),
    ("國慶日", ["2027-10-12", "2027-10-13", "2027-10-14", "2027-10-15"], 9),
    ("臺灣光復節", ["2027-10-26", "2027-10-27", "2027-10-28", "2027-10-29"], 9),
    ("行憲紀念日跨年", ["2027-12-27", "2027-12-28", "2027-12-29", "2027-12-30"], 10),
]

def leave_txt(leave):
    ds = [D(x) for x in leave]
    if len(ds) > 2 and (ds[-1] - ds[0]).days == len(ds) - 1:
        return f"{ds[0].month}/{ds[0].day}～{ds[-1].month}/{ds[-1].day}"
    return "、".join(f"{d.month}/{d.day}" for d in ds)

def draw_year(out):
    rows = []
    for name, leave, want in YEAR:
        a, b = span(leave); days = (b - a).days + 1
        assert days == want, (name, days, want)
        rows.append((name, leave, a, b, days))
    best = max(rows, key=lambda r: r[4] / len(r[1]))
    x0, rh, gap = 56, 112, 12
    H = 330 + len(rows) * (rh + gap) + 420
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 16], fill=RED)
    d.text((x0, 64), "2027 全年請假攻略", font=F("Black", 84), fill=INK)
    d.text((x0, 178), "11 個假期，每個怎麼請最划算", font=F("Bold", 40), fill=RED)
    d.text((x0, 240), "依人事行政總處 116 年辦公日曆表　全年 121 天假、0 天補班", font=F("Medium", 28), fill=MUTED)
    y = 310
    for name, leave, a, b, days in rows:
        hi = (name, a) == (best[0], best[2])
        d.rounded_rectangle([x0, y, W - x0, y + rh], radius=14, fill=RED_SOFT if hi else SHEET, outline=RED if hi else RULE, width=2 if hi else 1)
        # 左：月份方塊
        d.rounded_rectangle([x0 + 14, y + 14, x0 + 14 + 84, y + rh - 14], radius=10, fill=RED if hi else INK)
        d.text((x0 + 56, y + rh / 2 - 2), f"{a.month if a.year == 2027 or name != '元旦跨年' else 1}月", font=F("Black", 30), fill="#ffffff", anchor="mm")
        # 中：名稱與日期
        tx = x0 + 124
        d.text((tx, y + 20), name, font=F("Bold", 36), fill=INK)
        if hi:
            tw = d.textlength(name, font=F("Bold", 36))
            d.rounded_rectangle([tx + tw + 14, y + 24, tx + tw + 14 + 150, y + 62], radius=19, fill=RED)
            d.text((tx + tw + 89, y + 43), "CP 值最高", font=F("Bold", 24), fill="#ffffff", anchor="mm")
        d.text((tx, y + 70), f"請 {leave_txt(leave)}　連休 {a.month}/{a.day}～{b.month}/{b.day}", font=F("Medium", 26), fill=MUTED)
        # 右：請 X 休 Y
        rx = W - x0 - 24; big, small = F("Black", 56), F("Bold", 30)
        parts = [("請 ", small, MUTED), (str(len(leave)), big, LEAVE), (" 休 ", small, MUTED), (str(days), big, RED)]
        total = sum(d.textlength(t, font=f) for t, f, _ in parts); cx = rx - total
        for t, f, c in parts:
            d.text((cx, y + rh / 2), t, font=f, fill=c, anchor="lm"); cx += d.textlength(t, font=f)
        y += rh + gap
    # 特休 7 天推薦
    y += 20
    d.rounded_rectangle([x0, y, W - x0, y + 190], radius=14, fill=LEAVE_SOFT, outline=LEAVE, width=2)
    d.text((x0 + 30, y + 30), "只有 7 天特休？這樣排最划算", font=F("Black", 38), fill=LEAVE)
    d.text((x0 + 30, y + 92), "春節請 2 天＋教師節請 1 天＋年底請 4 天", font=F("Bold", 32), fill=INK)
    d.text((x0 + 30, y + 140), "排出 3 段長假，連續休假合計 25 天", font=F("Bold", 32), fill=INK)
    y += 230
    d.text((x0, y), "以週一到週五上班、週休二日的上班族計算；民間企業補假日期依公司公告。", font=F("Medium", 24), fill=MUTED)
    y += 56
    lf2 = F("Black", 40)
    d.text((x0, y + 20), "放假", font=lf2, fill=INK, anchor="lm")
    d.text((x0 + d.textlength("放假", font=lf2), y + 20), "日曆", font=lf2, fill=RED, anchor="lm")
    d.text((W - x0, y + 22), "fangjiatw.com", font=F("Medium", 28), fill=MUTED, anchor="rm")
    im = im.crop((0, 0, W, y + 70))
    im.quantize(colors=64, method=Image.Quantize.MEDIANCUT).save(out, optimize=True)
    return im.size

yw, yh = draw_year("assets/info/2027-year.png")
print("year card", (yw, yh))
# 插進首頁「2027 連假一覽」和 2027 請假攻略（插在指定文字之前；重跑會先移除舊的）
YALT = "2027 全年請假攻略圖：11 個假期最划算請法，春節請 2 休 11、清明請 3 休 9、教師節請 1 休 4、年底請 4 休 10"
for f, anchor in [("index.html", '    <p class="singles">'), ("2027/qingjia/index.html", '    <p class="note">12/31（五）放假是因為')]:
    s = io.open(f, encoding="utf-8", newline="").read()
    s = re.sub(r'    <figure class="info year">.*?</figure>\n', "", s, flags=re.S)
    cap = (f'<figcaption>{YALT}。手機長按圖片可存圖分享。</figcaption>' if f != "index.html" else
           '<figcaption><b>一張圖看懂 2027 怎麼請假</b><span>11 個假期的最划算請法、要請哪幾天、能連休幾天，全部整理在這張圖。春節請 2 天就能休 11 天，是全年 CP 值最高的連假。</span>'
           '<span>手機長按圖片就能存圖，傳給家人朋友一起排假。</span><a href="/2027/qingjia/">看 2027 請假攻略：特休 3～14 天怎麼排 →</a></figcaption>')
    fig = (f'    <figure class="info year"><img src="/assets/info/2027-year.png?v={dt.date.today():%Y%m%d}" width="{yw}" height="{yh}" loading="lazy" alt="{YALT}">'
           f'{cap}</figure>\n')
    i = s.index(anchor); s = s[:i] + fig + s[i:]
    if ".info{" not in s: s = s.replace("</head>", f"<style>{CSS}</style>\n</head>", 1)
    if f == "index.html" and ".info.year{" not in s:  # 首頁：桌機左圖右文，手機上下排
        s = s.replace("</head>", "<style>.info.year{margin-top:20px;grid-template-columns:minmax(0,400px) minmax(0,1fr);gap:28px;align-items:center}"
                      ".info.year figcaption{display:grid;gap:12px;font-size:1rem;color:var(--muted)}.info.year figcaption b{font-size:1.35rem;color:var(--ink)}"
                      ".info.year figcaption a{font-weight:700}@media (max-width:720px){.info.year{grid-template-columns:1fr}}</style>\n</head>", 1)
    io.open(f, "w", encoding="utf-8", newline="").write(s); print("year card ->", f)
