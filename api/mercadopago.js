const { sql } = require("@vercel/postgres");

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://divinodivino.com.ar";
const WEB3FORMS_KEY =
  process.env.WEB3FORMS_ACCESS_KEY || "79647389-1e07-49c9-b7cc-7a4a64acfb94";

const PLANS = {
  web: {
    reason: "Web Dominio + Hosting — DIVINO DIVINO",
    amount: "15.000 ARS / mes",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 15000,
      currency_id: "ARS",
    },
  },
  hosting: {
    reason: "Solo Hosting — DIVINO DIVINO",
    amount: "10.000 ARS / mes",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: 10000,
      currency_id: "ARS",
    },
  },
};

function json(res, status, obj) {
  res.status(status).json(obj);
}

async function saveSubscription({ name, email, domain, phone, mpId, amount }) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT NOT NULL,
        domain TEXT,
        phone TEXT,
        mp_subscription_id TEXT,
        status TEXT DEFAULT 'pending',
        amount TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    await sql`
      INSERT INTO subscriptions (name, email, domain, phone, mp_subscription_id, status, amount)
      VALUES (${name || null}, ${email}, ${domain || null}, ${phone || null}, ${mpId}, 'pending', ${amount})
    `;
  } catch (e) {
    console.error("[mercadopago] error guardando en DB:", e);
  }
}

async function notifyByEmail({ name, email, domain, phone, mpId, planName, amount }) {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `Nueva suscripción — ${planName}`,
        from_name: "DIVINO DIVINO — Suscripciones",
        name: name || "",
        email,
        domain: domain || "",
        whatsapp: phone || "",
        mp_subscription_id: mpId,
        message:
          `Nueva suscripción al plan ${planName}.\n\n` +
          `Nombre: ${name || "-"}\n` +
          `Email: ${email}\n` +
          `Dominio deseado: ${domain || "-"}\n` +
          `WhatsApp: ${phone || "-"}\n` +
          `ID suscripción Mercado Pago: ${mpId}\n` +
          `Monto: ${amount}`,
      }),
    });
  } catch (e) {
    console.error("[mercadopago] error enviando email:", e);
  }
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Método no permitido" });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return json(res, 500, { error: "Falta configurar MERCADOPAGO_ACCESS_TOKEN" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return json(res, 400, { error: "Body inválido" });
  }

  const email = String((body && body.email) || "").trim().toLowerCase();
  const name = String((body && body.name) || "").trim().slice(0, 200);
  const domain = String((body && body.domain) || "").trim().slice(0, 200);
  const phone = String((body && body.phone) || "").trim().slice(0, 100);
  const planKey = String((body && body.plan) || "").trim().toLowerCase();

  const plan = PLANS[planKey] || PLANS.web;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(res, 400, { error: "Email inválido" });
  }

  const reason = name ? `${plan.reason} — ${name}` : plan.reason;

  const payload = {
    reason,
    auto_recurring: plan.auto_recurring,
    payer_email: email,
    back_url: `${SITE_URL}/care-form.html?plan=${planKey || "web"}&region=ar`,
    external_reference: `${planKey || "web"}-${Date.now()}`,
    status: "pending",
  };

  let data;
  try {
    const mpResp = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    data = await mpResp.json();
  } catch (e) {
    return json(res, 500, { error: "Error interno", detail: e.message });
  }

  if (!data || !data.init_point) {
    return json(res, 400, {
      error: "No se pudo crear la suscripción",
      detail: data,
    });
  }

  const mpId = data.id;

  await Promise.allSettled([
    saveSubscription({ name, email, domain, phone, mpId, amount: plan.amount }),
    notifyByEmail({ name, email, domain, phone, mpId, planName: plan.reason, amount: plan.amount }),
  ]);

  return json(res, 200, { init_point: data.init_point, id: mpId });
}
