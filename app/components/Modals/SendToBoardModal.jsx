"use client";
import React, { useState, useEffect } from "react";
import { X, LayoutDashboard, ArrowRight } from "lucide-react";

export default function SendToBoardModal({ onClose, chat, onSuccess }) {
    const [columns, setColumns] = useState([]);
    const [selectedColId, setSelectedColId] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 1. โหลดรายชื่อคอลัมน์ (Lists) ทั้งหมดมาจาก Database ตาม Workspace
    useEffect(() => {
        const fetchColumns = async () => {
            try {
                // 🔥 1. ดึง ID ของทีมปัจจุบัน
                const wsRes = await fetch("/api/users/current-workspace");
                const wsData = await wsRes.json();
                const activeWsId = wsData.activeWorkspaceId;

                if (!activeWsId) {
                    setIsLoading(false);
                    return;
                }

                // 🔥 2. ดึงคอลัมน์ของทีมนั้น
                const res = await fetch(`/api/board/columns?wsId=${activeWsId}`);
                if (res.ok) {
                    const data = await res.json();
                    setColumns(data);
                    
                    // ถ้ามีคอลัมน์ ให้เลือกอันแรกไว้เป็นค่าเริ่มต้น (ยกเว้นอันที่แชทอยู่ปัจจุบัน)
                    const availableCols = data.filter(c => c.column_id !== chat?.columnId);
                    if (availableCols.length > 0) {
                        setSelectedColId(availableCols[0].column_id);
                    }
                }
            } catch (error) {
                console.error("Failed to load columns:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchColumns();
    }, [chat]);

    // 2. ฟังก์ชันเมื่อกดยืนยัน "ย้ายแชท"
    const handleConfirmMove = async () => {
        if (!selectedColId || !chat) return;
        setIsSaving(true);

        try {
            // ยิง API ไปย้ายแชทใน Database
            const res = await fetch(`/api/chats/${chat.id}/move`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ columnId: selectedColId }),
            });

            if (!res.ok) throw new Error("Failed to move chat");

            // ดึง "ชื่อ" ของคอลัมน์ที่เราเพิ่งย้ายไป เพื่อส่งไปลง Log
            const targetCol = columns.find(c => c.column_id === selectedColId);
            const colName = targetCol ? targetCol.title : "Unknown Board";

            // เรียก onSuccess เพื่อส่งชื่อคอลัมน์กลับไปให้ ChatPageContent บันทึก Log
            if (onSuccess) {
                onSuccess(colName);
            } else {
                onClose();
            }

        } catch (error) {
            console.error("Move chat error:", error);
            alert("ไม่สามารถย้ายแชทได้ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
                className="bg-[#1E1B29] border border-white/10 rounded-3xl p-6 w-[400px] shadow-2xl flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <LayoutDashboard className="text-[#BE7EC7]" size={22} />
                        Send to Board
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 hover:border-white/10 border border-transparent flex items-center justify-center transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <p className="text-sm text-white/60 mb-4">
                        Move chat <strong className="text-white">"{chat?.name}"</strong> to which list?
                    </p>

                    {isLoading ? (
                        <div className="flex justify-center py-6">
                            <div className="w-6 h-6 border-2 border-[#BE7EC7]/30 border-t-[#BE7EC7] rounded-full animate-spin"></div>
                        </div>
                    ) : columns.length === 0 ? (
                        <div className="text-center text-white/40 text-sm py-4 bg-white/5 rounded-xl">
                            No lists available.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                            {columns.map((col) => {
                                const isCurrent = col.column_id === chat?.columnId;
                                const isSelected = col.column_id === selectedColId;

                                return (
                                    <button
                                        key={col.column_id}
                                        disabled={isCurrent}
                                        onClick={() => setSelectedColId(col.column_id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                                            isCurrent 
                                                ? "bg-white/5 border-transparent opacity-50 cursor-not-allowed" 
                                                : isSelected
                                                    ? "bg-[#BE7EC7]/10 border-[#BE7EC7]/50 text-white"
                                                    : "bg-white/5 border-transparent text-white/70 hover:bg-white/10 hover:text-white"
                                        }`}
                                    >
                                        <span className="font-semibold text-sm truncate pr-2">
                                            {col.title}
                                        </span>
                                        {isCurrent ? (
                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded font-bold text-white/50">Current</span>
                                        ) : isSelected ? (
                                            <ArrowRight size={16} className="text-[#BE7EC7]" />
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 mt-auto pt-2 border-t border-white/5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl font-semibold text-white/60 bg-white/5 hover:bg-white/10 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmMove}
                        disabled={isLoading || isSaving || !selectedColId}
                        className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-[#BE7EC7] hover:bg-[#a66bb0] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm shadow-lg shadow-[#BE7EC7]/20 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            "Move Chat"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}