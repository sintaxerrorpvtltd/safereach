# Poki — by Sintax Error · verification

## Local evidence · 2026-11-02

- Saved the combined implementation-ready PRD before site implementation.
- Strict TypeScript compilation and **23 tests** passed: five new static-demo /
  artifact checks plus all 18 existing SafeReach/Poke checks. npm audit reported
  zero known vulnerabilities. No dependency was added or upgraded.
- Demo tests cover both acceptances, prepare-without-delivery, exact recipient and
  literal text, replaced/expired/replayed previews, decline, recipient DND,
  either-side block, reset and bounded history.
- Artifact checks allowlist the static files, reject symlinks, confirm local asset
  references and section anchors, and check the absence of data API/storage calls
  in the demo controller. Pages uploads only `site/`, never a backend or state.
- A real browser verified both fictional acceptances, exact preview, approval,
  immediate result, finite receiving animation, focus return, DND, block, decline
  and the reverse direction. Reduced-motion emulation produced the same text with
  no character animation. Reset and refreshing discard the local illustration.
- Desktop layout was inspected at 1280px and mobile at 390px. Mobile document width
  matched the viewport with no horizontal overflow. The integration guide expanded
  with honest planned status; no real text/account inputs exist. Error/warning
  console logs were empty during these checks.
- README screenshot: `docs/images/poki-site.png`, captured from the actual site.
  The SVG logo/mascot was drawn locally. No private screenshot or source conversation
  was used in public assets. Browser device/media overrides were reset after tests.

## Completion review

OpenCodeReview supplied file selection/rules in delegation mode; Codex performed
the review. All ten initially selected code/config/style/test files were reviewed,
zero skipped (100% selected coverage). Seven initially excluded Markdown/SVG files,
later policy/verification docs and the actual screenshot were reviewed directly.
No independent security certification is claimed.

The review checked the static-only publication path, workflow permissions, DOM text
rendering, fixed fictional IDs, per-action state transitions, expiry/replay behavior,
asset/license boundaries and honest feature claims. Existing CI and history remain.
Docker's build stage includes `site/` so its test suite can exercise the actual
demo module; the public Pages artifact contains no Node server.

## Publication and limits

**Live website:** https://sintaxerrorpvtltd.github.io/safereach/

