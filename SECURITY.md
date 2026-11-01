# Security

## Poki static public demo

Poki — by Sintax Error is a public static website with two fixed fictional people
and memory-only state in one browser tab. It makes no data API requests and has no
real account, contact field, browser storage, analytics, notification request or
outbound message. Its consent checks illustrate behavior, not authentication or
proof of a human independent of the browser user. GitHub handles ordinary hosting
requests under its own privacy practices.

Only `site/` is uploaded by the Pages workflow. The Node MCP server, local relay,
private configuration and Some1 are not deployed. A CSP restricts data connections
to none, assets/scripts stay local, and event text is rendered as text. Static
hosting cannot supply production identity, end-to-end encryption or delivery
guarantees. Any future real messaging, embed SDK, account linking or paid Pro
service requires a new reviewed trust boundary and explicit status update.

Report site integrity, script injection, misleading permissions or accidental data
collection through the private reporting route below. See docs/POKI_PRD.md.

## Earlier SafeReach and Poke reference implementations

SafeReach v0.1 is a local, single-user mock prototype, not an emergency service.
No live SMS, production relay or external messaging credentials exist.
Do not use it as the only way to reach a person or service.

Security invariants:

- MCP requests cannot create approval or supply a destination phone number.
- Approval binds to one immutable recipient/message preview with five-minute expiry.
- Each attempt consumes consent before provider I/O; no automatic retry or fan-out.
- Contact revocation is checked on approval and send.
- Location and sensitive sharing are disabled; no arbitrary message text.
- Mock results never imply real contact or delivery.
- Registry submissions cannot trigger contact; stale/C/D data is exploratory only.
- Audit records contain no names, numbers, text, health data or location.

The OS account and operator are trusted. If the assistant can execute shell
commands/read files as that account, local terminal approval is not an independent
security boundary. A live release requires a separately isolated approval channel,
recipient opt-in, security review and human end-to-end tests. Key co-location,
Windows permissions and power-loss recovery remain limitations in this release.

Report consent bypass, data leakage, registry integrity or dependency concerns via
the repository's **Security → Report a vulnerability** option when enabled. If
private reporting is unavailable, open a public issue requesting a private channel
without exploit details or personal information. Do not post secrets or private
contact data. There is no staffed emergency/security response SLA or bounty.

Only the latest main branch receives prototype fixes. See docs/THREAT_MODEL.md.

## Poke feasibility prototype

The separate `npm run inbox` service is an HTTP loopback listener with ephemeral
paired browser sessions. Its browser bearer token authorizes explicit actions;
its separate MCP credential can only read its own inbox or prepare a poke. This
separation is enforced server-side. Browser credentials, a compromised relay or
same-user shell/browser authority can bypass the intended human interaction.
There is no independently attested human click, E2EE or durable identity.

Invites require mutual acceptance and manual identity checking; tokens expire,
previews bind to the current peer, sends are bounded, and recipients can mute or
disconnect. No chat text/phone/location/sensitive payload is accepted. Request
Host/Origin, strict schemas, body bounds, no-store/CSP and read/prepare-only
connector routing are checked. Remote TLS is an operator/proxy obligation, not
provided by the HTTP server. The coarse socket-IP limiter is unsuitable for a
general public shared-proxy deployment. There is no authorized deployment.

Do not expose Codex App Server, grant broad conversation control, send arbitrary
prompts, or run background model turns to implement a poke. No automatic insertion
into an existing Codex chat is implemented or verified. See docs/POKE_PRD.md and
docs/POKE_THREAT_MODEL.md for the actual scope and blockers.
