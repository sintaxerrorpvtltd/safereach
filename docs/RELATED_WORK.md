# Related work and reuse decision — 2026-11-02

This is a targeted primary-source check, not an exhaustive market survey, security
audit or runtime comparison. None of these projects was installed or connected.

| Existing project/capability | Evidence and overlap | Remaining distinction |
| --- | --- | --- |
| [Murmur Connect](https://github.com/alexfrmn/murmur) | Documents remote MCP peer messaging and encrypted transport. | Evaluate reuse before writing another messaging layer. Runtime/security claims unverified here. |
| [Murmur chosen-task delivery](https://github.com/alexfrmn/murmur/blob/main/docs/codex-desktop-queue-wake.md) | Documents an opt-in macOS receiver using a specific participating Codex task and local queue command. Its guide distinguishes queued from displayed and notes active-turn limitations. | No verified animated popup, live friend test or installation in our host. Queued agent input must not become new user authorization. |
| [agent-peers-mcp](https://github.com/Co-Messi/agent-peers-mcp) | Documents messaging among local coding sessions. | Same-machine coordination is not the requested remote social-poke experience. |
| [Codex Buddy](https://github.com/Fishason/codex-buddy) | Documents a separate terminal pet, friends list and calendar sharing. | Not evidence of a peer's animated hello inside an existing Codex chat. |
| [OpenAI MCP Events](https://developers.openai.com/plugins/build/mcp-events) | Documents user-subscribed events on specified ChatGPT Work/Cloud/dot surfaces. | Not proof of identical support in an arbitrary local Codex chat. |

The installed bundled Codex CLI reports version 0.165.0-alpha.1.2 and exposes
`codex queue --help` with a chosen thread and message argument. Only help was run;
no task was read, modified, started or messaged through that command. This confirms
a command surface, not end-to-end delivery or animation behavior.

## Decision

Remote assistant messaging is not a novel missing transport. Stop expanding the
prototype relay, as requested. Keep the PRD, friendly landing page, animation,
explicit user-action model and bounded local proof under Syntax Error Pvt Ltd.

If work resumes, first inspect the existing adapter's source and permissions and
perform a voluntary, separately authorized two-user test. Prefer adapting or
contributing to an existing transport if it meets the consent, chosen-inbox and
no-unintended-model-work requirements. Do not enable wake hooks, expose App Server,
install anything or create background turns merely because upstream docs suggest it.
If existing tools satisfy the whole experience, retire this prototype rather than
maintain duplicate infrastructure. If only the animated UX is missing, scope any
future work to that verified gap.
