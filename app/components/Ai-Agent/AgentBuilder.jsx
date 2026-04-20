"use client";
import { useState, useRef, useEffect } from "react";
import { 
    ChevronLeft, Sparkles, CheckCircle2, CloudUpload, Bot, Database, 
    SendHorizontal, Wand2, Waypoints, FileText, Trash2, FileUp, 
    ShieldAlert, MessageSquare, SlidersHorizontal, Zap, UserPlus, X 
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

function ToggleCircle({ enabled, setEnabled }) {
  return (
    <div 
        onClick={() => setEnabled(!enabled)} 
        className={`w-12 h-6 flex items-center rounded-full cursor-pointer transition-all duration-500 ${enabled ? "bg-[#BE7EC7] shadow-[0_0_15px_rgba(190,126,199,0.4)]" : "bg-white/10"}`}
    >
      <div className={`w-4 h-4 bg-white rounded-full shadow-lg transform transition-transform duration-500 ${enabled ? "translate-x-7" : "translate-x-1"}`} />
    </div>
  );
}

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button 
        onClick={onClick} 
        className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 cursor-pointer mb-1 ${
            active 
            ? 'bg-[#BE7EC7]/10 text-[#BE7EC7] border border-[#BE7EC7]/20 shadow-[inset_0_0_10px_rgba(190,126,199,0.1)]' 
            : 'text-white/30 hover:bg-white/5 hover:text-white border border-transparent'
        }`}
    >
      <Icon size={18} className={active ? "text-[#BE7EC7]" : "text-white/30"} />
      <span className="text-xs uppercase tracking-[0.15em]">{label}</span>
    </button>
  );
}

export default function AgentBuilder({ onBack, initialData, onSaveSuccess }) {
  const [isPublished, setIsPublished] = useState(initialData?.is_published || false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  // State Management (เหมือนเดิม)
  const [agentId, setAgentId] = useState(initialData?.id || null);
  const [agentName, setAgentName] = useState(initialData?.name || "Talka Assistant");
  const [agentEmoji, setAgentEmoji] = useState(initialData?.emoji || "🤖");
  const [showEmoji, setShowEmoji] = useState(false);
  const [greetingMsg, setGreetingMsg] = useState(initialData?.greeting || "สวัสดีค่ะ 👋 มีอะไรให้ฉันช่วยเหลือไหมคะ?");
  const [agentPrompt, setAgentPrompt] = useState(initialData?.instructions || `คุณคือผู้ช่วย AI ของบริษัท หน้าที่หลักคือการตอบคำถาม\nจงตอบอย่างกระชับ เข้าใจง่าย และเป็นมิตร`);
  const [tone, setTone] = useState(initialData?.tone || "professional");
  const [guardrails, setGuardrails] = useState(initialData?.guardrails || `- ห้ามให้คำแนะนำทางการแพทย์หรือกฎหมาย\n- ห้ามพูดถึงบริษัทคู่แข่ง`);
  const [leadGenEnabled, setLeadGenEnabled] = useState(initialData?.lead_gen?.enabled ?? true);
  const [leadGenPrompt, setLeadGenPrompt] = useState(initialData?.lead_gen?.prompt || "หากลูกค้าต้องการติดต่อฝ่ายขาย ให้คุณขอ ชื่อ และ เบอร์โทรศัพท์ ก่อนเสมอ");
  const [handoverEnabled, setHandoverEnabled] = useState(initialData?.handover?.enabled ?? true);
  const [fallbackMsg, setFallbackMsg] = useState(initialData?.handover?.fallbackMsg || "ขออภัยค่ะ เดี๋ยวแอดมินจะรีบเข้ามาดูแลต่อนะคะ 🙏");

  // Files & Chat Logic (เหมือนเดิม)
  const [files, setFiles] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([{ role: "bot", content: greetingMsg }]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const payload = { 
        id: agentId, name: agentName, emoji: agentEmoji, greetingMsg, 
        instructions: agentPrompt, tone, guardrails, 
        leadGen: { enabled: leadGenEnabled, prompt: leadGenPrompt }, 
        handover: { enabled: handoverEnabled, fallbackMsg }, 
        isPublished: true 
      };
      const res = await fetch('/api/Ai/publish', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (res.ok) {
        setIsPublished(true); 
        if(data.agent?.id) setAgentId(data.agent.id);
        if(onSaveSuccess) onSaveSuccess();
      }
    } catch (e) { console.error(e); } finally { setIsSaving(false); }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;
    const userMsg = chatInput; 
    setMessages(p => [...p, { role: "user", content: userMsg }]); 
    setChatInput(""); 
    setIsTyping(true);
    try {
      let finalSys = `[CORE INSTRUCTIONS]\n${agentPrompt}\n\n[TONE OF VOICE]\nMaintain a ${tone} tone.\n\n[STRICT GUARDRAILS]\n${guardrails}`;
      const res = await fetch('/api/Ai/agent-chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ message: userMsg, system_prompt_override: finalSys }) 
      });
      const data = await res.json();
      setMessages(p => [...p, { role: "bot", content: data.reply || "⚠️ AI Error" }]);
    } catch (e) { setMessages(p => [...p, { role: "bot", content: "⚠️ Connection Failed" }]); } finally { setIsTyping(false); }
  };

  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-3 ml-1";
  const inputClass = "w-full bg-white/[0.03] border border-white/10 focus:border-[#BE7EC7]/50 focus:bg-white/[0.08] outline-none rounded-2xl py-4 px-5 text-white text-sm transition-all duration-300 placeholder:text-white/10 shadow-inner";

  return (
    <div className="flex flex-col w-full h-full min-h-[94vh] bg-[#161223] text-white overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative">
      
      {/* 🔮 Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#BE7EC7]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="h-24 flex justify-between items-center px-10 bg-[#120F1D]/50 border-b border-white/10 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group cursor-pointer">
            <ChevronLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#BE7EC7] rounded-2xl flex items-center justify-center shadow-[0_8px_25px_rgba(190,126,199,0.4)]">
                <Bot size={24} className="text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Agent Builder</h1>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mt-1">Configure your AI Employee</p>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={handlePublish} 
            disabled={isSaving} 
            className={`px-10 py-3.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all cursor-pointer transform active:scale-95 ${
                isPublished 
                ? "bg-emerald-500/10 border border-emerald-500 text-emerald-500" 
                : "bg-[#BE7EC7] text-white shadow-lg shadow-[#BE7EC7]/30 hover:bg-[#a66bb0]"
            }`}
          >
            {isSaving ? "Saving..." : isPublished ? <><CheckCircle2 size={18} /> Published</> : <><CloudUpload size={18} /> Publish to Live</>}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Navigation Sidebar */}
        <aside className="w-[280px] bg-[#120F1D]/30 border-r border-white/10 p-6 flex flex-col gap-2 shrink-0">
           <p className={labelClass}>Configuration</p>
           <TabButton active={activeTab === "general"} icon={SlidersHorizontal} label="Identity" onClick={() => setActiveTab("general")} />
           <TabButton active={activeTab === "behavior"} icon={Zap} label="Behavior" onClick={() => setActiveTab("behavior")} />
           <TabButton active={activeTab === "knowledge"} icon={Database} label="Knowledge" onClick={() => setActiveTab("knowledge")} />
           <TabButton active={activeTab === "actions"} icon={Waypoints} label="Capabilities" onClick={() => setActiveTab("actions")} />
        </aside>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent p-12">
          <div className="max-w-3xl mx-auto space-y-10">
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#1F192E]/50 rounded-[2.5rem] p-10 border border-white/5 shadow-xl">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3"><Sparkles size={22} className="text-[#BE7EC7]"/> Agent Identity</h3>
                  <div className="flex gap-10 items-center">
                    <div className="relative">
                      <button onClick={() => setShowEmoji(!showEmoji)} className="w-28 h-28 bg-white/5 hover:bg-white/10 hover:border-[#BE7EC7]/50 rounded-[2rem] flex items-center justify-center text-5xl border border-white/5 shadow-inner transition-all cursor-pointer">{agentEmoji}</button>
                      {showEmoji && <div className="absolute top-32 left-0 z-50 shadow-2xl animate-in zoom-in-95"><EmojiPicker theme="dark" onEmojiClick={(e) => { setAgentEmoji(e.emoji); setShowEmoji(false); }} /></div>}
                    </div>
                    <div className="flex-1">
                      <label className={labelClass}>Agent Display Name</label>
                      <input type="text" value={agentName} onChange={(e) => setAgentName(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
                <div className="bg-[#1F192E]/50 rounded-[2.5rem] p-10 border border-white/5 shadow-xl">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3"><MessageSquare size={22} className="text-[#BE7EC7]"/> Welcome Message</h3>
                  <textarea value={greetingMsg} onChange={(e) => setGreetingMsg(e.target.value)} className={`${inputClass} h-32 resize-none`} />
                </div>
              </div>
            )}

            {activeTab === "behavior" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#1F192E]/50 rounded-[2.5rem] p-10 border border-white/5 shadow-xl">
                  <div className="flex justify-between items-center mb-8">
                     <h3 className="text-xl font-bold flex items-center gap-3"><Bot size={22} className="text-[#BE7EC7]"/> Persona & Rules</h3>
                     <select value={tone} onChange={(e) => setTone(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none text-[#BE7EC7] cursor-pointer">
                        <option value="professional">Professional</option>
                        <option value="friendly">Friendly</option>
                     </select>
                  </div>
                  <textarea value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} className={`${inputClass} h-80 font-mono text-xs leading-relaxed`} />
                </div>
                <div className="bg-red-500/5 rounded-[2.5rem] p-10 border border-red-500/20 shadow-xl">
                  <h3 className="text-xl font-bold text-red-400 mb-8 flex items-center gap-3"><ShieldAlert size={22}/> Strict Guardrails</h3>
                  <textarea value={guardrails} onChange={(e) => setGuardrails(e.target.value)} className={`${inputClass} !bg-black/20 border-red-500/10 h-32 font-mono text-red-200/60`} />
                </div>
              </div>
            )}

            {activeTab === "knowledge" && (
                <div className="bg-[#1F192E]/50 rounded-[2.5rem] p-10 border border-white/5 shadow-xl animate-in fade-in duration-500">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3"><Database size={22} className="text-[#BE7EC7]"/> Knowledge Base</h3>
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-[2rem] p-12 flex flex-col items-center justify-center hover:bg-white/5 hover:border-[#BE7EC7]/50 transition-all cursor-pointer group">
                        <FileUp size={40} className="text-white/20 mb-4 group-hover:text-[#BE7EC7] transition-colors" />
                        <p className="text-sm font-bold text-white/40 group-hover:text-white transition-colors">Drag and drop documents here</p>
                        <p className="text-[10px] text-white/20 mt-2 uppercase tracking-widest">Supports PDF, TXT, DOCX</p>
                    </div>
                </div>
            )}

            {activeTab === "actions" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-[#1F192E]/50 rounded-[2.5rem] p-10 border border-white/5 shadow-xl border-l-4 border-l-emerald-500">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><UserPlus size={24}/></div>
                        <div>
                            <h4 className="font-bold text-lg">Lead Generation</h4>
                            <p className="text-white/30 text-xs">Collect customer information automatically</p>
                        </div>
                    </div>
                    <ToggleCircle enabled={leadGenEnabled} setEnabled={setLeadGenEnabled} />
                  </div>
                  {leadGenEnabled && <textarea value={leadGenPrompt} onChange={(e) => setLeadGenPrompt(e.target.value)} className={`${inputClass} !bg-black/20 h-24 font-mono text-emerald-200/50`} />}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Test Column (Chat) */}
        <div className="w-[450px] bg-[#120F1D]/50 border-l border-white/10 flex flex-col z-20 shrink-0 backdrop-blur-xl">
          <div className="p-8 border-b border-white/10 flex justify-between items-center bg-[#120F1D]/30">
            <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isPublished ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : 'bg-white/10'}`} />
                <h4 className="font-black text-xs uppercase tracking-[0.2em]">Simulator</h4>
            </div>
            <button onClick={() => setMessages([{role: "bot", content: greetingMsg}])} className="text-[10px] font-black text-white/20 hover:text-[#BE7EC7] transition-colors cursor-pointer uppercase tracking-widest">Clear Chat</button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-5 py-4 rounded-[2rem] text-sm leading-relaxed shadow-lg ${
                        msg.role === "user" 
                        ? "bg-[#BE7EC7] text-white rounded-tr-none" 
                        : "bg-[#1F192E] border border-white/5 text-white/90 rounded-tl-none"
                    }`}>
                        {msg.content}
                    </div>
                </div>
            ))}
            {isTyping && (
                <div className="bg-[#1F192E] w-fit px-5 py-4 rounded-[1.5rem] flex gap-2 shadow-md">
                    <div className="w-1.5 h-1.5 bg-[#BE7EC7] rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-[#BE7EC7] rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-[#BE7EC7] rounded-full animate-bounce delay-200" />
                </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-8 bg-[#120F1D]/30 border-t border-white/10">
            <div className="relative flex items-center group">
                <input 
                    type="text" 
                    placeholder={isPublished ? "Type to test AI..." : "Publish to start testing"} 
                    disabled={!isPublished} 
                    value={chatInput} 
                    onChange={(e) => setChatInput(e.target.value)} 
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} 
                    className={`${inputClass} !rounded-full pr-16`} 
                />
                <button 
                    onClick={handleSendMessage} 
                    disabled={!chatInput.trim() || isTyping || !isPublished} 
                    className="absolute right-2 w-11 h-11 bg-[#BE7EC7] hover:bg-[#a66bb0] disabled:bg-white/5 disabled:text-white/10 text-white rounded-full transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-[#BE7EC7]/20"
                >
                    <SendHorizontal size={20} />
                </button>
            </div>
            <p className="text-[9px] text-center text-white/10 mt-6 uppercase font-black tracking-[0.3em]">Talka Intelligence Engine v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}