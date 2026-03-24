"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Users,
  MousePointerClick,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface AnalyticsData {
  stats: {
    pageviews: { value: number; prev: number };
    visitors: { value: number; prev: number };
    visits: { value: number; prev: number };
    bounces: { value: number; prev: number };
    totaltime: { value: number; prev: number };
  } | null;
  pageviews: {
    pageviews: Array<{ x: string; y: number }>;
    sessions: Array<{ x: string; y: number }>;
  } | null;
  pages: Array<{ x: string; y: number }>;
  referrers: Array<{ x: string; y: number }>;
  devices: Array<{ x: string; y: number }>;
  countries: Array<{ x: string; y: number }>;
  browsers: Array<{ x: string; y: number }>;
  active: number;
  period: string;
}

function ChangeIndicator({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return null;
  const change = ((current - prev) / prev) * 100;
  if (Math.abs(change) < 0.5) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-0.5">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  }
  return change > 0 ? (
    <span className="text-xs text-green-600 flex items-center gap-0.5">
      <ArrowUp className="h-3 w-3" /> {Math.round(change)}%
    </span>
  ) : (
    <span className="text-xs text-red-500 flex items-center gap-0.5">
      <ArrowDown className="h-3 w-3" /> {Math.abs(Math.round(change))}%
    </span>
  );
}

function DeviceIcon({ device }: { device: string }) {
  const d = device.toLowerCase();
  if (d === "mobile") return <Smartphone className="h-4 w-4" />;
  if (d === "tablet") return <Tablet className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
}

const COUNTRY_NAMES: Record<string, string> = {
  MN: "Монгол",
  US: "АНУ",
  KR: "Солонгос",
  CN: "Хятад",
  JP: "Япон",
  RU: "Орос",
  DE: "Герман",
  GB: "Англи",
  FR: "Франц",
  AU: "Австрали",
};

export function AnalyticsPanel() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState("7d");

  const fetchData = useCallback(async (p: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      const json = await res.json();
      setData(json);
      if (json.error === "Analytics unavailable") {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const handlePeriodChange = (value: string | null) => {
    if (value) {
      setPeriod(value);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Аналитик ачааллаж байна...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium mb-1">Аналитик холбогдоогүй</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Umami серверийг тохируулна уу. Доорх зааврын дагуу .env.local файлд
            UMAMI_API_URL, UMAMI_WEBSITE_ID тохиргоог нэмнэ үү.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { stats, pageviews, pages, referrers, devices, countries, browsers, active } = data;
  const maxPageviews = pageviews
    ? Math.max(...pageviews.pageviews.map((p) => p.y), 1)
    : 1;
  const bounceRate = stats.visits.value > 0
    ? Math.round((stats.bounces.value / stats.visits.value) * 100)
    : 0;
  const avgTime = stats.visits.value > 0
    ? Math.round(stats.totaltime.value / stats.visits.value)
    : 0;

  return (
    <div className="space-y-4">
      {/* Header with period select */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base">Вэб аналитик</h3>
          {active > 0 && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              <Activity className="h-3 w-3" />
              {active} идэвхтэй
            </span>
          )}
        </div>
        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 цаг</SelectItem>
            <SelectItem value="7d">7 хоног</SelectItem>
            <SelectItem value="30d">30 хоног</SelectItem>
            <SelectItem value="90d">90 хоног</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Хандалт</span>
              <Eye className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold">{stats.pageviews.value.toLocaleString()}</p>
            <ChangeIndicator current={stats.pageviews.value} prev={stats.pageviews.prev} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Зочид</span>
              <Users className="h-3.5 w-3.5 text-green-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold">{stats.visitors.value.toLocaleString()}</p>
            <ChangeIndicator current={stats.visitors.value} prev={stats.visitors.prev} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Бууралт</span>
              <MousePointerClick className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold">{bounceRate}%</p>
            <ChangeIndicator current={stats.bounces.value} prev={stats.bounces.prev} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Дундаж хугацаа</span>
              <Clock className="h-3.5 w-3.5 text-purple-500" />
            </div>
            <p className="text-lg sm:text-xl font-bold">
              {avgTime >= 60 ? `${Math.floor(avgTime / 60)}м ${avgTime % 60}с` : `${avgTime}с`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pageview Chart (CSS bars) */}
      {pageviews && pageviews.pageviews.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Хандалтын график</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[2px] sm:gap-1 h-32">
              {pageviews.pageviews.map((pv, i) => {
                const height = Math.max((pv.y / maxPageviews) * 100, 2);
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end"
                  >
                    <div
                      className="w-full bg-primary/70 rounded-t-sm hover:bg-primary transition-colors cursor-default"
                      style={{ height: `${height}%` }}
                      title={`${pv.x}: ${pv.y} хандалт`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">
                {pageviews.pageviews[0]?.x?.slice(5) || ""}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {pageviews.pageviews[pageviews.pageviews.length - 1]?.x?.slice(5) || ""}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Pages */}
        {pages.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Түгээмэл хуудас</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pages.slice(0, 8).map((page) => (
                  <div key={page.x} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1 mr-2 text-muted-foreground">
                      {page.x}
                    </span>
                    <span className="text-sm font-medium shrink-0">{page.y}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referrers */}
        {referrers.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Эх сурвалж</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {referrers.slice(0, 8).map((ref) => (
                  <div key={ref.x} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1 mr-2">
                      <Globe className="h-3.5 w-3.5 inline mr-1.5 text-muted-foreground" />
                      {ref.x || "Шууд хандалт"}
                    </span>
                    <span className="text-sm font-medium shrink-0">{ref.y}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Devices */}
        {devices.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Төхөөрөмж</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.map((device) => {
                  const total = devices.reduce((s, d) => s + d.y, 0);
                  const pct = total > 0 ? Math.round((device.y / total) * 100) : 0;
                  return (
                    <div key={device.x}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm flex items-center gap-1.5">
                          <DeviceIcon device={device.x} />
                          {device.x === "mobile" ? "Утас" : device.x === "tablet" ? "Таблет" : "Компьютер"}
                        </span>
                        <span className="text-sm text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Countries */}
        {countries.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Улс орон</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {countries.slice(0, 8).map((country) => (
                  <div key={country.x} className="flex items-center justify-between">
                    <span className="text-sm">
                      {COUNTRY_NAMES[country.x] || country.x}
                    </span>
                    <span className="text-sm font-medium">{country.y}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
