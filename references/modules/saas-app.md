# Screen pack: SaaS app / back office

## Screens
1. **Sign-in and security** — email + password or passkey, magic link, 2FA (TOTP, backup codes), SSO button,
   errors that do not reveal whether an account exists, session list with "sign out everywhere".
2. **Onboarding** — welcome (figure), 3–5 setup steps with progress, sample data option, skip.
3. **App shell** — top bar (search/command palette, notifications, help, account), sidebar with sections and
   collapsed mode, breadcrumbs, page header pattern (title, description, primary action).
4. **Settings** — profile, organisation, team and roles (invite, pending, role matrix: who can view/edit/delete
   what), notifications (per channel), integrations (connected / disconnected states with figure), API keys
   (shown once, copy, revoke), data export and deletion, audit log.
5. **Billing** — current plan and usage meters, plan comparison (edition badges), change plan (proration
   explained), payment method, invoices list, cancel flow (reason, what is lost, confirm).
6. **Notifications centre** — tabs (all, mentions, system), unread dot and count, mark all read, settings link.
7. **Help** — searchable help, keyboard shortcuts sheet (`?`), contact, status page link.

## Rules
Destructive actions ask for confirmation proportionate to the damage (type the name to delete an organisation);
limits shown before they are hit (80% warnings); every empty list explains and offers the first action;
edition-locked features stay visible with a "Pro" badge and an upgrade path, not hidden.
