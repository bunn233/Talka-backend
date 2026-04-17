"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  User,
  Mail,
  Save,
  Activity,
  Loader2,
  ChevronDown,
  ShieldCheck,
  Check,
  X,
  Sparkles
} from "lucide-react";

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // เพิ่ม State สำหรับ Modal

  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("online");
  const [avatar, setAvatar] = useState("");

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const fileInputRef = useRef(null);

  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.floor(
      Math.abs(Math.sin(hash) * 16777215) % 16777215,
    ).toString(16);
    return `#${"0".repeat(6 - color.length) + color}`;
  }

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/users/profile");

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        const user = data.profile;

        setUsername(user.username || "");
        setEmail(user.email || "");
        setRole(user.role || "USER");
        setStatus(user.online_status?.toLowerCase() || "online");
        setAvatar(user.profile_image || "");
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size too large (Max 2MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);

      const payload = {
        username: username.trim(),
        online_status: status.toUpperCase(),
        profile_image: avatar,
      };

      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      window.dispatchEvent(new Event("user_updated"));
      setShowSuccessModal(true); // เปลี่ยนจาก alert เป็นเปิด Modal
    } catch (error) {
      console.error("Error saving profile:", error);
      alert(`Failed to save profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-white/20 animate-pulse">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-bold uppercase tracking-widest text-[10px]">Syncing Profile...</p>
      </div>
    );
  }

  const inputClass = "w-full bg-[#1F192E] border border-white/5 focus:border-[#BE7EC7]/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-white text-sm transition-all placeholder:text-white/10 shadow-inner";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#161223] border border-white/10 rounded-[2.5rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-[#BE7EC7] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Check className="text-white" size={40} strokeWidth={3} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Update Successful!</h2>
            <p className="text-white/40 text-sm font-medium mb-8">
              Your profile information has been securely updated and synced.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-2xl bg-[#BE7EC7] text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:shadow-[#BE7EC7]/40 transition-all active:scale-95"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-12 items-start h-full">
        
        {/* LEFT: Avatar Display Section */}
        <div className="w-full lg:w-72 flex flex-col items-center shrink-0">
          <div className="relative group">
            <div className="w-44 h-44 rounded-full p-1 bg-gradient-to-tr from-[#BE7EC7] via-[#e0a6e8] to-pink-500 shadow-[0_0_40px_rgba(190,126,199,0.2)] transition-transform duration-500 group-hover:scale-105">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#161223] relative flex items-center justify-center border-[6px] border-[#161223]">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-black text-white/90" style={{ backgroundColor: stringToColor(username || "L") }}>
                    {getInitials(username)}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center p-4 backdrop-blur-sm" onClick={() => fileInputRef.current.click()}>
                  <Camera className="w-8 h-8 text-white/80 mb-1" />
                  <span className="text-[10px] text-white font-bold uppercase">Change</span>
                </div>
              </div>
            </div>
            <div className={`absolute bottom-4 right-4 w-6 h-6 border-[4px] border-[#161223] rounded-full shadow-lg transition-colors duration-300 ${status === "online" ? "bg-emerald-500" : status === "away" ? "bg-amber-500" : "bg-zinc-500"}`}></div>
          </div>

          <div className="mt-6 text-center w-full">
            <h2 className="text-2xl font-black text-white tracking-tight truncate px-4">{username}</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-lg bg-[#BE7EC7]/10 border border-[#BE7EC7]/20">
               <span className="text-[10px] font-black text-[#BE7EC7] uppercase tracking-widest">{role}</span>
            </div>
            <p className="text-white/20 text-[11px] mt-3 font-medium truncate px-4">{email}</p>
          </div>

          <button onClick={() => fileInputRef.current.click()} className="mt-8 w-full py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest active:scale-95">
            <Camera size={14} /> Upload New Photo
          </button>
        </div>

        {/* RIGHT: Form Section */}
        <div className="flex-1 w-full space-y-10">
          <div className="flex justify-between items-end pb-6 border-b border-white/5">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Profile Settings</h1>
              <p className="text-white/30 text-sm font-medium mt-1">Update your personal information and account status.</p>
            </div>
            <div className="hidden md:block p-3 bg-[#BE7EC7]/10 rounded-2xl border border-[#BE7EC7]/20 shadow-inner">
              <ShieldCheck className="text-[#BE7EC7]" size={24} />
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="group">
              <label className={labelClass}>Username / Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#BE7EC7] transition-colors" size={18} />
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your name" required className={`${inputClass} pl-12`} />
              </div>
            </div>

            <div className="opacity-60">
              <label className={labelClass}>Email Address (Read Only)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10" size={18} />
                <input type="email" value={email} readOnly disabled className={`${inputClass} pl-12 cursor-not-allowed`} />
              </div>
            </div>

            <div className="group">
              <label className={labelClass}>Account Status</label>
              <div className="relative">
                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#BE7EC7] transition-colors" size={18} />
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} pl-12 appearance-none cursor-pointer`}>
                  <option value="online" className="bg-[#1F192E]">🟢 &nbsp; Online</option>
                  <option value="away" className="bg-[#1F192E]">🟡 &nbsp; Away</option>
                  <option value="offline" className="bg-[#1F192E]">⚫ &nbsp; Offline</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            <div className="pt-10 flex flex-col sm:flex-row items-center justify-end gap-6 border-t border-white/5">
              <button type="button" onClick={() => window.location.reload()} className="text-xs font-black uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors">Cancel</button>
              <button type="submit" disabled={isSaving} className="w-full sm:w-auto flex items-center justify-center gap-3 px-12 py-4 rounded-2xl bg-[#BE7EC7] text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#BE7EC7]/20 hover:shadow-[#BE7EC7]/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {isSaving ? (
                  <><Loader2 className="animate-spin" size={16} /> Saving...</>
                ) : (
                  <><Check size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}