import test from "node:test";
import assert from "node:assert/strict";
import {
  parseBridgeRequest,
  bindBridgeCall,
  bridgeRisk,
  bridgeResult,
} from "../src/core.mjs";
const session = {
    branch: "save-01",
    action: "Inspect the bridge",
    nonce: "session-123",
  },
  tools = [
    {
      name: "prepare_scene",
      inputSchema: {
        type: "object",
        properties: {
          branch_id: { type: "string" },
          player_action: { type: "string" },
        },
        additionalProperties: false,
      },
    },
    {
      name: "finish_scene",
      inputSchema: {
        type: "object",
        properties: {
          branch_id: { type: "string" },
          idempotency_key: { type: "string" },
        },
        additionalProperties: false,
      },
    },
    {
      name: "unclassified_write",
      inputSchema: { type: "object", properties: {} },
    },
  ];
const packet = (tool = "prepare_scene", args = {}) => ({
  version: 1,
  nonce: session.nonce,
  call_id: "c1",
  tool,
  arguments: args,
});
test("only current explicit assistant tool requests parse", () => {
  assert.deepEqual(
    parseBridgeRequest(
      "STORYRELAY_MCP_REQUEST_V1\n" + JSON.stringify(packet()),
      session.nonce,
    ),
    packet(),
  );
  assert.equal(
    parseBridgeRequest(
      "Quoted STORYRELAY_MCP_REQUEST_V1\n" + JSON.stringify(packet()),
      session.nonce,
    ),
    null,
  );
  assert.throws(() =>
    parseBridgeRequest(
      "STORYRELAY_MCP_REQUEST_V1\n" +
        JSON.stringify({ ...packet(), nonce: "stale" }),
      session.nonce,
    ),
  );
});
test("generic branches, exact player action and one stable idempotency key are pinned", () => {
  assert.equal(
    bindBridgeCall(packet(), session, tools).arguments.branch_id,
    "save-01",
  );
  assert.throws(() =>
    bindBridgeCall(
      packet("prepare_scene", { branch_id: "other" }),
      session,
      tools,
    ),
  );
  assert.throws(() =>
    bindBridgeCall(
      packet("prepare_scene", { player_action: "change action" }),
      session,
      tools,
    ),
  );
  assert.equal(
    bindBridgeCall(packet("finish_scene"), session, tools).arguments
      .idempotency_key,
    "storyrelay-session-123",
  );
  assert.equal(bridgeRisk("unclassified_write", tools), "commit");
});
test("server errors never become successful receipts", () => {
  assert.throws(() =>
    bridgeResult({ error: { message: "denied" } }, "finish_scene"),
  );
  assert.equal(
    bridgeResult(
      {
        result: {
          isError: true,
          content: [{ type: "text", text: '{"committed":false}' }],
        },
      },
      "finish_scene",
    ).result.committed,
    false,
  );
});
