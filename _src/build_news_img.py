# 生活時事文章的重點數字圖（1200×630，可當文內圖與社群縮圖）。數字只從這裡的資料讀，不手打在圖上。
# 輸出 assets/news/<slug>.webp（文內圖）與 .jpg（og:image）；build-news.mjs 看到檔案就會自動放進文章。
# 執行（repo 根目錄）：PYTHONPATH=C:/Users/Administrator/tools/pylib python _src/build_news_img.py [輸出資料夾]
import os, sys
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = "C:/Users/Administrator/tools/fonts/"
W, H = 1200, 630
PAPER, INK, MUTED, RULE, WHITE = "#F8FAF8", "#202B26", "#5F6E66", "#E1E9E4", "#FFFFFF"
BRAND, BRAND_SOFT, ACCENT, ACCENT_SOFT = "#176B50", "#E7F4ED", "#A8521F", "#FBEDE3"
F = lambda w, s: ImageFont.truetype(FONT_DIR + f"NotoSansTC-{w}.otf", s)

IMGS = {
  "2027-minimum-wage": {
    "kicker": "生活時事整理",
    "title": "2027 最低工資調漲",
    "badge": "2027/1/1 起生效",
    "cards": [   # (標題, 舊值, 新值, 單位, 增加, 圖示)
      ("每月最低工資", "29,500", "30,900", "元", "＋1,400 元（＋4.745%）", "coins"),
      ("每小時最低工資", "196", "205", "元", "＋9 元", "clock"),
    ],
    "facts": [("trend", "連續第 11 年調漲"), ("bill", "月薪首度超過 3 萬"), ("people", "約 261 萬名勞工受惠")],
    "source": "資料來源：勞動部、行政院　查證 2026/11/11",
  },
}

# ---- 圖示：在 4 倍大的透明畫布上畫，再縮小貼上（PIL 本身不做反鋸齒）----
GOLD, GOLD_DARK = "#E9B44C", "#B9832A"

def icon(name, size):
    S = size * 4; im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    u = S / 100   # 以 0～100 的座標作畫
    R = lambda *a: [v * u for v in a]
    if name in ("coins", "clock"):   # 卡片右上角的大圖示：淺綠圓底
        d.ellipse(R(0, 0, 100, 100), fill=BRAND_SOFT)
    if name == "coins":
        for k, y in enumerate((62, 50, 38)):
            d.ellipse(R(24, y, 76, y + 22), fill=GOLD_DARK)
            d.rectangle(R(24, y + 4, 76, y + 11), fill=GOLD_DARK)
            d.ellipse(R(24, y - 7, 76, y + 15), fill=GOLD, outline=GOLD_DARK, width=int(2 * u))
        d.text((50 * u, 41 * u), "$", font=F("Black", int(16 * u)), fill=GOLD_DARK, anchor="mm")
    elif name == "clock":
        d.ellipse(R(20, 20, 80, 80), fill=WHITE, outline=BRAND, width=int(6 * u))
        for a, b in (((50, 29), (50, 36)), ((50, 64), (50, 71)), ((29, 50), (36, 50)), ((64, 50), (71, 50))):
            d.line(R(*a, *b), fill=MUTED, width=int(3 * u))
        d.line(R(50, 50, 50, 33), fill=BRAND, width=int(6 * u))
        d.line(R(50, 50, 63, 58), fill=ACCENT, width=int(6 * u))
        d.ellipse(R(45, 45, 55, 55), fill=BRAND)
    elif name == "trend":
        d.line(R(8, 80, 36, 52, 54, 66, 86, 28), fill=ACCENT, width=int(11 * u), joint="curve")
        d.polygon(R(64, 22, 94, 18, 90, 48), fill=ACCENT)
    elif name == "bill":
        d.rounded_rectangle(R(4, 24, 96, 78), radius=8 * u, fill=BRAND)
        d.rounded_rectangle(R(12, 32, 88, 70), radius=5 * u, outline=BRAND_SOFT, width=int(3 * u))
        d.ellipse(R(38, 37, 62, 65), fill=BRAND_SOFT)
    elif name == "people":
        for cx, c in ((34, MUTED), (64, BRAND)):
            d.ellipse(R(cx - 13, 14, cx + 13, 40), fill=c)
            d.pieslice(R(cx - 26, 46, cx + 26, 112), 180, 360, fill=c)
    elif name == "calendar":
        d.rounded_rectangle(R(10, 18, 90, 92), radius=10 * u, fill=WHITE)
        d.rectangle(R(10, 34, 90, 40), fill=ACCENT)
        for x in (30, 70): d.rounded_rectangle(R(x - 5, 6, x + 5, 28), radius=4 * u, fill=WHITE)
        for x in (24, 44, 64):
            for y in (50, 68): d.rectangle(R(x, y, x + 12, y + 11), fill=ACCENT)
    return im.resize((size, size), Image.LANCZOS)

def paste(im, ic, x, y):
    im.paste(ic, (int(x), int(y)), ic)

def pill(d, x, y, text, font, fg, bg, anchor_right=False):
    w = d.textlength(text, font=font) + 40
    if anchor_right: x -= w
    d.rounded_rectangle([x, y, x + w, y + 48], radius=24, fill=bg)
    d.text((x + w / 2, y + 24), text, font=font, fill=fg, anchor="mm")
    return w

