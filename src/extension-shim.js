// Extension-isolated world only. This API is never exposed to page scripts.
const __all = await chrome.storage.local.get(null),
  __profile = __all.profile;
if (document.getElementById("storyrelay-bridge")) return;
if (!__profile) {
  const notice = document.createElement("button");
  notice.id = "storyrelay-bridge";
  notice.textContent = "StoryRelay · 請從擴充功能圖示連接世界";
  notice.style.cssText =
    "position:fixed;right:16px;top:18px;z-index:2147483640;padding:12px;background:#d3dfbf;color:#17251d;border:0;border-radius:10px";
  document.body.append(notice);
  return;
}
if (![__profile.origin, "https://chat.deepseek.com"].includes(location.origin))
  return;
let __srEnabled = true,
  __serial = 0;
const __listeners = new Map(),
  __cache = new Map(Object.entries(__all));
const GM_getValue = (key, fallback) =>
  __cache.has(key) ? __cache.get(key) : fallback;
const GM_setValue = (key, value) => {
  __cache.set(key, value);
  chrome.storage.local.set({ [key]: value }).catch(() => {});
};
const GM_deleteValue = (key) => {
  __cache.delete(key);
  chrome.storage.local.remove(key).catch(() => {});
};
const GM_addValueChangeListener = (key, callback) => {
  const id = ++__serial;
  __listeners.set(id, { key, callback });
  return id;
};
const GM_removeValueChangeListener = (id) => __listeners.delete(id);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (
    changes.profile &&
    changes.profile.newValue?.origin !== __profile.origin
  ) {
    __srEnabled = false;
    document.getElementById("storyrelay-bridge")?.remove();
  }
  for (const [key, change] of Object.entries(changes)) {
    if (change.newValue === undefined) __cache.delete(key);
    else __cache.set(key, change.newValue);
    for (const listener of __listeners.values())
      if (listener.key === key)
        listener.callback(key, change.oldValue, change.newValue, true);
  }
});
