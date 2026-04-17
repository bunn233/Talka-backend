"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; 
import { Lock, ShieldCheck, Eye, EyeOff, KeyRound, CheckCircle2, ArrowRight, Chrome, ShieldAlert, Loader2 } from "lucide-react"; 

export default function ChangePasswordPage() {
    const { data: session } = useSession(); 
    
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirm, setConfirm] = useState("");

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const isGoogleUser = session?.user?.isGoogle;

    const handleUpdate = async (e) => {
        e.preventDefault();
        
        if (!currentPass || !newPass || !confirm) {
            alert("Please fill in all fields.");
            return;
        }

        if (newPass !== confirm) {
            alert("New password and confirm password do not match.");
            return;
        }

        if (newPass.length < 8) {
            alert("New password must be at least 8 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: currentPass,
                    newPassword: newPass
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to update password");
            }

            alert("Password updated successfully!");
            setCurrentPass("");
            setNewPass("");
            setConfirm("");

        } catch (error) {
            console.error("Password update error:", error);
            alert(error.message || "An error occurred while updating the password.");
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full bg-[#1F192E] border border-white/5 focus:border-[#BE7EC7]/50 focus:bg-white/[0.04] outline-none rounded-xl py-3 px-4 text-white text-sm transition-all placeholder:text-white/10 shadow-inner";
    const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 ml-1";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col lg:flex-row gap-12 items-stretch min-h-[500px]">
                
                {/* LEFT COLUMN: Security Info */}
                <div className="w-full lg:w-80 shrink-0 flex flex-col">
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 h-full relative overflow-hidden flex flex-col">
                        {/* Decorative Glow */}
                        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#BE7EC7]/10 blur-[60px] rounded-full"></div>
                        
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-[#BE7EC7] flex items-center justify-center mb-6 shadow-lg shadow-[#BE7EC7]/20">
                                <ShieldCheck className="text-white" size={28} />
                            </div>
                            
                            <h2 className="text-xl font-black text-white tracking-tight mb-3">Security Center</h2>
                            <p className="text-white/40 text-xs leading-relaxed mb-8 font-medium">
                                To protect your workspace data, we recommend changing your password every 90 days.
                            </p>

                            <div className="space-y-5">
                                <h3 className="text-[10px] font-black text-[#BE7EC7] uppercase tracking-[0.2em]">Password Policy</h3>
                                <ul className="space-y-4">
                                    {[
                                        "At least 8 characters",
                                        "Includes a number",
                                        "Includes a symbol (!@#$)"
                                    ].map((req, i) => (
                                        <li key={i} className="flex items-center gap-3 text-[11px] font-bold text-white/50">
                                            <div className="w-5 h-5 rounded-full bg-[#BE7EC7]/10 flex items-center justify-center text-[#BE7EC7]">
                                                <CheckCircle2 size={12} />
                                            </div>
                                            {req}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="mt-auto pt-8 flex items-center gap-3 opacity-20">
                            <Lock size={14} />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em]">End-to-End Encrypted</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form หรือ Google Warning */}
                <div className="flex-1 flex flex-col justify-center">
                    {isGoogleUser ? (
                        <div className="bg-[#1F192E] border border-white/5 rounded-[2.5rem] p-12 text-center flex flex-col items-center shadow-2xl">
                            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-8 shadow-2xl relative">
                                <Chrome size={32} className="text-[#BE7EC7]" />
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center border-4 border-[#1F192E]">
                                    <ShieldAlert size={12} className="text-white" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">External Authentication</h2>
                            <p className="text-white/40 text-sm max-w-sm leading-relaxed mb-10 font-medium">
                                Your account is managed by <span className="text-white font-bold">Google SSO</span>. 
                                Password management is handled through your Google account settings.
                            </p>
                            <button 
                                onClick={() => router.back()}
                                className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all"
                            >
                                Back to Profile
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight">Change Password</h1>
                                <p className="text-white/30 text-sm mt-1 font-medium">Enter your current password to authorize this change.</p>
                            </div>

                            <form onSubmit={handleUpdate} className="space-y-6 max-w-xl">
                                {/* Current Password */}
                                <div className="group">
                                    <label className={labelClass}>Current Password</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#BE7EC7] transition-colors" size={18} />
                                        <input
                                            type={showCurrent ? "text" : "password"}
                                            value={currentPass}
                                            onChange={(e) => setCurrentPass(e.target.value)}
                                            placeholder="••••••••"
                                            className={`${inputClass} pl-12 pr-12`}
                                        />
                                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                                            {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="h-px bg-white/5 my-2"></div>

                                {/* New Password Inputs */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className={labelClass}>New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#BE7EC7] transition-colors" size={18} />
                                            <input
                                                type={showNew ? "text" : "password"}
                                                value={newPass}
                                                onChange={(e) => setNewPass(e.target.value)}
                                                placeholder="Min. 8 characters"
                                                className={`${inputClass} pl-12 pr-12`}
                                            />
                                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className={labelClass}>Confirm New Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-[#BE7EC7] transition-colors" size={18} />
                                            <input
                                                type={showConfirm ? "text" : "password"}
                                                value={confirm}
                                                onChange={(e) => setConfirm(e.target.value)}
                                                placeholder="Repeat password"
                                                className={`${inputClass} pl-12 pr-12`}
                                            />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
                                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-8 flex items-center justify-end gap-6 border-t border-white/5">
                                    <button 
                                        type="button" 
                                        onClick={() => router.back()} 
                                        className="text-xs font-black uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-[#BE7EC7] to-pink-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#BE7EC7]/20 hover:shadow-[#BE7EC7]/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                                        {isLoading ? "Syncing..." : "Update Password"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}