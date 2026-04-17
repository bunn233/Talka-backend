"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff, Mail, X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();

  // 🟢 State ของเดิม
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 🟢 State สำหรับตรวจสอบรหัสผ่าน
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [pwdStrength, setPwdStrength] = useState({
    length: false,
    uppercase: false,
    number: false,
    special: false
  });

  // 🟢 State สำหรับ OTP
  const [step, setStep] = useState(1); // 1 = สมัคร, 2 = ใส่ OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);

  // 🟢 State Error ของเดิม
  const [errorUsername, setErrorUsername] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPass, setErrorPass] = useState("");
  const [errorConfirm, setErrorConfirm] = useState("");

  const [popup, setPopup] = useState({
    show: false,
    message: "",
    success: false,
  });

  // เช็คเงื่อนไขรหัสผ่านอัตโนมัติ
  useEffect(() => {
    setPwdStrength({
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    });
  }, [password]);

  const handleRegister = async (e) => {
    e.preventDefault();
    let hasError = false;

    if (!username.trim()) { setErrorUsername("โปรดกรอกชื่อผู้ใช้ (Username)"); hasError = true; } else setErrorUsername("");
    if (!email.trim()) { setErrorEmail("โปรดกรอกอีเมล"); hasError = true; } else setErrorEmail("");
    
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
    
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }), 
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2); // เปลี่ยนไปหน้ากรอก OTP
      } else {
        setPopup({ show: true, message: data.message || "ไม่สามารถสมัครสมาชิกได้", success: false });
        setTimeout(() => setPopup((p) => ({ ...p, show: false })), 2000);
      }
    } catch (error) {
      setPopup({ show: true, message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", success: false });
      setTimeout(() => setPopup((p) => ({ ...p, show: false })), 2000);
    }
  };

  // จัดการ Input ของ OTP
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const handleOtpChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    
    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }), 
      });

      const data = await response.json();

      if (response.ok) {
        setPopup({ show: true, message: "ยืนยันอีเมลสำเร็จ! กรุณาเข้าสู่ระบบ", success: true });
        setTimeout(() => {
          setPopup((p) => ({ ...p, show: false }));
          router.push("/auth/login"); 
        }, 2000);
      } else {
        setPopup({ show: true, message: data.message || "รหัสยืนยันไม่ถูกต้อง", success: false });
        setTimeout(() => setPopup((p) => ({ ...p, show: false })), 2000);
      }
    } catch (error) {
      setPopup({ show: true, message: "ไม่สามารถตรวจสอบรหัสได้", success: false });
      setTimeout(() => setPopup((p) => ({ ...p, show: false })), 2000);
    } finally {
      setIsVerifying(false);
    }
  };

  const closePopup = () => setPopup((p) => ({ ...p, show: false }));

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

      <div className="flex w-[1280px] h-[800px] bg-[rgba(152,85,120,0.6)] backdrop-blur-md rounded-3xl shadow-2xl relative overflow-hidden z-10">
        
        {/* โครงสร้างฝั่งซ้ายของเดิม */}
        <div className="flex flex-col justify-center pl-16 w-1/2 text-white relative z-10 font-inter">
          <h1 className="text-[40px] font-extrabold mb-1 tracking-tight">JOIN US</h1>
          <h2 className="text-[32px] font-light mb-4 text-[#E8E3F2]">At Talka</h2>
          <p className="text-[18px] font-light text-[#B9B3C9] leading-[140%]">
            สมัครง่ายเพียงไม่กี่ขั้นตอน <br />
            เริ่มต้นแชทกับลูกค้าของคุณได้ทันที!
          </p>
        </div>

        {/* โครงสร้างฝั่งขวาของเดิม */}
        <div className="flex justify-center items-center w-1/2 z-20">
          <div className="w-[460px] bg-gradient-to-b from-[#ffffff] via-[#f7ebff] to-[#e6d6ff] rounded-3xl shadow-xl p-10 flex flex-col items-center relative min-h-[500px]">
            
            {step === 1 ? (
              <>
                <h1 className="text-[28px] font-semibold text-gray-800 mb-1">REGISTER</h1>
                <p className="text-gray-500 mb-2 text-sm">สมัครสมาชิกเพื่อใช้งาน</p>

                <form className="w-full space-y-5" onSubmit={handleRegister}>
                  
                  {/* Username (ของเดิม) */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className={`flex items-center border rounded-full px-3 py-2.5 ${errorUsername ? "border-red-500" : "border-gray-300"} focus-within:ring-1 focus-within:ring-purple-400`}>
                      <User className="text-purple-600 mr-2" size={18} />
                      <input type="text" placeholder="ชื่อผู้ใช้" className="w-full outline-none placeholder-gray-400 text-black bg-transparent" value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    {errorUsername && <p className="text-red-500 text-xs absolute left-3 bottom-[-18px]">{errorUsername}</p>}
                  </div>

                  {/* Email (ของเดิม) */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className={`flex items-center border rounded-full px-3 py-2.5 ${errorEmail ? "border-red-500" : "border-gray-300"} focus-within:ring-1 focus-within:ring-purple-400`}>
                      <Mail className="text-purple-600 mr-2" size={18} />
                      <input type="email" placeholder="example@mail.com" className="w-full outline-none placeholder-gray-400 text-black bg-transparent" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    {errorEmail && <p className="text-red-500 text-xs absolute left-3 bottom-[-18px]">{errorEmail}</p>}
                  </div>

                  {/* Password (ของเดิม + เพิ่ม onFocus/onBlur และ AnimatePresence) */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className={`flex items-center border rounded-full px-3 py-2.5 ${errorPass ? "border-red-500" : "border-gray-300"} focus-within:ring-1 focus-within:ring-purple-400 bg-transparent z-10 relative`}>
                      <Lock className="text-purple-600 mr-2" size={18} />
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Password" 
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

                    {/* 🔥 อนิเมชั่นเงื่อนไขรหัสผ่าน */}
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

                  {/* Confirm Password (ของเดิม) */}
                  <div className="relative pt-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <div className={`flex items-center border rounded-full px-3 py-2.5 ${errorConfirm ? "border-red-500" : "border-gray-300"} focus-within:ring-1 focus-within:ring-purple-400`}>
                      <Lock className="text-purple-600 mr-2" size={18} />
                      <input type="password" placeholder="Confirm Password" className="w-full outline-none placeholder-gray-400 text-black bg-transparent" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                    </div>
                    {errorConfirm && <p className="text-red-500 text-xs absolute left-3 bottom-[-18px]">{errorConfirm}</p>}
                  </div>

                  {/* ปุ่ม (ของเดิม) */}
                  <div className="pt-2 space-y-2">
                    <button type="submit" style={{ background: "#5d3d99", backgroundImage: "linear-gradient(140deg, rgba(93, 61, 153, 1) 0%, rgba(201, 117, 173, 1) 100%)" }} className="w-full text-white py-2.5 rounded-full transition shadow-md hover:opacity-90">
                      สมัครสมาชิก
                    </button>
                    <Link href="/auth/login">
                      <button type="button" className="w-full bg-white text-purple-700 py-2.5 rounded-full hover:bg-gray-200 transition shadow-sm mt-2">
                        เข้าสู่ระบบ
                      </button>
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              /* =========================================
                 STEP 2: หน้าต่างใส่ OTP
              ========================================= */
              <div className="w-full flex flex-col items-center pt-8">
                <div className="w-16 h-16 bg-white shadow-md text-purple-600 rounded-full flex items-center justify-center mb-6">
                  <Mail size={32} />
                </div>
                <h2 className="text-[24px] font-semibold text-gray-800 mb-2">Confirm your email</h2>
                <p className="text-gray-500 text-center text-sm mb-8">
                  Enter the 6-digit code sent to <br/><span className="font-bold text-gray-800">{email}</span>.
                </p>

                <div className="flex gap-2 mb-8 justify-center w-full px-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={otpRefs[index]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-bold bg-white border border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-800 shadow-sm"
                    />
                  ))}
                </div>

                <button 
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || otp.join("").length !== 6}
                  style={{ background: "#5d3d99", backgroundImage: "linear-gradient(140deg, rgba(93, 61, 153, 1) 0%, rgba(201, 117, 173, 1) 100%)" }}
                  className="w-full text-white py-2.5 rounded-full transition shadow-md disabled:opacity-50 flex items-center justify-center"
                >
                  {isVerifying ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Verify Account"}
                </button>

                <p className="text-xs text-gray-500 text-center mt-6">
                  Didn't get an email? Check your <strong className="text-gray-700">spam folder</strong><br/>
                  or <button className="text-purple-600 font-semibold hover:underline">get a new confirmation code</button>.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Popup ของเดิม */}
      <AnimatePresence>
        {popup.show && (
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={`relative w-[400px] min-h-[280px] bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8 flex flex-col justify-center items-center gap-6 text-center ${popup.success ? "shadow-purple-500/20" : "shadow-red-500/20"}`} initial={{ scale: 0.8, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-transform hover:rotate-90 duration-300" onClick={closePopup}>
                <X size={20} />
              </button>
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