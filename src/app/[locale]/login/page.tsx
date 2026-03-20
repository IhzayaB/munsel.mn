"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/routing";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        if (form.password !== form.confirmPassword) {
          toast.error("Нууц үг таарахгүй байна");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || "Бүртгэл амжилтгүй боллоо");
          setLoading(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("И-мэйл эсвэл нууц үг буруу байна");
      } else {
        router.push("/");
        toast.success(isRegister ? "Бүртгэл амжилттай!" : "Тавтай морил!");
      }
    } catch {
      toast.error("Алдаа гарлаа. Дахин оролдоно уу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Image
            src="/logo.png"
            alt="Pajama.mn"
            width={56}
            height={56}
            className="rounded-full mx-auto mb-2"
          />
          <CardTitle className="text-2xl">
            {isRegister ? t("registerTitle") : t("loginTitle")}
          </CardTitle>
          <CardDescription>
            {isRegister ? t("registerSubtitle") : t("loginSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-12 text-base"
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-12 text-base"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="h-12 text-base"
                required
              />
            </div>
            {isRegister && (
              <div>
                <Label htmlFor="confirmPassword">
                  {t("confirmPassword")}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  className="h-12 text-base"
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRegister ? t("signUp") : t("signIn")}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
              {isRegister ? t("hasAccount") : t("noAccount")}{" "}
            </span>
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary hover:underline font-medium"
            >
              {isRegister ? t("signIn") : t("signUp")}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
