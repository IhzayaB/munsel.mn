"use client";

import { Ruler, X } from "lucide-react";

type SizeGuideModalProps = {
  open: boolean;
  onClose: () => void;
  selectedSize?: string | null;
};

const SIZE_GUIDE = [
  { size: "NB", age: "0 сар", weight: "2.5-3.5 кг", height: "45-55 см" },
  { size: "0-3M", age: "0-3 сар", weight: "3-6 кг", height: "55-62 см" },
  { size: "3-6M", age: "3-6 сар", weight: "6-8 кг", height: "62-68 см" },
  { size: "6-9M", age: "6-9 сар", weight: "8-9.5 кг", height: "68-74 см" },
  { size: "9-12M", age: "9-12 сар", weight: "9.5-11 кг", height: "74-80 см" },
  { size: "12-18M", age: "12-18 сар", weight: "11-12.5 кг", height: "80-86 см" },
  { size: "18-24M", age: "18-24 сар", weight: "12.5-14 кг", height: "86-92 см" },
];

export function SizeGuideModal({ open, onClose, selectedSize }: SizeGuideModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] overflow-y-auto p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Хэмжээний заавар
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-lg" aria-label="Хаах">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-semibold">Хэмжээ</th>
                <th className="text-left py-2 pr-4 font-semibold">Нас</th>
                <th className="text-left py-2 pr-4 font-semibold">Жин</th>
                <th className="text-left py-2 font-semibold">Өндөр</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_GUIDE.map((row) => (
                <tr
                  key={row.size}
                  className={`border-b last:border-0 ${selectedSize === row.size ? "bg-primary/10 font-medium" : ""}`}
                >
                  <td className="py-2.5 pr-4">{row.size}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{row.age}</td>
                  <td className="py-2.5 pr-4 text-muted-foreground">{row.weight}</td>
                  <td className="py-2.5 text-muted-foreground">{row.height}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          * Хэмжээ нь ойролцоо утга бөгөөд хүүхэд бүрийн биеийн хэмжээнээс хамаарч өөрчлөгдөж болно.
        </p>
      </div>
    </div>
  );
}
