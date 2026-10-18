# Verification — 18 October 2026

- Five Node tests passed: public-origin validation, trusted top-level sender boundaries, current-turn request parsing, generic branch/action/key binding and error/receipt distinction.
- Release checks passed: packaged JavaScript syntax, matching versions, Manifest V3 permission constraints, required documents/icons and private-source pattern scan.
- Actual MV3 extension ran in a disposable Playwright Chromium profile. World and model were synthetic. The world test origin was pregranted only in the fixture manifest; this does not test a real user's installation or optional-host permission prompt.
- The fixture exercised popup setup, existing world-tab reuse, real extension storage/messaging, virtualized assistant nodes, preview before any write, one commit, recovery, blocked cross-branch request and disconnect clearing local data.
- The final UI screenshots on the project page are from this synthetic fixture. They do not portray a public live world or a Google-approved store listing.
- A predecessor userscript completed real DeepSeek Web prepare_scene → finish_scene → receipt recovery against a private engine. The independent diagnostic save advanced from revision 1 to 2, while main and story IF checkpoint hashes stayed identical. That result supports the extracted protocol, but is not an installed StoryRelay-extension live-model test.
- No private novel, production save, account credential or private-world origin is in this repository.

Remaining external validation: real Chrome user install + optional permission prompt, live DeepSeek with this installed extension, publicly hosted reviewer-compatible world, and Chrome Web Store review. Future DeepSeek UI changes can require adapter updates.
