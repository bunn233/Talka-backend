"use client";

import { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Pusher from "pusher-js"; // 🔥 นำเข้า Pusher

// ส่วนประกอบ UI ต่างๆ
import ChatList from "@/app/components/Chat/ChatList.jsx";
import ChatMessage from '@/app/components/Chat/ChatMessage.jsx';
import ChatFitter from "@/app/components/Chat/ChatFitter";
import ControlPanel from "@/app/components/Actions/ControlPanel";
import AddTag from "@/app/components/Actions/AddTag";
import ContactDetails from "@/app/components/Chat/ChatContactDetail";
import AddNote from "@/app/components/Actions/AddNote";
import AiSuppBtn from "@/app/components/AI/AiSuppBtn";
import ChangeStatus from "@/app/components/Actions/Changestatus";
import AiAssistantPanel from "@/app/components/AI/AiAssistantPanel";
import ActivityLogPanel from "@/app/components/Actions/ActivityLogPanel";
import SendToBoardModal from "@/app/components/Modals/SendToBoardModal";

import "@/app/assets/css/other.css";

import { DEFAULT_TAGS } from "@/app/data/defaultTags";
import { DEFAULT_AI_PROMPTS } from "@/app/data/defaultPrompts";

const ALL_AVAILABLE_STATUS = ["OPEN", "PENDING", "CLOSED", "RESOLVED"];

const DEFAULT_AI_AGENTS = [
    { id: 'receptionist', name: 'Receptionist', emoji: '🛎️', role: 'Front Desk' },
    { id: 'sales', name: 'Sales Agent', emoji: '😝', role: 'Sales' },
    { id: 'support', name: 'Support Agent', emoji: '❤️', role: 'Support' },
];

function ChatPageContent() {
    const searchParams = useSearchParams();

    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const selectedChat = chats.find(chat => chat.id === selectedChatId);

    const selectedChatIdRef = useRef(null);
    useEffect(() => {
        selectedChatIdRef.current = selectedChatId;
    }, [selectedChatId]);

    const [isLoaded, setIsLoaded] = useState(false);

    const [isAddTagModalOpen, setIsAddTagModalOpen] = useState(false);
    const [isContactDetailsOpen, setIsContactDetailsOpen] = useState(false);
    const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
    const [isChangeStatusOpen, setIsChangeStatusOpen] = useState(false);
    const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    const [isSendToBoardOpen, setIsSendToBoardOpen] = useState(false);

    const [activeFilter, setActiveFilter] = useState("All");
    const [activeCompanyFilter, setActiveCompanyFilter] = useState(null);

    const [currentUser, setCurrentUser] = useState({ name: "Agent", role: "Admin", avatar: "A" });

    const [activityLogs, setActivityLogs] = useState([]);
    const [activePrompts, setActivePrompts] = useState(DEFAULT_AI_PROMPTS.filter(p => p.active === true));
    const [availableAgents, setAvailableAgents] = useState(DEFAULT_AI_AGENTS);
    const [availableTags, setAvailableTags] = useState(DEFAULT_TAGS);

    // 🟢 Fetch Initial Data (ดึงเฉพาะ TELEGRAM)
    useEffect(() => {
        const loadData = async () => {
            try {
                // 🔥 1. ดึง ID ของทีมปัจจุบันจาก API แทน Local Storage
                const wsRes = await fetch("/api/users/current-workspace");
                if (!wsRes.ok) throw new Error("Failed to get workspace");
                const wsData = await wsRes.json();
                
                const activeWsId = wsData.activeWorkspaceId;
                if (!activeWsId) {
                    console.error("No active workspace found.");
                    setIsLoaded(true);
                    return;
                }

                // 🔥 แอบดึงชื่อจริงจาก Profile มาใส่แทนคำว่า Admin
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

                // 🔥 2. ยิง API ขอแชท โดยแนบ ID ทีมไปกับ URL
                const res = await fetch(`/api/chats/chat-sessions?wsId=${activeWsId}`);
                if (!res.ok) throw new Error('API Error');
                const data = await res.json();
                
                // 🔥 3. กรองเอาเฉพาะ TELEGRAM
                const tgChats = Array.isArray(data) 
                    ? data.filter(c => c.platform === 'TELEGRAM') 
                    : [];
                
                setChats(tgChats);

                // 🔥 4. ดึง Tags
                const tagRes = await fetch("/api/tags"); 
                if (tagRes.ok) {
                  const tagData = await tagRes.json();
                  const safeTags = tagData.map((t) => ({
                    id: t.tag_id || t.id,
                    name: t.name || t.tag_name || "Unknown",
                    color: t.color || "#BE7EC7",
                    emoji: t.emoji || "🏷️",
                  }));
                  setAvailableTags(safeTags.length > 0 ? safeTags : DEFAULT_TAGS);
                }

            } catch (error) {
                console.error('❌ Failed to load Telegram chats:', error);
                setChats([]);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

    const reloadChats = async () => {
        try {
            const wsRes = await fetch("/api/users/current-workspace");
            const wsData = await wsRes.json();
            const activeWsId = wsData.activeWorkspaceId;
            if (!activeWsId) return;

            const chatRes = await fetch(`/api/chats/chat-sessions?wsId=${activeWsId}&t=${Date.now()}`, { cache: 'no-store' });
            if (chatRes.ok) {
                const chatData = await chatRes.json();
                const tgChats = Array.isArray(chatData) ? chatData.filter(c => c.platform === 'TELEGRAM') : [];
                setChats(tgChats);
            }
        } catch (error) {
            console.error("❌ Failed to reload chats:", error);
        }
    };

    // 🟢 2. ดักฟัง Pusher (Real-time ล้วนๆ)
    useEffect(() => {
        if (!isLoaded) return;

        const setupPusher = async () => {
            const wsRes = await fetch("/api/users/current-workspace");
            const wsData = await wsRes.json();
            const activeWsId = wsData.activeWorkspaceId;
            if (!activeWsId) return;

            Pusher.logToConsole = false;
            const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
                cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            });

            const channel = pusher.subscribe(`workspace-${activeWsId}`);

            channel.bind('channel-updated', function(data) {
                setSelectedChatId(null); 
                reloadChats(); 
            });

            channel.bind('chat-details-updated', function(data) {
                reloadChats(); 
            });

            channel.bind('log-updated', function(data) {
                if (selectedChatIdRef.current && String(selectedChatIdRef.current) === String(data.chatId)) {
                   // fetchLogsForChat(selectedChatIdRef.current);
                }
            });

            // รับข้อความ
            channel.bind('webhook-event', function(data) {
                if (!data || !data.chatId) return;
                if (data.platform && data.platform !== "TELEGRAM") return; // กรองเฉพาะ TELEGRAM

                if (data.action === "SYNC_MESSAGE") {
                    setChats((prev) => {
                        const isExistingChat = prev.some((c) => String(c.id) === String(data.chatId));
                        const isViewing = String(selectedChatIdRef.current) === String(data.chatId);

                        if (isExistingChat) {
                            return prev.map((chat) => {
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
                                        name: data.name || data.customerName || chat.name,
                                        imgUrl: data.imgUrl || chat.imgUrl,
                                        messages: updatedMessages,
                                        lastMessage: data.type === "IMAGE" ? "ส่งรูปภาพ" : data.text,
                                        unreadCount: data.from === "customer" && !isViewing ? (chat.unreadCount || 0) + 1 : chat.unreadCount
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
                    setChats((prev) => prev.map((chat) => String(chat.id) === String(data.chatId) ? { ...chat, columnId: data.columnId } : chat));
                }

                if (data.action === "DELETE_MESSAGE" || data.action === "EDIT_MESSAGE") {
                    setChats((prev) => prev.map((chat) => {
                        if (String(chat.id) === String(data.chatId)) {
                            const updatedMessages = (chat.messages || []).map((m) => {
                                const isMatch = String(m.external_id) === String(data.messageId) || String(m.id) === String(data.messageId);
                                return isMatch ? { ...m, text: data.text } : m;
                            });
                            return { ...chat, messages: updatedMessages, lastMessage: data.text };
                        }
                        return chat;
                    }));
                }
            });

            return () => {
                pusher.unsubscribe(`workspace-${activeWsId}`);
            };
        };

        setupPusher();
    }, [isLoaded]);

    useEffect(() => {
        const urlId = searchParams.get('id');
        if (urlId && chats.length > 0) {
            const idNum = parseInt(urlId);
            const targetChat = chats.find(c => c.id === idNum);
            if (targetChat) {
                setSelectedChatId(idNum);
            }
        }
    }, [searchParams, chats]);

    const addLog = (chatId, type, detail) => {
        if (!chatId) return;
        const newLog = { id: Date.now() + Math.random(), chatId, type, detail, timestamp: new Date().toISOString(), by: currentUser.name };
        setActivityLogs(prev => [...prev, newLog]);
    };

    const handleToggleTag = async (tagName) => {
        if (!selectedChat) return;

        setChats(currentChats => currentChats.map(chat => {
            if (chat.id === selectedChat.id) {
                const currentTags = chat.tags || [];
                const hasTag = currentTags.includes(tagName);
                const newTags = hasTag ? currentTags.filter(t => t !== tagName) : [...currentTags, tagName];
                return { ...chat, tags: newTags };
            }
            return chat;
        }));

        try {
            const res = await fetch(`/api/chat-sessions/${selectedChat.id}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tagName })
            });
            if (!res.ok) throw new Error("Failed to update tag");
            const result = await res.json();
            const actionText = result.action === 'added' ? 'Added' : 'Removed';
            addLog(selectedChat.id, 'tag', `${actionText} tag "${tagName}"`);
        } catch (error) {
            console.error('❌ Error toggling tag:', error);
        }
    };

    const handleUpdateStatus = async (newStatus) => {
        if (!selectedChat) return;

        const previousStatus = selectedChat.status;
        setChats(currentChats => currentChats.map(chat => chat.id === selectedChat.id ? { ...chat, status: newStatus } : chat));

        try {
            const res = await fetch(`/api/chat-sessions/${selectedChat.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error("Failed to update status");
            addLog(selectedChat.id, 'status', `Changed status from "${previousStatus}" to "${newStatus}"`);

        } catch (error) {
            console.error('❌ Error updating status:', error);
            alert("ไม่สามารถอัปเดตสถานะได้ ระบบจะย้อนกลับค่าเดิม");
            setChats(currentChats => currentChats.map(chat => chat.id === selectedChat.id ? { ...chat, status: previousStatus } : chat));
        }
    };

    const handleUpdateContactInfo = async (contactId, updatedInfo) => {
        addLog(contactId, 'contact', `Updated information`);
        setChats(currentChats => currentChats.map(chat => chat.id === contactId ? { ...chat, ...updatedInfo } : chat));
    };

    const handleAddNote = async (noteData) => {
        if (!selectedChatId) return;
        addLog(selectedChatId, 'note', `Added note: "${noteData.title}"`);
        setChats(currentChats => currentChats.map(chat => chat.id === selectedChatId ? { ...chat, notes: [...(chat.notes || []), noteData] } : chat));
    };

    // 🔥 3. ส่งข้อความ เปลี่ยนให้ใช้ API รวมและแนบ Workspace ID + ชื่อคนส่ง
    const handleSendMessage = async (chatId, text, files = []) => {
        if (!chatId) return;
        if (!text.trim() && (!files || files.length === 0)) return;

        try {
            const wsRes = await fetch("/api/users/current-workspace");
            const wsData = await wsRes.json();
            const activeWsId = wsData.activeWorkspaceId;

            if (!activeWsId) { alert("ไม่พบข้อมูล Workspace กรุณารีเฟรชหน้าเว็บ"); return; }

            const targetChat = chats.find((c) => c.id === chatId);
            if (!targetChat) return;

            let apiEndpoint = "/api/messages/send";
            const newMessages = [];

            if (text.trim()) {
                newMessages.push({ id: Date.now(), from: "AGENT", senderName: currentUser.name, text: text.trim(), time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }), timestamp: new Date() });
            }

            if (files && files.length > 0) {
                files.forEach((file, index) => {
                    newMessages.push({ id: Date.now() + index + 1, from: "AGENT", senderName: currentUser.name, type: "IMAGE", text: URL.createObjectURL(file), time: new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }), timestamp: new Date() });
                });
            }

            setChats((currentChats) => currentChats.map((chat) => chat.id === chatId ? { ...chat, messages: [...(chat.messages || []), ...newMessages], lastMessage: text.trim() || (files.length > 0 ? "ส่งรูปภาพ" : "") } : chat));

            let response;
            if (files && files.length > 0) {
                const formData = new FormData();
                formData.append("chatSessionId", chatId);
                formData.append("text", text.trim());
                formData.append("workspaceId", activeWsId); 
                files.forEach((file) => formData.append("files", file));
                response = await fetch(apiEndpoint, { method: "POST", body: formData });
            } else {
                response = await fetch(apiEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chatSessionId: chatId, text: text.trim(), workspaceId: activeWsId }) });
            }

            if (response.status === 403) {
                const errorData = await response.json();
                if (errorData.error === "KICKED") {
                    alert("⚠️ " + errorData.message);
                    window.location.href = "/waiting"; 
                    return;
                }
            }

            if (!response.ok) {
                const error = await response.json();
                alert('Failed to send message: ' + (error.error || error.message));
                return;
            }

            addLog(chatId, 'message', `Sent message`);

        } catch (error) {
            alert('Error sending message: ' + error.message);
        }
    };

    const availableCompanies = useMemo(() => [...new Set(chats.map(c => c.company).filter(Boolean))], [chats]);
    const statusPriority = { "OPEN": 1, "PENDING": 2, "CLOSED": 3, "RESOLVED": 3 };

    const filteredChats = chats
        .filter(chat => {
            const statusMatch = activeFilter === "All" || chat.status === activeFilter;
            const companyMatch = !activeCompanyFilter || chat.company === activeCompanyFilter;
            return statusMatch && companyMatch;
        })
        .sort((a, b) => (statusPriority[a.status] || 2) - (statusPriority[b.status] || 2));

    const closeAllPanels = () => {
        setIsAddTagModalOpen(false); setIsContactDetailsOpen(false); setIsAddNoteOpen(false);
        setIsChangeStatusOpen(false); setIsActivityLogOpen(false); setIsSendToBoardOpen(false);
    };

    if (!isLoaded) {
        return (
            <div className="flex-1 flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-[#BE7EC7]/30 border-t-[#BE7EC7] rounded-full animate-spin"></div>
                    <div className="text-[#BE7EC7] text-sm font-medium">Loading Telegram Chats...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full max-h-full overflow-hidden bg-transparent">

            <div className="flex-shrink-0 px-7 py-4 border-b border-white/5">
                <ChatFitter onFilterChange={setActiveFilter} availableCompanies={availableCompanies} onCompanyChange={setActiveCompanyFilter} />
            </div>

            <div className="flex-1 flex gap-5 px-7 py-3 overflow-hidden">
                <ChatList 
                    chats={filteredChats} 
                    onSelectChat={async (chat) => {
                        setSelectedChatId(chat.id);
                        setChats((prev) => prev.map((c) => c.id === chat.id ? { ...c, unreadCount: 0 } : c));
                        try { await fetch(`/api/chats/${chat.id}/read`, { method: "PATCH" }); } catch (err) { console.error("Failed to mark as read", err); }
                    }} 
                    selectedId={selectedChatId} 
                    availableTags={availableTags} 
                />

                <div className="flex-1 flex gap-5 overflow-hidden relative">
                    <ChatMessage 
                        chat={selectedChat} 
                        availableAgents={availableAgents} 
                        onSelectAiAgent={(id, agent) => { setChats(prev => prev.map(c => c.id === id ? { ...c, activeAiAgent: agent, isAiMode: !!agent } : c)); }} 
                        aiPrompts={activePrompts} 
                        currentUser={currentUser} 
                        onSendMessage={handleSendMessage} 
                        availableTags={availableTags} 
                    />

                    {isAddTagModalOpen && <AddTag onClose={() => setIsAddTagModalOpen(false)} availableTags={availableTags} currentTargets={selectedChat?.tags || []} onToggleTag={handleToggleTag} />}
                    {isContactDetailsOpen && <ContactDetails onClose={() => setIsContactDetailsOpen(false)} contact={selectedChat} onUpdateContact={handleUpdateContactInfo} />}
                    {isAddNoteOpen && <AddNote onClose={() => setIsAddNoteOpen(false)} onSaveNote={handleAddNote} currentNotes={selectedChat?.notes || []} onDeleteNote={(id) => { setChats(prev => prev.map(c => c.id === selectedChatId ? { ...c, notes: c.notes.filter(n => n.id !== id) } : c)); }} />}
                    {isChangeStatusOpen && <ChangeStatus onClose={() => setIsChangeStatusOpen(false)} availableStatus={ALL_AVAILABLE_STATUS} currentTargets={selectedChat?.status ? [selectedChat.status] : []} onToggleStatus={handleUpdateStatus} />}
                    {isActivityLogOpen && <ActivityLogPanel onClose={() => setIsActivityLogOpen(false)} logs={activityLogs.filter(log => log.chatId === selectedChatId)} />}

                    {selectedChatId && (
                        <ControlPanel 
                            onOpenAddTagModal={() => { closeAllPanels(); setIsAddTagModalOpen(true); }}
                            onOpenContactDetails={() => { closeAllPanels(); setIsContactDetailsOpen(true); }}
                            onOpenAddNote={() => { closeAllPanels(); setIsAddNoteOpen(true); }}
                            onOpenChangeStatus={() => { closeAllPanels(); setIsChangeStatusOpen(true); }}
                            onOpenActivityLog={() => { closeAllPanels(); setIsActivityLogOpen(true); }}
                            onOpenSendToBoard={() => { closeAllPanels(); setIsSendToBoardOpen(true); }}
                        />
                    )}

                    <div className="absolute bottom-6 right-6 z-50">
                        <AiSuppBtn onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)} isOpen={isAiAssistantOpen} />
                    </div>
                    {isAiAssistantOpen && <AiAssistantPanel onClose={() => setIsAiAssistantOpen(false)} availableAgents={availableAgents} />}
                </div>
            </div>

            {isSendToBoardOpen && selectedChat && <SendToBoardModal onClose={() => setIsSendToBoardOpen(false)} chat={selectedChat} />}
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-[#BE7EC7]/30 border-t-[#BE7EC7] rounded-full animate-spin"></div>
                    <div className="text-[#BE7EC7] text-sm font-medium">Loading Telegram Chats...</div>
                </div>
            </div>
        }>
            <ChatPageContent />
        </Suspense>
    );
}