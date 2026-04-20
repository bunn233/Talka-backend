"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Cpu, Coins, TrendingUp, Sparkles, BarChart3, AlertTriangle } from "lucide-react";

import {
  StatsCard, ReportCard, ReportTable, ReportTableRow, ReportTableCell,
  ReportDatePicker, ReportPageWrapper, ChartContainer,
  StatusBadge, CustomTooltip, ExportCSVButton, ReportSkeleton,
  CHART_COLORS, CHART_THEME,
} from "@/app/components/Report/ReportShared";

// 🟢 [BACKEND NOTE] AI Token data requires a new AiTokenLog model in Prisma.
// Until then, this page uses static placeholder data to show the layout.
// Once the model exists, replace with useReportData("/api/reports/ai-usage", range).

const placeholderChartData = [
  { day: "Day 1", tokens: 0 },
  { day: "Day 2", tokens: 0 },
  { day: "Day 3", tokens: 0 },
  { day: "Day 4", tokens: 0 },
  { day: "Day 5", tokens: 0 },
  { day: "Day 6", tokens: 0 },
  { day: "Day 7", tokens: 0 },
];

const placeholderBreakdown = [
  { feature: "Support Agent", tokens: 0, cost: 0, pct: 0 },
  { feature: "Receptionist", tokens: 0, cost: 0, pct: 0 },
  { feature: "Sales Agent", tokens: 0, cost: 0, pct: 0 },
];

export default function AiTokenReport() {
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 7);
  const [range, setRange] = useState([
    { startDate: thirtyDaysAgo, endDate: new Date(), key: "selection" },
  ]);
  const [chartData] = useState(placeholderChartData);
  const [breakdown] = useState(placeholderBreakdown);

  const totalTokens = breakdown.reduce((s, d) => s + d.tokens, 0);
  const totalCost = breakdown.reduce((s, d) => s + d.cost, 0);
  const todayTokens = chartData[chartData.length - 1]?.tokens || 0;
  const avgPerDay = chartData.length > 0 ? Math.round(chartData.reduce((s, d) => s + d.tokens, 0) / chartData.length) : 0;

  const pieData = breakdown.map((b, i) => ({
    name: b.feature,
    value: b.tokens,
    color: [CHART_COLORS.purple, CHART_COLORS.cyan, CHART_COLORS.amber][i],
  }));

  return (
    <ReportPageWrapper
      title="AI Usage Report"
      subtitle="Token Consumption Analytics"
      icon={Cpu}
      headerActions={<ReportDatePicker range={range} setRange={setRange} />}
      kpiCards={
        <>
          <StatsCard label="Total Tokens" value={totalTokens.toLocaleString()} icon={Coins} color="#BE7EC7" subtitle="in selected period" />
          <StatsCard label="Today's Usage" value={todayTokens.toLocaleString()} icon={Sparkles} color="#4ade80" subtitle="tokens consumed" />
          <StatsCard label="Avg. Per Day" value={avgPerDay.toLocaleString()} icon={TrendingUp} color="#60a5fa" subtitle="tokens/day" />
          <StatsCard label="Estimated Cost" value={`$${totalCost.toFixed(2)}`} icon={BarChart3} color="#fbbf24" subtitle="USD total" />
        </>
      }
    >
      {/* Infrastructure Alert */}
      <div className="bg-[#1c1626] border border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.15)] rounded-2xl p-4 flex items-start gap-3 relative z-10 mt-[-6px]">
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-400 text-xs font-bold">Awaiting Database Model</p>
          <p className="text-white/40 text-[11px] mt-0.5">
            AI Token logging requires an <code className="text-amber-400/70">AiTokenLog</code> model in Prisma. 
            Data shown below is placeholder. Once the model is created, this page will display real usage data.
          </p>
        </div>
      </div>

      {/* Token Usage Chart + Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ReportCard title="Token Usage Trend" tooltip="ปริมาณ Token ที่ใช้ต่อวัน" className="xl:col-span-2">
          <ChartContainer height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART_COLORS.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_THEME.gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                <YAxis stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tokens" name="Tokens" stroke={CHART_COLORS.purple} strokeWidth={2.5} fillOpacity={1} fill="url(#gTokens)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ReportCard>

        <ReportCard title="Usage by Feature" tooltip="สัดส่วนการใช้ Token แยกตาม AI Feature">
          <ChartContainer height={320}>
            <ResponsiveContainer width="100%" height="65%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2.5 mt-2">
              {pieData.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-white/50 text-xs font-medium">{p.name}</span>
                  </div>
                  <span className="text-white font-bold text-xs">
                    {totalTokens > 0 ? ((p.value / totalTokens) * 100).toFixed(0) : "0"}%
                  </span>
                </div>
              ))}
            </div>
          </ChartContainer>
        </ReportCard>
      </div>

      {/* Breakdown Table */}
      <ReportCard
        title="Usage Breakdown"
        tooltip="รายละเอียดการใช้ Token แบ่งตาม Feature"
        actions={<ExportCSVButton data={breakdown} filename="ai_usage" />}
      >
        <ReportTable headers={["AI Feature", "Tokens Used", "% of Total", "Estimated Cost", "Status"]}>
          {breakdown.map((item, i) => {
            const pct = totalTokens > 0 ? ((item.tokens / totalTokens) * 100).toFixed(1) : "0";
            return (
              <ReportTableRow key={i}>
                <ReportTableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#BE7EC7]/10 flex items-center justify-center">
                      <Sparkles size={14} className="text-[#BE7EC7]" />
                    </div>
                    <span className="text-white font-bold">{item.feature}</span>
                  </div>
                </ReportTableCell>
                <ReportTableCell><span className="text-white font-bold">{item.tokens.toLocaleString()}</span></ReportTableCell>
                <ReportTableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#BE7EC7]" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-white/50 text-xs">{pct}%</span>
                  </div>
                </ReportTableCell>
                <ReportTableCell><span className="text-emerald-400 font-bold">${item.cost.toFixed(2)}</span></ReportTableCell>
                <ReportTableCell>
                  <StatusBadge text={item.tokens > 0 ? "Active" : "Inactive"} color={item.tokens > 0 ? "#4ade80" : "#60a5fa"} />
                </ReportTableCell>
              </ReportTableRow>
            );
          })}
        </ReportTable>
      </ReportCard>

      {/* Daily Consumption Bar */}
      <ReportCard title="Daily Consumption" tooltip="แท่งกราฟแสดงปริมาณ Token รายวัน">
        <ChartContainer height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid stroke={CHART_THEME.gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="day" stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
              <YAxis stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="tokens" name="Tokens" fill={CHART_COLORS.cyan} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </ReportCard>
    </ReportPageWrapper>
  );
}