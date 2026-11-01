# Poki — product requirements

**Maintained by Sintax Error · open-source social core · development preview**

## Product and ownership

Poki lets a person send a small, explicitly approved greeting to a friend who has
chosen to connect. A friendly avatar/reaction can appear beside their work without
requiring a full conversation. The app must never imply somebody needs help or
require medical/emergency language. The ordinary use case is simply “hi”.

The public repository is `sintaxerrorpvtltd/safereach`, Apache-2.0. Preserve its Git
history and earlier SafeReach prototypes. Some1.help remains an entirely separate
commercial product; do not reuse its projects, accounts, data, prompts or releases.
Community contributors can propose features through pull requests. Maintainers
review behavior, tests, privacy, licenses and user impact before accepting them.

## Free experience — final scope decision

The following stay free to users:

- Mac and Windows desktop client, browser account app and open-source code.
- Account signup, unique username, private friend requests and accepted friends.
- Friend-only availability, DND/invisible, block/remove and local pop-in controls.
-12 bundled greetings/reactions, each with preview and explicit send approval:
  Hi, Heart, Wave, Tea, Coffee, Thanks, Cheer, Hug, High five, Sparkle, Thinking of
  you, Celebrate. Presets call no AI model per send.
- A first personalized character at signup, generated from the user's photo plus
  our approved reference style. **This is planned as free, not implemented yet.**

Free to users does not mean the operator has no hosting/image cost. Track service
limits and bound generation costs. Use a dedicated future image-provider key, not
another product's credentials. No provider purchase, billing, checkout or subscription
is configured in this preview.

Pro is reserved for optional future AI experiences beyond the included signup
character. Candidates: additional art styles/outfits, custom pose/animation packs,
a personalized opt-in AI companion, or user-requested creative reaction generation.
They are proposals with no price or availability claim. Do not charge for privacy,
safety controls, basic friendships, the12 presets or the initial signup character.

## Current implementation

| Surface | Implemented | Still limited |
|---|---|---|
| Landing website | Copyable Codex setup, visual scroll story, fictional demo, contribution links, free/Pro distinction | Fictional demo never reaches real people |
| Connected account app | Clerk email auth, profiles/usernames, mutual requests, private availability,12 reactions, inbox | Development service, initials, no generation API |
| Backend | New Convex project, authoritative auth/ownership/consent, rate/size limits, expiry and block/remove | No production scale/abuse audit or E2EE |
| Desktop | Sandboxed Electron shell, tray, opt-in finite edge pop-in, constrained IPC, unsigned Mac/Windows packaging | Windows runtime, cross-device/sleep/resume/focus acceptance pending |
| Offline reference | Temporary two-tab local pairing, image upload/preview/removal, restricted MCP read/prepare | Not the connected account service |
| Codex/other hosts | Existing MCP protocol reference and source skill/manifest | Connected-account bridge and arbitrary active-chat insertion unverified |

## Account and friend journey

1. Open the account app, or install the desktop developer preview from the website's
   copyable instruction. Show development status and provider disclosure before use.
2. Sign up/sign in through the dedicated Poki Clerk application. Do not request an
   email password through the assistant, copy another app's auth, or silently link
   an account. The development integration uses embedded email auth; social OAuth
   is not part of the tested desktop path.
3. Choose a display name and unique lowercase username,3–24 letters/numbers/_ .
   Exact-username discovery is off and availability is Invisible by default.
4. Share a username yourself. Search an exact username; no email search, global
   people directory, contact import or background contact discovery.
5. Request a friendship. Recipient must accept; outgoing request alone grants no
   greeting or presence permission. Decline, cancel, remove and block are available.
6. Choose Available to share that the Poki app session is connected. A friend list
   shows available/unavailable and a count. DND, Invisible and disconnected look
   unavailable; no last-seen time, keyboard/camera/OS-activity or location tracking.
7. Choose a preset and available friend. Preview its exact recipient, reaction and
   fixed text. Approve separately. Previewing never sends.
8. Receiving app shows sender name, personal avatar when available, and reaction.
   Acknowledgement is private; the sender receives no read receipt.

Limit:100 accepted/pending connections per profile in this preview. Request/search/
preview cooldowns and a30-second send cooldown apply. Greeting previews expire in
one minute and inbox greetings after five minutes. Changes in friendship, blocking,
recipient availability or expiry must be rechecked at send/read time. A replacement
friendship cannot revive an old preview. No arbitrary message/chat text is accepted.

## Desktop experience

The app must work with Codex closed. It watches only its own incoming greeting
subscription while explicitly Available, not the user's other work or chats.

Desktop pop-ins require a separate local opt-in, off at launch. Only new unread
received greetings produce a pop-in; initial history must never replay. Keep the
sender name visible even when avatars resemble each other. The popup appears at a
screen edge for five seconds, is click-through/nonfocusable, and never interrupts
keyboard focus. No endless bounce, sound, forced response or startup registration.
Reduced motion uses a still character and text.

