"use client";
import { useState, useEffect } from "react";
import { Bot, Plus, Edit, Trash2, X } from "lucide-react";

// 📦 ข้อมูล Prompt พื้นฐาน 4 อันตามรูป (Default)
const BUILT_IN_PROMPTS = [
  {
    id: "default-1",
    name: "เปลี่ยนโทนเสียง",
    action: "ปรับโทนเสียงให้ฟังดูเป็นมืออาชีพ เป็นมิตร เห็นอกเห็นใจ หรือตรงไปตรงมามากขึ้น",
    active: true,
    isDefault: true,
  },
  {
    id: "default-2",
    name: "แปล",
    action: "แปลข้อความเป็นภาษาที่คุณเลือก",
    active: true,
    isDefault: true,
  },
  {
    id: "default-3",
    name: "แก้ไขการสะกดคำและไวยากรณ์",
    action: "แก้ไขไวยากรณ์ การสะกดคำ และเครื่องหมายวรรคตอนโดยอัตโนมัติ",
    active: true,
    isDefault: true,
  },
  {
    id: "default-4",
    name: "ลดความซับซ้อนของภาษา",
    action: "ทำให้ข้อความสามารถอ่านและเข้าใจได้ง่ายขึ้น",
    active: true,
    isDefault: true,
  }
];

