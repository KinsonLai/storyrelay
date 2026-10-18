# StoryRelay

**在 DeepSeek 玩故事，讓世界保存真正的進度。**

把支援的雲端 MCP 文字冒險接到 DeepSeek 官方網頁。玩家無需 API key、Tampermonkey、本機伺服器或終端機。

## 現在怎樣安裝

目前提供 GitHub Releases 的 Chrome 擴充功能 ZIP，**尚未在 Chrome Web Store 上架**。下載解壓後，到 `chrome://extensions` 開啟開發人員模式，再「載入未封裝項目」。這是早期側載流程，不是商店一鍵安裝。

安裝後只需：

1. 點擴充功能圖示，貼一次世界首頁 HTTPS 網址並授權該網站。
2. 正常登入世界與 DeepSeek；世界中繼分頁會自動開啟。
3. 在 DeepSeek 按「連接世界 MCP」，選存檔、輸入行動，開始遊玩。

每回合綁定同一分支、玩家原話與提交鍵；預設預覽後才存檔。結果不明時查回收據，不換鍵亂重試。世界頁保持開啟即可。若曾安裝舊 userscript，請先停用，避免兩套中繼同時執行。

## 專門解決甚麼

重點是長篇文字冒險的分支與可靠存檔，不是泛用電腦控制。MCP 網頁橋接已有許多專案，本專案的 niche 是「免本機代理、沿用網站登入、明確綁定分支、存檔有收據、可以恢復未確認提交」。[競品與重疊分析](docs/landscape.md)。

僅支援 `scene-v1` 冒險介面，不是任意 MCP URL 都能接。世界作者需一次性整合登入保護的 RPC 入口。[開發者協定](docs/world-contract.md)。目前沒有附送公開可玩的世界，私人小說及正式存檔均不在開源包內。

遊戲資料會送進目前 DeepSeek 對話；登入 cookie 不會被讀取或傳給模型。中斷可清除本機中繼資料，不會刪除雲端遊戲或 DeepSeek 對話。

MIT 授權。非 DeepSeek、Google 或 OpenAI 官方產品。完整開發、測試與限制見 [English README](README.md)。
