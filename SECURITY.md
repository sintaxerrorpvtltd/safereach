# Security

SafeReach v0.1 is a local, single-user mock prototype, not an emergency service.
No live sending, remote listener, credentials or multi-user authorization exists.
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
