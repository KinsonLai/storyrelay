# StoryRelay design

Audience: players using official DeepSeek Web with an existing hosted adventure. Success: install one extension, paste a world URL once, sign in normally, choose a save and play. No userscript manager, model API key, terminal, native host, JSON configuration or local server for players.

Scope: Manifest V3 extension, browser-session transport, scene-v1 adventure adapter, generic branch IDs, pinned action/branch/commit key, preview confirmation, receipt recovery, bundled source, bilingual onboarding, release ZIP and Web Store submission materials. Hosted worlds remain responsible for authentication and transactional game state. Other arbitrary MCP servers are not automatically compatible. No copyrighted novels or private saves are distributed.

Architecture: DeepSeek content script reads new final assistant requests only during a player-started turn. A content script on the explicitly approved world origin fetches its same-origin browser-authenticated RPC route. Extension-local storage carries bounded messages; credentials remain in the browser. A service worker only manages opt-in host permission, registered content scripts and opening the chosen world. All executable code ships in the extension.

Differentiation hypothesis: proxyless browser-authenticated, receipt-aware adventure client. MCP bridging, Skills and browser chat integration already exist; do not claim invention or unique market coverage. Defensibility must come from integration quality, save integrity and simple world onboarding, not generic MCP transport.

Plan: (1) URL/sender tests; (2) extract and generalize proven relay; (3) MV3 onboarding and explicit host grant; (4) virtualized-chat, preview/commit/recovery tests; (5) privacy/reviewer/demo materials and public source release; (6) attempt store handoff without pretending a ZIP is a store publication.
