"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, User, Building2, Mail, Phone, Globe, Tag, Plus } from 'lucide-react';

const COUNTRY_TO_PREFIX = {
    "Thailand": "66+",
    "USA": "1+",
    "Japan": "81+"
};

export default function AddContactModal({ 
    onClose, 
    onAdd, 
    AVAILABLE_TAGS = [], 
    AVAILABLE_CHANNELS = [], 
    AVAILABLE_COMPANIES = []
}) {
    
    const [formData, setFormData] = useState({
        name: "",
        company: "",
        email: "",
        phone: "",
        phonePrefix: "66+", 
        country: "", 
        tags: [],
        channel: "", 
        status: "Open" 
    });

    const [showCompanyList, setShowCompanyList] = useState(false);
    const companyWrapperRef = useRef(null); 

    useEffect(() => {
        function handleClickOutside(event) {
            if (companyWrapperRef.current && !companyWrapperRef.current.contains(event.target)) {
                setShowCompanyList(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = value === "" ? null : value;

        setFormData(prev => {
            const updated = { ...prev, [name]: newValue };
            if (name === "country" && COUNTRY_TO_PREFIX[value]) {
                updated.phonePrefix = COUNTRY_TO_PREFIX[value];
            }
            return updated;
        });
    };

    const handleCompanySelect = (company) => {
        setFormData(prev => ({ ...prev, company: company }));
        setShowCompanyList(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData);
    };

    const inputClass = "w-full bg-white/[0.03] border border-white/10 focus:border-[#BE7EC7]/50 focus:bg-white/[0.08] outline-none rounded-xl py-2.5 px-4 text-white text-sm transition-all placeholder:text-white/20";
    const labelClass = "block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 mb-1.5 ml-1";

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 w-full max-w-lg text-white relative animate-in fade-in zoom-in-95 duration-300"
                onClick={e => e.stopPropagation()} 
            >
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#BE7EC7] flex items-center justify-center shadow-[0_0_20px_rgba(190,126,199,0.3)]">
                        <Plus size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Add New Contact</h2>
                        <p className="text-white/40 text-xs font-medium">Create a new profile for your lead or customer</p>
                    </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className={labelClass}>Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="John Doe" required />
                            </div>
                        </div>

                        {/* Company */}
                        <div className="relative" ref={companyWrapperRef}>
                            <label className={labelClass}>Company</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input 
                                    type="text" name="company" 
                                    value={formData.company || ""} 
                                    onChange={handleChange} 
                                    onClick={() => setShowCompanyList(true)} 
                                    className={`${inputClass} pl-11 pr-10`} 
                                    placeholder="Select or type..." 
                                    autoComplete="off" 
                                />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20" onClick={() => setShowCompanyList(!showCompanyList)}>
                                    <ChevronDown size={16} className={`transition-transform ${showCompanyList ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                            {showCompanyList && (
                                <div className="absolute z-50 w-full mt-2 bg-[#1F192E] border border-white/10 rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-1.5 animate-in slide-in-from-top-2 duration-200">
                                    {AVAILABLE_COMPANIES.length > 0 ? (
                                        AVAILABLE_COMPANIES.map((comp, index) => (
                                            <div key={index} className="px-4 py-2.5 hover:bg-white/5 rounded-xl cursor-pointer text-sm text-white/70 hover:text-white transition-colors" onClick={() => handleCompanySelect(comp)}>{comp}</div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-white/20 text-xs italic text-center">No existing companies</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Channel */}
                        <div>
                            <label className={labelClass}>Channel</label>
                            <div className="relative">
                                <select name="channel" value={formData.channel || ""} onChange={handleChange} className={`${inputClass} appearance-none`}>
                                    <option value="" disabled>Select Channel</option>
                                    {(AVAILABLE_CHANNELS || []).map(c => <option key={c} value={c} className="bg-[#1F192E]">{c}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className={labelClass}>Phone Number</label>
                            <div className="flex gap-2">
                                <div className="relative w-28 shrink-0">
                                    <select name="phonePrefix" value={formData.phonePrefix} onChange={handleChange} className={`${inputClass} appearance-none px-3`}>
                                        <option value="66+" className="bg-[#1F192E]">66+</option>
                                        <option value="1+" className="bg-[#1F192E]">1+</option>
                                        <option value="81+" className="bg-[#1F192E]">81+</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={14} />
                                </div>
                                <input type="tel" name="phone" value={formData.phone || ""} onChange={handleChange} className={inputClass} placeholder="08x-xxx-xxxx" />
                            </div>
                        </div>

                        {/* Country */}
                        <div>
                            <label className={labelClass}>Country</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <select name="country" value={formData.country || ""} onChange={handleChange} className={`${inputClass} pl-11 appearance-none`}>
                                    <option value="" className="bg-[#1F192E]">N/A</option>
                                    <option value="Thailand" className="bg-[#1F192E]">Thailand</option>
                                    <option value="USA" className="bg-[#1F192E]">USA</option>
                                    <option value="Japan" className="bg-[#1F192E]">Japan</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="md:col-span-2">
                            <label className={labelClass}>Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <input type="email" name="email" value={formData.email || ""} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="example@email.com" />
                            </div>
                        </div>
                        
                        {/* Tags */}
                        <div className="md:col-span-2">
                            <label className={labelClass}>Tags</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <select 
                                    // 👈 ป้องกัน Error และดึง ID ได้ตรงจุด ไม่ว่าข้อมูลจะเป็น id หรือ tag_id
                                    value={Array.isArray(formData.tags) && formData.tags.length > 0 ? String(formData.tags[0].id || formData.tags[0].tag_id || "") : ""}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const selectedTag = AVAILABLE_TAGS.find(t => String(t.id || t.tag_id) === String(e.target.value));
                                            if (selectedTag) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    tags: [selectedTag]
                                                }));
                                            }
                                        } else {
                                            setFormData(prev => ({ ...prev, tags: [] }));
                                        }
                                    }}
                                    className={`${inputClass} pl-11 appearance-none`}
                                >
                                    <option value="" className="bg-[#1F192E]">No Tag</option>
                                    {AVAILABLE_TAGS.map((tagObj) => {
                                        // 👈 อ่านค่าให้ยืดหยุ่นขึ้น
                                        const tId = tagObj.id || tagObj.tag_id;
                                        const tName = tagObj.name || tagObj.tag_name;
                                        
                                        return (
                                            <option key={String(tId)} value={String(tId)} className="bg-[#1F192E]">
                                                {tName}
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold py-3.5 rounded-2xl border border-white/5 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 bg-[#BE7EC7] hover:bg-[#a66bb0] text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-[#BE7EC7]/20 transition-all transform active:scale-95"
                        >
                            Create Contact
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}