// api/mercadopago.js
// Serverless function (Vercel) que crea una suscripción recurrente en Mercado Pago
// y devuelve el init_point para redirigir al checkout.
//
// Variables de entorno necesarias (Vercel > Project > Settings > Environment Variables):
//   MERCADOPAGO_ACCESS_TOKEN  -> token privado de la app de Mercado Pago (producción)
//   PUBLIC_SITE_URL           -> https://divinodivino.com.ar
//
// Flujo usado: "suscripción sin plan asociado / pago pendiente". Se crea con
// auto_recurring inline + status "pending" y Mercado Pago devuelve un init_point
// (checkout con redirect). Medios de pago disponibles en Argentina según la doc:
// dinero en cuenta, tarjeta de crédito o débito, línea de crédito, Rapipago y Pago Fácil.
// Recurrencia: cada mes se debita del medio guardado (dinero en cuenta y crédito se
// cobran solos; débito/medios offline quedan para el primer pago).

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://divinodivino.com.ar";

const PLAN = {
  reason: "Web Dominio + Hosting — DIVINO DIVINO",
  auto_recurring: {
    frequency: 1,
    frequency_type: "months",
    transaction_amount: 15000,
    currency_id: "ARS",
  },
};

function json(res, status, obj) {
  res.status(status).json(obj);
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

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(res, 400, { error: "Email inválido" });
  }

  const reason = name
    ? `${PLAN.reason} — ${name}`
    : PLAN.reason;

  const payload = {
    reason,
    auto_recurring: PLAN.auto_recurring,
    payer_email: email,
    back_url: `${SITE_URL}/care-form.html?plan=web&region=ar`,
    external_reference: `web-${Date.now()}`,
    status: "pending",
  };

  try {
    const mpResp = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await mpResp.json();

    if (data && data.init_point) {
      return json(res, 200, { init_point: data.init_point, id: data.id });
    }

    return json(res, 400, {
      error: "No se pudo crear la suscripción",
      detail: data,
    });
  } catch (e) {
    return json(res, 500, { error: "Error interno", detail: e.message });
  }
};
