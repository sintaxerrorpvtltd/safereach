# Poki — by Sintax Error

**Implementation-ready PRD · 2026-11-02 · public static demo milestone**

Poki is the provisional product and companion name. It is a friendly way to say a
little hello, not a request-for-help or emergency product. No trademark clearance
or name exclusivity is claimed. It lives in the existing
`sintaxerrorpvtltd/safereach` repository, maintained by Sintax Error. Preserve the
existing SafeReach handoff and Poke experiments as separately documented work.

## 1. Product boundary

Poki is a separate companion product with a genuinely open-source core and an
optional future paid Pro offering. Some1.help remains its existing commercial
restaurant product. It may become a first-party Poki Pro customer later; its app,
private prompts, business logic, authentication, voice, releases, credentials and
customer records are outside this implementation and must not be copied or changed.

The long-term idea is a cute companion across participating websites and explicitly
linked inboxes. Installing a plugin or being online does not make a person reachable.
Each host participates deliberately; each person chooses an identity, contacts,
surface and permissions. No website-wide or browser-wide monitoring is permitted.
Instagram DMs and Telegram are the planned social-channel priorities. WhatsApp is
explicitly outside this MVP. Codex, Claude Code and OpenCode are host candidates,
with the existing Codex/MCP reference labeled experimental until host-tested.

## 2. Deliver now

A polished, public, static GitHub Pages website with locally drawn Poki mascot/logo,
clear product name and ownership, features, how-to, interactive demo, documentation,
contribution links and an honest implementation-status matrix.

The demo contains only two fixed fictional people, Alex and Sam, in one browser tab.
The visitor can act out both sides. It has no real account, invite, contact input,
outbound message, API, analytics, visitor telemetry, browser storage, notification
permission or background worker. Refreshing discards demo state. GitHub still
handles normal static hosting requests under its own hosting/privacy policies.

The visitor must explicitly accept pairing as each fictional participant, select a
sender, prepare a fixed “Hi!”, then approve the exact fictional recipient before
an in-tab animation appears. Preparation alone does not deliver. Unpaired, blocked,
muted, expired or consumed previews cannot deliver. The user can decline a preview,
mute, block or reset/unpair. The demo explains these are illustrative local checks,
not production authentication or proof of an independently attested human click.

## 3. Open-core and Pro split

| Component | License/status for this milestone |
| --- | --- |
| Poki static site, locally drawn mascot, demo state machine and UI | Apache-2.0, implemented in this repository |
| Existing SafeReach/Poke source, protocol examples, reference/mock adapters, tests and documentation | Existing Apache-2.0 license retained |
| Future public widget/SDK, published protocol and consent components | Planned Apache-2.0 core; no installable embed SDK is shipped by this milestone |
| Paid hosted identity, relay operations, durable delivery, managed credentials and advanced administration | Planned Poki Pro service; not deployed, priced or sold here |
| Future proprietary Pro implementation modules | Not implemented; must be explicitly identified with their own licensing/terms before introduction, outside the Apache core |
| Some1 application, private prompts/business logic and customer data | Not part of this repository or open-source grant; no integration now |
| Live accounts, credentials, private user/contact/channel data | Private operational data regardless of surrounding source license |

Paid hosting does not itself make source proprietary. Do not relabel restrictive
source-available code as open source. Do not retroactively place this existing
Apache-2.0 code under Pro restrictions. This document defines the project scope;
future commercial/legal terms need their own explicit review.

## 4. UX and visual contract

Poki must be named prominently in the page title, wordmark, hero, demo, README and
documentation. “By Sintax Error” explains stewardship without claiming that public
contributions transfer ownership. Everyone may propose features and submit PRs;
maintainers review and verify accepted changes before merge.

Use a warm paper background, dark readable ink, blue/purple locally drawn mascot
and a warm accent. The tone is social, playful and calm. No crisis imagery, medical
claims, simulated emergency video, fake testimonials, fake user counts or invented
live integrations. No third-party fonts, stock images or paid media are required.

