"use client";
import React, { useState, useEffect } from "react";
import { 
  BriefcaseBusiness, X, Plus, CheckCircle2, 
  AlertTriangle, Trash2, Facebook, MessageCircle, 
  Link2, Unlink, Info, ShieldCheck, Globe, Send, Loader2,
  Instagram, Wifi
} from "lucide-react";

export default function ChannelCatalog({ onConnectFacebook, onConnectInstagram, onConnectLine, onConnectTelegram }) {
  const [isOpen, setIsOpen] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [actionType, setActionType] = useState(null); 
  const [activeWsId, setActiveWsId] = useState(null); // 🔥 รับค่า Workspace ID มาจาก API

  // 🔥 1. ฟังก์ชันดึง Workspace ID ปัจจุบัน
  const loadWorkspace = async () => {
    try {
        const wsRes = await fetch("/api/users/current-workspace");
        if (!wsRes.ok) throw new Error("Failed to get workspace");
        const wsData = await wsRes.json();
        
        if (wsData.activeWorkspaceId) {
            setActiveWsId(wsData.activeWorkspaceId);
            fetchChannels(wsData.activeWorkspaceId);
        } else {
            setIsLoading(false);
        }
    } catch (error) {
        console.error(error);
        setIsLoading(false);
    }
  };

  // 🔥 2. ฟังก์ชันดึงข้อมูล Channel (ใช้ ID จากพารามิเตอร์)
  const fetchChannels = async (workspaceId) => {
    if (!workspaceId) {
        setIsLoading(false);
        setConnectedAccounts([]);
        return;
    }
    try {
      setIsLoading(true);
      const res = await fetch(`/api/channels?wsId=${workspaceId}`);
      if (!res.ok) throw new Error('Failed to fetch channels');
      const data = await res.json();
      
      const formattedData = data.map(ch => {
        const platformName = ch.platform_name?.toLowerCase() || '';
        let color = "border-white/20"; 
        let type = "unknown";

        if (platformName.includes('facebook')) {
          color = "border-[#1877f2]";
          type = "facebook";
        } else if (platformName.includes('instagram')) { 
          color = "border-[#C13584]";
          type = "instagram";
        } else if (platformName.includes('line')) {
          color = "border-[#06c755]";
          type = "line";
        } else if (platformName.includes('telegram')) {
          color = "border-[#0088cc]";
          type = "telegram";
        }

        return {
          id: ch.channel_id,
          name: ch.name,
          platform: ch.platform_name || 'Unknown',
          type: type,
          color: color,
          status: ch.status 
        };
      });

      setConnectedAccounts(formattedData);
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadWorkspace(); }, []);
  useEffect(() => { if (isOpen && activeWsId) fetchChannels(activeWsId); }, [isOpen]);

  const openConfirmModal = (account, type) => {
      setConfirmTarget(account);
      setActionType(type); 
  };

  const handleAction = async () => {
    if (!confirmTarget || !actionType || !activeWsId) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/channels/${confirmTarget.id}?wsId=${activeWsId}&action=${actionType}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to process action');
      
      // อัปเดตหน้าจอ
      if (actionType === 'delete') {
         setConnectedAccounts(prev => prev.filter(acc => acc.id !== confirmTarget.id));
      } else {
         setConnectedAccounts(prev => prev.map(acc => 
            acc.id === confirmTarget.id 
               ? { ...acc, status: actionType === 'reconnect' ? "CONNECTED" : "DISCONNECTED" } 
               : acc
         ));
      }

      setConfirmTarget(null);
      setActionType(null);
    } catch (error) {
      alert("เกิดข้อผิดพลาด โปรดลองอีกครั้ง");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full h-[95vh] p-4 lg:p-6 ">
      <div className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-2xl h-full flex flex-col overflow-hidden">
        
        {/* Header Section */}
        <div className="p-8 pb-6 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[#BE7EC7] flex items-center justify-center shadow-[0_0_20px_rgba(190,126,199,0.3)]">
                <BriefcaseBusiness className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Channel Catalog</h1>
                <p className="text-white/30 text-xs mt-2 font-medium">Manage and link your customer communication platforms.</p>
              </div>
            </div>
            <button 
                onClick={() => setIsOpen(true)} 
                disabled={isLoading}
                className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 px-6 py-2.5 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest shadow-sm active:scale-95 disabled:opacity-50"
            >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                Integrations ({connectedAccounts.length})
            </button>
          </div>
        </div>

        <div className="h-px bg-white/5 mx-8 mb-8"></div>

        {/* Catalog Cards Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-8 rounded-[2rem] bg-[#1F192E] border border-white/5 flex flex-col hover:border-[#1877f2]/30 transition-all duration-300 group shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-[#1877f2]/10 border border-[#1877f2]/20 flex items-center justify-center text-[#1877f2] mb-8 shadow-inner"><Facebook size={32} fill="currentColor" /></div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Facebook Messenger</h2>
                <p className="text-white/30 text-sm font-medium mb-10 leading-relaxed">Connect your Business Pages to centralize chats and automate responses.</p>
                <button onClick={onConnectFacebook} className="mt-auto w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-[#1877f2] hover:border-[#1877f2] transition-all shadow-sm transform active:scale-95">Connect Platform</button>
            </div>
            <div className="p-8 rounded-[2rem] bg-[#1F192E] border border-white/5 flex flex-col hover:border-[#C13584]/30 transition-all duration-300 group shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-[#C13584]/10 border border-[#C13584]/20 flex items-center justify-center text-[#C13584] mb-8 shadow-inner"><Instagram size={32} /></div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Instagram Business</h2>
                <p className="text-white/30 text-sm font-medium mb-10 leading-relaxed">Sync your Instagram Direct Messages to manage customer queries professionally.</p>
                <button onClick={onConnectInstagram} className="mt-auto w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-[#C13584] hover:border-[#C13584] transition-all shadow-sm transform active:scale-95">Connect Platform</button>
            </div>
            <div className="p-8 rounded-[2rem] bg-[#1F192E] border border-white/5 flex flex-col hover:border-[#06c755]/30 transition-all duration-300 group shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-[#06c755]/10 border border-[#06c755]/20 flex items-center justify-center text-[#06c755] mb-8 shadow-inner"><MessageCircle size={32} fill="currentColor" /></div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">LINE Official Account</h2>
                <p className="text-white/30 text-sm font-medium mb-10 leading-relaxed">Sync your LINE OA messages to respond to customers from a single dashboard.</p>
                <button onClick={onConnectLine} className="mt-auto w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-[#06c755] hover:border-[#06c755] transition-all shadow-sm transform active:scale-95">Connect Platform</button>
            </div>
            <div className="p-8 rounded-[2rem] bg-[#1F192E] border border-white/5 flex flex-col hover:border-[#0088cc]/30 transition-all duration-300 group shadow-xl">
                <div className="w-16 h-16 rounded-2xl bg-[#0088cc]/10 border border-[#0088cc]/20 flex items-center justify-center text-[#0088cc] mb-8 shadow-inner"><Send size={32} fill="currentColor" className="ml-[-2px] mt-[2px]" /></div>
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Telegram</h2>
                <p className="text-white/30 text-sm font-medium mb-10 leading-relaxed">Integrate your Telegram to handle real-time queries and support.</p>
                <button onClick={onConnectTelegram} className="mt-auto w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-white text-xs font-black uppercase tracking-widest hover:bg-[#0088cc] hover:border-[#0088cc] transition-all shadow-sm transform active:scale-95">Connect Platform</button>
            </div>
          </div>
        </div>
      </div>

      {/* --- POPUP: INTEGRATIONS LIST --- */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="relative bg-[#161223] text-white w-full max-w-[500px] rounded-[2.5rem] border border-white/5 shadow-2xl p-8 max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95">
            
            <div className="flex justify-between items-center mb-8 shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#BE7EC7] shadow-inner">
                    <Link2 size={24} />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold tracking-tight">Integrations</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#BE7EC7]">Manage Connections</p>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/30 hover:text-white transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <Loader2 size={32} className="animate-spin mb-4" />
                  <p className="text-xs font-black uppercase tracking-[0.2em]">Loading...</p>
                </div>
              ) : connectedAccounts.length > 0 ? (
                connectedAccounts.map((acc) => {
                  const isOff = acc.status === "DISCONNECTED";

                  return (
                  <div key={acc.id} className={`group flex items-center justify-between p-5 bg-[#1F192E] border-l-[6px] ${isOff ? 'border-neutral-600 opacity-60 grayscale' : acc.color} rounded-2xl shadow-sm hover:shadow-md transition-all`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        {acc.type === 'facebook' && <Facebook className="text-[#1877f2]" size={22} fill="currentColor" />}
                        {acc.type === 'instagram' && <Instagram className="text-[#C13584]" size={22} />}
                        {acc.type === 'line' && <MessageCircle className="text-[#06c755]" size={22} fill="currentColor" />}
                        {acc.type === 'telegram' && <Send className="text-[#0088cc]" size={22} fill="currentColor" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <h3 className={`text-sm font-bold tracking-tight leading-tight ${isOff ? 'text-white/50 line-through' : 'text-white'}`}>{acc.name}</h3>
                           {isOff && <span className="text-[8px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">Offline</span>}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-1">{acc.platform}</p>
                      </div>
                    </div>
                    
                    {/* 🔥 ปุ่ม Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        
                        {/* ปุ่มเปิด/ปิด ตามสถานะ */}
                        {isOff ? (
                            <button 
                                onClick={() => openConfirmModal(acc, 'reconnect')}
                                title="Reconnect Account"
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-lg"
                            >
                                <Wifi size={16} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => openConfirmModal(acc, 'disconnect')}
                                title="Disconnect (Keep Chats)"
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white transition-all shadow-lg"
                            >
                                <Unlink size={16} />
                            </button>
                        )}

                        {/* ปุ่ม Delete (แดง) */}
                        <button 
                            onClick={() => openConfirmModal(acc, 'delete')}
                            title="Delete Permanently"
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>

                  </div>
                )})
              ) : (
                <div className="text-center py-10 opacity-20">
                    <Globe size={48} className="mx-auto mb-4 text-white" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">No Active Links</p>
                </div>
              )}
            </div>

            <button onClick={() => setIsOpen(false)} className="mt-8 w-full py-4 rounded-2xl bg-white/5 text-white/40 font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all border border-white/5">
                Close View
            </button>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION MODAL --- */}
      {confirmTarget && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-[#1F192E] border border-white/10 rounded-[2.5rem] p-10 w-full max-w-sm text-center shadow-2xl">
            
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner 
                ${actionType === 'delete' ? 'bg-red-500/10 text-red-500' : 
                  actionType === 'reconnect' ? 'bg-emerald-500/10 text-emerald-500' : 
                  'bg-yellow-500/10 text-yellow-500'}`}>
              {actionType === 'reconnect' ? <Wifi size={32} /> : <AlertTriangle size={32} />}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
                {actionType === 'delete' ? 'Delete Account?' : 
                 actionType === 'reconnect' ? 'Reconnect Account?' : 
                 'Disconnect Account?'}
            </h2>
            
            <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium">
                {actionType === 'delete' 
                    ? <>Are you sure you want to <span className="text-red-400 font-bold">permanently delete</span> <b>{confirmTarget.name}</b>? All associated chat histories will be lost.</>
                    : actionType === 'reconnect'
                    ? <>Do you want to reactive <span className="text-emerald-400 font-bold">{confirmTarget.name}</span>? It will start receiving messages again.</>
                    : <>Are you sure you want to unlink <span className="text-white font-bold">{confirmTarget.name}</span>? Synchronizing will stop, but <span className="text-yellow-400">chat history will remain.</span></>
                }
            </p>

            <div className="flex gap-4">
              <button disabled={isProcessing} onClick={() => { setConfirmTarget(null); setActionType(null); }} className="flex-1 py-3.5 rounded-xl bg-white/5 text-white/50 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50">
                Cancel
              </button>
              <button disabled={isProcessing} onClick={handleAction} 
                className={`flex-1 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 
                ${actionType === 'delete' ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600' : 
                  actionType === 'reconnect' ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600' : 
                  'bg-yellow-500 text-white shadow-yellow-500/20 hover:bg-yellow-600'}`}
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}