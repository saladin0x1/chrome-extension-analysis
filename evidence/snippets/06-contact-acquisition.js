// Evidence 06 — contact acquisition: seat-entitled contactInfo, tel:/mailto:,
//               and page-wide regex harvesters
// Sources: app/content_script.js @668078-668229 (Sales Nav contactInfo parser),
//          @567355 (contactDetails tel:/mailto: scraper),
//          app/background.js @18364+ (parseEmailsFromPage / parsePhonesFromPage)
// Reformatted; identifiers & string literals verbatim.

// --- 1. Sales Navigator profile: contactInfo straight from seat-entitled JSON
const i = () => {                       // find SSR profile block
  let e = null; const stripTags = /(<([^>]+)>)/gi;
  t.querySelectorAll("code[id^=bpr-guid-]").forEach(el => {
    let r = {}; try { r = JSON.parse(el.innerHTML.replace(stripTags, "")); }
    catch (t) { return; }
    if (r.objectUrn) { e = r; return false; }
  });
  return e;
};

const r = t => {                        // t = parsed profile JSON
  const e = { emails: [], phones: [], twitter: [], websites: [] };
  const n = t.contactInfo;
  if (n) {
    const t = n.emails;
    if (t) for (const n of t) n.emailAddress && e.emails.push(n.emailAddress);
    const i = n.socialHandles;
    if (i) for (const t of i) "TWITTER" === t.type && t.name && e.twitter.push(t.name);
    const r = n.phoneNumbers;
    if (r) for (const t of r) t.number && e.phones.push(t.number);   // ← PHONE
    const M = n.websites;
    if (M) for (const t of M) t.url && e.websites.push(t.url);
  }
  return e;
};

// --- 2. Contact-info popup: tel:/mailto: link harvesting -------------------
const { contactDetails: T } = extractHTMLElements(D[0], { contactDetails: u });
T.forEach(el => {
  const href = el.getAttribute("href");
  checkIsTwitterLink(href) ? h.push(default("1", href))
    : 0 === href.indexOf("tel:")    ? y.push(href.substring(4))     // phone
    : 0 === href.indexOf("mailto:") ? f.push(href.substring(7))     // email
    : I.push(href);
});
Object.assign({}, d, { company: j, email: f, phone: y, twitter: h, websites: I.join(", ") });

// --- 3. Page-wide regex (LinkedIn pages and, via ContactOut Anywhere, ANY site)
parseEmailsFromPage = html => {
  let t = html.match(/\b[a-z0-9._]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi); t || (t = []);
  for (const e of parseElementList(
        document.querySelectorAll(".ci-email .pv-contact-info__contact-link")))
    if (!startWith("admin@", e) && !startWith("support@", e)) t.push(e);
  return Array.from(new Set(t));
};

parsePhonesFromPage = html => {
  // strip URLs first so domains don't read as numbers
  const t = html.replace(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b
                          ([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g, "")
                .match(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}
                        [-.\s]?\d{1,4}[-.\s]?\d{1,9}/g);        t || (t = []);
  for (const e of parseElementList(
        document.querySelectorAll(".ci-phone .pv-contact-info__contact-link"))) t.push(e);
  const n = Array.from(new Set(t));
  const yearRange = /19[4-9][0-9]-20[0-2][0-9]/;                // filter "1998-2020"
  const r = [];
  for (const e of n) (e.length < 7 || yearRange.test(e)) || r.push(e);
  return r;
};
