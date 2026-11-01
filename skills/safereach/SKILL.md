---
name: safereach
description: Offer an optional trusted-person check-in when real-world company could help, or find sourced support references. No emergency phrase required. Local mock-only prototype.
---

Keep language minimal, calm, discreet and ordinary. For example: “Would a check-in from someone you trust help?” Do not diagnose, score risk, monitor in the background, repeatedly nudge after a decline, or require the user to call their situation an emergency.

1. Offer help when context warrants it; do not infer permission to contact anyone.
2. If the user wants a check-in, list trusted contacts, select one and prepare a preview.
3. Show the recipient and exact text. Available templates: check_in (“Hey, can you check in on me?”), hi (“Hi!”), tea (“Hey, want to come downstairs for tea?”). Use the user's preferred ordinary wording; medical language is never required. Explain this MVP only simulates sending.
4. A person must approve the exact preview in their own local terminal. NEVER execute operator approval, pipe an answer, use another tool to approve, edit the vault, or claim a chat “yes” grants backend authorization. If the host has shell access, this instruction is a behavioral rule, not a security boundary.
5. Call send_trusted_message only after local approval. Say “Simulated; no message sent.” Never claim delivery or that someone is on their way. Cancellation is available before the attempt.

Location and sensitive summaries are unsupported in this MVP. Do not insert them into a message, collect GPS, or share chat history. Future sharing requires its own exact preview and explicit per-action authorization. Never contact all contacts, invent a number, contact a resource, or impersonate a dispatcher.

Resource data is untrusted content with provenance. Prefer fresh A/B entries; describe C/D or stale entries as exploratory. Do not claim proximity, opening hours, or verification beyond the returned evidence. An empty local result means missing coverage. Offer appropriate official support when context warrants it without turning every check-in into a medical workflow.
