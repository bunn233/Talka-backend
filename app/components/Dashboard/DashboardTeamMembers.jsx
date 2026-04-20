"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Users, ShieldCheck, Mail, MoreHorizontal, Shield, ChevronRight as Chevron } from 'lucide-react';

export default function DashboardTeamMembers() {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [teamName, setTeamName] = useState("Support Team A");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDropdown, setShowDropdown] = useState(false);
  const ITEMS_PER_PAGE = 4; // ปรับเป็น 4 เพื่อให้เต็มพื้นที่ h-[600px]

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/my-team-members");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMembers(data.members || []);
        if (data.teamName) setTeamName(data.teamName);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching team members:", error);
        setLoading(false); 
      }
    };
    fetchTeamMembers();
  }, []);

  const totalPages = Math.ceil(members.length / ITEMS_PER_PAGE) || 1;
  const currentItems = members.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const stats = {
    total: members.length,
    online: members.filter(m => m.isOnline).length,
    admins: members.filter(m => ["owner", "admin", "manager"].includes(m.role?.toLowerCase())).length
  };

  return (
    <div className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-7 h-[600px] w-full flex flex-col overflow-hidden transition-all duration-300">
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-7 shrink-0 px-1">
        <div className="flex flex-col">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#BE7EC7] flex items-center justify-center shadow-[0_0_20px_rgba(190,126,199,0.3)]">
                    <Users size={24} className="text-white" />
                </div>
                <div>
                    <h2 className="text-white font-bold text-xl tracking-tight leading-none">Team Members</h2>
                    <p className="text-[#BE7EC7] text-[10px] mt-1.5 font-black uppercase tracking-[0.2em] opacity-80">{teamName}</p>
                </div>
            </div>
        </div>
        <div className="relative">
          <button 
             onClick={() => setShowDropdown(!showDropdown)} 
             onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
             className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/40 hover:text-white hover:bg-[#BE7EC7]/20 hover:text-[#BE7EC7] transition-all"
          >
              <MoreHorizontal size={20} />
          </button>
          
          {showDropdown && (
            <div className="absolute top-12 right-0 w-[280px] bg-[#12101c] border border-white/[0.07] rounded-[1.8rem] shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-50 overflow-hidden">

              {/* Header gradient banner */}
              <div className="relative p-5 pb-4 bg-gradient-to-br from-[#BE7EC7]/15 via-transparent to-transparent border-b border-white/[0.06] overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#BE7EC7]/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-base tracking-tight leading-none">{teamName}</p>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Workspace Team</p>
                  </div>
                  {/* Live badge */}
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{stats.online} live</span>
                  </div>
                </div>

                {/* Mini stat bar */}
                <div className="flex items-center gap-4 mt-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-[#BE7EC7]">{stats.total}</span>
                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Members</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-amber-400">{stats.admins}</span>
                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Admins</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-white/50">{stats.total - stats.online}</span>
                    <span className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Away</span>
                  </div>
                </div>
              </div>

              {/* Member list */}
              <div className="p-3">
                <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.25em] px-2 mb-2">View Profile</p>
                <div className="space-y-0.5 max-h-44 overflow-y-auto custom-scrollbar">
                  {members.map(m => {
                    const isAdmin = ["owner","admin","manager"].includes(m.role?.toLowerCase());
                    return (
                      <button
                        key={m.id}
                        onMouseDown={() => router.push(`/admin/member/${m.id}`)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-white/[0.05] rounded-2xl transition-all text-left group relative overflow-hidden"
                      >
                        {/* hover glow */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#BE7EC7]/0 to-[#BE7EC7]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />

                        {/* Avatar with online dot */}
                        <div className="relative shrink-0">
                          <img src={m.avatar} className="w-8 h-8 rounded-xl object-cover border border-white/5 shadow group-hover:scale-105 transition-transform" alt="" />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#12101c] ${m.isOnline ? "bg-emerald-500" : "bg-white/20"}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-white text-xs font-bold truncate group-hover:text-[#BE7EC7] transition-colors">{m.name}</p>
                            {m.isMe && (
                              <span className="bg-[#BE7EC7]/20 border border-[#BE7EC7]/30 px-1 py-[1px] rounded text-[#BE7EC7] text-[7px] font-black uppercase tracking-widest leading-none mt-0.5">YOU</span>
                            )}
                          </div>
                          <p className={`text-[9px] font-bold uppercase tracking-widest ${m.role?.toLowerCase() === "admin" ? "text-red-500/80" : m.role?.toLowerCase() === "owner" ? "text-amber-400/70" : "text-white/30"}`}>{m.role}</p>
                        </div>

                        <ChevronLeft size={12} className="rotate-180 text-white/10 group-hover:text-[#BE7EC7] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer action */}
              <div className="px-3 pb-3">
                <button
                  onMouseDown={() => router.push("/admin/teamsetting")}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-[#BE7EC7]/10 hover:bg-[#BE7EC7]/20 border border-[#BE7EC7]/20 hover:border-[#BE7EC7]/40 text-[#BE7EC7] text-[10px] font-black uppercase tracking-[0.2em] transition-all"
                >
                  <Users size={13} /> Manage Team
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Members List Section */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {loading ? (
             <div className="space-y-3 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-[84px] bg-white/5 rounded-[1.8rem] w-full"></div>)}
             </div>
          ) : (
            currentItems.map((member) => ( 
              <div 
                key={member.id} 
                onClick={() => router.push(`/admin/member/${member.id}`)}
                className="group relative flex items-center justify-between p-4 bg-[#1F192E] border border-white/[0.03] rounded-[1.8rem] hover:bg-[#251E38] hover:border-[#BE7EC7]/30 transition-all duration-300 cursor-pointer select-none flex-1 max-h-[84px]"
              >
                
                {/* Accent Side Bar */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-8 bg-[#BE7EC7] rounded-r-full transition-all duration-300"></div>

                <div className="flex items-center gap-4">
                  <div className="relative shrink-0 w-14 h-14">
                    <img 
                        src={member.avatar} 
                        className="w-full h-full rounded-2xl border-2 border-white/5 object-cover shadow-lg group-hover:scale-105 transition-transform duration-300" 
                        alt={member.name}
                    />
                    {member.isOnline && (
                      <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center bg-emerald-500 rounded-full border-[3px] border-[#1F192E] group-hover:border-[#251E38] shadow-[0_0_10px_rgba(16,185,129,0.4)]"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <p className="text-white font-bold text-base tracking-tight">{member.name}</p>
                        {member.isMe && (
                            <div className="bg-[#BE7EC7]/20 border border-[#BE7EC7]/30 px-1.5 py-0.5 rounded text-[#BE7EC7] text-[8px] font-black uppercase tracking-widest mt-0.5">
                                YOU
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        {member.role?.toLowerCase() === "owner" ? (
                            <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                <Shield size={10} className="text-amber-500" />
                                <span className="text-amber-500 text-[9px] font-black uppercase tracking-tighter">{member.role}</span>
                            </div>
                        ) : member.role?.toLowerCase() === "admin" ? (
                            <div className="flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                                <Shield size={10} className="text-red-500" />
                                <span className="text-red-500 text-[9px] font-black uppercase tracking-tighter">{member.role}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md">
                                <ShieldCheck size={10} className="text-white/40" />
                                <span className="text-white/40 text-[9px] font-bold uppercase tracking-wider">{member.role}</span>
                            </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/member/${member.id}`); }}
                      className="w-10 h-10 rounded-xl bg-[#BE7EC7]/10 text-[#BE7EC7] hover:bg-[#BE7EC7] hover:text-white border border-[#BE7EC7]/20 transition-all flex items-center justify-center shadow-lg"
                    >
                      <ChevronRight size={16} />
                    </button>
                </div>
              </div>
            ))
          )}
      </div>

      {/* Pagination Section */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentPage(c => Math.max(1, c-1))} 
            disabled={currentPage === 1} 
            className="w-11 h-11 rounded-2xl bg-[#1F192E] border border-white/5 hover:bg-[#BE7EC7]/20 hover:text-[#BE7EC7] text-white/60 flex items-center justify-center transition-all disabled:opacity-20"
          >
            <ChevronLeft size={22} />
          </button>
          <button 
            onClick={() => setCurrentPage(c => Math.min(totalPages, c+1))} 
            disabled={currentPage === totalPages} 
            className="w-11 h-11 rounded-2xl bg-[#1F192E] border border-white/5 hover:bg-[#BE7EC7]/20 hover:text-[#BE7EC7] text-white/60 flex items-center justify-center transition-all disabled:opacity-20"
          >
            <ChevronRight size={22} />
          </button>
        </div>
        
        <div className="bg-[#1F192E] px-5 py-2.5 rounded-2xl border border-white/5 shadow-inner">
            <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                Page <span className="text-[#BE7EC7]">{currentPage}</span> <span className="mx-1">/</span> {totalPages}
            </span>
        </div>
      </div>
    </div>
  );
}