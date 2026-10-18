# StoryRelay

**Play in DeepSeek. Keep the world's receipts.**

A small Manifest V3 extension for **hosted, persistent MCP text adventures inside the official DeepSeek website**. No model API key, local proxy, native host, terminal or userscript manager for players.

[Project page](https://kinsonlai.github.io/storyrelay/) · [繁體中文](README.zh-TW.md) · [Compatibility](docs/world-contract.md) · [Comparison](docs/landscape.md) · [Privacy](extension/privacy.html) · [Store submission](docs/store-submission.md)

## What makes it specific?

MCP in web chat already exists. StoryRelay focuses on **browser-authenticated adventures with transactional saves**:

- One world URL, normal sign-in, explicit save selection.
- Pin each turn to its original player action and branch.
- Preview writes by default. Unknown non-read-only tools also require approval.
- One stable commit key per turn; uncertain transport is never shown as success.
- Recover the original server receipt instead of blindly replaying a save.
- Handle DeepSeek's virtualized message list without relying on DOM message counts.
- Keep knowledge boundaries and source rules in the server's operating bundle. A skill acknowledgement does not prove semantic compliance.

This is a niche, not a claim to have invented MCP bridging. [Evidence and overlap →](docs/landscape.md)

## Install

**Chrome Web Store: not published yet.** There is no store ID or one-click store install at this stage. A ZIP release is available for early adopters; store onboarding requires publisher registration and Google review.

1. Download `storyrelay-chrome-0.1.0.zip` from Releases and unzip it.
2. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the extracted folder containing `manifest.json`.
3. Open StoryRelay from the extension toolbar. Paste your compatible world's HTTPS homepage and choose **Connect**. Grant access only to that world.
4. Sign in normally to the world and DeepSeek. In DeepSeek, choose **Connect world**, select your save, enter an action and start.

The world tab is opened automatically and becomes the authenticated relay. Keep it open. Ordinary save commits have a preview confirmation; optional auto-commit applies only to the current turn. Forks/restores always need confirmation.

Disable older userscript bridges on the same sites to avoid duplicate UI and competing relays. Pin the extension through Chrome's toolbar if desired.

## Compatibility — read this before connecting

StoryRelay currently supports the **scene-v1 adventure contract**, including `prepare_scene`, `finish_scene`, branch listing and receipt recovery. It is **not an arbitrary MCP client** and cannot connect to every `/mcp` endpoint just by pasting its URL. Hosted worlds need a same-origin browser-authenticated RPC route. The original private Taixu adapter implements this contract; its novel, private hostname, saves and credentials are not included here. No public playable world is bundled yet.

World authors integrate once; players do not run a local server. [Exact integration contract →](docs/world-contract.md)

## Development

Requires Node 22+. No product npm dependencies or build-time network downloads.

```sh
npm test
npm run build
npm run check:release
```

Load `extension/` as unpacked. All executable code is packaged locally. No remote code, DeepSeek private API or extracted authentication token is used.

Optional browser QA uses an existing Playwright installation:

```sh
node scripts/test-browser.mjs /absolute/path/to/playwright/index.mjs
```

The browser fixture runs the **actual extension** in a disposable Chromium profile with synthetic DeepSeek replies and synthetic RPC, one narrowly pregranted test origin and no user cookies. It checks onboarding, virtualized messages, preview-before-write, one commit, receipt recovery, cross-branch rejection and disconnect. It does not certify Google review or real-model narrative quality. The predecessor userscript completed a real DeepSeek web prepare/commit/recovery test on 18 October 2026; that is not an installed-extension live-model test.

## Data and limitations

Only turns you start are eligible for execution. Selected story context and tool results are inserted into your DeepSeek conversation and sent to your chosen world. Local relay state includes a last request key for recovery. Disconnect clears extension-local relay data, not DeepSeek chats or cloud saves. [Privacy policy](extension/privacy.html).

Website DOM changes, model protocol mistakes and service-side limits can interrupt a turn. The backend must enforce identity, atomic saves, idempotency, stale-revision checks and world rules; this client cannot guarantee that an LLM always obeys prose or character rules. No CAPTCHA/login/rate-limit bypass is provided. No local file or shell execution is exposed.

MIT. Independent community project, not affiliated with DeepSeek, Google or OpenAI.
