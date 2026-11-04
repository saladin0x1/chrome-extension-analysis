# 00 — Executive summary

**Target:** Email Finder by ContactOut – Email Lookup Tool
**Store ID:** `jjdemeiffadmmjhkbbpglgnlgeafomjo` · **Version:** 5.18.3 · **MV3** · ~877 KB CRX

## What it is

A commercial LinkedIn email/phone "enrichment" tool. Free-tier users get a number of *reveal credits*; in exchange, every user's browser participates in harvesting profile data for ContactOut's central database.

## Threat-model answer sheet

### "Does it leech my credentials?"

**No.** The `cookies` permission is used to read exactly two cookies on `https://www.linkedin.com`:

- `li_at` (session token) — used **only** for local logout detection; a 32-bit `simpleHash()` is stored in `chrome.storage.local`; the raw value never appears in any network call (all call sites audited — see [03](03-credential-handling.md)).
- `JSESSIONID` — checked for presence only (logout-by-URL detection).

No password field capture, no keystroke logging, no form submission hooks, no cookie exfiltration, no access to non-LinkedIn/GitHub/contactout.com cookies (host permissions are scoped).

### "Then what is it?"

A **distributed scraping proxy**. Your browser:

1. Uploads every LinkedIn profile you visit — structured Voyager JSON *and* the entire page HTML (LZ-compressed + base64).
2. Harvests people you didn't visit ("also viewed", PYMK, recommendations).
3. Asks the server *per-URL* whether it wants a page's data (`PROFILE_UPLOAD_CHECK`) → server-directed fleet harvesting.
4. Periodically walks your connections list and reports 1st-degree profile URLs.
5. Opens profile tabs in the background, scrapes, closes them (`REQUEST_INDIVIDUAL_OPENED_PROFILE_PAGE_DATA` + `CLOSE_TABS_BY_ID`).
6. Taps LinkedIn's internal APIs (`voyager`, `sales-api`, `talent`) including seat-entitled contact info.
7. Optionally regex-scrapes emails/phones from **any website** ("ContactOut Anywhere", `*://*/*`).

The aggregation of (1)–(7) across all users, keyed by member URN, is the product. Phones cannot be guessed like emails — they exist in the database only because some entitled user's screen displayed them once ([06](06-contact-acquisition.md)).

## Risk allocation

| Party | Bears the risk |
|---|---|
| Extension user | LinkedIn ToS violation / account restriction (scraping originates from their session) |
| Profile subjects | Contact info exposure beyond intended audience (sold per-reveal) |
| ContactOut | Essentially none — requests are first-party user traffic |

## Confidence

High. Static analysis of the full store-signed bundle; all claims anchored to byte-offset snippets in `evidence/`. Not verified: server-side matching logic, email pattern-guessing (industry-standard inference, implied by "75% of LinkedIn" claim, not observable client-side).
