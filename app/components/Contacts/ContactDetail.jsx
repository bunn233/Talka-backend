"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
    X, User, Building2, Phone, Mail, Globe, Tag, 
    MessageSquare, Trash2, Check, ChevronDown, 
    Facebook, Instagram, MessageCircle 
} from 'lucide-react';

const COUNTRY_TO_PREFIX = {
    "Thailand": "66+",
    "USA": "1+",
    "Japan": "81+"
};

export default function ContactDetail({ contact, onClose, onSave, onDelete, AVAILABLE_TAGS = [], AVAILABLE_COMPANIES = [] }) {
    const [formData, setFormData] = useState(contact);
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

    useEffect(() => {
        setFormData(contact);
    }, [contact]);

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

    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
    const handleDelete = () => { if (onDelete) onDelete(contact.id); onClose(); };

    if (!contact) return null;

    const inputClass = "w-full bg-white/[0.03] border border-white/10 focus:border-[#BE7EC7]/50 focus:bg-white/[0.08] outline-none rounded-xl py-2.5 px-4 text-white text-sm transition-all placeholder:text-white/20";
    const labelClass = "block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 mb-1.5 ml-1";

    const getChannelIcon = (channel) => {
        switch (channel) {
            case 'Facebook': return <Facebook className="text-blue-500" size={24} />;
            case 'Instagram': return <Instagram className="text-pink-500" size={24} />;
            case 'Line': return <MessageCircle className="text-green-500" size={24} />;
            default: return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
            <div 
                className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-8 w-full max-w-lg text-white relative animate-in fade-in zoom-in-95 duration-300 overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                {/* Header Decoration */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#BE7EC7] to-transparent opacity-50"></div>

                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all border border-transparent hover:border-white/10"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-extrabold mb-8 tracking-tight">Contact details</h2>
                
                {/* Profile Section */}
                <div className="flex items-center gap-5 mb-8 p-4 bg-white/[0.02] rounded-[1.8rem] border border-white/5">
                    <div className="relative">
                        <img src={formData.imgUrl} alt={formData.name} className="w-20 h-20 rounded-[1.4rem] border-2 border-white/10 shadow-xl object-cover" />
                        <div className="absolute -bottom-2 -right-2 bg-[#161223] p-1.5 rounded-xl border border-white/10">
                            {getChannelIcon(formData.channel)}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white tracking-tight">{formData.name}</h3>
                        <p className="text-white/40 text-xs font-medium mt-1">{formData.company || "Independent Contact"}</p>
                    </div>
                </div>

                {/* Assigned Agent Section */}
                <div className="mb-8">
                    <label className={labelClass}>Assigned Agent</label>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <select 
                                name="assignedUser" 
                                value={formData.assignedUser || "Admin"} 
                                onChange={handleChange} 
                                className={`${inputClass} pl-11 appearance-none`}
                            >
                                <option value="Admin" className="bg-[#1F192E]">Agent: Adminstrator</option>
                                <option value="User" className="bg-[#1F192E]">Agent: Support User</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                        </div>
                        <button className="w-11 h-11 flex items-center justify-center bg-[#BE7EC7]/10 text-[#BE7EC7] rounded-xl hover:bg-[#BE7EC7] hover:text-white transition-all border border-[#BE7EC7]/20 shadow-lg shadow-[#BE7EC7]/5">
                            <MessageSquare size={18} />
                        </button>
                    </div>
                </div>

                {/* Form Fields Section */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#BE7EC7]">Contact Fields</h3>
                    <div className="h-px bg-white/5 flex-1 ml-4"></div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                    {/* Company Dropdown */}
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
                                placeholder="Search or add company..." 
                                autoComplete="off"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 cursor-pointer text-white/20" onClick={() => setShowCompanyList(!showCompanyList)}>
                                <ChevronDown size={16} className={`transition-transform ${showCompanyList ? 'rotate-180' : ''}`} />
                            </div>
                        </div>
                        {showCompanyList && (
                            <div className="absolute z-10 w-full mt-2 bg-[#1F192E] border border-white/10 rounded-2xl shadow-2xl max-h-48 overflow-y-auto p-1.5 animate-in slide-in-from-top-2 duration-200">
                                {AVAILABLE_COMPANIES.length > 0 ? (
                                    AVAILABLE_COMPANIES.map((comp, index) => (
                                        <div key={index} className="px-4 py-2.5 hover:bg-white/5 rounded-xl cursor-pointer text-sm text-white/70 hover:text-white transition-colors font-medium" onClick={() => handleCompanySelect(comp)}>{comp}</div>
                                    ))
                                ) : (<div className="px-4 py-3 text-white/20 text-xs italic text-center">No existing companies</div>)}
                            </div>
                        )}
                    </div>

                    {/* Phone & Country Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Phone Number</label>
                            <div className="flex gap-2">
                                <div className="relative w-24 shrink-0">
                                    <select name="phonePrefix" value={formData.phonePrefix || '66+'} onChange={handleChange} className={`${inputClass} appearance-none px-3`}>
                                        <option value="66+" className="bg-[#1F192E]">66+</option>
                                        <option value="1+" className="bg-[#1F192E]">1+</option>
                                        <option value="81+" className="bg-[#1F192E]">81+</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={12} />
                                </div>
                                <input type="tel" name="phone" value={formData.phone || ""} onChange={handleChange} className={inputClass} placeholder="08x-xxx-xxxx" />
                            </div>
                        </div>

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
                    </div>

                    {/* Email */}
                    <div>
                        <label className={labelClass}>Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input type="email" name="email" value={formData.email || ""} onChange={handleChange} className={`${inputClass} pl-11`} placeholder="example@domain.com" />
                        </div>
                    </div>

                    {/* Tags & Status Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Status</label>
                            <div className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-sm font-medium flex items-center justify-between">
                                <span>{formData.status ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1).toLowerCase() : "Open"}</span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${
                                    String(formData.status || "").toUpperCase() === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    String(formData.status || "").toUpperCase() === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    String(formData.status || "").toUpperCase() === 'CLOSED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                }`}>
                                    {formData.status ? formData.status.charAt(0).toUpperCase() + formData.status.slice(1).toLowerCase() : "Open"}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Applied Tags</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                <select 
                                    value={formData.tags && Array.isArray(formData.tags) && formData.tags.length > 0 ? String(formData.tags[0].id) : ""}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const selectedTag = AVAILABLE_TAGS.find(t => String(t.id) === String(e.target.value));
                                            if (selectedTag) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    tags: [selectedTag]
                                                }));
                                            }
                                        } else {
                                            setFormData(prev => ({
                                                ...prev,
                                                tags: []
                                            }));
                                        }
                                    }}
                                    className={`${inputClass} pl-11 appearance-none`}
                                >
                                    <option value="" className="bg-[#1F192E]">No Tag Selected</option> 
                                    {AVAILABLE_TAGS.map((tagObj) => (
                                        <option key={String(tagObj.id)} value={String(tagObj.id)} className="bg-[#1F192E]">
                                            {tagObj.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-between gap-4 pt-8">
                        <button 
                            type="button" 
                            onClick={handleDelete} 
                            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-bold text-sm transition-all shadow-lg shadow-red-500/5"
                        >
                            <Trash2 size={16} /> Delete Contact
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 flex items-center justify-center gap-2 bg-[#BE7EC7] hover:bg-[#a66bb0] text-white font-bold py-3.5 rounded-2xl transition-all shadow-xl shadow-[#BE7EC7]/20 transform active:scale-95"
                        >
                            <Check size={18} /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}