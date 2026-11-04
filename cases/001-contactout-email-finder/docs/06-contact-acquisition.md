# 06 — Contact acquisition: email vs. phone

The asymmetry explains the whole product:

- **Emails** can be *inferred*: `first.last@company.com` pattern mining + silent SMTP verification, server-side. (Implied by the "75% of LinkedIn" claim; not observable client-side.)
- **Phone numbers cannot be guessed.** Every phone in the database was **rendered on some entitled screen at least once.** Hence separate `phoneCredit` wallet ([04](04-data-collection-pipeline.md) Stage D).

## Phone/email harvest paths (all verified in bundle)

### 1. Seat-entitled API tapping — the big one (content_script.js @668078–668229)

Sales Navigator profile parser:

```js
// i(): find code#bpr-guid-* block whose JSON has objectUrn  ← the profile's SSR payload
// r(t): extract contact info
const { contactInfo: n } = t
n.emails        → e.emails.push(emailAddress)
n.socialHandles → TWITTER → handle
n.phoneNumbers  → e.phones.push(number)        // ← direct from seat-entitled API response
n.websites      → url
```

The `UrlWatchers` interceptor ([04](04-data-collection-pipeline.md) A4) applies equivalent handlers to `salesApiPeopleSearch`, `salesApiLeadSearch`, `salesApiProfiles`, `talentProfiles`, `talentHiringCandidates`, `talentRecruiterSearchHits` — i.e. **search-result bulk**, not just opened profiles. Any ContactOut user holding a Sales Nav / Recruiter seat exposes every lead they search to ContactOut's DB.

### 2. Contact-info popup scraping (@567355)

```js
{ contactDetails: T } = extractHTMLElements(...)
T.forEach(el => {
  href = el.getAttribute("href")
  if (href.startsWith("tel:"))    phone.push(href.substring(4))     // ← tel: links
  if (href.startsWith("mailto:")) email.push(href.substring(7))
  if (isTwitter(href))            twitter.push(href)
  else websites.push(href)
})
```

Fires on the "Contact info" modal (`.topcard-condensed__contact-info` also scraped as text). This modal is where 1st-degree connections see the phone a member entered "for connections".

### 3. Page-wide regex — any page (background.js @18364+)

```js
parseEmailsFromPage(html):
  /\b[a-z0-9._]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi
  + querySelectorAll(".ci-email .pv-contact-info__contact-link")   // LinkedIn contact card

parsePhonesFromPage(html):                                          // urls stripped first
  /\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g
  + querySelectorAll(".ci-phone .pv-contact-info__contact-link")
  filter: length ≥ 7, not year-range (19xx–20xx)
```

With **ContactOut Anywhere** (`*://*/*` optional host) this runs on arbitrary sites: staff directories, personal homepages, "contact us" pages. The `.ci-*` selectors are literally LinkedIn's contact-card classes.

### 4. GitHub (dedicated host permission, see [01](01-surface-and-manifest.md))

Root/profile pages only (`github.com/*/*` excluded → no repos). Devs' public emails; `REVEAL_GITHUB`/`ENCRYPTED_GITHUB` commands mirror the LinkedIn reveal flow.

## Aggregation → sale

All harvests merge server-side keyed by member URN / vanity / normalized name ([05](05-network-endpoints.md) "Identity keys"). Then:

```
user A (recruiter, Sales Nav)  ──sees phone once──▶  upload
user B (stranger, months later) ──"reveal" (phoneCredit--)──▶ phone
```

**Operational definition of "publicly available"** in this model: *visible to the single most-privileged viewer who ever loaded that profile while running the extension.* The subject's own audience choice is not consulted.

## Additional enrichment (inference, outside client code)

Industry-standard for this product category: data-broker datasets, breach-derived lists, cross-social matching. Not provable from the extension bundle; flagged as such.
