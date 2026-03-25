"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SettingsGroup {
  title: string;
  keys: { key: string; label: string; placeholder: string; type?: string }[];
}

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    title: "Хүргэлт",
    keys: [
      { key: "SHIPPING_COST", label: "Хүргэлтийн үнэ (₮)", placeholder: "7000", type: "number" },
      { key: "FREE_SHIPPING_THRESHOLD", label: "Үнэгүй хүргэлтийн доод дүн (₮)", placeholder: "50000", type: "number" },
    ],
  },
  {
    title: "Дэлгүүрийн мэдээлэл",
    keys: [
      { key: "STORE_NAME", label: "Дэлгүүрийн нэр", placeholder: "Pajama.mn" },
      { key: "STORE_PHONE", label: "Утас", placeholder: "88029180" },
      { key: "STORE_EMAIL", label: "И-мэйл", placeholder: "info@pajama.mn" },
      { key: "STORE_ADDRESS", label: "Хаяг", placeholder: "Улаанбаатар" },
    ],
  },
  {
    title: "Сошиал хаягууд",
    keys: [
      { key: "FACEBOOK_URL", label: "Facebook", placeholder: "https://facebook.com/Pajama.mn" },
      { key: "INSTAGRAM_URL", label: "Instagram", placeholder: "https://instagram.com/pajama.mn/" },
    ],
  },
  {
    title: "QPay тохиргоо",
    keys: [
      { key: "QPAY_INVOICE_CODE", label: "Invoice Code", placeholder: "" },
      { key: "QPAY_USERNAME", label: "Username", placeholder: "" },
      { key: "QPAY_PASSWORD", label: "Password", placeholder: "" },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error();
      toast.success("Тохиргоо хадгалагдлаа");
    } catch {
      toast.error("Хадгалахад алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Ачааллаж байна...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Тохиргоо</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </div>

      {SETTINGS_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="text-lg">{group.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {group.keys.map(({ key, label, placeholder, type }) => (
              <div key={key} className="space-y-1">
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type={type || "text"}
                  placeholder={placeholder}
                  value={settings[key] || ""}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
