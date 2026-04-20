"use client";
import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, X, ChevronDown, Check, Bot, Sparkles, User } from "lucide-react";

export default function AiAssistantPanel({ onClose }) {

    // ================= STATES =================
    const [agentsList, setAgentsList] = useState([]); // เก็บรายชื่อ Agent จาก DB
    const [activeAgent, setActiveAgent] = useState({
        id: 'default',
        name: 'กำลังโหลด...',
        emoji: '✨',
        role: 'AI Assistant',
        greeting: 'กำลังเชื่อมต่อระบบ...'
    });
  
    const [showModelSelect, setShowModelSelect] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const dropdownRef = useRef(null);

    // ================= EFFECTS =================
    // 1. เลื่อนแชทลงล่างสุดเสมอ
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // 2. ปิด Dropdown เมื่อคลิกที่อื่น
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowModelSelect(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 3. ดึงข้อมูล Agent ที่เปิดใช้งานแล้วจาก DB
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await fetch('/api/Ai/agents');
                const data = await res.json();
                if (Array.isArray(data)) {
                    // กรองเอาเฉพาะตัวที่ Published แล้ว
                    const publishedAgents = data.filter(agent => agent.is_published);
                    
                    if (publishedAgents.length > 0) {
                        setAgentsList(publishedAgents);
                        setActiveAgent(publishedAgents[0]); // ตั้งค่าตัวแรกเป็น Default
                        
                        // ทักทายด้วยข้อความของตัวแรก
                        setMessages([{ 
                            id: Date.now(), 
                            role: "ai", 
                            text: publishedAgents[0].greeting || `สวัสดีค่ะ ฉันคือ ${publishedAgents[0].name} มีอะไรให้ช่วยไหมคะ? ${publishedAgents[0].emoji}` 
                        }]);
                    } else {
                        // ถ้าไม่มีบอทเปิดใช้งานเลย
                        setActiveAgent({ id: 'none', name: 'Talka Assistant', emoji: '🤖', role: 'System' });
                        setMessages([{ id: 1, role: "ai", text: "ยังไม่มี AI Agent ที่เปิดใช้งานในระบบค่ะ กรุณาสร้างและเผยแพร่ Agent ก่อนนะคะ" }]);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch agents:", error);
            }
        };
        fetchAgents();
    }, []);

    // ================= HANDLERS =================
    // 1. เปลี่ยน Agent
    const handleSelectAgent = (agent) => {
        setActiveAgent(agent);
        setShowModelSelect(false);
        setMessages(prev => [
            ...prev, 
            { 
                id: Date.now(), 
                role: "ai", 
                text: `[ระบบ]: สลับผู้ช่วยเป็น ${agent.emoji} ${agent.name} เรียบร้อยแล้วค่ะ\n\n${agent.greeting || ''}` 
            }
        ]);
    };

    // 2. ส่งข้อความแชท
    const handleSend = async () => {
        if (!input.trim() || activeAgent.id === 'none') return;
    
        const userMsgText = input;
        setMessages((prev) => [...prev, { id: Date.now(), role: "user", text: userMsgText }]);
        setInput("");
        setIsLoading(true);

        try {
            // 🎯 ประกอบร่างคำสั่ง (Prompt) ของ Agent ตัวที่เลือกอยู่
            let finalSystemPrompt = `[CORE INSTRUCTIONS]\n${activeAgent.instructions || 'ตอบคำถามด้วยความสุภาพ'}\n\n[TONE OF VOICE]\nMaintain a ${activeAgent.tone || 'professional'} tone.\n\n[STRICT GUARDRAILS]\n${activeAgent.guardrails || ''}`;
            
            if (activeAgent.lead_gen?.enabled) {
                finalSystemPrompt += `\n\n[ACTION: LEAD GENERATION]\n${activeAgent.lead_gen.prompt}`;
            }
            if (activeAgent.handover?.enabled) {
                finalSystemPrompt += `\n\n[FALLBACK]\nIf unsure, reply exactly: "${activeAgent.handover.fallbackMsg}"`;
            }

            // 🎯 ยิงไป API ของ AI
            const response = await fetch('/api/Ai/agent-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMsgText, 
                    system_prompt_override: finalSystemPrompt 
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: data.reply }]);
            } else {
                setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: "⚠️ ขออภัยค่ะ ระบบ AI ขัดข้องชั่วคราว" }]);
            }
        } catch (error) {
            setMessages((prev) => [...prev, { id: Date.now() + 1, role: "ai", text: "⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e) => { if (e.key === "Enter") handleSend(); };

    // ================= RENDER =================
    return (
        <div className="w-[340px] h-[550px] max-h-[80vh] bg-[#1a1423] border border-[#BE7EC7]/20 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden absolute bottom-24 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Header: Model Selector */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02] relative z-20">
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setShowModelSelect(!showModelSelect)}
                        className="flex items-center gap-3 hover:bg-white/5 p-1.5 pr-3 rounded-2xl transition-all group border border-transparent hover:border-white/10"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BE7EC7] to-[#8a55b5] flex items-center justify-center shadow-lg text-xl border border-white/10">
                            {activeAgent.emoji}
                        </div>
                        <div className="text-left">
                            <h3 className="text-white font-bold text-sm flex items-center gap-1.5 max-w-[150px] truncate">
                                {activeAgent.name}
                                <ChevronDown size={14} className={`text-[#BE7EC7] shrink-0 transition-transform duration-300 ${showModelSelect ? 'rotate-180' : ''}`}/>
                            </h3>
                            <p className="text-[#BE7EC7] text-[10px] font-semibold uppercase tracking-widest opacity-70">AI Agent</p>
                        </div>
                    </button>

                    {/* Agent Dropdown */}
                    {showModelSelect && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-[#1E1B29] border border-[#BE7EC7]/20 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in zoom-in-95 duration-200">
                            <div className="p-3 bg-white/5 border-b border-white/5">
                                <span className="text-[10px] text-white/40 uppercase font-black tracking-[0.15em] ml-1">AI Personalities</span>
                            </div>
                            <div className="max-h-[280px] overflow-y-auto custom-scrollbar p-1.5">
                                {agentsList.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-white/40">No active agents found.</div>
                                ) : (
                                    agentsList.map((agent) => (
                                        <button
                                            key={agent.id}
                                            onClick={() => handleSelectAgent(agent)}
                                            className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 mb-1
                                                ${activeAgent.id === agent.id ? 'bg-[#BE7EC7]/20 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                                            `}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 ${activeAgent.id === agent.id ? 'bg-[#BE7EC7]' : 'bg-white/5'}`}>
                                                {agent.emoji}
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <span className="font-bold text-xs truncate">{agent.name}</span>
                                                <span className="text-[9px] opacity-60 truncate font-medium">AI Agent</span>
                                            </div>
                                            {activeAgent.id === agent.id && <Check size={14} className="text-[#BE7EC7] shrink-0" strokeWidth={3} />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={onClose} 
                    className="w-8 h-8 flex items-center justify-center shrink-0 rounded-xl bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-[#120F18]/50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border shadow-sm mt-0.5
                            ${msg.role === "user" 
                                ? "bg-white/10 border-white/10" 
                                : "bg-[#BE7EC7]/10 border-[#BE7EC7]/20 text-sm"
                            }`}
                        >
                            {msg.role === "user" ? <User size={14} className="text-white/70" /> : (activeAgent.emoji || <Bot size={14}/>)}
                        </div>

                        <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all whitespace-pre-wrap
                            ${msg.role === "user"
                                ? "bg-[#BE7EC7] text-white rounded-tr-none shadow-[#BE7EC7]/10"
                                : "bg-white/[0.03] text-white/90 border border-white/5 rounded-tl-none"
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg shrink-0 bg-[#BE7EC7]/10 border border-[#BE7EC7]/20 flex items-center justify-center text-sm">
                            {activeAgent.emoji}
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none">
                            <span className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 bg-[#BE7EC7] rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-[#BE7EC7] rounded-full animate-bounce delay-100"></span>
                                <span className="w-1.5 h-1.5 bg-[#BE7EC7] rounded-full animate-bounce delay-200"></span>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5">
                <div className="flex items-center gap-2 bg-[#120F18] rounded-2xl px-3 py-1.5 border border-white/5 focus-within:border-[#BE7EC7]/50 transition-all shadow-inner">
                    <input
                        type="text"
                        className="flex-1 bg-transparent outline-none text-white text-sm py-2 placeholder:text-white/20 disabled:opacity-50"
                        placeholder={`Message ${activeAgent.name}...`}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={activeAgent.id === 'none'}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading || activeAgent.id === 'none'}
                        className="w-8 h-8 flex items-center justify-center shrink-0 rounded-xl bg-[#BE7EC7] text-white hover:bg-[#a66bb0] disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-[#BE7EC7]/20"
                    >
                        <SendHorizontal size={14} />
                    </button>
                </div>
                <p className="text-[9px] text-white/20 text-center mt-3 font-medium tracking-wider uppercase">AI can make mistakes. Verify important info.</p>
            </div>
            
            <style jsx global>{`
              .custom-scrollbar::-webkit-scrollbar { width: 3px; }
              .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
              .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
}