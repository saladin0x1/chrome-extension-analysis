// ═══════════════════════════════════════════════════════════════════════════════
// CASE 001 · VERDICT — "crowd-leech database", assembled from the bundle as-shipped
// ═══════════════════════════════════════════════════════════════════════════════
//
// CLASSIFICATION : Grayware / surveillance-adjacent — DISTRIBUTED SCRAPING NODE
// NOT            : Classic credential-stealing malware (session cookie `li_at` is
//                  read locally, hashed, and never exfiltrated — see snippet 03)
// NET EFFECT     : Every installed browser harvests data it is entitled to see,
//                  uploads it to a central DB on the server's say-so, and that DB
//                  is sold back per-reveal. The user IS the scraper.
//
// The entire business loop, verbatim identifiers, one chain:
// ───────────────────────────────────────────────────────────────────────────────

// 1. HARVEST — you view a profile; the whole DOM ships (zipped), not just "email"
cachePageHtml = () =>
  cacheProfile(getPageUrl(document.location),
               cleanDomAndZip(document.querySelector("html")),   // ← the entire page
               "pv_rc");

// 2. HARVEST — people you never clicked also ship
uploadProfiles = async (doc) => {
  const minis = [ ...alsoViewedProfiles(doc),
                  ...peopleYouMayKnowProfiles(doc),
                  ...recommendationsProfiles(doc) ];             // ← bystanders
  cacheProfiles(getPageUrl(doc.location), JSON.stringify([
    { data: fullProfile(doc), type: "json_reg_pro_full" },
    { data: minis,            type: "json_reg_pro_mini" } ]));
};

// 3. HARVEST — phone numbers, straight out of seat-entitled API responses
const n = t.contactInfo;
if (n) for (const p of n.phoneNumbers) p.number && e.phones.push(p.number);

// 4. GATE — the SERVER decides, per URL, whether it wants this page's data
cacheProfiles = async (url, profiles) => {
  if (1 === (await runtime.sendMessage(
      { command: PROFILE_UPLOAD_CHECK, url })).data)            // ← server: "yes, feed me"
    runtime.sendMessage({ command: UPLOAD_PROFILES, url, profiles });
};
// background.js: webRequest("linkedin/profile/secr", { t: "pc", p: url }) → 1/0
//               webRequest("linkedin/profiles/upload", e)               → the DB

// 5. SELL BACK — other users buy what the crowd leeched, on separate meters
setCredits = async (t) => {
  r.credit      = t.email ?? r.credit;      // email reveals
  r.phoneCredit = t.phone  ?? r.phoneCredit; // phone reveals  ← scarcer, pricier
  r.aiCredit    = t.ai     ?? r.aiCredit;    // AI generations
};
//
// ───────────────────────────────────────────────────────────────────────────────
// VERDICT: A phone number in this product's database is a phone number that was
// visible to exactly ONE entitled user, exactly ONCE. The extension converts its
// user base into an unattributable harvesting fleet; ToS/ban risk falls on the
// user, privacy harm falls on profile subjects, and ContactOut holds the asset.
// Malicious in effect — leech, not leet.
// ═══════════════════════════════════════════════════════════════════════════════
