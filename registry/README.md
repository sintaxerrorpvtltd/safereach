# Registry governance scaffold

Current runtime loads only IN/national.json. Add new coverage through reviewed PRs,
schema validation and an explicit loader update/test. No automatic URL crawling,
phone calls, geocoding, data imports or signed release pipeline runs today.

Each entry requires an ID, name, category, country, scope, phone, official HTTPS
source links, verification tier/method, reviewers, checked date and expiry.
Use `hours: "unknown"` unless hours were directly confirmed. Local entries require
a city by contribution policy; runtime never treats an unlocated local entry as
nearby. No fictional hospital is included as a real resource.

| Tier | Evidence | Promotion review policy | Maximum review interval |
| --- | --- | --- | --- |
| A | Official authority source | Two maintainers | 12 months |
| B | Official organisation + independent confirmation | Regional reviewer + maintainer | 6 months |
| C | Independent community checks | Two contributors or maintainer | 90–180 days |
| D | Unverified proposal | Contributor attribution | Never default eligible |

These are governance requirements, **not enforced GitHub branch protection**.
The initial national seed was corroborated against the National Portal by one
maintainer; a second maintainer review is outstanding. It is marked A to describe
official provenance, not to claim completion of the promotion workflow. No signed
registry release should ship before that review. Runtime tiers are assertions
from trusted bundled code, not attestations verified by the application.

Schema checks enforce shape, HTTPS URLs and chronological dates. They cannot prove
source ownership, clinical quality, reachable phone numbers or availability.
Maintainers must verify evidence and reject malicious source content. Runtime
never fetches source URLs or follows instructions in resource descriptions.
