# Poke feasibility verification — 2026-11-02

## What works locally

- Strict TypeScript build and all **18 tests** passed.
- A real spawned stdio MCP client read a paired inbox hello and prepared a poke
  through the registered tools. Preparation did not send; connector credentials
  were denied browser action routes and another person's approval.
- HTTP tests covered mutual acceptance, self/reused/expired invitations, current
  peer binding, preview expiry/replay, mute/disconnect, connector rotation, sender
  cooldown/hourly limits, token expiry, strict fields, wrong origin/host, body
  bounds, no-store/CSP and rejection of unsafe remote binding.
- Two fictional browser sessions paired, explicitly exchanged pokes, and received
  the expected hello text. No real person was contacted.
- Incoming CSS animation was observed running with a non-rest transform and both
  ripple animations, followed by the resting transform. Reduced-motion emulation
  produced no character animation and a still highlight with the same text.
- Desktop (1280px) and narrow mobile (390px) layouts were inspected; mobile
  document width matched the viewport without horizontal overflow. Keyboard Tab
  moved to a visible outlined control; browser error/warning logs were empty.
- Prototype screenshots are local ignored artifacts, not private session exports.
- No new dependency was added. npm audit reported zero known vulnerabilities.

## Review

OpenCodeReview delegation selected 12 code/config/markup/style files; Codex reviewed
all 12 with zero skipped (100% selected coverage). Its seven excluded Markdown/test
files were reviewed directly. Later threat-model, verification and community
template/doc additions were also checked directly. A fresh-context agent mapped
the Poke architecture read-only; the primary agent verified material source claims.
This is not an independent security certification or production approval.

Review led to explicit operator-visibility/no-E2EE copy, retained event history with
honest batched animation, private connector-file checks and stable preview/history
DOM nodes while polling. The shared-proxy request-quota limit remains documented;
this prototype is not ready to run as a general public relay.

## Not established

No production or staging relay was deployed; no remote friend/device test, stock
Codex plugin installation/UI, automatic incoming-chat poke, E2EE, screen-reader
acceptance test or power-loss durability was verified. A shared HTTPS relay is
necessary for remote use. The protocol test proves MCP tool behavior, not an
automatic popup in an existing Codex chat. The PRD has a stop line for that gap.

Docker is included and CI runs its build. The earlier SMS baseline's Docker CI
passed; Poke's exact-commit CI status must be checked separately after publication.

Published code commit `2fd1eb5` passed GitHub's checks, including all tests,
dependency audit and Docker build in [run 41343147825](https://github.com/sintaxerrorpvtltd/safereach/actions/runs/41343147825).
Subsequent related-work/stop-line updates are documentation only. The external
projects in RELATED_WORK.md were read, not installed, audited or runtime-tested.
