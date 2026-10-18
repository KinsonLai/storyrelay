// Isolated Chromium extension QA. Synthetic DeepSeek responses and world RPC;
// no user profile, cookies, real model or production saves. Browser plugin not available.
import { mkdtemp, mkdir, cp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const { chromium } = await import(pathToFileURL(process.argv[2]).href),
  out = path.resolve(process.argv[3] ?? "artifacts/browser");
await mkdir(out, { recursive: true });
const temp = await mkdtemp(path.join(tmpdir(), "storyrelay-qa-")),
  ext = path.join(temp, "extension");
await cp(new URL("../extension/", import.meta.url), ext, { recursive: true });
const manifest = JSON.parse(
  await readFile(path.join(ext, "manifest.json"), "utf8"),
);
assert.deepEqual(manifest.host_permissions, ["https://chat.deepseek.com/*"]);
manifest.host_permissions.push("https://world.example/*");
await writeFile(path.join(ext, "manifest.json"), JSON.stringify(manifest));
// The isolated fixture pregrants ONLY world.example so it does not automate a real
// install/host-grant prompt. The shipped manifest keeps worlds optional.
const context = await chromium.launchPersistentContext(
  path.join(temp, "profile"),
  {
    channel: "chromium",
    headless: true,
    viewport: { width: 1280, height: 800 },
    args: ["--disable-extensions-except=" + ext, "--load-extension=" + ext],
  },
);
const errors = [],
  calls = [];
let revision = 0,
  receipt = null,
  session,
  foreign = false;
const state = {
  hp: 10,
  mana: 5,
  coins: 12,
  clock: 0,
  knowledge: { ren: ["bridge is closed"] },
};
const tools = [
  {
    name: "list_if_branches",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "prepare_scene",
    inputSchema: {
      type: "object",
      properties: {
        branch_id: { type: "string" },
        player_action: { type: "string" },
      },
    },
  },
  {
    name: "finish_scene",
    inputSchema: {
      type: "object",
      properties: {
        branch_id: { type: "string" },
        player_action: { type: "string" },
        expected_revision: { type: "integer" },
        idempotency_key: { type: "string" },
        narration: { type: "string" },
        changes: { type: "object" },
        writing_skill_ack: { type: "string" },
        preparation_id: { type: "string" },
        check_context_sha256: { type: "string" },
      },
    },
  },
  {
    name: "get_scene_recovery",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        branch_id: { type: "string" },
        idempotency_key: { type: "string" },
      },
    },
  },
];
const html = `<!doctype html><html><meta charset="utf-8"><title>DeepSeek synthetic QA</title><body style="background:#111;color:#eee;font:16px system-ui;padding:35px"><h1>StoryRelay — virtualized chat fixture</h1><div id="messages"></div><div><div><textarea placeholder="Message DeepSeek" style="width:60%;height:100px"></textarea></div><div role="button" class="ds-button--primary ds-button--disabled">Send</div></div><script>const input=document.querySelector('textarea'),send=document.querySelector('[role=button]');input.oninput=()=>send.classList.toggle('ds-button--disabled',!input.value);send.onclick=async()=>{if(!input.value)return;const text=input.value;input.value='';send.classList.remove('ds-button--disabled');const r=await window.fixtureReply(text),e=document.createElement('div');e.className='ds-assistant-message-main-content';if(r.packet){const p=document.createElement('p');p.textContent='STORYRELAY_MCP_REQUEST_V1';const pre=document.createElement('pre');pre.textContent=JSON.stringify(r.packet);e.append(p,pre);}else e.textContent=r.text;document.querySelector('#messages').replaceChildren(e);send.classList.add('ds-button--disabled');};</script></body></html>`;
await context.route("https://chat.deepseek.com/**", (route) =>
  route.fulfill({ contentType: "text/html", body: html }),
);
await context.route("https://world.example/**", (route) => {
  if (!route.request().url().endsWith("/api/deepseek/mcp"))
    return route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Original Harbour Test World</title><h1>Harbour — isolated test world</h1><p>Your world is connected.</p>",
    });
  const q = JSON.parse(route.request().postData());
  calls.push(q.params?.name ?? q.method);
  let result;
  if (q.method === "tools/list") result = { tools };
  else {
    const a = q.params.arguments,
      name = q.params.name;
    let value;
    if (name === "list_if_branches")
      value = {
        main: { branch_id: "main", revision: 74 },
        if_branches: [
          { branch_id: "test-save", name: "Isolated save", revision },
        ],
      };
    if (name === "prepare_scene")
      value = {
        branch: { revision },
        preparation: { preparation_id: "fixture-preparation" },
        writing_policy: {
          package_sha256: "fixture-skill",
          documents: [
            {
              text: "Characters only know observed facts. Saves require a real receipt.",
            },
          ],
        },
        check_context_sha256: "fixture-checks",
        state,
      };
    if (name === "finish_scene") {
      assert.equal(a.branch_id, "test-save");
      if (!receipt) {
        revision++;
        receipt = {
          committed: true,
          revision,
          event_id: "fixture-event",
          snapshot: {
            markdown: "Revision " + revision + " — unchanged resources",
          },
          state,
        };
      }
      value = receipt;
    }
    if (name === "get_scene_recovery")
      value = {
        submission: { status: receipt ? "committed" : "unconfirmed", receipt },
      };
    result = {
      isError: false,
      content: [{ type: "text", text: JSON.stringify(value) }],
    };
  }
  return route.fulfill({
    contentType: "application/json",
    body: JSON.stringify({ jsonrpc: "2.0", id: q.id, result }),
  });
});
let worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent("serviceworker")),
  id = worker.url().split("/")[2];
