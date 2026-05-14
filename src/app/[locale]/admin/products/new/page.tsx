"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImage } from "@/lib/compress-image";
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
import { useRouter } from "@/i18n/routing";
import Image from "next/image";

const SIZES = [
  "", "NB", "0-3M", "3-6M", "6-9M", "9-12M",
  "12-18M", "18-24M", "2T", "3T", "4T",
];

const PRESET_COLORS = [
  "Цагаан",
  "Улбар шар",
  "Хар",
  "Саарал",
  "Ягаан",
  "Цэнхэр",
  "Ногоон",
  "Шар",
  "Улаан",
  "Хөх",
];

interface Category { id: string; name: string; nameMn: string; }

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
    categoryId: "",
    hasColorCategory: false,
    colorOptions: [] as string[],
  });

  const [variants, setVariants] = useState([
    { size: "", color: "", colorMn: "", stock: 10, sku: "" },
  ]);

  const [newColor, setNewColor] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (!res.ok) throw new Error("Ангиллын мэдээлэл татаж чадсангүй");
        const data = await res.json();
        setCategories(data);
      } catch {
        toast.error("Ангиллын мэдээлэл ачаалахад алдаа гарлаа");
      }
    };

    void loadCategories();
  }, []);

  const addVariant = () => {
    setVariants([
      ...variants,
      { size: "", color: "", colorMn: "", stock: 10, sku: "" },
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

  const addColorOption = (input?: string) => {
    const value = (input ?? newColor).trim();
    if (!value) return;
    if (form.colorOptions.includes(value)) {
      setNewColor("");
      return;
    }
    setForm({ ...form, hasColorCategory: true, colorOptions: [...form.colorOptions, value] });
    setNewColor("");
  };

  const removeColorOption = (color: string) => {
    const nextOptions = form.colorOptions.filter((c) => c !== color);
    setForm({ ...form, colorOptions: nextOptions, hasColorCategory: nextOptions.length > 0 ? form.hasColorCategory : false });
    if (nextOptions.length === 0) {
      setVariants((prev) => prev.map((v) => ({ ...v, color: "", colorMn: "" })));
      return;
    }
    setVariants((prev) =>
      prev.map((v) => (nextOptions.includes(v.colorMn || v.color) ? v : { ...v, color: "", colorMn: "" }))
    );
  };

  // Auto-generate slug from name
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
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    const formData = new FormData();
    for (const file of Array.from(files)) {
      const compressed = await compressImage(file);
      formData.append("files", compressed);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setImages([...images, ...data.urls]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Зураг оруулахад алдаа гарлаа");
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

    if (form.hasColorCategory && form.colorOptions.length === 0) {
      toast.error("Өнгөний ангилал сонгосон бол дор хаяж 1 өнгө нэмнэ үү");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, images, variants }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create product");
      }

      toast.success("Бүтээгдэхүүн амжилттай үүсгэлээ!");
      router.push("/admin/products");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Бүтээгдэхүүн үүсгэхэд алдаа гарлаа");
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
              <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-secondary">
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
            <div>
              <Label>Нэр</Label>
              <Input
                value={form.nameMn}
                onChange={(e) => {
                  setForm({
                    ...form,
                    nameMn: e.target.value,
                    name: e.target.value,
                    slug: generateSlug(e.target.value),
                  });
                }}
                placeholder="Зөөлөн хөвөн комбинезон"
                required
              />
            </div>

            <div>
              <Label>Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "") })
                }
                placeholder="soft-cotton-onesie"
                required
              />
            </div>

            <div>
              <Label>Ангилал</Label>
              <Select
                value={form.categoryId || "__none__"}
                onValueChange={(v) => setForm({ ...form, categoryId: v === "__none__" ? "" : (v ?? "") })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ангилал сонгох" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Ангилалгүй</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nameMn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Тайлбар</Label>
              <Textarea
                value={form.descriptionMn}
                onChange={(e) =>
                  setForm({ ...form, descriptionMn: e.target.value, description: e.target.value })
                }
                rows={3}
              />
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
            <div>
              <Label>Материал</Label>
              <Input
                value={form.materialMn}
                onChange={(e) =>
                  setForm({ ...form, materialMn: e.target.value, material: e.target.value })
                }
                placeholder="100% Органик хөвөн"
              />
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

            <div className="space-y-3 border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasColorCategory"
                  checked={form.hasColorCategory}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setForm({ ...form, hasColorCategory: checked, colorOptions: checked ? form.colorOptions : [] });
                    if (!checked) {
                      setVariants((prev) => prev.map((v) => ({ ...v, color: "", colorMn: "" })));
                    }
                  }}
                />
                <Label htmlFor="hasColorCategory">Өнгөний ангилалтай</Label>
              </div>

              {form.hasColorCategory && (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value)}
                      placeholder="Жишээ: Цагаан, Улбар шар"
                    />
                    <Button type="button" variant="outline" onClick={() => addColorOption()}>Нэмэх</Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((c) => (
                      <Button
                        key={c}
                        type="button"
                        variant={form.colorOptions.includes(c) ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => addColorOption(c)}
                        disabled={form.colorOptions.includes(c)}
                      >
                        {c}
                      </Button>
                    ))}
                  </div>

                  {form.colorOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.colorOptions.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/80"
                          onClick={() => removeColorOption(c)}
                          title="Устгах"
                        >
                          {c} ×
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
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
                className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-secondary/50 rounded-lg relative"
              >
                <div>
                  <Label className="text-xs">Хэмжээ</Label>
                  <Select
                    value={variant.size || "__none__"}
                    onValueChange={(v) => updateVariant(i, "size", v === "__none__" ? "" : (v ?? ""))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((s) => (
                        <SelectItem key={s || "__none__"} value={s || "__none__"}>
                          {s || "Хэмжээгүй"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Өнгө</Label>
                  {form.hasColorCategory ? (
                    <Select
                      value={(variant.colorMn || variant.color) || "__none__"}
                      onValueChange={(v) => {
                        const value = v && v !== "__none__" ? v : "";
                        updateVariant(i, "colorMn", value);
                        updateVariant(i, "color", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Өнгө сонгох" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Өнгөгүй</SelectItem>
                        {form.colorOptions.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={variant.colorMn}
                      onChange={(e) => {
                        updateVariant(i, "colorMn", e.target.value);
                        updateVariant(i, "color", e.target.value);
                      }}
                      placeholder="Цагаан"
                    />
                  )}
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
