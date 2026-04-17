"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Pusher from "pusher-js"; // 🔥 นำเข้า Pusher
import "@/app/assets/css/other.css";

export default function ChatBoardInlineFinal() {
  const [chats, setChats] = useState([]);
  const [columns, setColumns] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState([]);

  const [editingColId, setEditingColId] = useState(null);
  const [tempColTitle, setTempColTitle] = useState("");

  const [messageDrafts, setMessageDrafts] = useState({});
  const [isSelectChatModalOpen, setIsSelectChatModalOpen] = useState(false);
  const [targetColumnIdForAdd, setTargetColumnIdForAdd] = useState(null);
  const [chatFilter, setChatFilter] = useState("ALL");
  const [isAddColumnMode, setIsAddColumnMode] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  
  const [currentUser, setCurrentUser] = useState({ name: "Agent", role: "Admin", avatar: "A" });
  const [activeWsId, setActiveWsId] = useState(null);

  const selectedChatIdsRef = useRef(selectedChatIds);
  useEffect(() => {
    selectedChatIdsRef.current = selectedChatIds;
  }, [selectedChatIds]);
  const chatContainerRefs = useRef({});

  useEffect(() => {
    selectedChatIds.forEach((id) => {
      const container = chatContainerRefs.current[id];
      if (container)
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
  }, [chats, selectedChatIds]);

  // 🟢 1. ฟังก์ชันโหลดข้อมูลคอลัมน์
  const loadColumns = async (wsId) => {
    try {
      const timestamp = new Date().getTime();
      const colRes = await fetch(`/api/board/columns?wsId=${wsId}&t=${timestamp}`, { cache: "no-store" });
      const colData = await colRes.json();
      setColumns(colData || []);
    } catch (error) {
      console.error("Error loading columns:", error);
    }
  };

  // 🟢 2. โหลดข้อมูลทั้งหมดครั้งแรก
  useEffect(() => {
    const loadData = async () => {
      try {
        // 🔥 ดึง Workspace ID
        const wsRes = await fetch("/api/users/current-workspace");
        if (!wsRes.ok) throw new Error("Failed to get workspace");
        const wsData = await wsRes.json();
        const currentWsId = wsData.activeWorkspaceId;
        
        if (!currentWsId) {
            setIsLoaded(true);
            return;
        }
        setActiveWsId(currentWsId);

        // 🔥 ดึงโปรไฟล์ User
        try {
            const profileRes = await fetch('/api/users/profile');
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              if (profileData.profile) {
                setCurrentUser({
                  id: profileData.profile.user_id,
                  name: profileData.profile.username || "Agent",
                  role: profileData.profile.role,
                  avatar: profileData.profile.profile_image || "A",
                });
              }
            }
        } catch (e) { console.error("Fetch profile error", e); }

        const timestamp = new Date().getTime();
        await loadColumns(currentWsId);

        // 🔥 ดึงแชท
        const chatRes = await fetch(`/api/chats/chat-sessions?wsId=${currentWsId}&t=${timestamp}`, { cache: "no-store" });
        if (!chatRes.ok) throw new Error("Failed to fetch chats");
        const data = await chatRes.json();

        const realChats = (Array.isArray(data) ? data : []).map((chat) => ({
          ...chat,
          columnId: chat.board_column_id || chat.boardColumnId || chat.columnId || "col-1",
          avatar: chat.name ? chat.name.charAt(0).toUpperCase() : "U",
        }));

        setChats(realChats);
      } catch (error) {
        console.error("Error loading board data:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const reloadChats = async () => {
      if (!activeWsId) return;
      try {
          const chatRes = await fetch(`/api/chats/chat-sessions?wsId=${activeWsId}&t=${Date.now()}`, { cache: 'no-store' });
          if (chatRes.ok) {
              const chatData = await chatRes.json();
              const realChats = (Array.isArray(chatData) ? chatData : []).map((chat) => ({
                  ...chat,
                  columnId: chat.board_column_id || chat.boardColumnId || chat.columnId || "col-1",
                  avatar: chat.name ? chat.name.charAt(0).toUpperCase() : "U",
              }));
              setChats(realChats);
          }
      } catch (error) {
          console.error("❌ Failed to reload chats:", error);
      }
  };

  // 🟢 3. ระบบ Real-time (เปลี่ยนจาก SSE เป็น Pusher)
  useEffect(() => {
      if (!isLoaded || !activeWsId) return;

      Pusher.logToConsole = false;
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });

      // 🎧 ฟังชันแชท
      const channel = pusher.subscribe(`workspace-${activeWsId}`);
      
      channel.bind('channel-updated', () => reloadChats());
      channel.bind('chat-details-updated', () => reloadChats());

      channel.bind('webhook-event', function(data) {
        if (!data || !data.chatId) return;

        if (data.action === "SYNC_MESSAGE") {
          setChats(prev => {
            const isExistingChat = prev.some((c) => String(c.id) === String(data.chatId));
            const isViewing = selectedChatIdsRef.current.includes(data.chatId);

            if (isExistingChat) {
              return prev.map(chat => {
                if (String(chat.id) === String(data.chatId)) {
                  let updatedMessages = [...(chat.messages || [])];
                  const tempMsgIndex = updatedMessages.findIndex(m => 
                      (m.text === data.text && Math.abs(new Date(m.timestamp) - new Date(data.timestamp)) < 5000)
                  );

                  const newMsg = {
                      id: Date.now() + Math.random(),
                      external_id: data.messageId,
                      from: data.from || "customer",
                      senderName: data.senderName,
                      text: data.text,
                      type: data.type,
                      time: data.time || new Date(data.timestamp).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
                      timestamp: new Date(data.timestamp),
                  };

                  if (tempMsgIndex !== -1) updatedMessages[tempMsgIndex] = newMsg;
                  else updatedMessages.push(newMsg);

                  return {
                    ...chat,
                    messages: updatedMessages,
                    lastMessage: data.type === "IMAGE" ? "ส่งรูปภาพ" : data.text,
                    unreadCount: data.from?.toLowerCase() === "customer" && !isViewing ? (chat.unreadCount || 0) + 1 : chat.unreadCount
                  };
                }
                return chat;
              });
            } else {
              setTimeout(() => { reloadChats(); }, 500);
              return prev;
            }
          });
        }

        if (data.action === "MOVE_CHAT") {
           setChats(prev => prev.map(chat => 
              String(chat.id) === String(data.chatId) ? { ...chat, columnId: data.columnId } : chat
           ));
        }

        if (data.action === "MARK_READ") {
           setChats(prev => prev.map(chat => 
              String(chat.id) === String(data.chatId) ? { ...chat, unreadCount: 0 } : chat
           ));
        }

        if (data.action === "DELETE_MESSAGE" || data.action === "EDIT_MESSAGE") {
          setChats((prev) =>
            prev.map((chat) => {
              if (String(chat.id) === String(data.chatId)) {
                const updatedMessages = chat.messages.map((m) => {
                  const isMatch = String(m.external_id) === String(data.messageId) || String(m.id) === String(data.messageId);
                  return isMatch ? { ...m, text: data.text } : m;
                });
                return { ...chat, messages: updatedMessages, lastMessage: data.text };
              }
              return chat;
            }),
          );
        }
      });

      // 🎧 ฟังสัญญาณบอร์ด
      const globalBoardChannel = pusher.subscribe('global-board');
      globalBoardChannel.bind('board-layout-updated', function(data) {
          loadColumns(activeWsId);
      });

      return () => {
          pusher.unsubscribe(`workspace-${activeWsId}`);
          globalBoardChannel.unbind_all();
          pusher.unsubscribe('global-board');
      };
  }, [isLoaded, activeWsId]);

  const startEditColumn = (col) => {
    setEditingColId(col.column_id);
    setTempColTitle(col.title);
  };

  const saveColumnTitle = async () => {
    if (tempColTitle.trim()) {
      setColumns((prev) =>
        prev.map((c) => c.column_id === editingColId ? { ...c, title: tempColTitle } : c)
      );
      try {
        await fetch(`/api/board/columns/${editingColId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: tempColTitle })
        });
      } catch (error) {
        console.error("Failed to update column title", error);
      }
    }
    setEditingColId(null);
  };

  const handleSendMessage = async (chatId) => {
    const text = messageDrafts[chatId]?.trim();
    if (!text || !activeWsId) return;
    const currentTime = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...(chat.messages || []), { text, from: "AGENT", senderName: currentUser.name, time: currentTime, id: Date.now(), timestamp: new Date() }],
              lastMessage: text,
            }
          : chat
      )
    );
    setMessageDrafts((prev) => ({ ...prev, [chatId]: "" }));
    
    try {
      await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatSessionId: chatId, text, workspaceId: activeWsId }),
      });
    } catch (error) {
        console.error(error);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || columns.length >= 5) return;
    const newColId = `col-${Date.now()}`;
    const newColData = { id: newColId, title: newColumnTitle, order_index: columns.length + 1 };

    const oldColumns = [...columns];
    setColumns([...columns, { column_id: newColId, title: newColumnTitle }]);
    setNewColumnTitle("");
    setIsAddColumnMode(false);

    try {
      const res = await fetch("/api/board/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newColData),
      });

      if (!res.ok) throw new Error("API เกิดข้อผิดพลาด");
    } catch (error) {
      alert(`❌ สร้างคอลัมน์ไม่สำเร็จ:\n${error.message}`);
      setColumns(oldColumns);
    }
  };

  const handleDeleteColumn = async (colId, e) => {
    e.stopPropagation();
    if (colId === "col-1") {
      alert("ไม่สามารถลบคอลัมน์ Inbox หลักได้ครับ!");
      return;
    }

    const oldCols = [...columns];
    const oldChats = [...chats];

    setColumns(columns.filter((c) => c.column_id !== colId));
    setChats((prev) => prev.map((chat) => chat.columnId === colId ? { ...chat, columnId: "col-1" } : chat));

    try {
      const res = await fetch(`/api/board/columns/${colId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("API เกิดข้อผิดพลาด ไม่สามารถลบได้");
    } catch (error) {
      alert(`❌ ลบคอลัมน์ไม่สำเร็จ:\n${error.message}`);
      setColumns(oldCols);
      setChats(oldChats);
    }
  };

  const openAddChatModal = (columnId) => {
    setTargetColumnIdForAdd(columnId);
    setChatFilter("ALL");
    setIsSelectChatModalOpen(true);
  };

  const handleMoveChatToColumn = async (chatId) => {
    const oldChats = [...chats];
    
    setChats((prev) => prev.map((chat) => chat.id === chatId ? { ...chat, columnId: targetColumnIdForAdd } : chat));
    setIsSelectChatModalOpen(false);

    try {
      const res = await fetch(`/api/chats/${chatId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columnId: targetColumnIdForAdd }),
      });

      if (!res.ok) throw new Error("บันทึกลง Database ไม่สำเร็จ");
    } catch (error) {
      alert(`❌ ย้ายแชทไม่สำเร็จ ระบบจะดึงกลับไปตำแหน่งเดิม:\n${error.message}`);
      setChats(oldChats);
    }
  };

  const getFilteredChatsForModal = () => {
    if (chatFilter === "ALL") return chats;
    return chats.filter((c) => c.platform === chatFilter);
  };

  const handleToggleChat = async (chatId) => {
    setSelectedChatIds((prev) =>
      prev.includes(chatId) ? prev.filter((id) => id !== chatId) : [...prev, chatId]
    );

    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)));
    try {
      await fetch(`/api/chats/${chatId}/read`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleInputChange = (chatId, value) => {
    setMessageDrafts((prev) => ({ ...prev, [chatId]: value }));
  };

  const getStatusColorClass = (status) => {
    switch (status?.toUpperCase()) {
      case "OPEN": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "PENDING": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "CLOSED":
      case "RESOLVED": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-white/5 text-white/50 border-white/10";
    }
  };

  if (!isLoaded)
    return (
      <div className="h-screen w-full flex items-center justify-center text-white/50">
        <div className="w-8 h-8 border-4 border-[#BE7EC7]/30 border-t-[#BE7EC7] rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="relative w-full h-screen overflow-hidden p-4 font-sans text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 -z-10" />

      <div className="flex h-full gap-4 overflow-x-auto pb-2 items-start no-scrollbar">
        {columns.map((col) => (
          <div
            key={col.column_id}
            className="bg-[#1a1423] border border-[#BE7EC7]/10 backdrop-blur-md rounded-3xl shadow-xl pt-4 px-3 pb-3 h-full flex flex-col w-[90vw] md:w-[350px] lg:w-[380px] shrink-0 flex-none transition-all"
          >
            <div className="flex justify-between items-center mb-4 px-2 shrink-0 h-8">
              {editingColId === col.column_id ? (
                <input
                  autoFocus
                  value={tempColTitle}
                  onChange={(e) => setTempColTitle(e.target.value)}
                  onBlur={saveColumnTitle}
                  onKeyDown={(e) => e.key === "Enter" && saveColumnTitle()}
                  className="bg-black/40 border border-[#BE7EC7]/50 rounded px-2 py-1 text-sm font-bold text-white w-full mr-2 outline-none"
                />
              ) : (
                <h2
                  onClick={() => startEditColumn(col)}
                  className="font-bold text-lg text-white/90 cursor-pointer hover:text-white hover:bg-white/5 px-2 py-1 rounded transition-colors truncate flex-1"
                >
                  {col.title}
                </h2>
              )}
              <button
                onClick={(e) => handleDeleteColumn(col.column_id, e)}
                className="text-white/40 hover:text-red-400 ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1 min-h-0">
              {chats.filter((c) => c.columnId === col.column_id).map((chat) => {
                  const isOpen = selectedChatIds.includes(chat.id);
                  const isIG = chat.platform === "INSTAGRAM";
                  const isFB = chat.platform === "FACEBOOK";
                  const isLINE = chat.platform === "LINE";
                  const isTG = chat.platform === "TELEGRAM";
                  const isUnread = chat.unreadCount > 0 && !isOpen;
                  
                  const lastMsgObj = chat.messages?.[chat.messages.length - 1];
                  const isMe = lastMsgObj ? ["me", "admin", "agent"].includes(lastMsgObj.from?.toLowerCase()) : false;

                  let previewText = chat.lastMessage || "Click to chat";
                  const isImagePreview = chat.lastMessageType === "IMAGE" || previewText === "IMAGE" || previewText.includes("/api/line/image/") || previewText.includes("/api/telegram/file/") || previewText.includes("lookaside.fbsbx.com") || previewText.includes("ig_messaging_cdn") || previewText.includes("fbcdn.net") || previewText.includes("cdninstagram.com");

                  if (isImagePreview) {
                    previewText = isMe ? "คุณส่งรูปภาพ" : `${chat.name.split(" ")[0]} ส่งรูปภาพ `;
                  } else if (isMe && previewText !== "Click to chat") {
                    previewText = previewText.startsWith("คุณ:") ? previewText : `คุณ: ${previewText}`;
                  }

                  return (
                    <motion.div
                      key={chat.id}
                      className={`transition-colors duration-300 overflow-hidden rounded-2xl relative flex flex-col ${isOpen ? "bg-white/5 border border-white/20 shadow-xl" : "bg-white/20 hover:bg-white/30 border border-white/10 cursor-pointer"}`}
                    >
                      {/* --- ตอนที่หดการ์ดอยู่ (!isOpen) --- */}
                      {!isOpen && (
                        <div onClick={() => handleToggleChat(chat.id)} className="p-3 flex justify-between items-start cursor-pointer select-none">
                          <div className="flex items-start gap-3 overflow-hidden w-full">
                            <div className="relative shrink-0">
                              <img src={chat.imgUrl || "/avatar.png"} className="w-10 h-10 rounded-full object-cover shadow-lg bg-white/5" />
                              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1a1423] ${isIG ? "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500" : isFB ? "bg-[#0866FF]" : isLINE ? "bg-[#06C755]" : isTG ? "bg-[#0088cc]" : "bg-slate-500"}`}>
                                <i className={`fa-brands fa-${isIG ? "instagram" : isFB ? "facebook-f" : isLINE ? "line" : isTG ? "telegram" : "question"} text-[9px] text-white`}></i>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className={`truncate text-sm ${isUnread ? "font-bold text-white" : "font-semibold text-white/90"}`}>{chat.name}</h3>
                              <p className={`text-xs truncate mb-1.5 ${isUnread ? "font-bold text-[#BE7EC7]" : "text-white/50"}`}>{isUnread ? `${chat.unreadCount} ข้อความใหม่` : previewText}</p>
                              
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${getStatusColorClass(chat.status)}`}>
                                  {chat.status || "OPEN"}
                                </span>
                                {(chat.tags || []).map((tagObj, i) => {
                                  const tagName = typeof tagObj === 'object' ? tagObj.name : tagObj;
                                  if (!tagName) return null;
                                  const tagColor = typeof tagObj === 'object' ? tagObj.color : '#BE7EC7';
                                  const tagEmoji = typeof tagObj === 'object' ? tagObj.emoji : '';
                                  return (
                                    <span
                                      key={`${tagName}-${i}`}
                                      className="text-[8px] font-semibold px-1.5 py-0.5 rounded-md border flex items-center gap-1 whitespace-nowrap"
                                      style={{ color: tagColor, borderColor: `${tagColor}40`, backgroundColor: `${tagColor}10` }}
                                    >
                                      {tagEmoji && <span>{tagEmoji}</span>}
                                      {tagName}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- ตอนที่ขยายการ์ด (isOpen) --- */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 450 }} exit={{ height: 0 }} className="flex flex-col bg-black/10 overflow-hidden">
                            <div className="flex flex-col gap-1 border-b border-white/10 p-4 shrink-0 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => handleToggleChat(chat.id)}>
                              
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center flex-wrap gap-2 flex-1 min-w-0">
                                  <h2 className="text-white font-bold text-lg truncate">{chat.name}</h2>
                                  {(chat.tags || []).map((tagObj, i) => {
                                    const tagName = typeof tagObj === 'object' ? tagObj.name : tagObj;
                                    if (!tagName) return null;
                                    const tagColor = typeof tagObj === 'object' ? tagObj.color : '#BE7EC7';
                                    const tagEmoji = typeof tagObj === 'object' ? tagObj.emoji : '';
                                    return (
                                      <span
                                        key={`${tagName}-${i}`}
                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1 whitespace-nowrap shadow-sm"
                                        style={{ color: tagColor, borderColor: `${tagColor}40`, backgroundColor: `${tagColor}10` }}
                                      >
                                        {tagEmoji && <span>{tagEmoji}</span>}
                                        {tagName}
                                      </span>
                                    );
                                  })}
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${isIG ? "text-pink-400 border-pink-400/30 bg-pink-400/10" : isFB ? "text-blue-400 border-blue-400/30 bg-blue-400/10" : isLINE ? "text-green-400 border-green-400/30 bg-green-400/10" : isTG ? "text-sky-400 border-sky-400/30 bg-sky-400/10" : "text-white/50 border-white/20 bg-white/10"}`}>
                                  {chat.platform}
                                </span>
                              </div>
                              
                              <div className="flex items-center mt-1">
                                <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${getStatusColorClass(chat.status)}`}>
                                  {chat.status || "OPEN"}
                                </span>
                              </div>

                            </div>

                            <div ref={(el) => (chatContainerRefs.current[chat.id] = el)} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
                              {chat.messages?.map((msg, idx) => {
                                const isMe = ["me", "admin", "agent"].includes(msg.from?.toLowerCase());
                                const text = msg.text || "";

                                const isImageMsg = msg.type === "IMAGE" || text.includes("/api/line/image/") || text.includes("/api/telegram/file/") || text.match(/\.(jpeg|jpg|gif|png|webp)/i) || text.includes("fbcdn.net") || text.includes("lookaside.fbsbx.com") || text.includes("ig_messaging_cdn") || text.includes("cdninstagram.com");

                                return (
                                  <div key={idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                    <div className={`flex items-center gap-2 mb-1.5 text-[11px] text-white/50 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                      <span className="font-medium">{isMe ? (msg.senderName || currentUser?.name || "Agent") : chat.name.split(" ")[0]}</span>
                                      {msg.time && <span>{msg.time}</span>}
                                    </div>
                                    <div className={`max-w-[85%] break-words whitespace-pre-wrap px-4 py-2.5 text-[13px] rounded-2xl shadow-md ${isImageMsg ? "p-1 rounded-2xl bg-black/20" : isMe ? "bg-[#BE7EC7] text-white rounded-br-sm font-medium" : "bg-white/10 text-white/90 rounded-bl-sm border border-white/10"}`}>
                                      {isImageMsg ? (
                                        <img src={text} className="max-w-[200px] h-auto object-cover rounded-xl" loading="lazy" onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerHTML = '<div class="p-3 text-white/50 text-xs text-center"><i class="fa-solid fa-image-slash mb-1"></i><br/>รูปภาพไม่แสดงผล</div>'; }} />
                                      ) : (
                                        text
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="p-4 pt-1 shrink-0">
                              <div className="bg-black/20 border border-white/10 rounded-xl p-3 flex flex-col focus-within:border-[#BE7EC7]/50 transition-colors">
                                <textarea
                                  placeholder="Type a message..."
                                  value={messageDrafts[chat.id] || ""}
                                  onChange={(e) => handleInputChange(chat.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                      e.preventDefault();
                                      handleSendMessage(chat.id);
                                    }
                                  }}
                                  className="w-full bg-transparent text-white text-[13px] outline-none resize-none h-12"
                                />
                                <div className="flex justify-end mt-2">
                                  <button onClick={() => handleSendMessage(chat.id)} className="text-white/50 hover:text-[#BE7EC7] transition-colors bg-white/5 hover:bg-[#BE7EC7]/10 w-8 h-8 rounded-lg flex items-center justify-center">
                                    <i className="fa-solid fa-paper-plane text-xs"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}

              <button onClick={() => openAddChatModal(col.column_id)} className="w-full py-3 border-2 border-dashed border-white/10 rounded-2xl text-white/40 hover:text-white/80 hover:bg-white/5 hover:border-white/20 transition-all flex justify-center items-center gap-2 mt-2 text-sm font-medium">
                <span>+ Move Chat Here</span>
              </button>
            </div>
          </div>
        ))}

        {columns.length < 5 && (
          <div className="min-w-[250px] pt-2">
            {isAddColumnMode ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-4 shadow-xl">
                <input autoFocus className="w-full bg-transparent border-b border-white/30 focus:border-[#BE7EC7] text-white outline-none mb-3 py-1 font-semibold transition-colors" placeholder="List Name..." value={newColumnTitle} onChange={(e) => setNewColumnTitle(e.target.value)} />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleAddColumn} className="flex-1 bg-gradient-to-tr from-[#BE7EC7] to-[#8a55b5] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md hover:opacity-90 transition-opacity">Save</button>
                  <button onClick={() => setIsAddColumnMode(false)} className="px-4 text-white/50 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsAddColumnMode(true)} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 font-semibold h-14 rounded-3xl transition-all shadow-sm">+ Add new list</button>
            )}
          </div>
        )}
      </div>

      {/* Select Chat Modal */}
      {isSelectChatModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1E1B29] border border-white/10 rounded-3xl p-6 w-[500px] shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-arrow-right-arrow-left text-[#BE7EC7]"></i> Move Chat
              </h3>
              <button onClick={() => setIsSelectChatModalOpen(false)} className="w-8 h-8 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors">✕</button>
            </div>
            <div className="flex bg-white/5 rounded-xl p-1 mb-4 border border-white/5 overflow-x-auto no-scrollbar shrink-0">
              {["ALL", "FACEBOOK", "INSTAGRAM", "LINE", "TELEGRAM"].map((f) => (
                <button key={f} onClick={() => setChatFilter(f)} className={`shrink-0 px-4 py-2 text-[11px] font-bold rounded-lg transition-all ${chatFilter === f ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {getFilteredChatsForModal().length > 0 ? (
                getFilteredChatsForModal().map((chat) => (
                  <div key={chat.id} onClick={() => handleMoveChatToColumn(chat.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${chat.columnId === targetColumnIdForAdd ? "bg-white/5 opacity-50 pointer-events-none" : "hover:bg-white/10 border-transparent hover:border-white/10"}`}>
                    <img src={chat.imgUrl || "/avatar.png"} className="w-10 h-10 rounded-full object-cover bg-white/5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm font-bold truncate">{chat.name}</span>
                        <span className={`text-[9px] px-1.5 rounded-md font-bold ${chat.platform === "INSTAGRAM" ? "text-pink-400 bg-pink-400/10" : chat.platform === "FACEBOOK" ? "text-blue-400 bg-blue-400/10" : chat.platform === "LINE" ? "text-green-400 bg-green-400/10" : chat.platform === "TELEGRAM" ? "text-sky-400 bg-sky-400/10" : "bg-white/10 text-white/50"}`}>
                          {chat.platform}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-white/40 text-sm">No chats available in this category</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}