# SafeReach Poke — feasibility threat model

## Overview

This model covers the optional Poke prototype in the same Syntax Error Pvt Ltd repository. It supplements the v0.1 SMS/resource baseline. Scope is a local working proof with a conditional self-hosting interface, not a deployed multi-user service. A fresh-context architecture pass mapped the new source read-only; the primary agent checked its material claims and the current implementation. This is not a full security certification.

| Component | Source | Role |
| --- | --- | --- |
| Ephemeral pair/event store | src/poke.ts:4–119 | Session, invite, pairing, previews, rate-limited hello events |
| HTTP prototype | src/poke-server.ts:16–101 | Loopback UI/API, bearer capability separation, Host/Origin validation |
| MCP HTTP client | src/poke-client.ts:6–22 | Private configured credential, read/prepare requests only |
| MCP integration | src/server.ts:37–40 | Two no-argument poke tools, no approval or send tool |
| UI | web/index.html; web/app.js | Mutual opt-in, explicit poke/approval, mute/disconnect, latest animation and retained history |
| Product constraints | docs/POKE_PRD.md; docs/POKE.md | Local proof versus unverified remote/Codex push, user/relay trust limits |

| Deployment or workflow | Resource or capability | Configuration and precedence | Effective location/value | Readers/writers or recipients | Enforcing control | Evidence/unknowns |
| --- | --- | --- | --- | --- | --- | --- |
| Default inbox | HTTP listener | options or SAFEREACH_POKE_PORT/HOST | http://127.0.0.1:4317 | Local browser and limited MCP HTTP client | Loopback default, exact Host/Origin, no CORS grants | src/poke-server.ts:16–22,33–34,89–99 |
| Conditional remote entry | TLS-proxied listener | public HTTPS origin + nonloopback host + behind-TLS-proxy flag | Operator-configured HTTP backend behind external TLS | Proxy/operator and authenticated remote clients | Startup assertions plus exact origin/host; TLS external | src/poke-server.ts:19–22,33–34,95–98; no deployed proxy verified |
| Browser authority | Session bearer | Generated at registration, sessionStorage in each tab | Own browser session; eight-hour expiry | Browser JavaScript and trusted relay | 192-bit random secret, authenticated browser-only routes | src/poke.ts:12,26–38; src/poke-server.ts:53–77; web/app.js:2,14,71 |
| Connector authority | Read/prepare token | Browser-issued JSON; absolute SAFEREACH_POKE_CONFIG path | Operator's private regular file, <=4096 bytes, no group/other permission bits | Local MCP host/process and configured relay | Separate token; only state/preview routes; rotation revokes old token | src/poke-client.ts:7–19; src/poke-server.ts:54–55; src/poke.ts:115–117 |
| Pairing | Invitation/request | User-created token in URL fragment, then explicit join and accept | Ten-minute single-use invite; reciprocal session IDs | Intended invite holder and inviter | Unguessable token plus human acceptance; no real identity proof | src/poke.ts:49–74; web/app.js invitation handling |
| Events/previews | Volatile memory | One PokeRelay instance | Eight-hour sessions, two-minute previews, last 20 events; no disk persistence | Relay operator; own authenticated browser/limited connector | Per-owner token filtering, current reciprocal pairing, recipient mute, expiry, single-use preview | src/poke.ts:19–47,87–113 |
| Quota | Socket-address request rate | request.socket.remoteAddress | 240 requests/minute per socket source address; 100 connections | Sessions sharing that source address | Bounded map, request/header timeouts, connection cap | src/poke-server.ts:35–40,89; proxy clients share a coarse quota |
| Rendered result | DOM and CSS animation | Same-origin static assets and visible-page polling | Name/event text nodes; finite 900ms animation; reduced-motion still | Browser user | textContent, no external assets, CSP; hidden-page polling paused | web/app.js; web/app.css |

## Trust boundaries and assumptions

The intended hostile caller is an MCP-only agent holding only its generated connector credential. It may read its own inbox and prepare a hello to the current peer. It cannot send, approve, pair, mute, disconnect, cancel a preview or issue credentials: the relay accepts connector tokens only on /api/state and /api/preview (src/poke-server.ts:53–77). The descriptive scope array and MCP annotations are not the authorization mechanism.

A browser credential has broader authority, including sends. A user pressing Poke is the explicit per-action authorization for that displayed peer and fixed hello. Assistant preparation has no external effect until browser approval of the bound preview. Preview approval checks current reciprocal peer, expiry and recipient mute, then consumes that preview before queuing the event (src/poke.ts:87–113). JavaScript event queuing is synchronous after request body parsing; duplicate approved previews cannot interleave successfully. Tests cover replay and the separate capability boundary.

Browser credentials, the relay operator and the same OS user with browser/shell access are trusted. This is not proof of an independent human click against an assistant with those broader credentials. Do not place user-action credentials in MCP config or use browser automation to approve a real user's action. The prototype is not a production approval isolation solution.

Pairing establishes session identity, not a verified human identity. A stolen invitation can request pairing under a misleading alias, but the inviter must still accept. Users must verify the person through their existing channel. Possession of a browser token grants that session's authority; no second factor or durable recovery exists (src/poke.ts:26–38,56–74).

