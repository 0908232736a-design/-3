# 我的閱讀歷程檔案 - 靜態網站 (可部署到 GitHub Pages / Netlify)
- 網站名稱：我的閱讀歷程檔案
- 分類：小說、詩、散文、雜記
- 筆記欄位：書名（必填）、心得（支援 Markdown，選填）
- 儲存方式：每位使用者資料保存在自己的瀏覽器 localStorage（無伺服器）
- 任何人打開網站都能新增、編輯、刪除自己的筆記（在該瀏覽器內）

## 部署到 GitHub Pages (快速指南)
1. 建立一個公開的 GitHub repository（例如 `reading-file`）。
2. 把資料夾內容（index.html、styles.css、app.js、README.md）放入並 commit/push。
3. 到 GitHub repo → Settings → Pages → 選擇 Branch: `main`、/ (root)，儲存。
4. 幾分鐘後會有 `https://<你的帳號>.github.io/<repo>/` 網址可以訪問。

## 備註與延伸
- 若要集中收集所有人的筆記，需要後端（例如 Firebase、Google Sheets + AppSheet 等）。
- 可在本地先開啟 `index.html` 測試（直接用瀏覽器打開）。
- 若需要我協助把 repo 推上你的 GitHub 或幫你部署至 Netlify，我可以一步步指導或代為產生指令。
