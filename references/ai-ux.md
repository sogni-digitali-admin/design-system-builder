# AI: characters, chat, agents

Write this section when the product has an assistant, a website chatbot or background agents. Ask what exists:
which agents, what each may do, which actions need a human click, what is logged, what it costs.

## 1. Characters (one per agent, one family)
- **One family, one face.** All characters share the same eyes (shape, spacing, blink) so users recognise "an AI of
  this product"; bodies and colours change per agent (assistant, chatbot, follow-up, digest, policy, custom).
  The main assistant gets the most care — it is the one users see daily.
- **A character sheet per agent**: name, role in one line, what it may and may not do, colours (from the chart
  palette, never status colours), body shape, signature motion, where it appears.
- **States**: idle (slow blink, breathing), listening, thinking (eyes up, dots), speaking (gentle bob), happy
  (task done), confused (needs input), error, sleeping (off / cap reached). Each state is readable without colour.
- **Reactions to messages**: thanks → happy; question → tilt; long wait → thinking; error → apologetic look.
- **Pointer**: eyes follow the pointer within a small radius; hovering for long → shy blink; petting (back-and-forth
  over it) → happy. Off when `prefers-reduced-motion` (eyes centred, no follow).
- **Sizes**: 24 list, 32 message, 48 header, 96+ empty state / onboarding. Below 32 drop the body details.
- Build characters as one small JS custom element (`<x-agent character="…" state="…" size="…">`) that draws SVG,
  so the app and the page share the same file.

## 2. Chat interface (structure of assistant-ui)
Use the assistant-ui anatomy, so developers map it 1:1 to the library (assistant-ui.com):
- **Thread**: viewport with messages, a "scroll to bottom" button, a welcome screen with 3–4 suggestions.
- **Message**: user bubble (right), assistant message (left, avatar, no bubble or a light one), parts: text
  (markdown), tool call card (what the AI is doing: "Searching contacts…" → result), reasoning (collapsed),
  attachments, sources/citations. Actions on hover: copy, retry, edit (user), feedback 👍/👎.
- **Composer**: auto-growing input, attach, send ↔ stop while streaming, keyboard (Enter sends, Shift+Enter new
  line), disabled state with the reason (cap reached).
- **Confirmations**: any write (create, update, send) appears as a proposal card — what will change (a diff), with
  Confirm / Edit / Cancel and an expiry. The AI never sends an email or deletes on its own unless the product
  explicitly allows it.
- **Streaming and errors**: typing indicator, partial text, "stopped" state, network error with retry, cap reached
  with who to ask.
- **Website chatbot** variant: floating bubble, launcher with the character, permanent "AI" label, privacy line,
  hand-off to a form or a human, no access to private data.
- **Chat settings**: tone, language, answer length, data sources on/off, what the assistant may do (per action:
  never / ask / allowed), history retention, export/delete conversations.

## 3. Agents (background work)
- **Catalogue**: card per agent (character, role, trigger: on demand / scheduled / on event, edition, status, last run).
- **Agent sheet / editor**: instructions, tone, tools (each: read or propose), knowledge sources, trigger, monthly cap,
  roles allowed; a custom agent starts from a template.
- **Approval inbox**: proposals from agents, each with the diff, the reason, the source run, Approve / Edit / Reject,
  bulk approve for safe kinds, expiry (e.g. 14 days), empty state with a figure.
- **AI activity log**: every run (who/what triggered it, agent, input summary, tools called, outcome, tokens/cost,
  duration, links to proposals), filters (agent, status, date), detail drawer, export; errors are visible, never
  swallowed.
- **Costs and caps**: usage meter per month, alerts at 80% and 100%, what happens at the cap (agents pause; the
  assistant says so).
- **Disclosure**: AI-written content is marked "AI draft — to review" until a human edits or approves it.
