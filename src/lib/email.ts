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
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <h1 style="color:#6b8e68">🧸 pajama.mn</h1>
          <h2>Захиалга баталгаажлаа!</h2>
          <p>Сайн байна уу, ${data.customerName}!</p>
          <p>Таны <strong>#${data.orderNumber}</strong> захиалга амжилттай төлөгдлөө.</p>
          
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:8px;text-align:left">Бүтээгдэхүүн</th>
                <th style="padding:8px;text-align:center">Тоо</th>
                <th style="padding:8px;text-align:right">Үнэ</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:8px;font-weight:bold">Нийт</td>
                <td style="padding:8px;text-align:right;font-weight:bold">${data.total}₮</td>
              </tr>
            </tfoot>
          </table>

          <p><strong>Хүргэлтийн хаяг:</strong> ${data.shippingAddress}, ${data.city}</p>
          <p style="color:#888;font-size:12px;margin-top:30px">© pajama.mn — Нярайн хувцас</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}
