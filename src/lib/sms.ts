/**
 * Twilio SMS — sends order confirmation via Twilio REST API.
 * No SDK dependency; uses fetch directly to keep bundle small.
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
const TWILIO_FROM = process.env.TWILIO_FROM_NUMBER;

/**
 * Format a Mongolian phone number to E.164 (+976XXXXXXXX).
 * Handles: 88029180, 80029180, +97688029180, 976-8802-9180, etc.
 */
export function formatMongolianPhone(phone: string): string | null {
  // Strip everything except digits and leading +
  const cleaned = phone.replace(/[^\d+]/g, "");

  // Already in E.164
  if (/^\+976\d{8}$/.test(cleaned)) return cleaned;

  // Has country code without +
  if (/^976\d{8}$/.test(cleaned)) return `+${cleaned}`;

  // 8-digit local number
  if (/^\d{8}$/.test(cleaned)) return `+976${cleaned}`;

  return null; // Unrecognizable format
}

function getTwilioAuthHeader(): string | null {
  if (TWILIO_API_KEY_SID && TWILIO_API_KEY_SECRET) {
    const credentials = Buffer.from(
      `${TWILIO_API_KEY_SID}:${TWILIO_API_KEY_SECRET}`
    ).toString("base64");
    return `Basic ${credentials}`;
  }

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    const credentials = Buffer.from(
      `${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`
    ).toString("base64");
    return `Basic ${credentials}`;
  }

  return null;
}

interface OrderSmsData {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: string;
}

export async function sendOrderSms(data: OrderSmsData): Promise<void> {
  const authHeader = getTwilioAuthHeader();
  if (!TWILIO_ACCOUNT_SID || !authHeader || !TWILIO_FROM) {
    console.log("Twilio not configured, skipping SMS for order", data.orderNumber);
    return;
  }

  const to = formatMongolianPhone(data.customerPhone);
  if (!to) {
    console.warn("Invalid phone number for SMS:", data.customerPhone);
    return;
  }

  const body = [
    `Munsel.mn`,
    `#${data.orderNumber} захиалгын төлбөр баталгаажлаа.`,
    `Нийт төлбөр: ${data.total}`,
    `Таны захиалга боловсруулалтад шилжлээ.`,
  ].join("\n");

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_FROM,
        Body: body,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Twilio SMS error:", res.status, err);
    }
  } catch (error) {
    console.error("Failed to send SMS for order", data.orderNumber, error);
    // Non-blocking: SMS failure should not break the payment flow
  }
}
