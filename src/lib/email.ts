import { Resend } from "resend";

function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
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
  const resend = getResendClient();
  if (!resend) {
    console.log("RESEND_API_KEY not set, skipping email for order", data.orderNumber);
    return;
  }

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

  try {
    await resend.emails.send({
      from: "Pajama.mn <orders@pajama.mn>",
      to: data.customerEmail,
      subject: `Захиалга баталгаажлаа #${data.orderNumber}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#faf6f1">
          <div style="text-align:center;padding:20px 0">
            <img src="https://pajama-mn.vercel.app/logo.png" alt="Pajama.mn" width="60" height="60" style="border-radius:50%" />
            <h1 style="color:#6b8e68;margin:10px 0 0;font-size:24px">Pajama.mn</h1>
          </div>
          
          <div style="background:#ffffff;border-radius:12px;padding:24px;margin:16px 0">
            <h2 style="color:#3a3a3a;margin-top:0;font-size:20px">✅ Захиалга баталгаажлаа!</h2>
            <p style="color:#666;font-size:15px">Сайн байна уу, ${data.customerName}!</p>
            <p style="color:#666;font-size:15px">Таны <strong style="color:#3a3a3a">#${data.orderNumber}</strong> захиалга амжилттай төлөгдлөө.</p>
            
            <table style="width:100%;border-collapse:collapse;margin:20px 0">
              <thead>
                <tr style="background:#f5f0ea">
                  <th style="padding:10px;text-align:left;font-size:13px;color:#666">Бүтээгдэхүүн</th>
                  <th style="padding:10px;text-align:center;font-size:13px;color:#666">Тоо</th>
                  <th style="padding:10px;text-align:right;font-size:13px;color:#666">Үнэ</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px 10px;font-weight:bold;font-size:16px;border-top:2px solid #e8e0d6">Нийт</td>
                  <td style="padding:12px 10px;text-align:right;font-weight:bold;font-size:16px;color:#6b8e68;border-top:2px solid #e8e0d6">${data.total}</td>
                </tr>
              </tfoot>
            </table>

            <div style="background:#f5f0ea;border-radius:8px;padding:14px;margin-top:12px">
              <p style="margin:0;font-size:13px;color:#666">
                <strong style="color:#3a3a3a">Хүргэлтийн хаяг:</strong><br/>
                ${data.shippingAddress}${data.city ? `, ${data.city}` : ""}
              </p>
            </div>
          </div>

          <p style="text-align:center;color:#9a9a9a;font-size:12px;margin-top:24px">
            Асуух зүйл байвал +976 9911-1234 дугаарт холбогдоно уу.<br/>
            © ${new Date().getFullYear()} Pajama.mn
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}
