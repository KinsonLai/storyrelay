# Chrome Web Store handoff

Status: release ZIP prepared for sideload/testing; **not submitted or approved**. The owner does not yet have a Chrome Web Store developer account. A public repository/release is not a store listing.

## Publisher steps

1. Register in the [developer dashboard](https://chrome.google.com/webstore/devconsole) using the intended publishing account. Owner completes any legal agreement, fee and identity/account verification. Do not share passwords or pay through an automation workaround.
2. Upload the release ZIP with manifest.json at its root.
3. Use the listing text below, icon in `extension/icons/128.png`, and actual UI screenshots from QA. Screenshot captions must say synthetic test world when the data/model are fixtures.
4. Set the hosted privacy policy URL to `https://kinsonlai.github.io/storyrelay/privacy.html` (Pages enabled and this URL verified in Chrome on 18 October 2026). Otherwise use the public repository's privacy HTML source link, or host the policy through a normal public HTTPS page. Do not enter an unverified Pages URL.
5. Complete data/permission disclosures accurately, supply a reviewer-accessible compatible world and test account if required, then submit for review. There is currently no publicly hosted compatible demo; this remains a store-readiness dependency, alongside account registration.

## Listing draft

**Name:** StoryRelay — MCP Adventures for DeepSeek

**Short description:** Play receipt-aware MCP adventures in DeepSeek Web. No model API key, local proxy or userscript manager.

**Full description:** Connect one compatible hosted adventure, sign in normally and choose your save inside DeepSeek. StoryRelay relays explicit tool requests, previews writes and displays actual server save receipts. Every turn is bound to the chosen branch and original player action. Recover an uncertain submission by its original key. Designed for scene-v1 worlds, not arbitrary MCP endpoints. Requires DeepSeek Web and a compatible hosted world; no public playable world is included. Independent project, not affiliated with DeepSeek, Google or OpenAI.

## Privacy / permissions declarations

- Single purpose: connect a player-started DeepSeek text adventure to its selected hosted game server.
- `storage`: selected world, bounded transient tool messages and last request recovery metadata. No sync or analytics.
- `scripting`: inject the bundled relay only on the explicitly granted world origin.
- DeepSeek host access: read new final assistant tool requests and insert actual tool results during authorized turns.
- Optional `https://*/*`: permits choosing a hosted world; only that selected origin is requested at runtime. Explain this clearly to reviewers; it is not blanket granted host access at install.
- Data processed: website content / game context, selected action and tool results. Context is transmitted to DeepSeek and the chosen world as required by the feature; do not claim that no data ever leaves the device.
- No credentials/password/cookie extraction, tracking, ads, remote executable code, local shell or native messaging.

Select the dashboard's current data-use categories according to these facts; do not blindly copy category labels from this file if the dashboard changes. The privacy policy is in `extension/privacy.html`.
