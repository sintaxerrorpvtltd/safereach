# Try Poki with one friend

Open [Poki](https://sintaxerrorpvtltd.github.io/safereach/app/?poki=auth2)
in your browser. Your friend can use the same link from their own computer.
This is a development preview; start with test data.

1. Enter your email and verify the code Clerk sends. New accounts do not require
   a password. Choose a display name and a username in Poki.
2. Both people opt into **Let people find my exact username** in profile settings.
   Discovery starts off. Share your username directly with your friend.
3. Find their exact username and request friendship. They accept in their own
   account. Neither side can silently add the other.
4. Choose **Available** in profile settings on both computers. Poki reports an
   available app session, not whether someone is typing or using another app.
5. Choose a reaction, click **Preview hello**, check the recipient and greeting,
   and approve. The greeting appears in your friend's Poki inbox. They can send
   one back; there is no shared read receipt or obligation to reply.

All twelve preset reactions are free. Invisible, Do Not Disturb, removal and
blocking remain available. Hellos leave the inbox after five minutes.

If sign-in refuses a request, expand **Having trouble signing in?** and use
**Restart sign-in**. Keep Clerk's displayed reference if it repeats. Do not disable
browser protections. The [fictional demo](https://sintaxerrorpvtltd.github.io/safereach/#demo)
works without an account and never contacts a real person.

The [desktop preview](https://github.com/sintaxerrorpvtltd/safereach/releases/tag/v0.1.0-alpha.2)
adds optional screen-edge pop-ins while Poki is running. It is unsigned and still
needs native device acceptance; the browser is the recommended first test.
There is no automatic insertion into a friend's Codex conversation. Personalized
AI characters are planned free at signup but are not enabled in this preview.
