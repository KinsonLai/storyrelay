import { normalizeProfile } from "./config.mjs";
const el = (id) => document.getElementById(id),
  status = el("status");
const { profile } = await chrome.storage.local.get("profile");
if (profile) {
  el("origin").value = profile.origin;
  status.textContent =
    "已連接 " + profile.origin + "。正常登入後，到 DeepSeek 選存檔。";
}
el("connect").onclick = async () => {
  try {
    const p = normalizeProfile(el("origin").value);
    const allowed = await chrome.permissions.request({
      origins: [p.origin + "/*"],
    });
    if (!allowed) throw Error("未授予網站權限；沒有連接。");
    el("connect").disabled = true;
    status.textContent = "正在連接…";
    const r = await chrome.runtime.sendMessage({
      type: "CONNECT_WORLD",
      origin: p.origin,
    });
    if (!r.ok) throw Error(r.error);
    status.textContent =
      "世界已連接。請在世界分頁正常登入，再按「開啟 DeepSeek」。若有舊 userscript，請停用以避免重複中繼。";
  } catch (e) {
    status.textContent = e.message;
  } finally {
    el("connect").disabled = false;
  }
};
el("chat").onclick = () =>
  chrome.tabs.create({ url: "https://chat.deepseek.com/" });
el("disconnect").onclick = async () => {
  const r = await chrome.runtime.sendMessage({ type: "DISCONNECT" });
  status.textContent = r.ok
    ? "已中斷並清除。請重新整理已開啟的遊戲與 DeepSeek 頁，以停止舊頁中繼。"
    : r.error;
};
