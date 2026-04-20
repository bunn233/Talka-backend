"use client";

import React, { useState } from "react";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Users2, Trophy, Clock, MessageSquare, Shield, Star, Activity } from "lucide-react";

import {
  StatsCard, ReportCard, ReportTable, ReportTableRow, ReportTableCell,
  ReportDatePicker, ReportPagination, ReportPageWrapper, ChartContainer,
  StatusBadge, CustomTooltip, ExportCSVButton, ReportSkeleton, EmptyState,
  useReportData, formatTime, CHART_COLORS, CHART_THEME,
} from "@/app/components/Report/ReportShared";

export default function TeamPerformanceReport() {
  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [range, setRange] = useState([
    { startDate: thirtyDaysAgo, endDate: new Date(), key: "selection" },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data, isLoading } = useReportData("/api/reports/team-performance", range);

  if (isLoading) return <ReportSkeleton />;

  const teamData = data?.teamData || [];
  const activityLogs = data?.activityLogs || [];
  const stats = data?.stats || {};

  const chartTeamData = teamData.map((m) => ({
    name: m.name,
    assigned: m.assigned,
    closed: m.closed,
    messages: m.messages,
  }));

  const paginatedLogs = activityLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const ROLE_COLORS = {
    Owner: "#fbbf24",
    ADMIN: "#f97316",
    MANAGER: "#BE7EC7",
    EMPLOYEE: "#60a5fa",
  };

  return (
    <ReportPageWrapper
      title="Team Performance"
      subtitle="Agent Productivity Analytics"
      icon={Users2}
      headerActions={<ReportDatePicker range={range} setRange={setRange} />}
      kpiCards={
        <>
          <StatsCard label="Total Assigned" value={stats.totalAssigned || 0} icon={MessageSquare} color="#60a5fa" subtitle="conversations" />
          <StatsCard label="Total Closed" value={stats.totalClosed || 0} icon={Trophy} color="#4ade80" subtitle="resolved" />
          <StatsCard label="Messages Sent" value={(stats.totalMessages || 0).toLocaleString()} icon={MessageSquare} color="#BE7EC7" subtitle="by all agents" />
        </>
      }
    >

      {/* Team Performance Bar Chart */}
      <ReportCard title="Agent Comparison" tooltip="เปรียบเทียบจำนวน Assigned vs Closed ของแต่ละสมาชิก">
        <ChartContainer height={280}>
          {chartTeamData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartTeamData} barGap={4}>
                <CartesianGrid stroke={CHART_THEME.gridStroke} strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.5)" }} />
                <YAxis stroke={CHART_THEME.axisStroke} style={{ fontSize: CHART_THEME.fontSize }} tick={{ fill: "rgba(255,255,255,0.3)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="assigned" name="Assigned" fill={CHART_COLORS.blue} radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="closed" name="Closed" fill={CHART_COLORS.green} radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState title="No team data" subtitle="No workspace members found" />}
        </ChartContainer>
      </ReportCard>

      {/* Team Performance Table */}
      <ReportCard
        title="Individual Performance"
        tooltip="สรุปผลงานรายบุคคลของทีม"
        actions={<ExportCSVButton data={teamData.map(m => ({ name: m.name, role: m.role, assigned: m.assigned, closed: m.closed, messages: m.messages, resolution: m.resolutionRate + "%" }))} filename="team_performance" />}
      >
        <ReportTable headers={["Agent", "Role", "Assigned", "Closed", "Messages", "Resolution"]}>
          {teamData.map((member, i) => {
            const isTop = i === 0 && member.closed > 0;
            return (
              <ReportTableRow key={i}>
                <ReportTableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#BE7EC7]/15 flex items-center justify-center overflow-hidden shrink-0">
                      {member.profileImage ? (
                        <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#BE7EC7] text-xs font-black">{member.name?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-white font-bold text-sm">{member.name}</span>
                      {isTop && <span className="ml-1.5 text-[8px] bg-amber-500/20 text-amber-400 px-1 py-[1px] rounded font-black">TOP</span>}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${member.onlineStatus === "ONLINE" ? "bg-emerald-400" : member.onlineStatus === "AWAY" ? "bg-amber-400" : "bg-neutral-500"}`} />
                        <span className="text-white/30 text-[9px]">{member.onlineStatus?.toLowerCase()}</span>
                      </div>
                    </div>
                  </div>
                </ReportTableCell>
                <ReportTableCell>
                  <StatusBadge text={member.role} color={ROLE_COLORS[member.role] || "#60a5fa"} />
                </ReportTableCell>
                <ReportTableCell><span className="text-blue-400 font-bold">{member.assigned}</span></ReportTableCell>
                <ReportTableCell><span className="text-emerald-400 font-bold">{member.closed}</span></ReportTableCell>
                <ReportTableCell><span className="text-purple-400 font-bold">{member.messages}</span></ReportTableCell>
                <ReportTableCell>
                  <StatusBadge
                    text={`${member.resolutionRate}%`}
                    color={Number(member.resolutionRate) >= 90 ? "#4ade80" : Number(member.resolutionRate) >= 70 ? "#fbbf24" : "#ef4444"}
                  />
                </ReportTableCell>
              </ReportTableRow>
            );
          })}
        </ReportTable>
      </ReportCard>

      {/* Activity Log */}
      <ReportCard
        title="Recent Activity Log"
        tooltip="กิจกรรมล่าสุดของทีม — ดึงจาก ActivityLog"
        actions={<ExportCSVButton data={activityLogs} filename="activity_log" />}
      >
        <ReportTable headers={["Timestamp", "Agent", "Action", "Details"]}>
          {paginatedLogs.length > 0 ? (
            paginatedLogs.map((log, i) => (
              <ReportTableRow key={i}>
                <ReportTableCell><span className="text-white/40 text-xs">{log.timestamp}</span></ReportTableCell>
                <ReportTableCell><span className="text-white font-bold">{log.user}</span></ReportTableCell>
                <ReportTableCell><span className="text-white/60">{log.action}</span></ReportTableCell>
                <ReportTableCell>
                  {log.newValue ? (
                    <span className="text-[#BE7EC7] font-medium text-xs">{log.newValue}</span>
                  ) : log.chatSessionId ? (
                    <span className="text-[#BE7EC7] font-medium text-xs">Session #{log.chatSessionId}</span>
                  ) : (
                    <span className="text-white/20 text-xs">—</span>
                  )}
                </ReportTableCell>
              </ReportTableRow>
            ))
          ) : null}
        </ReportTable>
        <ReportPagination totalItems={activityLogs.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </ReportCard>
    </ReportPageWrapper>
  );
}