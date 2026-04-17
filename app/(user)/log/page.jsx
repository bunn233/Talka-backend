"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  ArrowUpDown,
  RefreshCw,
  ChevronDown,
  MessageCircle,
  Tag,
  UserPlus,
  Activity,
  Clock,
  Shield,
  StickyNote
} from "lucide-react";

export default function ActivityLog() {
  const [expandedRow, setExpandedRow] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [searchText, setSearchText] = useState("");
  const [activityLogs, setActivityLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ดึงข้อมูลจาก API จริง
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/activity-logs');
        if (response.ok) {
           const data = await response.json();
           setActivityLogs(data.logs || []);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // ฟังก์ชันจัดการสีและไอคอนตาม Action ของฐานข้อมูล
  const getTypeConfig = (action) => {
    const act = (action || "").toLowerCase();
    if (act.includes("chat") || act.includes("message")) return { label: "Chat", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20", line: "bg-blue-400", icon: MessageCircle };
    if (act.includes("tag")) return { label: "Tag System", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", line: "bg-amber-400", icon: Tag };
    if (act.includes("note")) return { label: "Notes", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", line: "bg-emerald-400", icon: StickyNote };
    if (act.includes("invite") || act.includes("user") || act.includes("status")) return { label: "System Activity", color: "text-[#BE7EC7]", bg: "bg-[#BE7EC7]/10", border: "border-[#BE7EC7]/20", line: "bg-[#BE7EC7]", icon: UserPlus };
    
    return { label: "System", color: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", line: "bg-slate-400", icon: Activity };
  };

  // ดึง Action ประเภททั้งหมดเพื่อมาทำ Dropdown อัตโนมัติ
  const uniqueActions = useMemo(() => {
    const actions = activityLogs.map(log => log.action).filter(Boolean);
    return [...new Set(actions)];
  }, [activityLogs]);

  //  กรองข้อมูลและจัดเรียงตามฐานข้อมูลจริง
  const filteredLogs = useMemo(() => {
    let logs = [...activityLogs];
    
    if (filterType !== "all") {
      logs = logs.filter((log) => log.action === filterType);
    }
    
    if (searchText.trim() !== "") {
      logs = logs.filter((log) => 
        [log.message, log.action, log.user?.username]
        .join(" ")
        .toLowerCase()
        .includes(searchText.toLowerCase())
      );
    }
    
    logs.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });
    
    return logs;
  }, [activityLogs, filterType, sortOrder, searchText]);

  return (
    <div className="w-full h-[94vh] p-4 lg:p-6">
      <div className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-2xl h-full flex flex-col overflow-hidden">
        
        {/* Header Section */}
        <div className="p-8 pb-6 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-[#BE7EC7] flex items-center justify-center shadow-[0_0_15px_rgba(190,126,199,0.3)]">
                    <Shield size={22} className="text-white" /> 
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Activity Logs</h1>
              </div>
              <p className="text-white/30 text-sm font-medium ml-1">Workspace audit trail and system events.</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                placeholder="Search events..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#1F192E] border border-white/5 text-white text-sm focus:outline-none focus:border-[#BE7EC7]/50 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="px-8 pb-6 flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-[#1F192E] p-1.5 rounded-2xl border border-white/5 shadow-sm">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-white/70 text-xs font-bold uppercase tracking-wider px-4 py-1.5 outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#1F192E]">All Events</option>
              {uniqueActions.map(action => (
                 <option key={action} value={action} className="bg-[#1F192E]">
                    {action?.replace(/_/g, ' ').toUpperCase()}
                 </option>
              ))}
            </select>
            <div className="w-px h-4 bg-white/10"></div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent text-white/70 text-xs font-bold uppercase tracking-wider px-4 py-1.5 outline-none cursor-pointer"
            >
              <option value="newest" className="bg-[#1F192E]">Newest First</option>
              <option value="oldest" className="bg-[#1F192E]">Oldest First</option>
            </select>
          </div>

          <button
            onClick={() => { setSearchText(""); setFilterType("all"); setSortOrder("newest"); }}
            className="ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-white/40 text-xs font-bold uppercase tracking-widest hover:bg-[#BE7EC7] hover:text-white transition-all duration-300 shadow-sm"
          >
            <RefreshCw size={14} /> Reset
          </button>
        </div>

        {/* Logs List Container */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar min-h-0">
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <RefreshCw className="animate-spin text-[#BE7EC7] mb-4" size={40} />
                <p className="text-white/20 font-bold uppercase tracking-widest text-xs">Syncing audit logs...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/10">
                <Activity size={64} className="mb-4 opacity-10" />
                <p className="text-lg font-bold">No logs found</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const config = getTypeConfig(log.action);
                const Icon = config.icon;
                const uniqueId = log.log_id || log.id;
                const isExpanded = expandedRow === uniqueId;

                return (
                  <div key={uniqueId} 
                    className={`group relative bg-[#1F192E] border rounded-[1.5rem] transition-all duration-300 ${isExpanded ? 'border-[#BE7EC7]/40 shadow-xl' : 'border-white/[0.03] hover:border-white/10 hover:shadow-lg hover:-translate-y-0.5'}`}
                  >
                    {/* Status Accent Line */}
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full ${config.line} transition-all`}></div>

                    <div onClick={() => setExpandedRow(isExpanded ? null : uniqueId)} className="flex items-center gap-5 p-4 cursor-pointer">
                      {/* Icon Box */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${config.bg} ${config.color} border border-white/5`}>
                        <Icon size={22} />
                      </div>

                      {/* Main Info */}
                      <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                        <div className="lg:col-span-5">
                          <h4 className="text-white font-bold text-sm truncate">{log.message || log.action?.replace(/_/g, ' ')}</h4>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${config.color} opacity-80`}>{config.label}</span>
                        </div>

                        <div className="lg:col-span-4 flex items-center gap-2 text-xs">
                          <span className="text-white font-bold px-2 py-1 bg-white/5 rounded-lg">{log.user?.username || "System"}</span>
                          <span className="text-white/20">→</span>
                          <span className="text-white/50 truncate font-medium">
                              {log.chat_session_id ? `Chat Room #${log.chat_session_id}` : "System Event"}
                          </span>
                        </div>

                        <div className="lg:col-span-3 text-right flex flex-col items-end">
                          <div className="flex items-center gap-2 text-[11px] text-white/30 font-bold">
                            <Clock size={12} />
                            {new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[10px] text-white/20 mt-0.5 font-mono">
                            {new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                        </div>
                      </div>

                      <div className={`text-white/10 transition-transform duration-300 ${isExpanded ? "rotate-180 text-[#BE7EC7]" : ""}`}>
                        <ChevronDown size={20} />
                      </div>
                    </div>

                    {/* Detailed Information (Inside the card) */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 animate-in slide-in-from-top-2 duration-300">
                        <div className="bg-[#161223] rounded-2xl p-5 border border-white/5 shadow-inner">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Old Value vs New Value (ถ้ามี) */}
                            {log.old_value && (
                                <div className="flex flex-col border-b border-white/[0.03] pb-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Previous Data</span>
                                  <span className="text-sm text-red-400 font-medium line-through break-words">{log.old_value}</span>
                                </div>
                            )}
                            {log.new_value && (
                                <div className="flex flex-col border-b border-white/[0.03] pb-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">New Data</span>
                                  <span className="text-sm text-green-400 font-medium break-words">{log.new_value}</span>
                                </div>
                            )}
                            
                            <div className="flex flex-col border-b border-white/[0.03] pb-2 last:border-0 last:pb-0 sm:col-span-2 mt-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Transaction ID</span>
                                <span className="text-xs text-white/40 font-mono italic">log_trace_{uniqueId}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}