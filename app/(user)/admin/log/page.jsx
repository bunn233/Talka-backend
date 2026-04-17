"use client";

import { useState, useMemo, useEffect } from "react";

export default function ActivityLog() {
  const [expandedRow, setExpandedRow] = useState(null);

  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [searchText, setSearchText] = useState("");

  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ดึงข้อมูลจาก API จริง
  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/activity-logs');
        if (response.ok) {
           const data = await response.json();
           setLogs(data.logs || []);
        }
      } catch (error) {
        console.error("Failed to fetch activity logs", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // ฟังก์ชันจัดรูปแบบวันที่
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
  };

  // จัดการสีของแต่ละ Action
  const typeColor = (action) => {
    const act = (action || "").toLowerCase();
    if (act.includes("delete") || act.includes("trash") || act.includes("remove")) return "text-red-400";
    if (act.includes("create") || act.includes("add") || act.includes("restore")) return "text-green-400";
    if (act.includes("edit") || act.includes("update") || act.includes("change")) return "text-blue-400";
    if (act.includes("tag")) return "text-yellow-300";
    if (act.includes("invite")) return "text-purple-300";
    return "text-sky-400";
  };

  // ค้นหา กรอง และจัดเรียงข้อมูล
  const filteredLogs = useMemo(() => {
    let logsToFilter = [...logs];

    // 1. กรองตามประเภท
    if (filterType !== "all") {
      logsToFilter = logsToFilter.filter((log) => log.action === filterType);
    }

    // 2. ค้นหาข้อความ
    if (searchText.trim() !== "") {
      logsToFilter = logsToFilter.filter((log) =>
        [log.message, log.action, log.user?.username]
          .join(" ")
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
    }

    // 3. จัดเรียง
    logsToFilter.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return logsToFilter;
  }, [logs, filterType, sortOrder, searchText]);

  // ดึงประเภท Action ที่มีทั้งหมดในระบบมาทำเป็น Dropdown อัตโนมัติ
  const uniqueActions = useMemo(() => {
    const actions = logs.map(log => log.action).filter(Boolean);
    return [...new Set(actions)];
  }, [logs]);

  return (
    <div className="w-full h-[94vh] p-2 md:p-4">
      <div className="bg-[rgba(32,41,59,0.25)] border border-[rgba(254,253,253,0.5)] backdrop-blur-xl rounded-3xl shadow-2xl pt-5 px-4 h-full flex flex-col">
        
        {/* FILTER BAR */}
        <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
          {/* FILTER TYPE */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#BE7EC7] transition-all cursor-pointer"
          >
            <option className="bg-[#1E1B29] text-white" value="all">
              All Activities
            </option>
            {uniqueActions.map(action => (
                <option key={action} className="bg-[#1E1B29] text-white" value={action}>
                    {action.replace(/_/g, ' ').toUpperCase()}
                </option>
            ))}
          </select>

          {/* SORT */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#BE7EC7] transition-all cursor-pointer"
          >
            <option className="bg-[#1E1B29] text-white" value="newest">Newest First</option>
            <option className="bg-[#1E1B29] text-white" value="oldest">Oldest First</option>
          </select>

          {/* SEARCH */}
          <input
            placeholder="Search activities, users, messages..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-[#BE7EC7] transition-all"
          />

          <button
            onClick={() => {
                setSearchText("");
                setFilterType("all");
                setSortOrder("newest");
            }}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-white transition-all font-medium"
          >
            Reset Filters
          </button>
        </div>

        {/* LOG LIST */}
        <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 pb-4 min-h-0">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-40 opacity-50">
                <i className="fa-solid fa-spinner fa-spin text-3xl mb-3 text-[#BE7EC7]"></i>
                <p className="text-gray-300 text-sm">Loading activity logs...</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.log_id || log.id} className="group">
                {/* แถบหัวข้อ Log */}
                <button
                  onClick={() =>
                    setExpandedRow(expandedRow === (log.log_id || log.id) ? null : (log.log_id || log.id))
                  }
                  className="w-full text-left px-5 py-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/10 text-white transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 flex-1 pr-4">
                      <p className="text-[11px] text-[#BE7EC7]/70 font-medium tracking-wide">
                          {formatDate(log.created_at)}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10 ${typeColor(log.action)}`}>
                            {log.action?.replace(/_/g, ' ') || "SYSTEM ACTION"}
                          </span>
                          <p className="text-sm text-gray-300">
                            <strong className="text-white">{log.user?.username || "System"}</strong> 
                            {log.chat_session_id && (
                                <>
                                    <span className="mx-1.5 text-gray-500">in chat</span> 
                                    <span className="text-[#BE7EC7] text-xs px-1.5 py-0.5 rounded bg-[#BE7EC7]/10">#{log.chat_session_id}</span>
                                </>
                            )}
                          </p>
                      </div>

                      {log.message && (
                          <p className="text-sm text-white/80 mt-1 line-clamp-2">{log.message}</p>
                      )}
                    </div>

                    <span className={`text-gray-500 bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:bg-white/10 ${expandedRow === (log.log_id || log.id) ? 'rotate-180 bg-[#BE7EC7]/20 text-[#BE7EC7]' : ''}`}>
                      <i className="fa-solid fa-chevron-down text-xs"></i>
                    </span>
                  </div>
                </button>

                {/* ข้อมูลเพิ่มเติม (Expanded Details) - แสดง Old/New Value */}
                {expandedRow === (log.log_id || log.id) && (
                  <div className="bg-black/20 p-5 mt-1 rounded-xl border border-white/5 text-sm overflow-hidden animate-in slide-in-from-top-2 duration-200 ml-4">
                      <div className="grid grid-cols-2 gap-4">
                          {log.old_value && (
                              <div>
                                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">Previous Value</p>
                                  <div className="bg-red-500/5 border border-red-500/10 text-red-300/80 p-2.5 rounded-lg line-through text-xs break-words">
                                      {log.old_value}
                                  </div>
                              </div>
                          )}
                          {log.new_value && (
                              <div>
                                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">New Value</p>
                                  <div className="bg-green-500/10 border border-green-500/20 text-green-300 p-2.5 rounded-lg text-xs break-words">
                                      {log.new_value}
                                  </div>
                              </div>
                          )}
                      </div>
                      
                      {/* ถ้ามี Metadata */}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-white/5">
                              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1.5">System Metadata</p>
                              <pre className="text-xs text-gray-400 bg-black/40 p-3 rounded-lg overflow-x-auto custom-scrollbar border border-white/5">
                                  {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                          </div>
                      )}

                      {(!log.old_value && !log.new_value && (!log.metadata || Object.keys(log.metadata).length === 0)) && (
                          <p className="text-gray-500 text-center italic text-xs py-2">No further details recorded for this event.</p>
                      )}
                  </div>
                )}
              </div>
            ))
          )}

          {!isLoading && filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <i className="fa-solid fa-clock-rotate-left text-2xl text-gray-400"></i>
                </div>
                <p className="text-center text-gray-300 font-medium">
                  No activities found
                </p>
                <p className="text-center text-gray-500 text-xs mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}