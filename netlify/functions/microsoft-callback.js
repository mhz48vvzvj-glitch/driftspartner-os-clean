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

function html(title, message, ok = true) {
  const color = ok ? "#176bff" : "#c6283b";
  return {
    statusCode: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8" },
    body: `<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;background:#07111f;color:#f5f8ff;font-family:Arial,Helvetica,sans-serif"><main style="max-width:680px;margin:48px auto;background:#101b2d;border:1px solid #263850;border-radius:18px;padding:30px"><small style="color:#9cc5ff;text-transform:uppercase;font-weight:800">Driftspartner OS</small><h1>${title}</h1><p style="line-height:1.55;color:#c8d4e6">${message}</p><a style="display:inline-block;margin-top:18px;background:${color};color:white;text-decoration:none;padding:12px 16px;border-radius:10px;font-weight:800" href="/driftspartner-property-os.html">Tilbake til Driftspartner OS</a></main></body></html>`
  };
}

function redirectUri(event) {
  if (process.env.MICROSOFT_REDIRECT_URI) return process.env.MICROSOFT_REDIRECT_URI;
  const proto = event.headers["x-forwarded-proto"] || "https";
  const host = event.headers.host;
  return `${proto}://${host}/.netlify/functions/microsoft-callback`;
}

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!supabaseUrl || !serviceKey || !clientId || !clientSecret) {
    return html("Microsoft-kobling mangler", "Netlify mangler nødvendige Microsoft- eller Supabase-verdier.", false);
  }

  try {
    const params = event.queryStringParameters || {};
    if (params.error) return html("Microsoft-kobling feilet", params.error_description || params.error, false);
    const code = params.code;
    const state = params.state;
    if (!code || !state) return html("Microsoft-kobling feilet", "Mangler kode eller state fra Microsoft.", false);

    const states = await supabaseFetch(`/rest/v1/microsoft_oauth_states?state=eq.${encodeURIComponent(state)}&select=*`, {
      serviceKey,
      supabaseUrl
    });
    const pending = states?.[0];
    if (!pending) return html("Microsoft-kobling feilet", "Fant ikke ventende Microsoft-kobling. Prøv på nytt.", false);

    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri(event),
        scope: "offline_access User.Read Mail.Send Calendars.ReadWrite"
      })
    });
    const tokenData = await readJson(tokenRes);
    if (!tokenRes.ok) throw new Error(tokenData?.error_description || tokenData?.error || "Microsoft avviste tokenforespørselen.");

    const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { authorization: `Bearer ${tokenData.access_token}` }
    });
    const me = await readJson(meRes);
    if (!meRes.ok) throw new Error(me?.error?.message || "Kunne ikke hente Microsoft-bruker.");

    const expiresAt = new Date(Date.now() + Number(tokenData.expires_in || 3600) * 1000).toISOString();
    await supabaseFetch("/rest/v1/microsoft_connections?on_conflict=auth_user_id,property_id", {
      method: "POST",
      serviceKey,
      supabaseUrl,
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: {
        auth_user_id: pending.auth_user_id,
        property_id: pending.property_id,
        microsoft_user_id: me.id,
        email: me.mail || me.userPrincipalName || pending.user_email,
        display_name: me.displayName || "",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        scopes: tokenData.scope || "",
        updated_at: new Date().toISOString()
      }
    });
    await supabaseFetch(`/rest/v1/microsoft_oauth_states?state=eq.${encodeURIComponent(state)}`, {
      method: "DELETE",
      serviceKey,
      supabaseUrl
    });

    return html("Microsoft 365 er koblet til", `E-post og kalender kan nå sendes fra ${me.mail || me.userPrincipalName || "den tilkoblede Microsoft-kontoen"}.`);
  } catch (error) {
    return html("Microsoft-kobling feilet", error.message, false);
  }
};
