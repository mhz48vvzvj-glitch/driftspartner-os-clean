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

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const templateLabels = {
  demo: "Demoforespørsel",
  purchase: "Bestilling",
  deviation: "Avvik",
  workorder: "Arbeidsordre",
  quote: "Tilbudsforespørsel",
  board: "Styresak",
  contract: "Kontrakt",
  resident: "Beboer",
  general: "Melding"
};

function emailHtml({ subject, message, kind, property, caseId }) {
  const label = templateLabels[kind] || templateLabels.general;
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  const meta = [
    property ? ["Eiendom", property] : null,
    caseId ? ["Sak", caseId] : null,
    ["Type", label]
  ].filter(Boolean);

  return `<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f7fb;color:#172033;font-family:Arial,Helvetica,sans-serif;line-height:1.55"><div style="max-width:680px;margin:28px auto;background:#fff;border:1px solid #d8e0eb;border-radius:16px;overflow:hidden;box-shadow:0 18px 50px rgba(19,31,55,.10)"><div style="background:linear-gradient(135deg,#07111f,#124cff);color:#fff;padding:28px 32px"><div style="font-size:12px;color:#bcd0ee;font-weight:800;text-transform:uppercase;letter-spacing:.10em">Driftspartner OS · ${escapeHtml(label)}</div><h1 style="margin:9px 0 0;font-size:26px;line-height:1.18">${escapeHtml(subject)}</h1></div><div style="padding:26px 32px">${meta.length ? `<table style="width:100%;border-collapse:collapse;margin:0 0 22px">${meta.map(([key,value]) => `<tr><td style="width:150px;border-bottom:1px solid #e6edf5;padding:10px 8px;color:#64748b;font-weight:800">${escapeHtml(key)}</td><td style="border-bottom:1px solid #e6edf5;padding:10px 8px">${escapeHtml(value)}</td></tr>`).join("")}</table>` : ""}<div style="font-size:15px;color:#26384f">${safeMessage}</div><div style="margin-top:24px;background:#eef5ff;border-left:4px solid #176bff;padding:14px 16px;border-radius:10px;color:#26384f">Denne e-posten er sendt fra Driftspartner OS.</div></div><div style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e6edf5;color:#6c7b91;font-size:13px">Driftspartner Nord · post@driftspartnernord.no</div></div></body></html>`;
}

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

    const kind = String(payload.kind || "general").slice(0, 50);
    const property = String(payload.property || "").slice(0, 100);
    const caseId = String(payload.caseId || payload.case_id || "").slice(0, 100);
    const replyTo = String(payload.reply_to || payload.replyTo || "").trim();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: uniqueRecipients,
        reply_to: replyTo && replyTo.includes("@") ? replyTo : undefined,
        subject: payload.subject,
        text: payload.message,
        html: emailHtml({
          subject: payload.subject,
          message: payload.message,
          kind,
          property,
          caseId
        }),
        tags: [
          { name: "kind", value: kind },
          { name: "property", value: property || "unknown" }
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
