const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "GET, OPTIONS"
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, { ok: true });
  if (event.httpMethod !== "GET") return json(405, { ok: false, message: "Method not allowed. Use GET." });

  const status = {
    ok: true,
    service: "Driftspartner OS Penneo",
    selected_provider: "penneo",
    has_client_id: Boolean(process.env.PENNEO_CLIENT_ID),
    has_client_secret: Boolean(process.env.PENNEO_CLIENT_SECRET),
    has_api_base_url: Boolean(process.env.PENNEO_API_BASE_URL),
    has_webhook_secret: Boolean(process.env.PENNEO_WEBHOOK_SECRET),
    time: new Date().toISOString()
  };

  status.ready = status.has_client_id && status.has_client_secret && status.has_api_base_url && status.has_webhook_secret;
  status.message = status.ready
    ? "Penneo-miljøvariabler er lagt inn. API-kobling kan aktiveres."
    : "Penneo er valgt, men API-nøkler mangler fortsatt.";

  return json(200, status);
};
