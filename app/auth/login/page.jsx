"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Mail, X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorEmail, setErrorEmail] = useState(false);
  const [errorPass, setErrorPass] = useState(false);
  
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    success: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;

    if (!email.trim()) { setErrorEmail(true); hasError = true; } else setErrorEmail(false);
    if (!password.trim()) { setErrorPass(true); hasError = true; } else setErrorPass(false);

    if (hasError) return;

    try {

      const result = await signIn("credentials", {
        email, 
        password,
        redirect: false,
      });

      if (result?.ok && !result?.error) {
        setPopup({ show: true, message: "เข้าสู่ระบบสำเร็จ!", success: true });
        setTimeout(() => {
          setPopup((p) => ({ ...p, show: false }));
          router.push("/chat/allchat");
        }, 2000);
      } else {
        setPopup({ show: true, message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง", success: false });
        setTimeout(() => setPopup((p) => ({ ...p, show: false })), 2000);
      }
    } catch (error) {
      console.error("Login error:", error);
      setPopup({ show: true, message: "เกิดข้อผิดพลาดที่ระบบ", success: false });
      setTimeout(() => setPopup((p) => ({ ...p, show: false })), 2000);
    }
  };

  const closePopup = () => setPopup((p) => ({ ...p, show: false }));

  return (
    <div className="relative flex justify-center items-center min-h-screen">
      <motion.div className="absolute inset-0 z-0" animate={{ background: [ "linear-gradient(135deg, #0f0f14, #1a1a2e, #0f0f14)", "linear-gradient(135deg, #1a1a2e, #0f0f14, #1a1a2e)" ] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} />
      <motion.div className="absolute w-[600px] h-[600px] bg-[rgba(184,110,159,0.69)] rounded-full filter blur-3xl opacity-40" initial={{ x: -480, y: -50 }} animate={{ x: [-480, 480, -480] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute w-[500px] h-[500px] bg-[rgba(110,184,159,0.69)] rounded-full filter blur-3xl opacity-40" initial={{ x: 480, y: 100 }} animate={{ x: [480, -480, 480] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />

      <div className="flex w-[1280px] h-[800px] bg-[rgba(152,85,120,0.4)] border border-[rgba(152,85,120,0.6)] backdrop-blur-md rounded-3xl shadow-2xl relative overflow-hidden z-10">
        <div className="flex flex-col justify-center pl-16 w-1/2 text-white relative z-10 font-inter">
          <h1 className="text-[40px] font-extrabold mb-1 tracking-tight">WELCOME</h1>
          <h2 className="text-[32px] font-light mb-4 text-[#E8E3F2]">To Talka</h2>
          <p className="text-[18px] font-light text-[#B9B3C9] leading-[140%]">
            รวมทุกการแชทไว้ในที่เดียว<br />สะดวก รวดเร็ว ไม่ต้องสลับแอป<br />เชื่อมต่อทุกแพลตฟอร์ม แชทได้ต่อเนื่องไม่มีสะดุด
          </p>
        </div>

        <div className="flex justify-center items-center w-1/2 z-20">
          <div className="w-[460px] bg-gradient-to-b from-[#ffffff] via-[#f7ebff] to-[#e6d6ff] rounded-3xl shadow-xl p-10 flex flex-col items-center relative">
            <h1 className="text-[28px] font-semibold text-gray-800 mb-1">LOGIN</h1>
            <p className="text-gray-500 mb-8 text-sm">เข้าสู่ระบบเพื่อใช้งาน</p>

            <form className="w-full space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="relative">
                <div className={`flex items-center border rounded-full px-3 py-2.5 ${errorEmail ? "border-red-500" : "border-gray-300"} focus-within:ring-1 focus-within:ring-purple-400`}>
                  <Mail className="text-purple-600 mr-2" size={18} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full outline-none text-black placeholder-gray-400 bg-transparent" />
                </div>
                {errorEmail && <p className="absolute text-red-500 text-xs left-3 top-full mt-1">โปรดกรอกอีเมล</p>}
              </div>

              {/* Password */}
              <div className="relative">
                <div className={`flex items-center border rounded-full px-3 py-2.5 ${errorPass ? "border-red-500" : "border-gray-300"} focus-within:ring-1 focus-within:ring-purple-400`}>
                  <Lock className="text-purple-600 mr-2" size={18} />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full outline-none text-black placeholder-gray-400 bg-transparent" />
                  <span className="w-px h-5 bg-gray-300 mx-2"></span>
                  <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errorPass && <p className="absolute text-red-500 text-xs left-3 top-full mt-1">โปรดกรอกรหัสผ่าน</p>}
              </div>

              <div className="pt-2 space-y-3">
                <button type="submit" style={{ background: "#5d3d99", backgroundImage: "linear-gradient(140deg, rgba(93, 61, 153, 1) 0%, rgba(201, 117, 173, 1) 100%)" }} className="w-full text-white py-2.5 rounded-full hover:opacity-90 transition shadow-md">เข้าสู่ระบบ</button>
                <Link href="/auth/register"><button type="button" className="w-full bg-white text-purple-700 py-2.5 rounded-full hover:bg-gray-200 transition shadow-sm">สมัครสมาชิก</button></Link>
              </div>

              <div className="flex flex-col items-center mt-4">
                <div className="flex items-center w-full mb-4">
                  <div className="grow h-px bg-gray-300" />
                  <span className="px-2 text-gray-500 text-sm">หรือ</span>
                  <div className="grow h-px bg-gray-300" />
                </div>
                <button type="button" onClick={() => signIn("google", { callbackUrl: "/chat/allchat" })} className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md hover:scale-105 transition-transform duration-200">
                  <img src="/google.png" className="w-8 h-8 object-contain" alt="Google login" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {popup.show && (
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={`relative w-[400px] min-h-[280px] bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl p-8 flex flex-col justify-center items-center gap-6 text-center ${popup.success ? "shadow-purple-500/20" : "shadow-red-500/20"}`} initial={{ scale: 0.8, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}>
              <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={closePopup}><X size={20} /></button>
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