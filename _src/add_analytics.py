# 在所有頁面 </body> 前加上 Cloudflare Web Analytics 追蹤碼（不用 cookie）。重複執行不會重複加。
# 執行（repo 根目錄）：python _src/add_analytics.py
# build-tools.mjs、build-concert.mjs 的模板本身已含同一行，這支是給手寫的靜態頁用；新增頁面後重跑即可。
import glob, io, re

TOKEN = "4c058fe6d8d047d290cd5fe7c73a3d15"
TAG = ("<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' "
       "data-cf-beacon='{\"token\": \"%s\"}'></script><!-- End Cloudflare Web Analytics -->\n" % TOKEN)

done = 0
for f in glob.glob("**/*.html", recursive=True):
    f = f.replace("\\", "/")
    if f.startswith("_") or f.startswith("google"): continue
    s = io.open(f, encoding="utf-8", newline="").read()
    s2 = re.sub(r"<!-- Cloudflare Web Analytics -->.*?<!-- End Cloudflare Web Analytics -->\n", "", s, flags=re.S)
    s2 = s2.replace("</body>", TAG + "</body>", 1)
    if s2 != s:
        io.open(f, "w", encoding="utf-8", newline="").write(s2); done += 1
print("pages updated", done)
