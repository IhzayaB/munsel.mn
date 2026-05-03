"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { useRouter } from "@/i18n/routing";

interface SearchResult {
  id: string;
  name: string;
  nameMn: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  image: string | null;
  category: string | null;
}

interface SearchOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RECENT_SEARCHES_KEY = "pajama-recent-searches";
const QUICK_SUGGESTIONS = ["Комбинезон", "Малгай", "Пижама", "Оймс", "0-3M"];

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const saveRecentSearch = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    try {
      const next = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 6);
      setRecentSearches(next);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  const loadRecentSearches = () => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((v) => typeof v === "string").slice(0, 6));
      }
    } catch {
      // ignore storage errors
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore storage errors
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (open) {
      loadRecentSearches();
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
      setSearched(false);
    }
  }, [open]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort();

    if (q.length < 1) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        setSearched(true);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        console.error("Search error:", e);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (slug: string) => {
    saveRecentSearch(query);
    onOpenChange(false);
    router.push(`/products/${slug}`);
  };

  const handleSeeAll = () => {
    saveRecentSearch(query);
    onOpenChange(false);
    router.push("/products");
  };

  const handleQuickSearch = (value: string) => {
    setQuery(value);
    saveRecentSearch(value);
    inputRef.current?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden !rounded-xl" showCloseButton={false}>
        {/* Search input */}
        <div className="flex items-center border-b px-4">
          <Search className="h-5 w-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Бүтээгдэхүүн хайх..."
            className="border-0 focus-visible:ring-0 h-14 text-base pl-3"
            onKeyDown={(e) => {
              if (e.key === "Escape") onOpenChange(false);
              if (e.key === "Enter" && results.length > 0) {
                handleSelect(results[0].slug);
              }
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Арилгах"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-muted-foreground text-sm">
                &ldquo;{query}&rdquo; хайлтаар илэрц олдсонгүй
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-2">
              {results.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.slug)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  {item.image ? (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-secondary shrink-0">
                      <Image
                        src={item.image}
                        alt={item.nameMn}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-secondary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.nameMn}</p>
                    {item.category && (
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-primary shrink-0">
                    {formatPrice(item.price)}
                  </p>
                </button>
              ))}

              <button
                onClick={handleSeeAll}
                className="w-full text-center py-3 text-sm text-primary font-medium hover:bg-muted/50 transition-colors border-t"
              >
                Бүх бүтээгдэхүүн харах →
              </button>
            </div>
          )}

          {!loading && !searched && (
            <div className="py-4 px-4 space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  Бүтээгдэхүүний нэр оруулна уу
                </p>
              </div>

              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground">Сүүлд хайсан</p>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Арилгах
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleQuickSearch(item)}
                        className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">Санал болгох хайлт</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_SUGGESTIONS.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleQuickSearch(item)}
                      className="px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-muted"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
