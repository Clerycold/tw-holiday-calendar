# 品牌圖示：綠色方塊上的日曆，格子裡一格紅色代表「放假日」（刻意不用白底大紅點，避免像日本國旗）。產生 favicon.svg / favicon.ico / apple-touch-icon.png。
# 執行（repo 根目錄）：PYTHONPATH=C:/Users/Administrator/tools/pylib python _src/build_favicon.py
from PIL import Image, ImageDraw
BRAND, RED, WHITE, PALE, GRID = "#176B50", "#C8102E", "#FFFFFF", "#A8E6CC", "#9DB8AB"
CELLS = [(x, y) for y in (16.2, 20.6) for x in (9.6, 14.4, 19.2)]
RED_CELL = (19.2, 16.2)
SVG = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
       f'<rect width="32" height="32" rx="8" fill="{BRAND}"/>'
       f'<rect x="6.5" y="9.5" width="19" height="16" rx="2.5" fill="{WHITE}"/>'
       f'<rect x="6.5" y="9.5" width="19" height="4.5" rx="2" fill="{PALE}"/>'
       f'<rect x="10.5" y="6.5" width="3" height="6" rx="1.5" fill="{WHITE}"/>'
       f'<rect x="18.5" y="6.5" width="3" height="6" rx="1.5" fill="{WHITE}"/>'
       + "".join(f'<rect x="{x}" y="{y}" width="3.2" height="3.2" rx=".8" fill="{RED if (x, y) == RED_CELL else GRID}"/>' for x, y in CELLS)
       + '</svg>')
open("favicon.svg", "w", encoding="utf-8").write(SVG + "\n")

def draw(size, rounded=True):
    s = size / 32; S = 4  # 4 倍超取樣再縮小，邊緣才平滑
    im = Image.new("RGBA", (size * S, size * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    k = lambda *v: [x * s * S for x in v]
    d.rounded_rectangle(k(0, 0, 32, 32), radius=8 * s * S if rounded else 0, fill=BRAND)
    d.rounded_rectangle(k(6.5, 9.5, 25.5, 25.5), radius=2.5 * s * S, fill=WHITE)
    d.rounded_rectangle(k(6.5, 9.5, 25.5, 14), radius=2 * s * S, fill=PALE)
    d.rounded_rectangle(k(10.5, 6.5, 13.5, 12.5), radius=1.5 * s * S, fill=WHITE)
    d.rounded_rectangle(k(18.5, 6.5, 21.5, 12.5), radius=1.5 * s * S, fill=WHITE)
    for x, y in CELLS:
        d.rounded_rectangle(k(x, y, x + 3.2, y + 3.2), radius=.8 * s * S, fill=RED if (x, y) == RED_CELL else GRID)
    return im.resize((size, size), Image.LANCZOS)

draw(48).save("favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
draw(180, rounded=False).convert("RGB").save("apple-touch-icon.png")  # iOS 會自己裁圓角
draw(512).save("assets/logo-512.png")
print("favicon done")
