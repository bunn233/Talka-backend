"use client";
import React, { useRef, useState, useEffect } from "react";
import { Tooltip } from "react-tooltip";
import Picker from "emoji-picker-react";
import { Users, Eye, Bot, ChevronDown, Power, Check } from "lucide-react";
import Pusher from "pusher-js";

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

export default function ChatMessage({
  chat,
  currentUser,
  onSendMessage,
  workspaceId,
  userRole,
}) {
  if (!chat) {
    return (
      <div className="flex-1 min-w-0 h-full bg-[#1E1B29] border border-[#BE7EC7]/10 rounded-3xl shadow-xl flex justify-center items-center text-[#BE7EC7] font-medium text-sm">
        เลือกแชททางซ้ายเพื่อดูข้อความ
      </div>
    );
  }

  const textareaRef = useRef(null);
  const [height, setHeight] = useState(100);
  const messages = Array.isArray(chat?.messages) ? chat.messages : [];
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [showViewers, setShowViewers] = useState(false);
  const viewersDropdownRef = useRef(null);
  const [activeViewers, setActiveViewers] = useState([]);

  // ================= 🤖 [เพิ่มใหม่] AI AGENT STATES =================
  const [agentsList, setAgentsList] = useState([]);
  const [activeAiAgent, setActiveAiAgent] = useState(null);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const agentDropdownRef = useRef(null);

  // 🤖 [เพิ่มใหม่] ดึงข้อมูล AI Agent
  useEffect(() => {
    fetch('/api/Ai/agents')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAgentsList(data.filter(agent => agent.is_published));
        }
      })
      .catch(console.error);
  }, []);

  // 🤖 [เพิ่มใหม่] ฟังก์ชันสลับโหมด AI
  // 🤖 ฟังก์ชันสลับโหมด AI
  const toggleAiMode = async (agent) => {
    if (!agent) {
      // ปิด AI Mode (มนุษย์พิมพ์เอง)
      setActiveAiAgent(null);
      setShowAgentDropdown(false);
      // 🎯 ยิง API ไปบอก Database ว่าให้ยกเลิก AI (ai_agent_id = null)
      await fetch(`/api/chats/${chat.id}/ai-mode`, {
        method: 'POST',
        body: JSON.stringify({ ai_agent_id: null })
      });
    } else {
      // เปิด AI Mode
      setActiveAiAgent(agent);
      setShowAgentDropdown(false);
      // 🎯 ยิง API ไปบอก Database ว่าห้องนี้ใช้ AI ตัวไหนตอบ
      await fetch(`/api/chats/${chat.id}/ai-mode`, {
        method: 'POST',
        body: JSON.stringify({ ai_agent_id: agent.id })
      });
    }
  };

  // 🤖 [เพิ่มใหม่] ปิด Dropdown AI เมื่อคลิกที่อื่น
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(event.target)) {
        setShowAgentDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  // ===============================================================

  const tabIdRef = useRef(Math.random().toString(36).substring(7));

  const myViewerDataRef = useRef({
    tabId: tabIdRef.current,
    id: currentUser?.email || currentUser?.id || `guest-${Date.now()}`,
    name: currentUser?.name || currentUser?.username || "Admin",
    image: currentUser?.image || currentUser?.profile_image || null,
    role: (userRole || currentUser?.role || "EMPLOYEE").toUpperCase(),
    isMe: true,
  });

  useEffect(() => {
    if (!chat?.id || !currentUser) return;

    const wsId =
      workspaceId || chat?.channel?.workspace_id || chat?.workspace_id || 1;

    setActiveViewers([{ ...myViewerDataRef.current }]);

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });
    const wsChannel = pusher.subscribe(`workspace-${wsId}`);

    const broadcastPresence = (actionType) => {
      fetch("/api/chats/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: wsId,
          chatId: chat.id,
          user: {
            ...myViewerDataRef.current,
            image: null,
          },
          action: actionType,
        }),
      }).catch(() => { });
    };

    const fetchMyProfile = () => {
      fetch("/api/users/profile")
        .then((res) => res.json())
        .then((data) => {
          let changed = false;
          const currentWs = data?.workspaces?.find(
            (w) => String(w.id) === String(wsId),
          );

          if (currentWs?.role) {
            const newRole = currentWs.role.toUpperCase();
            if (myViewerDataRef.current.role !== newRole) {
              myViewerDataRef.current.role = newRole;
              changed = true;
            }
          }
          const freshImg = data?.profile?.profile_image;
          if (freshImg && myViewerDataRef.current.image !== freshImg) {
            myViewerDataRef.current.image = freshImg;
            changed = true;
          }

          if (changed) {
            setActiveViewers((prev) => [
              myViewerDataRef.current,
              ...prev.filter((v) => v.tabId !== tabIdRef.current),
            ]);
            broadcastPresence("UPDATE");
          }
        })
        .catch(() => { });
    };

    fetchMyProfile();
    broadcastPresence("ENTER");

    wsChannel.bind("viewer-activity", function (data) {
      if (data.chatId === chat.id) {
        if (data.user.tabId === tabIdRef.current) return;

        if (
          data.action === "ENTER" ||
          data.action === "I_AM_HERE" ||
          data.action === "UPDATE"
        ) {
          setActiveViewers((prev) => {
            const filtered = prev.filter((v) => v.tabId !== data.user.tabId);
            return [...filtered, { ...data.user, isMe: false }];
          });
          if (data.action === "ENTER") broadcastPresence("I_AM_HERE");
        } else if (data.action === "LEAVE") {
          setActiveViewers((prev) =>
            prev.filter((v) => v.tabId !== data.user.tabId),
          );
        }
      }
    });

    const handleUpdate = () => fetchMyProfile();
    window.addEventListener("user_updated", handleUpdate);

    return () => {
      broadcastPresence("LEAVE");
      wsChannel.unbind_all();
      pusher.unsubscribe(`workspace-${wsId}`);
      pusher.disconnect();
      window.removeEventListener("user_updated", handleUpdate);
    };
  }, [chat?.id, currentUser, workspaceId]);

  const uniqueViewers = Array.from(
    new Map(activeViewers.map((item) => [item.id, item])).values(),
  );
  const otherViewersCount = uniqueViewers.filter((v) => !v.isMe).length;

  const hasAgentReplied = messages.some(
    (m) =>
      String(m.from || "").toUpperCase() === "ME" ||
      String(m.from || "").toUpperCase() === "AGENT" ||
      String(m.sender_type || "").toUpperCase() === "AGENT" ||
      String(m.sender_type || "").toUpperCase() === "ADMIN",
  );

  let displayStatus = chat?.status?.toUpperCase() || "OPEN";
  if (hasAgentReplied && displayStatus === "NEW") displayStatus = "OPEN";
  const isNewChat = displayStatus === "NEW" && !hasAgentReplied;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendClick = async () => {
    const text = textareaRef.current?.value;
    if (!text?.trim() && files.length === 0) return;
    textareaRef.current.value = "";
    setHeight(100);
    const filesToSend = [...files];
    setFiles([]);
    setShowEmojiPicker(false);
    if (onSendMessage) await onSendMessage(chat.id, text, filesToSend);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        viewersDropdownRef.current &&
        !viewersDropdownRef.current.contains(event.target)
      )
        setShowViewers(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAttachClick = () => fileInputRef.current.click();
  const handleFileChange = (event) => {
    setFiles((prev) => [...prev, ...Array.from(event.target.files)]);
    event.target.value = "";
  };

  const getStatusColorClass = (status) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "PENDING": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "CLOSED":
      case "RESOLVED": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "NEW": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-white/5 text-white/50 border-white/10";
    }
  };

  return (
    <div className="flex-1 min-w-0 h-full bg-[#1E1B29] border border-[#BE7EC7]/10 rounded-3xl shadow-xl p-5 flex flex-col overflow-hidden relative z-0">

      {/* --- Header --- */}
      <div className="shrink-0 flex items-center justify-between border-b border-white/5 pb-4 mb-4 gap-3 relative z-20">

        {/* Chat Info (Left) */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-12 h-12 shrink-0">
            {chat?.imgUrl ? (
              <img src={chat.imgUrl} alt={chat?.name} className="w-full h-full rounded-3xl object-cover shadow-sm bg-white/5 border border-white/10" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#BE7EC7] to-[#8a55b5] rounded-2xl flex items-center justify-center text-2xl shadow-lg font-bold text-white border border-white/10">
                {getInitials(chat?.name)}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-[#1E1B29] border border-white/10 shadow-lg">
              {chat?.platform === "INSTAGRAM" && <i className="fa-brands fa-instagram text-pink-500 text-[10px]"></i>}
              {chat?.platform === "FACEBOOK" && <i className="fa-brands fa-facebook text-blue-500 text-[10px]"></i>}
              {chat?.platform === "LINE" && <i className="fa-brands fa-line text-green-500 text-[10px]"></i>}
              {chat?.platform === "TELEGRAM" && <i className="fa-brands fa-telegram text-[#0088cc] text-[10px]"></i>}
            </div>
          </div>

          <div className="min-w-0 flex-1 flex flex-col items-start">
            <h2 className="text-white font-semibold text-lg truncate leading-tight mb-1">{chat?.name}</h2>
            {isNewChat ? (
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border bg-red-500/10 text-red-500 border-red-500/20">NEW CHAT</span>
            ) : (
              <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${getStatusColorClass(displayStatus)}`}>{displayStatus}</span>
            )}
          </div>
        </div>

        {/* Header Right: AI Auto-Reply & Viewers */}
        <div className="flex items-center gap-4 shrink-0">

          {/* 🤖 [เพิ่มใหม่] AI Agent Selector Dropdown */}
          <div className="relative" ref={agentDropdownRef}>
            <button
              onClick={() => setShowAgentDropdown(!showAgentDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 shadow-sm
                ${activeAiAgent
                  ? 'bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/30'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'
                }`}
            >
              <Bot size={16} className={activeAiAgent ? 'animate-pulse' : ''} />
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                  {activeAiAgent ? 'AI ACTIVE' : 'AI AUTO-REPLY'}
                </span>
                <span className="text-[10px] leading-none opacity-80 mt-0.5">
                  {activeAiAgent ? activeAiAgent.name : 'Off'}
                </span>
              </div>
              <ChevronDown size={14} className={`ml-1 transition-transform ${showAgentDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showAgentDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#1E1B29] border border-[#BE7EC7]/20 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-200">
                <div className="p-3 bg-white/5 border-b border-white/5">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-[0.15em] ml-1">Assign AI to Chat</span>
                </div>
                <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1.5">

                  {/* Option: Stop AI (Manual Mode) */}
                  <button
                    onClick={() => toggleAiMode(null)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 mb-1
                      ${!activeAiAgent ? 'bg-red-500/10 text-red-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 ${!activeAiAgent ? 'bg-red-500/20' : 'bg-white/5'}`}>
                      <Power size={14} />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-xs truncate">Manual Mode</span>
                      <span className="text-[9px] opacity-60 truncate font-medium">หยุด AI ให้พนักงานตอบเอง</span>
                    </div>
                    {!activeAiAgent && <Check size={14} className="text-red-400 shrink-0" strokeWidth={3} />}
                  </button>

                  <div className="my-2 border-t border-white/5" />

                  {/* Options: Available AI Agents */}
                  {agentsList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-white/40">No active agents found.</div>
                  ) : (
                    agentsList.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => toggleAiMode(agent)}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 mb-1
                          ${activeAiAgent?.id === agent.id ? 'bg-[#BE7EC7]/20 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                        `}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 ${activeAiAgent?.id === agent.id ? 'bg-[#BE7EC7]' : 'bg-white/5'}`}>
                          {agent.emoji}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-bold text-xs truncate">{agent.name}</span>
                          <span className="text-[9px] opacity-60 truncate font-medium line-clamp-1">{agent.instructions || 'AI Assistant'}</span>
                        </div>
                        {activeAiAgent?.id === agent.id && <Check size={14} className="text-[#BE7EC7] shrink-0" strokeWidth={3} />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Viewers Area (โค้ดเดิมของคุณทั้งหมด) */}
          <div className="relative shrink-0 flex items-center pl-4 border-l border-white/10 z-10" ref={viewersDropdownRef}>
            <div className="flex items-center cursor-pointer hover:scale-105 transition-transform duration-200" onClick={() => setShowViewers(!showViewers)}>
              <div className="flex items-center -space-x-4">
                <div className="w-9 h-9 rounded-full border-2 border-[#1E1B29] bg-[#2a2438] overflow-hidden shadow-lg relative z-20">
                  {myViewerDataRef.current.image ? (
                    <img src={myViewerDataRef.current.image} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-tr from-[#BE7EC7] to-purple-500">
                      {getInitials(myViewerDataRef.current.name)}
                    </div>
                  )}
                </div>
                {uniqueViewers.length > 1 && (
                  <div className="w-9 h-9 rounded-full border-2 border-[#1E1B29] bg-[#BE7EC7] flex items-center justify-center shadow-md relative z-10">
                    <Users size={14} className="text-white" />
                    {otherViewersCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-black text-white w-4 h-4 rounded-full flex items-center justify-center border border-[#1E1B29]">
                        {uniqueViewers.length}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="ml-3 text-white/30 hover:text-white/70 transition-colors"><Eye size={18} /></div>
            </div>

            {showViewers && (
              <div className="absolute right-0 top-full mt-3 w-52 bg-[#1E1B29] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <p className="text-[9px] text-[#BE7EC7] font-bold uppercase px-2 mb-2 mt-1 tracking-widest flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>กำลังดูแลแชทนี้ ({uniqueViewers.length})</p>
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                  {uniqueViewers.map((viewer, idx) => {
                    let roleColor = "text-white/40";
                    if (viewer.role === "OWNER") roleColor = "text-yellow-400 font-semibold";
                    if (viewer.role === "ADMIN") roleColor = "text-rose-400 font-semibold";
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <div className="flex flex-col min-w-0"><span className="text-white text-sm font-medium truncate">{viewer.name}</span><span className={`text-[10px] truncate ${roleColor}`}>{viewer.role || "EMPLOYEE"}</span></div>
                        {viewer.tabId === tabIdRef.current && <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-black tracking-wider shrink-0">YOU</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Chat Messages --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 text-white/90 pr-2 mb-4 flex flex-col relative z-0">

        {/* 🤖 [เพิ่มใหม่] System Message - โชว์ตอนเปิด AI */}
        {activeAiAgent && (
          <div className="w-full flex justify-center mb-4">
            <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl px-4 py-2 text-xs text-purple-300 font-medium flex items-center gap-2">
              <Bot size={14} className="animate-pulse" />
              AI Agent <b>{activeAiAgent.name}</b> {activeAiAgent.emoji} กำลังดำเนินการตอบอัตโนมัติ
            </div>
          </div>
        )}

        {messages && messages.length > 0 ? (
          messages.map((msg, index) => {
            const fromStr = String(msg.from || "").toUpperCase();
            const senderTypeStr = String(msg.sender_type || "").toUpperCase();
            const isMe = fromStr === "ME" || fromStr === "AGENT" || fromStr === "ADMIN" || senderTypeStr === "AGENT" || senderTypeStr === "ADMIN";
            const text = msg.text || "";
            const isImage = msg.type === "IMAGE" || text.includes("/api/") || text.includes("cdn") || text.includes("fbcdn");
            let displayName = isMe ? msg.senderName || currentUser?.name || "Admin" : chat?.name || "ลูกค้า";

            return (
              <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className={`flex items-baseline gap-2 mb-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <span className={`text-[10px] font-bold tracking-wide ${isMe ? "text-[#BE7EC7]" : "text-white/50"}`}>{displayName}</span>
                  <span className="text-[9px] text-white/30">{msg.time}</span>
                </div>
                <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm break-words ${isMe ? "bg-[#BE7EC7] text-white rounded-br-sm shadow-lg shadow-[#BE7EC7]/10" : "bg-white/5 border border-white/10 text-white/90 rounded-bl-sm"}`}>
                  {isImage ? (
                    <img src={text} className="max-w-[200px] sm:max-w-xs h-auto object-cover rounded-xl" loading="lazy" />
                  ) : (
                    <span className="whitespace-pre-wrap">{text}</span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-sm italic">No messages yet</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      <div className="relative shrink-0 border-t border-white/5 pt-4 z-10 transition-all duration-300">

        {/* 🤖 [เพิ่มใหม่] ถ้า AI กำลังทำงาน จะซ่อนช่องพิมพ์และขึ้นปุ่มให้ Take Over */}
        {activeAiAgent ? (
          <div className="w-full flex flex-col items-center justify-center py-6 bg-gradient-to-r from-purple-500/5 via-[#BE7EC7]/10 to-purple-500/5 rounded-2xl border border-[#BE7EC7]/20 shadow-inner">
            <Bot className="text-[#BE7EC7] mb-2 animate-bounce" size={28} />
            <p className="text-white font-bold text-sm mb-1">{activeAiAgent.emoji} {activeAiAgent.name} กำลังดูแลลูกค้ารายนี้</p>
            <p className="text-white/40 text-xs mb-4">ระบบตอบกลับอัตโนมัติกำลังทำงาน (พนักงานไม่สามารถพิมพ์ได้)</p>
            <button
              onClick={() => toggleAiMode(null)}
              className="px-6 py-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold transition-all border border-red-500/20 hover:border-red-500 flex items-center gap-2"
            >
              <Power size={14} /> หยุด AI และเข้าตอบแชทเอง
            </button>
          </div>
        ) : (
          /* โหมดปกติ (Manual) - โค้ดเดิมของคุณทั้งหมด */
          <>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <Picker onEmojiClick={(emojiData) => { const editor = textareaRef.current; if (!editor) return; const startPos = editor.selectionStart; const endPos = editor.selectionEnd; editor.value = editor.value.substring(0, startPos) + emojiData.emoji + editor.value.substring(endPos); editor.focus(); }} theme="dark" />
              </div>
            )}
            <textarea
              ref={textareaRef}
              onKeyDown={handleKeyDown}
              style={{ height: `${Math.min(height, 150)}px` }}
              className="w-full p-3.5 bg-white/5 text-white text-sm rounded-xl border border-white/10 focus:border-[#BE7EC7] focus:ring-1 focus:ring-[#BE7EC7] outline-none resize-none custom-scrollbar transition-all"
              placeholder="Type a message..."
            />
            <div className="flex gap-2 mt-3 items-center">
              <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <button onClick={handleAttachClick} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 rounded-xl transition-all border border-white/5"><i className="fa-solid fa-paperclip"></i></button>
              <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 rounded-xl transition-all border border-white/5"><i className="fa-regular fa-face-smile"></i></button>
              <button onClick={handleSendClick} className="flex-1 px-4 py-2.5 bg-[#BE7EC7] hover:bg-[#a66bb0] text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#BE7EC7]/20"><i className="fa-solid fa-paper-plane text-xs"></i> Send</button>
            </div>
          </>
        )}
      </div>

      <Tooltip id="viewers-tooltip" className="!bg-[#1E1B29] !text-white/90 !border !border-white/10 !rounded-lg !text-xs !px-2 !py-1 shadow-xl z-50" />
    </div>
  );
}