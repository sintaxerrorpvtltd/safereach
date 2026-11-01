# SafeReach Poke — PRD v0.2

Maintainer: Syntax Error Pvt Ltd. Free and open source under Apache-2.0.
Status: local working prototype; remote hosting and automatic Codex chat delivery
are not configured or verified. This document updates the handoff product without
removing its original consent/privacy boundaries.

## Feasibility verdict and stop line

**A bounded version is feasible, but transport already exists.**
[Murmur Connect](https://github.com/alexfrmn/murmur) documents remote MCP messaging.
Its [Codex delivery guide](https://github.com/alexfrmn/murmur/blob/main/docs/codex-desktop-queue-wake.md)
describes opt-in queuing into a specific participating task, with active-turn
limitations. We did not install, audit or test it. The bundled local CLI confirms
that `codex queue --help` exists; only help was run, never a queued message.

Per the user's instruction to avoid duplicating existing work, stop custom
transport development here. Retain this public PRD, frontend and bounded prototype
as a feasibility/reference release. Before any further build, assess reusing an
existing transport and verify chosen-thread behavior on the actual host.
The remaining potential contribution is the friendly animated, human-authorized
poke experience. See [related work](RELATED_WORK.md).

For the working local proof, an MCP tool can expose
an authenticated paired inbox. With a shared HTTPS relay and both people paired,
the recipient can ask Codex to check that inbox and see the hello in their chat.
This uses ordinary tool calls, not an unsolicited popup. The local implementation
tests this protocol; a remote friend test and installation in the stock Codex UI
remain unperformed. This is a feasibility release, not a completed remote service.

**The exact automatic animated active-chat poke is not established here.** The same plugin on
both machines is not sufficient. ChatGPT already documents subscribed events for
specific Work/Cloud/dot surfaces; the documentation does not establish the same
behavior in an arbitrary existing local Codex chat. Codex's App Server supports
custom clients that control turns, but that is a broader integration, not a proven
drop-in notification hook. Do not expose someone's App Server, inject arbitrary
prompts, steer their work, or grant broad thread control to solve a social poke.

Proceed today only with this PRD, the animated local proof and read/prepare MCP
connector. Stop before production hosting, always-on agents or further integrations.
Evaluate one permitted recipient-side notification hook before investing in the
automatic version. If it cannot restrict delivery to a chosen inbox without
unrelated chat access or unintended model work, retain the on-demand version or
archive the experiment. Existing account event features should be reused where
they already cover the exact requested surface.

Sources checked 2026-11-02: [MCP Events](https://developers.openai.com/plugins/build/mcp-events),
[Codex App Server](https://learn.chatgpt.com/docs/app-server). No product-wide
claim that no competing messenger exists is made. Related implementations exist;
the remaining unverified requirement is the exact consensual animated social poke
in the intended Codex UI, without steering or doing unrelated work.

## Product

Let two people who mutually opt in send a small animated “I'm here” poke. No
medical language, crisis declaration, conversation monitoring or sensitive context
is required. Poke is an ordinary social action. Emergency support remains separate.

The intended journey is remote: each person uses their own computer, connector
and identity. Being on the same Wi-Fi is not a product requirement. They must
reach the same authenticated relay. Installing the connector alone does not open
another person's Codex or make an arbitrary chat addressable.

## First experience

1. Open the inbox, choose a display name, create one invitation.
2. Share its unguessable, expiring link manually through an existing channel.
3. Friend opens the link, supplies their display name and agrees to receive pokes.
4. Inviter checks the friend's identity through the existing channel and accepts.
5. Both see the agreed connection. “Poke Alex” is an explicit send authorization.
6. Recipient's open inbox shows an accessible, gentle animated poke.
7. Either person can mute incoming pokes or disconnect immediately.

An invitation is not a broadcast and does not grant conversation access. No one
is contacted by this development session. Local tests use invented people.

## Connector experience

Each person can download a limited connector credential from their own inbox.
It allows only their own inbox reads and creation of a pending poke preview.
It cannot approve a preview, directly send a poke, pair, mute or disconnect.
The assistant can offer “Want to poke Alex?” without any emergency wording.
The person reviews the destination in their inbox and presses “Approve poke”.
Pending previews expire after two minutes and are single-use. Disconnect, mute,
rate limits and permission are rechecked before every authorized send.

Read access is not consent to scan all chats. No chat text is accepted by the
relay or connector. No arbitrary destination, message body, phone number, health
summary or location is accepted. Token files belong outside Git and must not be
pasted into public issues. Regenerating a connector credential invalidates the old
one; restarting the relay invalidates all sessions and credentials in this version.

The first MCP integration is explicit pull-based inbox access. There is no claim
that the connector can interrupt a running Codex turn. OpenAI's documented
[MCP Events](https://developers.openai.com/plugins/build/mcp-events) can deliver
events into a user-subscribed ChatGPT chat; compatibility with the intended Codex
host, notifications and user controls must be tested before adding a push adapter.

## Interface and motion

Visual direction: warm paper, dark ink, a bright coral action and a small blue
companion. No clinical dashboard, emergency colors, risk scores, or chat transcript.
The main screen answers who is paired, what a poke does, and whether incoming
pokes are muted. Sender sees “Queued for Alex's inbox”, not “Alex saw this”.

Latest incoming event: a short tap/squash of the companion, two expanding rings and a
gentle return to rest over roughly 900 ms. Animation starts only after a real
server event, never as proof of human attention. Repeated events restart a bounded
sequence. A batch received while offline produces one gentle animation; all
retained events remain in Recent hellos. Reduced motion uses a stationary highlight and the same text. No sound,
vibration, browser notification permission, flashing or infinite attention loop.
Keyboard focus remains on the current control; a polite live region announces
the new poke. The inbox works at narrow mobile and desktop sizes.

## Data and trust

Relay memory contains session IDs/tokens, display names, one paired peer, expiring
invitation, pending previews and the last 20 poke events. No durable database,
personal contact import or third-party analytics. State expires after eight hours
and is lost on restart. This intentional prototype limit must be shown in the UI.
Transport must use HTTPS for remote use. The relay operator can see aliases and
poke timing; this is not end-to-end encrypted and not anonymous. A token grants
access to its stated capabilities; protect it as a credential.

Trust zones: two browser sessions, two read/prepare-only MCP credentials, the
trusted relay operator, and the untrusted network. Browser credentials can perform
explicit user actions; connector credentials cannot. A shell/browser-capable
assistant acting as the local user is not independently isolated by this app.
Production needs separate approval trust, hardened identity and a reviewed relay.

## Bounds and failure states

One peer per session; 10-minute single-use invitations; eight-hour sessions;
two-minute previews; 30-second sender cooldown; maximum 10 pokes per rolling hour.
No automatic retries or replies. Offline recipients see only retained events when
they reopen the same session before expiry. There is no always-on delivery promise,
phone fallback, escalation, hidden presence or seen receipt.

Reject unknown/expired tokens, wrong capability, cross-origin mutations, oversized
bodies, self-pairing, used invitations and extra message/destination fields. Limit
registration, request rates and stored previews/events. Do not log tokens or URLs
with secrets. Invites use a URL fragment so the invitation secret is not sent in
the initial HTTP request; the browser submits it only after explicit joining.
Disconnect removes the relationship and invalidates pending previews for both.

## Acceptance criteria

- Two isolated browser sessions complete mutual pairing; only then can a user poke.
- An actual authorized poke appears once in the other inbox and triggers animation.
- MCP reads only its owner's inbox and cannot invoke browser-only action routes.
- A model-prepared preview cannot be sent until a browser authorization; replay,
  expiry, mute, disconnect and rate limits fail closed.
- Names render as text, no scripts; tokens never appear in logs or Git fixtures.
- Responsive, keyboard, reduced-motion and repeated-animation checks are recorded.
- Tests cover pairing, capability isolation, abuse bounds, previews and revocation.
- Local demo, remote capability and actual remote verification are labeled separately.

## Release milestones

1. Local two-session browser prototype + MCP connector + tests and design review.
2. A separately approved HTTPS staging relay, voluntary friend pairing, security
   review and actual remote-device verification. No production setup is authorized
   by this PRD; the first implementation keeps the relay on loopback.
3. Verify a supported subscribed-chat event adapter and notifications in the target
   Codex host. Add only after recipient opt-in, quiet/mute controls, authentication,
   signed callbacks, abuse prevention and per-action user intent are demonstrated.

Core remains free/self-hostable. Remote hosting still costs somebody resources;
no free hosted SLA or unlimited delivery is promised. No billing, paid dependency,
external provider account or production credential is needed for the local milestone.

The public repository remains under Syntax Error Pvt Ltd's GitHub namespace,
`sintaxerrorpvtltd/safereach`. Open-source licensing and community contributions do
not move the project out of that namespace or change its maintainer identity.
