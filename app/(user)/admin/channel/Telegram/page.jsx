"use client";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, Send, CheckCircle2, MessageSquare, 
  Zap, Shield, Key, ExternalLink, ChevronDown, 
  PlusCircle, Bot, Link2, ChevronRight, Loader2, AlertCircle 
} from "lucide-react";

export default function ConnectTelegram({ onBack, onComplete }) {
  const [botToken, setBotToken] = useState("");
  const [checked, setChecked] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [activeWsId, setActiveWsId] = useState(null); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 🔥 2. ดึง Workspace ID
  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        const wsRes = await fetch("/api/users/current-workspace");
        if (wsRes.ok) {
            const wsData = await wsRes.json();
            if (wsData.activeWorkspaceId) {
                setActiveWsId(wsData.activeWorkspaceId);
            }
        }
      } catch (error) {
          console.error("Failed to load workspace ID:", error);
      }
    };
    loadWorkspace();
  }, []);

  const toggleTab = (tab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  const handleConnect = async () => {
    if (!botToken || !checked) return;

    setIsLoading(true);
    setErrorMsg("");

    try {
      if (!activeWsId) {
        throw new Error("ไม่พบข้อมูลพื้นที่ทำงาน (Workspace) กรุณาเลือกทีมก่อนเชื่อมต่อ หรือลองรีเฟรชหน้าเว็บ");
      }

      const res = await fetch("/api/channels/telegram/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          botToken: botToken.trim(),
          channelName: "Telegram Bot", 
          workspaceId: activeWsId 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถเชื่อมต่อ Bot ได้ โปรดตรวจสอบ Token อีกครั้ง");
      }

      onComplete();

    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[90vh] p-4 md:p-10  text-[#1E293B] font-sans relative overflow-hidden animate-in fade-in duration-500">
      
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-white/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-black/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* --- MAIN CONTAINER --- */}
      <div className="relative z-10 bg-white border border-white/40 rounded-[3rem] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.15)] h-full flex flex-col p-6 md:p-12 overflow-hidden">
        
        {/* Top Navigation */}
        <div className="shrink-0 mb-8 flex justify-between items-center">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center gap-3 text-slate-400 hover:text-[#0088cc] transition-all group font-bold text-xs uppercase tracking-widest disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm group-hover:bg-[#0088cc]/5 group-hover:border-[#0088cc]/20 transition-all border border-slate-100">
              <ArrowLeft size={18} />
            </div>
            <span>Back</span>
          </button>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            
            {/* Step Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white text-slate-700 text-[10px] font-black uppercase tracking-[0.2em] mb-10 border border-slate-100 shadow-sm">
              <Zap size={14} className="fill-[#BE7EC7] text-[#BE7EC7]" />
              <span>Step 1: Bot Configuration</span>
              <div className="w-px h-3 bg-slate-200 mx-1"></div>
              <span className="text-[#0088cc]">Authorized Telegram Hub</span>
            </div>

            {/* CONNECTION VISUAL (ไอคอนเด้งๆ) */}
            <div className="relative mb-16 w-full max-w-sm h-32 flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-slate-100 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300">
                        <Link2 size={18} />
                    </div>
                </div>

                <div className="flex justify-between w-full relative z-10 px-4">
                    <div className={`w-24 h-24 rounded-[2.2rem] bg-white border border-slate-100 shadow-xl flex flex-col items-center justify-center gap-2 transition-all duration-1000 ${isLoading ? 'animate-pulse' : 'animate-bounce'}`} style={{ animationDuration: '3s' }}>
                        <div className="w-12 h-12 rounded-2xl bg-[#BE7EC7]/10 flex items-center justify-center text-[#BE7EC7]">
                            <MessageSquare size={28} fill="currentColor" className="opacity-80" />
                        </div>
                        <div className="w-8 h-1 bg-slate-100 rounded-full"></div>
                    </div>

                    <div className={`w-24 h-24 rounded-[2.2rem] bg-white border border-slate-100 shadow-xl flex flex-col items-center justify-center gap-2 transition-all duration-1000 ${isLoading ? 'animate-pulse' : 'animate-bounce'}`} style={{ animationDuration: '3s', animationDelay: '1.5s' }}>
                        <div className="w-12 h-12 rounded-2xl bg-[#0088cc]/10 flex items-center justify-center text-[#0088cc]">
                            <Send size={28} fill="currentColor" className="ml-[-2px] mt-[2px]" />
                        </div>
                        <div className="w-8 h-1 bg-blue-50 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Header Text */}
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
                Telegram <span className="text-[#0088cc]">Bot Setup</span>
              </h1>
              <p className="text-slate-400 text-base font-medium">กรุณาเลือกสถานะของ Bot เพื่อดูวิธีการรับ API Token</p>
            </div>

            {/* INSTRUCTIONS ACCORDION */}
            <div className="w-full space-y-4 mb-12">
              <div className={`border rounded-[2.5rem] transition-all duration-300 ${activeTab === 'new' ? 'bg-white border-[#0088cc]/30 shadow-xl shadow-[#0088cc]/5' : 'bg-slate-50/50 border-slate-100'}`}>
                <button onClick={() => toggleTab('new')} className="w-full flex items-center justify-between p-6">
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'new' ? 'bg-[#0088cc] text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                      <PlusCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">ฉันยังไม่มี Bot</h3>
                      <p className="text-xs text-slate-400">สร้าง Bot ใหม่ผ่าน @BotFather ในไม่กี่นาที</p>
                    </div>
                  </div>
                  <ChevronDown className={`transition-transform duration-300 ${activeTab === 'new' ? 'rotate-180 text-[#0088cc]' : 'text-slate-300'}`} />
                </button>
                {activeTab === 'new' && (
                  <div className="px-8 pb-8 animate-in slide-in-from-top-2">
                    <div className="h-px bg-slate-100 mb-6"></div>
                    <div className="space-y-5">
                      <StepItem num="1" text="ค้นหา @BotFather ในแอป Telegram หรือกดลิงก์ด้านล่าง" isLink link="https://t.me/botfather" />
                      <StepItem num="2" text="ส่งคำสั่ง /newbot ไปยัง BotFather" />
                      <StepItem num="3" text="ตั้งชื่อแสดงผล (Display Name) และ Username (ต้องลงท้ายด้วย 'bot')" />
                      <StepItem num="4" text="คัดลอก HTTP API Token ที่ได้มาวางในช่องด้านล่าง" />
                    </div>
                  </div>
                )}
              </div>

              <div className={`border rounded-[2.5rem] transition-all duration-300 ${activeTab === 'existing' ? 'bg-white border-[#0088cc]/30 shadow-xl shadow-[#0088cc]/5' : 'bg-slate-50/50 border-slate-100'}`}>
                <button onClick={() => toggleTab('existing')} className="w-full flex items-center justify-between p-6">
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === 'existing' ? 'bg-[#0088cc] text-white' : 'bg-white text-slate-400 shadow-sm'}`}>
                      <Bot size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">ฉันมี Bot อยู่แล้ว</h3>
                      <p className="text-xs text-slate-400">ดูวิธีดึง API Token จาก Bot เดิมของคุณ</p>
                    </div>
                  </div>
                  <ChevronDown className={`transition-transform duration-300 ${activeTab === 'existing' ? 'rotate-180 text-[#0088cc]' : 'text-slate-300'}`} />
                </button>
                {activeTab === 'existing' && (
                  <div className="px-8 pb-8 animate-in slide-in-from-top-2">
                    <div className="h-px bg-slate-100 mb-6"></div>
                    <div className="space-y-5">
                      <StepItem num="1" text="เข้าไปที่แชท @BotFather ในแอป Telegram" isLink link="https://t.me/botfather" />
                      <StepItem num="2" text="ส่งคำสั่ง /mybots และเลือก Bot ที่ต้องการ" />
                      <StepItem num="3" text="เลือกเมนู API Token เพื่อดูรหัสเข้าถึง" />
                      <StepItem num="4" text="คัดลอก HTTP API Token มาวางในช่องด้านล่าง" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Token Input Section */}
            <div className={`w-full bg-slate-50/80 rounded-[2.5rem] p-8 mb-10 border shadow-inner transition-colors ${errorMsg ? 'border-red-300 bg-red-50/30' : 'border-slate-100'}`}>
              
              {errorMsg && (
                <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-100/50 p-3 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <Key size={18} className="text-[#0088cc]" />
                <h4 className="text-slate-900 font-bold">HTTP API Token</h4>
              </div>
              <input
                type="text"
                disabled={isLoading}
                placeholder="เช่น 123456789:ABCdefGHIjklMNO..."
                value={botToken}
                onChange={(e) => {
                  setBotToken(e.target.value);
                  setErrorMsg(""); 
                }}
                className="w-full bg-white border border-slate-200 focus:border-[#0088cc]/50 focus:ring-4 focus:ring-[#0088cc]/5 outline-none rounded-2xl py-4 px-6 text-slate-700 font-bold transition-all placeholder:text-slate-200 disabled:opacity-50"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    disabled={isLoading}
                    className="peer appearance-none w-7 h-7 rounded-xl border-2 border-slate-200 checked:bg-[#0088cc] checked:border-[#0088cc] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    checked={checked}
                    onChange={(e) => setChecked(e.target.checked)}
                  />
                  <CheckCircle2 size={16} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <span className={`text-base font-bold tracking-tight transition-colors ${checked ? 'text-slate-900' : 'text-slate-400'}`}>
                  ฉันได้รับ API Token เรียบร้อยแล้ว
                </span>
              </label>

              <button
                disabled={!checked || !botToken || isLoading}
                onClick={handleConnect}
                className={`flex items-center gap-3 px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all
                  ${checked && botToken && !isLoading
                    ? 'bg-[#0088cc] text-white shadow-xl shadow-[#0088cc]/30 hover:scale-[1.03] active:scale-95 cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Complete Connection
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center opacity-20 text-[9px] font-black uppercase tracking-[0.5em] shrink-0">
            Authorized Telegram Bot Integration Layer
        </div>
      </div>
    </div>
  );
}

function StepItem({ num, text, isLink = false, link = "" }) {
  return (
    <div className="flex items-start gap-4 group">
      <span className="w-6 h-6 rounded-lg bg-slate-100 text-[#0088cc] text-[10px] font-black flex items-center justify-center shrink-0 mt-1 transition-colors group-hover:bg-[#0088cc] group-hover:text-white">
        {num}
      </span>
      <div>
        <p className="text-slate-600 text-[15px] font-semibold leading-relaxed transition-colors group-hover:text-slate-900">{text}</p>
        {isLink && (
          <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#0088cc] text-xs font-bold mt-1.5 hover:underline">
            Go to BotFather <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}