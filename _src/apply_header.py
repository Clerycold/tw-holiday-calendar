# 把 _src/header.html（與首頁一致的 sticky Header＋漢堡選單）套到所有手寫內頁。
# 產生器（build-tools.mjs / build-concert.mjs）自己會讀 header.html，不用這支。
# 執行（repo 根目錄）：python _src/apply_header.py   可重複執行。
import io, re, glob
HEAD = io.open("_src/header.html", encoding="utf-8").read().strip()
pat = re.compile(r'(<script>document\.documentElement\.classList\.add\("js"\)</script>\n)?<header class="(top|site-head)">.*?</header>(\n<script src="/assets/nav\.js[^"]*" defer></script>)?', re.S)
for f in glob.glob("**/index.html", recursive=True):
    if f.replace("\\", "/") == "index.html": continue   # 首頁有自己的 Header
    s = io.open(f, encoding="utf-8", newline="").read()
    t, n = pat.subn(lambda m: HEAD, s, count=1)
    if n:
        t = t.replace("/assets/site.css?v=5", "/assets/site.css?v=6")
        io.open(f, "w", encoding="utf-8", newline="").write(t); print("ok", f)
