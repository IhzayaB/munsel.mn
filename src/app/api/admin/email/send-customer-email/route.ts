import { auth } from "@/lib/auth";
import { sendInfoEmail } from "@/lib/email";
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

    // Send emails in parallel
    const results = await Promise.allSettled(
      emails.map((email) =>
        sendInfoEmail({
          to: email,
          subject: data.subject,
          html: data.html,
          replyTo: data.replyTo,
        })
      )
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return Response.json({
      success: true,
      sent: successful,
      failed: failed,
      total: emails.length,
    });
  } catch (error) {
    console.error("Email send error:", error);
    return Response.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
