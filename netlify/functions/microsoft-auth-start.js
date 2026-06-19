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

async function readJson(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; }
  catch { return { raw: text }; }
}

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
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.message || data?.error || data?.raw || `HTTP ${res.status}`);
  return data;
}

function redirectUri(event) {
  if (process.env.MICROSOFT_REDIRECT_URI) return process.env.MICROSOFT_REDIRECT_URI;
  const proto = event.headers["x-forwarded-proto"] || "https";
  const host = event.headers.host;
  return `${proto}://${host}/.netlify/functions/microsoft-callback`;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { ok: false, message: "Method not allowed. Use POST." });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!supabaseUrl || !serviceKey || !clientId) {
    return json(200, { ok: false, message: "Netlify mangler Microsoft/Supabase miljøvariabler." });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { ok: false, message: "Mangler innloggingstoken." });

    const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, authorization: `Bearer ${token}` }
    });
    const authUser = await readJson(authRes);
    if (!authRes.ok || !authUser?.id) return json(401, { ok: false, message: "Kunne ikke verifisere bruker." });

    const payload = JSON.parse(event.body || "{}");
    const propertyId = String(payload.property_id || "").trim();
    const state = crypto.randomUUID();
    await supabaseFetch("/rest/v1/microsoft_oauth_states", {
      method: "POST",
      serviceKey,
      supabaseUrl,
      body: {
        state,
        auth_user_id: authUser.id,
        user_email: authUser.email || "",
        property_id: propertyId || null,
        created_at: new Date().toISOString()
      }
    });

    const url = new URL(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize`);
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri(event));
    url.searchParams.set("response_mode", "query");
    url.searchParams.set("scope", "offline_access User.Read Mail.Send Calendars.ReadWrite");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");

    return json(200, { ok: true, url: url.toString(), redirect_uri: redirectUri(event) });
  } catch (error) {
    return json(500, { ok: false, message: error.message });
  }
};
