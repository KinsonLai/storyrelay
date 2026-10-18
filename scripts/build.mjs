import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url),
  read = (path) => readFile(new URL(path, root), "utf8");
const shim = await read("src/extension-shim.js"),
  core = (await read("src/core.mjs")).replace(/^export /gm, ""),
  runtime = (await read("src/runtime.mjs")).replace(
    /^import[\s\S]*?from ['"].*?['"];\r?\n/gm,
    "",
  );
const content =
  "// StoryRelay — bundled local code, MIT. No remote executable code.\n(async()=>{\n" +
  shim +
  "\n" +
  core +
  "\n" +
  runtime +
  '\n})().catch(error=>console.warn("StoryRelay:",error.message));\n';
await writeFile(new URL("extension/content.js", root), content);
await copyFile(
  new URL("src/config.mjs", root),
  new URL("extension/config.mjs", root),
);
await mkdir(new URL("dist/", root), { recursive: true });
await writeFile(
  new URL("dist/build.json", root),
  JSON.stringify(
    {
      version: "0.1.0",
      content_sha256: createHash("sha256").update(content).digest("hex"),
      bytes: Buffer.byteLength(content),
    },
    null,
    2,
  ),
);
console.log(
  "Built StoryRelay extension (" + Buffer.byteLength(content) + " bytes).",
);
