# SafeReach threat model — v0.1

## Overview

SafeReach is a model-neutral local mock handoff service. An assistant can offer an ordinary check-in, but cannot approve it through MCP. A trusted human operator reviews the exact recipient and one of three fixed texts. All sends are simulations; no provider credentials or remote listener exist. This model maps actual source, not production readiness. A fresh-context architecture reviewer inspected the core source read-only; the primary agent verified its material claims. This is not an independent security certification.

| Component | Source | Role |
| --- | --- | --- |
| stdio MCP | src/server.ts:10–43 | Six strict-schema tools; no approval or enrollment endpoint |
| Local operator | src/operator.ts:8–36 | Enrollment attestation, exact preview approval, revoke, metadata audit |
| Handoff service | src/service.ts:14–114 | Permission, expiry, lifecycle, limits, consume-before-I/O |
| Schemas | src/model.ts:3–34 | Fixed texts; location/sensitive flags false; bounded state |
| Filesystem vault | src/store.ts:7–53 | Authenticated encryption, private modes, lock and atomic rename |
| Mock SMS | src/provider.ts:4–18 | Provider contract; in-process simulated result |
| Registry | src/registry.ts:4–26 | Bundled provenance validation and tier/freshness filtering |

| Deployment or workflow | Resource or capability | Configuration and precedence | Safe effective value or location | Readers, writers or recipients | Enforcing control | Evidence or unknowns |
| --- | --- | --- | --- | --- | --- | --- |
| npm/plugin MCP | Model tool authority | npm start or mcp.json | node dist/src/server.js over stdin/stdout | Launching MCP client | Strict schemas; no approval/enrollment tool | src/server.ts:14–40; mcp.json |
| Local operator | Human approval | npm run operator -- approve UUID | Pending draft, exact contact and fixed message; original five-minute expiry | Human terminal, then service | TTY and literal APPROVE; lock; expiry before/after prompt | src/operator.ts:9–27; src/service.ts:94–103; no separate human identity proof |
| Native server/operator | Ciphertext | SAFEREACH_HOME, otherwise homedir default | <private directory>/vault.enc; default ~/.local/share/safereach/vault.enc | Same OS account | AES-256-GCM; 0600 file; 0700 directory; schema validation | src/store.ts:7–50 |
| Native server/operator | Encryption key | Same directory resolution | <private directory>/vault.key | Same OS account | Exclusive creation, 32-byte check, regular-file check, chmod 0600 | src/store.ts:21–33; key co-located with ciphertext |
| Native server/operator | Serialization lock | Same directory resolution | <private directory>/lock | Every Store transaction | Exclusive mkdir; no automatic stale-lock recovery | src/store.ts:17–19,53; approval holds lock while human reads |
| Docker | Vault and key | Dockerfile SAFEREACH_HOME; explicit volume mount | /home/node/.local/share/safereach/{vault.enc,vault.key,lock} | Container node user; host volume administrator | Non-root image; same vault controls; documented --network none | Dockerfile:11–20; actual image execution untested locally |
| Mock send | Resolved recipient/text | SafeReach default provider | In-process MockSmsProvider; no network destination | Trusted adapter code | Declared live providers rejected; attempted state saved before call | src/service.ts:26–27,56–78; src/provider.ts:10–18 |
| Compiled registry | Public reference data | import.meta.url in dist/src/registry.js | <repository/plugin root>/registry/IN/national.json | Resource tool caller | Local schema, exact-city/national matching, tier/freshness checks | src/registry.ts:15–26; no URL fetch or resource-contact action |
| GitHub CI | Test/build execution | push/pull_request; committed workflow | Fresh hosted runner, npm lockfile and Docker build context | GitHub runner | contents:read, no secrets, npm --ignore-scripts, bounded job | .github/workflows/ci.yml; Dockerfile:1–9 |

## Threat model, trust boundaries and assumptions

Protected assets are contact numbers/names, contact permissions, exact per-action approval state, bounded audit history and registry integrity. Model callers can select IDs/templates, enumerate permitted contact display names, create/cancel drafts, request simulation of an approved draft, and retrieve resource metadata. They cannot provide arbitrary text, phone numbers, approval, location, or health summaries through MCP (src/server.ts:24–35; src/model.ts:3–23). Conversation history is not accepted.

The operator and local OS account are trusted. A host with shell/filesystem access as that account can read the key, invoke approval code, create a pseudo-terminal or modify application state. The TTY check is a UX safeguard, not a separate security principal. Skill instructions explicitly forbid the assistant from driving approval, but cannot enforce that restriction against a shell-capable host (skills/safereach/SKILL.md). Before live sending, isolate approval in a separately user-owned surface that the model cannot drive.

Approval binds to the same immutable persisted draft UUID, contact ID, fixed text and expiry, under trusted-local-state assumptions. The tool cannot edit contact destinations. Permission is rechecked before approval and send. A cancelled, expired, revoked, attempted, simulated or failed action cannot execute again (src/service.ts:14–23,46–78,94–114). No signed capability, OAuth identity or multi-tenant boundary is implemented.

