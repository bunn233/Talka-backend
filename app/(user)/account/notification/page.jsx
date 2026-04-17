"use client";

import React, { useState } from "react";
import { BellRing, Mail, MessageSquare, AppWindow, Save, Radio, Bell, ShieldCheck, Zap } from "lucide-react";

export default function NotificationSettingsPage() {
    const [emailNoti, setEmailNoti] = useState(true);
    const [smsNoti, setSmsNoti] = useState(false);
    const [inApp, setInApp] = useState(true);

    const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1 ml-1";
    const itemContainerClass = "flex items-center justify-between p-5 rounded-[1.8rem] bg-[#1F192E] border border-white/5 hover:border-[#BE7EC7]/30 transition-all duration-300 group shadow-inner w-full";

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full w-full">
            <div className="flex flex-col xl:flex-row gap-12 xl:gap-20 items-stretch min-h-[500px] w-full">

                {/* LEFT COLUMN: Sidebar info */}
                <div className="w-full xl:w-[320px] shrink-0 flex flex-col">
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 h-full relative overflow-hidden flex flex-col">
                        <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#BE7EC7]/10 blur-[60px] rounded-full"></div>
                        
                        <div className="relative z-10">
                            <div className="w-14 h-14 rounded-2xl bg-[#BE7EC7] flex items-center justify-center mb-6 shadow-lg shadow-[#BE7EC7]/20">
                                <BellRing className="text-white" size={28} />
                            </div>

                            <h2 className="text-xl font-black text-white tracking-tight mb-3">Manage Alerts</h2>
                            <p className="text-white/40 text-xs leading-relaxed mb-8 font-medium">
                                Decide how and when you want to be notified. Your preferences sync across all devices.
                            </p>
                        </div>

                        <div className="mt-auto p-5 rounded-2xl bg-[#BE7EC7]/5 border border-[#BE7EC7]/10 relative overflow-hidden group/tip">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/tip:scale-110 transition-transform">
                                <Zap size={40} className="text-[#BE7EC7]" />
                            </div>
                            <h4 className="text-[#BE7EC7] font-black text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Radio size={14} className="animate-pulse" />
                                Pro Tip
                            </h4>
                            <p className="text-[11px] text-white/40 leading-relaxed font-medium relative z-10">
                                Turn on <span className="text-white/60">SMS notifications</span> for urgent security alerts to ensure you never miss critical workspace updates.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings List */}
                <div className="flex-1 flex flex-col justify-center w-full">
                    <div className="mb-10 w-full">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-white tracking-tight">Notification Settings</h1>
                            <div className="p-2 bg-[#BE7EC7]/10 rounded-xl text-[#BE7EC7] hidden sm:block">
                                <Bell size={20} />
                            </div>
                        </div>
                        <p className="text-white/30 text-sm font-medium">Customize your digital communication experience.</p>
                    </div>

                    <div className="space-y-4 w-full">
                        
                        {/* Setting Item: Email */}
                        <div className={itemContainerClass}>
                            <div className="flex items-center gap-5">
                                <div className="p-4 rounded-2xl bg-white/5 text-[#BE7EC7] group-hover:scale-110 group-hover:bg-[#BE7EC7]/10 transition-all duration-500 shadow-inner">
                                    <Mail size={22} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-white tracking-tight text-base">Email Notifications</h5>
                                    <p className="text-[11px] text-white/30 font-medium mt-0.5">Receive weekly digests and major system updates.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-110 shrink-0">
                                <input type="checkbox" checked={emailNoti} onChange={() => setEmailNoti(!emailNoti)} className="sr-only peer" />
                                <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 rtl:peer-checked:after:-translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BE7EC7] shadow-lg"></div>
                            </label>
                        </div>

                        {/* Setting Item: SMS */}
                        <div className={itemContainerClass}>
                            <div className="flex items-center gap-5">
                                <div className="p-4 rounded-2xl bg-white/5 text-amber-400 group-hover:scale-110 group-hover:bg-amber-400/10 transition-all duration-500 shadow-inner">
                                    <MessageSquare size={22} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-white tracking-tight text-base">SMS Notifications</h5>
                                    <p className="text-[11px] text-white/30 font-medium mt-0.5">Instant alerts for security and critical login attempts.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-110 shrink-0">
                                <input type="checkbox" checked={smsNoti} onChange={() => setSmsNoti(!smsNoti)} className="sr-only peer" />
                                <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 rtl:peer-checked:after:-translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BE7EC7] shadow-lg"></div>
                            </label>
                        </div>

                        {/* Setting Item: In-App */}
                        <div className={itemContainerClass}>
                            <div className="flex items-center gap-5">
                                <div className="p-4 rounded-2xl bg-white/5 text-pink-400 group-hover:scale-110 group-hover:bg-pink-400/10 transition-all duration-500 shadow-inner">
                                    <AppWindow size={22} />
                                </div>
                                <div>
                                    <h5 className="font-bold text-white tracking-tight text-base">In-app Notifications</h5>
                                    <p className="text-[11px] text-white/30 font-medium mt-0.5">Real-time banners and activity dots within the app.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer scale-110 shrink-0">
                                <input type="checkbox" checked={inApp} onChange={() => setInApp(!inApp)} className="sr-only peer" />
                                <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 rtl:peer-checked:after:-translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#BE7EC7] shadow-lg"></div>
                            </label>
                        </div>

                    </div>

                    {/* Actions Area */}
                    <div className="pt-10 mt-6 border-t border-white/5 flex items-center justify-end gap-6 w-full">
                        <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-white/10 uppercase tracking-[0.3em] mr-auto">
                            <ShieldCheck size={14} />
                            <span>Preferences Secured</span>
                        </div>
                        
                        <button
                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-[#BE7EC7] text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#BE7EC7]/20 hover:shadow-[#BE7EC7]/40 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <Save size={16} />
                            Save Preferences
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}