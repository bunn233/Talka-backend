"use client";
import React, { useState, useEffect } from "react";
import { Users, ChevronRight, MessageSquare, Facebook, MessageCircle, MoreVertical } from "lucide-react";

export default function DashboardContacts() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/dashboard/contacts");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setContacts(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setIsLoading(false); 
      }
    };
    fetchContacts();
  }, []);

  return (
    <div className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-7 h-[600px] w-full flex flex-col overflow-hidden">
      
      {/* Header Section */}
      <div className="flex items-center justify-between mb-7 shrink-0 px-1">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#BE7EC7] flex items-center justify-center shadow-[0_0_20px_rgba(190,126,199,0.3)]">
                <Users size={24} className="text-white" />
            </div>
            <div>
                <h2 className="text-white font-bold text-xl tracking-tight leading-none">Recent Contacts</h2>
                <p className="text-white/40 text-xs mt-1.5 font-medium uppercase tracking-widest">Active Conversations</p>
            </div>
        </div>
        <button className="bg-white/5 hover:bg-[#BE7EC7] text-white/70 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 group">
            View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      
      {/* List Section */}
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {isLoading ? (
             <div className="space-y-3 animate-pulse">
                {[1,2,3,4].map(i => <div key={i} className="h-[84px] bg-white/5 rounded-3xl w-full"></div>)}
             </div>
        ) : (
          contacts.slice(0, 4).map((contact) => (
            <div 
              key={contact.id} 
              className="group relative flex items-center justify-between p-4 bg-[#1F192E] border border-white/[0.03] rounded-[1.8rem] hover:bg-[#251E38] hover:border-[#BE7EC7]/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl flex-1 max-h-[84px]"
            >
              {/* Highlight Bar on Hover */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-8 bg-[#BE7EC7] rounded-r-full transition-all duration-300"></div>

              <div className="flex items-center gap-4">
                {/* Avatar with Status Dot */}
                <div className="relative shrink-0">
                    <img 
                      src={contact.imgUrl} 
                      className="w-14 h-14 rounded-2xl border-2 border-white/5 object-cover shadow-lg group-hover:scale-105 transition-transform duration-300" 
                      alt={contact.name}
                    />
                    <span className={`absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full border-[3px] border-[#1F192E] group-hover:border-[#251E38] transition-colors ${contact.status?.toLowerCase() === 'open' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></span>
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold text-base tracking-tight">{contact.name}</p>
                    {contact.tags.map((tag, i) => (
                        <span key={i} className="text-[9px] bg-[#BE7EC7] text-white px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">
                            {tag}
                        </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5">
                        {contact.channel?.toLowerCase() === 'facebook' ? <Facebook size={12} className="text-blue-400" /> : <MessageCircle size={12} className="text-green-400" />}
                        <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{contact.channel}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-white/10"></div>
                    <span className="text-white/50 text-[11px] font-semibold">{contact.status}</span>
                  </div>
                </div>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-white/20 group-hover:bg-[#BE7EC7]/10 group-hover:text-[#BE7EC7] transition-all duration-300">
                    <MessageSquare size={18} />
                </div>
                <div className="w-8 h-10 flex items-center justify-center text-white/10 hover:text-white/40 transition-colors">
                    <MoreVertical size={18} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}