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
