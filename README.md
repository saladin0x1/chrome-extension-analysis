# ContactOut Chrome Extension — Reverse Engineering

Static analysis of **"Email Finder by ContactOut – Email Lookup Tool"** (Chrome Web Store ID: `jjdemeiffadmmjhkbbpglgnlgeafomjo`), version **5.18.3**, Manifest V3.

> ⚖️ Research intent: transparency into the extension's permission model, network behavior, and data-collection pipeline. No full vendor code is republished — only small annotated excerpts (`evidence/`) supporting each finding.

## Executive summary

| Question | Verdict | Evidence |
|---|---|---|
| Steals your LinkedIn session cookie (`li_at`)? | **No** — read locally, only a 32-bit hash is kept; raw value never transmitted | [docs/03](docs/03-credential-handling.md) |
| Captures passwords / keystrokes? | **No capture path found** (login-page scripts only do session/logout detection) | [docs/03](docs/03-credential-handling.md) |
| Scrapes profiles you visit? | **Yes** — full Voyager profile JSON + entire page HTML (zipped) uploaded | [docs/04](docs/04-data-collection-pipeline.md) |
| Scrapes people you didn't visit? | **Yes** — "also viewed", "people you may know", recommendations sidebars | [docs/04](docs/04-data-collection-pipeline.md) |
| Server-directed harvesting? | **Yes** — server returns 1/0 "do I want this URL's data" before each upload | [docs/04](docs/04-data-collection-pipeline.md) |
| Taps LinkedIn internal APIs? | **Yes** — hooks `voyager`, `sales-api`, `talent` XHR responses incl. `phoneNumbers` | [docs/06](docs/06-contact-acquisition.md) |
| Harvests your connection graph? | **Yes** — periodic walks, 1st-degree URL reporting, background tab automation | [docs/04](docs/04-data-collection-pipeline.md) |
| Regex-scrapes emails/phones from arbitrary sites? | **Yes** — via optional `*://*/*` ("ContactOut Anywhere") | [docs/06](docs/06-contact-acquisition.md) |

**Bottom line:** not credential malware — a **distributed scraping network**. Each installed browser becomes a harvesting node; the user's own LinkedIn browsing (and their connections' contact cards) feed ContactOut's central database, which is then sold back per-reveal via separate email/phone/AI credit wallets. The ToS/ban risk lands on the *user's* LinkedIn account, not on ContactOut.

## How phone numbers are obtained (the interesting bit)

Phones can't be guessed like emails (`first.last@company.com` + SMTP verification). Every phone in the database was **visible to someone at least once**:

1. **Sales Navigator / Recruiter API tapping** — seat-entitled responses contain `contactInfo.phoneNumbers[].number`
2. **`tel:` link scraping** from the LinkedIn "Contact info" popup (1st-degree visibility)
3. **Phone regex over any page text**, incl. `.ci-phone` selectors and arbitrary websites
4. **GitHub profile harvesting** (dedicated host permission)

Aggregated server-side, keyed by member ID/URN → sold to any other user on "reveal".

## Repository layout

```
├── docs/               Numbered findings (read in order)
│   ├── 00-executive-summary.md
│   ├── 01-surface-and-manifest.md       Entry points, injection matrix
│   ├── 02-permission-model.md           Required/optional grants, blast radius
│   ├── 03-credential-handling.md        li_at / JSESSIONID lifecycle
│   ├── 04-data-collection-pipeline.md   Scrape → cache → server-gated upload
│   ├── 05-network-endpoints.md          Full egress map
│   └── 06-contact-acquisition.md        Email vs phone acquisition asymmetry
├── evidence/
│   ├── manifest.json                    Verbatim, factual API surface
│   └── snippets/                        Annotated minified fragments w/ offsets
├── tools/
│   ├── download_crx.py                  Fetch + strip CRX3 header
│   └── grep_context.py                  Regex context extraction over bundles
├── REPRODUCING.md                       Methodology, commands
└── .gitignore                           Excludes vendor CRX/bundles
```

## Method & scope

- Static analysis of the store-signed CRX3 (verified_contents present); no deobfuscation beyond reading webpack-bundled minified ES5.
- Every claim is tied to a snippet with **source file + byte offset** (e.g. `content_script.js @1448099`).
- Not covered: server-side behavior beyond what the client reveals, mixpanel/GA payloads (telemetry only), Sentry crash reporting.

## Legal notice

Analysis performed on a publicly downloadable artifact for interoperability/security-research understanding. All trademarks belong to their owners. This repo is not affiliated with ContactOut.
