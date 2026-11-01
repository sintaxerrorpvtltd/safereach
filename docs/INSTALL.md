# Start Poki

Poki is a free, open-source social app from Sintax Error. This release is a
**development preview**, backed by a new, isolated Clerk application and Convex
project. Use test data. No production service, payment or image API is configured.

## Give this to a fresh Codex chat

> Install Poki from https://github.com/sintaxerrorpvtltd/safereach in a new isolated folder. Read docs/INSTALL.md. Use Node.js 22.12+, npm ci --ignore-scripts, then follow the connected desktop setup and checks. Use only the bundled Poki development service; no secret keys or global Codex changes. Tell me before opening desktop windows. Help me choose a username, mutually add a friend, and preview/approve a hello. Report what you verified. AI avatar generation and automatic Codex chat insertion are not enabled yet.

## Fastest path: the browser

Open https://sintaxerrorpvtltd.github.io/safereach/app/ . Create your own account,
choose a username and display name, and explicitly enable exact-username discovery
if you want to receive friend requests. Availability starts Invisible. Choose
Available to share online presence with accepted friends. Nobody sees your email,
computer activity, location or last-seen time through Poki.

Both people choose to connect: search the exact username → send request → recipient
accepts. Pick one of12 free reactions, preview its recipient and content, then
approve. Offline, invisible and do-not-disturb all appear Unavailable. DND stops
new greetings. Remove or block a person in their friend menu.

The web app receives hellos inside its open page. A desktop edge pop-in requires
the desktop app, explicit opt-in, Available status and a running connection.
It does not insert messages into somebody’s existing Codex chat.

## Mac / Windows source setup

Use a new checkout; never overwrite an existing repository or environment.
Requires Git, npm and Node.js22.12 or newer. Do not install system tools silently.

```sh
git clone https://github.com/sintaxerrorpvtltd/safereach.git
cd safereach
npm ci --ignore-scripts
npm run connected:setup
npm test
npm --prefix apps/connected test
npm run desktop:setup
npm run desktop:connected
```

`connected:setup` installs the nested app's pinned dependencies and writes only
public client settings for Poki’s development service. It refuses to replace a
different existing backend. It installs no admin key. Developers can configure
separate Clerk/Convex resources instead; see apps/connected/README.md.

`desktop:setup` downloads Electron's official platform binary, checks its pinned
checksum, and enables no other npm lifecycle scripts. Slow/blocked downloads may
need a retry. An installing agent must announce before opening the desktop window,
wait for startup, then report the checkout, commit, URL and actual test result.
Do not open Electron.app directly: that opens its starter screen, not Poki.

Enable desktop hellos in **My profile & privacy**. They last five seconds and do
not take keyboard focus or capture clicks. Close while enabled to keep Poki in the
tray/menu; Open Poki restores it, Quit Poki stops it. Closing while disabled quits.
No auto-start registration is installed. Windows runtime and end-to-end popup
focus/timing still need device acceptance; unsigned packaging is not that proof.

For a browser-only local development UI:

```sh
npm --prefix apps/connected run dev
```

Use its printed local URL. If a port is taken, preserve its process and use a new
port. Local UI connects to the same explicitly configured development backend.
The first Clerk load may take time; do not claim readiness until its form appears.

## What is free and what is next

Accounts, private friends, availability, desktop pop-ins and all12 preset reactions
are free. No image API is called per poke. A free personal character generated at
signup from the user's photo plus our shared style is planned, awaiting its own
provider key, upload consent and implementation. This connected preview uses
initials. The earlier offline local prototype can accept chosen image uploads;
that is separate from cloud photo-to-character generation.

Future Pro ideas are additional AI customization/experiences, not the basic signup
character or ordinary social features. No Pro payment or subscription exists.

## Offline reference and Codex connector

`npm run poki` starts the earlier ephemeral two-tab local profile/pairing workspace
at127.0.0.1:4317. Two independent browser tabs can test it; a remote friend cannot
join localhost. Its name/image data resets on server restart.

That reference includes a limited MCP read/prepare connector, with exact separate
human approval in the inbox; see docs/POKE.md. It is **not** an authenticated bridge
to the new connected account app, and global host settings are never changed by
the setup above. Neither host popup injection nor remote Codex-to-Codex delivery
has been verified. Instagram/Telegram remain planned; WhatsApp is outside the MVP.

## Stopping and privacy

Use Quit Poki for the desktop app, or Ctrl+C in a development terminal. Sign out
ends the account UI session. Use Invisible/DND and remove/block controls to stop
sharing availability or greetings. Greetings expire after five minutes; no read
receipts are shared. Auth/account data is handled by Clerk; profiles, relationships
and ephemeral greetings are handled by this dedicated Convex development project.
No Some1 project, identity, user data or provider service is reused.
