"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Info, Calendar, ChevronLeft, ChevronRight, Download, Search, Loader2 } from "lucide-react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

// ─────────────────────────────────────────
// Chart Color Palette & Theme
// ─────────────────────────────────────────
export const CHART_COLORS = {
  purple: "#BE7EC7",
  green: "#4ade80",
  blue: "#60a5fa",
  amber: "#fbbf24",
  red: "#ef4444",
  cyan: "#22d3ee",
  orange: "#f97316",
  pink: "#f472b6",
};

export const CHART_THEME = {
  fontSize: "11px",
  gridStroke: "rgba(255,255,255,0.05)",
  axisStroke: "rgba(255,255,255,0.15)",
  tooltipBg: "#12101c",
  tooltipBorder: "rgba(255,255,255,0.1)",
};

// Platform-specific colors
export const PLATFORM_COLORS = {
  LINE: "#06c755",
  Facebook: "#0866FF",
  Telegram: "#0088cc",
  Instagram: "#E1306C",
  Unknown: "#60a5fa",
  Direct: "#BE7EC7",
};

// ─────────────────────────────────────────
// Custom Tooltip (shared across all charts)
// ─────────────────────────────────────────
export function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#12101c] border border-white/10 rounded-xl px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="text-white font-bold">
            {formatter ? formatter(p.value, p.name) : typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Stats Card — Flat design for nested CSS Grid
// ─────────────────────────────────────────
export function StatsCard({ label, value, icon: Icon, color = "#BE7EC7", subtitle, trend }) {
  return (
    <div className="relative p-6 flex flex-col justify-between group transition-all duration-300 hover:bg-white/[0.02]">
      <div className="flex items-center justify-between mb-3 z-10 w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 border border-white/5">
            <Icon size={14} style={{ color }} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{label}</p>
        </div>
        
        {trend !== undefined && trend !== null && Number(trend) !== 0 && (
          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${Number(trend) > 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
            {Number(trend) > 0 ? "↑" : "↓"} {Math.abs(Number(trend)).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="z-10 w-full">
        <p className="text-3xl font-black text-white tracking-tighter truncate">{value}</p>
        {subtitle && <p className="text-[10px] text-white/30 font-bold mt-1 uppercase tracking-widest truncate">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Report Section Card — Wraps each section
// ─────────────────────────────────────────
export function ReportCard({ title, tooltip, children, className = "", actions }) {
  return (
    <div className={`relative bg-[#1c1626]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-7 transition-all duration-300 shadow-xl overflow-hidden ${className}`}>
      
      {/* Top reflection highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50 z-0"></div>

      {(title || actions) && (
        <div className="flex md:flex-row flex-col gap-4 md:items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-3">
            {title && (
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-gradient-to-b from-[#BE7EC7] to-[#804289] rounded-full"></div>
                <h2 className="text-white font-bold text-lg tracking-tight">{title}</h2>
              </div>
            )}
            {tooltip && <InfoTooltip text={tooltip} />}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────
// Premium Table
// ─────────────────────────────────────────
export function ReportTable({ headers, children, emptyText = "No Available Data" }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {headers.map((h, i) => (
              <th key={i} className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-[0.15em] text-white/40">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-white/70">
          {children || (
            <tr>
              <td colSpan={headers.length} className="text-center py-10 text-white/20 text-sm font-medium">
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Table Row
export function ReportTableRow({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </tr>
  );
}

// Table Cell
export function ReportTableCell({ children, className = "" }) {
  return <td className={`py-3 px-4 text-sm ${className}`}>{children}</td>;
}

// ─────────────────────────────────────────
// Date Range Picker
// ─────────────────────────────────────────
export function ReportDatePicker({ range, setRange }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setShowCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="relative" ref={calendarRef}>
      <button
        onClick={() => setShowCalendar((s) => !s)}
        className="flex items-center gap-2.5 bg-[#1F192E] border border-white/10 hover:border-[#BE7EC7]/30 px-4 py-2.5 rounded-2xl text-white/70 text-xs font-bold transition-all group"
      >
        <Calendar size={14} className="text-[#BE7EC7] group-hover:scale-110 transition-transform" />
        <span>{fmt(range[0].startDate)} — {fmt(range[0].endDate)}</span>
      </button>

      {showCalendar && (
        <div className="absolute top-12 right-0 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-[#12101c] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
            <div className="transform scale-[0.85] origin-top-left">
              <DateRange
                editableDateInputs
                onChange={(item) => setRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={range}
                rangeColors={["#BE7EC7"]}
              />
            </div>
            <div className="px-3 pb-3 -mt-4">
              <button
                onClick={() => setShowCalendar(false)}
                className="w-full py-2.5 rounded-xl bg-[#BE7EC7] hover:bg-[#BE7EC7]/80 text-white text-xs font-black uppercase tracking-widest transition-all"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────
export function ReportPagination({ totalItems, itemsPerPage, currentPage, setCurrentPage }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  return (
    <div className="flex justify-end items-center mt-4 pt-4 border-t border-white/5 gap-3">
      <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
        {totalItems === 0
          ? "0 items"
          : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="w-8 h-8 rounded-xl bg-[#1F192E] border border-white/5 hover:bg-[#BE7EC7]/20 hover:text-[#BE7EC7] text-white/40 flex items-center justify-center transition-all disabled:opacity-20"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 rounded-xl bg-[#1F192E] border border-white/5 hover:bg-[#BE7EC7]/20 hover:text-[#BE7EC7] text-white/40 flex items-center justify-center transition-all disabled:opacity-20"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Info Tooltip
// ─────────────────────────────────────────
export function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <Info
        className="w-4 h-4 text-white/20 cursor-pointer hover:text-[#BE7EC7] transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-[#12101c] border border-white/10 text-white/70 text-[11px] p-3 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] z-50 leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#12101c] border-r border-b border-white/10 rotate-45 -mt-1" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Unified Report Page Wrapper (The modular floating layout)
// ─────────────────────────────────────────
export function ReportPageWrapper({ title, subtitle, icon: Icon, headerActions, kpiCards, children }) {
  return (
    <div className="w-full flex flex-col gap-6 pl-1 lg:pl-5 max-w-[1600px] min-h-[calc(100vh-2rem)]">
      
      {/* Unified Control Panel (Header + KPIs) */}
      <div className="flex flex-col bg-[#1c1626]/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-xl overflow-hidden relative">
        {/* Subtle background glow for header */}
        <div className="absolute left-0 top-0 w-[500px] h-full bg-gradient-to-br from-[#BE7EC7]/10 to-transparent pointer-events-none z-0"></div>

        {/* Top Bar (Title & Actions) */}
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 lg:p-7 relative z-10 ${kpiCards ? 'border-b border-white/[0.04]' : ''}`}>
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#BE7EC7] to-[#804289] flex items-center justify-center shadow-[0_0_20px_rgba(190,126,199,0.4)] shrink-0 border border-white/20">
              <Icon className="text-white drop-shadow-md" size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-wide">{title}</h1>
              <p className="text-[#BE7EC7]/80 text-[11px] mt-1 font-bold tracking-widest uppercase">{subtitle}</p>
            </div>
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>

        {/* KPI Panel Grid (Nested Below Top Bar) */}
        {kpiCards && (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-white/[0.04] bg-white/[0.01] relative z-10">
            {kpiCards}
          </div>
        )}
      </div>

      {/* Main Content Area (Floating Layout for Charts) */}
      <div className="flex-1 space-y-6 pb-20">
        {children}
      </div>
      
    </div>
  );
}

// ─────────────────────────────────────────
// Header (Legacy - will be replaced by Wrapper, keeping for compatibility during transition)
// ─────────────────────────────────────────
export function ReportPageHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-12 h-12 rounded-2xl bg-[#BE7EC7]/15 flex items-center justify-center shadow-inner">
        <Icon size={22} className="text-[#BE7EC7]" />
      </div>
      <div>
        <h1 className="text-white font-black text-xl tracking-tight leading-none">{title}</h1>
        <p className="text-white/30 text-[10px] mt-1.5 font-bold uppercase tracking-[0.2em]">{subtitle}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Chart wrapper with consistent styling
// ─────────────────────────────────────────
export function ChartContainer({ children, height = 280 }) {
  return (
    <div className="bg-[#1a1528]/50 rounded-2xl border border-white/[0.03] p-4" style={{ height }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────
// Badge for status / labels
// ─────────────────────────────────────────
export function StatusBadge({ text, color = "#BE7EC7" }) {
  return (
    <span
      className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`,
      }}
    >
      {text}
    </span>
  );
}

// ─────────────────────────────────────────
// Tab Filter (reusable filter tabs)
// ─────────────────────────────────────────
export function TabFilter({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex items-center gap-1 bg-[#1a1528]/60 w-fit rounded-xl p-1 border border-white/5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
            activeTab === tab.id
              ? "bg-[#BE7EC7] text-white shadow-lg"
              : "text-white/30 hover:text-white/60"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 ${activeTab === tab.id ? "text-white/70" : "text-white/20"}`}>
              ({tab.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Export CSV Button
// ─────────────────────────────────────────
export function ExportCSVButton({ data, filename = "report", headers }) {
  const handleExport = () => {
    if (!data || data.length === 0) return;

    const keys = headers || Object.keys(data[0]);
    const csvHeader = keys.join(",");
    const csvRows = data.map((row) =>
      keys.map((key) => {
        const val = row[key];
        if (val === null || val === undefined) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    );

    const csv = [csvHeader, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className="flex items-center gap-2 bg-[#1F192E] border border-white/10 hover:border-[#BE7EC7]/30 px-3 py-2 rounded-xl text-white/50 hover:text-[#BE7EC7] text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
    >
      <Download size={12} />
      Export Excel/CSV
    </button>
  );
}

// ─────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────
export function ProgressBar({ label, value, maxValue = 100, color = CHART_COLORS.purple, suffix = "%" }) {
  const pct = maxValue > 0 ? Math.min((value / maxValue) * 100, 100) : 0;
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1">
        <span className="text-white/50 text-xs font-medium">{label}</span>
        <span className="text-white font-bold text-xs">
          {typeof value === "number" ? value.toFixed(1) : value}{suffix}
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────
export function ReportSkeleton() {
  return (
    <div className="space-y-6 px-2 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/5" />
        <div className="space-y-2">
          <div className="w-40 h-5 bg-white/5 rounded-lg" />
          <div className="w-24 h-3 bg-white/5 rounded" />
        </div>
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1F192E] border border-white/5 rounded-[1.8rem] p-5 h-24" />
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="bg-[#161223] border border-white/5 rounded-[2rem] p-6 h-[400px]" />

      {/* Table skeleton */}
      <div className="bg-[#161223] border border-white/5 rounded-[2rem] p-6 h-[300px]" />
    </div>
  );
}

// ─────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────
export function EmptyState({ title = "No Data Available", subtitle = "Try adjusting the date range or filters" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
        <Search size={24} className="text-white/20" />
      </div>
      <h3 className="text-white/40 font-bold text-sm mb-1">{title}</h3>
      <p className="text-white/20 text-xs">{subtitle}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// useReportData hook — fetch data with date range
// ─────────────────────────────────────────
export function useReportData(apiPath, range) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const start = range[0].startDate.toISOString().split("T")[0];
      const end = range[0].endDate.toISOString().split("T")[0];
      const res = await fetch(`${apiPath}?start=${start}&end=${end}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(`Error fetching ${apiPath}:`, err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiPath, range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ─────────────────────────────────────────
// Time formatting helpers
// ─────────────────────────────────────────
export const formatTime = (sec) => {
  if (!sec || sec === 0) return "0s";
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
};

export const formatTimeFull = (sec) => {
  if (!sec) return "00:00:00";
  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};
