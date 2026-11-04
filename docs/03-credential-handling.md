# 03 — Credential handling

**Question answered:** "does it just leech the credentials?"

## Cookie reads (complete audit)

Exactly one module reads cookies — `getCsrfToken` / `getLinkedinSessionToken` (`background.js` @99692, `content_script.js` twin):

```js
getCsrfToken = async () =>
  cookies.get("https://www.linkedin.com", cacheProfiles.cookieKeyCsrfToken /* JSESSIONID */)

getLinkedinSessionToken = async () =>
  cookies.get("https://www.linkedin.com", cacheProfiles.cookieKeyLedinSession /* li_at */)
```

Every call site of both functions (verified across all 15 bundles):

### Site 1 — `detectLogout` (background.js @98895)

```js
const stored  = storage.get(keys.linkedinHashedCookie)      // previous hash
const token   = await getLinkedinSessionToken()             // li_at (raw, local only)
const hash    = simpleHash(token)
const loggedIn = !!token
if ((stored && !loggedIn) || (stored && loggedIn && stored !== hash))
    webRequest("extension/lid", { pageContent: "", event: "logout" })   // ← only this leaves
if (stored !== hash)
    storage.set({ [linkedinHashedCookie]: hash })           // hash stays local
```

### Site 2 — `detectLogoutByUrl` (background.js @98750)

```js
const session = await getLinkedinSessionToken()
const csrf    = await getCsrfToken()
if (!session || !csrf)
    webRequest("extension/lid", { pageContent: e, url: t, event: "logout_url" })
```

⚠️ Note: when cookies are *absent*, the **page content** (HTML) of the URL is shipped to `extension/lid`. This fires on login/authwall/challenge pages (that's what `linkedin_logout.js`/`linkedin_detect.js` detect). Login forms' static HTML goes up — but **submitted values do not** (the scripts run at `document_end` of the *login page itself*, before/at submission, and only serialize the DOM; no `input`/`password` value readers exist anywhere in the bundles — verified by symbol search).

### `simpleHash` — not a real hash, but not exfiltrated either (background.js @21806)

```js
simpleHash = s => { let h = 0; for (c of s) { h = (h << 5) - h + c.charCodeAt(0); h &= h } return h }
```

Java `String.hashCode()` — 32-bit, collision-trivial, reversible-by-search *for short inputs*. Moot: the hash never leaves `chrome.storage.local` (only the boolean-ish "logout" event is sent).

## What is NOT present

- No `document.cookie` reads in content scripts (beyond in-page defaults the page itself uses).
- No form/submit/password input hooks (`grep -i password` hits are all UI strings: "show password" on their own options page, Greenhouse/Salesforce OAuth flows).
- No `li_at` in any `webRequest` payload, header, or query string (all `webRequest` payloads enumerated in [05](05-network-endpoints.md)).
- No exfiltration to third-party hosts — egress is contactout.com only (plus GA/Mixpanel/Sentry telemetry, [05](05-network-endpoints.md)).

## Login-page content scripts (`linkedin_logout.js`, all_frames)

Runs on `/uas/login*`, `/checkpoint/*`, `/authwall`. Function: hash-compare logout detection + `logout_url` reporting (Site 2 above). It also relays the ContactOut *user's own* session state (`CO__linkedin-user-details-flag`) so the extension can show "connected as". Nothing captures credentials.

## Conclusion

The session cookie is a **local session-state oracle**, not a exfiltration target. The valuable asset being "leech[ed]" is not the user's credentials — it's the user's **authenticated viewpoint** on everyone else's data. See [04](04-data-collection-pipeline.md).
