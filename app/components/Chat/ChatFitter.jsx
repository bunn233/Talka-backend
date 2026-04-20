"use client"
import { useState, useEffect, useRef } from "react";

export default function ChatFitter({ onFilterChange, availableCompanies = [], onCompanyChange, onSearchChange }) {
    const [selected, setSelected] = useState("radio1");

    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const dropdownRef = useRef(null);

    const handleRadioChange = (id, value) => {
        setSelected(id);
        if (onFilterChange) {
            onFilterChange(value);
        }
    };

    const handleCompanySelect = (comp) => {
        setSelectedCompany(comp);
        setIsCompanyOpen(false);
        if (onCompanyChange) onCompanyChange(comp);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        // 🎨 เพิ่ม Background, Shadow, และปรับให้เป็นกล่อง Control Bar ที่ดูมีมิติ
        <div className="flex flex-col lg:flex-row bg-[#1E1B29] border border-[#BE7EC7]/10 shadow-lg rounded-3xl p-3 w-full gap-4 items-center justify-between">

            {/* Search Bar */}
            <div className="flex items-center text-white/50 bg-[#120F18] border border-white/5 focus-within:border-[#BE7EC7]/50 focus-within:text-[#BE7EC7] rounded-2xl py-2.5 px-4 w-full lg:max-w-[280px] shrink-0 transition-all shadow-inner">
                <i className="fa-solid fa-magnifying-glass mr-3"></i>
                <input
                    type="text"
                    className="text-white text-sm outline-none bg-transparent w-full placeholder:text-white/30"
                    placeholder="Search chats..."
                    onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                />
            </div>

            {/* Filters (เปลี่ยนจาก Radio เป็น Pill Tabs) */}
            <div className="flex bg-[#120F18] p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto custom-scrollbar shadow-inner">
                {[
                    { id: "radio1", label: "All Chat", value: "All" },
                    { id: "radio2", label: "New Chat", value: "New" },
                    { id: "radio3", label: "Open", value: "OPEN" },       // <-- เปลี่ยนจาก "Open" เป็น "OPEN"
                    { id: "radio4", label: "Closed", value: "CLOSED" },   // <-- เปลี่ยนจาก "Closed" เป็น "CLOSED"
                    { id: "radio5", label: "Pending", value: "PENDING" }, // <-- เปลี่ยนจาก "Pending" เป็น "PENDING"
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleRadioChange(item.id, item.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${selected === item.id
                                ? 'bg-[#BE7EC7] text-white shadow-md shadow-[#BE7EC7]/20 scale-100'
                                : 'text-white/50 hover:text-white hover:bg-white/5 scale-95 hover:scale-100'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Company Dropdown */}
            <div className="relative shrink-0 w-full lg:w-auto" ref={dropdownRef}>
                <button
                    onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                    className={`w-full lg:w-auto flex items-center justify-between gap-3 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all border
                        ${selectedCompany
                            ? 'bg-[#BE7EC7]/10 text-[#BE7EC7] border-[#BE7EC7]/30 shadow-sm'
                            : 'bg-[#120F18] text-white/60 border-white/5 hover:border-white/20 hover:text-white shadow-inner'
                        }
                    `}
                >
                    <div className="flex items-center gap-2">
                        <i className="fa-solid fa-building"></i>
                        <span className="max-w-[120px] truncate">{selectedCompany || "All Companies"}</span>
                    </div>
                    {selectedCompany ? (
                        <div
                            className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleCompanySelect(null); }}
                        >
                            <i className="fa-solid fa-times text-[10px]"></i>
                        </div>
                    ) : (
                        <i className={`fa-solid fa-chevron-down text-[10px] opacity-70 transition-transform duration-300 ${isCompanyOpen ? 'rotate-180' : ''}`}></i>
                    )}
                </button>

                {/* Dropdown Menu */}
                {isCompanyOpen && (
                    <div className="absolute right-0 top-full mt-2 w-full lg:w-64 bg-[#1E1B29] border border-[#BE7EC7]/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                        <div className="p-3 bg-[#120F18]/50 border-b border-white/5">
                            <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest ml-2">Filter by Company</span>
                        </div>
                        <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                            <button
                                onClick={() => handleCompanySelect(null)}
                                className={`w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all flex items-center justify-between ${!selectedCompany ? 'bg-[#BE7EC7]/20 text-[#BE7EC7] font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                            >
                                All Companies
                                {!selectedCompany && <i className="fa-solid fa-check text-[10px]"></i>}
                            </button>

                            {availableCompanies.length > 0 ? (
                                availableCompanies.map((comp) => (
                                    <button
                                        key={comp}
                                        onClick={() => handleCompanySelect(comp)}
                                        className={`w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all truncate flex items-center justify-between
                                            ${selectedCompany === comp ? 'bg-[#BE7EC7]/20 text-[#BE7EC7] font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                                        `}
                                    >
                                        <span className="truncate">{comp}</span>
                                        {selectedCompany === comp && <i className="fa-solid fa-check text-[10px]"></i>}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-6 text-xs text-white/30 italic text-center flex flex-col items-center gap-2">
                                    <i className="fa-solid fa-box-open text-lg opacity-50"></i>
                                    No companies found
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}