const json = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "POST, OPTIONS"
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(204, { ok: true });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, message: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM ||
    process.env.EMAIL_FROM ||
    `Driftspartner OS <${process.env.ADMIN_EMAIL || "post@driftspartnernord.no"}>`;

  if (!apiKey) {
    return json(200, {
      ok: false,
      mode: "log_only",
      missing: "RESEND_API_KEY",
      message: "RESEND_API_KEY mangler i Netlify. E-post ble ikke sendt, men kan logges i appen."
    });
  }

  try {
    const payload = JSON.parse(event.body || "{}");
    const recipients = Array.isArray(payload.to)
      ? payload.to
      : String(payload.to || "")
          .split(/[,\n;]/)
          .map((email) => email.trim())
          .filter(Boolean);
    const uniqueRecipients = [...new Set(recipients)].filter((email) => email.includes("@"));

    if (!uniqueRecipients.length || !payload.subject || !payload.message) {
      return json(400, {
        ok: false,
        message: "Mangler gyldig mottaker, emne eller melding."
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: uniqueRecipients,
        subject: payload.subject,
        text: payload.message,
        tags: [
          { name: "kind", value: String(payload.kind || "general").slice(0, 50) },
          { name: "property", value: String(payload.property || "unknown").slice(0, 50) }
        ]
      })
    });

    const data = await res.json();
    return json(res.ok ? 200 : 502, {
      ok: res.ok,
      id: data?.id,
      from,
      to: uniqueRecipients,
      resend_status: res.status,
      message: res.ok ? "E-post sendt via Resend." : (data?.message || data?.error || "Resend avviste sendingen."),
      data
    });
  } catch (error) {
    return json(500, { ok: false, message: error.message });
  }
};
