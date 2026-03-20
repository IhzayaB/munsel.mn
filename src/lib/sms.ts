/**
 * SMS service using MessagePro.mn API
 * Sign up at https://messagepro.mn to get API credentials
 *
 * Set env vars:
 *   MESSAGEPRO_API_KEY=your_api_key_here
 *   MESSAGEPRO_FROM=Pajama (sender name, max 11 chars)
 */

interface SendSmsOptions {
  to: string; // e.g. "99111234" or "+97699111234"
  message: string;
}

function formatPhone(phone: string): string {
  // Remove spaces, dashes, and +976 prefix → just 8 digits
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+976")) cleaned = cleaned.slice(4);
  if (cleaned.startsWith("976") && cleaned.length === 11)
    cleaned = cleaned.slice(3);
  return cleaned;
}

export async function sendSms({ to, message }: SendSmsOptions): Promise<void> {
  const apiKey = process.env.MESSAGEPRO_API_KEY;

  if (!apiKey) {
    console.log("MESSAGEPRO_API_KEY not set, skipping SMS to", to);
    return;
  }

  const phone = formatPhone(to);
  const from = process.env.MESSAGEPRO_FROM || "Pajama";

  try {
    const res = await fetch("https://api.messagepro.mn/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: phone,
        text: message,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("MessagePro SMS error:", res.status, body);
    } else {
      console.log("SMS sent to", phone);
    }
  } catch (error) {
    console.error("Failed to send SMS:", error);
  }
}

export function buildOrderConfirmationSms(
  orderNumber: string,
  total: string
): string {
  return `Pajama.mn: Таны #${orderNumber} захиалга амжилттай төлөгдлөө. Нийт: ${total}. Баярлалаа!`;
}
