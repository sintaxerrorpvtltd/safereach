# MVP scope and architecture decisions

Source: the user-provided SafeReach PRD, implementation request and ordinary
“Hi / tea” UX clarification. Private conversation content is not published.
The chat reader exposed PRD sections 1–34 and the section-35 heading; later PRD
text was truncated by the reader. This file is an implementation scope map, not
a verbatim copy of the PRD or the private conversation.

## Implemented

Model-neutral TypeScript stdio MCP, private local trusted contacts, explicit local
per-action approval, exact handoff preview, mock SMS abstraction/status, bounded
metadata audit, India verification-tier/freshness scaffold, tests, Docker,
contribution/security docs, Apache-2.0 and portable plugin packaging.

## Deliberate reductions

One local OS user replaces hosted OAuth/tenancy. No HTTP endpoint can be enabled.
Three fixed ordinary templates replace arbitrary summaries, so no classifier has
to guess whether message text contains private health/location information.
Sensitive/location sharing flags are false and cannot be enabled. Only the human
operator can add/revoke contacts; acceptance is attested, not verified through an
invitation. No phone numbers are accepted from MCP callers.

The vault is AES-GCM with a local key and Unix permissions, rather than adding a
database or external key service. The same-account trust limit is explicit. A
bounded encrypted event list is the audit implementation; it is neither immutable
nor tamper-evident against the operator. No conversation history enters the app.

No web application, framework, model API, hosted server, deployment or live
provider configuration is necessary for this milestone. The private/public data
boundary remains separate: only registry facts and fictional fixtures belong in Git.

## Before any real sending

Implement an independently user-owned approval surface the assistant cannot drive,
bind the exact recipient/body and scopes to a single-use capability, validate
recipient opt-in, test revoke/deny/expiry and uncertain delivery, perform a security
review, and run a voluntary real-device test with an explicit recipient. A future
location or sensitive summary needs separate per-action consent; no bundled hidden
permission. Normal check-ins must remain normal and optional.

The optional paired-inbox idea needs a new transport and account/pairing design.
Installing a plugin does not grant access to a friend's chat, permission to scan
their activity, or permission to interrupt an unrelated conversation.
