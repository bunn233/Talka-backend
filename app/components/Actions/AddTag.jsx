"use client";
import { X, Check } from "lucide-react"; 
import { useState, useEffect } from "react"; 

export default function AddTag({ onClose, availableTags = [], currentTargets = [], onToggleTag }) {
  
  const [tagsList, setTagsList] = useState([]);
  
  useEffect(() => {
    // 🟢 ดึงข้อมูล Tag ให้ชัวร์ว่ามีทั้ง ID และ Name ครบถ้วน
    const formattedTags = availableTags.map(t => {
        if (typeof t === 'string') return { id: null, name: t, color: '#BE7EC7', emoji: '🏷️' };
        return {
            id: t.id || t.tag_id,
            name: t.name || t.tag_name || "Unknown",
            color: t.color || "#BE7EC7",
            emoji: t.emoji || ""
        };
    });
    setTagsList(formattedTags);
  }, [availableTags]);

  return (
    <div 
      className="w-[320px] max-h-[85vh] bg-[#1E1B29] border border-[#BE7EC7]/10 rounded-3xl shadow-2xl p-6 flex flex-col self-start overflow-hidden" 
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-white text-xl font-bold">Add Tag</h2>
        <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-red-400 transition-all border border-transparent hover:border-white/10"
        >
            <X size={16} />
        </button>
      </div>

      {/* Tags Container */}
      <div className="flex flex-wrap gap-2.5 mb-6 overflow-y-auto custom-scrollbar content-start">
        {tagsList.length === 0 ? ( 
            <div className="flex flex-col items-center justify-center w-full py-8 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                    <i className="fa-solid fa-tags text-white/30 text-xl"></i>
                </div>
                <p className="text-white/70 text-sm font-medium">No tags available</p>
                <p className="text-white/40 text-xs mt-1">Create tags in Settings first.</p>
            </div>
        ) : (
            tagsList.map((tag) => {
              const safeTargets = Array.isArray(currentTargets) ? currentTargets : [];
              
              // เช็คว่าถูกเลือกอยู่หรือไม่ (เทียบด้วย Object หรือ String ก็ได้)
              const isActive = safeTargets.some(t => 
                 typeof t === 'object' ? t.name === tag.name : t === tag.name
              );

              return (
                <button
                  key={tag.id || tag.name}
                  // 🔥 หัวใจสำคัญอยู่ตรงนี้ครับ! ส่งทั้งชื่อ และ ID ไปให้หน้าหลัก
                  onClick={() => onToggleTag(tag.name, tag.id)} 
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all flex items-center gap-2 border 
                    ${isActive 
                        ? 'text-white' 
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border-white/5 hover:border-white/10'
                    }
                  `}
                  style={{
                    backgroundColor: isActive ? tag.color : undefined,
                    borderColor: isActive ? tag.color : undefined,
                    boxShadow: isActive ? `0 4px 14px ${tag.color}40` : undefined
                  }}
                >
                  {tag.emoji && <span className="text-base leading-none">{tag.emoji}</span>}
                  <span>{tag.name}</span>
                  {isActive && <Check size={14} strokeWidth={3} />} 
                </button>
              );
            })
        )}
      </div>

      {/* Done Button */}
      <button
        onClick={onClose}
        className="w-full mt-auto shrink-0 bg-[#BE7EC7]/10 hover:bg-[#BE7EC7]/20 text-[#BE7EC7] border border-[#BE7EC7]/20 hover:border-[#BE7EC7]/40 font-semibold py-2.5 rounded-xl transition-all"
      >
        Done
      </button>
    </div>
  );
}