Metadata audit contains event, time and opaque IDs, never names/numbers/messages; fixed draft texts and contacts reside in the encrypted vault. Key co-location means a backup of the whole directory or same-account compromise defeats confidentiality. Audit is mutable by that account, not tamper-evident. Cleanup is lazy, bounded retention, not guaranteed background deletion (src/model.ts:19–34; src/service.ts:6–12,37; src/store.ts:21–50).

Registry labels are trusted-code assertions, not cryptographic or external verification. Default search filters out expired/future-dated verification and C/D tiers. A/B entries remain subject to human verification, and no opening-hours/proximity guarantee follows from inclusion (src/registry.ts:18–26). The national seed has public official provenance but only one maintainer review; a second review is outstanding under the governance policy (registry/README.md). There are no local hospital records, signed registry builds or live imports.

Unix private modes are assumed; Windows ACL behavior, hostile ancestor directories, OS account compromise, power-loss durability and full dependency internals are unvalidated. Atomic rename limits ordinary partial writes but no fsync protocol is claimed. Docker CI is a planned execution check, not evidence until it completes. No deployed service or real messaging path is in scope.

## Attack surface, mitigations and attacker stories

The following are scenarios, not validated vulnerability findings.

| Priority | Scenario and capability gain | Prerequisites | Impact | Existing controls | Mitigation | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| High before live messaging | Prompt-injected MCP caller forges consent or changes destination/text | Only MCP tool access | Unwanted external contact if live sending were added unsafely | Strict schemas, fixed text, no phone/approval endpoint, local per-action approval; mock only | Preserve independent approval boundary and exact payload binding | src/server.ts:14–30; src/service.ts:33–78,94–103 |
| High before live messaging | Shell-capable assistant approves its own draft | Same local-user execution authority | Would bypass human intent with a live adapter | Explicit documented limitation; mock only; no real adapter | Separate user approval device/process/account; do not treat skill or TTY as enforcement | src/operator.ts:9–27; src/store.ts:21–33; skills/safereach/SKILL.md |
| Medium | Replayed or concurrent send duplicates a check-in | Approved action ID and repeated tool calls | Harassment/cost in a future live adapter | Exclusive lock, approved-only transition, attempted persistence before I/O, no automatic retries | Retain at-most-one attempt; add real provider idempotency/reconciliation before live release | src/store.ts:17–19; src/service.ts:56–78 |
| Medium | Provider exception/unknown outcome causes dishonest delivery or automatic resend | Provider failure or process crash | False reassurance or duplicate outreach | Mock labeled simulated, failure generic; attempted/failed never auto-retried | Live status must distinguish accepted/delivered/unknown; test voluntary recipient devices | src/provider.ts:3–18; src/service.ts:63–78 |
| Medium | Fake/stale resource becomes recommended | Ability to modify bundled registry or get a malicious PR merged | Misdirection toward an unsafe resource | Provenance schema; fresh A/B defaults; no contact action; no source URL execution | Enforce review policy and signed release pipeline before expanding trusted directory | src/registry.ts:4–26; registry/README.md |
| Medium | Private data enters repository, logs or host tooling | Contributor/operator error or same-account host access | Contact disclosure | Git ignore rules; fictional fixtures; metadata audit; generic tool failures; Docker context allowlist | Keep vault outside checkout; review publication payload; do not mount state into model host | .gitignore; .dockerignore; src/server.ts:18–20; src/model.ts:26–30 |
| Low in mock MVP | Draft churn or abandoned transaction blocks service | MCP tool access, or killed process holding lock | Local denial of service | 100 active previews, bounded audit, preserved daily-attempt evidence; fail-closed lock | Explicit human recovery after stopping processes; later nonblocking approval design | src/service.ts:6–12,37–38,61; src/store.ts:17–19,53 |
| Conditional supply-chain | Dependency/CI/plugin package replaced | Control of dependency/release/host installation path | Local code execution under operator account | Exact dependency versions/lock integrity; no install scripts; CI read permissions; no auto-install hooks | Review upgrades, pin release artifacts; host remains trusted | package.json; package-lock.json; .github/workflows/ci.yml; plugin.json |

## Severity calibration

Critical: a future remotely reachable unauthenticated bulk live-contact or vault-exfiltration path across users could qualify; no such deployment or tenant surface exists here.

High: a demonstrated consent bypass across an independently enforced approval boundary or cross-user private-data disclosure would qualify in a live release. A same-user shell invoking local exported functions is not a new privilege boundary in this prototype; it is an explicit release blocker for live messaging.

Medium: reachable disclosure of contact metadata to an unauthorized principal, replay across a real provider boundary, or promotion of malicious resource data after a distinct trust boundary failure. Consequences depend on live transport, directory coverage and attacker write prerequisites.

Low: bounded local availability issues without new data access or external effect. A model requesting C/D exploratory resources is authorized behavior with labels, not itself a vulnerability. Unverified Docker, host UI, resource availability and power-loss behavior are evidence gaps, not proven defects.

Repository: https://github.com/sintaxerrorpvtltd/safereach
Version: source snapshot SHA-256 7ee0fa087dc716b68a51983abeaf57a0b150e4f27b8999c42c53dfef84028ab2 (src files sorted by name)
