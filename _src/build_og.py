# 產生社群分享縮圖（og:image，1200×630）並在每頁 <head> 補上 og:image 標籤。
# 執行（repo 根目錄）：PYTHONPATH=C:/Users/Administrator/tools/pylib python _src/build_og.py
# 字型：Noto Sans TC（SIL OFL），放在 C:/Users/Administrator/tools/fonts/，不進 repo。
# build-tools.mjs、build-concert.mjs 產生的頁面自己會輸出 og:image 標籤；這支只幫缺標籤的靜態頁補上，
# 並重畫所有圖卡。新增或改標題後重跑一次即可。
import glob, html, io, os, re
from PIL import Image, ImageDraw, ImageFont

FONT_DIR = "C:/Users/Administrator/tools/fonts/"
SITE = "https://fangjiatw.com"
W, H = 1200, 630
PAPER, INK, MUTED, RULE = "#F8FAF8", "#202B26", "#5F6E66", "#E1E9E4"
RED, RED_SOFT, LEAVE, LEAVE_SOFT = "#c8102e", "#fde8ea", "#176B50", "#E7F4ED"
BRAND, BRAND_SOFT, ACCENT, ACCENT_SOFT = "#176B50", "#E7F4ED", "#A8521F", "#FBEDE3"   # 和網站同一組品牌色
F = lambda w, s: ImageFont.truetype(FONT_DIR + f"NotoSansTC-{w}.otf", s)

NO_START = set("，、。？！：；）」』〉》％,.?!:;)%～")

def slug(path):
    return path.strip("/").replace("/", "-") or "home"

def og_url(path):
    return f"{SITE}/assets/og/{slug(path)}.png"

def kicker(path):
    if path.startswith("/tools/"): return ("免費試算工具", LEAVE, LEAVE_SOFT)
    if path.startswith("/concert/"): return ("演唱會住宿攻略", ACCENT, ACCENT_SOFT)
    if path.startswith("/news/"): return ("生活時事整理", LEAVE, LEAVE_SOFT)
    if path.startswith("/2026/land-value-tax"): return ("生活資訊", LEAVE, LEAVE_SOFT)
    if re.match(r"/20\d\d/", path): return (path[1:5] + " 連假攻略", BRAND, BRAND_SOFT)
    return ("放假日曆", BRAND, BRAND_SOFT)

def split_title(t):
    t = re.sub(r"｜放假日曆$", "", t).strip()
    for sep in ("｜", "？"):
        if sep in t:
            a, b = t.split(sep, 1)
            return (a + ("？" if sep == "？" else "")).strip(), b.strip()
    return t, ""

def wrap(draw, text, font, width):
    lines, cur = [], ""
    for ch in text:
        if draw.textlength(cur + ch, font=font) <= width or not cur or ch in NO_START:
            cur += ch
        else:
            lines.append(cur); cur = ch
    if cur: lines.append(cur)
    return lines

def fit(draw, text, weight, sizes, width, max_lines):
    # 先找能排成最少行數的字級：能一行就一行（必要時縮小字），避免「去／哪？」這種斷法
    for n in range(1, max_lines + 1):
        for s in sizes:
            f = F(weight, s); lines = wrap(draw, text, f, width)
            if len(lines) <= n: return f, lines
    f = F(weight, sizes[-1]); lines = wrap(draw, text, f, width)
    return f, lines[:max_lines - 1] + [lines[max_lines - 1].rstrip() + "…"]

