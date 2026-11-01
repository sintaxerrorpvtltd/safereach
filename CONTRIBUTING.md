# Contributing

Anyone can contribute code, tests, translations, accessibility feedback and sourced
resource proposals. Keep changes small; open an issue for material architecture
changes. Do not include real contacts, messages, locations, transcripts, credentials
or screenshots of private information in issues, fixtures, logs or PRs.

Run `npm ci --ignore-scripts` and `npm run check`. Add a focused regression test
for consent, expiry, revocation, storage and resource-ranking changes. Use only
fictional recipients. Never test against emergency services or unsolicited people.
Real provider credentials and deployments are outside this MVP.

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