export default function AiPromptsPage() {
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [newPrompt, setNewPrompt] = useState({ name: "", action: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState(null);
  const [deletePrompt, setDeletePrompt] = useState(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoading(true);
      try {
        // เมื่อเชื่อม API จริง ให้ดึงข้อมูลมาแล้วนำมาต่อท้าย BUILT_IN_PROMPTS
        setPrompts([...BUILT_IN_PROMPTS]); 
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrompts();
  }, []);

  const openAddModal = () => {
    setNewPrompt({ name: "", action: "" });
    setEditingPromptId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (prompt) => {
    setNewPrompt({ name: prompt.name, action: prompt.action });
    setEditingPromptId(prompt.id);
    setIsModalOpen(true);
  };

  const handleSavePrompt = async () => {
    if (!newPrompt.name.trim() || !newPrompt.action.trim()) return alert("กรุณากรอกชื่อและคำสั่งให้ครบถ้วน");

    try {
      if (editingPromptId) {
        setPrompts(prompts.map((p) => p.id === editingPromptId ? { ...p, ...newPrompt } : p));
      } else {
        const createdPrompt = { 
          id: Date.now(), 
          ...newPrompt, 
          active: true, 
          isDefault: false 
        };
        setPrompts([...prompts, createdPrompt]);
      }

      setNewPrompt({ name: "", action: "" });
      setEditingPromptId(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save prompt:", error);
    }
  };

  const handleOpenDeleteModal = (prompt) => setDeletePrompt(prompt);
  const handleCloseDeleteModal = () => setDeletePrompt(null);

  const handleConfirmDelete = async () => {
    if (!deletePrompt) return;
    try {
      setPrompts(prompts.filter((p) => p.id !== deletePrompt.id));
      setDeletePrompt(null);
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      setPrompts(prompts.map((p) => (p.id === id ? { ...p, active: !currentStatus } : p)));
    } catch (error) {
      console.error("Failed to toggle prompt status:", error);
      setPrompts(prompts.map((p) => (p.id === id ? { ...p, active: currentStatus } : p)));
    }
  };

  return (
    // 🎨 Container หลัก: สีเดียวกับ Channel Catalog (#1E1B29 หรือใกล้เคียง)
    <div className="flex flex-col w-full h-full min-h-[94vh] bg-[#1A1625] text-white overflow-hidden font-sans rounded-3xl sm:rounded-[32px] border border-white/5 shadow-2xl relative">
      
      {/* 🎨 Header: ตัด Background เข้มๆ ออก ให้กลืนเป็นผืนเดียวกัน */}
      <header className="shrink-0 p-8 pb-4 z-30">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-[14px] flex items-center justify-center shadow-sm">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">AI Writing Copilot</h1>
            <p className="text-[13px] text-white/50 mt-1 font-medium">
              ตั้งค่าคำสั่งให้ AI ช่วยเกลาคำ แปลภาษา หรือปรับโทนเสียงก่อนส่งให้ลูกค้า
            </p>
          </div>
        </div>

        {/* ปุ่มสร้าง (อิงตามรูป: ปุ่มสีม่วงสว่าง) */}
        <button
          onClick={openAddModal}
          className="flex w-fit items-center gap-2 bg-[#9333ea] hover:bg-[#a855f7] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-600/20 cursor-pointer"
        >
          <Plus size={16} strokeWidth={3} /> สร้างคำสั่งใหม่ (Custom Prompt)
        </button>
      </header>

      {/* 🎨 Content: รายการ Prompts */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-10 pt-2">
        <div className="max-w-5xl space-y-3">
          {isLoading ? (
            <div className="text-white/50 py-10 text-center flex justify-center items-center gap-2 text-sm font-medium">
              <div className="w-4 h-4 border-2 border-[#9333ea] border-t-transparent rounded-full animate-spin" /> 
              กำลังโหลดข้อมูล...
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-white/30 py-10 italic text-center text-sm">ยังไม่มีข้อมูลคำสั่ง AI</div>
          ) : (
            prompts.map((p) => (
              <div
                key={p.id}
                className="group flex justify-between items-center bg-[#120F18] border border-white/[0.04] rounded-2xl p-5 hover:border-white/10 transition-all duration-300"
              >
                <div className="text-left flex-1 pr-6">
                  <h3 className="font-bold text-white text-[14px] mb-1.5 tracking-wide">{p.name}</h3>
                  <p className="text-[13px] text-white/40 leading-relaxed font-medium">{p.action}</p>
                </div>

                <div className="flex items-center gap-5 shrink-0">
                  {/* ปุ่ม Action (Edit / Delete) จะโชว์เฉพาะตัวที่สร้างเอง */}
                  {!p.isDefault && (
                    <div className="flex items-center gap-2 pr-4 border-r border-white/5">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-all cursor-pointer"
                        title="แก้ไข"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(p)}
                        className="p-2 bg-white/5 hover:bg-rose-500/20 text-white/40 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                        title="ลบ"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {/* 🎨 Toggle Switch แบบในรูปเป๊ะๆ (สีฟ้า) */}
                  <button
                    onClick={() => handleToggle(p.id, p.active)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none ${p.active ? 'bg-[#3b82f6]' : 'bg-white/10'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${p.active ? 'translate-x-[22px]' : 'translate-x-[3px]'}`}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🎨 Modal: Add / Edit (ปรับให้เข้ากับธีมใหม่) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#1A1625] text-white rounded-3xl p-8 w-[450px] shadow-2xl border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold tracking-wide">
                {editingPromptId ? "แก้ไขคำสั่ง AI" : "สร้างคำสั่ง AI ใหม่"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 block">ชื่อคำสั่ง</label>
            <input
              type="text"
              placeholder="เช่น ตอบกลับแบบเป็นทางการ"
              className="w-full bg-[#120F18] text-white p-4 rounded-2xl mb-5 outline-none border border-white/5 focus:border-[#9333ea]/50 transition-all text-sm font-medium"
              value={newPrompt.name}
              onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
            />

            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-2 block">รายละเอียดคำสั่ง (Prompt)</label>
            <textarea
              placeholder="เช่น ปรับข้อความนี้ให้อ่านง่ายขึ้น สุภาพ และมีความเห็นอกเห็นใจลูกค้า"
              className="w-full bg-[#120F18] text-white p-4 rounded-2xl mb-8 outline-none resize-none border border-white/5 focus:border-[#9333ea]/50 transition-all text-sm font-medium custom-scrollbar"
              rows={4}
              value={newPrompt.action}
              onChange={(e) => setNewPrompt({ ...newPrompt, action: e.target.value })}
            />

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer px-5 py-2.5 text-sm font-bold transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleSavePrompt} className="bg-[#9333ea] hover:bg-[#a855f7] text-white rounded-xl px-6 py-2.5 text-sm font-bold transition-all cursor-pointer shadow-lg shadow-purple-600/20">
                {editingPromptId ? "บันทึกการแก้ไข" : "สร้างคำสั่ง"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎨 Modal: Delete */}
      {deletePrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#1A1625] border border-rose-500/10 rounded-3xl p-8 w-[400px] text-white shadow-2xl relative">
            <h2 className="text-lg font-bold mb-2 text-rose-400">
              ลบคำสั่ง "{deletePrompt.name}" ?
            </h2>
            <p className="text-white/50 text-sm mb-8 font-medium leading-relaxed">
              คุณแน่ใจหรือไม่ว่าต้องการลบคำสั่ง AI นี้? ข้อมูลจะถูกลบถาวรและไม่สามารถย้อนกลับได้
            </p>

            <div className="flex justify-end gap-3 mt-2">
              <button onClick={handleCloseDeleteModal} className="text-white/40 hover:text-white cursor-pointer px-5 py-2.5 text-sm font-bold transition-colors">
                ยกเลิก
              </button>
              <button onClick={handleConfirmDelete} className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl px-6 py-2.5 text-sm font-bold cursor-pointer transition-all border border-rose-500/10">
                <Trash2 size={16} /> ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}