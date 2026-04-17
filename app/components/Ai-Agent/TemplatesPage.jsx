"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, ConciergeBell, TrendingUp, LifeBuoy, Sparkles, Edit, Plus, Trash2, Bot } from "lucide-react";

export default function TemplatesPage({
  onBack, onreceptionist, onsalesagent, onsupportagent, oncreatenew, onEditAgent
}) {
  const [customAgents, setCustomAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchAgents(); }, []);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/Ai/agents');
      const data = await res.json();
      if (Array.isArray(data)) setCustomAgents(data);
    } catch (error) {
      console.error("Failed to fetch agents", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgent = async (e, id) => {
    e.stopPropagation();
    if (!confirm("คุณต้องการลบ AI Agent ตัวนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/Ai/agents?id=${id}`, { method: 'DELETE' });
      if (res.ok) setCustomAgents(prev => prev.filter(agent => agent.id !== id));
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  return (
    // 🎨 Container หลัก: เหมือน MainPage ทุกประการ
    <div className="flex flex-col w-full h-full min-h-[94vh] bg-[#050509] text-white overflow-hidden font-sans rounded-3xl sm:rounded-[32px] border border-white/5 shadow-2xl relative">
      
      {/* 🎨 Header: สี #0B0914 กลืนกับ Sidebar หลัก */}
      <header className="h-20 flex justify-between items-center px-6 md:px-8 bg-[#0B0914] border-b border-white/5 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-[#1E1A2D] hover:bg-white/10 rounded-2xl transition-all border border-white/5 cursor-pointer group">
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-purple-900/20">AI</div>
             <h1 className="text-xl font-black tracking-tight">AI Agent Management</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative p-6 md:p-10">
        <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Manage Your Agents</h2>
            <p className="text-sm md:text-base text-white/50 mt-2 font-medium max-w-xl leading-relaxed">Manage your active AI agents, use a pre-built template, or create a customized agent from scratch.</p>
          </div>
          <div className="border-t border-white/5 w-full" />
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2"><Sparkles className="text-purple-400" size={24} /> Your AI Agents</h3>
              <button onClick={fetchAgents} className="text-xs font-bold text-white/30 hover:text-white transition-colors cursor-pointer">Refresh</button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center gap-3 text-purple-400 text-sm font-bold animate-pulse"><div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />Loading your agents...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {customAgents.map((agent) => (
                  <div key={agent.id} className="group bg-[#120F1D] border border-white/5 rounded-[24px] p-6 hover:border-purple-500/40 hover:shadow-[0_0_30px_-10px_rgba(147,51,234,0.2)] transition-all duration-500 flex flex-col relative overflow-hidden">
                    <div className="absolute top-5 right-5 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-[#050509] px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                        <div className={`w-2 h-2 rounded-full ${agent.is_published ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' : 'bg-yellow-500'}`} />
                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{agent.is_published ? 'Active' : 'Draft'}</span>
                      </div>
                      <button onClick={(e) => handleDeleteAgent(e, agent.id)} className="p-1.5 bg-[#050509] hover:bg-rose-500/20 text-white/30 hover:text-rose-500 border border-white/5 hover:border-rose-500/30 rounded-full transition-all cursor-pointer"><Trash2 size={14} /></button>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-[#1E1A2D] border border-white/5 flex items-center justify-center text-3xl mb-5 shadow-inner">{agent.emoji || "🤖"}</div>
                    <h2 className="text-xl font-bold text-white mb-2 line-clamp-1">{agent.name}</h2>
                    <p className="text-xs text-white/40 leading-relaxed flex-1 line-clamp-2">{agent.instructions ? agent.instructions : 'No instructions set.'}</p>
                    <button onClick={() => onEditAgent && onEditAgent(agent)} className="w-full mt-6 bg-[#1E1A2D] hover:bg-purple-600 text-purple-400 hover:text-white border border-white/5 hover:border-purple-500 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg cursor-pointer"><Edit size={16} /> Manage Agent</button>
                  </div>
                ))}
                <div onClick={oncreatenew} className="group bg-[#050509] border border-dashed border-white/10 rounded-[24px] p-6 hover:border-purple-500/50 hover:bg-purple-900/5 transition-all duration-500 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]">
                  <div className="w-12 h-12 rounded-full bg-[#1E1A2D] border border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-purple-600 group-hover:border-purple-500 transition-all duration-500 shadow-xl"><Plus className="text-white/50 group-hover:text-white transition-colors" size={24} strokeWidth={2.5} /></div>
                  <h2 className="text-lg font-bold text-white/70 group-hover:text-white transition-colors">Create New</h2>
                  <p className="text-xs text-white/40">Build from scratch</p>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-white/5 w-full" />
          <div>
            <h3 className="text-xl font-black text-white/80 mb-6 flex items-center gap-2"><Bot className="text-blue-400" size={24} /> Start from Templates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="group bg-[#120F1D] border border-white/5 rounded-[24px] p-6 hover:border-yellow-500/30 hover:shadow-[0_0_30px_-10px_rgba(234,179,8,0.15)] transition-all duration-500 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500"><ConciergeBell className="text-yellow-400" size={24} strokeWidth={2} /></div>
                <h2 className="text-lg font-bold text-white mb-2">Receptionist</h2>
                <p className="text-xs text-white/50 leading-relaxed flex-1">Greets Contacts, identifies their needs, captures details, and routes them.</p>
                <button onClick={onreceptionist} className="w-full mt-6 bg-[#050509] hover:bg-yellow-500 text-white/70 hover:text-yellow-950 border border-white/5 hover:border-yellow-500 py-2.5 rounded-xl font-bold transition-all duration-300 cursor-pointer">Use template</button>
              </div>
              <div className="group bg-[#120F1D] border border-white/5 rounded-[24px] p-6 hover:border-emerald-500/30 hover:shadow-[0_0_30px_-10px_rgba(16,185,129,0.15)] transition-all duration-500 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500"><TrendingUp className="text-emerald-400" size={24} strokeWidth={2} /></div>
                <h2 className="text-lg font-bold text-white mb-2">Sales Agent</h2>
                <p className="text-xs text-white/50 leading-relaxed flex-1">Learns customer needs, suggests products, and connects to the right team.</p>
                <button onClick={onsalesagent} className="w-full mt-6 bg-[#050509] hover:bg-emerald-500 text-white/70 hover:text-emerald-950 border border-white/5 hover:border-emerald-500 py-2.5 rounded-xl font-bold transition-all duration-300 cursor-pointer">Use template</button>
              </div>
              <div className="group bg-[#120F1D] border border-white/5 rounded-[24px] p-6 hover:border-blue-500/30 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.15)] transition-all duration-500 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500"><LifeBuoy className="text-blue-400" size={24} strokeWidth={2} /></div>
                <h2 className="text-lg font-bold text-white mb-2">Support Agent</h2>
                <p className="text-xs text-white/50 leading-relaxed flex-1">Answers product questions using AI Knowledge Sources and escalates.</p>
                <button onClick={onsupportagent} className="w-full mt-6 bg-[#050509] hover:bg-blue-500 text-white/70 hover:text-blue-950 border border-white/5 hover:border-blue-500 py-2.5 rounded-xl font-bold transition-all duration-300 cursor-pointer">Use template</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}