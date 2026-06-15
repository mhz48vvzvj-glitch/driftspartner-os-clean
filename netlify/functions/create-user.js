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
const randomPassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#%";
  return Array.from({ length: 18 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
};

async function supabaseFetch(path, { method = "GET", body, serviceKey, supabaseUrl, extraHeaders = {} }) {
  const res = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      ...extraHeaders
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const message = data?.message || data?.error_description || data?.error || text || `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data;
}

async function upsertAppUserProfile({ supabaseUrl, serviceKey, authUserId, name, email, phone, role }) {
  const baseBody = {
    auth_user_id: authUserId,
    name,
    email,
    phone,
    role,
    status: "active"
  };
  const request = (body) => supabaseFetch("/rest/v1/app_users?on_conflict=email&select=id", {
    method: "POST",
    serviceKey,
    supabaseUrl,
    extraHeaders: {
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body
  });
  try {
    return await request(baseBody);
  } catch (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("column") && message.includes("status")) {
      const fallbackBody = { ...baseBody };
      delete fallbackBody.status;
      return request(fallbackBody);
    }
    if (message.includes("invalid input value for enum") || message.includes("app_role")) {
      throw new Error("Rollefeltet i app_users er laast som enum. Kjor driftspartner-live-users-roles.sql slik at rollene superadmin, styreleder, styremedlem, beboer, vaktmester og leverandor kan brukes.");
    }
    throw error;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { ok: false, message: "Method not allowed. Use POST." });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return json(200, {
      ok: false,
      mode: "missing_config",
      missing: !supabaseUrl ? "SUPABASE_URL" : "SUPABASE_SERVICE_ROLE_KEY",
      message: "Netlify mangler Supabase servernøkkel. Legg SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY i Netlify Functions environment."
    });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || "";
    const callerToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!callerToken) return json(401, { ok: false, message: "Mangler innlogget bruker-token." });

    const caller = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: serviceKey, authorization: `Bearer ${callerToken}` }
    });
    const callerUser = await caller.json();
    if (!caller.ok || !callerUser?.id) return json(401, { ok: false, message: "Kunne ikke verifisere innlogget bruker." });

    const callerProfiles = await supabaseFetch(
      `/rest/v1/app_users?auth_user_id=eq.${callerUser.id}&select=id,role,email`,
      { serviceKey, supabaseUrl }
    );
    const callerProfile = callerProfiles?.[0];
    if (callerProfile?.role !== "superadmin") {
      return json(403, { ok: false, message: "Bare superadmin kan opprette brukere." });
    }

    const payload = JSON.parse(event.body || "{}");
    const email = cleanEmail(payload.email);
    const name = String(payload.name || "").trim();
    const role = String(payload.role || "beboer").trim();
    const phone = String(payload.phone || "").trim();
    const propertyId = String(payload.property_id || "").trim();
    const accessRole = String(payload.access_role || "member").trim();
    const password = String(payload.password || "").trim() || randomPassword();

    if (!email.includes("@") || !name || !propertyId) {
      return json(400, { ok: false, message: "Mangler navn, e-post eller eiendom." });
    }

    let authUser;
    try {
      authUser = await supabaseFetch("/auth/v1/admin/users", {
        method: "POST",
        serviceKey,
        supabaseUrl,
        body: {
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role, phone }
        }
      });
    } catch (error) {
      if (!String(error.message || "").toLowerCase().includes("already")) throw error;
      const users = await supabaseFetch(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
        serviceKey,
        supabaseUrl
      });
      authUser = Array.isArray(users?.users) ? users.users.find((u) => cleanEmail(u.email) === email) : null;
      if (!authUser) throw new Error("Brukeren finnes fra før, men kunne ikke hentes.");
    }

    const authUserId = authUser.id;
    const appProfiles = await upsertAppUserProfile({ supabaseUrl, serviceKey, authUserId, name, email, phone, role });

    const appUser = appProfiles?.[0];
    if (!appUser?.id) throw new Error("Auth-bruker ble laget, men app_users-profil mangler.");

    await supabaseFetch("/rest/v1/property_access?on_conflict=property_id,user_id", {
      method: "POST",
      serviceKey,
      supabaseUrl,
      extraHeaders: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: {
        property_id: propertyId,
        user_id: appUser.id,
        access_role: accessRole
      }
    });

    return json(200, {
      ok: true,
      message: "Bruker opprettet og koblet til eiendom.",
      user: {
        id: appUser.id,
        auth_user_id: authUserId,
        name,
        email,
        phone,
        role,
        property_id: propertyId,
        access_role: accessRole
      },
      temporaryPassword: payload.password ? undefined : password
    });
  } catch (error) {
    return json(500, { ok: false, message: error.message });
  }
};