try {
  const world = await context.newPage();
  await world.goto("https://world.example/deepseek");
  const popup = await context.newPage();
  popup.on("pageerror", (e) => errors.push(e.message));
  await popup.goto("chrome-extension://" + id + "/popup.html");
  await popup.screenshot({ path: path.join(out, "onboarding.png") });
  await popup.locator("#origin").fill("https://world.example");
  await popup
    .getByRole("button", { name: "連接世界 · Connect", exact: true })
    .click();
  await popup
    .getByRole("status")
    .filter({ hasText: "世界已連接" })
    .waitFor({ timeout: 15000 });
  const ds = await context.newPage();
  ds.on("pageerror", (e) => errors.push(e.message));
  await ds.exposeFunction("fixtureReply", (text) => {
    if (!text.startsWith("STORYRELAY_MCP_RESULT_V1")) {
      session = { nonce: text.match(/回合nonce：([^\n]+)/)[1] };
      return {
        packet: {
          version: 1,
          nonce: session.nonce,
          call_id: "p",
          tool: "prepare_scene",
          arguments: foreign ? { branch_id: "main" } : {},
        },
      };
    }
    const r = JSON.parse(text.split("\n")[1]);
    if (r.tool === "prepare_scene")
      return {
        packet: {
          version: 1,
          nonce: session.nonce,
          call_id: "f",
          tool: "finish_scene",
          arguments: {
            expected_revision: r.result.branch.revision,
            narration: "Only an isolated technical record.",
            changes: {},
            preparation_id: "fixture-preparation",
            writing_skill_ack: "fixture-skill",
            check_context_sha256: "fixture-checks",
          },
        },
      };
    assert.equal(r.result.committed, true);
    return {
      text:
        "Real fixture receipt: revision " +
        r.result.revision +
        "\n" +
        r.result.snapshot.markdown,
    };
  });
  await ds.goto("https://chat.deepseek.com/fixture");
  await ds.getByRole("button", { name: "連接世界 MCP", exact: true }).click();
  await ds.getByRole("status").filter({ hasText: "已取得" }).waitFor();
  await ds.getByLabel("遊戲分支").selectOption("test-save");
  await ds
    .getByLabel("本回合玩家行動")
    .fill("Save a technical diagnostic only.");
  await ds.getByRole("button", { name: "開始本回合", exact: true }).click();
  await ds
    .getByRole("button", { name: "確認執行上方寫入操作", exact: true })
    .waitFor({ state: "visible", timeout: 20000 });
  assert.equal(revision, 0);
  await ds.screenshot({ path: path.join(out, "confirmation.png") });
  await ds
    .getByRole("button", { name: "確認執行上方寫入操作", exact: true })
    .click();
  await ds
    .getByRole("status")
    .filter({ hasText: "本回合完成，雲端提交已有收據" })
    .waitFor({ timeout: 20000 });
  assert.equal(revision, 1);
  await ds.getByRole("button", { name: "查回上次提交", exact: true }).click();
  await ds
    .getByRole("status")
    .filter({ hasText: "已找回真實成功收據" })
    .waitFor();
  await ds.screenshot({ path: path.join(out, "receipt.png") });
  foreign = true;
  const count = calls.length;
  await ds.getByRole("button", { name: "開始本回合", exact: true }).click();
  await ds
    .getByRole("status")
    .filter({ hasText: "本回合不能切換分支" })
    .waitFor({ timeout: 10000 });
  assert.equal(calls.length, count);
  assert.equal(revision, 1);
  assert.deepEqual(errors, []);
  await popup.locator("summary").click();
  await popup.getByRole("button", { name: "中斷並清除本機中繼資料" }).click();
  await popup.getByRole("status").filter({ hasText: "已中斷並清除" }).waitFor();
  assert.deepEqual(
    await worker.evaluate(() => chrome.storage.local.get(null)),
    {},
  );
  await writeFile(
    path.join(out, "result.json"),
    JSON.stringify(
      {
        passed: true,
        actual_mv3_extension: true,
        model: "synthetic",
        world: "synthetic",
        virtualized_messages: true,
        preview_before_write: true,
        commit_count: 1,
        recovery: true,
        cross_branch_denied: true,
        disconnect_cleared: true,
        calls,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: actual MV3 extension onboarding, relay, commit, recovery, branch guard and disconnect.",
  );
} catch (error) {
  for (const page of context.pages()) {
    console.log(
      page.url(),
      (await page.locator("body").innerText()).slice(-1800),
    );
    console.log(await page.getByRole("status").allTextContents());
    await page.screenshot({
      path: path.join(out, "failure-" + context.pages().indexOf(page) + ".png"),
    });
  }
  console.log(
    "storage",
    await worker.evaluate(() => chrome.storage.local.get(null)),
  );
  throw error;
} finally {
  await context.close();
}