Motion must have a clear trigger and stop: one finite hello/wave/ripple sequence
after an approved demo event, with a visible still/text result. Reduced motion
retains the same information without movement. Never use animation as proof that
a human saw something. Keyboard controls, clear focus, text labels, readable
contrast and narrow-screen reflow are part of acceptance.

Required page sections: overview/hero, features, how it works, local demo, core vs
Pro, status, documentation, contribution call-to-action and privacy footer. Visitors
can understand the limits before trying the demo. No payment or signup CTA may
imply Pro is currently available.

## 5. Demo state and authorization

Only `alex` and `sam` IDs and the literal “Hi!” exist. State is confined to memory.
A preview binds a unique sequence ID, sender, recipient and expiry. Each side must
have accepted pairing. A preview expires after 60 seconds, is single-use and must
be rechecked against mute/block/pair state on approval. Disconnect/reset clears
consent, previews and event history. Blocking or muting invalidates pending previews
to that recipient. Event history is bounded. Rendering must use text, not injected
HTML. No model, backend or channel credential participates in this static demo.

## 6. Architecture and publication

Use a dedicated `site/` static directory in the existing repo; do not replace the
earlier Node MCP server or local Poke relay. Use native HTML/CSS/SVG and a small
browser module. The demo's pure state module is exercised by Node's built-in test
runner without adding dependencies. Existing CI, Git history and Apache license
remain intact.

Publish only `site/` through GitHub Pages. Never upload server state, private files,
credentials, node_modules, Some1 code or the local backend as part of the Pages
artifact. Use relative asset paths so the project URL works under `/safereach/`.
Pages deployment should run the repository checks before publishing. The public
site must be verified by actual URL/content and desktop/mobile browser inspection.

## 7. Reuse decision and future gates

Existing remote assistant transports, including Murmur Connect, are documented in
[RELATED_WORK.md](RELATED_WORK.md). Read their actual permissions and licensing
before adoption; none has been installed or validated by this implementation.
Do not build another remote relay as part of this static milestone.

| Capability | Public claim allowed now |
| --- | --- |
| Static website and fictional, explicit-consent in-tab animation | Implemented only after checks and public verification |
| Existing local MCP/Poke reference | Experimental local proof; see its separate docs |
| Remote friend delivery or automatic active-Codex popup | Planned/unverified; not a shipped capability |
| Website embed SDK and cross-site identity | Planned; no copy/paste tracker or installable SDK yet |
| Instagram DMs and Telegram adapters | Planned; no developer account, permission, channel linking or message sending configured |
| WhatsApp | Outside this MVP |
| Claude Code / OpenCode and other named host candidates | No Poki compatibility or live integration claimed until individually verified |
| Paid Pro accounts, hosted relay, billing and credentials | Planned; no prices, purchase, account setup or service promise |
| Some1 integration | Future first-party Pro customer concept; no source or live changes |

Future outbound actions require explicit account/channel linking, reciprocal contact
acceptance, exact-recipient per-send authorization, recipient DND/block/revocation,
abuse limits and honest queued/received/seen distinctions. Third-party platform
policies require fresh verification at the adapter milestone. A browser companion
must not gain order authority, private chat access or the ability to inject prompts
into unrelated work.

## 8. Acceptance and handoff

- Save this PRD before implementation; keep the work isolated in SafeReach.
- Verify pairing, preparation, approval, denial, expiry, replay, mute, block and reset
  using focused tests against the actual demo state module.
- Check desktop and mobile rendering, keyboard focus, finite animation, repeated
  input and reduced motion in a real browser.
- Preserve earlier tests and run the appropriate existing checks; review the scoped
  diff, public artifact contents, README claims and dependency changes.
- Commit and push scoped work, deploy only the static site, and confirm the exact
  public URL and visible Poki branding before saying it is live.
