"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
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

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const hasValidLink = Boolean(email && token);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasValidLink) {
      toast.error(t("resetLinkInvalid"));
      return;
    }

    if (passwords.newPassword.length < 8) {
      toast.error(t("passwordMinLength"));
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          newPassword: passwords.newPassword,
          confirmPassword: passwords.confirmPassword,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || t("resetConfirmError"));
      }

      toast.success(t("resetConfirmSuccess"));
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("resetConfirmError")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Image
            src="/logo.png"
            alt="Pajama.mn"
            width={56}
            height={56}
            className="rounded-full mx-auto mb-2"
          />
          <CardTitle className="text-2xl">{t("resetPasswordTitle")}</CardTitle>
          <CardDescription>
            {hasValidLink ? t("resetPasswordSubtitle") : t("resetLinkInvalid")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasValidLink ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">{t("password")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  className="h-12 text-base"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  className="h-12 text-base"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? t("resettingPassword") : t("resetPasswordAction")}
              </Button>
            </form>
          ) : null}

          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="text-primary hover:underline">
              {t("backToLogin")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}