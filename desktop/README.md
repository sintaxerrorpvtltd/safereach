# Poki desktop shell (experimental)

The shell uses the same local profile/friend workspace as the browser. It starts
an ephemeral loopback relay on an unused port. It does not deploy a remote service.

```sh
npm ci --ignore-scripts
npm run desktop:setup
npm run desktop
```

`desktop:setup` runs only Electron's official binary installer, with its bundled
checksums and a repository-local download cache. It downloads a platform binary;
it does not enable other npm lifecycle scripts. Slow/blocked release downloads
can prevent startup. Node.js 22.12+ is required for the desktop build tools.

Desktop pop-ins are **off** until explicitly enabled in the workspace. An enabled
app can remain running while Codex is closed. Close the workspace to hide it;
use the Poki tray/menu icon to reopen or quit. Disabling pop-ins hides any current
popup. Closing while disabled quits the app. Quitting stops the local relay and
clears temporary profiles/pairings. There is no login-at-startup registration.

A hello appears near the display's right edge for five seconds, without focus
or mouse capture. The optional PNG character is contained in its full frame;
otherwise a letter mascot is used. Reduced motion leaves the still popup and
name. Pop-ins do not mean a remote person has read anything. Remote accounts and
real friend transport remain separate unfinished work.

## Renderer boundary

The dashboard has only these methods exposed by its sandboxed preload:

- `window.pokiDesktop.setEnabled(boolean)` → `Promise<boolean>`
- `window.pokiDesktop.showHello({from, avatarKey, avatar, reaction?})` → `Promise<boolean>`

`avatar` is null or a PNG data URI, at most 64 KiB decoded and at most 512×512.
The main process validates payloads, accepts IPC only from the exact dashboard
main frame, and rate-limits displayed popups. No session token is passed over
this bridge. The overlay receives a fixed hello event through its own preload;
it has no send/approve/enable API. Both renderers have sandboxing and context
isolation enabled, Node integration disabled, permission requests denied,
navigation/new windows blocked and network requests restricted to the local
relay (plus local PNG/blob assets). The server adds its own Host/Origin/CSP gates.

The renderer is trusted app code. These gates do not claim to protect against a
compromised main process or an attacker with control of the user's computer.
The local relay remains an experimental, in-memory, non-E2EE implementation.

## Unsigned developer packages

```sh
npm run desktop:pack:mac
npm run desktop:pack:win
```

These replace the corresponding generated app folder under ignored `output/desktop/`, using the current
Mac architecture or Windows x64. No signing, notarization, installer publishing,
auto-updates, accounts or credentials are configured. OS trust prompts should
be expected; source/build availability does not prove either OS runtime works.

Packaging uses an explicit runtime file allowlist, excludes the site's public
marketing/docs, source chats, environment/private files, photos, project tests and output,
and prunes development dependencies. The embedded app is the Poki relay only;
MCP setup documented elsewhere uses the original checkout.

The current official Packager dependency tree reports five moderate development
advisories through glob/minimatch (filesystem traversal/DoS). Production dependency
audit is separate. No blind major-version override or `npm audit fix --force` is
applied. Packaging only the controlled local project, with no user-supplied glob
patterns and ASAR disabled, bounds this prototype's usage; resolve/review upstream
before treating it as a release toolchain for untrusted inputs.

## Optional connected workspace

After setting up the separate `apps/connected` development project and installing
its own locked dependencies, `npm run desktop:connected` builds that frontend and
opens its `/connected/` screen. Its public `runtime-config.json` contains only a
Clerk publishable key/issuer and a Convex URL. It is not a secret file. The shell
validates exact HTTPS Clerk-development and Convex origins, allows the matching
Convex WSS origin and `https://img.clerk.com`, and still blocks other network
origins. Auth navigation stays inside the dashboard's hash route. Native sign-in,
remote friend delivery and cross-platform pop-ins require separate runtime checks.

`npm run desktop:pack:connected:mac` and `npm run desktop:pack:connected:win`
produce separate unsigned folders under `output/desktop-connected/`. Only built
frontend HTML/assets and that public runtime config are added to the package;
backend sources, `.env` files and credentials stay excluded. The connected package
starts in connected mode; the default package and `npm run desktop` remain local.

## Free social core and optional customization

Private friends, chosen availability/presence, desktop pop-ins and all twelve
bundled reactions are free social core: Hi, Heart, Wave, Tea, Coffee, Thanks,
Cheer, Hug, High Five, Sparkle, Thinking of You and Celebrate. These use fixed
labels and system Unicode emoji with a finite animation; appearance varies by
operating system. No AI call or AI credit is needed per poke. Sender identity
remains visible beside the chosen reaction. Older hello payloads default to Hi.

Pro is only optional AI customization, such as a personalized character or style.
It is not required for friends, presence, sending or receiving these reactions.
This does not claim paid AI customization or a production service is live. The
connected backend remains a development integration requiring separate runtime
and release verification.

The initial personal character at signup is planned as free too. Only later optional
AI extras may be Pro. The connected preview currently uses initials; no source
photo is uploaded or generated through an image API.
