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
const normalizeRole = (role) => {
  const value = String(role || "beboer").trim().toLowerCase();
  if (value === "leverandør") return "leverandor";
  if (value === "caretaker") return "vaktmester";
  if (value === "resident") return "beboer";
  if (value === "vendor") return "leverandor";
  return value;
};
const allowedRoles = new Set(["superadmin", "admin", "forvalter", "styreleder", "styremedlem", "beboer", "vaktmester", "leverandor"]);
const randomPassword = () => {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#%";
  return Array.from({ length: 18 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
};
const roleLabel = (role) => ({
  superadmin: "Superadmin",
  admin: "Admin",
  forvalter: "Forvalter",
  styreleder: "Styreleder",
  styremedlem: "Styremedlem",
  beboer: "Beboer",
  vaktmester: "Vaktmester",
  leverandor: "Leverandør"
}[role] || role);
const appUrl = () => (process.env.APP_URL || process.env.URL || "https://fdv.driftspartnernord.no").replace(/\/$/, "") + "/driftspartner-property-os.html";

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
    if (message.includes("app_users_role_check") || (message.includes("check constraint") && message.includes("role"))) {
      throw new Error("Admin-rollen mangler i app_users-regelen. Kjør supabase-internal-admin-role-v1.sql i Supabase, og prøv igjen.");
    }
    if (message.includes("invalid input value for enum") || message.includes("app_role")) {
      throw new Error("Rollen finnes ikke i rollelisten i databasen. Kjør supabase-internal-admin-role-v1.sql i Supabase, og prøv igjen.");
    }
    throw error;
  }
}

async function restrictSinglePropertyAccess({ supabaseUrl, serviceKey, appUserId, propertyId, role }) {
  const portfolioRoles = new Set(["superadmin", "admin", "forvalter"]);
  if (portfolioRoles.has(role)) return;
  await supabaseFetch(`/rest/v1/property_access?user_id=eq.${appUserId}&property_id=neq.${propertyId}`, {
    method: "DELETE",
    serviceKey,
    supabaseUrl
  });
}

