"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, UserPlus, TrendingUp, MessageSquare,
  UserCheck, ExternalLink, MessageCircle,
} from "lucide-react";

import {
  StatsCard, ReportCard, ReportTable, ReportTableRow, ReportTableCell,
  ReportDatePicker, ReportPagination, ReportPageWrapper, ChartContainer,
  StatusBadge, CustomTooltip, ExportCSVButton, ReportSkeleton, EmptyState,
  useReportData, formatTime, CHART_COLORS, CHART_THEME, PLATFORM_COLORS,
} from "@/app/components/Report/ReportShared";

export default function ContactsChannelsReport() {
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [range, setRange] = useState([
    { startDate: thirtyDaysAgo, endDate: new Date(), key: "selection" },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch both APIs
  const { data: contactData, isLoading: contactLoading } = useReportData("/api/reports/contacts", range);
  const { data: channelData, isLoading: channelLoading } = useReportData("/api/reports/channels", range);

  if (contactLoading || channelLoading) return <ReportSkeleton />;

  // Contact data
  const contactChartData = contactData?.chartData || [];
  const channelDist = contactData?.channelDistribution || [];
  const recentContacts = contactData?.recentContacts || [];
  const contactStats = contactData?.stats || {};

  // Channel data
  const channels = channelData?.channelData || [];
  const trendData = channelData?.trendData || [];
  const platforms = channelData?.platforms || [];
  const platformDist = channelData?.platformDistribution || [];
  const channelStats = channelData?.stats || {};

  // Color helpers
  const coloredChannelDist = channelDist.map((ch) => ({
    ...ch,
    color: PLATFORM_COLORS[ch.name] || CHART_COLORS.purple,
  }));

  const coloredPlatformDist = platformDist.map((p) => ({
    ...p,
    color: PLATFORM_COLORS[p.name] || CHART_COLORS.purple,
  }));

  const platformAreaColors = {};
  platforms.forEach((p, i) => {
    platformAreaColors[p] = PLATFORM_COLORS[p] || Object.values(CHART_COLORS)[i % Object.values(CHART_COLORS).length];
  });

  const paginatedContacts = recentContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <ReportPageWrapper
      title="Contacts"
      subtitle="Customer Acquisition Analytics"
      icon={Users}
      headerActions={<ReportDatePicker range={range} setRange={setRange} />}
      kpiCards={
        <>
          <StatsCard label="New Contacts" value={contactStats.totalNew || 0} icon={UserPlus} color="#4ade80" subtitle={`${contactChartData.length} days`} />
          <StatsCard label="Active Returning" value={contactStats.activeReturning || 0} icon={UserCheck} color="#60a5fa" subtitle="engaged this period" />
          <StatsCard label="Top Channel" value={contactStats.topChannel || "-"} icon={MessageCircle} color="#22d3ee" subtitle="most acquisitions" />
        </>
      }
    >

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ReportCard title="New Contacts Trend" tooltip="จำนวนลูกค้าใหม่ที่เข้ามาในแต่ละวัน" className="xl:col-span-2">
          <ChartContainer height={300}>
            {contactChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={contactChartData}>
                  <defs>
                    <linearGradient id="gradientContacts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_THEME.gridStroke} strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                  <YAxis stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="newContacts" name="New Contacts" stroke={CHART_COLORS.green} strokeWidth={2.5} fillOpacity={1} fill="url(#gradientContacts)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No contact data" subtitle="No new contacts in selected range" />}
          </ChartContainer>
        </ReportCard>

        <ReportCard title="Acquisition by Channel" tooltip="สัดส่วนลูกค้าใหม่แยกตามช่องทาง">
          <ChartContainer height={300}>
            {coloredChannelDist.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="65%">
                  <PieChart>
                    <Pie data={coloredChannelDist} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                      {coloredChannelDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-2">
                  {coloredChannelDist.map((ch, i) => {
                    const total = coloredChannelDist.reduce((s, c) => s + c.value, 0);
                    const pct = total > 0 ? ((ch.value / total) * 100).toFixed(0) : "0";
                    return (
                      <div key={i} className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ch.color }} />
                          <span className="text-white/50 text-xs font-medium">{ch.name}</span>
                        </div>
                        <span className="text-white font-bold text-xs">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : <EmptyState title="No channel data" />}
          </ChartContainer>
        </ReportCard>
      </div>



      <ReportCard
        title="New Customer Log"
        tooltip="รายละเอียดลูกค้าใหม่ในช่วงที่เลือก"
        actions={<ExportCSVButton data={recentContacts} filename="contacts_report" />}
      >
        <ReportTable headers={["Customer", "Email", "Channel", "Company", "Date"]}>
          {paginatedContacts.length > 0 ? (
            paginatedContacts.map((row, i) => (
              <ReportTableRow key={i}>
                <ReportTableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#BE7EC7]/15 flex items-center justify-center text-[#BE7EC7] text-xs font-black">
                      {row.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <span className="text-white font-bold text-sm">{row.name}</span>
                  </div>
                </ReportTableCell>
                <ReportTableCell><span className="text-white/50">{row.email || "—"}</span></ReportTableCell>
                <ReportTableCell><StatusBadge text={row.channel} color={PLATFORM_COLORS[row.channel] || CHART_COLORS.blue} /></ReportTableCell>
                <ReportTableCell><span className="text-white/50">{row.company || "—"}</span></ReportTableCell>
                <ReportTableCell><span className="text-white/40 text-xs">{row.displayDate}</span></ReportTableCell>
              </ReportTableRow>
            ))
          ) : null}
        </ReportTable>
        <ReportPagination totalItems={recentContacts.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </ReportCard>
    </ReportPageWrapper>
  );
}