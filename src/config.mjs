export function normalizeProfile(input) {
  const u = new URL(input.trim());
  const host = u.hostname.toLowerCase();
  if (
    u.protocol !== "https:" ||
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    u.port ||
    !["", "/"].includes(u.pathname) ||
    host === "chat.deepseek.com" ||
    !host.includes(".") ||
    /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
      host,
    ) ||
    host.endsWith(".local") ||
    host.endsWith(".localhost") ||
    host.includes(":")
  )
    throw Error(
      "請輸入公開世界的 HTTPS 首頁網址，不含密碼、路徑或參數。 / Enter a public HTTPS world origin.",
    );
  return {
    origin: u.origin,
    endpoint: "/api/deepseek/mcp",
    page: "/deepseek",
    version: 1,
  };
}
export function validateSender(sender, profile) {
  try {
    return Boolean(
      sender.tab?.id &&
      sender.frameId === 0 &&
      [profile.origin, "https://chat.deepseek.com"].includes(
        new URL(sender.url).origin,
      ),
    );
  } catch {
    return false;
  }
}
