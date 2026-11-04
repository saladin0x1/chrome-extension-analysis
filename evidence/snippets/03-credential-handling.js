// Evidence 03 — credential handling: the ONLY cookie reads, and how values are used
// Source: app/background.js @99692 (definitions) and @98750/@98895 (usage)
// Reformatted; identifiers verbatim.

// --- definitions (module 362) ---------------------------------------------
t.getCsrfToken = async () =>
  await cookies.get("https://www.linkedin.com",
                    cacheProfiles.cookieKeyCsrfToken /* "JSESSIONID" */);

t.getLinkedinSessionToken = async () =>
  await cookies.get("https://www.linkedin.com",
                    cacheProfiles.cookieKeyLinkedinSession /* "li_at" */);

// --- usage 1: detectLogoutByUrl ------------------------------------------
t.detectLogoutByUrl = async (pageContent, url) => {
  const session = await getLinkedinSessionToken();   // li_at
  const csrf    = await getCsrfToken();              // JSESSIONID
  if (!session || !csrf)
    await webRequest("extension/lid",
                     { pageContent: pageContent, url: url, event: "logout_url" });
};

// --- usage 2: detectLogout (hash kept local; only event leaves) ----------
t.detectLogout = async () => {
  const t    = keys.linkedinHashedCookie;                    // "CO__linkedin-hashed-cookie"
  const prev = (await storage.get(t))?.[t];
  const tok  = await getLinkedinSessionToken();               // raw li_at, local only
  const h    = simpleHash(tok);
  const loggedIn = !!tok;
  if ((prev && !loggedIn) || (prev && loggedIn && prev !== h))
    await webRequest("extension/lid", { pageContent: "", event: "logout" });
  if (prev !== h)
    await storage.set({ [t]: h });
};

// --- simpleHash (Java String.hashCode, 32-bit) — background.js @21806 ----
t.simpleHash = s => {
  if (!s) return null;
  let h = 0;
  if (s.length === 0) return h;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h &= h; }
  return h;
};
// NOTE: hash never appears in any webRequest payload (see evidence/snippets/05, 06).
