import { normalizeProfile, validateSender } from "./config.mjs";
async function register(profile) {
  const id = "storyrelay-world";
  await chrome.scripting
    .unregisterContentScripts({ ids: [id] })
    .catch(() => {});
  await chrome.scripting.registerContentScripts([
    {
      id,
      matches: [profile.origin + "/*"],
      js: ["content.js"],
      runAt: "document_idle",
      allFrames: false,
      persistAcrossSessions: true,
    },
  ]);
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  (async () => {
    const { profile } = await chrome.storage.local.get("profile");
    const internal =
      sender.id === chrome.runtime.id &&
      sender.url?.startsWith(chrome.runtime.getURL(""));
    if (message.type === "CONNECT_WORLD" && internal) {
      const p = normalizeProfile(message.origin);
      if (!(await chrome.permissions.contains({ origins: [p.origin + "/*"] })))
        throw Error("世界網站權限尚未授予。");
      await register(p);
      const all = await chrome.storage.local.get(null);
      const keys = Object.keys(all).filter((k) =>
        k.startsWith("storyrelay-v1:"),
      );
      if (keys.length) await chrome.storage.local.remove(keys);
      await chrome.storage.local.set({ profile: p });
      if (profile && profile.origin !== p.origin) await revokeWorld(profile);
      await openWorld(p, true);
      reply({ ok: true });
      return;
    }
    if (
      message.type === "OPEN_WORLD" &&
      profile &&
      validateSender(sender, profile)
    ) {
      await openWorld(profile);
      reply({ ok: true });
      return;
    }
    if (message.type === "DISCONNECT" && internal) {
      await chrome.scripting.unregisterContentScripts().catch(() => {});
      const all = await chrome.storage.local.get(null);
      await chrome.storage.local.clear();
      if (profile) await revokeWorld(profile);
      reply({ ok: true });
      return;
    }
    throw Error("Request not authorized");
  })().catch((e) => reply({ ok: false, error: e.message }));
  return true;
});
async function openWorld(profile, active = false) {
  const tabs = await chrome.tabs.query({ url: profile.origin + "/*" });
  if (tabs.length) {
    if (active) await chrome.tabs.update(tabs[0].id, { active: true });
    await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      files: ["content.js"],
    });
    return;
  }
  await chrome.tabs.create({ url: profile.origin + profile.page, active });
}

async function revokeWorld(profile) {
  if (
    !chrome.runtime
      .getManifest()
      .host_permissions?.includes(profile.origin + "/*")
  )
    await chrome.permissions.remove({ origins: [profile.origin + "/*"] });
}