async function sendWelcomeEmail({ name, email, role, password }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Driftspartner Nord <post@driftspartnernord.no>";
  const adminEmail = process.env.ADMIN_EMAIL || "post@driftspartnernord.no";
  if (!apiKey) return { sent: false, message: "E-post er ikke konfigurert." };

  const loginUrl = appUrl();
  const subject = "Din bruker i Driftspartner OS";
  const text = [
    `Hei ${name},`,
    "",
    "Du har fått bruker i Driftspartner OS.",
    "",
    `Innlogging: ${loginUrl}`,
    `E-post: ${email}`,
    `Midlertidig passord: ${password}`,
    `Rolle: ${roleLabel(role)}`,
    "",
    "Logg inn og bytt passord ved første anledning.",
    "",
    "Vennlig hilsen",
    "Driftspartner Nord"
  ].join("\n");
  const html = `<!doctype html><html lang="no"><head><meta charset="utf-8"></head><body style="margin:0;background:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif"><div style="max-width:640px;margin:28px auto;background:#fff;border:1px solid #d8e0eb;border-radius:14px;overflow:hidden"><div style="background:#07111f;color:#fff;padding:26px 30px"><div style="font-size:13px;color:#9cc5ff;font-weight:700;text-transform:uppercase;letter-spacing:.08em">Driftspartner OS</div><h1 style="margin:8px 0 0;font-size:26px">Din bruker er opprettet</h1></div><div style="padding:26px 30px;line-height:1.55"><p>Hei ${name},</p><p>Du har fått bruker i Driftspartner OS.</p><table style="width:100%;border-collapse:collapse;margin:18px 0"><tr><td style="padding:10px;border-bottom:1px solid #e6edf5;color:#64748b;font-weight:700">Innlogging</td><td style="padding:10px;border-bottom:1px solid #e6edf5"><a href="${loginUrl}">${loginUrl}</a></td></tr><tr><td style="padding:10px;border-bottom:1px solid #e6edf5;color:#64748b;font-weight:700">E-post</td><td style="padding:10px;border-bottom:1px solid #e6edf5">${email}</td></tr><tr><td style="padding:10px;border-bottom:1px solid #e6edf5;color:#64748b;font-weight:700">Midlertidig passord</td><td style="padding:10px;border-bottom:1px solid #e6edf5"><strong>${password}</strong></td></tr><tr><td style="padding:10px;border-bottom:1px solid #e6edf5;color:#64748b;font-weight:700">Rolle</td><td style="padding:10px;border-bottom:1px solid #e6edf5">${roleLabel(role)}</td></tr></table><p style="background:#eef5ff;border-left:4px solid #176bff;padding:14px;border-radius:10px">Logg inn og bytt passord ved første anledning.</p><p>Vennlig hilsen<br>Driftspartner Nord</p></div></div></body></html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ from, to: [email], bcc: [adminEmail], subject, text, html })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { sent: false, message: data?.message || data?.error || "E-post ble ikke sendt." };
  return { sent: true, id: data?.id || null };
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
    const callerRole = String(callerProfile?.role || "").toLowerCase();
    if (!["superadmin", "admin"].includes(callerRole)) {
      return json(403, { ok: false, message: "Bare intern admin kan opprette brukere." });
    }

    const payload = JSON.parse(event.body || "{}");
    const email = cleanEmail(payload.email);
    const name = String(payload.name || "").trim();
    const role = normalizeRole(payload.role);
    const phone = String(payload.phone || "").trim();
    const propertyId = String(payload.property_id || "").trim();
    const accessRole = String(payload.access_role || "member").trim();
    const password = String(payload.password || "").trim() || randomPassword();
    const canCreateWithoutProperty = new Set(["superadmin", "admin", "forvalter"]).has(role);

    if (!email.includes("@") || !name || (!propertyId && !canCreateWithoutProperty)) {
      return json(400, { ok: false, message: "Mangler navn, e-post eller eiendom." });
    }
    if (!allowedRoles.has(role)) {
      return json(400, { ok: false, message: `Ugyldig rolle: ${role}. Velg en av rollene i listen.` });
    }
    if (callerRole !== "superadmin" && role === "superadmin") {
      return json(403, { ok: false, message: "Bare superadmin kan opprette eller endre superadmin-brukere." });
    }
    if (!propertyId && callerRole !== "superadmin") {
      return json(403, { ok: false, message: "Bare superadmin kan opprette intern innlogging uten eiendom." });
    }
    const existingProfiles = await supabaseFetch(`/rest/v1/app_users?email=eq.${encodeURIComponent(email)}&select=id,role,email`, {
      serviceKey,
      supabaseUrl
    });
    const existingProfile = existingProfiles?.[0];
    if (callerRole !== "superadmin" && String(existingProfile?.role || "").toLowerCase() === "superadmin") {
      return json(403, { ok: false, message: "Admin kan ikke endre superadmin-brukere." });
    }

    let authUser;
    let existingAuthUser = false;
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
      existingAuthUser = true;
      await supabaseFetch(`/auth/v1/admin/users/${authUser.id}`, {
        method: "PUT",
        serviceKey,
        supabaseUrl,
        body: {
          password,
          email_confirm: true,
          user_metadata: { name, role, phone }
        }
      });
    }

    const authUserId = authUser.id;
    const appProfiles = await upsertAppUserProfile({ supabaseUrl, serviceKey, authUserId, name, email, phone, role });

    const appUser = appProfiles?.[0];
    if (!appUser?.id) throw new Error("Auth-bruker ble laget, men app_users-profil mangler.");

    if (propertyId) {
      await restrictSinglePropertyAccess({ supabaseUrl, serviceKey, appUserId: appUser.id, propertyId, role });

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
    }

    const emailResult = await sendWelcomeEmail({ name, email, role, password });

    return json(200, {
      ok: true,
      message: emailResult.sent ? "Bruker opprettet og e-post sendt." : "Bruker opprettet, men e-post ble ikke sendt.",
      user: {
        id: appUser.id,
        auth_user_id: authUserId,
        name,
        email,
        phone,
        role,
        property_id: propertyId || null,
        access_role: accessRole
      },
      existing_auth_user: existingAuthUser,
      email_sent: emailResult.sent,
      email_message: emailResult.message,
      email_id: emailResult.id || null,
      temporaryPassword: password
    });
  } catch (error) {
    return json(500, { ok: false, message: error.message });
  }
};
