"use client";
import React, { useState, useEffect } from "react";
import { X, ArrowRight, Activity, Tag, MessageSquare, StickyNote, RefreshCw, ShieldCheck, Trash2, Columns } from "lucide-react";

export default function ActivityLogPanel({ onClose, chatId }) {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!chatId) {
                setIsLoading(false);
                return;
            }
            try {
                const res = await fetch(`/api/activity-logs?chatId=${chatId}`);
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data.logs || []);
                }
            } catch (error) {
                console.error("Failed to fetch logs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [chatId]);
    
    const formatTime = (isoString) => {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            const today = new Date();
            const isToday = date.toDateString() === today.toDateString();
            
            const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            if (isToday) return `Today at ${time}`;
            return `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`;
        } catch (e) {
            return "Just now";
        }
    };

    const getInitials = (name) => {
        if (!name || name === "System") return <ShieldCheck size={14} className="text-blue-400" />;
        return name.substring(0, 2).toUpperCase();
    };

const getActionDetails = (actionName) => {
     const act = (actionName || "").toUpperCase();
     if (act.includes("TRASH") || act.includes("DELETE")) return { icon: <Trash2 size={12} />, color: "text-red-400", bg: "bg-red-400/10" };
     if (act.includes("RESTORE")) return { icon: <RefreshCw size={12} />, color: "text-green-400", bg: "bg-green-400/10" };
     if (act.includes("EDIT")) return { icon: <StickyNote size={12} />, color: "text-blue-400", bg: "bg-blue-400/10" };
     if (act.includes("TAG")) return { icon: <Tag size={12} />, color: "text-amber-400", bg: "bg-amber-400/10" };
     if (act.includes("BOARD")) return { icon: <Columns size={12} />, color: "text-purple-400", bg: "bg-purple-400/10" }; 
     if (act.includes("STATUS")) return { icon: <RefreshCw size={12} />, color: "text-blue-400", bg: "bg-blue-400/10" };
     if (act.includes("NOTE")) return { icon: <StickyNote size={12} />, color: "text-[#BE7EC7]", bg: "bg-[#BE7EC7]/10" };
     if (act.includes("MESSAGE")) return { icon: <MessageSquare size={12} />, color: "text-emerald-400", bg: "bg-emerald-400/10" };
     return { icon: <Activity size={12} />, color: "text-white/50", bg: "bg-white/5" };
 };

    return (
        <div className="w-[320px] h-full max-h-full bg-[#1a1423] border border-[#BE7EC7]/15 rounded-[24px] shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col shrink-0 overflow-hidden relative">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#BE7EC7]/50 to-transparent"></div>

            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-white/5 shrink-0 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-[#BE7EC7]" />
                    <h2 className="text-white text-lg font-bold tracking-wide">Activity Log</h2>
                </div>
                <button 
                    onClick={onClose} 
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/10 text-white/50 hover:text-red-400 transition-all duration-300"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Timeline Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 relative min-h-0">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-40">
                        <RefreshCw size={24} className="animate-spin mb-2" />
                        <p className="text-xs">Loading Logs...</p>
                    </div>
                ) : !logs || logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-10 opacity-40">
                        <Activity size={32} className="mb-3" />
                        <p className="text-sm font-medium">No activity recorded</p>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Timeline Line */}
                        <div className="absolute left-[15px] top-2 bottom-0 w-[2px] bg-gradient-to-b from-white/10 via-white/5 to-transparent"></div>
                        
                        {[...logs].reverse().map((log, idx) => {
                            const currentAction = log.action || log.type || "ACTION";
                            const user = log.user;
                            const username = user?.username || log.by || "System";
                            const profileImg = user?.profile_image;
                            const { icon, color, bg } = getActionDetails(currentAction);

                            return (
                                <div key={log.log_id || idx} className="relative pl-10 mb-6 group">
                                    
                                    {/* Icon/Avatar on Timeline */}
                                    <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-[#1E1B29] flex items-center justify-center border border-white/10 shadow-lg overflow-hidden z-10 group-hover:border-[#BE7EC7]/40 transition-colors">
                                        {profileImg ? (
                                            <img src={profileImg} alt={username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[10px] font-extrabold text-white/70">
                                                {getInitials(username)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Content Area */}
                                    <div className="flex flex-col">
                                        <div className="text-xs leading-tight text-white/80">
                                            <span className={`font-bold ${username === 'System' ? 'text-blue-400' : 'text-white'}`}>
                                                {username}
                                            </span>
                                            <span className="text-white/40 mx-1.5 font-medium italic">did</span>
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase border border-white/5 ${color} ${bg}`}>
                                                {icon} {currentAction.replace(/_/g, ' ')}
                                            </span>
                                        </div>

                                        <div className="text-[10px] text-white/20 font-bold mt-1.5 mb-2 flex items-center gap-1.5">
                                            <RefreshCw size={10} className="opacity-50" />
                                            {formatTime(log.created_at || log.timestamp)}
                                        </div>

                                        {/* Change Details */}
                                        {(log.old_value || log.new_value || log.detail) && (
                                            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 shadow-inner group-hover:bg-white/[0.04] group-hover:border-white/10 transition-all">
                                                {log.old_value && log.new_value ? (
                                                    <div className="flex items-center flex-wrap gap-2 text-xs">
                                                        <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 line-through opacity-60">
                                                            {log.old_value}
                                                        </span>
                                                        <ArrowRight size={12} className="text-[#BE7EC7] animate-pulse" />
                                                        <span className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 font-bold">
                                                            {log.new_value}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p className="text-[12px] text-white/60 leading-relaxed italic">
                                                        "{log.new_value || log.detail || log.old_value}"
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-white/[0.01] shrink-0">
                <button
                    onClick={onClose}
                    className="w-full bg-[#BE7EC7]/10 hover:bg-[#BE7EC7]/20 text-[#BE7EC7] border border-[#BE7EC7]/20 hover:border-[#BE7EC7]/40 font-bold py-2.5 rounded-xl transition-all duration-300 shadow-lg shadow-[#BE7EC7]/5"
                >
                    Close
                </button>
            </div>
        </div>
    );
}