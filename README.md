# Poki — by Sintax Error

**A little hello, by choice.** Free social software under
**Sintax Error Private Limited**, in `sintaxerrorpvtltd/safereach`.

[Website](https://sintaxerrorpvtltd.github.io/safereach/) ·
[Open the development app](https://sintaxerrorpvtltd.github.io/safereach/app/) ·
[Install / give to Codex](docs/INSTALL.md) · [PRD](docs/POKI_PRD.md)

Poki connects people who both choose to be friends. Find an exact username,
accept a request, see available friends, pick a reaction, preview and approve.
A Mac/Windows desktop shell can show an opt-in hello at the edge of the screen
while you work elsewhere. It does not monitor chats or computer activity.

## What works

| Feature | Evidence / current limit |
|---|---|
| Username accounts, mutual requests, private friends, block/remove | Dedicated Clerk + Convex development app |
| Friend-only availability; Invisible and DND | Opt-in Poki connection status, no last-seen/activity tracking |
|12 free reactions, recipient/content preview and exact approval | Backend tests and live Clerk-signed two-test-account cloud exchange |
| Browser interface and fictional landing-page demo | Separate surfaces; demo never contacts people |
| Mac / Windows desktop source and unsigned app folders | Both package; Mac launch verified, Windows runtime/popup device acceptance pending |
| Personal image upload, local preview, consent/removal | Earlier offline local workspace only; connected app currently uses initials |
| Free AI-generated personal character at signup | Planned; shared style selected, dedicated provider key/API flow not configured |
| Limited MCP read/prepare tools | Earlier local connector tested; connected-account MCP bridge not implemented |
| Automatic insertion into another person’s Codex chat | Not verified or advertised as working |

This is a **development preview**, not a production release. No paid plans,
image-provider charges, social messaging credentials, or Some1 integration.

## Run it

```sh
npm ci --ignore-scripts
npm run connected:setup
npm test
npm --prefix apps/connected test
npm run desktop:setup
npm run desktop:connected
```

Node.js22.12+ and Git are required. Desktop setup downloads the official Electron
binary; announce before opening windows. `connected:setup` uses versioned **public**
Poki development client settings, never an admin key, and preserves any different
existing environment. See [the installation guide](docs/INSTALL.md) for a copyable
Codex prompt, first hello, controls, browser mode and offline alternatives.

## Free core, future Pro

Accounts, friends, availability, desktop hellos and all12 presets stay free. Your
first personalized character at signup is also part of the free plan once its
photo-to-character service is implemented. Preset sends call no AI model.

Pro is reserved for optional future AI experiences: extra styles/outfits/poses,
personalized animation packs, or an opt-in AI companion. These are proposals;
there is no checkout, subscription or price. Hosting/image generation can cost the
operator even when users pay nothing. Core code remains Apache-2.0.

Some1.help remains a separate commercial platform, with no shared deployment,
customer records, auth or private application code. Community feature pull
requests are welcome and reviewed/tested before acceptance.

## Contribute and verify

```sh
npm run check
npm --prefix apps/connected test
npm --prefix apps/connected run build
```

See [CONTRIBUTING](CONTRIBUTING.md), [SECURITY](SECURITY.md),
[verification evidence](docs/POKI_VERIFICATION.md),
[desktop boundaries](desktop/README.md), [connected backend](apps/connected/README.md),
[avatar style](docs/AVATAR_STYLE.md), and [threat model](docs/CONNECTED_THREAT_MODEL.md).
Five moderate advisories remain in development-only packaging tooling; production
dependency audits report none. Native device acceptance is still needed.

## Earlier SafeReach work

The Apache-2.0 SafeReach scaffold and Git history remain intact: trusted contacts,
mock SMS, explicit consent, encrypted local vault/audit and India resource registry.
`npm start`, `npm run operator` and `npm run poki` retain their documented reference
workflows. They are not medical dispatch or production messaging services.
See [MVP](docs/MVP.md), [Poke reference](docs/POKE.md), and
[reuse research](docs/RELATED_WORK.md). No founder/private chat content is published.

## License

[Apache-2.0](LICENSE), with [NOTICE](NOTICE). User-uploaded images remain the user's
content. The supplied external illustration and close generated style-review
sample are not redistributed or relabeled as Apache-2.0 assets. New public artwork
must have a recorded source/license. Future proprietary AI operations/modules must
be clearly separated from the open-source core.