Close while enabled hides Poki in the tray/menu; Open restores and Quit stops it.
Close while disabled quits. DND, block, disable and quit must stop unwanted alerts.
Do not launch native windows during assistant testing without announcing it first.
Never open Electron.app bare; launch the actual Poki entry point/package.

## Personal characters and shared style

A person's character identifies that friend; the brand logo does not stand in for
everyone. Always pair avatar with name. Initials remain a functional fallback.

Use two reference roles: the person's approved photo supplies personal visual cues;
our selected style reference supplies the shared treatment. See AVATAR_STYLE.md:
soft2D cartoon people, dark contours, warm colors, minimal cel shadows, friendly
rounded faces and an open-hand hello. Preserve the face and waving hand in a
transparent image. The original external reference is not a redistributable asset
license, and the close style-review cutout stays local. No exact pixel-match claim.

Planned free signup generation:

1. Select a photo locally and preview it; request camera permission only if the user
   chooses camera capture. No background camera or photo-library scanning.
2. Before upload, disclose provider, image/purpose, retention/deletion and operator
   generation allowance. Obtain explicit approval; signup alone is not upload consent.
3. Server authorizes the account and enforces an idempotent included-generation
   budget. A failed request should not silently consume the successful-avatar slot;
   no unbounded retries or multi-account generation loop.
4. Keep raw source private, never deliver it to friends, log it, commit it or put it
   in a public build. Generate using the versioned style and explicit reference roles.
5. Show the result; obtain approval before publishing it as the user's avatar.
   Generation permission and friend-sharing permission are separate.
6. Delete temporary source/output on cancellation and apply a documented retention
   policy. Removal cannot recall a copy already seen/saved by another person.

Current connected app does not upload or generate photos. The earlier offline
prototype supports chosen PNG/JPEG/WebP input, local resize/preview and explicit
avatar-sharing consent to its mutually paired local test friend. Images stay out
of its restricted MCP responses and invalidate pending outgoing previews on change.

A full PNG can do a finite whole-character greeting. A hand-only wave needs layered
artwork/rigging. Do not advertise a still cutout as an animated rig or an image
provider integration. Style prompt/inputs are data, never executable instructions.

## Architecture and trust

- `apps/connected`: React/Vite, ClerkProvider + ConvexProviderWithClerk, thin identity-
  keyed profiles, indexed relationships/blocks/greetings and private presence component.
- Dedicated resources: Clerk app Poki; Convex project poki, development deployment
  tangible-butterfly-887. No production deploy or Some1 reuse.
- Browser uses public client settings; no backend/admin/image key enters bundles.
  Setup refuses to replace a different backend. Account functions derive the user
  from verified identity and re-authorize all target reads/writes.
- Electron main owns native capability. Sandboxed renderers have no Node access;
  fixed IPC accepts only the exact main frame and bounded names/images/reactions.
  Overlay receives display-only events and has no sending/approval authority.
- The public landing demo is static with data connections disabled; `/app/` is a
  distinct real client with exact provider CSP. Build/publish/package allowlists
  exclude `.env`, photos, private state and administrative credentials.
- Restricted local MCP can read/prepare for an explicitly configured local paired
  session. It cannot approve/send/pair. Shell/browser authority as the same OS user
  is not an independently attested human click; never claim otherwise.

## Verification and launch gates

Required: source typecheck/build; ownership/private discovery/presence tests;
recipient/reaction binding, replay/expiry/rate tests; block/remove/DND; constrained
preload and runtime publication tests; actual signed Clerk tokens reaching the
separate Convex deployment; account UI at mobile/desktop sizes.

Before calling desktop delivery ready: real two-person test on Mac and Windows,
foreground/background/sleep/resume, no focus theft, finite timing, tray/quit, offline
state, repeated greetings and reduced motion. Package success is not runtime proof.
Before broad production: operator/policy readiness, abuse/load/retention review,
signing/notarization/update plan, production-specific auth/backend configuration,
and independent security review. Do not weaken security to bypass OS trust dialogs.

Before AI generation: dedicated key, bounded server-only provider adapter, privacy
and deletion implementation, cost/idempotency tests and image/result consent path.
The reference cutout made in chat is not that service. No automatic emergency
calling, medical classification, background chat monitoring or implicit contact.

Instagram and Telegram remain future adapters, each with ownership/scopes/provider
policy and explicit per-send consent. WhatsApp is outside this MVP. Claude Code and
OpenCode remain candidates. Active Codex chat insertion is not a supported primitive
until a specific opt-in host path is verified; reuse existing transports before
building another relay. See RELATED_WORK.md.

## Open-source delivery

Maintain README, INSTALL, CONTRIBUTING, SECURITY, threat model, tests, Docker and
honest release notes. Publish static preview assets and clearly labeled unsigned
developer builds; no private source photos/chats or credentials. License original
code/art correctly and keep user/third-party content separate. Record exactly what
was tested, commits, resource identifiers, build locations and next safe milestone.
