"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Users, MessageSquare, Timer, TrendingUp, BarChart3,
  ArrowRight, CheckCircle2, Activity, Clock, Flame, Moon,
} from "lucide-react";
import Link from "next/link";

import {
  StatsCard, ReportCard, ChartContainer, StatusBadge,
  ReportPageWrapper, CustomTooltip, ReportSkeleton,
  CHART_COLORS, CHART_THEME,
} from "@/app/components/Report/ReportShared";

const LINK_CARDS = [
  { href: "/Report/contacts", label: "Contacts & Channels", desc: "Customer acquisition & platform analytics", icon: Users, color: CHART_COLORS.green },
  { href: "/Report/conversation", label: "Conversations & Messages", desc: "Chat session & message flow analytics", icon: MessageSquare, color: CHART_COLORS.blue },
  { href: "/Report/responses", label: "Response Time", desc: "Response time analytics", icon: Timer, color: CHART_COLORS.amber },
  { href: "/Report/users", label: "Team Performance", desc: "Agent productivity", icon: Activity, color: CHART_COLORS.cyan },
  { href: "/Report/aitoken", label: "AI Usage", desc: "Token consumption analytics", icon: TrendingUp, color: CHART_COLORS.purple },
];

// Heatmap Component
function PeakHoursHeatmap({ data, peakHour, quietHour }) {
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  const getColor = (value) => {
    if (value === 0) return "rgba(255,255,255,0.02)";
    const intensity = Math.min(value / maxVal, 1);
    if (intensity < 0.25) return `rgba(190,126,199,${0.1 + intensity * 0.3})`;
    if (intensity < 0.5) return `rgba(190,126,199,${0.2 + intensity * 0.4})`;
    if (intensity < 0.75) return `rgba(249,115,22,${0.3 + intensity * 0.4})`;
    return `rgba(239,68,68,${0.5 + intensity * 0.5})`;
  };

  const getVal = (day, hour) => {
    const cell = data.find((d) => d.day === day && d.hour === hour);
    return cell?.value || 0;
  };

  return (
    <div className="space-y-4">
      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Hour Labels */}
          <div className="flex items-center mb-1.5 pl-12">
            {HOURS.filter((h) => h % 3 === 0).map((h) => (
              <div
                key={h}
                className="text-[9px] font-bold text-white/30 uppercase tracking-widest"
                style={{ width: `${(100 / 8)}%`, textAlign: "left" }}
              >
                {h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`}
              </div>
            ))}
          </div>

          {/* Rows */}
          {DAYS.map((day, dayIdx) => (
            <div key={day} className="flex items-center gap-1.5 mb-1">
              <div className="text-[10px] font-black text-white/40 uppercase tracking-widest w-10 shrink-0 text-right pr-1">
                {day}
              </div>
              <div className="flex-1 flex gap-0.5">
                {HOURS.map((hour) => {
                  const val = getVal(dayIdx, hour);
                  return (
                    <div
                      key={hour}
                      className="flex-1 h-6 rounded-[4px] transition-all duration-200 hover:scale-110 hover:z-10 cursor-default relative group"
                      style={{ backgroundColor: getColor(val) }}
                      title={`${day} ${hour}:00 — ${val} messages`}
                    >
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50">
                        <div className="bg-[#12101c] border border-white/10 rounded-lg px-2 py-1 text-[9px] text-white font-bold whitespace-nowrap shadow-xl">
                          {val}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame size={12} className="text-orange-400" />
            <span className="text-[10px] font-bold text-white/50">
              Peak: <span className="text-orange-400">{peakHour?.day} {peakHour?.hour}</span> ({peakHour?.count} msgs)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Moon size={12} className="text-blue-400" />
            <span className="text-[10px] font-bold text-white/50">
              Quiet: <span className="text-blue-400">{quietHour?.day} {quietHour?.hour}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-white/20">Less</span>
          {[0.05, 0.15, 0.3, 0.5, 0.8].map((v, i) => (
            <div key={i} className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: getColor(maxVal * v) }} />
          ))}
          <span className="text-[9px] text-white/20">More</span>
        </div>
      </div>
    </div>
  );
}

export default function ReportOverview() {
  const [data, setData] = useState(null);
  const [peakData, setPeakData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [overviewRes, peakRes] = await Promise.all([
          fetch("/api/reports/overview"),
          fetch("/api/reports/peak-hours"),
        ]);
        
        if (overviewRes.ok) {
          const json = await overviewRes.json();
          setData(json);
        }
        if (peakRes.ok) {
          const json = await peakRes.json();
          setPeakData(json);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (isLoading) return <ReportSkeleton />;

  const kpi = data?.kpi || {};
  const trendData = data?.trendData || [];
  const statusDist = data?.statusDistribution || [];

  const STATUS_COLORS = {
    NEW: CHART_COLORS.cyan,
    OPEN: CHART_COLORS.green,
    PENDING: CHART_COLORS.amber,
    CLOSED: CHART_COLORS.blue,
    RESOLVED: CHART_COLORS.purple,
  };

  return (
    <ReportPageWrapper
      title="Report Overview"
      subtitle="Key Performance Summary — Last 30 Days"
      icon={LayoutDashboard}
      kpiCards={
        <>
          <StatsCard label="New Contacts" value={kpi.newContacts?.value || 0} icon={Users} color="#4ade80" subtitle="in last 30 days" trend={kpi.newContacts?.trend} />
          <StatsCard label="Total Conversations" value={kpi.totalConversations?.value || 0} icon={MessageSquare} color="#60a5fa" subtitle="chat sessions" trend={kpi.totalConversations?.trend} />
          <StatsCard label="Resolution Rate" value={`${kpi.resolutionRate?.value || 0}%`} icon={CheckCircle2} color="#fbbf24" subtitle="closed / total" />
          <StatsCard label="Total Messages" value={(kpi.totalMessages?.value || 0).toLocaleString()} icon={BarChart3} color="#BE7EC7" subtitle="all channels" />
        </>
      }
    >

      {/* 7-Day Trend Chart + Status Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ReportCard
          title="7-Day Activity Trend"
          tooltip="ภาพรวมกิจกรรม 7 วันล่าสุด — ลูกค้าใหม่, การสนทนา, ข้อความ"
          className="xl:col-span-2"
        >
          <ChartContainer height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gContacts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gConvos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMsgs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.purple} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={CHART_COLORS.purple} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_THEME.gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                <YAxis stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="contacts" name="Contacts" stroke={CHART_COLORS.green} strokeWidth={2} fillOpacity={1} fill="url(#gContacts)" />
                <Area type="monotone" dataKey="conversations" name="Conversations" stroke={CHART_COLORS.blue} strokeWidth={2} fillOpacity={1} fill="url(#gConvos)" />
                <Area type="monotone" dataKey="messages" name="Messages" stroke={CHART_COLORS.purple} strokeWidth={2} fillOpacity={1} fill="url(#gMsgs)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </ReportCard>

        <ReportCard title="Conversation Status" tooltip="สัดส่วนสถานะการสนทนา 30 วันล่าสุด">
          <ChartContainer height={320}>
            <ResponsiveContainer width="100%" height="65%">
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                  {statusDist.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || CHART_COLORS.purple} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 mt-2">
              {statusDist.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.name] || CHART_COLORS.purple }} />
                    <span className="text-white/50 text-xs font-medium">{s.name}</span>
                  </div>
                  <span className="text-white font-bold text-xs">{s.value}</span>
                </div>
              ))}
            </div>
          </ChartContainer>
        </ReportCard>
      </div>

      {/* Peak Hours Heatmap */}
      {peakData && (
        <ReportCard 
          title="Peak Activity Hours" 
          tooltip="แผนที่ความร้อน แสดงช่วงเวลาที่ลูกค้าทักเข้ามามากที่สุด ใช้วางแผนจัดกะพนักงาน"
        >
          <PeakHoursHeatmap
            data={peakData.heatmapData || []}
            peakHour={peakData.peakHour}
            quietHour={peakData.quietHour}
          />
        </ReportCard>
      )}

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4 px-1">
          Detailed Reports
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {LINK_CARDS.map((card) => (
            <Link key={card.href} href={card.href}>
              <div className="group bg-[#1F192E] border border-white/5 hover:border-white/15 rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:shadow-black/10 cursor-pointer">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}15` }}
                >
                  <card.icon size={18} style={{ color: card.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{card.label}</p>
                  <p className="text-white/30 text-[10px] font-medium mt-0.5">{card.desc}</p>
                </div>
                <ArrowRight size={14} className="text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ReportPageWrapper>
  );
}
