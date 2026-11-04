# 02 — Permission model

## Granted at install

| Permission | Use observed |
|---|---|
| `cookies` | Read `li_at`, `JSESSIONID` on `https://www.linkedin.com` **only** (2 call sites, both in logout-detection module — [03](03-credential-handling.md)) |
| `scripting` | Inject the real network interceptor + `ContactOut Anywhere` scrapers into pages |
| `activeTab` | On-demand scraping of the current tab |
| `background` | Service worker (MV3) |
| `storage` / `storage.sync` | Config flags, cached user, scrape-state keys (`CO__*`), selector cache |
| `alarms` | Periodic tasks: profile cache flusher, connection-graph walker, hash-version check |
| `system.display` | Popup/window centering (cosmetic) |

## Host permissions

| Origin | Purpose |
|---|---|
| `https://contactout.com/` | API egress (`linkedin/profiles/upload`, `linkedin/profile/secr`, …), login callback |
| `https://*.linkedin.com/` | Content scripts, cookie reads, interceptor injection |
| `https://github.com/` | Profile-page email harvesting + `REVEAL_GITHUB` |

## Optional (runtime-requested)

| Permission | Trigger |
|---|---|
| `tabs` | Needed to enumerate/open/close background scraping tabs |
| `*://*/*` (host) | **"ContactOut Anywhere"** — email/phone regex on any site the user enables |
| `https://*.salesforce.com/*`, `*.lightning.force.com/*` | Salesforce CRM save integration |
| (declared in code) `https://mail.google.com/*` | Gmail AI writer feature |

## Blast-radius assessment

- **Cookies**: minimal & audited. No read path for banking/mail/other-site cookies.
- **The `*://*/*` optional host is the widest grant** — once a user enables ContactOut Anywhere, `parseEmailsFromPage` / `parsePhonesFromPage` run regex extraction over arbitrary page DOM and text ([06](06-contact-acquisition.md)).
- **`scripting` + LinkedIn host** = arbitrary script in LinkedIn origin context (same-origin as your session). This is the enabler for the API-tapping interceptor — the same capability a session hijacker would want, used here *in-situ* for scraping rather than exfiltrating the session itself.
- No `webRequest`/`declarativeNetRequest` permission — interception is done **in-page** (XHR/fetch prototype hooks injected by the real interceptor), which is why `interceptor.js` needs `document_start` and `scripting`.

## Chrome Web Store surface vs. reality

The store card says "read and change your data on linkedin.com, contactout.com, github.com" — accurate but benign-sounding. The functional truth: *read* is a full-profile DOM+API scrape with server-directed gating; the only "change" observed is UI injection (sidebar/iframes) and AI-writer assistance.
