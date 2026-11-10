# 首頁「最新生活攻略」卡片縮圖：把各文章的 og 圖卡（assets/og/*.png）縮成 600×315 WebP，放 assets/thumbs/。
# 另外把全年請假圖卡轉成 WebP 給首頁用。順序：build_og.py → build_info.py → 這支 → 再跑一次 build_info.py（讓首頁 WebP 的版本號更新）。
# 執行（repo 根目錄）：PYTHONPATH=C:/Users/Administrator/tools/pylib python _src/build_home_thumbs.py
import os
from PIL import Image

SLUGS = ["2027-chunjie-stay", "2026-land-value-tax", "2027-qingjia", "2027-chunjie", "2027-hanjia", "concert"]
os.makedirs("assets/thumbs", exist_ok=True)
for s in SLUGS:
    im = Image.open(f"assets/og/{s}.png").convert("RGB").resize((600, 315), Image.LANCZOS)
    im.save(f"assets/thumbs/{s}.webp", "WEBP", quality=82, method=6)
    print(s, os.path.getsize(f"assets/thumbs/{s}.webp"))
im = Image.open("assets/info/2027-year.png")   # 色數少的圖卡用無損 WebP 最小（約 55KB，比 PNG 87KB 小）
im.save("assets/info/2027-year.webp", "WEBP", lossless=True, method=6)
print("2027-year.webp", im.size, os.path.getsize("assets/info/2027-year.webp"))

# 首頁縮圖網址加上內容版本號（圖改了網址就變，避免瀏覽器快取舊圖）
import hashlib, io, re
home = io.open("index.html", encoding="utf-8", newline="").read()
for s in SLUGS:
    v = hashlib.md5(open(f"assets/thumbs/{s}.webp", "rb").read()).hexdigest()[:8]
    home, n = re.subn(rf'/assets/thumbs/{s}\.webp(\?v=\w+)?"', f'/assets/thumbs/{s}.webp?v={v}"', home)
    assert n == 1, s
io.open("index.html", "w", encoding="utf-8", newline="").write(home)
print("home thumbs versioned")
