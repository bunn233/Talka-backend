"use client";
import React, { useRef, useState, useEffect } from "react";
import { Tooltip } from 'react-tooltip';
import Picker from "emoji-picker-react";

export default function ChatMessage({ chat, availableAgents, onSelectAiAgent, aiPrompts = [], currentUser, onSendMessage, availableTags = [] }) {
    if (!chat) {
        return (
            <div className="flex-1 flex justify-center items-center text-white/60 text-lg">
                เลือกแชททางซ้ายเพื่อดูข้อความ
            </div>
        );
    }

    const textareaRef = useRef(null);
    const [height, setHeight] = useState(100);

    const [messages, setMessages] = useState([]);

    const [showAiPrompts, setShowAiPrompts] = useState(false);
    const dropdownRef = useRef(null);

    const [showAiModelSelect, setShowAiModelSelect] = useState(false);
    const aiModelDropdownRef = useRef(null);

    const editorRef = useRef(null);
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // ✅ โหลด message จาก DB
    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/messages?chat_session_id=${chat.id}`);
            const data = await res.json();

            const mapped = data.map((msg) => ({
                text: msg.content,
                from: msg.sender_type === "ADMIN" ? "me" : "user",
                time: new Date(msg.created_at).toLocaleTimeString(),
            }));

            setMessages(mapped);

        } catch (err) {
            console.error("โหลดข้อความ error:", err);
        }
    };

    useEffect(() => {
        if (!chat?.id) return;
        fetchMessages();
    }, [chat?.id]);

    // ✅ auto refresh (polling)
    useEffect(() => {
        if (!chat?.id) return;

        const interval = setInterval(() => {
            fetchMessages();
        }, 3000);

        return () => clearInterval(interval);
    }, [chat?.id]);

    const handleSelectPrompt = (promptObject) => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
        setShowAiPrompts(false);
    };

    // ✅ ส่งข้อความ → API + Prisma
    const handleSendClick = async () => {
        const text = textareaRef.current.value;

        if (text.trim() !== "") {
            try {
                await fetch("/api/messages", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        chat_session_id: chat.id,
                        sender_type: "ADMIN",
                        sender_id: currentUser?.id,
                        message_type: "TEXT",
                        content: text,
                    }),
                });

                // optional: push ไป LINE
                await fetch("/api/line/push", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        chat_session_id: chat.id,
                        message: text,
                    }),
                });

                fetchMessages();

            } catch (err) {
                console.error("send message error:", err);
            }

            textareaRef.current.value = "";
            textareaRef.current.focus();
            setHeight(100);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendClick();
        }
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.value = "";
            setHeight(100);
        }
    }, [chat?.id]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowAiPrompts(false);
            }
            if (aiModelDropdownRef.current && !aiModelDropdownRef.current.contains(event.target)) {
                setShowAiModelSelect(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMouseDown = (e) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = textareaRef.current.offsetHeight;

        const onMouseMove = (e) => {
            const delta = startY - e.clientY;
            const newHeight = Math.max(50, startHeight + delta);
            setHeight(newHeight);
        };

        const onMouseUp = () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    const handleAttachClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles((prev) => [...prev, ...selectedFiles]);
        event.target.value = "";
    };

    const handleRemoveFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const onEmojiClick = (emojiData) => {
        const editor = textareaRef.current;
        if (!editor) return;
        const startPos = editor.selectionStart;
        const endPos = editor.selectionEnd;
        const text = editor.value;
        editor.value = text.substring(0, startPos) + emojiData.emoji + text.substring(endPos);
        editor.selectionStart = editor.selectionEnd = startPos + emojiData.emoji.length;
        editor.focus();
    };

    return (
        <div className="flex-1 min-w-0 h-[85vh] bg-[rgba(32,41,59,0.37)] border border-[rgba(254,253,253,0.5)] backdrop-blur-xl rounded-3xl shadow-2xl p-5 mt-3 ml-3 flex flex-col">

            {/* --- Header --- */}
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between border-b border-white/20 pb-3 mb-3 gap-3 relative">
                {/* (ส่วน Header เหมือนเดิม) */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 shrink-0">
                        {chat.imgUrl ? (
                            <img
                                src={chat.imgUrl}
                                alt={chat.name}
                                className="w-full h-full rounded-full object-cover shadow-sm bg-gray-700"
                            />
                        ) : (
                            <div className="w-full h-full bg-linear-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-2xl shadow-lg">
                                {chat.avatar}
                            </div>
                        )}

                        {chat.channel && (
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow-sm ${chat.channel === 'Facebook' ? 'bg-[#1877F2]' : chat.channel === 'Line' ? 'bg-[#06C755]' : 'bg-gray-500'}`}>
                                {chat.channel === 'Facebook' && <i className="fa-brands fa-facebook-f"></i>}
                                {chat.channel === 'Line' && <i className="fa-brands fa-line"></i>}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-white font-semibold text-lg whitespace-nowrap truncate">{chat.name}</h2>
                            {chat.status && (
                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${chat.status === 'Closed' ? 'border-white/10 bg-white/5 text-white/30' : 'border-white/30 bg-white/10 text-white/90'}`}>
                                    {chat.status}
                                </span>
                            )}
                            {(() => {
                                let tagsArray = [];
                                if (Array.isArray(chat.tags)) {
                                    tagsArray = chat.tags;
                                } else if (chat.tags) {
                                    tagsArray = [chat.tags];
                                }

                                return tagsArray.map((tagName, idx) => {
                                    const tagInfo = availableTags.find(t => t.name === tagName);
                                    const color = tagInfo ? tagInfo.color : '#666';
                                    const emoji = tagInfo ? tagInfo.emoji : '';

                                    return (
                                        <span
                                            key={idx}
                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 text-white shadow-sm border border-white/10 flex items-center gap-1"
                                            style={{ backgroundColor: color }}
                                        >
                                            {emoji && <span>{emoji}</span>}
                                            {tagName}
                                        </span>
                                    );
                                });
                            })()}
                        </div>
                        <span className="text-white/60 text-xs block mt-0.5">
                            Open : {chat.openTime || chat.time}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0 relative" ref={aiModelDropdownRef}>
                    <button
                        onClick={() => setShowAiModelSelect(!showAiModelSelect)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all shadow-lg border border-white/10 whitespace-nowrap ${chat.isAiMode ? 'bg-linear-to-r from-emerald-500 to-green-600 text-white shadow-green-500/30' : 'bg-[rgba(32,41,59,0.25)] border-[rgba(254,253,253,0.5)] hover:bg-white/10 hover:scale-105 text-white/80'}`}
                    >
                        {chat.activeAiAgent ? (
                            <>
                                <span className="text-lg">{chat.activeAiAgent.emoji}</span>
                                <span className="text-sm font-semibold hidden sm:inline">{chat.activeAiAgent.name}</span>
                            </>
                        ) : (
                            <><i className="fa-solid fa-robot"></i><span className="text-sm font-semibold hidden sm:inline">Select AI</span></>
                        )}
                        <i className={`fa-solid fa-chevron-down text-xs ml-1 transition-transform ${showAiModelSelect ? 'rotate-180' : ''}`}></i>
                    </button>

                    {showAiModelSelect && (
                        <div className="absolute right-0 top-full mt-2 w-60 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up">
                            <div className="p-2 bg-white/5 border-b border-white/5">
                                <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider ml-2">Available Models</span>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {availableAgents.map((agent) => (
                                    <button key={agent.id} onClick={() => { onSelectAiAgent(chat.id, agent); setShowAiModelSelect(false); }} className={`w-full text-left px-4 py-3 text-sm hover:bg-white/10 transition-colors border-b border-white/5 flex items-center gap-3 ${chat.activeAiAgent?.id === agent.id ? 'bg-white/10 text-white' : 'text-white/70'}`}>
                                        <span className="text-xl">{agent.emoji}</span>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{agent.name}</span>
                                            <span className="text-[10px] text-white/40">{agent.role}</span>
                                        </div>
                                        {chat.activeAiAgent?.id === agent.id && <i className="fa-solid fa-check ml-auto text-green-400"></i>}
                                    </button>
                                ))}
                            </div>
                            {chat.isAiMode && (
                                <button onClick={() => { onSelectAiAgent(chat.id, null); setShowAiModelSelect(false); }} className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-sm transition-colors font-semibold border-t border-white/10 flex items-center gap-2">
                                    <i className="fa-solid fa-power-off"></i> Stop AI Auto-Reply
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-auto space-y-4 text-white/90 custom-scrollbar pr-2 py-4 flex flex-col">
                {messages.length > 0 ? (
                    messages.map((msg, index) => {
                        const isMe = msg.from === 'me';
                        return (
                            <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center gap-2 mb-1 text-xs ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <span className="text-white/60 font-semibold">{isMe ? (currentUser?.name || "Admin") : chat.name}</span>
                                    <span className="text-white/30 text-[10px]">{msg.time || ""}</span>
                                </div>
                                <div className={`px-4 py-3 rounded-2xl max-w-[80%] wrap-break-words shadow-sm text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white/10 text-white/90 rounded-tl-none border border-white/5'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="self-center text-white/30 text-sm italic mt-10">Start a new conversation</div>
                )}
            </div>

            {/* Input Area (เหมือนเดิม) */}
            <div className="mt-4 bg-[rgba(32,41,59,0.25)] relative group p-4 rounded-2xl shadow-2xs">
                <div className="input-field max-h-[300px]">
                    <textarea
                        ref={textareaRef}
                        onKeyDown={handleKeyDown}
                        style={{ height }}
                        disabled={chat.isAiMode}
                        className="w-full border rounded p-2 resize-none max-h-[300px] bg-transparent text-white border-none outline-none disabled:cursor-not-allowed"
                        placeholder={chat.isAiMode ? "AI is replying automatically..." : "Type a message..."}
                    />
                    <div onMouseDown={handleMouseDown} className="absolute top-1.5 left-1/2 -translate-x-1/2 w-15 h-1 bg-white/20 rounded-full cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="function-field flex justify-between mt-2 border-t border-white/10 pt-2">
                    <div className="left-funtion flex gap-1">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowAiPrompts(!showAiPrompts)}
                                data-tooltip-id="attach-tooltip"
                                data-tooltip-content="AI Prompt"
                                className={`text-[18px] p-2 transition rounded-lg hover:bg-white/10 ${showAiPrompts ? 'text-purple-400 bg-white/10' : 'text-white/70 hover:text-white'}`}
                            >
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                            </button>

                            {showAiPrompts && (
                                <div className="absolute bottom-full left-0 mb-3 w-72 bg-[#1e1e2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in-up origin-bottom-left">
                                    <div className="p-2 bg-white/5 border-b border-white/5">
                                        <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider ml-2">Select prompt</span>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                        {aiPrompts.length > 0 ? (
                                            aiPrompts.map((prompt) => (
                                                <button key={prompt.id} onClick={() => handleSelectPrompt(prompt)} className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 group">
                                                    <div className="text-white/90 text-sm font-medium group-hover:text-white">{prompt.name}</div>
                                                    <div className="text-white/50 text-xs truncate group-hover:text-white/70">{prompt.action}</div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 text-center text-white/40 text-xs italic">No active prompts.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-white/70 hover:text-white text-[18px] p-2 transition rounded-lg hover:bg-white/10"><i className="fa-solid fa-icons"></i></button>
                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-0 mb-2 z-50"><Picker onEmojiClick={onEmojiClick} /></div>
                            )}
                        </div>
                        <button onClick={handleAttachClick} className="text-white/70 hover:text-white text-[18px] p-2 transition rounded-lg hover:bg-white/10"><i className="fa-solid fa-paperclip"></i></button>
                        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
                    </div>
                    <div className="right-function">
                        <button
                            onClick={handleSendClick}
                            data-tooltip-id="attach-tooltip"
                            data-tooltip-content="ส่งข้อความ"
                            className="text-white text-[20px] px-3 py-2 transition hover:text-blue-400"
                        >
                            <i className="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                {files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {files.map((file, index) => (
                            <span key={index} className="flex items-center bg-white/10 text-white px-3 py-1 rounded-lg text-xs border border-white/10">
                                <span className="truncate max-w-[100px]">{file.name}</span>
                                <button onClick={() => handleRemoveFile(index)} className="ml-2 text-red-400 hover:text-red-300">✕</button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <Tooltip id="attach-tooltip" place="top" className="z-50" />
        </div>
    );
}