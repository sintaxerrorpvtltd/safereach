# Poki connected preview — threat model

## Overview

Poki is a consent-based social greeting app. The public landing demo is fictional;
the separate built account client uses a new Clerk application and Convex
development project. Electron can display an opt-in, finite desktop greeting.
Earlier SafeReach mock/MCP and ephemeral Poke workflows remain separate references.

| Component | Source / role |
|---|---|
| Cloud identity boundary | apps/connected/convex/auth.config.ts; only Poki Clerk issuer, audience convex |
| Profiles, relationships, greeting authority | apps/connected/convex/schema.ts; social.ts:24–91 |
| Presence | social.ts:23,41,67; private own-user rooms through @convex-dev/presence |
| Browser account UI | apps/connected/src/main.tsx; App.tsx; server calls are re-authorized |
| Desktop main / renderer boundary | desktop/main.mjs:18–50; preload.cjs; helpers.mjs |
| Local HTTP/static boundary | src/poke-server.ts:16–103; Host/Origin, strict schemas, bounded build allowlist |
| Publication | scripts/publish-site.mjs; desktop/helpers.mjs packageFileAllowed; no env/source photo |

| Workflow | Resource / authority | Safe effective value | Readers/writers | Control / limit |
|---|---|---|---|---|
| Account app | Clerk sessions and JWT verification | Dedicated Poki development issuer; no Some1 issuer | Clerk client; Convex auth | Exact issuer + audience, all public functions require identity |
| Connected service | Profile/friend/greeting records | New project poki / tangible-butterfly-887 | Caller-owned rows and accepted peers | Auth-derived identity, indexed bounded queries, membership checks |
| Presence | Availability | Own-user presence room, friend-filtered view | Own heartbeat; accepted friends only | Opt-in Available, DND/invisible unavailable; no public room/token API |
| Desktop | Native window and bounded display IPC | Exact configured loopback main frame | Trusted renderer can request local display | Sandbox, context isolation, Node disabled; strict payload; opt-in |
| Packaging/Pages | Client code and public settings | Runtime allowlists; public keys/URLs only | Public readers; maintainer publication | Env/photo/state exclusion; no backend admin key |
| Offline references | Mock vault / local paired tokens | Local-only default; ephemeral Poke state | Trusted OS operator, paired browsers, restricted MCP token | Not E2EE; shell shares operator authority |

## Threat model, trust boundaries and assumptions

Protected assets: authentication, private email/account data, friendship graph,
availability, inbox contents, exact consent binding, operator credentials and
desktop execution integrity. Ordinary authenticated attackers can control their own
profile, requests, IDs and API inputs. They cannot mint another user’s Clerk token,
change Convex functions or read the operator’s files. A compromised OS/admin account,
malicious main process or stolen browser session already has that account’s authority;
those are outside the claimed independent human-approval boundary.

Every public backend operation authenticates and resolves its caller-owned profile.
IDs alone confer no ownership. Exact username discovery is opt-in; a guessed private
profile ID cannot be turned into a block-list profile lookup. Accepted friendships
are rechecked for presence, preview, send and inbox/read operations. Greeting previews
bind sender, recipient, friendship instance, reaction and expiry; unknown labels,
recipient changes and replay fail. Removing/replacing the friendship invalidates old
previews. Mutation cooldowns and bounded circles/history limit ordinary churn.

Electron accepts fixed IPC from the exact main frame, not arbitrary child frames.
The overlay cannot send/approve or enable itself. It is nonfocusable and click-through,
uses a five-second hide timer and respects reduced motion. Actual OS focus/timing,
sleep/resume and Windows behavior still need device acceptance. The renderer remains
trusted app code; IPC validation is not an independently attested human click.

Auth return URLs preserve the current application path, including GitHub Pages project subpaths, and discard caller-supplied redirect queries (apps/connected/src/location.ts).

The connected service is development-only, not a production or E2EE claim. Clerk,
Convex and GitHub retain their normal service-side access/logging. No connected photo
or AI-generation API is deployed. A free signup avatar is planned but must introduce
separate provider-upload consent, retention/deletion, budget and result-sharing review.

## Attack surface, mitigations and attacker stories

These are scenario analyses, not claims of current exploitable vulnerabilities.

| Priority | Scenario / new capability | Prerequisites / impact | Existing controls | Mitigation / evidence |
|---|---|---|---|---|
| High | Forged identity or cross-user reads | Valid attacker's account, guessed IDs; private graph/inbox disclosure | Verified Clerk issuer/audience; identity-derived profile; owned/mutual relationship checks | social.ts:13–24,41–65,79–91; auth and ownership tests |
| High | Send without the approved recipient/reaction | Attacker can call APIs or alter client; unwanted external effect | Server-owned preview, sender/recipient/reaction/text/friendship/expiry checks; single-use state | social.ts:70–78; altered/replayed/expired/other-user tests and live two-test-account check |
| Medium | Discover hidden user / track availability | Authenticated stranger; metadata leakage | Exact opt-in discovery, no directory; own-room presence filtered by accepted relation; block/DND/invisible | social.ts:23,34–69; private-ID/block regression test; no last-seen endpoint |
| High | Renderer escalates to native filesystem/process authority | Renderer injection or navigation to attacker page | Sandbox, Node disabled, context isolation, fixed validated IPC, exact frame/origin, restricted network/navigation | desktop/main.mjs:18–50 and helpers.mjs tests; do not expand preload generically |
| Medium | Loopback CSRF / DNS rebinding / static file exposure | Malicious website or local request; paired token/control abuse | Exact Host/Origin; bearer auth; body bounds; basename/build-file allowlists; lstat rejects symlinks | src/poke-server.ts; origin/host/static boundary tests |
| High | Publish admin keys or source photos | Maintainer build/config mistake | Ignore rules plus authored runtime/publish allowlists; only public client settings | setup/package allowlist tests; manually inspect release payload; uploads must never enter source/build |
| Conditional | Compromised dependency/release source | Supply-chain control; code under operator account | Pinned lockfiles, lifecycle scripts disabled, official Electron binary checksum verification | Five moderate dev packaging advisories remain; do not process untrusted globs; re-review upgrades |
| Future high | Photo leaks to friends/provider without approval | Requires new image API/storage implementation, currently absent | Connected preview has no photo upload/provider call | Keep raw photo private; explicit provider consent, idempotent budget limit, deletion, preview before publishing result |

## Severity calibration

Critical would require demonstrated broad cross-user account takeover or remote
native code execution across an actual exposed trust boundary. Neither a local
operator calling its own tools nor an unsigned package alone establishes that.

High applies to authenticated cross-user private data access, a proven server
consent bypass, or renderer escape into main-process authority. Existing controls
and concrete exploit prerequisites must be assessed before making such a finding.

Medium covers meaningful profile/presence leaks or bounded misuse across a real
authority boundary; guessed IDs are not authorization. Low includes self-only UI
faults or limited denial of service without new data access. Untested devices,
provider limits and missing image APIs are evidence/product gaps, not themselves
proof of a vulnerability.

Repository: https://github.com/sintaxerrorpvtltd/safereach
Version: source snapshot SHA-256 084479c95ee2bf7e4a785d3128a1cbb8ee41afdd7d458bf5cfe85757a8a2b26d
