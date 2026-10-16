# Sign-in and account access

Write this section for any product with accounts. One flow for customers and one for staff, on phone and desktop.
Make it interactive (every screen reachable by chips, simulated network: online / service down / offline, a "replay"
button). Show URLs in a fake address bar so the context (site, CRM, partner portal) is clear.

## Customer screens
1. **Start** — identifier first: one field "email or phone" (phone shows country code + national number). Primary
   "Continue". Below, an "or" divider, social buttons, "Continue as guest: find my booking". Footer line on every
   screen: "Need help signing in?" (opens the assistant, never asks for secrets).
2. **Method** — pick how to prove it's you. Email: 6-digit code (recommended) · magic link · password · passkey
   ("safest"). Phone: SMS code (recommended) · WhatsApp code · password · passkey. One line of benefit under each.
3. **Code** — six boxes (see Inputs), "resend in 0:30" countdown, "use another method".
4. **Password** — show/hide toggle, "forgot?" link, a "use a code instead" alternative; no strength rules on login.
5. **Sign-up** — first name, last name, email, language, optional password (a code or passkey also works), tick boxes:
   marketing consent **unticked** (optional), terms + privacy **required** and explicit. Show the welcome gift if any.
6. **Forgot password** — email → "If an account exists, a link was sent" (valid 15 min, single use) → set new
   password with strength meter + checklist (e.g. 10 characters, one capital, one digit) → success.
7. **Link sent** — same wording for magic link and reset; resend countdown; "open your mail app".
8. **Guest: find my booking** — reference + family name → read-only booking; "to change or cancel, sign in or create
   an account". Rate limit shown ("5 tries per hour").
9. **Locked** — "Sign-in paused for 15 minutes" with a live timer, reset-password and help links.
10. **Session expired** — a **modal over the page**, not a redirect: the page and any typed input are kept; the modal
    asks for the password or a code and returns focus where it was.
11. **Signed out** and **Welcome** (first name, next step, points/benefit if any).

## Staff and partner screens
- **Back office: SSO** — "Continue with the company account" → redirect screen → **mandatory 2FA**: authenticator
  6-digit code (changes every 30 s) · backup code (8 characters, one-time, eight issued at activation) · no
  "remember this device".
- **Partner portal** — phone number + SMS code (masked number shown, valid 10 min).
- **Crew app** — 4-digit PIN on a keypad (dots, shake on error, 3 tries) + biometrics button; "forgot PIN? ask the
  team lead" (reset from the back office, never by the assistant). After 3 failures the device is locked until a lead
  unlocks it.
- **Device pairing (watch)** — the watch shows a 6-digit code + QR; the phone asks for the code or scans the QR;
  code expires in 2 min, 3 tries, "show a new code".
- All staff sessions end after inactivity (30 min customer / shorter for staff) with the same expired modal.

## Layout
- **Desktop**: split screen — form column (max 400-440 px) beside a brand panel (illustration or photo, one promise
  line, 3 benefits). **Phone**: form only, brand panel removed, logo on top, back arrow, keyboard-safe sticky button.
- Social buttons: neutral generic style by default; replace by each provider's **official button** (their brand
  rules) unless the official asset is provided. Say so in Notes.
- One primary button per screen; text links for secondary routes; labels always above fields, never only a placeholder.

## Inputs
- **6-digit code**: one box per digit, auto-advance, backspace goes back, paste spreads all six, arrow keys move,
  `autocomplete="one-time-code"` on the first box so SMS/Mail autofill works, `inputmode="numeric"`. States: rest,
  typing, error (shake + message), verified. Submit automatically on the 6th digit, button stays for keyboards.
- **Resend**: disabled with a `0:30` countdown (a `<time>`), then a link; announce "You can resend the code".
- **Attributes**: `autocomplete` = `email`, `username`, `current-password`, `new-password`, `one-time-code`,
  `tel-national`, `tel-country-code`, `given-name`, `family-name`; `inputmode` = `email` / `tel` / `numeric`.
- **Password**: show/hide button with `aria-pressed`; live strength label + checklist with icon + text per rule.

## States
Idle · focus · typing · validating (button keeps its label + spinner, stays focusable with `aria-disabled`, cannot be
sent twice) · field error · form error · success ("Signed in. Opening your space", 0.5 s before redirect) · service
down ("Not linked to your details, try again", Retry; the attempt counter does **not** advance) · offline (persistent
banner, typed values kept) · locked · expired.

## Security copy rules
- Never reveal whether an account exists: same message and same response time for unknown id / wrong password /
  request for a code. "If an account exists, a code was sent."
- Wrong credentials: one sentence naming neither field, offering another route: "Incorrect details. Check your email
  and password, or sign in with a code."
- Attempts: 3 for code or PIN, 5 for password or booking reference; then a 15 min pause per device **and** per
  identifier; say how many tries remain, without blaming the user.
- Codes valid 10 min, single use; magic and reset links 15 min, single use.
- Marketing consent unticked; terms accepted explicitly; privacy line citing the applicable law (GDPR, local data
  law): access, correction, deletion on request. Don't invent the legal text: mark it demo.
- WhatsApp codes need an opt-in and an approved template; show the cost-free benefit only if true.
- The assistant never asks for, reads or stores a password, PIN or code; a hand-over to a person passes context,
  never credentials.

## Accessibility
- Visible labels; error text linked with `aria-describedby`; one `aria-live="polite"` region per message; on submit
  focus goes to the **first field in error**; on a new screen focus goes to its `h1`/`h4` (`tabindex="-1"`).
- No visual-only captcha: invisible challenge first, then a code by email as fallback.
- Targets ≥ 44 px; motion off with `prefers-reduced-motion`; contrast checked in every theme; paste never blocked.

## Test values (mark clearly in the demo)
Show a line: "To test: accepted code `123 456`, password `<demo>`, PIN `0000`, booking ref `<ref>` with name `<name>`.
Any other try shows the error and counts toward the limit." Never use real accounts or real numbers.

## Emails / messages
Sign-in code, magic link, password reset, new-device sign-in notice, account created (welcome), password changed,
2FA enabled with backup codes, account deletion scheduled. Each states what to do if it wasn't you.

## Questions to ask
Which methods are really implemented (passkey, WhatsApp, SSO provider) · social providers · staff roles and which
need 2FA · session lengths · customer, partner and crew entry points · languages · applicable privacy law · lockout
policy · is guest lookup allowed.
