# scene-v1 world integration

This is a versioned adventure adapter, **not the MCP specification**. MCP transport alone does not imply compatibility.

Players supply the world's HTTPS origin. The extension opens `/deepseek` and uses same-origin `POST /api/deepseek/mcp` from that world's content script. Normal browser cookies stay on the origin; this route must authorize the signed-in player independently. Do not rely on client-provided owner fields or CORS as authentication.

World authors provide:

1. A browser sign-in page at `/signin-with-chatgpt?return_to=%2Fdeepseek` for the current adapter. Hosts using another identity provider must adapt the login link in `src/runtime.mjs` until login discovery is standardized. The extension does not implement OAuth or accept tokens from the model.
2. JSON-RPC 2.0 `tools/list` and `tools/call`; JSON responses with bounded text content. The route must require exact Origin, authenticated identity, POST and bounded bodies. The platform's machine-only `/mcp` may need a separate browser entrypoint that reuses the same dispatcher after browser authentication.
3. `list_if_branches` returns `{main:{branch_id,name,revision},if_branches:[{branch_id,name,revision}]}`. IDs are `[A-Za-z0-9_-]{1,100}`. A save is always explicitly selected.
4. `prepare_scene` accepts `branch_id,player_action` and returns the complete current state, evidence, required skill documents, policy hashes, all adjudication outcomes, preparation ID and current revision.
5. `finish_scene` accepts the branch/action, expected revision, preparation ID, writing skill acknowledgement, check-context hash, evidence references, narration and structured changes. It must atomically validate policy, complete adjudication set and ownership before writing. Return `{committed:true,revision,event_id,snapshot:{markdown}}` only after success.
6. `get_scene_recovery` is read-only and accepts `branch_id,idempotency_key` (and optional draft_id). Return `{submission:{status:'committed',receipt}}` for a committed key, or an explicit unconfirmed state. Never manufacture success when a key is absent.

MCP responses use `{jsonrpc:'2.0',id,result:{content:[{type:'text',text:JSON.stringify(value)}],isError:false}}`. Errors must remain errors. Each response must fit 98 KiB, and the text returned to the web composer must fit 72,000 characters. Paginate optional material rather than silently truncating required rules or adjudications.

The client pins `branch_id`, original `player_action`, and `storyrelay-<turn nonce>` for final commits. Reuse the same key with the exact same payload to recover an uncertain transaction; conflicting payloads must fail. Other mutating operation keys include the tool name. Do not accept client-minted outcomes or unchecked inventory costs.

Unknown non-read-only tools require manual approval. `prepare_scene`, `prepare_turn` and `roll_check` may run within an explicitly started turn; final commit defaults to manual confirmation. Fork, restore, initialize and start operations always require confirmation. Tool schemas must be exact, with required fields and bounds.

Do not use the extension as the authoritative security or game-state boundary. Text rules cannot guarantee model compliance. Do not give it filesystem or shell execution tools. A developer can replace this named adapter while retaining the transport and authorization model; document any changed guarantees.
