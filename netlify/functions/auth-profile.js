const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "POST, OPTIONS"
  },
  body: JSON.stringify(body)
});

const cleanEmail = (email) => String(email || "").trim().toLowerCase();

async function supabaseFetch(path, { method = "GET", body, serviceKey, supabaseUrl, headers = {} }) {
  const res = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(data?.message || data?.error || text || `HTTP ${res.status}`);
  return data;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { ok: false, message: "Method not allowed. Use POST." });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return json(200, { ok: false, message: "Netlify mangler SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY." });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { ok: false, message: "Mangler innloggingstoken." });

    const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, authorization: `Bearer ${token}` }
    });
    const authUser = await authRes.json();
    if (!authRes.ok || !authUser?.id) return json(401, { ok: false, message: "Kunne ikke verifisere Supabase-bruker." });

    const email = cleanEmail(authUser.email);
    let profiles = await supabaseFetch(`/rest/v1/app_users?auth_user_id=eq.${authUser.id}&select=*`, { serviceKey, supabaseUrl });
    let profile = profiles?.[0];

    if (!profile && email) {
      profiles = await supabaseFetch(`/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&select=*`, { serviceKey, supabaseUrl });
      profile = profiles?.[0];
      if (profile && !profile.auth_user_id) {
        const updated = await supabaseFetch(`/rest/v1/app_users?id=eq.${profile.id}&select=*`, {
          method: "PATCH",
          serviceKey,
          supabaseUrl,
          headers: { Prefer: "return=representation" },
          body: { auth_user_id: authUser.id }
        });
        profile = updated?.[0] || profile;
      }
    }

    if (!profile && email === "post@driftspartnernord.no") {
      const created = await supabaseFetch("/rest/v1/app_users?select=*", {
        method: "POST",
        serviceKey,
        supabaseUrl,
        headers: { Prefer: "return=representation" },
        body: { auth_user_id: authUser.id, name: "Driftspartner Nord", email, role: "superadmin", phone: "" }
      });
      profile = created?.[0];
    }

    if (!profile) return json(404, { ok: false, message: "Innlogging OK, men brukeren mangler app-profil." });

    let properties = [];
    if (String(profile.role || "").toLowerCase() === "superadmin") {
      properties = await supabaseFetch("/rest/v1/properties?select=*,customers(name)&order=name.asc&limit=200", { serviceKey, supabaseUrl });
    } else {
      const access = await supabaseFetch(`/rest/v1/property_access?user_id=eq.${profile.id}&select=access_role,properties(*,customers(name))`, { serviceKey, supabaseUrl });
      properties = (access || []).map((row) => row.properties ? { ...row.properties, access_role: row.access_role } : null).filter(Boolean);
    }

    return json(200, { ok: true, profile, properties });
  } catch (error) {
    return json(500, { ok: false, message: error.message });
  }
};
