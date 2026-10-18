# StoryRelay 0.1.0

An independent MIT-licensed Chrome Manifest V3 extension for hosted scene-v1 text adventures inside official DeepSeek Web.

Player flow: install extension, connect one world URL, sign in normally, select a save and play. No userscript manager, model API key, local proxy or native host.

Includes fixed branch/action/idempotency binding, write previews, uncertain-result handling, receipt recovery and virtualized-message detection. All executable code is bundled. World access is granted one selected origin at a time.

**Install:** unzip the Chrome asset, open chrome://extensions, enable Developer mode, choose Load unpacked and select the extracted folder containing manifest.json. This is a sideload release; Chrome Web Store publication has not occurred. Disable any older userscript relay on the same sites.

**Compatibility:** requires a hosted scene-v1 world. Arbitrary MCP URLs are not supported, and no public playable world is bundled. No private novel/save data is distributed.

**Validation:** Node/release checks and an actual-MV3 synthetic world/model integration test passed. The predecessor userscript was live-tested with real DeepSeek, but a user-installed StoryRelay live-model test remains pending. See docs/verification.md for precise scope.

The Chrome ZIP doubles as the future store-upload package; publisher registration, accessible reviewer world, privacy disclosures and Google review remain necessary. No store listing or approval is implied.
