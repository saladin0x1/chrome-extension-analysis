// Evidence 02 — UrlWatchers: LinkedIn internal APIs tapped by the injected interceptor
// Source: app/content_script.js @1448099 (verbatim identifiers)

e.UrlWatchers = [
  { url: "voyager/api/identity/dash/profiles",        handler: u.default },
  { url: "sales-api/salesApiPeopleSearch",            handler: c.default },
  { url: "sales-api/salesApiLeadSearch",              handler: c.default },
  { url: "sales-api/salesApiProfiles",                handler: s.default },
  { url: "sales-api/salesApiCompanies",               handler: a.default },
  { url: "talent/search/api/talentRecruiterSearchHits", handler: o.default },
  { url: "talent/api/talentHiringCandidates",         handler: M.default },
  { url: "talent/api/talentProfiles",                 handler: r.default },
];

function N() { return e.UrlWatchers.map(t => t.url); }   // getWatchListUrls
e.getInterceptorHandlerByUrl = function (t) { /* match url → handler */ };
