# 04 — Data collection pipeline

The core business loop: every browser is a node; the server aggregates by LinkedIn identity.

## Stage A — In-page extraction (content_script.js)

### A1. Structured profile JSON — `fullProfile()` (@607580)

```js
fullProfile = (doc) => {
  const n = extractJsonFromPage(doc)              // code#bpr-guid-* SSR blocks
  const included = n.included.filter(t => type ∈ {
    Geo, Education, Position, PositionGroup, Profile, Skill, Company, School })
  included.push({ connectionsCount, followersCount })
  included.push({ influencer, premium, jobSeeker })
  return included
}
```

`extractJsonFromPage` parses LinkedIn's server-side-rendered Voyager payloads embedded in `<code id="bpr-guid-*">` elements — the same data the profile API returns.

### A2. Non-visited people — `uploadProfiles()` (@607580)

```js
uploadProfiles = async (doc) => {
  const full = fullProfile(doc)
  const minis = [ ...alsoViewedProfiles(doc),
                  ...peopleYouMayKnowProfiles(doc),
                  ...recommendationsProfiles(doc) ]
  r.push({ data: full,  type: "json_reg_pro_full" })
  r.push({ data: minis, type: "json_reg_pro_mini" })   // ← people you never clicked
  cacheProfiles(getPageUrl(doc.location), JSON.stringify(r))
}
```

### A3. Whole-page HTML — `cachePageHtml()` (@624075)

```js
cachePageHtml = () => {
  ...
  cacheProfile(url, cleanDomAndZip(document.querySelector("html")), "pv_rc")
}
cleanDomAndZip = (el) => lz.compressToBase64(XMLSerializer.serializeToString(
  el after removing script,style,meta,svgs))
```

The **entire DOM** of the page you're viewing — including any contact-info blocks rendered for your eyes — is serialized, stripped of scripts, compressed and queued for upload with type `pv_rc`.

### A4. Network interception — the real interceptor (UrlWatchers @1448099)

XHR/fetch responses on watched LinkedIn-internal endpoints are parsed by dedicated handlers (see [06](06-contact-acquisition.md) for the contact-info handler). Watch list:

```
voyager/api/identity/dash/profiles
sales-api/salesApiPeopleSearch     sales-api/salesApiLeadSearch
sales-api/salesApiProfiles         sales-api/salesApiCompanies
talent/search/api/talentRecruiterSearchHits
talent/api/talentHiringCandidates  talent/api/talentProfiles
```

## Stage B — Server-gated upload (background.js upload router @94888)

```js
case PROFILE_UPLOAD_CHECK: return await webRequest("linkedin/profile/secr", {t:"pc", p:url})
case UPLOAD_PROFILES:      webRequest("linkedin/profiles/upload", e)
case PRO_PRE (cacheProfile): webRequest("linkedin/profile/secr", {t:"pc", p:url}, cb =>
                              cb || webRequest("linkedin/profile/pre", e))   // type prefix j_/l_/pv
```

Flow:

```
page scrape → cacheProfile/cacheProfiles
  → PROFILE_UPLOAD_CHECK(secr {t:"pc", p:url})   ← server answers 1/0 per URL
  → if 1 → UPLOAD_PROFILES → linkedin/profiles/upload
  → if 0 → linkedin/profile/pre (page-view telemetry: server still learns who you view)
```

**Implication:** the server can aim the fleet. A paying customer's search queue can de-prioritize/prioritize which URLs "check" returns 1 for — harvesting is demand-driven, not incidental.

## Stage C — Connection graph (linkedin_id_detect.js + alarms)

Config (`cacheProfiles`, @31285 in content_script.js):

```json
{
  "intervalProfile": 20000,                      // page scrape cadence (ms)
  "runTaskInterval": 2,                          // minutes: task loop
  "intervalCheckConnectsProfiles": 0.5,          // minutes: connections check
  "intervalFirstDegreeConnectionCount": 30,      // minutes: 1st-degree count
  "saveProfileUploadStateInterval": 30,          // minutes
  "pageProfileCount": 40,                        // profiles per connections page
  "pageStorageKey": "bcolp"
}
```

Plus:

- `postFirstDegreeProfileUrl()` — every 1st-degree profile URL you visit is reported (checks `.dist-value == "1st"` via `detectIfProfilePageIsFirstDegree`).
- `REQUEST_INDIVIDUAL_OPENED_PROFILE_PAGE_DATA` + `CLOSE_TABS_BY_ID` — background tabs: open profile → scrape → close. Indistinguishable from you browsing, at LinkedIn's rate limits.
- State keys `CO__linkedin-connection-{scrape,count,ping}-state` persist progress between sessions.

## Stage D — Anywhere scraping (optional `*://*/*`)

On sites the user enables: `parseEmailsFromPage` / `parsePhonesFromPage` (see [06](06-contact-acquisition.md)) + `GET_PROFILE_USING_SEARCH` server lookups keyed on page context.

## What the user gets back

`REVEAL_PROFILE` / `ENCRYPTED_GITHUB`: server matches identity → returns previously aggregated contact data, gated by separate credit wallets (`credit` email / `phoneCredit` phone / `aiCredit` AI) — `setCredits` in user module (@58608). The credit separation itself is evidence that phone data is scarcer and sourced differently from email.
