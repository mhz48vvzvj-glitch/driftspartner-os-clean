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

async function refreshMicrosoftToken(connection, { tenantId, clientId, clientSecret, serviceKey, supabaseUrl }) {
  if (connection.access_token && connection.expires_at && new Date(connection.expires_at).getTime() > Date.now() + 120000) {
    return connection.access_token;
  }
  if (!connection.refresh_token) throw new Error("Microsoft-kontoen må kobles på nytt.");
  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
      scope: "offline_access User.Read Mail.Send Calendars.ReadWrite"
    })
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(data?.error_description || data?.error || "Kunne ikke fornye Microsoft-tilgang.");
  const expiresAt = new Date(Date.now() + Number(data.expires_in || 3600) * 1000).toISOString();
  await supabaseFetch(`/rest/v1/microsoft_connections?id=eq.${connection.id}`, {
    method: "PATCH",
    serviceKey,
    supabaseUrl,
    body: {
      access_token: data.access_token,
      refresh_token: data.refresh_token || connection.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    }
  });
  return data.access_token;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { ok: false, message: "Method not allowed. Use POST." });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!supabaseUrl || !serviceKey || !clientId || !clientSecret) {
    return json(200, { ok: false, message: "Microsoft 365 er ikke ferdig satt opp i Netlify." });
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
    const recipients = Array.isArray(payload.to) ? payload.to : String(payload.to || "").split(/[,\n;]/);
    const to = [...new Set(recipients.map((x) => String(x || "").trim()).filter((x) => x.includes("@")))];
    if (!to.length || !payload.subject || !payload.message) {
      return json(400, { ok: false, message: "Mangler mottaker, emne eller melding." });
    }

    let connections = [];
    if (propertyId) {
      connections = await supabaseFetch(`/rest/v1/microsoft_connections?auth_user_id=eq.${authUser.id}&property_id=eq.${encodeURIComponent(propertyId)}&select=*`, { serviceKey, supabaseUrl });
    }
    if (!connections.length) {
      connections = await supabaseFetch(`/rest/v1/microsoft_connections?auth_user_id=eq.${authUser.id}&select=*`, { serviceKey, supabaseUrl });
    }
    const connection = connections?.[0];
    if (!connection) return json(403, { ok: false, message: "Denne brukeren har ikke koblet Microsoft 365 ennå." });

    const accessToken = await refreshMicrosoftToken(connection, { tenantId, clientId, clientSecret, serviceKey, supabaseUrl });
    const graphRes = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: {
          subject: payload.subject,
          body: { contentType: "Text", content: payload.message },
          toRecipients: to.map((address) => ({ emailAddress: { address } }))
        },
        saveToSentItems: true
      })
    });
    const graphData = graphRes.status === 202 ? null : await readJson(graphRes);
    if (!graphRes.ok) throw new Error(graphData?.error?.message || "Microsoft avviste e-posten.");

    return json(200, {
      ok: true,
      from: connection.email,
      to,
      message: "E-post sendt via tilkoblet Microsoft 365-konto."
    });
  } catch (error) {
    return json(500, { ok: false, message: error.message });
  }
};
