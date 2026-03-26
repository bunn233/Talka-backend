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
    const [messages, setMessages] = useState(chat?.messages || []);
    const messagesEndRef = useRef(null);

    const [showAiPrompts, setShowAiPrompts] = useState(false);
    const dropdownRef = useRef(null);

    const [showAiModelSelect, setShowAiModelSelect] = useState(false);
    const aiModelDropdownRef = useRef(null);

    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // ✅ ใช้ chat.messages จาก props แทนการ fetch
    useEffect(() => {
        if (chat?.messages) {
            setMessages(chat.messages);
        }
    }, [chat?.messages, chat?.id]);

    // 🟢 Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // =========================
    // 🔥 SEND MESSAGE
    // =========================
    const handleSendClick = async () => {
        const text = textareaRef.current?.value;

        if (!text?.trim()) return;

        // ✅ Clear input immediately
        textareaRef.current.value = "";
        setHeight(100);

        // ✅ Call parent handler
        if (onSendMessage) {
            await onSendMessage(chat.id, text);
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
        <div className="flex-1 min-w-0 h-full bg-linear-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/50 backdrop-blur-sm rounded-2xl shadow-lg p-5 flex flex-col overflow-hidden">

            {/* --- Header --- */}
            <div className="shrink-0 flex items-center justify-between border-b border-gray-700/50 pb-4 mb-4 gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative w-12 h-12 shrink-0">
                        {chat?.imgUrl ? (
                            <img src={chat.imgUrl} alt={chat?.name} className="w-full h-full rounded-full object-cover shadow-sm bg-gray-700" />
                        ) : (
                            <div className="w-full h-full bg-linear-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-2xl shadow-lg font-bold text-white">
                                {chat?.avatar || "?"}
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className="text-white font-semibold text-lg truncate">{chat?.name}</h2>
                        <span className="text-gray-400 text-xs">Status: {chat?.status}</span>
                    </div>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 text-white/90 pr-2 mb-4 flex flex-col">
                {messages && messages.length > 0 ? (
                    messages.map((msg, index) => {
                        const isMe = msg.from === 'me' || msg.from === 'AGENT';
                        return (
                            <div key={index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className={`text-xs mb-1 ${isMe ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>
                                    {msg.time}
                                </span>
                                <div className={`px-4 py-3 rounded-2xl max-w-[70%] text-sm wrap-break-words ${
                                    isMe 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-gray-700/60 text-white rounded-bl-none'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No messages yet
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 border-t border-gray-700/50 pt-4">
                <textarea
                    ref={textareaRef}
                    onKeyDown={handleKeyDown}
                    style={{ height: `${Math.min(height, 150)}px` }}
                    className="w-full p-3 bg-gray-800/50 text-white placeholder-gray-500 rounded-lg border border-gray-700/50 focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Type a message..."
                />

                <div className="flex gap-2 mt-3">
                    <button 
                        onClick={handleSendClick}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Send
                    </button>
                </div>
            </div>

            <Tooltip id="attach-tooltip" />
        </div>
    );
}