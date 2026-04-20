"use client";
import React, { useState, useEffect, Suspense } from "react";
import { 
  Home, Save, Globe, Clock, Monitor, ShieldCheck, 
  Settings2, Plus, Users, MessageSquare, AlertCircle, Trash2, Camera, X, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function GeneralInfoContent() {
  const [workspaceId, setWorkspaceId] = useState(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [timezone, setTimezone] = useState("(GMT+07:00) Asia/Bangkok");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [popup, setPopup] = useState({
    show: false,
    message: "",
    success: false,
  });
  const closePopup = () => setPopup((p) => ({ ...p, show: false }));
  
  const [usage, setUsage] = useState({
    users: 0,
    maxUsers: 10,
    messages: 1420, 
    maxMessages: 5000
  });
  
  useEffect(() => {
    const loadWorkspaceAndInfo = async () => {
      try {
        setLoading(true);
        const wsRes = await fetch("/api/users/current-workspace");
        if (!wsRes.ok) throw new Error("Failed to fetch workspace ID");
        const wsData = await wsRes.json();

        const activeWsId = wsData.activeWorkspaceId;
        
        if (!activeWsId) {
            console.error("No active workspace found");
            setLoading(false);
            return;
        }
        
        setWorkspaceId(activeWsId);

        const res = await fetch(`/api/workspaces/general?wsId=${activeWsId}`);
        const data = await res.json();

        if (data.success) {
            setWorkspaceName(data.workspace.name);
            setUserRole(data.userRole);
            setUsage(prev => ({
                ...prev,
                users: data.workspace._count.members,
                maxUsers: data.maxUsers || 10,
                messages: data.monthlyChats || 0
            }));
        } else {
            console.error(data.error);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceAndInfo();
  }, []);

  const handleSave = async () => {
    if (!workspaceId) return;
    setSaving(true);

    try {
        const res = await fetch("/api/workspaces/general", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                wsId: workspaceId, 
                name: workspaceName
            })
        });

        const data = await res.json();
        
        if (data.success) {
            setPopup({ show: true, message: "Configuration updated successfully!", success: true });
            setTimeout(() => setPopup(p => ({ ...p, show: false })), 2000);
            window.dispatchEvent(new Event("user_updated"));
        } else {
            setPopup({ show: true, message: `Error: ${data.error}`, success: false });
            setTimeout(() => setPopup(p => ({ ...p, show: false })), 2000);
        }
    } catch (error) {
        console.error("Save Error:", error);
        setPopup({ show: true, message: "Failed to update workspace.", success: false });
        setTimeout(() => setPopup(p => ({ ...p, show: false })), 2000);
    } finally {
        setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceId) return;
    if (confirm("Are you sure you want to delete this workspace? This action cannot be undone.")) {
      try {
        const res = await fetch("/api/workspaces/general", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wsId: workspaceId })
        });
        const data = await res.json();
        if (data.success) {
            setPopup({ show: true, message: "Workspace deleted successfully.", success: true });
            setTimeout(() => { window.location.href = "/"; }, 2000);
        } else {
            setPopup({ show: true, message: `Error: ${data.error}`, success: false });
            setTimeout(() => setPopup(p => ({ ...p, show: false })), 2000);
        }
      } catch (e) {
        setPopup({ show: true, message: "Failed to delete workspace.", success: false });
        setTimeout(() => setPopup(p => ({ ...p, show: false })), 2000);
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full text-white/20 animate-pulse">
        <Settings2 size={48} className="mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs">Syncing Settings...</p>
    </div>
  );

  const inputClass = "w-full bg-white/[0.03] border border-white/10 focus:border-[#BE7EC7]/50 focus:bg-white/[0.08] outline-none rounded-2xl py-3 px-4 text-white text-sm transition-all placeholder:text-white/20";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-1";
  const sectionHeaderClass = "flex items-center gap-3 mb-6";
  const sectionTitleClass = "text-xs font-bold text-[#BE7EC7] uppercase tracking-[0.25em]";

  return (
    <div className="w-full h-[94vh] p-4 lg:p-6 ">
      <div className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-2xl h-full flex flex-col overflow-hidden">

        {/* --- Header Section --- */}
        <div className="p-8 pb-6 shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[#BE7EC7] flex items-center justify-center shadow-[0_0_20px_rgba(190,126,199,0.3)]">
              <Home className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight leading-none">General Settings</h1>
              <p className="text-white/30 text-xs mt-2 font-medium">Manage your workspace identity, regional preferences, and usage limits.</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/5 mx-8"></div>

        {/* --- Main Content Scroll Area --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6">
          <div className="max-w-4xl space-y-12">
            
            {/* 1. Workspace Branding Section */}
            <section>
              <div className={sectionHeaderClass}>
                <div className="w-1.5 h-4 bg-[#BE7EC7] rounded-full"></div>
                <h3 className={sectionTitleClass}>Branding & Identity</h3>
              </div>
              
              <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div className="max-w-2xl space-y-4">
                  <div>
                    <label className={labelClass}>Workspace Display Name</label>
                    <div className="relative">
                      <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                      <input
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="e.g. My Creative Agency"
                        className={`${inputClass} pl-11 ${userRole?.toLowerCase() !== 'owner' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={userRole?.toLowerCase() !== 'owner'}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-white/30 leading-relaxed font-medium">
                    This name will be visible to all team members and used in outgoing communications.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Usage & Limits (Progress Bars) */}
            <section>
              <div className={sectionHeaderClass}>
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                <h3 className={sectionTitleClass}>Usage & Subscription</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Users Limit */}
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-2 text-white/40">
                       <Users size={14} />
                       <span className="text-[10px] font-black uppercase">Member Seats</span>
                    </div>
                    <span className="text-xs font-bold text-white">{usage.users} / {usage.maxUsers}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#BE7EC7] rounded-full shadow-[0_0_8px_rgba(190,126,199,0.5)]" style={{ width: `${(usage.users/usage.maxUsers)*100}%` }}></div>
                  </div>
                </div>

                {/* Messages Limit */}
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex items-center gap-2 text-white/40">
                       <MessageSquare size={14} />
                       <span className="text-[10px] font-black uppercase">Monthly Chats</span>
                    </div>
                    <span className="text-xs font-bold text-white">{usage.messages.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${(usage.messages/usage.maxMessages)*100}%` }}></div>
                  </div>
                </div>

              </div>
            </section>

            {/* 3. Regional Settings */}
            <section>
              <div className={sectionHeaderClass}>
                <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                <h3 className={sectionTitleClass}>Regional & Preferences</h3>
              </div>

              <div className="grid grid-cols-1 gap-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
                <div>
                  <label className={labelClass}>Default Time Zone</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className={`${inputClass} pl-11 appearance-none ${userRole?.toLowerCase() !== 'owner' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      disabled={userRole?.toLowerCase() !== 'owner'}
                    >
                      <option value="(GMT+07:00) Asia/Bangkok" className="bg-[#1F192E]">Bangkok (GMT+07:00)</option>
                      <option value="(GMT+08:00) Singapore" className="bg-[#1F192E]">Singapore (GMT+08:00)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none text-[10px]">▼</div>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Danger Zone */}
            {userRole?.toLowerCase() === 'owner' && (
              <section className="mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle size={18} className="text-red-500" />
                  <h3 className="text-xs font-black text-red-500/80 uppercase tracking-[0.3em]">Danger Zone</h3>
                </div>
                
                <div className="p-8 bg-red-500/[0.03] border border-red-500/10 rounded-[2.5rem] flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="text-center sm:text-left">
                    <h4 className="text-sm font-bold text-red-400">Delete this workspace</h4>
                    <p className="text-xs text-white/30 mt-1 max-w-xs">Once deleted, all teams, chats, and historical data will be removed permanently.</p>
                  </div>
                  <button onClick={handleDelete} className="px-6 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest border border-red-500/20 shadow-lg shadow-red-500/5 cursor-pointer z-10">
                    <Trash2 size={14} className="inline mr-2" /> Delete Workspace
                  </button>
                </div>
              </section>
            )}

            {/* Save Changes Floating Bar Effect */}
            {userRole?.toLowerCase() === 'owner' && (
              <div className="flex justify-end pt-8 border-t border-white/5">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-3 bg-[#BE7EC7] hover:bg-[#a66bb0] text-white px-10 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-[0.2em] shadow-[0_10px_25px_rgba(190,126,199,0.3)] transform active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                      <><Save size={18} /> Update Workspace Info</>
                  )}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>

      <AnimatePresence>
        {popup.show && (
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[100]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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

export default function GeneralInfoPage() {
  return (
    <Suspense fallback={
        <div className="w-full h-screen bg-[#0F0C14] flex items-center justify-center">
            <div className="animate-pulse text-white/20 font-black uppercase tracking-[0.3em] text-[10px]">Initializing Command Center...</div>
        </div>
    }>
      <GeneralInfoContent />
    </Suspense>
  );
}