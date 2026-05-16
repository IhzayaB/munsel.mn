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
    ],
  },
  {
    title: "Дэлгүүрийн мэдээлэл",
    keys: [
      { key: "STORE_NAME", label: "Дэлгүүрийн нэр", placeholder: "Munsel.mn" },
      { key: "STORE_PHONE", label: "Утас", placeholder: "88029180" },
      { key: "STORE_EMAIL", label: "И-мэйл", placeholder: "info@munsel.mn" },
      { key: "STORE_ADDRESS", label: "Хаяг", placeholder: "Улаанбаатар" },
    ],
  },
  {
    title: "Сошиал хаягууд",
    keys: [
      { key: "FACEBOOK_URL", label: "Facebook", placeholder: "https://facebook.com/Munsel.mn" },
      { key: "INSTAGRAM_URL", label: "Instagram", placeholder: "https://instagram.com/munsel.mn/" },
    ],
  },
  {
    title: "QPay тохиргоо",
    keys: [
      { key: "QPAY_INVOICE_CODE", label: "Invoice Code", placeholder: "" },
      { key: "QPAY_USERNAME", label: "Username", placeholder: "" },
      { key: "QPAY_PASSWORD", label: "Password", placeholder: "", type: "password" },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Нууц үгийн бүх талбарыг бөглөнө үү");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error("Шинэ нууц үг хамгийн багадаа 8 тэмдэгт байна");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Шинэ нууц үг таарахгүй байна");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Нууц үг солиход алдаа гарлаа");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Нууц үг амжилттай солигдлоо");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Нууц үг солиход алдаа гарлаа"
      );
    } finally {
      setPasswordSaving(false);
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Админ нууц үг</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="currentPassword">Одоогийн нууц үг</Label>
            <Input
              id="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="newPassword">Шинэ нууц үг</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Шинэ нууц үг давтах</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Одоогийн нууц үгээ баталгаажуулаад шинэ нууц үгээ хадгална.
            </p>
            <Button onClick={handlePasswordChange} disabled={passwordSaving}>
              {passwordSaving ? "Сольж байна..." : "Нууц үг солих"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </div>
    </div>
  );
}
