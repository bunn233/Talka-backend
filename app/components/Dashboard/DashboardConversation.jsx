"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, CartesianGrid, 
  XAxis, YAxis, Tooltip 
} from 'recharts';
import { Calendar, ChevronDown, TrendingUp, CheckCircle2, MessageSquare } from 'lucide-react';

export default function DashboardConversation() {
  const [isMounted, setIsMounted] = useState(false); // 🔥 ตัวแก้บั๊กกราฟไม่ขึ้น
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Today');
  const [currentData, setCurrentData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. จัดการเรื่อง Mounting เพื่อให้ Recharts ทำงานได้ใน Next.js
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Fetch ข้อมูล (Mock Data)
  useEffect(() => {
    if (!isMounted) return;
    
    const fetchChartData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/dashboard/conversations?period=${encodeURIComponent(selectedOption)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setCurrentData(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setIsLoading(false);
      }
    };
    
    fetchChartData();
  }, [selectedOption, isMounted]);

  const totals = useMemo(() => {
    return currentData.reduce((acc, curr) => ({
      opened: acc.opened + curr.opened,
      closed: acc.closed + curr.closed,
    }), { opened: 0, closed: 0 });
  }, [currentData]);

  // ถ้ายังไม่ Mount ไม่ต้องวาดอะไรเลย (ป้องกัน Hydration Error)
  if (!isMounted) return <div className="h-[550px] w-full bg-[#161223] rounded-[2.5rem]" />;

  return (
    <div className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-2xl p-8 flex flex-col w-full h-[550px]">
      
      {/* Header & Dropdown */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#BE7EC7]/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-[#BE7EC7]" />
            </div>
            <h2 className="text-white font-bold text-lg">Conversations Overview</h2>
          </div>
        </div>
        
        <div className="relative">
          <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-3 bg-[#1F192E] border border-white/5 px-4 py-2.5 rounded-2xl text-xs font-bold text-white/70">
            <span className="tracking-widest uppercase">{selectedOption}</span>
            <ChevronDown size={14} className={isOpen ? 'rotate-180' : ''} />
          </button>
          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#1F192E] border border-white/10 rounded-2xl z-50">
              {['Today', 'Yesterday'].map((opt) => (
                <button key={opt} onClick={() => { setSelectedOption(opt); setIsOpen(false); }} className="w-full text-left px-5 py-3 text-xs font-bold text-white/50 hover:bg-white/5">{opt}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="flex gap-10 mb-8 px-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#3b82f6]">Opened</span>
          <h3 className="text-3xl font-bold text-white">{totals.opened}</h3>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#22c55e]">Closed</span>
          <h3 className="text-3xl font-bold text-white">{totals.closed}</h3>
        </div>
      </div>

      {/* 📉 Graph Area: ระบุความสูงคงที่ใน div ครอบ */}
      <div className="flex-1 w-full h-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentData}>
            <defs>
              <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F192E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
              itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            />
            <Area type="monotone" dataKey="opened" stroke="#3b82f6" strokeWidth={3} fill="url(#colorOpened)" />
            <Area type="monotone" dataKey="closed" stroke="#22c55e" strokeWidth={3} fill="url(#colorClosed)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}