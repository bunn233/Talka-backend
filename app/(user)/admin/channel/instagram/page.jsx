"use client";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Instagram, 
  CheckCircle2, 
  Shield, 
  Loader2, 
  Check, 
  Copy, 
  MessageSquare,
  Link2,
  Zap
} from "lucide-react";

export default function ConnectInstagram({ onBack }) {
  const [step, setStep] = useState(0); 
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeWsId, setActiveWsId] = useState(null);
  const currentHost = typeof window !== "undefined" ? window.location.origin : "";
  const webhookUrl = `${currentHost}/api/webhook/meta`;

  const [agreedStep1, setAgreedStep1] = useState(false);
  const [agreedStep2, setAgreedStep2] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    igName: "", 
    igId: "",
    accessToken: ""
  });

  // 2. ดึง Workspace ID ปัจจุบันจากฐานข้อมูลเมื่อโหลดหน้า
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      if (!activeWsId) {
        throw new Error("ไม่พบข้อมูลพื้นที่ทำงาน (Workspace) กรุณาเลือกทีมก่อนเชื่อมต่อ หรือรีเฟรชหน้าเว็บ");
      }

      const cleanToken = formData.accessToken.trim().replace(/[\n\r]/g, "");
      const cleanIgId = formData.igId.trim(); 

      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${cleanIgId}?fields=name,username,profile_picture_url&access_token=${cleanToken}`
      );
      const igData = await igRes.json();

      if (igData.error) {
        throw new Error(igData.error.message || "Token หรือ Instagram ID ไม่ถูกต้อง");
      }

      const realIgName = igData.name || igData.username || "Instagram Business";

      const res = await fetch('/api/channels/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName: 'INSTAGRAM',
          pageId: cleanIgId, 
          pageName: realIgName,
          accessToken: cleanToken,
          workspaceId: activeWsId // 🔥 3. ส่ง ID ไปกับ API
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }

      setFormData(prev => ({ ...prev, igName: realIgName }));
      setShowModal(true);

    } catch (error) {
      alert("❌ " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[90vh] p-4 md:p-10 text-[#1E293B] font-sans relative overflow-hidden animate-in fade-in duration-500">
      
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] blur-[120px] rounded-full pointer-events-none bg-[#E4405F]/5"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] blur-[120px] rounded-full pointer-events-none bg-[#833AB4]/5"></div>

      <div className="relative z-10 bg-white border border-slate-200/50 rounded-[3rem] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.06)] h-full flex flex-col p-6 md:p-12 overflow-hidden">
        
        {/* Navigation */}
        <div className="shrink-0 mb-8 flex justify-between items-center">
          <button onClick={step === 0 ? onBack : () => setStep(step - 1)} className="flex items-center gap-3 text-slate-400 hover:text-[#C13584] transition-all group font-bold text-xs uppercase tracking-widest">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm group-hover:bg-pink-50 transition-all border border-slate-100 group-hover:border-pink-100">
              <ArrowLeft size={18} />
            </div>
            <span>{step === 0 ? "Catalog" : "Back"}</span>
          </button>
          <div className="flex items-center gap-2 text-pink-600 bg-pink-50 border border-pink-100 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
            <Shield size={14} /> Secure Setup
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 flex flex-col items-center relative z-10 w-full overflow-y-auto custom-scrollbar px-2 ${step === 0 ? 'justify-center' : ''}`}>
          
          {step === 0 && (
            <div className="max-w-2xl w-full text-center flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500 pb-10 mt-[-40px]">
              
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white text-slate-700 text-[10px] font-black uppercase tracking-[0.2em] mb-14 border border-slate-100 shadow-sm">
                <Zap size={14} className="fill-[#C13584] text-[#C13584]" />
                <span>Authorized Meta Integration Hub</span>
              </div>

              <div className="relative mb-14 w-full max-w-sm h-32 flex items-center justify-center">
                  <div className="absolute inset-x-0 h-px bg-slate-100 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300">
                          <Link2 size={18} />
                      </div>
                  </div>
                  <div className="flex justify-between w-full relative z-10 px-4">
                      <div className="w-24 h-24 rounded-[2.2rem] bg-white border border-slate-100 shadow-xl flex flex-col items-center justify-center gap-2 animate-bounce transition-all duration-1000" style={{ animationDuration: '3s' }}>
                          <div className="w-12 h-12 rounded-2xl bg-[#BE7EC7]/10 flex items-center justify-center text-[#BE7EC7]">
                              <MessageSquare size={28} fill="currentColor" className="opacity-80" />
                          </div>
                          <div className="w-8 h-1 bg-slate-100 rounded-full"></div>
                      </div>
                      <div className="w-24 h-24 rounded-[2.2rem] bg-white border border-slate-100 shadow-xl flex flex-col items-center justify-center gap-2 animate-bounce transition-all duration-1000" style={{ animationDuration: '3s', animationDelay: '1.5s' }}>
                          <div className="w-12 h-12 rounded-2xl bg-[#C13584]/10 flex items-center justify-center text-[#C13584]">
                              <Instagram size={28} />
                          </div>
                          <div className="w-8 h-1 bg-pink-50 rounded-full"></div>
                      </div>
                  </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6">
                Connect <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F56040] to-[#C13584]">Instagram</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-lg mx-auto font-medium">
                เชื่อมต่อ Instagram Business ของคุณเพื่อรวมศูนย์การจัดการ Direct Message และตอบกลับลูกค้าได้ทันที
              </p>

              <button
                onClick={() => setStep(1)}
                className="group relative inline-flex items-center justify-center gap-4 px-12 py-5 rounded-[2rem] bg-gradient-to-tr from-[#F56040] to-[#C13584] text-white transition-all shadow-[0_20px_40px_-10px_rgba(193,53,132,0.4)] hover:shadow-[0_24px_48px_-10px_rgba(193,53,132,0.5)] hover:scale-[1.03] active:scale-95"
              >
                <Instagram size={22} />
                <span className="text-sm font-black uppercase tracking-[0.2em]">Start Configuration</span>
              </button>

            </div>
          )}

          {step > 0 && (
            <div className="max-w-3xl w-full flex flex-col items-center">
              
              <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-pink-50 text-pink-600 text-[10px] font-black uppercase tracking-widest mb-4 border border-pink-100">
                      <CheckCircle2 size={12} />
                      <span>Step {step} of 3</span>
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                      {step === 1 && "Configure Meta App"}
                      {step === 2 && "Enter Credentials"}
                      {step === 3 && "Activate Webhook"}
                  </h1>
              </div>

              {/* STEP 1 */}
              {step === 1 && (
                <div className="w-full space-y-4 animate-in slide-in-from-right-8 duration-500 pb-10">
                  <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-5 hover:bg-pink-50/30 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white border border-pink-100 flex items-center justify-center text-[#C13584] font-bold text-sm shrink-0 shadow-sm">1</div>
                      <div className="pt-1.5">
                          <p className="text-slate-700 font-semibold text-sm">เปลี่ยนบัญชี Instagram เป็น <span className="font-bold text-[#C13584]">Business Account</span> ในมือถือ</p>
                      </div>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-5 hover:bg-pink-50/30 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white border border-pink-100 flex items-center justify-center text-[#C13584] font-bold text-sm shrink-0 shadow-sm">2</div>
                      <div className="pt-1.5">
                          <p className="text-slate-700 font-semibold text-sm">ไปที่ Facebook Page Settings และเลือก <span className="font-bold text-[#C13584]">Linked Accounts</span> เพื่อเชื่อม Instagram</p>
                      </div>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-5 hover:bg-pink-50/30 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white border border-pink-100 flex items-center justify-center text-[#C13584] font-bold text-sm shrink-0 shadow-sm">3</div>
                      <div className="pt-1.5">
                          <p className="text-slate-700 font-semibold text-sm">ใน Meta Developers ให้เพิ่ม Product <span className="font-bold text-[#C13584]">Instagram Graph API</span></p>
                      </div>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-5 hover:bg-pink-50/30 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white border border-pink-100 flex items-center justify-center text-[#C13584] font-bold text-sm shrink-0 shadow-sm">4</div>
                      <div className="pt-1.5 flex flex-col gap-2">
                          <p className="text-slate-700 font-semibold text-sm">Generate Access Token โดยเลือกสิทธิ์ <span className="text-[#C13584] font-bold">instagram_manage_messages</span></p>
                      </div>
                  </div>

                  <div className="mt-10 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${agreedStep1 ? 'bg-[#C13584] border-[#C13584]' : 'bg-white border-slate-300 group-hover:border-pink-400'}`}>
                              {agreedStep1 && <Check size={14} className="text-white" strokeWidth={3} />}
                          </div>
                          <input type="checkbox" className="hidden" checked={agreedStep1} onChange={() => setAgreedStep1(!agreedStep1)} />
                          <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">ฉันตั้งค่าและผูกบัญชีเรียบร้อยแล้ว</span>
                      </label>
                      <button onClick={handleNextStep} disabled={!agreedStep1} className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50">
                          ดำเนินการต่อ
                      </button>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="w-full animate-in slide-in-from-right-8 duration-500 pb-10">
                  <form className="space-y-4">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex flex-col gap-4 hover:bg-pink-50/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white border border-pink-100 flex items-center justify-center text-[#C13584] font-bold text-sm shrink-0 shadow-sm">1</div>
                            <p className="text-slate-700 font-semibold text-sm">Instagram Business ID (17 หลัก)</p>
                        </div>
                        <div className="ml-12">
                            <input 
                              type="text" name="igId" placeholder="เช่น 17841436434566884" value={formData.igId} onChange={handleChange}
                              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-[#C13584] focus:ring-4 focus:ring-pink-50 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex flex-col gap-4 hover:bg-pink-50/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-white border border-pink-100 flex items-center justify-center text-[#C13584] font-bold text-sm shrink-0 shadow-sm">2</div>
                            <p className="text-slate-700 font-semibold text-sm">Instagram Access Token (EAA...)</p>
                        </div>
                        <div className="ml-12">
                            <textarea 
                              name="accessToken" placeholder="IGQV..." value={formData.accessToken} onChange={handleChange} rows="3"
                              className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-[#C13584] focus:ring-4 focus:ring-pink-50 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="mt-10 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${agreedStep2 ? 'bg-[#C13584] border-[#C13584]' : 'bg-white border-slate-300 group-hover:border-pink-400'}`}>
                                {agreedStep2 && <Check size={14} className="text-white" strokeWidth={3} />}
                            </div>
                            <input type="checkbox" className="hidden" checked={agreedStep2} onChange={() => setAgreedStep2(!agreedStep2)} />
                            <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">ฉันกรอก ID และ Token ครบถ้วนแล้ว</span>
                        </label>
                        <button type="button" onClick={handleNextStep} disabled={!agreedStep2 || !formData.igId || !formData.accessToken} className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50">
                            ดำเนินการต่อ
                        </button>
                    </div>
                  </form>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="w-full animate-in slide-in-from-right-8 duration-500 pb-10 text-center">
                  <div className="bg-pink-50/40 border border-pink-100 rounded-[2rem] p-8 flex flex-col gap-4 text-left">
                      <p className="text-slate-700 font-bold text-sm">คัดลอก Callback URL ไปที่ Meta Developer:</p>
                      <div className="relative">
                          <input type="text" readOnly value={webhookUrl} className="w-full pl-5 pr-24 py-4 bg-white border border-pink-200 text-[#C13584] rounded-xl text-sm font-mono outline-none" />
                          <button onClick={() => handleCopy(webhookUrl)} className="absolute right-2 top-2 bottom-2 px-4 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-lg text-xs font-bold border border-pink-100">
                            {copied ? "Copied!" : "Copy"}
                          </button>
                      </div>
                  </div>
                  <button onClick={handleFinish} disabled={isSubmitting} className="mt-10 px-12 py-4 bg-gradient-to-tr from-[#F56040] to-[#C13584] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-3 mx-auto disabled:opacity-50">
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Verify & Connect Instagram"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SUCCESS MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-pink-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-[#C13584] shadow-inner">
              <CheckCircle2 size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">Linked Successfully</h2>
            <p className="text-slate-500 mb-10 font-medium text-sm leading-relaxed">
              เชื่อมต่อ <span className="text-slate-800 font-bold">"{formData.igName}"</span> สำเร็จแล้ว!
            </p>
            <button onClick={() => { setShowModal(false); onBack(); }} className="w-full py-5 bg-gradient-to-tr from-[#F56040] to-[#C13584] text-white rounded-2xl text-xs font-black uppercase tracking-[0.25em] hover:opacity-90 transition shadow-lg active:scale-95">
              กลับสู่หน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}