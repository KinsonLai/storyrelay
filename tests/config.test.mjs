import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProfile, validateSender } from "../src/config.mjs";
test("world profile accepts one HTTPS origin without credentials, query, fragment, or unsafe ports", () => {
  assert.equal(
    normalizeProfile("https://world.example/").origin,
    "https://world.example",
  );
  for (const value of [
    "http://world.example",
    "https://user:secret@world.example",
    "https://world.example/?token=secret",
    "https://world.example/#x",
    "https://world.example:1234",
    "https://chat.deepseek.com",
    "https://127.0.0.1",
    "https://localhost",
  ])
    assert.throws(() => normalizeProfile(value));
});
test("only top-level DeepSeek and the explicitly connected world can issue extension messages", () => {
  const profile = normalizeProfile("https://world.example");
  assert.ok(
    validateSender(
      {
        url: "https://chat.deepseek.com/a/chat/s/test",
        frameId: 0,
        tab: { id: 1 },
      },
      profile,
    ),
  );
  assert.ok(
    validateSender(
      { url: "https://world.example/deepseek", frameId: 0, tab: { id: 2 } },
      profile,
    ),
  );
  for (const sender of [
    { url: "https://evil.example", frameId: 0, tab: { id: 1 } },
    { url: "https://world.example", frameId: 1, tab: { id: 1 } },
    { url: "https://world.example", frameId: 0 },
  ])
    assert.equal(validateSender(sender, profile), false);
});
