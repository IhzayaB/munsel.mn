"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

const SIZES = [
  "NB", "0-3M", "3-6M", "6-9M", "9-12M",
  "12-18M", "18-24M", "2T", "3T", "4T",
];

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    nameMn: "",
    slug: "",
    description: "",
    descriptionMn: "",
    price: "",
    compareAtPrice: "",
    material: "",
    materialMn: "",
    ageRange: "",
    featured: false,
  });

  const [variants, setVariants] = useState([
    { size: "NB", color: "", colorMn: "", stock: 10, sku: "" },
  ]);

  const addVariant = () => {
    setVariants([
      ...variants,
      { size: "0-3M", color: "", colorMn: "", stock: 10, sku: "" },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  // Auto-generate slug from English name
  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImages([...images, ...data.urls]);
    } catch {
      toast.error("Зураг оруулахад алдаа гарлаа");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, images, variants }),
      });

      if (!res.ok) throw new Error("Failed to create product");

      toast.success("Бүтээгдэхүүн амжилттай үүсгэлээ!");
      router.push("/admin/products");
    } catch {
      toast.error("Бүтээгдэхүүн үүсгэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Шинэ бүтээгдэхүүн нэмэх</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Зураг</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              {images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                  <Image src={img} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">Оруулах</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Үндсэн мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Нэр (Англи)</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  placeholder="Soft Cotton Onesie"
                  required
                />
              </div>
              <div>
                <Label>Нэр (Монгол)</Label>
                <Input
                  value={form.nameMn}
                  onChange={(e) =>
                    setForm({ ...form, nameMn: e.target.value })
                  }
                  placeholder="Зөөлөн хөвөн комбинезон"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value })
                }
                placeholder="soft-cotton-onesie"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Тайлбар (Англи)</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label>Тайлбар (Монгол)</Label>
                <Textarea
                  value={form.descriptionMn}
                  onChange={(e) =>
                    setForm({ ...form, descriptionMn: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Үнийн мэдээлэл</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Үнэ (₮)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  placeholder="29900"
                  required
                />
              </div>
              <div>
                <Label>Харьцуулах үнэ (₮, заавал биш)</Label>
                <Input
                  type="number"
                  value={form.compareAtPrice}
                  onChange={(e) =>
                    setForm({ ...form, compareAtPrice: e.target.value })
                  }
                  placeholder="39900"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>Дэлгэрэнгүй</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Материал (Англи)</Label>
                <Input
                  value={form.material}
                  onChange={(e) =>
                    setForm({ ...form, material: e.target.value })
                  }
                  placeholder="100% Organic Cotton"
                />
              </div>
              <div>
                <Label>Материал (Монгол)</Label>
                <Input
                  value={form.materialMn}
                  onChange={(e) =>
                    setForm({ ...form, materialMn: e.target.value })
                  }
                  placeholder="100% Органик хөвөн"
                />
              </div>
            </div>
            <div>
              <Label>Насны ангилал</Label>
              <Input
                value={form.ageRange}
                onChange={(e) =>
                  setForm({ ...form, ageRange: e.target.value })
                }
                placeholder="0-12 months"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
              />
              <Label htmlFor="featured">Онцлох бүтээгдэхүүн</Label>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Хэмжээний сонголт</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="h-4 w-4 mr-1" />
              Хэмжээ нэмэх
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.map((variant, i) => (
              <div
                key={i}
                className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-gray-50 rounded-lg relative"
              >
                <div>
                  <Label className="text-xs">Хэмжээ</Label>
                  <Select
                    value={variant.size}
                    onValueChange={(v) => v && updateVariant(i, "size", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Өнгө (Англи)</Label>
                  <Input
                    value={variant.color}
                    onChange={(e) =>
                      updateVariant(i, "color", e.target.value)
                    }
                    placeholder="White"
                  />
                </div>
                <div>
                  <Label className="text-xs">Өнгө</Label>
                  <Input
                    value={variant.colorMn}
                    onChange={(e) =>
                      updateVariant(i, "colorMn", e.target.value)
                    }
                    placeholder="Цагаан"
                  />
                </div>
                <div>
                  <Label className="text-xs">Нөөц</Label>
                  <Input
                    type="number"
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariant(i, "stock", parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="flex items-end">
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeVariant(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Бүтээгдэхүүн үүсгэх
        </Button>
      </form>
    </div>
  );
}
