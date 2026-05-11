"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mail, Save, Send, Loader2, Users, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string | null;
  email: string;
}

interface EmailTemplates {
  EMAIL_TEMPLATE_GENERAL_SUBJECT: string;
  EMAIL_TEMPLATE_GENERAL_HTML: string;
  EMAIL_TEMPLATE_PROMO_SUBJECT: string;
  EMAIL_TEMPLATE_PROMO_HTML: string;
}

interface InboxStatus {
  domain: string;
  canReceiveMail: boolean;
  canReadMail: boolean;
  recommendedInbox: string;
  receivedMailUi: string;
  provider: {
    key: string;
    label: string;
    note: string;
  };
  mxRecords: Array<{
    preference: number | null;
    exchange: string;
    raw: string;
  }>;
}

const initialTemplates: EmailTemplates = {
  EMAIL_TEMPLATE_GENERAL_SUBJECT: "",
  EMAIL_TEMPLATE_GENERAL_HTML: "",
  EMAIL_TEMPLATE_PROMO_SUBJECT: "",
  EMAIL_TEMPLATE_PROMO_HTML: "",
};

const INBOX_DOMAIN = "pajama.mn";

export default function AdminEmailPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [templates, setTemplates] = useState<EmailTemplates>(initialTemplates);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [sending, setSending] = useState(false);

  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [manualRecipients, setManualRecipients] = useState("");
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<Set<string>>(new Set());
  const [inboxStatus, setInboxStatus] = useState<InboxStatus | null>(null);
  const [checkingInbox, setCheckingInbox] = useState(false);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomers(data.map((c) => ({ id: c.id, name: c.name, email: c.email })));
        }
      })
      .catch(() => {
        toast.error("Хэрэглэгчдийн жагсаалт татаж чадсангүй");
      })
      .finally(() => setLoadingCustomers(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/email/templates")
      .then((res) => res.json())
      .then((data) => {
        setTemplates({
          EMAIL_TEMPLATE_GENERAL_SUBJECT: data.EMAIL_TEMPLATE_GENERAL_SUBJECT || "",
          EMAIL_TEMPLATE_GENERAL_HTML: data.EMAIL_TEMPLATE_GENERAL_HTML || "",
          EMAIL_TEMPLATE_PROMO_SUBJECT: data.EMAIL_TEMPLATE_PROMO_SUBJECT || "",
          EMAIL_TEMPLATE_PROMO_HTML: data.EMAIL_TEMPLATE_PROMO_HTML || "",
        });
        if (!subject && data.EMAIL_TEMPLATE_GENERAL_SUBJECT) {
          setSubject(data.EMAIL_TEMPLATE_GENERAL_SUBJECT);
        }
        if (!html && data.EMAIL_TEMPLATE_GENERAL_HTML) {
          setHtml(data.EMAIL_TEMPLATE_GENERAL_HTML);
        }
      })
      .catch(() => toast.error("Имэйлийн загвар татаж чадсангүй"))
      .finally(() => setLoadingTemplates(false));
  }, [subject, html]);

  const selectedCustomerEmails = useMemo(() => {
    const selectedIds = selectedRecipientIds;
    return customers
      .filter((c) => selectedIds.has(c.id))
      .map((c) => c.email);
  }, [customers, selectedRecipientIds]);

  const manualEmails = useMemo(() => {
    return manualRecipients
      .split(/[\n,;\s]+/)
      .map((email) => email.trim())
      .filter(Boolean);
  }, [manualRecipients]);

  const allRecipients = useMemo(() => {
    const merged = [...selectedCustomerEmails, ...manualEmails];
    return Array.from(new Set(merged));
  }, [selectedCustomerEmails, manualEmails]);

  const toggleCustomer = (id: string) => {
    const next = new Set(selectedRecipientIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedRecipientIds(next);
  };

  const loadTemplate = (type: "general" | "promo") => {
    if (type === "general") {
      setSubject(templates.EMAIL_TEMPLATE_GENERAL_SUBJECT);
      setHtml(templates.EMAIL_TEMPLATE_GENERAL_HTML);
      toast.success("Ерөнхий загвар ачааллаа");
      return;
    }

    setSubject(templates.EMAIL_TEMPLATE_PROMO_SUBJECT);
    setHtml(templates.EMAIL_TEMPLATE_PROMO_HTML);
    toast.success("Урамшууллын загвар ачааллаа");
  };

  const saveTemplates = async () => {
    setSavingTemplates(true);
    try {
      const res = await fetch("/api/admin/email/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templates),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Имэйлийн загвар хадгалагдлаа");
    } catch {
      toast.error("Загвар хадгалахад алдаа гарлаа");
    } finally {
      setSavingTemplates(false);
    }
  };

  const checkInboxStatus = async () => {
    setCheckingInbox(true);
    try {
      const res = await fetch(`/api/admin/email/inbox-status?domain=${INBOX_DOMAIN}`);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed");
      }

      setInboxStatus(data as InboxStatus);
    } catch {
      toast.error("Ирсэн имэйл шалгаж чадсангүй");
    } finally {
      setCheckingInbox(false);
    }
  };

  useEffect(() => {
    checkInboxStatus();
  }, []);

  const sendEmail = async () => {
    if (!subject.trim()) {
      toast.error("Сэдэв оруулна уу");
      return;
    }
    if (!html.trim()) {
      toast.error("HTML мессеж оруулна уу");
      return;
    }
    if (allRecipients.length === 0) {
      toast.error("Доод тал нь 1 хүлээн авагч сонгоно уу");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/admin/email/send-customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: allRecipients,
          subject,
          html,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(`${data.sent ?? allRecipients.length} имэйл илгээгдлээ`);
    } catch {
      toast.error("Имэйл илгээхэд алдаа гарлаа");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
          <Mail className="h-5 w-5 sm:h-6 sm:w-6" /> Имэйл
        </h1>
        <Badge variant="secondary">Илгээгч: info@pajama.mn</Badge>
      </div>

      <Tabs defaultValue="compose">
        <TabsList>
          <TabsTrigger value="compose">Илгээх</TabsTrigger>
          <TabsTrigger value="templates">Загвар</TabsTrigger>
          <TabsTrigger value="inbox">Хүлээн авсан</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Имэйл бичих</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => loadTemplate("general")}>Ерөнхий загвар</Button>
                <Button variant="outline" onClick={() => loadTemplate("promo")}>Урамшууллын загвар</Button>
              </div>

              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Сэдэв"
              />
              <Textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={12}
                className="font-mono text-xs"
                placeholder="<p>Сайн байна уу...</p>"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Хүлээн авагчид
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Сонгосон: {allRecipients.length}
              </p>

              <Textarea
                value={manualRecipients}
                onChange={(e) => setManualRecipients(e.target.value)}
                rows={3}
                placeholder="Гараар имэйл оруулах (таслал эсвэл мөрөөр салгана)"
              />

              <div className="border rounded-md p-2 max-h-64 overflow-y-auto space-y-2">
                {loadingCustomers ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Уншиж байна...
                  </div>
                ) : (
                  customers.map((customer) => (
                    <label
                      key={customer.id}
                      className="flex items-center gap-2 text-sm p-1 rounded hover:bg-secondary"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipientIds.has(customer.id)}
                        onChange={() => toggleCustomer(customer.id)}
                      />
                      <span className="font-medium">{customer.name || "Нэргүй"}</span>
                      <span className="text-muted-foreground">{customer.email}</span>
                    </label>
                  ))
                )}
              </div>

              <Button onClick={sendEmail} disabled={sending} className="bg-blue-600 hover:bg-blue-700">
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Илгээх
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Имэйлийн загвар засах</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingTemplates ? (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Ачаалж байна...
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Ерөнхий загвар</p>
                    <Input
                      value={templates.EMAIL_TEMPLATE_GENERAL_SUBJECT}
                      onChange={(e) => setTemplates((prev) => ({ ...prev, EMAIL_TEMPLATE_GENERAL_SUBJECT: e.target.value }))}
                      placeholder="Ерөнхий загварын сэдэв"
                    />
                    <Textarea
                      rows={6}
                      value={templates.EMAIL_TEMPLATE_GENERAL_HTML}
                      onChange={(e) => setTemplates((prev) => ({ ...prev, EMAIL_TEMPLATE_GENERAL_HTML: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Урамшууллын загвар</p>
                    <Input
                      value={templates.EMAIL_TEMPLATE_PROMO_SUBJECT}
                      onChange={(e) => setTemplates((prev) => ({ ...prev, EMAIL_TEMPLATE_PROMO_SUBJECT: e.target.value }))}
                      placeholder="Урамшууллын загварын сэдэв"
                    />
                    <Textarea
                      rows={6}
                      value={templates.EMAIL_TEMPLATE_PROMO_HTML}
                      onChange={(e) => setTemplates((prev) => ({ ...prev, EMAIL_TEMPLATE_PROMO_HTML: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <Button onClick={saveTemplates} disabled={savingTemplates}>
                {savingTemplates ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Загвар хадгалах
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4" /> info@pajama.mn inbox status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={checkInboxStatus} disabled={checkingInbox}>
                  {checkingInbox ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Шалгах
                </Button>
                <Badge variant={inboxStatus?.canReceiveMail ? "default" : "destructive"}>
                  {inboxStatus?.canReceiveMail ? "Mail routing OK" : "MX алга"}
                </Badge>
                <Badge variant="secondary">{INBOX_DOMAIN}</Badge>
              </div>

              <div className="rounded-lg border p-4 space-y-2 bg-secondary/30">
                <div className="flex items-center gap-2">
                  {inboxStatus?.canReceiveMail ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <p className="font-medium">
                    {inboxStatus
                      ? inboxStatus.provider.label
                      : "Inbox status not checked yet"}
                  </p>
                </div>
                <p className="text-muted-foreground">
                  {inboxStatus?.provider.note || "Click Шалгах to verify MX records for incoming mail."}
                </p>
                <p>
                  <strong>Read mail here:</strong> {inboxStatus?.receivedMailUi || "provider inbox / forwarding destination"}
                </p>
                {inboxStatus?.receivedMailUi && (
                  <a
                    href={inboxStatus.receivedMailUi}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open inbox/provider <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-medium">MX records</p>
                {inboxStatus?.mxRecords?.length ? (
                  <div className="space-y-2">
                    {inboxStatus.mxRecords.map((record) => (
                      <div key={record.raw} className="rounded-md border px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs">{record.raw}</span>
                          <Badge variant="secondary">pref {record.preference ?? "-"}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">exchange: {record.exchange}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No MX records returned yet.</p>
                )}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  How to receive mail
                </div>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Choose an inbox host: Google Workspace, Zoho Mail, or Cloudflare Email Routing.</li>
                  <li>Set `info@pajama.mn` as a mailbox or forwarding target inside that provider.</li>
                  <li>Point your domain MX records to that provider in DNS.</li>
                  <li>Open the provider inbox or forwarding destination to read received mail.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
