"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, QrCode } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const UB_DISTRICTS = [
  "Баянгол",
  "Баянзүрх",
  "Чингэлтэй",
  "Хан-Уул",
  "Сонгинохайрхан",
  "Сүхбаатар",
  "Налайх",
  "Багануур",
  "Багахангай",
];

type CheckoutStep = "info" | "payment" | "success";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const tc = useTranslations("common");
  const { items, getTotalPrice, getShippingCost, getGrandTotal, clearCart } =
    useCartStore();

  const [step, setStep] = useState<CheckoutStep>("info");
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [invoiceId, setInvoiceId] = useState<string>("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "Улаанбаатар",
    district: "",
    khoroo: "",
    notes: "",
  });

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.district) {
      toast.error("Бүх заавал талбарыг бөглөнө үү");
      return;
    }

    setLoading(true);
    try {
      const fullAddress = `${form.city}, ${form.district}${form.khoroo ? `, ${form.khoroo}-р хороо` : ""}, ${form.address}`;
      const res = await fetch("/api/qpay/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            name: item.name,
            size: item.size,
            color: item.color,
          })),
          customer: { ...form, address: fullAddress },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create order");
      }

      const data = await res.json();
      setOrderNumber(data.orderNumber);
      setQrImage(data.qrImage);
      setInvoiceId(data.invoiceId);
      setStep("payment");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Захиалга үүсгэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const checkPayment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/qpay/callback?order=${orderNumber}&invoice=${invoiceId}`);
      const data = await res.json();

      if (data.paid) {
        setStep("success");
        clearCart();
        toast.success(t("paymentSuccess"));
      } else {
        toast.info(t("paymentPending"));
      }
    } catch {
      toast.error("Алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("orderPlaced")}</h1>
        <p className="text-muted-foreground mb-2">{t("paymentSuccess")}</p>
        <p className="text-lg font-mono font-bold mb-8">
          {t("orderNumber")}: {orderNumber}
        </p>
        <Button size="lg" className="w-full sm:w-auto" render={<Link href="/" />}>
          {tc("home")}
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-lg text-muted-foreground mb-4">
          Таны сагс хоосон байна
        </p>
        <Button size="lg" render={<Link href="/products" />}>
          Дэлгүүр үзэх
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "Сагс", href: "/cart" },
          { label: t("title") },
        ]}
      />

      {/* Order summary - visible on top on mobile */}
      <div className="lg:hidden mb-6">
        <details className="bg-gray-50 rounded-xl">
          <summary className="p-4 font-semibold cursor-pointer flex items-center justify-between">
            <span>{t("orderSummary")} ({items.length})</span>
            <span className="font-bold text-primary">{formatPrice(getGrandTotal())}</span>
          </summary>
          <div className="px-4 pb-4 space-y-2 text-sm">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex justify-between"
              >
                <span className="truncate mr-2">
                  {item.nameMn} x{item.quantity}
                  {item.size && ` (${item.size})`}
                </span>
                <span className="whitespace-nowrap">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between">
              <span>Нийлбэр</span>
              <span>{formatPrice(getTotalPrice())}</span>
            </div>
            <div className="flex justify-between">
              <span>Хүргэлт</span>
              <span>{getShippingCost() === 0 ? "Үнэгүй" : formatPrice(getShippingCost())}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Нийт</span>
              <span>{formatPrice(getGrandTotal())}</span>
            </div>
          </div>
        </details>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          {step === "info" && (
            <form onSubmit={handleSubmitOrder} className="space-y-5">
              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t("contactInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Овог, нэр *</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      placeholder="Бат Болд"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Утасны дугаар *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value })
                      }
                      placeholder="8802 9180"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">И-мэйл (заавал биш)</Label>
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      placeholder="tani@email.com"
                      className="h-12 text-base"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Хүргэлтийн мэдээлэл</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Хот *</Label>
                    <Select
                      value={form.city}
                      onValueChange={(v) => v && setForm({ ...form, city: v, district: "" })}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Улаанбаатар">Улаанбаатар</SelectItem>
                        <SelectItem value="Дархан">Дархан</SelectItem>
                        <SelectItem value="Эрдэнэт">Эрдэнэт</SelectItem>
                        <SelectItem value="Бусад">Бусад</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.city === "Улаанбаатар" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Дүүрэг *</Label>
                        <Select
                          value={form.district}
                          onValueChange={(v) => v && setForm({ ...form, district: v })}
                        >
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Сонгох" />
                          </SelectTrigger>
                          <SelectContent>
                            {UB_DISTRICTS.map((d) => (
                              <SelectItem key={d} value={d}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="khoroo">Хороо</Label>
                        <Input
                          id="khoroo"
                          inputMode="numeric"
                          value={form.khoroo}
                          onChange={(e) =>
                            setForm({ ...form, khoroo: e.target.value })
                          }
                          placeholder="Жишээ: 7"
                          className="h-12 text-base"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="district">Аймаг / Дүүрэг *</Label>
                      <Input
                        id="district"
                        value={form.district}
                        onChange={(e) =>
                          setForm({ ...form, district: e.target.value })
                        }
                        className="h-12 text-base"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="address">Дэлгэрэнгүй хаяг *</Label>
                    <Textarea
                      id="address"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      placeholder="Байр, орц, тоот"
                      rows={2}
                      className="text-base"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Нэмэлт тэмдэглэл</Label>
                    <Textarea
                      id="notes"
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      placeholder="Жишээ: хаалганы код 1234"
                      rows={2}
                      className="text-base"
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-base"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("placeOrder")} • {formatPrice(getGrandTotal())}
              </Button>
            </form>
          )}

          {step === "payment" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QPay төлбөр
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground text-sm sm:text-base">
                  Банкны аппаараа QR кодыг уншуулна уу
                </p>

                {qrImage && (
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${qrImage}`}
                      alt="QPay QR Code"
                      width={280}
                      height={280}
                      className="rounded-lg border w-full max-w-[280px]"
                    />
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  {t("orderNumber")}: <strong>{orderNumber}</strong>
                </p>
                <p className="text-xl font-bold">
                  {formatPrice(getGrandTotal())}
                </p>

                <Button
                  onClick={checkPayment}
                  disabled={loading}
                  className="w-full h-14 text-base"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Шалгаж байна...
                    </>
                  ) : (
                    "Төлбөр шалгах"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary Sidebar - desktop only */}
        <div className="hidden lg:block bg-gray-50 rounded-xl p-6 h-fit sticky top-24">
            <h2 className="font-bold text-lg mb-4">{t("orderSummary")}</h2>

            <div className="space-y-3 text-sm">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}`}
                  className="flex justify-between"
                >
                  <span className="truncate mr-2">
                    {item.nameMn} x{item.quantity}
                    {item.size && ` (${item.size})`}
                  </span>
                  <span className="whitespace-nowrap">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between">
                <span>Нийлбэр</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between">
                <span>Хүргэлт</span>
                <span>
                  {getShippingCost() === 0
                    ? "Үнэгүй"
                    : formatPrice(getShippingCost())}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Нийт</span>
                <span>{formatPrice(getGrandTotal())}</span>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
