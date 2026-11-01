# SafeReach Poke — run the feasibility prototype

This is a basic local proof, not a completed remotely hosted product. No friend
can reach your localhost address over the internet. Nothing here grants access
to another person's chats or installs itself in their Codex.

## Local demo

```sh
npm ci --ignore-scripts
npm run build
npm run inbox
```

Open http://127.0.0.1:4317 in two independently opened browser tabs (not a duplicate
tab, which some browsers may copy session storage into). Use fictional first names.
Create an invitation in the first tab, copy it and paste it into the second tab's
address bar. Both tabs agree; the inviter explicitly accepts the request. Press
Poke in either tab and inspect the other tab. One hello is queued; no read receipt,
response or notification outside the open inbox is implied.

Incoming animation gently taps the blue companion and emits two rings, then
returns to rest. Reduced motion keeps text and a still highlight. Recent hellos
contains retained events; returning after several events produces one gentle
animation, not a burst of repeated alerts. The app stops polling while hidden.

Mute incoming, decline an assistant preview, or disconnect to stop unwanted pokes.
One peer per session, 30-second sender cooldown, ten per hour, last 20 incoming
events, ten-minute invitations, two-minute previews and eight-hour sessions.
Expiry cleanup occurs on requests; idle memory is not proactively erased. Closing
the tab loses its session storage; restarting the relay invalidates every session.

## Read/prepare-only connector

After pairing, expand **Connect your AI assistant** in your own inbox and download
the limited connector settings. It contains a credential; store it outside the repo
in a private folder, apply mode 0600 on Unix, and never paste it in an issue/chat.
Each person's MCP process needs their own downloaded file. Regeneration invalidates
the previous connector. The file does not contain the browser action credential.

Set `SAFEREACH_POKE_CONFIG` to its absolute pathname in the MCP process environment.
For a supporting MCP host, the configuration shape is:

```json
{
  "mcpServers": {
    "safereach": {
      "command": "node",
      "args": ["/absolute/path/to/safereach/dist/src/server.js"],
      "env": { "SAFEREACH_POKE_CONFIG": "/absolute/private/path/safereach-poke.private.json" }
    }
  }
}
```

This is a configuration example, not a request to edit global settings. Nothing was
installed or enabled in a friend's app. Host paths differ on each computer.

Ask the assistant to check your poke inbox; `read_poke_inbox` returns only the
paired session's state and hello events. Ask it to prepare a poke; `prepare_poke`
creates a pending preview, then you approve or decline the exact recipient in
your browser inbox. The connector cannot call send, approve, pair, mute, disconnect
or generate another credential. Terminal/browser automation sharing the user's
authority remains outside this separate connector-token boundary.

## Remote feasibility and stop line

Two remote people would use the same trusted **HTTPS relay origin**, distinct
browser sessions and distinct connector files. MCP tool calls can read that inbox
on demand. This architecture does not require both people to share Wi-Fi, but a
shared reachable relay is necessary. It has not been deployed or tested with a
remote friend. There is no production-ready hosted service or free hosting SLA.

The server defaults to loopback. A conditional self-hosting entry point requires
an explicit HTTPS `SAFEREACH_POKE_ORIGIN`, nonloopback `SAFEREACH_POKE_HOST`, and
`SAFEREACH_POKE_BEHIND_TLS_PROXY=1`. These are operator assertions; the app itself
does not terminate or verify TLS. Do not expose its raw HTTP port. Remote operation
requires a separately reviewed TLS proxy, Host/Origin forwarding, identity/abuse
controls and deployment approval. The prototype's socket-IP request quota groups
all clients behind a proxy; it must be redesigned before a public shared relay.

Relay operators can read aliases, timing, invitation/session credentials and events
in memory. There is no E2EE or anonymity guarantee. Do not use this prototype for
sensitive communications. Do not reuse production secrets or expose Codex's App
Server as a shortcut.

Automatic “Hi inside your friend's currently active Codex chat” is unimplemented
and unverified. A separate authorized recipient-side adapter would need to target
only a chosen inbox, respect quiet hours/mute, and avoid uncontrolled model turns.
The [PRD](POKE_PRD.md) records existing ChatGPT event capabilities and the missing
Codex-specific proof. Stop at this feasibility release until that gate is resolved.
