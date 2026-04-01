"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, ToggleLeft, ToggleRight, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: string;
  minOrderAmount?: string | null;
  maxUses?: number | null;
  usedCount: number;
  active: boolean;
  expiresAt?: string | null;
}

const emptyForm = {
  code: "",
  type: "percent",
  value: "",
  minOrderAmount: "",
  maxUses: "",
  expiresAt: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      setCoupons(await res.json());
    } catch {
      toast.error("Купон ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const startEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount || "",
      maxUses: c.maxUses?.toString() || "",
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split("T")[0] : "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        // Update
        const res = await fetch("/api/admin/coupons", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            ...form,
            maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed");
        }
        toast.success("Купон шинэчлэгдлээ!");
      } else {
        // Create
        const res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed");
        }
        toast.success("Купон нэмэгдлээ!");
      }
      setEditingId(null);
      setForm(emptyForm);
      fetchCoupons();
    } catch (err) {
      toast.error(err instanceof Error && err.message !== "Failed" ? err.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !active }),
      });
      setCoupons(coupons.map((c) => (c.id === id ? { ...c, active: !active } : c)));
    } catch {
      toast.error("Алдаа гарлаа");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Купон устгах уу?")) return;
    try {
      await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setCoupons(coupons.filter((c) => c.id !== id));
      if (editingId === id) cancelEdit();
      toast.success("Купон устгагдлаа");
    } catch {
      toast.error("Алдаа гарлаа");
    }
  };

  const isExpired = (c: Coupon) => c.expiresAt && new Date(c.expiresAt) < new Date();

  if (loading) return <div className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Купон / Хямдрал</h1>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{editingId ? "Купон засах" : "Купон нэмэх"}</CardTitle>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-1" /> Болих
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label>Код</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10"
                  required
                />
              </div>
              <div>
                <Label>Төрөл</Label>
                <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v as "percent" | "fixed" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Хувиар (%)</SelectItem>
                    <SelectItem value="fixed">Тогтмол дүн (₮)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Утга {form.type === "percent" ? "(%)" : "(₮)"}</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder={form.type === "percent" ? "10" : "5000"} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Доод захиалга (₮)</Label>
                <Input type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="50000" />
              </div>
              <div>
                <Label>Хэрэглэх тоо</Label>
                <Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="Хязгааргүй" />
              </div>
              <div>
                <Label>Хугацаа дуусах</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? (
                <><Pencil className="mr-2 h-4 w-4" /> Шинэчлэх</>
              ) : (
                <><Plus className="mr-2 h-4 w-4" /> Нэмэх</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Бүх купон ({coupons.length})</CardTitle></CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Купон байхгүй</p>
          ) : (
            <div className="space-y-3">
              {coupons.map((c) => {
                const expired = isExpired(c);
                return (
                  <div key={c.id} className={`flex items-center justify-between p-3 rounded-lg ${editingId === c.id ? "bg-primary/5 border border-primary" : "bg-secondary/50"}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="font-bold text-sm">{c.code}</code>
                        <Badge variant={c.active && !expired ? "default" : "secondary"}>
                          {expired ? "Хугацаа дууссан" : c.active ? "Идэвхтэй" : "Идэвхгүй"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.type === "percent" ? `${c.value}%` : formatPrice(c.value)} хямдрал
                        {c.minOrderAmount ? ` • Доод ${formatPrice(c.minOrderAmount)}` : ""}
                        {c.maxUses ? ` • ${c.usedCount}/${c.maxUses} ашиглагдсан` : ` • ${c.usedCount} удаа`}
                        {c.expiresAt ? ` • ${new Date(c.expiresAt).toLocaleDateString("mn-MN")} хүртэл` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(c)} title="Засах">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleActive(c.id, c.active)}>
                        {c.active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