Implementation commit `91b5531` and Pages workflow commit `0735884` were published.
[Pages deployment 41347544641](https://github.com/sintaxerrorpvtltd/safereach/actions/runs/41347544641)
and [repository checks 41347544597](https://github.com/sintaxerrorpvtltd/safereach/actions/runs/41347544597)
passed, including the 23 tests, dependency audit and the existing Docker build.

The public `index.html`, `styles.css`, `poki.mjs`, `demo-state.mjs` and mascot SVG
all returned HTTP 200 with appropriate content types and byte-for-byte equality to
the reviewed local files. The actual public site rendered Poki branding, roadmap
status and the setup guide. On its 390px mobile layout, both fictional acceptances,
preview and approval produced the expected local hello and `hello` animation with
no horizontal overflow or browser errors/warnings. Desktop public rendering was
also inspected and its screenshot saved as a local verification artifact. Temporary
emulation settings were cleared afterward.

No real login, OAuth, Instagram/Telegram adapter, remote
friend delivery, installed embed SDK, active-Codex animation, paid Pro, production
backend, account or messaging credential was configured. Claude Code and OpenCode
remain candidates, not verified Poki integrations. WhatsApp is outside the MVP.

Some1 source/database/auth/voice/services were not changed by this Poki milestone.
Physical-device and screen-reader acceptance remain unverified. The in-tab consent
demo is not authentication or independent approval against its browser owner.

## Action-first onboarding checkpoint — 2026-11-02

- Local suite: 25/25 tests; dependency audit: zero vulnerabilities.
- Clean isolated artifact install (no copied node_modules): npm ci, tests and
  npm run poki succeed; local server at14317 used for browser verification.
- Browser: temporary Alex/Sam profiles, invitation, mutual acceptance, exact
  preview and Send approval, receiving inbox text and actual `hello` animation
  observed. HTTP smoke also checks disconnect and no delivery on preparation.
- Website: Copy instruction reports success; scroll story changes the one
  character's pose; desktop rendering inspected. Mobile390px has no horizontal
  overflow; reduced-motion yields zero character transition duration. No console
  warnings/errors in the inspected local site.
- OpenCodeReview delegation coverage: 9 selected code files reviewed by Codex;
  4 excluded Markdown files reviewed manually, 13/13 total. No material unresolved
  issue found. This is not a separate independent security audit.
- No real remote friend, production identity, social adapter, automatic Codex
  notification, screen reader or physical mobile device was tested. Current
  mascot remains a placeholder pending user selection.

## Personal avatar checkpoint — 2026-11-02

- 28/28 local tests including bounded PNG validation, browser-only avatar changes,
  explicit consent, image exclusion from MCP state, sender binding, preview
  revocation and removal from subsequent peer/history responses.
- Browser upload used a synthetic96px test swatch, no real person's photo.
  Unsaved preview did not change the profile. Save without consent was rejected;
  explicit consent saved it. After an approved hello, the receiving animation
  showed the authenticated sender's image (naturalWidth96) and name. Removal
  restored initials in the recipient. No console errors in the inspected inbox.
- Shared cartoon direction is documented in AVATAR_STYLE.md. Private image-tool
  preview is a still, not the application's image-generation service. No raw
  reference/photo, provider key, image API, paid service or new dependency added.

## Connected app and desktop checkpoint — 2026-11-02

- New Clerk app Poki (app_3LWPjl5PNDGbQSct5OVsvaALmYe), development issuer
  engaging-hawk-7047.clerk.accounts.dev. New Convex project poki, development
  tangible-butterfly-887 under sintax-error-private-limited. No Some1 resource reused.
- Live integration used only two reserved +clerk_test@example.com identities.
  Real Clerk-signed, audience=convex tokens authenticated to the new deployment;
  exact lookup, mutual friend acceptance, private availability, heart preview with
  no delivery, exact approval, tamper/replay denial, DND and blocking passed. Test
  sessions were revoked; profiles were left undiscoverable and Invisible. No real
  email or external person was contacted. This is API-level cloud evidence, not
  a physical cross-device acceptance test.
- Connected UI: actual email-only Clerk form rendered; desktop and390px layout
  inspected, no horizontal overflow. SDK first load was slow. Telemetry disabled
  in ClerkProvider; provider operational requests still exist.
- Mac Electron native launch and unsigned packaging passed. Both Mac-arm64 and
  Windows-x64 unsigned package builds passed before final release rebuild.
  A bare Electron starter window was accidentally opened during UI inspection;
  user was informed, all native test processes were stopped and their relay closed.
  No further native windows will be launched in this work session.
- Native popup timing/focus/tray, Windows runtime, real two-device exchanges,
  sleep/resume and final generated-art visual acceptance remain unverified.
- Connected photo generation remains unimplemented and planned FREE at signup;
  only later optional AI extras are Pro proposals. No image-provider key/API/billing.
- Added a regression guard preventing block-list operations from becoming a
  private-profile lookup by guessed ID, and deployed the fix to the Poki dev backend.

## Release candidate v0.1.0-alpha.1

Source: de943468804590743ec2671ba1db62fbcafc2199.

- Root:34/34 tests; connected:13/13 plus3/3 setup tests. Both production dependency
  audits report zero. CI Checks41352308294 and Pages41352308472 succeeded, including
  the Docker build and an isolated nested-app install/typecheck/build.
- The isolated CI job caught an undeclared Node type dependency masked by parent
  dependencies locally; it was declared and the standalone job passed.
- Public browser account test: reserved email-code sign-in, exact username lookup,
  request, synthetic recipient acceptance, friend availability, heart preview and
  approval, and a returning wave all passed against the actual cloud app. No real
  external email, friend or person was contacted. Screenshot: output/poki-live-friends.png
  (ignored local evidence; not a fixture or user-data publication).
- Live sign-in initially returned to the GitHub domain root. A tested path-preserving
  redirect helper now keeps auth returns on /safereach/app/ and /connected/. Fresh
  release entry was used to avoid a cached earlier HTML bundle.
- Both final connected Mac-arm64 and Windows-x64 unsigned packages were rebuilt.
  Payload checks exclude env, private source, test data and Electron download caches.
  Cached platform downloads were found and excluded before release, reducing the
  archives to about122MiB/156MiB. Checksums accompany the GitHub prerelease.
- All native GUI test processes were stopped. No desktop windows were opened during
  final packaging. Windows native runtime, native popup timing/focus and physical
  two-computer acceptance remain pending. First free signup-avatar generation is
  still a documented next milestone, not an enabled API.
