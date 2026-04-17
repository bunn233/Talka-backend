"use client";
import { Sparkles, Bot, Zap, ArrowRight } from "lucide-react";

export default function MainPage({ onStart }) {
  return (
    // 🎨 Container หลัก: พื้นหลัง #050509 กรอบมน เข้ากับ Sidebar
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[94vh] bg-[#050509] text-white overflow-hidden font-sans rounded-3xl sm:rounded-[32px] border border-white/5 shadow-2xl relative">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 text-center max-w-3xl px-6 animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#120F1D] border border-white/5 mb-8 shadow-inner">
          <Sparkles className="text-purple-400" size={16} />
          <span className="text-xs font-bold tracking-widest uppercase text-white/70">Talka AI Framework</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent">
          Build Your Custom <br />
          <span className="text-transparent bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text">AI Agents</span>
        </h1>
        
        <p className="text-lg text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
          Create, train, and deploy intelligent AI assistants tailored to your business. 
          Automate support, generate leads, and boost sales in minutes.
        </p>

        <button 
          onClick={onStart}
          className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black text-lg hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(147,51,234,0.3)] cursor-pointer"
        >
          Get Started
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Feature Highlights (ใช้สีการ์ด #120F1D) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left">
          <div className="bg-[#120F1D] p-6 rounded-2xl border border-white/5 shadow-lg">
            <Bot className="text-blue-400 mb-4" size={28} />
            <h3 className="font-bold mb-2">Smart Templates</h3>
            <p className="text-xs text-white/40 leading-relaxed">Start quickly with pre-built agents for Sales, Support, and more.</p>
          </div>
          <div className="bg-[#120F1D] p-6 rounded-2xl border border-white/5 shadow-lg">
            <Sparkles className="text-purple-400 mb-4" size={28} />
            <h3 className="font-bold mb-2">Custom Knowledge</h3>
            <p className="text-xs text-white/40 leading-relaxed">Upload PDFs or add URLs to train your AI on your own data.</p>
          </div>
          <div className="bg-[#120F1D] p-6 rounded-2xl border border-white/5 shadow-lg">
            <Zap className="text-emerald-400 mb-4" size={28} />
            <h3 className="font-bold mb-2">Actionable Skills</h3>
            <p className="text-xs text-white/40 leading-relaxed">Equip your AI to collect leads and hand over to humans seamlessly.</p>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}