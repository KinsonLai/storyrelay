import { readFile, readdir, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url),
  read = (p) => readFile(new URL(p, root), "utf8"),
  manifest = JSON.parse(await read("extension/manifest.json")),
  pkg = JSON.parse(await read("package.json"));
if (manifest.version !== pkg.version) throw Error("Version mismatch");
if (
  manifest.manifest_version !== 3 ||
  manifest.permissions.includes("cookies") ||
  manifest.permissions.includes("nativeMessaging") ||
  manifest.host_permissions.includes("<all_urls>")
)
  throw Error("Unexpected privilege");
for (const file of [
  "extension/content.js",
  "extension/config.mjs",
  "extension/background.mjs",
  "extension/popup.mjs",
])
  execFileSync(process.execPath, [
    "--check",
    fileURLToPath(new URL(file, root)),
  ]);
for (const file of [
  "README.md",
  "README.zh-TW.md",
  "LICENSE",
  "SECURITY.md",
  "docs/landscape.md",
  "docs/world-contract.md",
  "docs/store-submission.md",
  "extension/privacy.html",
])
  if (!(await read(file)).trim()) throw Error("Missing " + file);
for (const size of [16, 48, 128])
  await stat(new URL("extension/icons/" + size + ".png", root));
const text = await read("extension/content.js");
if (
  /taixu-novel-adventure|lckit1008|63261aa126|C:\\Users|gh[pousr]_[A-Za-z0-9]{20}|siwc_bypass|eval\(|new Function\(/.test(
    text,
  )
)
  throw Error("Private source or remote-code pattern in extension");
console.log(
  "Release checks passed: versions, MV3 syntax, narrow grants, documents, icons, public bundle.",
);
