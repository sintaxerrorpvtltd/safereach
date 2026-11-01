# Poki — by Sintax Error

<img src="site/assets/poki.svg" alt="Poki, the little blue waving companion" width="140">

**A tiny poke. A little closer.** A playful, opt-in companion experiment with a
public static site and a fictional, explicit-consent demo. Maintained under
**Sintax Error** in the existing `sintaxerrorpvtltd/safereach` repository.

[Website](https://sintaxerrorpvtltd.github.io/safereach/) ·
[Poki PRD](docs/POKI_PRD.md) · [Contribute](CONTRIBUTING.md) ·
[Launch/reel notes](docs/LAUNCH.md) · [Security](SECURITY.md)

Poki is the provisional name, with no trademark-clearance claim. The open-source
core is Apache-2.0. Optional paid **Poki Pro** is planned; there is no hosted Pro
service, signup, price or purchase available now.

![Poki public-site preview](docs/images/poki-site.png)

## What works, and what does not

| Capability | Status |
| --- | --- |
| Static site, locally drawn Poki mascot/logo, responsive UI | Implemented; published through GitHub Pages |
| Two fictional people explicitly pairing, previewing and approving “Hi!” | Implemented in one tab; no real messages |
| Local demo DND, block, decline, expiry, reset and reduced motion | Implemented |
| Earlier local MCP / SafeReach Poke developer reference | Experimental; retained separately |
| Remote friend delivery or animated pop-in to an active Codex chat | Planned / unverified |
| Installable website embed SDK and cross-site identity | Planned; no copy-and-paste SDK shipped |
| Instagram DMs and Telegram adapters | Planned; no channel accounts or permissions configured |
| WhatsApp | Outside this MVP |
| Claude Code and OpenCode | Candidate hosts; no Poki integration verified |
| Paid Pro identity, managed delivery and advanced administration | Planned; no production backend |
| Some1 integration | Future first-party Pro customer concept; no integration or source changes |

This is an ordinary social hello experiment. No medical diagnosis, dispatch claim,
personal crisis story or emergency guarantee is part of the Poki experience.

## Try the static site locally

```sh
git clone https://github.com/sintaxerrorpvtltd/safereach.git
cd safereach
python3 -m http.server 4321 --bind 127.0.0.1 --directory site
```

Open [localhost:4321](http://127.0.0.1:4321). No Node build, backend or account is
needed to try the static site. On the page:

1. Accept pairing as each fixed fictional person, Alex and Sam.
2. Prepare one “Hi!” and review the exact sender and recipient.
3. Approve the fictional hello to see Poki's finite animation in the other panel.
4. Try Decline, Do Not Disturb, block, reverse direction and Reset / unpair.

You control both sides. Nothing leaves the tab. It does not contact your friend,
connect two browsers, read Codex conversations or register real contact details.
Refresh discards the demo. Preview expiry is 60 seconds; history is bounded.

The website also explains the future **Sign in → choose connection → guided setup
→ test** journey and includes per-adapter guides. These are guides/status only,
not fake working login/OAuth/connect controls. Company service policies remain
[draft technical requirements](docs/POLICY_REQUIREMENTS.md), not approved legal terms.

## Open core, optional Pro, separate Some1

The site, SVG mascot, demo state module and existing SafeReach/Poke reference code
remain Apache-2.0. Future public SDK/protocol/consent components are planned as core.
Community members can propose features, new characters, fixes and tests through
issues and PRs; maintainers review and verify changes before merge.

Pro may later offer paid hosting, identity, credentials, managed delivery and
advanced capabilities. Any future proprietary modules will be identified and
licensed separately. Paid hosting does not itself change a source license, and
restrictive source-available code will not be called open source.

**Some1.help stays its own commercial restaurant product.** Its application,
private prompts/business logic, authentication, voice, credentials and customer
records are not open sourced here. Some1 may use Poki Pro internally later; this
milestone does not integrate with or change it.

## Architecture and privacy

```text
site/index.html + styles.css + locally drawn SVG
                  ↓
       PokiDemo: fictional, in-tab state
                  ↓
    explicit preview → approval → bounded animation
```

`site/demo-state.mjs` owns demo rules; `site/poki.mjs` renders and handles controls.
There are no messaging API calls, third-party scripts/fonts, signup forms, visitor
analytics, cookies, local/session storage, tracking pixels or background workers.
The CSP disallows data connections. GitHub processes normal static-file requests
under its own hosting/privacy practices. This is not production authentication or
end-to-end encryption.

GitHub Pages uploads only `site/`. Existing Node servers, relay state, secrets,
Some1 source and private files are not part of that artifact. Real delivery would
need separately reviewed identity, reciprocal contacts, per-send authorization,
recipient block/DND, abuse controls and an appropriate transport. [Existing
transports already exist](docs/RELATED_WORK.md); reuse/evaluate them before
expanding a remote relay. None was installed for this milestone.

## Develop and verify

Requires Node.js 22+ and npm for the existing server and test suite:

```sh
npm ci --ignore-scripts
npm test
npm run check
```

All dependencies remain pinned; the static site adds no dependency. Tests cover
the real demo state module, artifact contents, consent/replay/expiry, DND/block/reset
and the earlier local MCP/store/provider/registry boundaries. The existing CI also
builds Docker. [Poki verification](docs/POKI_VERIFICATION.md) records actual browser,
public deployment and test evidence; build success alone does not establish remote
friend delivery or physical-device acceptance.

## Documentation and earlier work

- [Poki implementation-ready PRD and status gates](docs/POKI_PRD.md)
- [Launch/reel concepts and honest demo storyboard](docs/LAUNCH.md)
- [Draft technical service policy requirements](docs/POLICY_REQUIREMENTS.md)
- [Contribution guide](CONTRIBUTING.md), [community conduct](CODE_OF_CONDUCT.md),
  [private security reporting](SECURITY.md)
- [Earlier SafeReach MVP](docs/MVP.md), [original handoff threat model](docs/THREAT_MODEL.md)
- [Earlier local Poke PRD](docs/POKE_PRD.md), [setup](docs/POKE.md),
  [threat model](docs/POKE_THREAT_MODEL.md), [verification](docs/POKE_VERIFICATION.md)

The original scaffold is preserved: TypeScript stdio MCP, trusted-contact model,
mock SMS adapter, consent gates, audit log and India resource-registry seed.
`npm start`, `npm run operator -- ...` and `npm run inbox` are separate local
reference workflows described in those documents. None is a live public service.

## License and stewardship

[Apache-2.0](LICENSE). [NOTICE](NOTICE) preserves the existing attribution.
Open-source contributions do not move this project out of the company-maintained
GitHub namespace. No contributor agreement or assignment is introduced here.
