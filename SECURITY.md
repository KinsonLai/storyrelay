# Security

Use a trusted, authenticated scene-v1 world. Prompt injection is not eliminated: original text and tool output are untrusted data. The client narrows execution to one selected branch/action/key and requires write confirmation, but backend authorization is essential.

Do not post saves, credentials or private story text in Issues. For sensitive disclosures, use GitHub private vulnerability reporting when enabled; otherwise request a private contact without including exploit secrets. A missing private channel is not a reason to publish a live credential.

No model/platform refusal bypass, CAPTCHA bypass, cookie extraction, filesystem access or shell tools are supported. If a request is blocked by a platform, treat it as blocked rather than routing the same denied action through a different surface.
