// Evidence 04 — profile extraction & upload staging
// Source: app/content_script.js @607580 (uploadProfiles/fullProfile),
//         @624075 (cachePageHtml), @18620 (cleanDomAndZip / extractJsonFromPage)
// Reformatted; identifiers & string literals verbatim.

// full profile from SSR Voyager payload embedded in the page
e.fullProfile = t => {
  try {
    const n = extractJsonFromPage(t);                       // code#bpr-guid-*
    const i = n.included ? n.included.filter(t => {
      const e = t.$type.split(".").pop();
      return "Geo" === e || "Education" === e || "Position" === e ||
             "PositionGroup" === e || "Profile" === e || "Skill" === e ||
             "Company" === e || "School" === e;
    }) : [];
    i.push({ connectionsCount: getConnectionsCount(t), followersCount: getFollowersCount(t) });
    i.push({ influencer: isProfileInfluencer(t), premium: isProfilePremium(t),
             jobSeeker: isProfileJobSeeker(t) });
    return i;
  } catch (t) { captureException(t); }
};

e.uploadProfiles = async t => {                              // t = document
  const n = fullProfile(t);
  const i = [...alsoViewedProfiles(t),
             ...peopleYouMayKnowProfiles(t),
             ...recommendationsProfiles(t)];                 // ← people never clicked
  const r = [];
  n && r.push({ data: n, type: "json_reg_pro_full" });
  i.length > 0 && r.push({ data: i, type: "json_reg_pro_mini" });
  r.length > 0 && cacheProfiles(getPageUrl(t.location), JSON.stringify(r));
};

// whole-page HTML upload (type "pv_rc")
e.cachePageHtml = () => {
  const t = document.querySelector(".logos");
  if (!t) return;
  if (t.textContent.indexOf("Lite") > 0) return;             // skip Recruiter Lite?
  cacheProfile(getPageUrl(document.location),
               cleanDomAndZip(document.querySelector("html")), "pv_rc");
};

// helpers
e.extractJsonFromPage = t => {
  const e = t.querySelectorAll("code[id^='bpr-guid-']");
  return e.length ? JSON.parse(e[e.length - 1].textContent) : [];
};

e.cleanDomAndZip = t => {
  try {
    const kill = "script,style,meta,svgs";
    while (t.querySelectorAll(kill).length) {
      const n = t.querySelector(kill); n && n.parentNode.removeChild(n);
    }
    return lz.compressToBase64(new XMLSerializer().serializeToString(t));
  } catch (t) { return ""; }
};
