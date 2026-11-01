# Poki connected circle

An isolated React + Clerk + Convex client for private friend requests, optional availability and 12 fixed preset reactions. The existing local Poki demo remains separate.

This app uses its **own** Clerk application and **own** Convex development project. Never link it to Some1 or copy another app’s credentials.

## Run

From `apps/connected`:

```sh
npm ci --ignore-scripts
node setup.mjs # opt into bundled public Poki development settings
npm run dev       # http://127.0.0.1:5174
npm run backend   # development backend watcher
npm test
npm run build
```

Public browser settings belong in ignored `.env.local` (see `.env.example`). The backend’s `CLERK_JWT_ISSUER_DOMAIN` must match this app’s Clerk issuer; the Clerk Convex integration or a JWT template named `convex` must supply audience `convex`. Authentication has no fallback issuer.

The build emits `dist/runtime-config.json` with only the public Convex URL, Clerk publishable key and Clerk issuer. The Electron connected launcher uses these exact origins for its network policy.

## What a connection means

- Create a private Poki profile after signing in. Usernames are unique, lowercase, 3–24 letters/numbers/underscores.
- Discovery is off by default and supports only an exact username. No user directory, email search or global presence endpoint exists.
- A friend request reveals the requester’s display name and username to its recipient. Both people must consent before availability or greetings are shared. Each account has a bounded circle of at most 100 accepted/pending connections.
- Availability is invisible by default. “Available” means at least one connected Poki session, including a minimized desktop window. It does not mean active computer use. Disconnect detection can take approximately 25 seconds. Do not disturb and Invisible both appear unavailable; no last-seen time or read receipt is returned to friends.
- Each reaction requires an available accepted friend, a server-created preview and explicit approval of the exact preset reaction, fixed text and previewed recipient. All 12 reactions, friends, availability and desktop pop-ins are free; the first AI-generated personal character at signup is also planned as free, but is not implemented here. Optional later AI extras may become Pro. Previews expire in one minute, are single-use and cannot be reassigned. A sender can send at most one reaction every 30 seconds; search, request and preview actions also have cooldowns.
- Greetings expire after five minutes. Scheduled deletion updates subscribed inboxes. Blocking/removing a friendship revokes existing greetings, pending previews and presence access immediately; a later re-friendship cannot revive old greetings. Unblocking does not restore friendship.
- Each user can read only their own inbox and mark only their own greetings as acknowledged. No external email, SMS or arbitrary message is sent.
- Desktop pop-ins require a separate local opt-in, only appear for newly received unread greetings while Available, and never replay the initial inbox history. Initials are used instead of uploaded photos.

## Verification and limits

`npm test` checks authentication denial, profile validation/uniqueness, private discovery, mutual consent/ownership, presence privacy, DND/invisible, exact preview/reaction approval, unknown reaction rejection, expiry/replay/rate controls, blocking/removal and scheduled greeting deletion using `convex-test` and the real presence component test harness. `npm run build` typechecks both frontend and backend.

The configured cloud backend is a **development deployment**, not a production release. Provider limits apply. Automated tests do not establish real two-person, cross-device, sleep/resume or packaged-desktop behavior. Those checks must be reported separately when actually performed.
