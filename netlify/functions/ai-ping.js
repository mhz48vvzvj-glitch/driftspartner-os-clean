exports.handler = async () => ({
  statusCode: 200,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*"
  },
  body: JSON.stringify({
    ok: true,
    service: "Driftspartner OS AI",
    has_openai_key: Boolean(process.env.OPENAI_API_KEY),
    has_supabase_url: Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
    has_service_role: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY),
    model: process.env.OPENAI_MODEL || "gpt-5.4-nano",
    monthly_limits: {
      start: Number(process.env.AI_MONTHLY_LIMIT_START || 50),
      pro: Number(process.env.AI_MONTHLY_LIMIT_PRO || 250),
      premium: Number(process.env.AI_MONTHLY_LIMIT_PREMIUM || 1000)
    },
    time: new Date().toISOString()
  })
});
