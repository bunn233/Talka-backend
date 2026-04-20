"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Timer, Zap, Target, TrendingDown, Award } from "lucide-react";

import {
  StatsCard, ReportCard, ReportPageWrapper, ChartContainer,
  ReportDatePicker, CustomTooltip, ProgressBar, ReportSkeleton, EmptyState,
  useReportData, formatTime, formatTimeFull,
  CHART_COLORS, CHART_THEME,
} from "@/app/components/Report/ReportShared";

export default function ResponsesReport() {
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [range, setRange] = useState([
    { startDate: thirtyDaysAgo, endDate: new Date(), key: "selection" },
  ]);

  const { data, isLoading } = useReportData("/api/reports/responses", range);

  if (isLoading) return <ReportSkeleton />;

  const chartData = data?.chartData || [];
  const timeBreakdown = data?.timeBreakdown || [];
  const stats = data?.stats || {};

  const SLA_TARGET = stats.slaTarget || 300;

  return (
    <ReportPageWrapper
      title="Response & SLA"
      subtitle="Response Time Analytics"
      icon={Timer}
      headerActions={<ReportDatePicker range={range} setRange={setRange} />}
      kpiCards={
        <>
          <StatsCard
            label="Avg. First Response"
            value={formatTime(stats.avgFRT || 0)}
            icon={Timer}
            color="#4ade80"
            subtitle={formatTimeFull(stats.avgFRT || 0)}
          />
          <StatsCard
            label="Fastest Day"
            value={stats.fastestDay ? formatTime(stats.fastestDay.time) : "—"}
            icon={Zap}
            color="#fbbf24"
            subtitle={stats.fastestDay?.date || "—"}
          />

          <StatsCard
            label="Avg. Responses/Chat"
            value={stats.avgResponseCount || "0"}
            icon={Award}
            color="#BE7EC7"
            subtitle="messages per conversation"
          />
        </>
      }
    >

      {/* Response Time Chart with SLA Line */}
      <ReportCard title="First Response Time Trend" tooltip="เวลาตอบกลับเฉลี่ยรายวัน — เส้นประสีแดงคือเป้าหมาย SLA (5 นาที)">
        <ChartContainer height={320}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gTime" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_THEME.gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="displayDate" stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                <YAxis stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => formatTime(v)} />
                <Tooltip content={<CustomTooltip formatter={(val) => formatTime(val)} />} />
                <Area type="monotone" dataKey="avgTime" name="Avg First Response" stroke={CHART_COLORS.green} strokeWidth={2.5} fillOpacity={1} fill="url(#gTime)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No response data" subtitle="No conversations with measurable response times" />}
        </ChartContainer>
      </ReportCard>

      {/* Response Count + Time Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ReportCard title="Response Count Trend" tooltip="จำนวนข้อความตอบกลับเฉลี่ยต่อแชท" className="xl:col-span-2">
          <ChartContainer height={280}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={chartData.length > 15 ? 6 : 14}>
                  <CartesianGrid stroke={CHART_THEME.gridStroke} strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                  <YAxis stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgResponse" name="Responses/Chat" fill={CHART_COLORS.purple} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </ChartContainer>
        </ReportCard>

        {/* Time Distribution */}
        <ReportCard title="Time Distribution" tooltip="การกระจายตัวของเวลาตอบกลับ">
          <div className="space-y-3">
            {timeBreakdown.length > 0 ? (
              timeBreakdown.map((b, i) => {
                const pctNum = parseFloat(b.pct);
                return (
                  <ProgressBar
                    key={i}
                    label={b.label}
                    value={pctNum}
                    maxValue={100}
                    color={pctNum > 30 ? CHART_COLORS.red : pctNum > 15 ? CHART_COLORS.amber : CHART_COLORS.green}
                  />
                );
              })
            ) : (
              <EmptyState title="No data" />
            )}
          </div>
        </ReportCard>
      </div>
    </ReportPageWrapper>
  );
}