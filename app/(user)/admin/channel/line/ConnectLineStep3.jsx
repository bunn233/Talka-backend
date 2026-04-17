"use client";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Zap, Shield, Globe, Copy, Check, ChevronRight } from "lucide-react";

export default function ConnectLineStep3({ onBack, onComplete }) {
  const [checked, setChecked] = useState(false);
  const [copied, setCopied] = useState(false);

const currentHost = typeof window !== "undefined" ? window.location.origin : "";
const webhookUrl = `${currentHost}/api/webhook/line`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full min-h-[90vh] p-4 md:p-8  font-sans relative overflow-hidden animate-in fade-in duration-500">
      
      {/* Background Decorative Blur */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-white/20 blur-[120px] rounded-full pointer-events-none"></div>

      {/* --- MAIN CONTAINER --- */}
      <div className="relative z-10 bg-white border border-white/40 rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] h-full flex flex-col overflow-hidden">
        
        {/* Top Navigation */}
        <div className="p-8 md:p-10 pb-0 shrink-0 flex justify-between items-center">
          <button
            onClick={onBack}
            className="flex items-center gap-3 text-slate-400 hover:text-[#06C755] transition-all group font-bold text-sm uppercase tracking-wider"
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm group-hover:bg-[#06C755]/5 transition-all border border-slate-100">
              <ArrowLeft size={20} />
            </div>
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            <Shield size={14} className="text-[#06C755]" />
            <span>Final Synchronization</span>
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10">
          <div className="max-w-3xl mx-auto">
            
            {/* Header Section */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 text-[#06C755] mb-3 bg-[#06C755]/5 px-3 py-1 rounded-full">
                <Globe size={16} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Step 3 of 3</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Enable Webhook</h1>
              <p className="text-slate-500 text-base mt-2 font-medium">ขั้นตอนสุดท้าย: ตั้งค่า Webhook เพื่อรับส่งข้อความแบบ Real-time</p>
            </div>

            {/* Step Indicator (Completed Status) */}
            <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-2">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configure</span>
              </div>
              <div className="w-8 h-px bg-[#06C755]"></div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center text-white shadow-lg">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Information</span>
              </div>
              <div className="w-8 h-px bg-[#06C755]"></div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#06C755] border-2 border-[#06C755] flex items-center justify-center text-white font-black text-xs shadow-lg shadow-[#06C755]/20">
                  3
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Webhook</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-8 mb-12">
              <div className="flex items-start gap-5 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white transition-all">
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 text-[#06C755] text-xs font-black flex items-center justify-center shrink-0">1</div>
                <p className="text-slate-700 text-[16px] font-semibold pt-1">ไปที่แถบเมนู <span className="text-[#06C755]">Messaging API</span> ใน LINE Developer Console</p>
              </div>

              <div className="flex flex-col gap-4 p-5 rounded-[2.5rem] bg-[#06C755]/5 border border-[#06C755]/10">
                <div className="flex items-start gap-5">
                   <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-[#06C755]/20 text-[#06C755] text-xs font-black flex items-center justify-center shrink-0">2</div>
                   <p className="text-slate-700 text-[16px] font-semibold pt-1">คัดลอก URL ด้านล่างนี้ไปวางในช่อง <span className="text-[#06C755]">Webhook URL</span></p>
                </div>
                
                {/* URL Copy Box */}
                <div className="ml-13 relative group">
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm group-hover:border-[#06C755]/50 transition-all">
                    <code className="flex-1 text-slate-500 font-mono text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                      {webhookUrl}
                    </code>
                    <button 
                      onClick={handleCopy}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all
                        ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-[#06C755] hover:text-white'}`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-5 p-5 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white transition-all">
                <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-slate-100 text-[#06C755] text-xs font-black flex items-center justify-center shrink-0">3</div>
                <p className="text-slate-700 text-[16px] font-semibold pt-1">กดปุ่ม <span className="font-bold text-slate-900 text-lg">Update</span> และกดปุ่ม <span className="text-emerald-600">Verify</span> เพื่อตรวจสอบความถูกต้อง</p>
              </div>
            </div>

            {/* Final Action */}
            <div className="bg-slate-50/80 rounded-[2.5rem] p-6 md:p-8 border border-slate-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <label className="flex items-center gap-4 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="peer appearance-none w-7 h-7 rounded-xl border-2 border-slate-200 checked:bg-[#06C755] checked:border-[#06C755] transition-all cursor-pointer shadow-sm"
                      checked={checked}
                      onChange={(e) => setChecked(e.target.checked)}
                    />
                    <CheckCircle2 size={16} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <span className={`text-base font-bold tracking-tight transition-colors ${checked ? 'text-slate-900' : 'text-slate-400'}`}>
                    ฉันตั้งค่าและตรวจสอบ Webhook เรียบร้อยแล้ว
                  </span>
                </label>

                <button
                  disabled={!checked}
                  onClick={onComplete}
                  className={`flex items-center gap-3 px-12 py-4 rounded-2xl font-bold text-sm transition-all
                    ${checked 
                      ? 'bg-[#06C755] text-white shadow-xl shadow-[#06C755]/30 hover:scale-[1.03] active:scale-95' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  เสร็จสิ้นการตั้งค่า
                  <CheckCircle2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 text-center border-t border-slate-50 bg-slate-50/50">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">Complete Integration Success</p>
        </div>
      </div>
    </div>
  );
}