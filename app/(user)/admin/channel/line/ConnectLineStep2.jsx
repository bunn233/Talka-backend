"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Shield, ChevronRight, Key, Loader2 } from "lucide-react";

export default function ConnectLineStep2({ onBack, onNext }) {
  const [checked, setChecked] = useState(false);
  const [channelId, setChannelId] = useState("");
  const [channelSecret, setChannelSecret] = useState("");
  const [accessToken, setAccessToken] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);  
  const [activeWsId, setActiveWsId] = useState(null); // 🔥 1. สร้าง State

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

  const handleSave = async () => {
    setIsLoading(true);
    try {
        if (!activeWsId) {
          throw new Error("ไม่พบข้อมูลพื้นที่ทำงาน (Workspace) กรุณาเลือกทีมก่อนเชื่อมต่อ หรือลองรีเฟรชหน้าเว็บ");
        }

        const res = await fetch("/api/channels/line", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                channelId: channelId.trim(),
                channelSecret: channelSecret.trim(),
                accessToken: accessToken.trim(),
                channelName: "LINE OA",
                workspaceId: activeWsId // 🔥 3. ส่งไปให้ API
            })
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
        
        onNext();

    } catch (error) {
        alert("❌ " + error.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[90vh] p-4 md:p-8 font-sans relative overflow-hidden animate-in fade-in duration-500">
      
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
            <span>Secure Data Entry</span>
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10">
          <div className="max-w-3xl mx-auto">
            
            {/* Header Section */}
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 text-[#06C755] mb-3 bg-[#06C755]/5 px-3 py-1 rounded-full">
                <Key size={16} />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Step 2 of 3</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Channel Information</h1>
              <p className="text-slate-500 text-base mt-2 font-medium">ระบุข้อมูลประจำตัวบอทจาก LINE Developers Console</p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-2">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#06C755] flex items-center justify-center text-white shadow-lg shadow-[#06C755]/20">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configure</span>
              </div>
              <div className="w-8 h-px bg-[#06C755]"></div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#06C755] border-2 border-[#06C755] flex items-center justify-center text-white font-black text-xs shadow-lg shadow-[#06C755]/20">
                  2
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Information</span>
              </div>
              <div className="w-8 h-px bg-slate-100"></div>
              <div className="flex items-center gap-2 shrink-0 opacity-30">
                <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center text-slate-400 font-black text-xs">
                  3
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Webhook</span>
              </div>
            </div>

            {/* Instructions & Inputs */}
            <div className="space-y-6 mb-10">
              <div className="flex items-start gap-4 group">
                <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-1 group-focus-within:bg-[#06C755] group-focus-within:text-white transition-all">1</div>
                <div className="flex-1">
                  <p className="text-slate-700 text-[16px] font-semibold mb-3">ไปที่หัวข้อ Basic Settings แล้วคัดลอก Channel ID มาวาง:</p>
                  <input
                    type="text"
                    placeholder="เช่น 1653792148"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 focus:border-[#06C755]/50 focus:bg-white focus:ring-4 focus:ring-[#06C755]/5 outline-none rounded-2xl px-5 py-4 text-slate-700 font-bold transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-1 group-focus-within:bg-[#06C755] group-focus-within:text-white transition-all">2</div>
                <div className="flex-1">
                  <p className="text-slate-700 text-[16px] font-semibold mb-3">เลื่อนลงมาที่หัวข้อ Channel Secret แล้วกด Issue เพื่อรับรหัส:</p>
                  <input
                    type="password"
                    placeholder="เช่น 2f7f2dc47c..."
                    value={channelSecret}
                    onChange={(e) => setChannelSecret(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 focus:border-[#06C755]/50 focus:bg-white focus:ring-4 focus:ring-[#06C755]/5 outline-none rounded-2xl px-5 py-4 text-slate-700 font-bold transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-1 group-focus-within:bg-[#06C755] group-focus-within:text-white transition-all">3</div>
                <div className="flex-1">
                  <p className="text-slate-700 text-[16px] font-semibold mb-3">ไปที่แท็บ Messaging API คัดลอก Channel Access Token (Long-lived):</p>
                  <textarea
                    placeholder="eyJhbGciOiJIUz..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    rows="3"
                    className="w-full bg-slate-50 border border-slate-100 focus:border-[#06C755]/50 focus:bg-white focus:ring-4 focus:ring-[#06C755]/5 outline-none rounded-2xl px-5 py-4 text-slate-700 font-bold transition-all placeholder:text-slate-300 resize-none custom-scrollbar"
                  />
                </div>
              </div>
            </div>

            {/* Confirmation & Action */}
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
                    ฉันกรอกข้อมูลครบถ้วนและถูกต้องแล้ว
                  </span>
                </label>

                <button
                  disabled={!checked || !channelId || !channelSecret || !accessToken || isLoading}
                  onClick={handleSave}
                  className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-sm transition-all
                    ${checked && channelId && channelSecret && accessToken && !isLoading
                      ? 'bg-[#06C755] text-white shadow-xl shadow-[#06C755]/20 hover:scale-[1.03] active:scale-95' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : "ดำเนินการต่อ"}
                  {!isLoading && <ChevronRight size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-4 text-center border-t border-slate-50 bg-slate-50/50">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-300">Channel Credentials Protection Active</p>
        </div>
      </div>
    </div>
  );
}