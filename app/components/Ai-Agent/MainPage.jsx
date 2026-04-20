"use client";
import { Sparkles, Bot, Zap, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function MainPage({ onStart }) {
  return (
    // 🎨 Container หลัก: เปลี่ยนเป็น #161223 และขอบมน [3rem] ตามมาตรฐานใหม่
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[94vh] bg-[#161223] text-white overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative p-8">
      
      {/* 🔮 Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#BE7EC7]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 text-center max-w-4xl px-6">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 mb-10 shadow-lg backdrop-blur-md"
        >
          <Sparkles className="text-[#BE7EC7]" size={14} />
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-white/50">Next-Gen AI Framework</span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]"
        >
          Build Your Custom <br />
          <span className="text-transparent bg-gradient-to-r from-[#BE7EC7] via-purple-300 to-blue-400 bg-clip-text">
            AI Agents
          </span>
        </motion.h1>
        
        {/* Sub-text */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-white/30 mb-14 max-w-2xl mx-auto leading-relaxed font-light italic"
        >
          Create, train, and deploy intelligent AI assistants tailored to your business. 
          Automate support and boost sales in minutes.
        </motion.p>

        {/* Primary Action Button */}
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={onStart}
          className="group relative inline-flex items-center gap-4 px-12 py-5 bg-[#BE7EC7] text-white rounded-full font-black text-sm uppercase tracking-[0.2em] hover:bg-[#a66bb0] hover:scale-105 transition-all duration-500 shadow-[0_10px_40px_rgba(190,126,199,0.3)] cursor-pointer active:scale-95"
        >
          Get Started
          <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
        </motion.button>

        {/* Feature Cards: เปลี่ยนเป็นสี #1F192E/50 และขอบมน [2rem] */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
          {[
            { icon: Bot, color: "text-blue-400", title: "Smart Templates", desc: "Start quickly with pre-built agents for Sales and Support." },
            { icon: Sparkles, color: "text-[#BE7EC7]", title: "Custom Knowledge", desc: "Upload PDFs or URLs to train your AI on your own business data." },
            { icon: Zap, color: "text-emerald-400", title: "Actionable Skills", desc: "Equip your AI to collect leads and hand over to humans seamlessly." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (i * 0.1) }}
              className="bg-[#1F192E]/40 p-8 rounded-[2rem] border border-white/5 shadow-xl hover:bg-[#1F192E]/60 hover:border-[#BE7EC7]/20 transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#BE7EC7]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 ${item.color}`}>
                <item.icon size={24} />
              </div>
              <h3 className="font-bold text-white mb-3 tracking-tight">{item.title}</h3>
              <p className="text-xs text-white/30 leading-relaxed font-light group-hover:text-white/50 transition-colors">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fadeIn { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `}</style>
    </div>
  );
}