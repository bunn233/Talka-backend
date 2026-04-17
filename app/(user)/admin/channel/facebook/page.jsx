"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Facebook,
  CheckCircle2,
  Shield,
  Zap,
  Link2,
  MessageSquare,
  Check,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";

export default function ConnectFacebook({ onBack }) {
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
    pageName: "",
    pageId: "",
    accessToken: "",
  });

  // 🔥 ฟังก์ชันดึง Workspace ID ปัจจุบัน (ดึงตอนโหลดหน้าเลย)
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
        throw new Error(
          "ไม่พบข้อมูลพื้นที่ทำงาน (Workspace) กรุณาเลือกทีมก่อนเชื่อมต่อ หรือลองรีเฟรชหน้าเว็บ",
        );
      }

      // 1. เช็ค Token และดึงชื่อเพจของจริงจาก Meta ก่อน
      const cleanToken = formData.accessToken.trim();
      const fbRes = await fetch(
        `https://graph.facebook.com/v21.0/${formData.pageId}?fields=name&access_token=${cleanToken}`,
      );
      const fbData = await fbRes.json();

      if (fbData.error) {
        throw new Error(
          fbData.error.message || "Page ID หรือ Token ไม่ถูกต้อง",
        );
      }

      const realPageName = fbData.name; // ได้ชื่อเพจของจริงมาแล้ว!

      // 2. ส่งข้อมูลไปบันทึกที่ API ของเรา
      const res = await fetch("/api/channels/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platformName: "FACEBOOK",
          pageId: formData.pageId,
          pageName: realPageName, 
          accessToken: cleanToken,
          workspaceId: activeWsId // 🔥 ใช้ ID ที่ดึงมาจาก API
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }

      // เก็บชื่อเพจไว้เพื่อโชว์ใน Success Modal
      setFormData((prev) => ({ ...prev, pageName: realPageName }));
      setShowModal(true);
    } catch (error) {
      alert("❌ " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full min-h-[90vh] p-4 md:p-10 text-[#1E293B] font-sans relative overflow-hidden animate-in fade-in duration-500">
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] blur-[120px] rounded-full pointer-events-none bg-[#1877F2]/10"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] blur-[120px] rounded-full pointer-events-none bg-blue-400/10"></div>

      <div className="relative z-10 bg-white border border-slate-200/50 rounded-[3rem] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.06)] h-full flex flex-col p-6 md:p-12 overflow-hidden">
        <div className="shrink-0 mb-8 flex justify-between items-center">
          <button
            onClick={step === 0 ? onBack : () => setStep(step - 1)}
            className="flex items-center gap-3 text-slate-400 hover:text-[#1877F2] transition-all group font-bold text-xs uppercase tracking-widest"
          >
            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center shadow-sm group-hover:bg-blue-50 transition-all border border-slate-100 group-hover:border-blue-100">
              <ArrowLeft size={18} />
            </div>
            <span>{step === 0 ? "Catalog" : "Back"}</span>
          </button>

          <div className="flex items-center gap-2 text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
            <Shield size={14} /> Secure Setup
          </div>
        </div>

        {/* 🔥 จัดให้อยู่กึ่งกลางหน้าจอเสมอถ้าเป็น Step 0 */}
        <div
          className={`flex-1 flex flex-col items-center relative z-10 w-full overflow-y-auto custom-scrollbar px-2 ${step === 0 ? "justify-center" : ""}`}
        >
          {/* =========================================
              STEP 0: INTRO (Centered)
          ========================================= */}
          {step === 0 && (
            <div className="max-w-2xl w-full text-center flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500 pb-10 mt-[-40px]">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white text-slate-700 text-[10px] font-black uppercase tracking-[0.2em] mb-14 border border-slate-100 shadow-sm">
                <Zap size={14} className="fill-[#1877F2] text-[#1877F2]" />
                <span>Step 1: Secure Authorization</span>
                <div className="w-px h-3 bg-slate-200 mx-1"></div>
                <span className="text-[#1877F2]">
                  Authorized Meta Integration Hub
                </span>
              </div>

              <div className="relative mb-20 w-full max-w-sm h-32 flex items-center justify-center">
                <div className="absolute inset-x-0 h-px bg-slate-100 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300">
                    <Link2 size={18} />
                  </div>
                </div>

                <div className="flex justify-between w-full relative z-10 px-4">
                  <div
                    className="w-24 h-24 rounded-[2.2rem] bg-white border border-slate-100 shadow-xl flex flex-col items-center justify-center gap-2 animate-bounce transition-all duration-1000"
                    style={{ animationDuration: "3s" }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
                      <MessageSquare
                        size={28}
                        fill="currentColor"
                        className="opacity-80"
                      />
                    </div>
                    <div className="w-8 h-1 bg-slate-100 rounded-full"></div>
                  </div>

                  <div
                    className="w-24 h-24 rounded-[2.2rem] bg-white border border-slate-100 shadow-xl flex flex-col items-center justify-center gap-2 animate-bounce transition-all duration-1000"
                    style={{ animationDuration: "3s", animationDelay: "1.5s" }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2]">
                      <Facebook size={28} fill="currentColor" />
                    </div>
                    <div className="w-8 h-1 bg-blue-50 rounded-full"></div>
                  </div>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-6">
                Connect <span className="text-[#1877F2]">Facebook Page</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-12 max-w-lg mx-auto font-medium">
                เชื่อมต่อ Facebook Page ของคุณแบบแมนนวล
                เพื่อรวมศูนย์การจัดการแชท และตอบกลับลูกค้าได้จากหน้าจอเดียว
              </p>

              <button
                onClick={() => setStep(1)}
                className="group relative inline-flex items-center justify-center gap-4 px-12 py-5 rounded-[2rem] bg-[#1877F2] hover:bg-[#166FE5] text-white transition-all shadow-[0_20px_40px_-10px_rgba(24,119,242,0.4)] hover:shadow-[0_24px_48px_-10px_rgba(24,119,242,0.5)] hover:scale-[1.03] active:scale-95"
              >
                <Facebook size={22} fill="currentColor" />
                <span className="text-sm font-black uppercase tracking-[0.2em]">
                  Start Configuration
                </span>
              </button>
            </div>
          )}

          {/* =========================================
              STEPS 1 - 3 HEADER
          ========================================= */}
          {step > 0 && (
            <div className="max-w-3xl w-full flex flex-col items-center">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4 border border-blue-100">
                  <CheckCircle2 size={12} />
                  <span>Step {step} of 3</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
                  {step === 1 && "Configure Meta App"}
                  {step === 2 && "Page Information"}
                  {step === 3 && "Enable Webhook"}
                </h1>
                <p className="text-slate-500 font-medium text-sm">
                  {step === 1 &&
                    "ตั้งค่าแอปพลิเคชันบน Meta for Developers เพื่อขอสิทธิ์ดึงข้อมูล"}
                  {step === 2 &&
                    "ระบุ Page ID และ Access Token ของเพจที่คุณต้องการเชื่อมต่อ"}
                  {step === 3 &&
                    "ตั้งค่า Webhook เพื่อรับส่งข้อความแบบ Real-time ให้กับระบบ"}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center justify-center w-full max-w-lg mb-12">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white transition-all duration-300 ${step >= 1 ? "bg-[#1877F2] shadow-md shadow-[#1877F2]/30" : "bg-slate-200 text-slate-400"}`}
                  >
                    {step > 1 ? <Check size={14} strokeWidth={3} /> : "1"}
                  </div>
                  <span
                    className={step >= 1 ? "text-[#1877F2]" : "text-slate-400"}
                  >
                    Configure
                  </span>
                </div>

                <div
                  className={`flex-1 h-px mx-4 transition-all duration-300 ${step >= 2 ? "bg-[#1877F2]" : "bg-slate-200"}`}
                ></div>

                <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white transition-all duration-300 ${step >= 2 ? "bg-[#1877F2] shadow-md shadow-[#1877F2]/30" : "bg-slate-200 text-slate-400"}`}
                  >
                    {step > 2 ? <Check size={14} strokeWidth={3} /> : "2"}
                  </div>
                  <span
                    className={step >= 2 ? "text-[#1877F2]" : "text-slate-400"}
                  >
                    Information
                  </span>
                </div>

                <div
                  className={`flex-1 h-px mx-4 transition-all duration-300 ${step >= 3 ? "bg-[#1877F2]" : "bg-slate-200"}`}
                ></div>

                <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white transition-all duration-300 ${step >= 3 ? "bg-[#1877F2] shadow-md shadow-[#1877F2]/30" : "bg-slate-200 text-slate-400"}`}
                  >
                    3
                  </div>
                  <span
                    className={step >= 3 ? "text-[#1877F2]" : "text-slate-400"}
                  >
                    Webhook
                  </span>
                </div>
              </div>

              {/* =========================================
                  STEP 1: CONFIGURE (Facebook Guide)
              ========================================= */}
              {step === 1 && (
                <div className="w-full space-y-4 animate-in slide-in-from-right-8 duration-500 pb-10">
                  <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-5 hover:bg-blue-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center text-[#1877F2] font-bold text-sm shrink-0 shadow-sm">
                      1
                    </div>
                    <div className="pt-1.5 flex flex-col gap-1">
                      <p className="text-slate-700 font-semibold text-sm">
                        เข้าสู่ระบบใน{" "}
                        <a
                          href="https://developers.facebook.com/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1877F2] hover:underline inline-flex items-center gap-1"
                        >
                          Meta for Developers <ExternalLink size={12} />
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-5 hover:bg-blue-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center text-[#1877F2] font-bold text-sm shrink-0 shadow-sm">
                      2
                    </div>
                    <div className="pt-1.5 flex flex-col gap-1">
                      <p className="text-slate-700 font-semibold text-sm">
                        กดปุ่ม <b>Create App</b> เลือกประเภทแอปเป็น{" "}
                        <span className="text-[#1877F2]">
                          ธุรกิจ (Business)
                        </span>
                      </p>
                      <p className="text-slate-500 text-xs">
                        หากไม่มีให้เลือกธุรกิจ สามารถเลือก อื่นๆ {">"} ผู้บริโภค
                        แทนได้
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-5 hover:bg-blue-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center text-[#1877F2] font-bold text-sm shrink-0 shadow-sm">
                      3
                    </div>
                    <div className="pt-1.5">
                      <p className="text-slate-700 font-semibold text-sm">
                        ในหน้า Dashboard เพิ่มผลิตภัณฑ์{" "}
                        <span className="font-bold text-[#1877F2]">
                          Messenger
                        </span>{" "}
                        ลงในแอปของคุณ
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-5 hover:bg-blue-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center text-[#1877F2] font-bold text-sm shrink-0 shadow-sm">
                      4
                    </div>
                    <div className="pt-1.5 flex flex-col gap-2">
                      <p className="text-slate-700 font-semibold text-sm">
                        ไปที่เมนู{" "}
                        <b>Messenger {">"} การตั้งค่า API (API Setup)</b>
                      </p>
                      <p className="text-slate-500 text-xs leading-relaxed">
                        ภายใต้หัวข้อ Access Tokens ให้กด{" "}
                        <b>เพิ่มเพจ (Add Page)</b> เพื่อเลือกเพจ จากนั้นกดปุ่ม{" "}
                        <b>สร้าง (Generate)</b> เพื่อรับ Token และคัดลอกเก็บไว้
                      </p>
                    </div>
                  </div>

                  <div className="mt-10 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${agreedStep1 ? "bg-[#1877F2] border-[#1877F2]" : "bg-white border-slate-300 group-hover:border-blue-400"}`}
                      >
                        {agreedStep1 && (
                          <Check
                            size={14}
                            className="text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={agreedStep1}
                        onChange={() => setAgreedStep1(!agreedStep1)}
                      />
                      <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                        ฉันได้รับ Token เรียบร้อยแล้ว
                      </span>
                    </label>

                    <button
                      onClick={handleNextStep}
                      disabled={!agreedStep1}
                      className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      ดำเนินการต่อ{" "}
                      <ArrowLeft size={16} className="rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {/* =========================================
                  STEP 2: INFORMATION (Form - ถอดการกรอกชื่อออก)
              ========================================= */}
              {step === 2 && (
                <div className="w-full animate-in slide-in-from-right-8 duration-500 pb-10">
                  <form className="space-y-4">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex flex-col gap-4 hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center text-[#1877F2] font-bold text-sm shrink-0 shadow-sm">
                          1
                        </div>
                        <p className="text-slate-700 font-semibold text-sm">
                          ระบุ Page ID (ดูได้จากหน้าตั้งค่าเพจบน Facebook
                          ส่วนของข้อมูลพื้นฐาน)
                        </p>
                      </div>
                      <div className="ml-12">
                        <input
                          type="text"
                          name="pageId"
                          placeholder="เช่น 1062419683622274"
                          value={formData.pageId}
                          onChange={handleChange}
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-[#1877F2] focus:ring-4 focus:ring-[#1877F2]/10 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex flex-col gap-4 hover:bg-blue-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white border border-blue-100 flex items-center justify-center text-[#1877F2] font-bold text-sm shrink-0 shadow-sm">
                          2
                        </div>
                        <p className="text-slate-700 font-semibold text-sm">
                          วาง Page Access Token ที่สร้างไว้จากขั้นตอนแรก
                        </p>
                      </div>
                      <div className="ml-12">
                        <textarea
                          name="accessToken"
                          placeholder="EAAN1bv..."
                          value={formData.accessToken}
                          onChange={handleChange}
                          rows="3"
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:border-[#1877F2] focus:ring-4 focus:ring-[#1877F2]/10 outline-none transition-all resize-none"
                        />
                      </div>
                    </div>

                    <div className="mt-10 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${agreedStep2 ? "bg-[#1877F2] border-[#1877F2]" : "bg-white border-slate-300 group-hover:border-blue-400"}`}
                        >
                          {agreedStep2 && (
                            <Check
                              size={14}
                              className="text-white"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={agreedStep2}
                          onChange={() => setAgreedStep2(!agreedStep2)}
                        />
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                          ฉันกรอก ID และ Token ครบถ้วนแล้ว
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={handleNextStep}
                        disabled={
                          !agreedStep2 ||
                          !formData.pageId ||
                          !formData.accessToken
                        }
                        className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        ดำเนินการต่อ{" "}
                        <ArrowLeft size={16} className="rotate-180" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* =========================================
                  STEP 3: WEBHOOK (Final)
              ========================================= */}
              {step === 3 && (
                <div className="w-full animate-in slide-in-from-right-8 duration-500 pb-10">
                  <div className="space-y-4">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-5 hover:bg-blue-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white border border-blue-200 flex items-center justify-center text-[#1877F2] font-bold text-sm shrink-0 shadow-sm">
                        1
                      </div>
                      <div className="pt-1.5 flex flex-col gap-1">
                        <p className="text-slate-700 font-semibold text-sm">
                          ในหน้าตั้งค่า Messenger ของ Meta เลื่อนลงมาที่หัวข้อ{" "}
                          <span className="font-bold text-[#1877F2]">
                            Webhooks
                          </span>
                        </p>
                        <p className="text-slate-500 text-xs">
                          คลิกที่ <b>Add Callback URL</b>{" "}
                          เพื่อตั้งค่าตัวรับข้อความ
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50/40 border border-blue-100 rounded-[2rem] p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-white border border-blue-200 flex items-center justify-center text-[#1877F2] font-bold text-sm shrink-0 shadow-sm">
                          2
                        </div>
                        <p className="text-slate-700 font-semibold text-sm">
                          คัดลอก URL ด้านล่างนี้ไปวางในช่อง{" "}
                          <span className="font-bold text-[#1877F2]">
                            Callback URL
                          </span>
                        </p>
                      </div>
                      <div className="ml-12 relative">
                        <input
                          type="text"
                          readOnly
                          value={webhookUrl}
                          className="w-full pl-5 pr-24 py-4 bg-white border border-blue-200 text-blue-700 rounded-xl text-sm font-medium outline-none"
                        />
                        <button
                          onClick={() => handleCopy(webhookUrl)}
                          className="absolute right-2 top-2 bottom-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 border border-blue-100"
                        >
                          {copied ? (
                            <>
                              <Check size={14} /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 flex items-start gap-5 hover:bg-blue-50/50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-white border border-blue-200 flex items-center justify-center text-[#1877F2] font-bold text-sm shrink-0 shadow-sm">
                        3
                      </div>
                      <div className="pt-1.5 flex flex-col gap-2">
                        <p className="text-slate-700 font-semibold text-sm">
                          ใส่รหัส{" "}
                          <span className="font-bold text-[#1877F2]">
                            Verify Token
                          </span>{" "}
                          ที่คุณตั้งไว้ในระบบ (เช่น talka_verify) และกด Verify
                          and Save
                        </p>
                        <p className="text-slate-500 text-xs">
                          หลังจากบันทึกแล้ว ให้กดปุ่ม <b>Manage (จัดการ)</b>{" "}
                          ที่หน้าเพจของคุณ และติ๊กเลือก{" "}
                          <span className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono">
                            messages
                          </span>{" "}
                          เพื่อเปิดรับข้อความ
                        </p>
                      </div>
                    </div>

                    {/* Final Submit Button */}
                    <div className="mt-10 p-6 bg-slate-50 border border-slate-200 rounded-[2rem] flex flex-col sm:flex-row items-center justify-center gap-6">
                      <button
                        onClick={handleFinish}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-12 py-4 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-[0_10px_20px_-10px_rgba(24,119,242,0.5)] active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
                      >
                        {isSubmitting ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          "บันทึกและเชื่อมต่อเพจ"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- SUCCESS MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-300">
          <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-[#1877F2] shadow-inner relative overflow-hidden">
              <CheckCircle2
                size={48}
                strokeWidth={2.5}
                className="relative z-10"
              />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3">
              Linked Successfully
            </h2>
            <p className="text-slate-500 mb-10 font-medium text-sm leading-relaxed">
              เชื่อมต่อ{" "}
              <span className="text-slate-800 font-bold">
                "{formData.pageName}"
              </span>{" "}
              สำเร็จแล้ว! ระบบดึงข้อมูลเพจมาเรียบร้อย
            </p>
            <button
              onClick={() => {
                setShowModal(false);
                if (onBack) onBack();
              }}
              className="w-full py-5 bg-[#1877F2] text-white rounded-2xl text-xs font-black uppercase tracking-[0.25em] hover:bg-[#166FE5] transition shadow-lg shadow-[#1877F2]/30 active:scale-95"
            >
              กลับสู่หน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}