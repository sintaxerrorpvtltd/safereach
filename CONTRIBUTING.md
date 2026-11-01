# Contributing

## Poki — by Sintax Error

Poki is the current free social app and desktop development preview inside this existing
SafeReach repository. The company-maintained Apache-2.0 core is open to everyone.
Read [Poki's PRD](docs/POKI_PRD.md) and its implementation/status boundaries before
proposing features. Optional AI extras and external adapters are planned; no proprietary Pro
module is included in the current core. Some1 remains a separate commercial product
and is not a source-code contribution target here.

For the static demo, keep the two fixed fictional people, per-action approval and
in-tab state. No real contacts, account fields, telemetry, remote messaging or
browser-wide monitoring may be added as an incidental UI change. New permissions,
network calls, storage or adapters need a separately discussed scope and tests.
Keep animation finite, preserve a reduced-motion alternative, and capture the real
implemented behavior rather than mock live-delivery marketing.

Run `npm test`, `npm --prefix apps/connected test`, its build, and relevant UI checks. Put
public-site files only in `site/`; the Pages workflow publishes only that folder.
Never add Some1 code, secrets or customer records to a site artifact. The earlier
SafeReach/Poke developer workflows below remain available separately.

Anyone can contribute code, tests, translations, accessibility feedback and sourced
resource proposals. Keep changes small; open an issue for material architecture
changes. Do not include real contacts, messages, locations, transcripts, credentials
or screenshots of private information in issues, fixtures, logs or PRs.

## Community features and maintainer review

This is an open community project maintained under **Syntax Error Pvt Ltd**, in
`sintaxerrorpvtltd/safereach`. Everyone may suggest features, discuss designs, report
bugs and open pull requests. Contributions are welcome from first-time contributors
and experienced maintainers; company affiliation is not required.

Describe the user problem, proposed change and a way to verify it. For a substantial
feature, discuss the scope in an issue before spending time on implementation.
Maintainers review the code and privacy/consent impact, run the relevant tests and
try the actual flow where appropriate. A feature is merged only after review and
verification; a submitted PR or passing test alone is not a release promise. Scope,
security and maintainability can still require revisions or a declined proposal.
There is no automatic merge or deployment policy. Contributors can iterate openly
with maintainers, and accepted improvements become part of the public project.

Poke is an ordinary social hello; do not require medical terminology, emergency
language or a request for help to use it. Exact automatic pop-in to an active Codex
chat remains a feasibility question. Proposals must distinguish working protocol,
host support and actual device evidence. See docs/POKE_PRD.md.

Run `npm ci --ignore-scripts` and `npm run check`. Add a focused regression test
for consent, expiry, revocation, storage and resource-ranking changes. Use only
fictional recipients. Never test against emergency services or unsolicited people.
Only isolated development resources are configured. Production changes, real external messaging and paid image calls require an explicit scoped plan.

Resource proposals start at D. Supply official source links and dated evidence,
coverage, category, verification method and expiry. Do not infer 24/7 availability
or coordinates. A/B promotions require human review of sources; changing a JSON
tier is not verification. See registry/README.md for reviewer policy.

Never add a model-accessible approval endpoint, arbitrary phone destination,
automatic resend, location collection or chat-history sharing. An MCP annotation
or assistant instruction alone does not enforce authorization.

Contributions are under Apache-2.0. By submitting, you confirm you have the right
to contribute the material. Credit sources; contribute factual metadata and links
rather than copied third-party descriptions. Be respectful, protect privacy, and
report security concerns privately as described in SECURITY.md.