- Return site/repo/PRD URLs, commits, actual checks, working vs planned capabilities
  and concrete limitations. No paid provider, purchase, real messaging, production
  backend or Some1 changes are authorized by this milestone.

## 9. Guided onboarding and integration catalog

The intended hosted experience is **Sign in → choose connection → guided setup →
test**. This static release explains those steps and offers the working fictional
demo. It must not contain a fake sign-in, OAuth, connected account, functioning
provider-connect control or collection form. Do not invent support for uncertain
dictated host names.

| Adapter | Current status | Minimal guided steps and permissions | Disconnect and test requirements |
| --- | --- | --- | --- |
| Browser demo | Built; fixed fictional identities, in-tab only | No sign-in/scopes; accept both sides, preview then approve literal Hi | Refresh/reset clears state; DND/block/decline must work |
| Instagram DMs | Planned; Meta configuration gate | Later verify eligible account ownership, messaging scopes, application/webhook configuration and any required provider approval | Revoke/unlink and cease delivery; test with explicitly participating accounts within current provider rules |
| Telegram | Planned; bot/backend gate | Later let the user initiate contact with the bot and verify their linked identity; keep bot credentials on the hosted service | Unlink/block and stop routing; test accepted contact and explicit per-send approval |
| Codex | Existing MCP protocol reference, stock host onboarding unverified | Review scoped read/prepare credential and exact inbox; no generic conversation access or automated approval | Revoke token/remove MCP connection; test on-demand read and independent approval before claiming support |
| Claude Code | Candidate, not a verified Poki integration | Confirm current MCP contract and host version; review exact connector permissions before configuration | Verify read/prepare/approval and removal/token revocation in an actual host session |
| OpenCode | Candidate, not a verified Poki integration | Verify exact product/version and MCP setup, then least-privilege inbox access | Actual host test, explicit approval and complete disconnect evidence required |
| Website embed | Planned SDK | Participating host origin, public site ID, explicit identity/channel link and user consent; no tracking | Disable loader/revoke host/session; verify guest refusal leaves host features intact |

Provider documentation is evidence of general capability, not proof this product
works with it. References checked 2026-11-02: [Telegram bot introduction](https://core.telegram.org/bots),
[Claude Code MCP](https://code.claude.com/docs/en/mcp), [OpenCode MCP](https://opencode.ai/docs/mcp-servers/).
Meta's [messaging documentation](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api)
returned HTTP 429 during this check; exact current eligibility, scopes and review
rules must be verified at the adapter milestone. No credentials or permissions
were requested. Some1 is not a current integration target.

## 10. Company policy and service launch gate

Company-controlled terms are requested, but no approved legal terms or invented
business contact is supplied by this static demo. Publish only draft technical
policy requirements, clearly labeled, in [POLICY_REQUIREMENTS.md](POLICY_REQUIREMENTS.md).
Before real sign-in or Pro launch: confirm operator identity/contact, applicable
service/privacy terms, permitted users/regions, retention/deletion, account security,
support/abuse reporting, channel permissions/revocation and any payment/cancellation
terms. This is a gated follow-up, not authorization to collect accounts or payments.

## Action-first local onboarding revision — 2026-11-02

The primary website action copies a plain-language Codex instruction pointing to
this public repository and `docs/INSTALL.md`. It installs into a new local folder,
tests, and starts `npm run poki`; it does not install a global plugin or promise
remote delivery. The website remains static with no visitor identity API.

A single character follows four scroll story beats: idea, mutual connection,
explicit approval, community contribution. All story copy is readable without
motion; reduced-motion removes the travel transition. The public demo is fictional.

The working local app shows a temporary first-name profile, one reciprocal friend,
preview plus Send/Decline, finite receipt animation, recent hellos, mute and
disconnect. Sessions reset on restart. Hosted/persistent identities, multiple
friends and remote host notifications are future milestones. See INSTALL for the
actual supported workflow. Pro benefits are proposed, not purchasable features.

The current mascot is a placeholder awaiting Hemang's choice; see MASCOT.md.
