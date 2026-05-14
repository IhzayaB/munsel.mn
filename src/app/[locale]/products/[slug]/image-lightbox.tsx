"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";

type ImageLightboxProps = {
  open: boolean;
  images: string[];
  selectedImage: number;
  setSelectedImage: (index: number) => void;
  onClose: () => void;
  displayName: string;
};

export function ImageLightbox({
  open,
  images,
  selectedImage,
  setSelectedImage,
  onClose,
  displayName,
}: ImageLightboxProps) {
  if (!open || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
        aria-label="Хаах"
      >
        <X className="h-6 w-6" />
      </button>
      {selectedImage > 0 && (
        <button
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImage(selectedImage - 1);
          }}
          aria-label="Өмнөх зураг"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}
      {selectedImage < images.length - 1 && (
        <button
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 z-10"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImage(selectedImage + 1);
          }}
          aria-label="Дараагийн зураг"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}
      <div className="relative w-full h-full max-w-4xl max-h-[80vh] m-4" onClick={(e) => e.stopPropagation()}>
        <Image
          src={images[selectedImage]}
          alt={displayName}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(i);
              }}
              className={`h-2 rounded-full transition-all ${
                selectedImage === i ? "w-6 bg-white" : "w-2 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
