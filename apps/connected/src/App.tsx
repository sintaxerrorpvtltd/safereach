import { useEffect, useRef, useState, Component, type ReactNode, type FormEvent } from 'react';
import { SignIn, SignOutButton } from '@clerk/react';
import { Authenticated, Unauthenticated, AuthLoading, useMutation, useQuery } from 'convex/react';
import { REACTIONS, type Reaction } from '../convex/reactions';
import { appHome } from './location';
import { api } from '../convex/_generated/api';
import type { FunctionReturnType } from 'convex/server';
type Profile = NonNullable<FunctionReturnType<typeof api.social.profile>>;
type Preview = FunctionReturnType<typeof api.social.previewHi>;
declare global {
    interface Window {
        pokiDesktop?: {
            setEnabled: (enabled: boolean) => Promise<boolean>;
            showHello: (data: {
                from: string;
                avatarKey: string;
                avatar: null;
                reaction: Reaction;
            }) => Promise<boolean>;
        };
    }
}
class ConnectionBoundary extends Component<{
    children: ReactNode;
}, {
    failed: boolean;
}> {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    render() { return this.state.failed ? <main><h1>Let’s reconnect.</h1><p>Poki couldn’t load your private circle. Check your connection and account setup, then try again.</p><button onClick={() => window.location.reload()}>Try again</button></main> : this.props.children; }
}
function Initial({ name }: {
    name: string;
}) { return <span className="initial" aria-hidden="true">{Array.from(name.trim())[0]?.toUpperCase() || 'P'}</span>; }
function Welcome() {
    return <main className="welcome" id="main">
        <span className="eyebrow">A LITTLE HELLO, A REAL CONNECTION</span>
        <h1>A little hello starts here.</h1>
        <p>Sign in with email. Choose a username.<br />Add a friend, then send your first wave.</p>
        <div className="auth"><SignIn routing="hash" withSignUp /></div>
        <p className="fine">New here? Enter your email to create an account.<br />Nothing goes to a friend until you preview and approve it.</p>
        <details className="auth-help"><summary>Having trouble signing in?</summary>
            <p>If the sign-in service refuses a request, you can restart here. Keep the reference shown by Clerk if it happens again. Your browser’s security settings can stay on.</p>
            <button className="quiet" onClick={() => window.location.replace(appHome(window.location.href))}>Restart sign-in</button>
            <p>This is an early development preview. A successful test login does not guarantee every browser or network will work.</p>
        </details>
        {!window.pokiDesktop && <p className="welcome-links"><a href="https://sintaxerrorpvtltd.github.io/safereach/#demo">Try the no-signup demo</a><span aria-hidden="true"> · </span><a href="https://sintaxerrorpvtltd.github.io/safereach/">What is Poki?</a></p>}
    </main>;
}
export default function App() {
    return <div className="shell">
        <header><a className="wordmark" href="#main">poki<span>your little circle</span></a><Authenticated><SignOutButton redirectUrl={appHome(window.location.href)}><button className="quiet">Sign out</button></SignOutButton></Authenticated></header>
        <Unauthenticated><Welcome /></Unauthenticated>
        <AuthLoading><main aria-live="polite">Connecting your account…</main></AuthLoading>
        <Authenticated><ConnectionBoundary><Connected /></ConnectionBoundary></Authenticated>
        <footer>Development preview · use test data. Clerk handles email authentication; this separate Poki Convex project stores profiles and friendships. No computer activity, location or chat monitoring. All 12 presets are free.</footer>
    </div>;
}
function Connected() { const profile = useQuery(api.social.profile, {}); return profile === undefined ? <main aria-live="polite">Loading your circle…</main> : profile === null ? <main id="main"><h1>Make yourself at home.</h1><p>Choose a username your friends can find. Your email stays private. This developer preview uses initials; your free character at signup is the next avatar milestone.</p><ProfileForm /></main> : <Circle profile={profile}/>; }
function ProfileForm({ profile, onDone }: {
    profile?: Profile;
    onDone?: () => void;
}) { const save = useMutation(api.social.saveProfile); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const form = new FormData(e.currentTarget); setBusy(true); setError(''); try {
    await save({ username: String(form.get('username')), name: String(form.get('name')), discoverable: form.get('discoverable') === 'on', availability: String(form.get('availability')) as Profile['availability'] });
    onDone?.();
}
catch (err) {
    setError(message(err));
}
finally {
    setBusy(false);
} } return <form className="profile-form" onSubmit={submit}><label>Display name<input name="name" maxLength={48} required defaultValue={profile?.name} autoComplete="nickname"/></label><label>Username<input name="username" pattern="[a-zA-Z0-9_]{3,24}" minLength={3} maxLength={24} required defaultValue={profile?.username} autoComplete="username" aria-describedby="username-help"/></label><small id="username-help">3–24 letters, numbers or underscores. Stored in lowercase.</small><label className="check"><input type="checkbox" name="discoverable" defaultChecked={profile?.discoverable ?? false}/>Let people find my exact username and send a friend request</label><label>Availability<select name="availability" defaultValue={profile?.availability ?? 'invisible'}><option value="available">Available — show friends I’m here</option><option value="dnd">Do not disturb — hide availability</option><option value="invisible">Invisible — hide availability</option></select></label><p className="fine">Available means this Poki session is connected, including while minimized. Friends never see a last-seen time.</p><button disabled={busy}>{busy ? 'Saving…' : profile ? 'Save changes' : 'Create my Poki profile'}</button>{error && <p role="alert" className="error">{error}</p>}</form>; }
function message(err: unknown) { return err instanceof Error ? err.message.replace(/\[CONVEX[^\]]*\]\s*(?:\[Request ID:[^\]]*\]\s*)?(?:Server Error\s*)?/g, '').replace(/Uncaught ConvexError: /g, '').split('\n')[0] : 'Something went wrong. Please try again.'; }
function Circle({ profile }: {
    profile: Profile;
}) {
    const connections = useQuery(api.social.connections, {});
    const inbox = useQuery(api.social.inbox, {});
    const blocks = useQuery(api.social.blockedPeople, {});
    const find = useMutation(api.social.findUsername);
    const request = useMutation(api.social.requestFriend);
    const accept = useMutation(api.social.accept);
    const remove = useMutation(api.social.remove);
    const block = useMutation(api.social.block);
    const unblock = useMutation(api.social.unblock);
    const previewHi = useMutation(api.social.previewHi);
    const sendHi = useMutation(api.social.sendHi);
    const readHi = useMutation(api.social.readHi);
    const heartbeat = useMutation(api.social.heartbeat);
    const stopPresence = useMutation(api.social.stopPresence);
    const [settings, setSettings] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const [found, setFound] = useState<FunctionReturnType<typeof api.social.findUsername> | undefined>();
    const [search, setSearch] = useState('');
    const [reaction, setReaction] = useState<Reaction>('hi');
    const [preview, setPreview] = useState<Preview | null>(null);
    const [desktopEnabled, setDesktopEnabled] = useState(false);
    const seen = useRef<Set<string> | null>(null);
    const dialog = useRef<HTMLDialogElement>(null);
    async function run(fn: () => Promise<unknown>, success?: string) { setBusy(true); setError(''); setNotice(''); try {
        await fn();
        if (success)
            setNotice(success);
    }
    catch (err) {
        setError(message(err));
    }
    finally {
        setBusy(false);
    } }
    useEffect(() => { if (profile.availability !== 'available')
        return; let active = true; const ping = () => { if (active)
        void heartbeat({}).catch(err => { if (active)
            setError(message(err)); }); }; ping(); const timer = setInterval(ping, 10000); return () => { active = false; clearInterval(timer); void stopPresence({}).catch(() => { }); }; }, [profile.availability, heartbeat, stopPresence]);
    useEffect(() => { if (!inbox)
        return; const ids = new Set(inbox.map(g => g.id)); if (seen.current && desktopEnabled && profile.availability === 'available') {
        for (const hi of inbox) {
            if (!seen.current.has(hi.id) && !hi.read)
                void window.pokiDesktop?.showHello({ from: /^[\p{L}\p{N} .'-]{1,40}$/u.test(hi.sender.name) ? hi.sender.name : hi.sender.username, avatarKey: hi.sender.id, avatar: null, reaction: hi.reaction }).catch(err => setError(message(err)));
        }
    } seen.current = ids; }, [inbox, desktopEnabled, profile.availability]);
    useEffect(() => { if (preview)
        dialog.current?.showModal();
    else
        dialog.current?.close(); }, [preview]);
    async function lookup(e: FormEvent) { e.preventDefault(); setFound(undefined); await run(async () => setFound(await find({ username: search }))); }
    async function notifications(enabled: boolean) { await run(async () => { if (enabled && profile.availability !== 'available') throw new Error('Choose Available before enabling desktop hellos.'); const result = await window.pokiDesktop?.setEnabled(enabled); setDesktopEnabled(Boolean(result)); if (enabled && !result)
        throw new Error('Desktop hellos could not be enabled.'); }); }
    useEffect(() => () => { void window.pokiDesktop?.setEnabled(false).catch(() => {}); }, []);
    useEffect(() => { if (profile.availability !== 'available') { setDesktopEnabled(false); void window.pokiDesktop?.setEnabled(false).catch(() => {}); } }, [profile.availability]);
    const friends = connections?.filter(p => p.status === 'friend');
    const pending = connections?.filter(p => p.status !== 'friend');
    return <main id="main"><div className="intro"><div><p className="eyebrow">HELLO, {profile.name.toUpperCase()}</p><h1>Your little circle.</h1><p>@{profile.username} · {profile.availability === 'available' ? 'Sharing availability in this session' : profile.availability === 'dnd' ? 'Do not disturb' : 'Invisible'}</p></div><button className="quiet" onClick={() => setSettings(!settings)} aria-expanded={settings}>{settings ? 'Close settings' : 'My profile & privacy'}</button></div>{settings && <section className="settings"><h2>On your terms.</h2><ProfileForm profile={profile} onDone={() => { setSettings(false); setNotice('Your profile is saved.'); }}/>{window.pokiDesktop && <label className="check"><input type="checkbox" checked={desktopEnabled} onChange={e => void notifications(e.target.checked)}/>Show a small desktop hello for new greetings while Available</label>}<h3>Blocked people</h3>{blocks?.length ? blocks.map(p => <div className="person" key={p.id}><Initial name={p.name}/><span>{p.name} <small>@{p.username}</small></span><button className="quiet" disabled={busy} onClick={() => void run(() => unblock({ target: p.id }), 'Unblocked. Friendship is not restored.')}>Unblock</button></div>) : <p className="fine">Nobody is blocked.</p>}</section>}
    {error && <p role="alert" className="error">{error}</p>}{notice && <p role="status" className="notice">{notice}</p>}
    <div className="reaction-picker"><label htmlFor="reaction">Pick a little hello <span className="free-label">All 12 are free</span></label><select id="reaction" value={reaction} onChange={e=>setReaction(e.target.value as Reaction)}>{(Object.keys(REACTIONS) as Reaction[]).map(code=><option key={code} value={code}>{REACTIONS[code].glyph} {REACTIONS[code].label}</option>)}</select></div>
    <div className="columns"><section><div className="section-title"><h2>Friends</h2><span>{friends ? `${friends.filter(friend => friend.online).length} available / ${friends.length} ${friends.length === 1 ? 'friend' : 'friends'}` : '…'}</span></div><p className="fine">A green dot means an available Poki session. Offline, invisible and do-not-disturb look the same.</p>{connections === undefined ? <p>Loading friends…</p> : friends?.length ? friends.map(p => <article className="person" key={p.id}><Initial name={p.name}/><div className="person-name"><strong>{p.name}</strong><small>@{p.username} · <span className={p.online ? 'online' : ''}>{p.online ? 'Available' : 'Unavailable'}</span></small></div><button disabled={busy || !p.online} onClick={() => void run(async () => setPreview(await previewHi({ recipient: p.id, reaction })))}>Preview hello</button><details className="person-menu"><summary aria-label={`Manage friendship with ${p.name}`}>•••</summary><button className="quiet" disabled={busy} onClick={() => void run(() => remove({ target: p.id }), 'Friend removed. Greetings and availability are no longer shared.')}>Remove friend</button><button className="quiet danger" disabled={busy} onClick={() => void run(() => block({ target: p.id }), 'Blocked. Requests and greetings are stopped.')}>Block</button></details></article>) : <div className="empty"><span className="little-face" aria-hidden="true">◡</span><h3>A little quiet, for now.</h3><p>Share your username with a friend, or find theirs below. You both decide to connect.</p></div>}
    <div className="find"><h3>Find someone you know</h3><form onSubmit={lookup} className="search"><label className="sr-only" htmlFor="search">Exact Poki username</label><input id="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Their exact username" minLength={3} maxLength={24} required/><button disabled={busy}>Find</button></form><p className="fine">Exact usernames only. People choose whether they can be found.</p>{found === null ? <p role="status">No discoverable match. Check the exact username with your friend.</p> : found && <div className="person"><Initial name={found.name}/><span>{found.name}<small>@{found.username}</small></span><button disabled={busy} onClick={() => void run(async () => { await request({ target: found.id }); setFound(undefined); }, 'Request sent. Your friend must accept before you can connect.')}>Request friendship</button></div>}</div>
    {pending && pending.length > 0 && <div className="requests"><h3>Friend requests</h3>{pending.map(p => <div className="person" key={p.id}><Initial name={p.name}/><div className="person-name"><strong>{p.name}</strong><small>@{p.username} · {p.status === 'incoming' ? 'Wants to connect' : 'Waiting for acceptance'}</small></div>{p.status === 'incoming' && <button disabled={busy} onClick={() => void run(() => accept({ relationship: p.relationship }), 'You’re friends now.')}>Accept</button>}<button className="quiet" disabled={busy} onClick={() => void run(() => remove({ target: p.id }))}>{p.status === 'incoming' ? 'Decline' : 'Cancel'}</button><button className="quiet danger" disabled={busy} onClick={() => void run(() => block({ target: p.id }))}>Block</button></div>)}</div>}</section>
    <aside><h2>Little hellos</h2><p className="fine">Only accepted friends. Hellos leave your inbox after five minutes. No read receipts are shared.</p>{inbox === undefined ? <p>Loading hellos…</p> : inbox.length ? inbox.map(hi => <article className={`hello ${hi.read ? 'read' : ''}`} key={hi.id}><Initial name={hi.sender.name}/><div><strong>{hi.sender.name}</strong><p><span aria-hidden="true">{REACTIONS[hi.reaction].glyph}</span> {hi.text}</p><small>{hi.read ? 'Acknowledged' : 'A little hello for you'}</small></div>{!hi.read && <button className="quiet" disabled={busy} onClick={() => void run(() => readHi({ id: hi.id }))}>Got it</button>}</article>) : <div className="empty compact"><p>No hellos yet.<br />There’s no rush.</p></div>}</aside></div>
    <dialog ref={dialog} onCancel={() => setPreview(null)} onClose={() => setPreview(null)} aria-labelledby="preview-title">{preview && <><p className="eyebrow">A PREVIEW, JUST FOR YOU</p><h2 id="preview-title">A hello for {preview.recipient.name}?</h2><p className="preview-message"><span aria-hidden="true">{REACTIONS[preview.reaction].glyph}</span> {preview.text}</p><p>This exact greeting goes only to @{preview.recipient.username}. Nothing is sent until you approve. This preview expires after one minute.</p><div className="actions"><button disabled={busy} onClick={() => void run(async () => { await sendHi({ preview: preview.id, recipient: preview.recipient.id, reaction: preview.reaction, text: preview.text }); setPreview(null); }, 'Your hello was sent to your friend’s Poki inbox.')}>Approve & send hello</button><button className="quiet" onClick={() => setPreview(null)}>Cancel</button></div>{error && <p role="alert" className="error">{error}</p>}</>}</dialog></main>;
}