def card(path, main, sub, out):
    im = Image.new("RGB", (W, H), PAPER); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 14], fill=BRAND)
    label, fg, bg = kicker(path)
    kf = F("Bold", 30); kw = d.textlength(label, font=kf)
    d.rounded_rectangle([64, 62, 64 + kw + 40, 62 + 54], radius=27, fill=bg)
    d.text((84, 89), label, font=kf, fill=fg, anchor="lm")
    # 右側：網站的撕頁日曆造型，中間放分類字
    x0, y0, x1, y1 = 930, 150, 1136, 400
    d.rounded_rectangle([x0 + 6, y0 + 8, x1 + 6, y1 + 8], radius=14, fill=RULE)
    d.rounded_rectangle([x0, y0, x1, y1], radius=14, fill="#ffffff", outline=RULE, width=2)
    d.rounded_rectangle([x0, y0, x1, y0 + 64], radius=14, fill=fg)
    d.rectangle([x0, y0 + 40, x1, y0 + 64], fill=fg)
    for cx in (x0 + 56, x1 - 56):
        d.ellipse([cx - 9, y0 - 14, cx + 9, y0 + 22], fill=PAPER, outline=RULE, width=2)
    glyph = "算" if path.startswith(("/tools/", "/2026/land")) else "宿" if path.startswith("/concert/") or "stay" in path else "假"
    d.text(((x0 + x1) / 2, y0 + 32), {"算": "TOOLS", "宿": "STAY"}.get(glyph, "HOLIDAY"), font=F("Bold", 24), fill="#ffffff", anchor="mm")
    d.text(((x0 + x1) / 2, (y0 + 64 + y1) / 2 + 4), glyph, font=F("Black", 120), fill=fg, anchor="mm")
    # 左側標題：先排版量高度，再在 130～500 之間垂直置中
    tw = x0 - 64 - 48
    tf, tl = fit(d, main, "Black", [84, 76, 68, 60, 54], tw, 3 if not sub else 2)
    blocks = [(ln, tf, INK, int(tf.size * 1.28)) for ln in tl]
    if sub:
        sf, sl = fit(d, sub, "Medium", [40, 36, 32], tw, 2)
        blocks += [(None, None, None, 14)] + [(ln, sf, MUTED, int(sf.size * 1.45)) for ln in sl]
    total = sum(b[3] for b in blocks)
    y = 140 + max(0, (360 - total) // 2)
    for ln, f, c, h in blocks:
        if ln: d.text((64, y), ln, font=f, fill=c)
        y += h
    d.line([64, 520, W - 64, 520], fill=RULE, width=2)
    lf = F("Black", 44)
    d.text((64, 572), "放假", font=lf, fill=INK, anchor="lm")
    d.text((64 + d.textlength("放假", font=lf), 572), "日曆", font=lf, fill=BRAND, anchor="lm")
    d.text((64 + d.textlength("放假日曆", font=lf) + 24, 574), "台灣生活資訊與免費試算工具", font=F("Medium", 26), fill=MUTED, anchor="lm")
    d.text((W - 64, 574), "fangjiatw.com", font=F("Medium", 28), fill=MUTED, anchor="rm")
    im = im.quantize(colors=64, method=Image.Quantize.MEDIANCUT)
    im.save(out, optimize=True)

TAGS = ('<meta property="og:image" content="{u}">\n<meta property="og:image:width" content="1200">\n'
        '<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n')

os.makedirs("assets/og", exist_ok=True)
SKIP = {"google9566ceca0f77c023.html"}
made = injected = 0
for f in sorted(glob.glob("**/index.html", recursive=True)):
    f = f.replace("\\", "/")
    if f.startswith("_") or f in SKIP: continue
    path = "/" + f[:-len("index.html")]
    s = io.open(f, encoding="utf-8", newline="").read()
    if re.search(r'<meta name="robots" content="[^"]*noindex', s): continue
    m = re.search(r'<meta property="og:title" content="([^"]*)"', s) or re.search(r"<title>([^<]*)</title>", s)
    main, sub = split_title(html.unescape(m.group(1)))
    if path == "/":
        main, sub = "2027 行事曆・連假請假攻略", "全年 121 天假、0 天補班；報稅、薪資、退休金、房貸免費試算"
    card(path, main, sub, f"assets/og/{slug(path)}.png"); made += 1
    if 'property="og:image"' not in s:
        tags = TAGS.format(u=og_url(path))
        anchor = re.search(r'<meta property="og:url"[^>]*>\n', s) or re.search(r'<link rel="canonical"[^>]*>\n', s)
        s = s[:anchor.end()] + tags + s[anchor.end():]
        io.open(f, "w", encoding="utf-8", newline="").write(s); injected += 1
print(f"cards {made}, pages tagged {injected}")
