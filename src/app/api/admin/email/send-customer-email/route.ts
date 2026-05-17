import { auth } from "@/lib/auth";
import { sendInfoEmails } from "@/lib/email";
import { z } from "zod";

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  html: z.string().min(1),
  replyTo: z.string().email().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    // Check if user is admin
    if (!session || session.user?.role !== "admin") {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = sendEmailSchema.parse(body);

    const emails = Array.isArray(data.to) ? data.to : [data.to];

    const sendResult = await sendInfoEmails({
      to: emails,
      subject: data.subject,
      html: data.html,
      replyTo: data.replyTo,
    });

    return Response.json({
      success: sendResult.success,
      sent: sendResult.sent,
      failed: sendResult.failed,
      total: sendResult.total,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return Response.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
