# 01 — Attack surface & manifest anatomy

Source: `evidence/manifest.json` (verbatim). 39 files; JS bundles are webpack-minified ES5 (readable after formatting).

## Entry-point matrix

| Context | Files | Injected on | Run at |
|---|---|---|---|
| Content script (stub) | `interceptor.js` | `*.linkedin.com/in/*`, `/sales*`, `/talent*` | **`document_start`** |
| Content script (main bundle, 1.4 MB) | `content_script.js` | `*.linkedin.com/*`, `github.com` (root only) | `document_start` |
| Content script | `linkedin_company.js` | `/company/*` (all 3 LinkedIn flavors) | `document_end` |
| Content script | `linkedin_detect.js` | `/checkpoint/*` | `document_end` |
| Content script | `linkedin_id_detect.js` (89 KB) | `*.linkedin.com/*` | `document_end` |
| Content script | `linkedin_logout.js` | login/authwall/checkpoint URLs | `document_end`, **`all_frames`** |
| Content script | `contactout.js` | `contactout.com/*` | `document_end` |
| Content script | `auth_callback.js` | `contactout.com/login/callback*` | `document_end` |
| Service worker (module) | `background.js` (106 KB) | — | — |
| Options page | `options.js` | — | — |
| Popup | `app.html` | — | — |

## Notable structural facts

1. **`interceptor.js` is a decoy-sized stub** (15 KB). Its only real statement: `runtime.sendMessage({command: INJECT_INTERCEPTOR})` — the actual network interceptor is injected later via `chrome.scripting` (`SAVE_LINKEDIN_SEARCH_RESULTS` / `INJECT_INTERCEPTOR` handling in `background.js`).
2. **`linkedin_logout.js` runs in all frames of login pages** — audited: it performs logout/session-state detection only, no input capture ([03](03-credential-handling.md)).
3. **`externally_connectable: contactout.com`** — the website can message the extension (used by the OAuth-style `/login/callback` flow; token exchange endpoint `/api/auth/token`).
4. **CSP**: `sandbox allow-scripts; script-src 'self'; object-src 'self'` — no remote code, no `eval`. Self-contained.
5. **GitHub injection is narrow**: `exclude_matches` covers `github.com/*/*`, i.e. only top-level/profile-ish pages — consistent with harvesting *user profile* contact info rather than repos.

## Bundle layout (by size)

```
content_script.js        1,477,699 B   main UI + scraping logic (all sites)
main.js                    614,152 B   sidebar app
linkedin_id_detect.js       89,458 B   identity/connection-graph walker
linkedin_company.js         76,444 B   company pages
contactout.js               77,751 B   first-party site bridge
background.js              106,485 B   service worker: upload router, cookies, alarms
co_anywhere_introduction.js 20,628 B
interceptor.js              15,044 B   stub → triggers real interceptor injection
linkedin_detect.js          13,017 B   checkpoint/challenge pages
linkedin_logout.js          12,408 B   login/logout state (all_frames)
auth_callback.js            11,954 B   login callback
options.js                  12,231 B
permissions.js               2,080 B
mp.js                          646 B   mixpanel shim
```

Shared webpack modules are duplicated across bundles (constants module `n(0)` appears in every file) — useful for cross-referencing: a symbol found in `background.js` can usually be located at a nearby offset in `content_script.js`.
