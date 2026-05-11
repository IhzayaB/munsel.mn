"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: string | string[];
  recipientLabel?: string;
  onSend?: (subject: string, html: string) => Promise<void>;
}

export function EmailComposer({
  isOpen,
  onClose,
  recipients,
  recipientLabel = "Recipient",
  onSend,
}: EmailComposerProps) {
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error("Сэдэв оруулна уу");
      return;
    }
    if (!htmlContent.trim()) {
      toast.error("Мессеж оруулна уу");
      return;
    }

    setSending(true);
    try {
      if (onSend) {
        await onSend(subject, htmlContent);
      } else {
        // Default send logic
        const recipientArray = Array.isArray(recipients) ? recipients : [recipients];

        const response = await fetch("/api/admin/email/send-customer-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipientArray,
            subject,
            html: htmlContent,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send email");
        }

        const result = await response.json();
        toast.success(`${result.sent} имэйл илгээгдлээ`);
      }

      setSubject("");
      setHtmlContent("");
      onClose();
    } catch (error) {
      console.error("Email send error:", error);
      toast.error("Имэйл илгээхэд алдаа гарлаа");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Имэйл илгээх</h2>
          <p className="text-sm text-gray-500">
            {recipientLabel}:{" "}
            <span className="font-medium">
              {Array.isArray(recipients) ? recipients.join(", ") : recipients}
            </span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Сэдэв</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Имэйлийн сэдэв оруулна уу"
              disabled={sending}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Мессеж (HTML)</label>
            <Textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="HTML форматаар мессеж оруулна уу. Жишээ нь: <p>Сайн байна уу!</p>"
              rows={10}
              disabled={sending}
              className="font-mono text-xs"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 HTML ашигла. Жишээ: &lt;p&gt;Сэргэлэлт&lt;/p&gt;, &lt;strong&gt;хүчтэй текст&lt;/strong&gt;
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={sending}
            >
              Цуцлах
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Илгээж байна...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Илгээх
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
