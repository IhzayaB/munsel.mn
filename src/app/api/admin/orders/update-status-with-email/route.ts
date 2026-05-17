import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { sendInfoEmail } from "@/lib/email";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]),
  sendNotification: z.boolean().default(true),
});

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  paid: "Төлөгдсөн",
  processing: "Бэлтгэж буй",
  shipped: "Илгээсэн",
  delivered: "Хүргэсэн",
  cancelled: "Цуцлагдсан",
};

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || session.user?.role !== "admin") {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, status, sendNotification } = updateOrderStatusSchema.parse(body);

    // Get order details
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Update order status
    await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, orderId));

    // Send notification email
    if (sendNotification && order.customerEmail) {
      const statusLabel = STATUS_LABELS[status] || status;
      
      const emailResult = await sendInfoEmail({
        to: order.customerEmail,
        subject: `Таны захиалга #${order.orderNumber} статус өөрчлөгдлөө`,
        html: `
          <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5fafa">
            <div style="text-align:center;padding:20px 0">
              <h1 style="color:#C6973F;margin:0;font-size:24px">Munsel.mn</h1>
            </div>
            
            <div style="background:#ffffff;border-radius:12px;padding:24px;margin:16px 0">
              <h2 style="color:#2c3e3f;margin-top:0;font-size:18px">Захиалгын статус обновлагдлаа</h2>
              <p style="color:#666;font-size:15px">Сайн байна уу, ${order.customerName || "хэрэглэгч"}!</p>
              
              <div style="background:#e4f1f2;border-radius:8px;padding:14px;margin:16px 0">
                <p style="margin:0;font-size:13px">
                  <strong style="color:#2c3e3f">Захиалга:</strong> #${order.orderNumber}<br/>
                  <strong style="color:#2c3e3f">Шинэ статус:</strong> <span style="color:#C6973F;font-weight:bold">${statusLabel}</span>
                </p>
              </div>

              ${status === "shipped" ? `
                <p style="color:#666;font-size:14px">
                  📦 Таны захиалга аль хэдийн илгээгдсэн байна. Хүргэлтийн дээврийн дугаарыг удахгүй авах болно.
                </p>
              ` : ""}

              ${status === "delivered" ? `
                <p style="color:#666;font-size:14px">
                  ✅ Таны захиалга амжилттай хүргэгдсэн! Сайтар худалдаж авсан танд баярлалаа.
                </p>
              ` : ""}

              ${status === "cancelled" ? `
                <p style="color:#666;font-size:14px">
                  ❌ Таны захиалга цуцлагдсан. Асуух зүйл байвал манай багтай холбогдоно уу.
                </p>
              ` : ""}
            </div>

            <p style="text-align:center;color:#9a9a9a;font-size:12px;margin-top:24px">
              Асуух зүйл байвал +976 8802-9180 дугаарт холбогдоно уу.<br/>
              © ${new Date().getFullYear()} Munsel.mn
            </p>
          </div>
        `,
      });

      if (!emailResult.success) {
        console.error(
          `Order status email was not sent for order ${order.orderNumber}`,
          emailResult.error
        );
      }
    }

    return Response.json({
      success: true,
      order: { id: orderId, status },
    });
  } catch (error) {
    console.error("Order status update error:", error);
    return Response.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
