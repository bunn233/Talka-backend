"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Sparkles, CheckCircle2, CloudUpload, Bot, Database, SendHorizontal, Wand2, Waypoints, FileText, Trash2, FileUp, ShieldAlert, MessageSquare, SlidersHorizontal, Zap, UserPlus } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

function ToggleCircle({ enabled, setEnabled }) {
  return (
    <div onClick={() => setEnabled(!enabled)} className={`w-11 h-6 flex items-center rounded-full cursor-pointer transition-all duration-300 ${enabled ? "bg-purple-600 shadow-[0_0_12px_rgba(147,51,234,0.5)]" : "bg-[#1E1A2D]"}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${enabled ? "translate-x-6" : "translate-x-1"}`} />
    </div>
  );
}
function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 cursor-pointer ${active ? 'bg-[#1E1A2D] text-purple-400 shadow-inner border border-white/5' : 'text-white/40 hover:bg-white/5 hover:text-white border border-transparent'}`}>
      <Icon size={18} className={active ? "text-purple-400" : "text-white/40"} />
      <span className="text-sm tracking-wide">{label}</span>
    </button>
  );
}

export default function AgentBuilder({ onBack, initialData, onSaveSuccess }) {
  const [isPublished, setIsPublished] = useState(initialData?.is_published || false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

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

  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const formatFileSize = (b) => { if(b===0)return '0 B'; const k=1024,s=['B','KB','MB','GB'],i=Math.floor(Math.log(b)/Math.log(k)); return parseFloat((b/Math.pow(k,i)).toFixed(2))+' '+s[i];};
  const handleFileSelect = (e) => { if(e.target.files?.length>0) processFiles(Array.from(e.target.files)); };
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); if(e.dataTransfer.files?.length>0) processFiles(Array.from(e.dataTransfer.files)); };
  const processFiles = (newFiles) => { setFiles(p => [...p, ...newFiles.map(f => ({ id: Date.now()+Math.random(), name: f.name, size: formatFileSize(f.size), rawFile: f }))]); };
  const removeFile = (id) => setFiles(p => p.filter(f => f.id !== id));

  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState([{ role: "bot", content: greetingMsg }]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const payload = { id: agentId, name: agentName, emoji: agentEmoji, greetingMsg, instructions: agentPrompt, tone, guardrails, leadGen: { enabled: leadGenEnabled, prompt: leadGenPrompt }, handover: { enabled: handoverEnabled, fallbackMsg }, isPublished: true };
      const res = await fetch('/api/Ai/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok) {
        setIsPublished(true); if(data.agent?.id) setAgentId(data.agent.id); alert("บันทึกและเผยแพร่สำเร็จ!"); if(onSaveSuccess) onSaveSuccess();
      } else alert("Error: " + data.error);
    } catch (e) { alert("เชื่อมต่อล้มเหลว"); } finally { setIsSaving(false); }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;
    const userMsg = chatInput; setMessages(p => [...p, { role: "user", content: userMsg }]); setChatInput(""); setIsTyping(true);
    try {
      let finalSys = `[CORE INSTRUCTIONS]\n${agentPrompt}\n\n[TONE OF VOICE]\nMaintain a ${tone} tone.\n\n[STRICT GUARDRAILS]\n${guardrails}`;
      if (leadGenEnabled) finalSys += `\n\n[ACTION: LEAD GENERATION]\n${leadGenPrompt}`;
      if (handoverEnabled) finalSys += `\n\n[FALLBACK]\nIf unsure, reply exactly: "${fallbackMsg}"`;
      const res = await fetch('/api/Ai/agent-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg, system_prompt_override: finalSys }) });
      const data = await res.json();
      if (res.ok) setMessages(p => [...p, { role: "bot", content: data.reply }]); else setMessages(p => [...p, { role: "bot", content: "⚠️ AI Error" }]);
    } catch (e) { setMessages(p => [...p, { role: "bot", content: "⚠️ Connection Failed" }]); } finally { setIsTyping(false); }
  };

  return (
    // 🎨 Container หลัก: เหมือนกันเป๊ะทุกหน้า
    <div className="flex flex-col w-full h-full min-h-[94vh] bg-[#050509] text-white overflow-hidden font-sans rounded-3xl sm:rounded-[32px] border border-white/5 shadow-2xl relative">
      
      {/* 🎨 Header: ใช้ #0B0914 ให้เข้ากับ Sidebar */}
      <header className="h-20 flex justify-between items-center px-6 md:px-8 bg-[#0B0914] border-b border-white/5 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2.5 bg-[#1E1A2D] hover:bg-white/10 rounded-2xl transition-all border border-white/5 group cursor-pointer"><ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" /></button>
          <div className="flex items-center gap-3"><div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center font-black shadow-lg shadow-purple-900/20">AI</div><h1 className="text-xl font-black tracking-tight">AI Agent Builder</h1></div>
        </div>
        <div className="flex gap-4">
          <button onClick={handlePublish} disabled={isSaving} className={`px-8 py-2.5 rounded-2xl text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${isPublished ? "bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] text-white" : "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105"}`}>{isSaving ? "Saving..." : isPublished ? <><CheckCircle2 size={18} /> Published</> : <><CloudUpload size={18} /> Publish to Live</>}</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 🎨 Sub-Sidebar: สีเดียวกับ Header (#0B0914) */}
        <aside className="w-[240px] bg-[#0B0914] border-r border-white/5 p-4 flex flex-col gap-2 shrink-0 z-20">
           <p className="text-[10px] text-white/30 font-black uppercase tracking-[2px] mb-3 px-4 mt-2">Configuration</p>
           <TabButton active={activeTab === "general"} icon={SlidersHorizontal} label="General" onClick={() => setActiveTab("general")} />
           <TabButton active={activeTab === "behavior"} icon={Bot} label="Behavior & Rules" onClick={() => setActiveTab("behavior")} />
           <TabButton active={activeTab === "knowledge"} icon={Database} label="Knowledge Base" onClick={() => setActiveTab("knowledge")} />
           <TabButton active={activeTab === "actions"} icon={Zap} label="Actions & Skills" onClick={() => setActiveTab("actions")} />
        </aside>

        {/* 🎨 Center Setting: สี #050509 (พื้นหลัง) ใช้การ์ด #120F1D */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#050509] relative p-8 pb-20">
          <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div className="bg-[#120F1D] rounded-[32px] p-8 border border-white/5 shadow-2xl">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><SlidersHorizontal size={20} className="text-purple-400"/> Identity</h3>
                  <div className="flex gap-6 items-center">
                    <div className="relative">
                      <button onClick={() => setShowEmoji(!showEmoji)} className="w-24 h-24 bg-[#1E1A2D] hover:border-purple-500/50 rounded-[28px] flex items-center justify-center text-5xl border border-white/5 shadow-inner transition-all cursor-pointer">{agentEmoji}</button>
                      {showEmoji && <div className="absolute top-28 left-0 z-50 shadow-2xl"><EmojiPicker theme="dark" onEmojiClick={(e) => { setAgentEmoji(e.emoji); setShowEmoji(false); }} /></div>}
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-white/40 font-bold uppercase tracking-widest mb-2 block">Agent Name</label>
                      <input type="text" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="w-full bg-[#050509] border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-purple-500/50 transition-all font-bold shadow-inner" />
                    </div>
                  </div>
                </div>
                <div className="bg-[#120F1D] rounded-[32px] p-8 border border-white/5 shadow-2xl">
                  <h3 className="text-lg font-black mb-2 flex items-center gap-2"><MessageSquare size={20} className="text-purple-400"/> Greeting Message</h3>
                  <textarea value={greetingMsg} onChange={(e) => setGreetingMsg(e.target.value)} className="w-full h-24 bg-[#050509] border border-white/5 rounded-2xl p-4 text-sm text-white/90 focus:outline-none focus:border-purple-500/50 resize-none shadow-inner" />
                </div>
              </div>
            )}
            {activeTab === "behavior" && (
              <div className="space-y-6">
                <div className="bg-[#120F1D] rounded-[32px] p-8 border border-white/5 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-black flex items-center gap-2"><Bot size={20} className="text-purple-400"/> System Prompt</h3>
                     <select value={tone} onChange={(e) => setTone(e.target.value)} className="bg-[#1E1A2D] border border-white/5 rounded-xl px-4 py-2 text-xs font-bold outline-none text-white cursor-pointer"><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="persuasive">Persuasive</option></select>
                  </div>
                  <div className="bg-[#050509] border border-white/5 rounded-2xl overflow-hidden focus-within:border-purple-500/50 transition-all shadow-inner">
                    <textarea value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} className="w-full h-64 bg-transparent p-6 text-sm font-mono leading-relaxed outline-none custom-scrollbar text-white/80" />
                  </div>
                </div>
                <div className="bg-[#1D101A] rounded-[32px] p-8 border border-rose-500/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><ShieldAlert size={120}/></div>
                  <h3 className="text-lg font-black text-rose-400 mb-2 flex items-center gap-2"><ShieldAlert size={20}/> Guardrails (ข้อห้าม)</h3>
                  <textarea value={guardrails} onChange={(e) => setGuardrails(e.target.value)} className="w-full h-32 bg-[#050509] border border-rose-500/10 rounded-2xl p-4 text-sm font-mono text-rose-200/80 focus:outline-none focus:border-rose-500/50 resize-none shadow-inner relative z-10" />
                </div>
              </div>
            )}
            {activeTab === "knowledge" && (
              <div className="space-y-6">
                <div className="bg-[#120F1D] rounded-[32px] p-8 border border-white/5 shadow-2xl">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><Database size={20} className="text-purple-400"/> Document Upload</h3>
                  <div className="space-y-3 mb-6">
                    {files.map(file => (<div key={file.id} className="flex items-center justify-between p-4 bg-[#1E1A2D] border border-white/5 rounded-[20px] shadow-sm"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400"><FileText size={20} /></div><div><p className="text-sm font-black">{file.name}</p><p className="text-[10px] text-white/40 font-bold uppercase mt-0.5">{file.size}</p></div></div><button onClick={() => removeFile(file.id)} className="p-2 text-white/20 hover:text-rose-500 transition-colors cursor-pointer"><Trash2 size={18}/></button></div>))}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" multiple accept=".pdf,.txt,.doc,.docx" onChange={handleFileSelect} />
                  <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`border-2 border-dashed rounded-[24px] p-8 flex flex-col items-center justify-center transition-all cursor-pointer bg-[#050509] ${isDragging ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-white/10 text-white/20 hover:border-purple-500/40 hover:text-purple-400'}`}><FileUp size={32} className={`mb-3 ${isDragging ? 'animate-bounce' : ''}`} /><p className="text-sm font-black">{isDragging ? 'วางไฟล์ได้เลย!' : 'คลิกหรือลากไฟล์มาวาง'}</p></div>
                </div>
              </div>
            )}
            {activeTab === "actions" && (
              <div className="space-y-6">
                <div className="bg-[#120F1D] rounded-[32px] p-8 border border-white/5 shadow-2xl border-l-4 border-l-emerald-500">
                  <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400"><UserPlus size={20}/></div><span className="font-black text-lg">Lead Generation</span></div><ToggleCircle enabled={leadGenEnabled} setEnabled={setLeadGenEnabled} /></div>
                  {leadGenEnabled && <textarea value={leadGenPrompt} onChange={(e) => setLeadGenPrompt(e.target.value)} className="w-full h-24 bg-[#050509] rounded-2xl p-4 text-xs font-mono text-emerald-100/70 outline-none border border-emerald-500/10 focus:border-emerald-500/50 shadow-inner" />}
                </div>
                <div className="bg-[#120F1D] rounded-[32px] p-8 border border-white/5 shadow-2xl border-l-4 border-l-blue-500">
                  <div className="flex justify-between items-center mb-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-500/10 rounded-xl text-blue-400"><Waypoints size={20}/></div><span className="font-black text-lg">Handover & Fallback</span></div><ToggleCircle enabled={handoverEnabled} setEnabled={setHandoverEnabled} /></div>
                  {handoverEnabled && <input type="text" value={fallbackMsg} onChange={(e) => setFallbackMsg(e.target.value)} className="w-full bg-[#050509] border border-blue-500/10 rounded-2xl p-4 text-sm text-blue-100/90 focus:outline-none focus:border-blue-500/50 shadow-inner" />}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 🎨 Chat Column: ใช้ #0B0914 แยกส่วนชัดเจน */}
        <div className="w-[400px] bg-[#0B0914] border-l border-white/5 flex flex-col z-20 shrink-0">
          <div className="p-5 border-b border-white/5 flex justify-between items-center bg-[#0B0914]"><div className="flex items-center gap-3"><div className={`w-2.5 h-2.5 rounded-full ${isPublished ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-white/10'}`} /><h4 className="font-black text-xs uppercase tracking-[2px]">Live Test</h4></div><button onClick={() => setMessages([{role: "bot", content: greetingMsg}])} className="text-[10px] font-black text-white/20 hover:text-white transition-colors cursor-pointer">RESET</button></div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">{messages.map((msg, i) => (<div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] px-4 py-3 rounded-[20px] text-sm leading-relaxed shadow-md ${msg.role === "user" ? "bg-purple-600 text-white rounded-tr-sm" : "bg-[#1E1A2D] border border-white/5 text-white/90 rounded-tl-sm"}`}>{msg.content}</div></div>))}{isTyping && (<div className="bg-[#1E1A2D] w-fit px-4 py-3.5 rounded-[16px] flex gap-1.5 shadow-md"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" /><div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75" /><div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150" /></div>)}<div ref={chatEndRef} /></div>
          <div className="p-5 bg-[#0B0914] border-t border-white/5"><div className="relative flex items-center group"><input type="text" placeholder={isPublished ? "Message AI..." : "Publish to test"} disabled={!isPublished} value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} className="w-full bg-[#050509] border border-white/5 focus:border-purple-500/40 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none transition-all text-white disabled:opacity-50 shadow-inner" /><button onClick={handleSendMessage} disabled={!chatInput.trim() || isTyping || !isPublished} className="absolute right-2 p-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-white/5 disabled:text-white/10 text-white rounded-xl transition-all cursor-pointer"><SendHorizontal size={18} /></button></div><p className="text-[9px] text-center text-white/20 mt-4 uppercase font-bold tracking-widest">Talka AI Model</p></div>
        </div>
      </div>
    </div>
  );
}