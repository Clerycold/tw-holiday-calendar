# 在所有頁面 <meta charset> 後加上 AdSense 網站驗證中繼標記，並產生根目錄的 ads.txt。重複執行不會重複加。
# 執行（repo 根目錄）：python _src/add_adsense.py
# 只放驗證用的 meta（不載入廣告程式、不影響速度）；審核通過後再另外加廣告程式碼與版位。
# build-tools.mjs、build-concert.mjs、build-news.mjs 的模板本身已含同一行，這支是給手寫的靜態頁用。
import glob, io, re

PUB = "pub-1876699539464325"
META = f'<meta name="google-adsense-account" content="ca-{PUB}">\n'

io.open("ads.txt", "w", encoding="utf-8", newline="\n").write(f"google.com, {PUB}, DIRECT, f08c47fec0942fa0\n")

done = 0
for f in glob.glob("**/*.html", recursive=True):
    f = f.replace("\\", "/")
    if f.startswith("_") or f.startswith("google"): continue
    s = io.open(f, encoding="utf-8", newline="").read()
    s2 = re.sub(r'<meta name="google-adsense-account"[^>]*>\n', "", s)
    s2 = s2.replace('<meta charset="utf-8">\n', '<meta charset="utf-8">\n' + META, 1)
    if s2 != s:
        io.open(f, "w", encoding="utf-8", newline="").write(s2); done += 1
print("pages updated", done)
