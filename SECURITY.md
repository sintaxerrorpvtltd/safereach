# Security

## Poki connected development app and desktop

Poki now has a separate Clerk application and Convex development project for
username accounts, private mutual friendships, availability and fixed reactions.
It is not production-ready or end-to-end encrypted. Only the new Poki Clerk issuer
is trusted by this backend; no Some1 identity, data, deployment or keys are reused.

Invariants:

- Every public data function authenticates the caller. Profile identity comes from
  the verified token, never a supplied user ID. Usernames are exact-match and
  discovery is opt-in; there is no global directory or presence endpoint.
- Presence is shared only across accepted friendships. DND/invisible do not reveal
  online status, activity, device/location details or last-seen time.
- Every send binds a single server preview, sender, recipient, friendship instance,
  fixed reaction and expiry. Unknown text/reactions, reassignment and replay fail.
- Blocking/removing a friend revokes greeting/presence access and old previews.
  The app shares no read receipts. Greetings expire after five minutes.
- Desktop pop-ins are off by default and run only after explicit local opt-in.
  Renderers are sandboxed with Node disabled; preload exposes fixed, bounded IPC.
  Only the exact main frame can enable/display; the overlay has no send authority.
- Downloads/builds omit source photos, environment files and user state. Public
  Clerk publishable keys and Convex client URLs are client configuration, not
  administrator credentials. The setup refuses to overwrite a different backend.
- No raw photo or image API is part of the connected release. Free signup avatar
  generation remains planned and requires separate upload consent, provider/budget
  configuration, private retention/deletion, review and output-sharing approval.

Known limits: prototype service limits and abuse controls, unsigned app folders,
Windows runtime and cross-device/sleep/resume/focus acceptance, no auto-updater,
and five moderate advisories in development-only packaging dependencies. Packaging
uses an authored runtime allowlist and does not process user-supplied globs.
No independent security audit or absolute safety guarantee is claimed.

See docs/CONNECTED_THREAT_MODEL.md and docs/POKI_VERIFICATION.md. Report auth bypass,
private friend/presence disclosure, consent replay, renderer/main boundary issues,
or accidental secret/photo publication through the private reporting route below.

## Public landing page and fictional demo

The landing demo uses fictional people in one tab and no data connections. The
separate `/app/` route is a real development client using Clerk and Convex; its CSP
permits the configured provider origins and Clerk's documented protection resources
(`*.protect.clerk.com`, Cloudflare challenges and first-party blob workers).
Protection hosts are limited to their required directives; arbitrary HTTPS scripts
remain blocked. The Pages artifact includes only
static built client assets/public settings, never server functions or secrets.
No analytics or conversation monitoring is installed. GitHub, Clerk and Convex
handle their normal service requests under their own policies.

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
