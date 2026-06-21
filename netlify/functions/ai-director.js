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

function compactRows(rows, fields, limit = 20) {
  return (rows || []).slice(0, limit).map((row) => {
    const out = {};
    fields.forEach((field) => {
      if (row[field] !== undefined && row[field] !== null && row[field] !== "") out[field] = row[field];
    });
    return out;
  });
}

function outputText(data) {
  if (data?.output_text) return data.output_text;
  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && content?.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function envInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizePlan(value) {
  const plan = String(value || "").trim().toLowerCase();
  if (plan.includes("premium")) return "premium";
  if (plan.includes("start")) return "start";
  return "pro";
}

function limitForPlan(plan, property) {
  const explicit = Number(property?.ai_monthly_limit);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  const limits = {
    start: envInt("AI_MONTHLY_LIMIT_START", 50),
    pro: envInt("AI_MONTHLY_LIMIT_PRO", 150),
    premium: envInt("AI_MONTHLY_LIMIT_PREMIUM", 500)
  };
  return limits[plan] ?? limits.pro;
}

function monthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString();
}

function estimateTokens(text) {
  return Math.ceil(String(text || "").length / 4);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, { ok: true });
  if (event.httpMethod !== "POST") return json(405, { ok: false, message: "Method not allowed. Use POST." });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-5.4-nano";

  if (!supabaseUrl || !serviceKey) {
    return json(200, { ok: false, message: "Netlify mangler SUPABASE_URL eller SUPABASE_SERVICE_ROLE_KEY." });
  }
  if (!openaiKey) {
    return json(200, { ok: false, message: "Netlify mangler OPENAI_API_KEY. Legg den inn under Environment variables." });
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json(401, { ok: false, message: "Mangler innloggingstoken." });

    const payload = JSON.parse(event.body || "{}");
    const propertyId = String(payload.property_id || "").trim();
    const question = String(payload.question || "Hva bør prioriteres nå?").trim().slice(0, 600);
    const mode = String(payload.mode || "prioritering").trim().slice(0, 80);
    if (!propertyId) return json(400, { ok: false, message: "Mangler valgt eiendom." });

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
    }
    if (!profile) return json(403, { ok: false, message: "Brukeren mangler app-profil." });

    const role = String(profile.role || "").toLowerCase();
    if (!role.includes("admin")) {
      const access = await supabaseFetch(`/rest/v1/property_access?user_id=eq.${profile.id}&property_id=eq.${propertyId}&select=id,access_role`, { serviceKey, supabaseUrl });
      if (!access?.length) return json(403, { ok: false, message: "Brukeren har ikke tilgang til valgt eiendom." });
    }

    const properties = await supabaseFetch(`/rest/v1/properties?id=eq.${propertyId}&select=*,customers(*)&limit=1`, { serviceKey, supabaseUrl });
    const property = properties?.[0];
    if (!property) return json(404, { ok: false, message: "Fant ikke valgt eiendom." });

    const plan = normalizePlan(property.subscription_plan || property.plan || property.package || property.customers?.subscription_plan || property.customers?.plan);
    const monthlyLimit = limitForPlan(plan, property);
    const usageRows = await supabaseFetch(
      `/rest/v1/ai_agent_runs?property_id=eq.${encodeURIComponent(propertyId)}&created_at=gte.${encodeURIComponent(monthStartIso())}&select=id`,
      { serviceKey, supabaseUrl }
    ).catch(() => []);
    const monthlyUsed = usageRows?.length || 0;
    if (monthlyLimit > 0 && monthlyUsed >= monthlyLimit && !role.includes("admin")) {
      return json(200, {
        ok: false,
        message: `AI-kvoten for denne eiendommen er brukt opp denne maneden (${monthlyUsed}/${monthlyLimit}). Oppgrader pakke eller ok kvoten.`,
        usage: { plan, monthly_used: monthlyUsed, monthly_limit: monthlyLimit }
      });
    }

    const enc = encodeURIComponent(propertyId);
    const [
      deviations,
      workOrders,
      documents,
      finance,
      budgetLines,
      projects,
      quoteRequests,
      offers,
      contacts,
      activity
    ] = await Promise.all([
      supabaseFetch(`/rest/v1/deviations?property_id=eq.${enc}&select=*&order=created_at.desc&limit=30`, { serviceKey, supabaseUrl }).catch(() => []),
      supabaseFetch(`/rest/v1/work_orders?property_id=eq.${enc}&select=*&order=created_at.desc&limit=30`, { serviceKey, supabaseUrl }).catch(() => []),
      supabaseFetch(`/rest/v1/documents?property_id=eq.${enc}&select=id,title,category,status,created_at,expires_at,notes&order=created_at.desc&limit=40`, { serviceKey, supabaseUrl }).catch(() => []),
      supabaseFetch(`/rest/v1/property_finance?property_id=eq.${enc}&select=*&limit=1`, { serviceKey, supabaseUrl }).catch(() => []),
      supabaseFetch(`/rest/v1/budget_lines?property_id=eq.${enc}&select=*&limit=40`, { serviceKey, supabaseUrl }).catch(() => []),
      supabaseFetch(`/rest/v1/projects?property_id=eq.${enc}&select=*&order=created_at.desc&limit=30`, { serviceKey, supabaseUrl }).catch(() => []),
      supabaseFetch(`/rest/v1/quote_requests?property_id=eq.${enc}&select=*&order=created_at.desc&limit=30`, { serviceKey, supabaseUrl }).catch(() => []),
      supabaseFetch(`/rest/v1/offers?property_id=eq.${enc}&select=*&order=created_at.desc&limit=30`, { serviceKey, supabaseUrl }).catch(() => []),
      supabaseFetch(`/rest/v1/property_contacts?property_id=eq.${enc}&select=*&limit=50`, { serviceKey, supabaseUrl }).catch(() => []),
      supabaseFetch(`/rest/v1/activity_log?property_id=eq.${enc}&select=*&order=created_at.desc&limit=30`, { serviceKey, supabaseUrl }).catch(() => [])
    ]);

    const context = {
      property: {
        id: property.id,
        name: property.name,
        customer: property.customers?.name,
        address: property.address,
        type: property.property_type,
        units_count: property.units_count,
        subscription_plan: plan,
        ai_monthly_used: monthlyUsed,
        ai_monthly_limit: monthlyLimit,
        technical_summary: property.technical_summary
      },
      counts: {
        deviations: deviations.length,
        work_orders: workOrders.length,
        documents: documents.length,
        projects: projects.length,
        quote_requests: quoteRequests.length,
        offers: offers.length,
        contacts: contacts.length
      },
      deviations: compactRows(deviations, ["id", "title", "category", "priority", "status", "created_at"], 12),
      work_orders: compactRows(workOrders, ["id", "title", "status", "due_date", "created_at"], 12),
      documents: compactRows(documents, ["title", "category", "status", "expires_at", "created_at"], 16),
      finance: compactRows(finance, ["bank_balance", "reserved_funds", "project_funds", "updated_at"], 1),
      budget_lines: compactRows(budgetLines, ["category", "label", "budget_amount", "actual_amount", "budget", "actual", "notes"], 20),
      projects: compactRows(projects, ["name", "title", "status", "budget", "budget_amount", "actual_cost", "actual_amount", "due_date"], 12),
      quote_requests: compactRows(quoteRequests, ["title", "status", "deadline", "created_at"], 12),
      offers: compactRows(offers, ["supplier_id", "price", "status", "reservations", "created_at"], 12),
      contacts: compactRows(contacts, ["name", "role", "contact_role", "contact_type", "email"], 20),
      activity: compactRows(activity, ["action", "entity_type", "created_at"], 15)
    };

    const instructions = [
      "Du er AI Director i Driftspartner OS for norske borettslag og sameier.",
      "Bruk kun dataene du får i denne forespørselen. Ikke finn på tall, dokumenter eller hendelser.",
      "Svar på norsk, kort og konkret.",
      "Gi styret praktiske anbefalinger med begrunnelse og neste handling.",
      "Marker usikkerhet når data mangler.",
      "AI-svar er veiledende og ikke juridisk, teknisk eller økonomisk rådgivning."
    ].join("\n");

    const input = [
      `Modus: ${mode}`,
      `Spørsmål: ${question}`,
      "Live eiendomsdata:",
      JSON.stringify(context, null, 2),
      "Svar med denne strukturen:",
      "1. Kort status",
      "2. Topp 3 prioriteringer",
      "3. Risiko/mangler",
      "4. Foreslatt neste handling",
      "5. Data som mangler"
    ].join("\n\n");

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${openaiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        instructions,
        input,
        max_output_tokens: envInt("AI_MAX_OUTPUT_TOKENS", 650),
        temperature: 0.2,
        store: false
      })
    });
    const aiData = await readJson(aiRes);
    if (!aiRes.ok) throw new Error(aiData?.error?.message || aiData?.message || "OpenAI svarte ikke riktig.");
    const answer = outputText(aiData);
    const usageEstimate = {
      input_tokens_estimate: estimateTokens(input + instructions),
      output_tokens_estimate: estimateTokens(answer),
      monthly_used_before: monthlyUsed,
      monthly_limit: monthlyLimit,
      plan
    };

    await supabaseFetch("/rest/v1/ai_agent_runs", {
      method: "POST",
      serviceKey,
      supabaseUrl,
      headers: { Prefer: "return=minimal" },
      body: {
        property_id: propertyId,
        agent: "AI Director",
        model,
        input: { mode, question },
        output: { answer },
        usage_estimate: usageEstimate,
        status: "completed"
      }
    }).catch(() => null);

    return json(200, {
      ok: true,
      answer,
      model,
      property: { id: property.id, name: property.name },
      usage: { plan, monthly_used: monthlyUsed + 1, monthly_limit: monthlyLimit }
    });
  } catch (error) {
    return json(500, { ok: false, message: error.message });
  }
};