State is plaintext in trusted process memory. The relay operator sees aliases, timing, secrets and events; there is no E2EE or anonymity. UI discloses operator visibility. Session expiry is checked lazily on register/authenticate, not through scheduled physical deletion. Restart drops all state. No conversation, phone, precise location, free-form body or medical payload exists in the protocol. Origin guards protect browser request context, not nonbrowser clients that can set headers; bearer authentication is still required.

Remote binding requires explicit HTTPS-origin/proxy assertions, but the application does not terminate TLS. A production proxy, identity system, abuse controls, per-user/proxy-aware quotas, secure operational storage and any notification host bridge remain unreviewed/unconfigured. All users behind one reverse proxy would share the current socket-IP quota; this is a prototype limit, not a scalable public relay.

MCP calls can expose hello events in an on-demand tool result. There is no event subscription, background agent, Codex App Server bridge, automatic turn injection or arbitrary-chat delivery. Actual stock Codex UI and remote-device behavior are unverified. Local automated MCP protocol tests and two-session browser tests establish only their respective boundaries.

## Attack surface, mitigations and attacker stories

These are scenarios and release prerequisites, not validated vulnerability findings.

| Priority | Scenario/capability gain | Prerequisites | Impact | Existing control | Mitigation/stop line | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| High before public operation | Stolen browser token impersonates its user | Read user tab storage or compromise relay | Unwanted pokes, changed pairing or disclosed aliases/timing | Session expiry, bounded sends, mutual pair and mute; limited connector has a distinct token | Separate user approval trust; hardened identity/session handling before any public service | src/poke.ts:26–47,87–117; src/poke-server.ts:53–77 |
| Medium | MCP prompt injection tries to authorize a poke | Limited connector token only | Unwanted outreach if role checks were bypassed | Browser-only action routes, no send MCP tool, strict no-argument tools | Preserve server-enforced role separation; never drive browser approvals as the model | src/server.ts:37–40; src/poke-server.ts:54–77; test/poke.test.ts |
| Medium | Invite interception/alias impersonation | Invitation secret and misleading alias | Pair with the wrong person if inviter accepts blindly | Ten-minute single-use invitation plus inviter acceptance; manual identity warning | Verify through usual independent channel; stronger pairing before wider release | src/poke.ts:49–74; web/index.html |
| Medium | Cross-origin action, clickjacking, injected alias HTML | Malicious web origin or caller-controlled name | Act as user or steal bearer token if controls fail | Bearer not automatically attached; exact POST origin/Host; no CORS; CSP/XFO; restricted names and textContent | Retain guards; audit any embedded widget/asset changes | src/poke-server.ts:9–13,27–34,49–51; web/app.js |
| Medium | Wrong peer/replayed/expired preview queues a hello | Old preview ID and browser authority | Poke after intended consent was withdrawn | Preview binding, expiry, single-use removal; reciprocal peer/mute recheck; disconnect clears previews | Preserve state machine and add durable idempotency only with persistent transport | src/poke.ts:76–113; test/poke.test.ts |
| Medium for public exposure | Plain HTTP exposed or proxy treated as TLS proof | Operator configures external exposure incorrectly | Token theft or impersonation | Loopback default; nonloopback startup assertions | Never expose raw backend; separately review actual TLS/proxy configuration | src/poke-server.ts:19–22,95–98 |
| Low in local proof | Session churn/request flood exhausts capacity | Listener access | Local unavailability; shared-proxy quota bottleneck | 100 sessions, 100 connections, body/time/rate bounds, bounded previews/events | Remain local; redesign public registration and proxy/user quotas before hosting | src/poke.ts:28,95,106–112; src/poke-server.ts:9–13,35–40,89 |
| Low | Multiple offline pokes cause repeated distraction or omitted history | Retained events while tab inactive | Confusing/overwhelming return | One animation for latest batch; all retained events in Recent hellos; no sound/notifications | Keep batching honest; do not imply a read receipt | web/app.js:53 onward; docs/POKE_PRD.md |

The architecture review identified missing UI operator-visibility disclosure and newest-only event rendering. The current UI now discloses no E2EE/operator access and includes retained history with an explicitly coalesced animation. Its proxy-quota limitation remains documented rather than hidden. The primary review also preserved preview/history DOM nodes when state is unchanged, avoiding lost keyboard focus from the two-second poll.

## Severity calibration

Critical would require a reachable boundary failure exposing other users' secrets or arbitrary code execution in a real deployed service; no such deployment is established.

High examples include a proven privilege gain from connector-only access to browser action authority or cross-session token disclosure. Same-user shell/relay administration already has broader authority; that is a release assumption and gap, not a newly isolated boundary.

Medium examples include replay across a real authorization boundary, cross-origin credential theft, or hijacking pair identity after a distinct control failure. Actual likelihood depends on token access, user verification and remote deployment prerequisites.

Low examples include bounded local denial of service, lost volatile state on intentional restart, and known coarse proxy quotas. Missing remote device, Codex host and screen-reader evidence are verification gaps, not proof of a defect or proof of safety.

Repository: https://github.com/sintaxerrorpvtltd/safereach
Version: source snapshot SHA-256 4f8624a06810dddc08fd738064b3f77fbaac2df39c1b1d6c21730cfcadb618bd (src then web files sorted by name)
