# 首頁「最新生活攻略」卡片縮圖：把各文章的 og 圖卡（assets/og/*.png）縮成 600×315 WebP，放 assets/thumbs/。
# 另外把全年請假圖卡轉成 WebP 給首頁用。build_og.py、build_info.py 重跑後再跑這支。
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
