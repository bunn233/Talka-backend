"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  MessageSquare, CheckCircle2, Clock, Layers, Timer, PlayCircle,
  ArrowDownLeft, ArrowUpRight, Bot, Eye,
} from "lucide-react";

import {
  StatsCard, ReportCard, ReportTable, ReportTableRow, ReportTableCell,
  ReportDatePicker, ReportPagination, ReportPageWrapper, ChartContainer,
  StatusBadge, CustomTooltip, ExportCSVButton, TabFilter, ReportSkeleton, EmptyState,
  useReportData, formatTime, CHART_COLORS, CHART_THEME, PLATFORM_COLORS,
} from "@/app/components/Report/ReportShared";

const STATUS_COLORS = {
  NEW: CHART_COLORS.cyan,
  OPEN: CHART_COLORS.green,
  PENDING: CHART_COLORS.amber,
  CLOSED: CHART_COLORS.blue,
  RESOLVED: CHART_COLORS.purple,
};

export default function ConversationsReport() {
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [range, setRange] = useState([
    { startDate: thirtyDaysAgo, endDate: new Date(), key: "selection" },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch both conversations + messages data
  const { data: convoData, isLoading: convoLoading } = useReportData("/api/reports/conversations", range);
  const { data: msgData, isLoading: msgLoading } = useReportData("/api/reports/messages", range);

  if (convoLoading || msgLoading) return <ReportSkeleton />;

  // Conversations data
  const chartData = convoData?.chartData || [];
  const statusDist = convoData?.statusDistribution || [];
  const tableData = convoData?.tableData || [];
  const convoStats = convoData?.stats || {};

  // Messages data
  const msgChartData = msgData?.chartData || [];
  const typeDist = msgData?.typeDistribution || [];
  const msgStats = msgData?.stats || {};
  const readRate = msgStats.total > 0 ? ((msgStats.read / msgStats.total) * 100).toFixed(1) : "0";

  const TYPE_COLORS = {
    Text: CHART_COLORS.blue,
    Image: CHART_COLORS.green,
    File: CHART_COLORS.amber,
    Video: CHART_COLORS.purple,
    Audio: CHART_COLORS.cyan,
  };

  const paginated = tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <ReportPageWrapper
      title="Conversations & Messages"
      subtitle="Chat Session & Message Flow Analytics"
      icon={MessageSquare}
      headerActions={<ReportDatePicker range={range} setRange={setRange} />}
      kpiCards={
        <>
          <StatsCard label="Conversations" value={convoStats.total || 0} icon={Layers} color="#BE7EC7" subtitle="total sessions" />
          <StatsCard label="Open" value={convoStats.open || 0} icon={PlayCircle} color="#4ade80" subtitle="in progress" />
          <StatsCard label="Pending" value={convoStats.pending || 0} icon={Clock} color="#fbbf24" subtitle="waiting" />
          <StatsCard label="Resolved" value={convoStats.resolved || 0} icon={CheckCircle2} color="#60a5fa" subtitle="completed" />
          <StatsCard label="Messages" value={(msgStats.total || 0).toLocaleString()} icon={MessageSquare} color="#22d3ee" subtitle={`↓${msgStats.incoming || 0} ↑${msgStats.outgoing || 0} 🤖${msgStats.bot || 0}`} />
        </>
      }
    >
      {/* Conversation Trends + Status Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ReportCard title="Conversation Trends" tooltip="เทรนด์การเปิด/ปิดการสนทนารายวัน ครบทุกสถานะ" className="xl:col-span-2">
          <ChartContainer height={300}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gOpened" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gClosed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_THEME.gridStroke} strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                  <YAxis stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="opened" name="Opened" stroke={CHART_COLORS.green} strokeWidth={2} fillOpacity={1} fill="url(#gOpened)" />
                  <Area type="monotone" dataKey="closed" name="Closed" stroke={CHART_COLORS.blue} strokeWidth={2} fillOpacity={1} fill="url(#gClosed)" />
                  <Area type="monotone" dataKey="pending" name="Pending" stroke={CHART_COLORS.amber} strokeWidth={1.5} fillOpacity={0} fill="transparent" />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke={CHART_COLORS.purple} strokeWidth={1.5} fillOpacity={0} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </ChartContainer>
        </ReportCard>

        <ReportCard title="Status Distribution" tooltip="สัดส่วนสถานะการสนทนาในช่วงเวลาที่เลือก">
          <ChartContainer height={300}>
            {statusDist.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="65%">
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                      {statusDist.map((e, i) => <Cell key={i} fill={STATUS_COLORS[e.name] || CHART_COLORS.purple} />)}
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
              </>
            ) : <EmptyState />}
          </ChartContainer>
        </ReportCard>
      </div>

      {/* Message Flow Chart + Type Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ReportCard title="Message Flow" tooltip="ข้อความขาเข้า-ขาออก-บอท ตามรายวัน" className="xl:col-span-2">
          <ChartContainer height={280}>
            {msgChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={msgChartData}>
                  <defs>
                    <linearGradient id="gIncoming" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.blue} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOutgoing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS.green} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART_THEME.gridStroke} strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                  <YAxis stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="incoming" name="Incoming" stroke={CHART_COLORS.blue} strokeWidth={2} fillOpacity={1} fill="url(#gIncoming)" />
                  <Area type="monotone" dataKey="outgoing" name="Outgoing" stroke={CHART_COLORS.green} strokeWidth={2} fillOpacity={1} fill="url(#gOutgoing)" />
                  <Area type="monotone" dataKey="bot" name="Bot" stroke={CHART_COLORS.cyan} strokeWidth={1.5} fillOpacity={0} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <EmptyState />}
          </ChartContainer>
        </ReportCard>

        <ReportCard title="Message Types" tooltip="ประเภทข้อความที่ส่ง (Text, Image, File ฯลฯ)">
          <ChartContainer height={280}>
            {typeDist.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="65%">
                  <PieChart>
                    <Pie data={typeDist} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value" stroke="none">
                      {typeDist.map((entry, i) => (
                        <Cell key={i} fill={TYPE_COLORS[entry.name] || CHART_COLORS.purple} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-1">
                  {typeDist.map((t, i) => (
                    <div key={i} className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[t.name] || CHART_COLORS.purple }} />
                        <span className="text-white/50 text-xs font-medium">{t.name}</span>
                      </div>
                      <span className="text-white font-bold text-xs">{t.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <EmptyState />}
          </ChartContainer>
        </ReportCard>
      </div>

      <ReportCard
        title="Session Details"
        tooltip="สรุปรายละเอียดการสนทนาในช่วงที่เลือก"
        actions={<ExportCSVButton data={tableData} filename="conversations_report" />}
      >
        <ReportTable headers={["Customer", "Channel", "Agent", "Status", "Started", "Resolution"]}>
          {paginated.map((row, i) => {
            const statusColor = STATUS_COLORS[row.status] || CHART_COLORS.purple;
            return (
              <ReportTableRow key={i}>
                <ReportTableCell>
                  <span className="text-white font-bold">{row.customer}</span>
                </ReportTableCell>
                <ReportTableCell>
                  <StatusBadge text={row.channel} color={PLATFORM_COLORS[row.channel] || CHART_COLORS.blue} />
                </ReportTableCell>
                <ReportTableCell>
                  <span className="text-white/60">{row.agent}</span>
                </ReportTableCell>
                <ReportTableCell>
                  <StatusBadge text={row.status} color={statusColor} />
                </ReportTableCell>
                <ReportTableCell>
                  <span className="text-white/40 text-xs">{row.displayDate}</span>
                </ReportTableCell>
                <ReportTableCell>
                  {row.endTime ? (
                    <StatusBadge text="Resolved" color="#4ade80" />
                  ) : (
                    <span className="text-white/20 text-xs">In Progress</span>
                  )}
                </ReportTableCell>
              </ReportTableRow>
            );
          })}
        </ReportTable>
        <ReportPagination totalItems={tableData.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </ReportCard>
    </ReportPageWrapper>
  );
}