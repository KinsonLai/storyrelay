# Landscape and niche — checked 18 October 2026

These comparisons summarize maintainers' documentation, not independent benchmarks. No assertion of exhaustive market coverage or exclusive invention is made.

| Project | Documented overlap | Documented setup / emphasis | StoryRelay's intended focus |
| --- | --- | --- | --- |
| [MCP SuperAssistant](https://github.com/srbhptl39/MCP-SuperAssistant) | DeepSeek/web-chat tool detection, execution, result insertion, auto modes | Generic multi-platform client; supports direct remote servers with CORS and a local proxy for other deployments | Browser-session world relay plus explicit branch/action/receipt workflow, rather than a general tool console |
| [MCP Bridge](https://github.com/scmypapa/mcp-bridge) | DeepSeek prompt injection, MCP calls, confirmations and Skills | Windows Native Messaging host; setup includes builds, extension ID and host installation | No native host or shell for players; same-origin authenticated hosted adventures |
| [DeepSeek++ / deepseek-connector](https://github.com/smart-kind/deepseek-connector/blob/main/README_EN.md) | DeepSeek extension, MCP services, permissions, Skills, memory and automation | Broad agent workspace, settings, projects, export and language support | Small adventure surface, durable save semantics and receipt recovery |
| [deepseek-web-harness](https://github.com/nezumi0627/deepseek-web-harness) | DeepSeek authenticated web session, browser bridge and local Skills | CLI/harness consumes DeepSeek Web as a model backend | Opposite direction: player stays in DeepSeek and a chosen game server owns state |

The core bridge is heavily overlapping. “No model API key”, “Skills”, “auto tool execution” and “Chrome extension” are not novel differentiators by themselves. Other projects may implement some of the reliability features too; their absence from a README is not evidence they lack them.

## Narrow value proposition

**A browser-authenticated, proxyless client for transactional text adventures.** The combination is useful to hosted game authors whose normal website session already identifies the player, and to players who want long-running games without running infrastructure.

The current implementation binds action/branch/key, previews writes, treats uncertain results as unconfirmed, queries receipts, and handles virtualized chat messages. The backend must supply idempotency and atomic revision enforcement. Those engine guarantees are not invented by or transferable solely through an extension.

## Honest differentiation limits

- Current compatibility is scene-v1, not all MCP servers.
- A compatible hosted world is still required; none is bundled as a public hosted service.
- Before Web Store approval, sideloading remains a setup obstacle.
- Long-term defensibility is an integration ecosystem, understandable onboarding and measured save reliability, not protocol exclusivity.
- Future work: world-author conformance kit, public original demo world, signed connection links, additional named adapters and independently reproduced real-model extension tests.

## Primary platform references

- [Chrome optional host permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
- [Manifest V3 locally packaged code requirements](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements)
- [Chrome Web Store publication and review](https://developer.chrome.com/docs/webstore/publish)
- [Playwright extension testing](https://playwright.dev/docs/chrome-extensions)
