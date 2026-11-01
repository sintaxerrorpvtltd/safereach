# SafeReach

An open-source, model-neutral bridge from an AI conversation to a trusted human.
Maintained under **Syntax Error Pvt Ltd**; Apache-2.0.

“Would a check-in from someone you trust help?”

No emergency keyword, diagnosis, or medical vocabulary required. A user can choose
“Hi!”, “Hey, can you check in on me?”, or “Hey, want to come downstairs for tea?”.
The assistant offers, the person authorizes, and an adapter performs the action.

**v0.1 is a local, single-user, mock-only developer MVP. It sends no messages.**
There is no production service, background chat reader, medical risk detector,
emergency dispatch integration, or connection to another person's Codex chats.

## Run locally

Requires Node.js 22+ and npm. Dependencies are pinned in package-lock.json.

```sh
npm ci --ignore-scripts
npm test
export SAFEREACH_HOME="$HOME/.local/share/safereach"
npm run operator -- add-contact
npm start
```

Run `npm start` through an MCP client: stdin/stdout carry protocol messages.
In a separate terminal, add at most five contacts after obtaining their permission.
No onboarding SMS is sent. Recipient acceptance is currently an operator attestation,
not a verified two-sided invitation. All sensitive sharing flags are fixed OFF.

Use an absolute SAFEREACH_HOME outside the checkout. Default:
`~/.local/share/safereach`. Do not mount or share this directory with an AI host's
shell. Examples and tests use fictional contacts, not private conversations.

## Try one check-in

1. Assistant calls `list_trusted_contacts`; it receives IDs and names, never phone numbers.
2. `prepare_handoff({contact_id, template: "hi"})` creates an exact preview valid for five minutes.
3. Human sees the same recipient/message and uses their own terminal:
   `npm run operator -- approve <handoff-id>`.
4. Human types `APPROVE` after reviewing the full destination and text.
5. `send_trusted_message({handoff_id})` consumes consent once and returns
   `simulated`, `realMessageSent: false`. No delivery is implied.

`cancel_handoff` withdraws a pending or approved preview.
`npm run operator -- revoke <contact-id>` revokes contact permission and pending
actions. `npm run operator -- audit` shows metadata only. Model-supplied `approved:
true`, phone numbers, free text, location and sensitive summaries are rejected.
The tool cannot select another destination or edit an approved message.

Approval is outside the MCP interface. **It is not an isolation boundary against
an assistant with arbitrary shell/file access as the same OS user.** Terminal
checks and skill instructions do not solve that threat. Keep this mock-only until
a separate user-owned approval interface is implemented and tested.

## MCP and plugin

The official TypeScript MCP SDK serves stdio only, with no open network port.
Any MCP-compatible local host may launch `node /absolute/path/to/safereach/dist/src/server.js`.
Set the same private SAFEREACH_HOME for operator and server. No model API/key is needed.

`plugin.json`, `mcp.json` and `skills/safereach/SKILL.md` follow the current
[portable plugin packaging](https://developers.openai.com/plugins/build/plugins).
Build the repo before loading it in a supporting local host. The skill teaches
calm offers, consent and honest mock results. The manifests do not install or
enable themselves. Host installation and end-user ChatGPT/Codex UI are untested;
this is not a published plugin listing. Cloud ChatGPT needs a separately secured
remote transport; this MVP provides none.

Tools: `list_trusted_contacts`, `prepare_handoff`, `send_trusted_message`,
`cancel_handoff`, `find_support_resources`, `get_official_emergency_info`.

## India resource registry

`registry/IN/national.json` contains one national official-source reference, with
source URLs, verification method, check/expiry dates and reviewer identity.
It is a seed, not a verified nearby hospital directory. No GPS, remote geocoding,
distance estimates, opening-hour assertions or resource contact actions exist.
The [National Portal directory](https://www.india.gov.in/directory/helpline)
was checked on 2026-11-02; the ERSS website timed out during direct retrieval.
This is public-source corroboration, not a phone test or operational guarantee.

| Tier | Meaning | Default results |
| --- | --- | --- |
| A | Official authority source | Fresh entries eligible |
| B | Organisation independently verified | Fresh entries eligible |
| C | Community checked | Exploratory only |
| D | Unverified submission | Exploratory only |

Expired/future-dated verifications are exploratory only. Ranking prefers freshness
and tier within the requested category and city; no sponsorship. National entries
are identified as national. Empty local results mean missing coverage, not no help
exists. Tiers are maintainer assertions; this MVP has no signed registry pipeline
or cryptographic proof of reviewers. See [registry guide](registry/README.md).

## Privacy and limits

The AES-256-GCM local vault stores contacts, draft state and audit metadata; file
modes are 0700/0600 on Unix. The key is beside the ciphertext, so this protects
neither a compromised OS account nor a backup containing both. No real credentials
are read. The mock provider makes no network requests. Audit events contain IDs,
time and outcomes, not numbers, names, messages, location or chat content.

Only three fixed, non-sensitive templates can be previewed; no conversation text
is ingested. Draft bodies are not user-specific. Drafts expire after five minutes
and are removed during the next preparation. Audit metadata is bounded to 1000
records and pruned to 30 days on mutation; daily attempt evidence is preserved.
These are lazy cleanup rules, not a background deletion guarantee.

Up to three attempts per rolling 24 hours. Consent is consumed and recorded before
provider I/O. A crash or uncertain attempt is never automatically retried. A
directory lock serializes processes and fails closed during competition. If a
process crashes, stop **all** SafeReach processes before inspecting/removing its
`lock` directory. Never remove vault.key to fix a failure: losing it loses the vault.
Atomic rename protects normal partial writes; power-loss durability is unverified.
Windows filesystem permissions have not been validated; use Unix for this MVP.

The [threat model](docs/THREAT_MODEL.md) describes supported boundaries and gaps.

## Docker

```sh
docker build -t safereach:local .
docker volume create safereach-data
docker run --rm -it --network none -v safereach-data:/home/node/.local/share/safereach safereach:local node dist/src/operator.js add-contact
docker run --rm -i --network none -v safereach-data:/home/node/.local/share/safereach safereach:local
```

For approval, run a second interactive container against the same volume with
`node dist/src/operator.js approve <handoff-id>`. No ports are exposed. The image
uses a non-root user. The Docker build runs tests. Local Docker execution remains
unverified until a Docker runtime is available; CI includes a build check.

## Next milestone

Test a small, separate human approval UI with screen-reader support, exact-message
binding, expiry and decline, using fictional people and the mock provider. Then
design recipient opt-in, revocation and an optional paired check-in inbox. Each
person would choose whether/where to receive a check-in; neither person's other
chats would be accessible. No automatic reading or insertion into unrelated chats.

Real SMS, OAuth/hosted tenancy, encrypted key management beyond one OS account,
custom summaries, separately approved one-time location, verified nearby data,
signed registry builds and plugin marketplace submission are later milestones.
See [scope decisions](docs/MVP.md), [contributing](CONTRIBUTING.md), and
[security reporting](SECURITY.md).
