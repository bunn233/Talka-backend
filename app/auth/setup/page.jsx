"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, ArrowLeft, Building2, Globe, Phone, MapPin, AlertCircle, User } from "lucide-react";

export default function SetupProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    username: session?.user?.name || "",
    website: "",
    company: "",
    country: "",
    phone: "",
    companySize: "",
    workspaceName: "", // ย้ายมาเป็น Step สุดท้าย
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrorMsg(""); 
  };

  const isValidUrl = (url) => {
    const urlPattern = /^[^\s]+\.[^\s]+$/; 
    return urlPattern.test(url);
  };

  const validateStep = () => {
    if (step === 1 && !formData.username.trim()) return "กรุณากรอกชื่อของคุณ";
    if (step === 2) {
      if (!formData.website.trim()) return "กรุณากรอกเว็บไซต์ของคุณ";
      if (!isValidUrl(formData.website)) return "รูปแบบเว็บไซต์ไม่ถูกต้อง (เช่น your-website.com)";
    }
    if (step === 3) {
      if (!formData.company.trim()) return "กรุณากรอกชื่อบริษัท";
      if (!formData.country.trim()) return "กรุณาระบุประเทศ";
      if (!formData.phone.trim()) return "กรุณากรอกเบอร์โทรศัพท์";
    }
    if (step === 4 && !formData.companySize) return "กรุณาเลือกขนาดของบริษัท";
    
    // Step 5 เช็คเฉพาะตอนไม่ได้กด Skip
    if (step === 5 && !formData.workspaceName.trim()) return "กรุณากรอกชื่อ Workspace (หรือกดปุ่ม Skip ด้านซ้าย)";
    
    return ""; 
  };

  const nextStep = () => {
    const error = validateStep();
    if (error) {
      setErrorMsg(error);
      return;
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
      setErrorMsg("");
      setStep((prev) => Math.max(prev - 1, 1));
  };

  // 🔥 ฟังก์ชันบันทึกข้อมูล (รองรับการกด Skip สร้าง Workspace)
  const handleSetup = async (e, skipWorkspace = false) => {
    if (e) e.preventDefault();
    
    if (!skipWorkspace) {
        const error = validateStep();
        if (error) {
            setErrorMsg(error);
            return;
        }
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/users/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, createWorkspace: !skipWorkspace }),
      });

      if (res.ok) {
        await update({ name: formData.username, is_setup: true });
        // เด้งไปหน้ารอ ถ้ากดข้าม Workspace
        window.location.href = skipWorkspace ? "/waiting" : "/chat/allchat";
      } else {
        const data = await res.json();
        setErrorMsg("เกิดข้อผิดพลาด: " + (data.error || "ไม่สามารถบันทึกข้อมูลได้"));
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-2">Hi, what's your name?</h2>
            <p className="text-white/50 text-sm mb-8">This is how customers and your team will see you.</p>
            <div>
              <label className="text-xs text-white/50 ml-1 mb-1 block uppercase tracking-widest font-bold">Your Name</label>
              <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                 <input
                   type="text"
                   value={formData.username}
                   onChange={(e) => handleChange("username", e.target.value)}
                   className={`w-full bg-white/5 border ${errorMsg && !formData.username.trim() ? "border-red-500/50" : "border-white/10"} rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-[#BE7EC7] focus:bg-white/10 outline-none transition-all`}
                   placeholder="e.g. John Doe"
                   autoFocus
                 />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-2">Personalize your experience</h2>
            <p className="text-white/50 text-sm mb-8">We'll tailor the tools to fit your website.</p>
            <div>
              <label className="text-xs text-white/50 ml-1 mb-1 block uppercase tracking-widest font-bold">Enter your website</label>
              <div className="relative">
                <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 ${errorMsg ? "text-red-400" : "text-white/30"}`} size={18} />
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  className={`w-full bg-white/5 border ${errorMsg ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#BE7EC7]"} rounded-xl py-3.5 pl-11 pr-4 text-white focus:bg-white/10 outline-none transition-all`}
                  placeholder="your-website.com"
                  autoFocus
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-2">Tell us about your company</h2>
            <p className="text-white/50 text-sm mb-8">Help us set up your contact details correctly.</p>
            <div className="space-y-4">
              <div className="relative">
                <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 ${errorMsg && !formData.company.trim() ? "text-red-400" : "text-white/30"}`} size={18} />
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  className={`w-full bg-white/5 border ${errorMsg && !formData.company.trim() ? "border-red-500" : "border-white/10 focus:border-[#BE7EC7]"} rounded-xl py-3.5 pl-11 pr-4 text-white outline-none`}
                  placeholder="Company Name"
                  autoFocus
                />
              </div>
              <div className="relative">
                <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 ${errorMsg && !formData.country.trim() ? "text-red-400" : "text-white/30"}`} size={18} />
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className={`w-full bg-white/5 border ${errorMsg && !formData.country.trim() ? "border-red-500" : "border-white/10 focus:border-[#BE7EC7]"} rounded-xl py-3.5 pl-11 pr-4 text-white outline-none`}
                  placeholder="Country"
                />
              </div>
              <div className="relative">
                <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 ${errorMsg && !formData.phone.trim() ? "text-red-400" : "text-white/30"}`} size={18} />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={`w-full bg-white/5 border ${errorMsg && !formData.phone.trim() ? "border-red-500" : "border-white/10 focus:border-[#BE7EC7]"} rounded-xl py-3.5 pl-11 pr-4 text-white outline-none`}
                  placeholder="Phone Number"
                />
              </div>
            </div>
          </div>
        );
      case 4:
        const sizes = ["Just me", "2-9", "10-49", "50-99", "100-499", "500-999", "1000+"];
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-2">What's your company size?</h2>
            <p className="text-white/50 text-sm mb-8">We'll tailor the dashboard to fit your business needs.</p>
            <div className="flex flex-wrap gap-3">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleChange("companySize", size)}
                  className={`px-6 py-3.5 rounded-xl border font-semibold text-sm transition-all ${
                    formData.companySize === size
                      ? "bg-[#BE7EC7] border-[#BE7EC7] text-white shadow-lg shadow-[#BE7EC7]/30 scale-105"
                      : "bg-white/5 border-white/10 text-white/70 hover:border-white/30 hover:bg-white/10"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold text-white mb-2">Create your Workspace</h2>
            <p className="text-white/50 text-sm mb-8">Name your workspace, or skip this step if you are waiting for a team invite.</p>
            <div>
              <label className="text-xs text-white/50 ml-1 mb-1 block uppercase tracking-widest font-bold">Workspace Name</label>
              <div className="relative">
                 <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                 <input
                   type="text"
                   value={formData.workspaceName}
                   onChange={(e) => handleChange("workspaceName", e.target.value)}
                   className={`w-full bg-white/5 border ${errorMsg && !formData.workspaceName.trim() ? "border-red-500/50" : "border-white/10"} rounded-xl py-3.5 pl-11 pr-4 text-white focus:border-[#BE7EC7] focus:bg-white/10 outline-none transition-all`}
                   placeholder="e.g. My Awesome Company"
                   autoFocus
                 />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#0f0f14] font-sans selection:bg-[#BE7EC7] selection:text-white p-4">
      <div className="w-full max-w-lg p-4 sm:p-8">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-[#BE7EC7]" : "bg-white/10"
              }`}
            />
          ))}
        </div>

        <div className="mb-2">
          <span className="text-white/30 text-xs font-bold tracking-widest">{step}/5</span>
        </div>

        <div className="min-h-[260px] flex flex-col justify-center">
          {renderStep()}
        </div>

        {/* Error Message */}
        <div className="h-8 mt-2">
            {errorMsg && (
                <div className="flex items-center gap-2 text-red-400 text-sm animate-in slide-in-from-left-2">
                    <AlertCircle size={16} />
                    <span className="font-medium">{errorMsg}</span>
                </div>
            )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
          {step > 1 && (
            <button onClick={prevStep} className="p-3.5 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all border border-white/5 shrink-0">
              <ArrowLeft size={18} />
            </button>
          )}

          {step < 5 ? (
            <button onClick={nextStep} className="flex-1 bg-white text-black py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-200 transition-all">
              Continue
            </button>
          ) : (
            <>
                <button 
                  onClick={(e) => handleSetup(e, true)} 
                  disabled={isLoading}
                  className="flex-1 bg-white/5 text-white/70 py-3.5 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-all text-sm border border-white/10"
                >
                  {isLoading ? "Saving..." : "Skip & Wait"}
                </button>
                <button 
                  onClick={(e) => handleSetup(e, false)} 
                  disabled={isLoading} 
                  className="flex-1 bg-[#BE7EC7] hover:bg-[#a66bb0] text-white py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-[#BE7EC7]/20 disabled:opacity-50 text-sm"
                >
                  {isLoading ? "Setting up..." : "Create Workspace"} <ArrowRight size={18} />
                </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}