def arrow(d, x, y, color):
    d.line([x, y, x + 34, y], fill=color, width=6)
    d.polygon([(x + 30, y - 12), (x + 48, y), (x + 30, y + 12)], fill=color)

def draw(spec, out):
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 14], fill=BRAND)
    pill(d, 64, 44, spec["kicker"], F("Bold", 26), BRAND, BRAND_SOFT)
    bf = F("Bold", 26); bw = d.textlength(spec["badge"], font=bf) + 40 + 34
    d.rounded_rectangle([W - 64 - bw, 44, W - 64, 92], radius=24, fill=ACCENT)
    paste(im, icon("calendar", 28), W - 64 - bw + 18, 54)
    d.text((W - 64 - bw + 18 + 34, 68), spec["badge"], font=bf, fill=WHITE, anchor="lm")
    d.text((64, 150), spec["title"], font=F("Black", 64), fill=INK, anchor="ls")

    # 兩張對照卡：舊值（灰）→ 新值（大字品牌綠），下方是增加幅度
    gap, top, bot = 32, 188, 448
    cw = (W - 128 - gap) / len(spec["cards"])
    # 每張卡的大數字用同一個字級：取所有卡都放得下的最大值，單位「元」不能超出卡片
    uf, of = F("Bold", 34), F("Medium", 34)
    def fits(size):
        return all(36 + d.textlength(old, font=of) + 18 + 66 + d.textlength(new, font=F("Black", size)) + 8
                   + d.textlength(unit, font=uf) <= cw - 32 for _, old, new, unit, *_ in spec["cards"])
    size = next((s for s in (84, 78, 72, 66, 60) if fits(s)), 60)
    for i, (name, old, new, unit, inc, ic) in enumerate(spec["cards"]):
        x0 = 64 + i * (cw + gap); x1 = x0 + cw
        d.rounded_rectangle([x0 + 4, top + 6, x1 + 4, bot + 6], radius=20, fill=RULE)
        d.rounded_rectangle([x0, top, x1, bot], radius=20, fill=WHITE, outline=RULE, width=2)
        d.rounded_rectangle([x0, top, x1, top + 12], radius=6, fill=BRAND)
        d.rectangle([x0, top + 6, x1, top + 12], fill=BRAND)
        d.text((x0 + 36, top + 62), name, font=F("Bold", 32), fill=INK, anchor="ls")
        paste(im, icon(ic, 72), x1 - 36 - 72, top + 24)
        # 舊值與刪除線
        ow = d.textlength(old, font=of)
        d.text((x0 + 36, top + 150), old, font=of, fill=MUTED, anchor="ls")
        d.line([x0 + 34, top + 138, x0 + 38 + ow, top + 138], fill=MUTED, width=3)
        ax = x0 + 36 + ow + 18
        arrow(d, ax, top + 138, ACCENT)
        nf = F("Black", size)
        d.text((ax + 66, top + 168), new, font=nf, fill=BRAND, anchor="ls")
        d.text((ax + 66 + d.textlength(new, font=nf) + 8, top + 168), unit, font=uf, fill=BRAND, anchor="ls")
        # 增加幅度
        incf = F("Bold", 28)
        iw = d.textlength(inc, font=incf) + 36
        d.rounded_rectangle([x0 + 36, top + 196, x0 + 36 + iw, top + 240], radius=22, fill=ACCENT_SOFT)
        d.text((x0 + 36 + iw / 2, top + 218), inc, font=incf, fill=ACCENT, anchor="mm")

    # 補充重點：每項前面一個小圖示，整排置中
    ff, isz, sp = F("Bold", 28), 34, 52
    ws = [isz + 10 + d.textlength(t, font=ff) for _, t in spec["facts"]]
    x = (W - sum(ws) - sp * (len(ws) - 1)) / 2
    for (ic, t), w in zip(spec["facts"], ws):
        paste(im, icon(ic, isz), x, 496 - isz / 2)
        d.text((x + isz + 10, 496), t, font=ff, fill=INK, anchor="lm")
        x += w + sp

    d.line([64, 536, W - 64, 536], fill=RULE, width=2)
    lf = F("Black", 36)
    d.text((64, 580), "放假", font=lf, fill=INK, anchor="lm")
    d.text((64 + d.textlength("放假", font=lf), 580), "日曆", font=lf, fill=BRAND, anchor="lm")
    d.text((64 + d.textlength("放假日曆", font=lf) + 20, 582), "fangjiatw.com", font=F("Medium", 24), fill=MUTED, anchor="lm")
    d.text((W - 64, 582), spec["source"], font=F("Medium", 24), fill=MUTED, anchor="rm")
    im.save(out, quality=90, method=6)                                   # 文內圖
    im.save(out[:-5] + ".jpg", quality=90, optimize=True, progressive=True)  # 社群縮圖（部分平台不吃 WebP）

if __name__ == "__main__":
    outdir = sys.argv[1] if len(sys.argv) > 1 else "assets/news"
    os.makedirs(outdir, exist_ok=True)
    for slug, spec in IMGS.items():
        p = os.path.join(outdir, slug + ".webp"); draw(spec, p); print("ok", p)
