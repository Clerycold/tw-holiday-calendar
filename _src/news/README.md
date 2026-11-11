# 生活時事整理（/news/）

## 流程

1. **草稿**：每週排程（或手動）把候選題目寫成 `_src/news/drafts/<slug>.html`。
   `drafts/` 裡的檔案產生器完全不讀，不會上線。
2. **查證**：人工逐項核對草稿裡的數字、日期、適用對象，和「資料來源」列的官方原文一致。
   查不到官方出處的句子刪掉，不要留。
3. **發布**：把檔案從 `drafts/` 搬到 `_src/news/`，把 `verified` 改成查證當天，然後：
   ```
   node _src/build-news.mjs
   PYTHONPATH=C:/Users/Administrator/tools/pylib python _src/build_og.py
   ```
   本機預覽確認後再 commit、push，並到 Search Console 要求建立索引。
4. **更新**：政策有新公告時，改內文、改 `verified` 日期，重跑上面兩行。
5. **下架**：直接刪掉 `_src/news/` 裡的檔案再重跑；頁面和 sitemap 網址會一起拿掉。

首頁的「生活時事整理」區塊要滿 5 篇才會出現；最新一篇的 `verified` 超過 30 天，首頁區塊會自動隱藏（文章頁不受影響）。

## 檔案格式

檔名就是網址：`_src/news/2027-minimum-wage.html` → `/news/2027-minimum-wage/`（只能用小寫英數和 `-`）。

```
---
title: 2027 基本工資調整｜月薪、時薪多少？哪些人受影響
short: 2027 基本工資調整重點
desc: 40～160 字的摘要，會用在搜尋結果、列表頁和首頁卡片。
cat: 職場勞工
published: 2026-11-12
verified: 2026-11-12
answer: 一段結論，先講答案。可以用 <b>粗體</b> 標重點數字。
tools: take-home-pay, insurance
sources:
  - 勞動部新聞稿：115 年基本工資審議結果 | https://www.mol.gov.tw/...
  - 基本工資審議辦法 | https://law.moj.gov.tw/...
faq:
  - 問題一？ | 答案一。
---
  <section>
    <h2>小標題</h2>
    <p>內文……</p>
  </section>
```

- `cat`：只能是 `職場勞工` 或 `財稅理財`。
- `tools`：`tools/` 底下的資料夾名稱，至少一個；文章會自動附上「算算看對你的影響」。
- `sources`：至少一個，網址必須是 https。優先列政府機關原文，媒體報導只當補充。
- 內文可以用網站既有的 `.tbl`（表格外框）、`.stat`、`.note` 樣式。
- 文中不能留 `TODO`、`待查`、`??`，產生器看到會直接報錯，避免半成品上線。

## 寫作原則

- 只寫已經公告的內容；「研議中」「可能」的消息要明寫是草案，並附出處。
- 不寫沒有出處的數字。不知道就不寫。
- 標題講清楚「誰、什麼時候、變多少」，不要用「驚爆」「必看」這類字眼。
