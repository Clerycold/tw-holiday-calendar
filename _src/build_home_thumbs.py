# 首頁「最新生活攻略」：
#   1. 把各文章的 og 圖卡（assets/og/*.png，1200×630）從中間裁成 16:9，縮成 640×360 WebP 放 assets/thumbs/
#   2. 依 POSTS 產生卡片（分類、標題、50～70 字摘要、更新日期、閱讀更多），寫進 index.html 的 posts:start／posts:end 之間
#   3. 全年請假圖卡轉成 WebP 給首頁用
# 順序：build_og.py → build_info.py → 這支 → 再跑一次 build_info.py（讓首頁 WebP 的版本號更新）。
# 執行（repo 根目錄）：PYTHONPATH=C:/Users/Administrator/tools/pylib python _src/build_home_thumbs.py
import os, io, re, hashlib
from PIL import Image

# (og 檔名, 文章網址, 分類, 標題, 摘要 50～70 字)
POSTS = [
    ("2027-chunjie-stay", "/2027/chunjie-stay/", "住宿攻略", "2027 春節國內住宿：熱門區域與錯峰訂房",
     "初一到初三最難訂房，房價也最高。比較台中、嘉義、日月潭等 8 個熱門區域的交通與房價，附 3 種錯峰方案和訂房檢查清單。"),
    ("2027-qingjia", "/2027/qingjia/", "連假攻略", "2027 請假攻略：9 大連假、特休怎麼排",
     "2027 年放假 121 天、全年不用補班。整理 9 個連假各自最划算的請法，以及特休 3、7、10、14 天的全年排法。"),
    ("2027-chunjie", "/2027/chunjie/", "連假攻略", "2027 春節連假放幾天？請 2 休 11",
     "春節從 2/4（四）小年夜放到 2/10（三），共 7 天，不用補班。請 2 天特休可連休 11 天，請 5 天更能連休 16 天。"),
    ("2027-hanjia", "/2027/hanjia/", "連假攻略", "2027 寒假日期：放 21 天，2/11 開學",
     "寒假從 1/21（四）放到 2/10（三），共 21 天，春節剛好落在最後一週。爸媽只要請 3 天特休，就能陪孩子連休 12 天。"),
    ("2026-land-value-tax", "/2026/land-value-tax/", "生活資訊", "2026 地價稅怎麼算？繳納期限與試算",
     "地價稅 11/1～11/30 開徵。整理計算公式、累進稅率，以及自用住宅 2‰ 優惠稅率怎麼申請，文章附線上試算工具。"),
    ("concert", "/concert/", "住宿攻略", "演唱會住宿攻略：各大場館周邊飯店",
     "大巨蛋、小巨蛋、高雄巨蛋等 6 個場館的住宿區域、交通方式和散場攻略，幫你挑散場後好回去、價格合理的住宿。"),
]
TW, TH = 640, 360

def updated(url):
    """文章的更新日期：優先用頁面上寫的「最後更新／更新日期」，沒有再用 JSON-LD 的 dateModified。"""
    s = io.open(url.strip("/") + "/index.html", encoding="utf-8").read()
    m = re.search(r"(?:最後更新|更新日期)：(\d{4}) 年 (\d{1,2}) 月 (\d{1,2}) 日", s)
    if m: return "%s-%02d-%02d" % (m.group(1), int(m.group(2)), int(m.group(3)))
    return re.search(r'"dateModified":\s*"(\d{4}-\d{2}-\d{2})"', s).group(1)

os.makedirs("assets/thumbs", exist_ok=True)
cards = []
for slug, url, cat, title, summary in POSTS:
    assert 50 <= len(summary) <= 70, (slug, len(summary))
    im = Image.open(f"assets/og/{slug}.png").convert("RGB")
    w, h = im.size; cw = round(h * 16 / 9); x = (w - cw) // 2   # 1200×630 → 中間 1120×630（左右各裁 40px，文字都在安全範圍內）
    im.crop((x, 0, x + cw, h)).resize((TW, TH), Image.LANCZOS).save(f"assets/thumbs/{slug}.webp", "WEBP", quality=82, method=6)
    v = hashlib.md5(open(f"assets/thumbs/{slug}.webp", "rb").read()).hexdigest()[:8]
    d = updated(url); short = title.split("：")[0].split("？")[0]
    cards.append(f'      <article class="post"><img src="/assets/thumbs/{slug}.webp?v={v}" width="{TW}" height="{TH}" loading="lazy" alt="{short}文章封面">'
                 f'<div class="post-body"><div class="post-meta"><span class="cat">{cat}</span><time datetime="{d}">更新 {d.replace("-", "/")}</time></div>'
                 f'<h3><a href="{url}">{title}</a></h3><p>{summary}</p><a class="more" href="{url}" aria-label="閱讀更多：{short}">閱讀更多 →</a></div></article>')
    print(slug, d, os.path.getsize(f"assets/thumbs/{slug}.webp"))

im = Image.open("assets/info/2027-year.png")   # 色數少的圖卡用無損 WebP 最小（約 55KB，比 PNG 87KB 小）
im.save("assets/info/2027-year.webp", "WEBP", lossless=True, method=6)

home = io.open("index.html", encoding="utf-8", newline="").read()
block = '    <!-- posts:start -->\n    <div class="posts">\n' + "\n".join(cards) + '\n    </div>\n    <!-- posts:end -->'
home, n = re.subn(r"    <!-- posts:start -->.*?<!-- posts:end -->", lambda m: block, home, flags=re.S)
assert n == 1
io.open("index.html", "w", encoding="utf-8", newline="").write(home)
print("home posts written")
