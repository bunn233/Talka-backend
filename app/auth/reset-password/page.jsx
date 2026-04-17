"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, X, CheckCircle, AlertCircle, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ต้องครอบด้วย Suspense เพราะใช้ useSearchParams() ใน Next.js 13+ App Router
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1a1a2e] flex justify-center items-center text-white">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorPass, setErrorPass] = useState("");
  const [errorConfirm, setErrorConfirm] = useState("");

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [pwdStrength, setPwdStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  const [popup, setPopup] = useState({
    show: false,
    message: "",
    success: false,
  });

  // เช็คว่าถ้าเข้าลิงก์มามั่วๆ ไม่มี token ให้เด้งกลับหน้าล็อกอิน
  useEffect(() => {
    if (!token || !email) {
      setPopup({ show: true, message: "ลิงก์สำหรับเปลี่ยนรหัสผ่านไม่ถูกต้อง หรือหมดอายุแล้ว", success: false });
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
    }
  }, [token, email, router]);

  // เช็คเงื่อนไขรหัสผ่านอัตโนมัติ
  useEffect(() => {
    setPwdStrength({
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    });
  }, [password]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    let hasError = false;

    const isPwdValid = pwdStrength.length && pwdStrength.uppercase && pwdStrength.number && pwdStrength.special;
    if (!isPwdValid) { setErrorPass("รหัสผ่านไม่ตรงตามเงื่อนไข"); hasError = true; } else setErrorPass("");

    if (!confirm.trim()) {
      setErrorConfirm("โปรดยืนยันรหัสผ่าน");
      hasError = true;
    } else if (confirm !== password) {
      setErrorConfirm("รหัสผ่านไม่ตรงกัน");
      hasError = true;
    } else setErrorConfirm("");

    if (hasError) return;
    
    setIsSubmitting(true);
    try {
      // ⚠️ ต้องไปสร้าง API สำหรับเช็ค Token และอัปเดตรหัสผ่านที่ฝั่งหลังบ้านด้วย
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPassword: password }), 
      });

      const data = await response.json();

      if (response.ok) {
        setPopup({ show: true, message: "เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่", success: true });
        setTimeout(() => {
          setPopup((p) => ({ ...p, show: false }));
          router.push("/auth/login"); 
        }, 3000);
      } else {
        setPopup({ show: true, message: data.error || "ลิงก์หมดอายุหรือมีบางอย่างผิดพลาด", success: false });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setPopup({ show: true, message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", success: false });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setPopup((p) => ({ ...p, show: false })), 3000);
    }
  };

  const closePopup = () => setPopup((p) => ({ ...p, show: false }));

  // ถ้าเข้ามาแบบไม่มี Token ให้ซ่อนฟอร์มไว้ก่อน (รอเด้งออก)
  if (!token || !email) {
      return (
          <div className="relative flex justify-center items-center min-h-screen bg-[#0f0f14]">
             {/* แสดงแค่พื้นหลังมืดๆ รอเด้ง */}
             <AnimatePresence>
                {popup.show && (
                  <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div className={`relative w-[400px] min-h-[280px] bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8 flex flex-col justify-center items-center gap-6 text-center shadow-red-500/20`} initial={{ scale: 0.8, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}>
                      <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-2 bg-red-100 text-red-500">
                        <AlertCircle size={48} strokeWidth={2.5} />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-800">Failed</h2>
                        <p className="text-gray-500 font-medium">{popup.message}</p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
      )
  }

  return (
    <div className="relative flex justify-center items-center min-h-screen">
      <motion.div
        className="absolute inset-0 z-0"
        animate={{
          background: [
            "linear-gradient(135deg, #0f0f14, #1a1a2e, #0f0f14)",
            "linear-gradient(135deg, #1a1a2e, #0f0f14, #1a1a2e)",
          ],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.div className="absolute w-[600px] h-[600px] bg-[rgba(184,110,159,0.69)] rounded-full filter blur-3xl opacity-40" initial={{ x: -480, y: -50 }} animate={{ x: [-480, 480, -480] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[500px] h-[500px] bg-[rgba(110,184,159,0.69)] rounded-full filter blur-3xl opacity-40" initial={{ x: 480, y: 100 }} animate={{ x: [480, -480, 480] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />

      <div className="flex w-[1280px] h-[800px] bg-[rgba(152,85,120,0.6)] backdrop-blur-md rounded-3xl shadow-2xl relative overflow-hidden z-10">
        
        <div className="flex flex-col justify-center pl-16 w-1/2 text-white relative z-10 font-inter">
          <h1 className="text-[40px] font-extrabold mb-1 tracking-tight">SECURITY</h1>
          <h2 className="text-[32px] font-light mb-4 text-[#E8E3F2]">Reset Password</h2>
          <p className="text-[18px] font-light text-[#B9B3C9] leading-[140%]">
            ปกป้องบัญชีของคุณ <br />
            ด้วยการตั้งรหัสผ่านใหม่ที่ปลอดภัยยิ่งขึ้น
          </p>
        </div>

        <div className="flex justify-center items-center w-1/2 z-20">
          <div className="w-[460px] bg-gradient-to-b from-[#ffffff] via-[#f7ebff] to-[#e6d6ff] rounded-3xl shadow-xl p-10 flex flex-col items-center relative min-h-[500px]">
            
            <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 shadow-sm border border-purple-200">
                <KeyRound size={28} />
            </div>
            
            <h1 className="text-[26px] font-semibold text-gray-800 mb-1">Set New Password</h1>
            <p className="text-gray-500 mb-6 text-xs text-center">
                ตั้งรหัสผ่านใหม่สำหรับอีเมล <br/>
                <span className="font-bold text-gray-700">{email}</span>
            </p>

            <form className="w-full space-y-5" onSubmit={handleResetPassword}>
              
              {/* New Password */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className={`flex items-center border rounded-full px-3 py-2.5 ${errorPass ? "border-red-500" : "border-gray-300"} focus-within:ring-1 focus-within:ring-purple-400 bg-transparent z-10 relative`}>
                  <Lock className="text-purple-600 mr-2" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="รหัสผ่านใหม่" 
                    className="w-full outline-none placeholder-gray-400 text-black bg-transparent" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <span className="w-px h-5 bg-gray-300 mx-2"></span>
                  <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errorPass && !isPasswordFocused && password.length === 0 && (
                  <p className="text-red-500 text-xs absolute left-3 bottom-[-18px]">{errorPass}</p>
                )}

                {/* อนิเมชั่นเงื่อนไขรหัสผ่าน */}
                <AnimatePresence>
                  {(isPasswordFocused || password.length > 0) && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="px-3 grid grid-cols-2 gap-y-1.5 text-[11px] text-gray-500 overflow-hidden"
                    >
                      <div className={`flex items-center gap-1.5 ${pwdStrength.length ? 'text-green-600 transition-colors' : ''}`}>
                        {pwdStrength.length ? <CheckCircle size={12} className="text-green-500"/> : <div className="w-3 h-3 rounded-full bg-gray-300" />} At least 12 chars
                      </div>
                      <div className={`flex items-center gap-1.5 ${pwdStrength.uppercase ? 'text-green-600 transition-colors' : ''}`}>
                        {pwdStrength.uppercase ? <CheckCircle size={12} className="text-green-500"/> : <div className="w-3 h-3 rounded-full bg-gray-300" />} Uppercase letter
                      </div>
                      <div className={`flex items-center gap-1.5 ${pwdStrength.number ? 'text-green-600 transition-colors' : ''}`}>
                        {pwdStrength.number ? <CheckCircle size={12} className="text-green-500"/> : <div className="w-3 h-3 rounded-full bg-gray-300" />} Number
                      </div>
                      <div className={`flex items-center gap-1.5 ${pwdStrength.special ? 'text-green-600 transition-colors' : ''}`}>
                        {pwdStrength.special ? <CheckCircle size={12} className="text-green-500"/> : <div className="w-3 h-3 rounded-full bg-gray-300" />} Special char
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Confirm Password */}
              <div className="relative pt-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className={`flex items-center border rounded-full px-3 py-2.5 ${errorConfirm ? "border-red-500" : "border-gray-300"} focus-within:ring-1 focus-within:ring-purple-400`}>
                  <Lock className="text-purple-600 mr-2" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="ยืนยันรหัสผ่านใหม่" 
                    className="w-full outline-none placeholder-gray-400 text-black bg-transparent" 
                    value={confirm} 
                    onChange={(e) => setConfirm(e.target.value)} 
                  />
                </div>
                {errorConfirm && <p className="text-red-500 text-xs absolute left-3 bottom-[-18px]">{errorConfirm}</p>}
              </div>

              <div className="pt-4 space-y-2 mt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ background: "#5d3d99", backgroundImage: "linear-gradient(140deg, rgba(93, 61, 153, 1) 0%, rgba(201, 117, 173, 1) 100%)" }} 
                  className="w-full flex justify-center text-white py-3 rounded-full transition shadow-md hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? <span className="animate-spin">⏳</span> : "บันทึกรหัสผ่านใหม่"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Popup แจ้งเตือน */}
      <AnimatePresence>
        {popup.show && (
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={`relative w-[400px] min-h-[280px] bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8 flex flex-col justify-center items-center gap-6 text-center ${popup.success ? "shadow-purple-500/20" : "shadow-red-500/20"}`} initial={{ scale: 0.8, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}>
              {!isSubmitting && (
                <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-transform hover:rotate-90 duration-300" onClick={closePopup}>
                  <X size={20} />
                </button>
              )}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-2 ${popup.success ? "bg-green-100 text-green-600" : "bg-red-100 text-red-500"}`}>
                {popup.success ? <CheckCircle size={48} strokeWidth={2.5} /> : <AlertCircle size={48} strokeWidth={2.5} />}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">{popup.success ? "Success!" : "Failed"}</h2>
                <p className="text-gray-500 font-medium">{popup.message}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}