"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Plus, Trash2, Pencil, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  nameMn: string;
  slug: string;
  description?: string | null;
  descriptionMn?: string | null;
  image?: string | null;
  priority: number;
}

const emptyForm = { name: "", nameMn: "", slug: "", description: "", descriptionMn: "", image: "", priority: 0 };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data);
    } catch {
      toast.error("Ангилал ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const generateSlug = (name: string) => {
    const map: Record<string, string> = {
      а: "a", б: "b", в: "v", г: "g", д: "d", е: "ye", ё: "yo",
      ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
      н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t",
      у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
      ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
    };
    return name
      .toLowerCase()
      .split("")
      .map((c) => map[c] ?? c)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("files", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm({ ...form, image: data.urls[0] });
    } catch {
      toast.error("Зураг оруулахад алдаа гарлаа");
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      nameMn: cat.nameMn,
      slug: cat.slug,
      description: cat.description || "",
      descriptionMn: cat.descriptionMn || "",
      image: cat.image || "",
      priority: cat.priority ?? 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;
      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      toast.success(editingId ? "Ангилал шинэчлэгдлээ!" : "Ангилал нэмэгдлээ!");
      cancelEdit();
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error && err.message !== "Failed" ? err.message : "Алдаа гарлаа");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" ангиллыг устгах уу? Энэ ангилалтай бүтээгдэхүүнүүд ангилалгүй болно.`)) return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      toast.success("Ангилал устгагдлаа");
      if (editingId === id) cancelEdit();
      fetchCategories();
    } catch (err) {
      toast.error(err instanceof Error && err.message !== "Failed" ? err.message : "Ангилал устгахад алдаа гарлаа");
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Ангилал</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingId ? "Ангилал засах" : "Ангилал нэмэх"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Зураг</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.image ? (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <Image src={form.image} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, image: "" })}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-secondary">
                    {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label>Нэр</Label>
              <Input
                value={form.nameMn}
                onChange={(e) => setForm({ ...form, nameMn: e.target.value, name: e.target.value, ...(!editingId ? { slug: generateSlug(e.target.value) } : {}) })}
                placeholder="Комбинезон"
                required
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div>
              <Label>Эрэмбэ (өндөр тоо = эхэнд харагдана)</Label>
              <Input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Хадгалах" : <><Plus className="mr-2 h-4 w-4" /> Нэмэх</>}
              </Button>
              {editingId && <Button type="button" variant="outline" onClick={cancelEdit}>Цуцлах</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Бүх ангилал ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Ангилал байхгүй байна</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    {cat.image && (
                      <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                        <Image src={cat.image} alt="" fill className="object-cover" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{cat.nameMn}</p>
                      <p className="text-xs text-muted-foreground">{cat.name} • /{cat.slug} • Эрэмбэ: {cat.priority}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(cat)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(cat.id, cat.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
