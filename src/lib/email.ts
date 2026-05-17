import { Resend } from "resend";
import { ADMIN_RECOVERY_EMAIL } from "@/lib/password-reset";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

type EmailSendResult =
  | { success: true; id?: string }
  | { success: false; error: unknown };

interface BaseEmailPayload {
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

async function sendWithResend(
  payload: BaseEmailPayload,
  logContext: string
): Promise<EmailSendResult> {
  const resend = getResendClient();
  if (!resend) {
    const error = "RESEND_API_KEY not configured";
    console.log(`${error}, skipping ${logContext}`);
    return { success: false, error };
  }

  try {
    const result = await resend.emails.send(payload);
    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error(`Failed to send ${logContext}:`, error);
    return { success: false, error };
  }
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    size?: string | null;
  }>;
  total: string;
  shippingAddress: string;
  city: string;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name}${item.size ? ` (${item.size})` : ""}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.price}₮</td>
        </tr>`
    )
    .join("");

  return sendWithResend(
    {
      from: "Munsel.mn <orders@munsel.mn>",
      to: data.customerEmail,
      subject: `Захиалга баталгаажлаа #${data.orderNumber}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5fafa">
          <div style="text-align:center;padding:20px 0">
            <img src="${process.env.NEXT_PUBLIC_SITE_URL || 'https://munsel.mn'}/logo.jpg" alt="Munsel.mn" width="60" height="60" style="border-radius:50%" />
            <h1 style="color:#C6973F;margin:10px 0 0;font-size:24px">Munsel.mn</h1>
          </div>
          
          <div style="background:#ffffff;border-radius:12px;padding:24px;margin:16px 0">
            <h2 style="color:#2c3e3f;margin-top:0;font-size:20px">✅ Захиалга баталгаажлаа!</h2>
            <p style="color:#666;font-size:15px">Сайн байна уу, ${data.customerName}!</p>
            <p style="color:#666;font-size:15px">Таны <strong style="color:#2c3e3f">#${data.orderNumber}</strong> захиалга амжилттай төлөгдлөө.</p>
            
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <thead>
                <tr style="background:#e4f1f2">
                  <th style="padding:10px;text-align:left;font-size:13px;color:#666">Бүтээгдэхүүн</th>
                  <th style="padding:10px;text-align:center;font-size:13px;color:#666">Тоо</th>
                  <th style="padding:10px;text-align:right;font-size:13px;color:#666">Үнэ</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px 10px;font-weight:bold;font-size:16px;border-top:2px solid #cde0e1">Нийт</td>
                  <td style="padding:12px 10px;text-align:right;font-weight:bold;font-size:16px;color:#C6973F;border-top:2px solid #E8D5A3">${data.total}</td>
                </tr>
              </tfoot>
            </table>

            <div style="background:#e4f1f2;border-radius:8px;padding:14px;margin-top:12px">
              <p style="margin:0;font-size:13px;color:#666">
                <strong style="color:#2c3e3f">Хүргэлтийн хаяг:</strong><br/>
                ${data.shippingAddress}${data.city ? `, ${data.city}` : ""}
              </p>
            </div>
          </div>

          <p style="text-align:center;color:#9a9a9a;font-size:12px;margin-top:24px">
            Асуух зүйл байвал +976 8802-9180 дугаарт холбогдоно уу.<br/>
            © ${new Date().getFullYear()} Munsel.mn
          </p>
        </div>
      `,
    },
    `order confirmation email for order ${data.orderNumber}`
  );
}

export async function sendAdminPasswordResetEmail(data: { resetUrl: string }) {
  return sendWithResend(
    {
      from: "Munsel.mn <orders@munsel.mn>",
      to: ADMIN_RECOVERY_EMAIL,
      subject: "Munsel.mn admin password reset",
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5fafa">
          <div style="background:#ffffff;border-radius:12px;padding:24px;margin:16px 0">
            <h2 style="color:#2c3e3f;margin-top:0;font-size:20px">Admin password reset</h2>
            <p style="color:#666;font-size:15px">A password reset was requested for the admin login <strong>admin@munsel.mn</strong>.</p>
            <p style="color:#666;font-size:15px">Use the link below to set a new password. This link expires in 30 minutes.</p>
            <p style="margin:24px 0">
              <a href="${data.resetUrl}" style="display:inline-block;background:#C6973F;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600">Reset admin password</a>
            </p>
            <p style="color:#999;font-size:13px;word-break:break-all">${data.resetUrl}</p>
          </div>
        </div>
      `,
    },
    "admin password reset email"
  );
}

interface InfoEmailData {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendInfoEmail(data: InfoEmailData) {
  return sendWithResend(
    {
      from: "Munsel.mn Info <info@munsel.mn>",
      to: data.to,
      subject: data.subject,
      html: data.html,
      replyTo: data.replyTo,
    },
    `info email to ${data.to}`
  );
}

interface BulkInfoEmailInput {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendInfoEmails(data: BulkInfoEmailInput) {
  const uniqueRecipients = Array.from(
    new Set(data.to.map((email) => email.trim()).filter(Boolean))
  );

  const results = await Promise.all(
    uniqueRecipients.map((recipient) =>
      sendInfoEmail({
        to: recipient,
        subject: data.subject,
        html: data.html,
        replyTo: data.replyTo,
      }).then((result) => ({ recipient, ...result }))
    )
  );

  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;

  return {
    success: failed === 0,
    sent,
    failed,
    total: results.length,
    results,
  };
}
