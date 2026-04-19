"use client";
import React, { useState, useEffect, useMemo } from 'react'; 

import { DEFAULT_TAGS } from "@/app/data/defaultTags";

import ContactDetail from '@/app/components/Contacts/ContactDetail'; 
import FilterPopup from '@/app/components/Modals/FilterPopup';
import AddContactModal from '@/app/components/Contacts/AddContact';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    Search, Plus, FileDown, Filter, Building2, Trash2, 
    Facebook, MessageCircle, MoreVertical, Check 
} from "lucide-react";

const AVAILABLE_STATUSES = ["New Chat", "Open", "Pending", "Closed"];

export default function ContactList() {
    const [contacts, setContacts] = useState([]); 
    const [isLoaded, setIsLoaded] = useState(false); 

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [availableTags, setAvailableTags] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({
        channel: null,
        tag: null,
        status: null
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterCompany, setFilterCompany] = useState(null);
    const [isCompanyFilterOpen, setIsCompanyFilterOpen] = useState(false);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const response = await fetch("/api/customers");
                if (!response.ok) throw new Error("Failed to fetch contacts");
                const data = await response.json();
                setContacts(data);
            } catch (error) {
                console.error("Failed to load contacts", error);
            } finally {
                setIsLoaded(true);
            }
        };
        fetchContacts();
    }, []);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch("/api/tags");
                if (!response.ok) throw new Error("Failed to fetch tags");
                const data = await response.json();
                setAvailableTags(data);
            } catch (error) {
                console.error("Failed to load tags", error);
            }
        };
        fetchTags();
    }, []);

    const availableCompanies = useMemo(() => [...new Set(contacts.map(c => c.company).filter(Boolean))], [contacts]);
    const availableChannels = useMemo(() => [...new Set(contacts.map(c => c.channel).filter(Boolean))], [contacts]);

    const handleRowClick = (contact) => { setSelectedContact(contact); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedContact(null); };

    const handleSaveChanges = async (updatedContact) => {
        const contactToSave = { ...updatedContact };
        Object.keys(contactToSave).forEach(key => { if (contactToSave[key] === "") contactToSave[key] = null; });
        
        try {
            const response = await fetch(`/api/customers/${contactToSave.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: contactToSave.name,
                    email: contactToSave.email,
                    phone: contactToSave.phone,
                    company: contactToSave.company,
                    country: contactToSave.country,
                    tags: contactToSave.tags,
                    chat_session_id: contactToSave.chat_session_id
                })
            });

            if (!response.ok) throw new Error("Failed to update contact");
            const updatedData = await response.json();
            const newContacts = contacts.map(c => c.id === contactToSave.id ? updatedData : c);
            setContacts(newContacts);
            handleCloseModal(); 
        } catch (error) {
            console.error("Failed to update contact", error);
        }
    };

    const handleDeleteContact = async (contactId) => {
        try {
            const response = await fetch(`/api/customers/${contactId}`, {
                method: "DELETE"
            });

            if (!response.ok) throw new Error("Failed to delete contact");
            const newContacts = contacts.filter(c => c.id !== contactId);
            setContacts(newContacts);
        } catch (error) {
            console.error("Failed to delete contact", error);
        }
    };

    const handleDeleteClick = () => { setIsDeleteModalOpen(true); };

    const confirmDelete = async () => {
        try {
            // รอรับ Response จากทุกๆ การลบ
            const responses = await Promise.all(selectedIds.map(id => 
                fetch(`/api/customers/${id}`, { method: "DELETE" })
            ));

            // เช็คว่ามี API ตัวไหนคืนค่าพังกลับมาไหม (เช่น Status 500)
            const allOk = responses.every(res => res.ok);
            if (!allOk) {
                throw new Error("Some deletions failed on the server.");
            }

            // ถ้าฝั่ง Server ลบสำเร็จ 100% ค่อยอัปเดตหน้าจอ React
            const newContacts = contacts.filter(c => !selectedIds.includes(c.id));
            setContacts(newContacts);
            setSelectedIds([]);
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error("Failed to delete contacts", error);
            alert("เกิดข้อผิดพลาดในการลบข้อมูล กรุณาลองใหม่อีกครั้ง"); // แจ้งเตือนผู้ใช้
        }
    };

    const handleAddContact = async (newContactData) => {
        try {
            const response = await fetch("/api/customers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newContactData)
            });

            if (!response.ok) throw new Error("Failed to add contact");
            const newContact = await response.json();
            setContacts(prevContacts => [newContact, ...prevContacts]);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Failed to add contact", error);
        }
    };

    const filteredContacts = useMemo(() => {
        const filtered = contacts.filter(contact => {
            const nameMatch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
            const channelMatch = !filters.channel || contact.channel === filters.channel;
            const tagMatch = !filters.tag || (Array.isArray(contact.tags) ? contact.tags.some(t => (typeof t === 'object' ? t.name : t) === filters.tag) : contact.tags === filters.tag);
            const statusMatch = !filters.status || contact.status === filters.status;
            const companyMatch = !filterCompany || contact.company === filterCompany;
            return nameMatch && channelMatch && tagMatch && statusMatch && companyMatch;
        });

        return filtered.sort((a, b) => {
            const statusOrder = { 
                "New Chat": 1, 
                "NEW": 1,
                "Pending": 2, 
                "PENDING": 2,
                "Open": 3, 
                "OPEN": 3,
                "Closed": 4,
                "CLOSED": 4
            };
            return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        });
    }, [contacts, searchTerm, filters, filterCompany]);

    const handleSelectAll = (e) => {
        if (e.target.checked) { setSelectedIds(filteredContacts.map(c => c.id)); } else { setSelectedIds([]); }
    };
    const handleSelectOne = (e, id) => {
        e.stopPropagation(); 
        if (selectedIds.includes(id)) { setSelectedIds(prev => prev.filter(itemId => itemId !== id)); } else { setSelectedIds(prev => [...prev, id]); }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Contact List Report", 14, 15);
        const tableColumn = ["Name", "Company", "Channel", "Phone", "Email", "Status"];
        const tableRows = filteredContacts.map(c => [c.name, c.company || "-", c.channel || "-", c.phone || "-", c.email || "-", c.status || "-"]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 25, theme: 'grid' });
        doc.save("contacts.pdf");
    };

    const getStatusStyle = (status) => {
        const s = String(status || "").toUpperCase();
        switch(s) {
            case 'OPEN': return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case 'PENDING': return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case 'CLOSED': return "bg-red-500/10 text-red-400 border-red-500/20";
            case 'NEW':
            case 'NEW CHAT': return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
        }
    };

    const CHECKBOX_CLASS = "appearance-none h-4 w-4 border border-white/20 rounded-md bg-white/5 checked:bg-[#BE7EC7] checked:border-[#BE7EC7] focus:outline-none cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-[10px] checked:after:left-[3px] checked:after:top-[-1px] transition-all";

    return (
        <div className="w-full h-[95vh] p-4 lg:p-6 "> 
            <div className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-2xl flex flex-col h-full overflow-hidden">
                
                {/* Header Section */}
                <div className="p-8 pb-4 shrink-0">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-white text-3xl font-extrabold tracking-tight">Contacts</h1>
                            <p className="text-white/40 text-sm mt-1">Manage your customer relationships and leads</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedIds.length > 0 && (
                                <button onClick={handleDeleteClick} className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-4 py-2.5 rounded-2xl transition-all font-bold text-sm">
                                    <Trash2 size={16} /> Delete ({selectedIds.length})
                                </button>
                            )}
                            <button onClick={handleExportPDF} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 px-4 py-2.5 rounded-2xl transition-all font-bold text-sm">
                                <FileDown size={16} /> Export PDF
                            </button>
                            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 bg-[#BE7EC7] hover:bg-[#a66bb0] text-white px-5 py-2.5 rounded-2xl transition-all font-bold text-sm shadow-lg shadow-[#BE7EC7]/20">
                                <Plus size={18} /> Add Contact
                            </button>
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-wrap items-center gap-4 bg-white/[0.02] p-3 rounded-[2rem] border border-white/5">
                        <div className="flex-1 min-w-[240px] relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#BE7EC7] transition-colors" size={18} />
                            <input 
                                type="text" 
                                className="w-full bg-white/5 border border-white/5 focus:border-[#BE7EC7]/50 focus:bg-white/[0.08] outline-none rounded-2xl py-2.5 pl-12 pr-4 text-white text-sm transition-all" 
                                placeholder="Search by name, email or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Company Filter */}
                            <div className="relative">
                                <button onClick={() => setIsCompanyFilterOpen(!isCompanyFilterOpen)} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${filterCompany ? 'bg-[#BE7EC7]/10 border-[#BE7EC7]/30 text-[#BE7EC7]' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}>
                                    <Building2 size={16} /> {filterCompany || "Company"}
                                </button>
                                {isCompanyFilterOpen && (
                                    <div className="absolute z-50 top-full mt-2 w-56 bg-[#1F192E] border border-white/10 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto">
                                        <div className="p-2 text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Select Company</div>
                                        <div className={`p-2.5 rounded-xl cursor-pointer hover:bg-white/5 text-sm text-white/70 ${!filterCompany ? 'bg-[#BE7EC7]/20 text-[#BE7EC7]' : ''}`} onClick={() => { setFilterCompany(null); setIsCompanyFilterOpen(false); }}>All Companies</div>
                                        {availableCompanies.map((comp) => (
                                            <div key={comp} className={`p-2.5 rounded-xl cursor-pointer hover:bg-white/5 text-sm text-white/70 ${filterCompany === comp ? 'bg-[#BE7EC7]/20 text-[#BE7EC7]' : ''}`} onClick={() => { setFilterCompany(comp); setIsCompanyFilterOpen(false); }}>{comp}</div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Filter Popup Trigger */}
                            <div className="relative">
                                <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${isFilterOpen ? 'bg-[#BE7EC7] text-white border-[#BE7EC7]' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'}`}>
                                    <Filter size={16} /> Filters
                                </button>
                                <FilterPopup isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} currentFilters={filters} onApplyFilters={(newFilters) => setFilters(newFilters)} AVAILABLE_CHANNELS={availableChannels} AVAILABLE_TAGS={availableTags} AVAILABLE_STATUSES={AVAILABLE_STATUSES} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-hidden flex flex-col px-8 pb-8">
                    <div className="flex-1 overflow-auto custom-scrollbar border border-white/5 rounded-[2rem] bg-black/20 shadow-inner">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead className="sticky top-0 bg-[#161223] z-10">
                                <tr className="border-b border-white/5">
                                    <th className="py-5 px-6 w-10">
                                        <input type="checkbox" className={CHECKBOX_CLASS} onChange={handleSelectAll} checked={filteredContacts.length > 0 && selectedIds.length === filteredContacts.length}/>
                                    </th>
                                    <th className="py-5 px-4 text-[11px] font-black uppercase tracking-widest text-white/30">Contact Name</th>
                                    <th className="py-5 px-4 text-[11px] font-black uppercase tracking-widest text-white/30">Channel</th>
                                    <th className="py-5 px-4 text-[11px] font-black uppercase tracking-widest text-white/30">Company</th>
                                    <th className="py-5 px-4 text-[11px] font-black uppercase tracking-widest text-white/30">Email Address</th>
                                    <th className="py-5 px-4 text-[11px] font-black uppercase tracking-widest text-white/30">Phone Number</th>
                                    <th className="py-5 px-4 text-[11px] font-black uppercase tracking-widest text-white/30">Tags</th>
                                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-widest text-white/30">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredContacts.map((contact) => (
                                    <tr key={contact.id} onClick={() => handleRowClick(contact)} className="group hover:bg-white/[0.03] cursor-pointer transition-colors">
                                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" className={CHECKBOX_CLASS} onChange={(e) => handleSelectOne(e, contact.id)} checked={selectedIds.includes(contact.id)} />
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                                                    <img src={contact.imgUrl} alt={contact.name} className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-white font-bold text-sm group-hover:text-[#BE7EC7] transition-colors">{contact.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                {contact.channel === 'Facebook' ? <Facebook size={14} className="text-blue-500" /> : <MessageCircle size={14} className="text-green-500" />}
                                                <span className="text-white/60 text-xs font-medium">{contact.channel || "N/A"}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-white/60 text-xs font-medium">{contact.company || "—"}</td>
                                        <td className="py-4 px-4 text-white/60 text-xs font-medium">{contact.email || "—"}</td>
                                        <td className="py-4 px-4 text-white/60 text-xs font-medium tracking-tighter">
                                            {contact.phone ? `${contact.phonePrefix || ""}${contact.phone}` : "—"}
                                        </td>
                                        <td className="py-4 px-4">
                                            {(() => {
                                                if (!Array.isArray(contact.tags) || contact.tags.length === 0) return <span className="text-white/20">—</span>;
                                                const tag = contact.tags[0];
                                                const tagName = typeof tag === 'object' ? tag.name : tag;
                                                const tagColor = typeof tag === 'object' ? tag.color : '#BE7EC7';
                                                if (!tagName) return <span className="text-white/20">—</span>;
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border shadow-sm" style={{ backgroundColor: `${tagColor}22`, color: tagColor, borderColor: `${tagColor}44` }}>
                                                        {tagName}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(contact.status)}`}>
                                                {contact.status ? contact.status.charAt(0).toUpperCase() + contact.status.slice(1).toLowerCase() : "N/A"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredContacts.length === 0 && isLoaded && (
                            <div className="flex flex-col items-center justify-center py-20 text-white/20">
                                <Search size={48} strokeWidth={1} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">No contacts found</p>
                                <p className="text-sm">Try adjusting your search or filters</p>
                            </div>
                        )}
                    </div>
                </div> 
            </div>

            {/* Modal Components */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="bg-[#1F192E] border border-white/10 rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={40} className="text-red-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Confirm Deletion</h3>
                        <p className="text-white/40 mb-8 leading-relaxed">Are you sure you want to delete <span className="text-white font-bold">{selectedIds.length}</span> selected contacts? This action is permanent and cannot be undone.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all border border-white/5">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 transition-all">Delete Records</button>
                        </div>
                    </div>
                </div>
            )}
            
            {isModalOpen && selectedContact && ( 
                <ContactDetail contact={selectedContact} onClose={handleCloseModal} onSave={handleSaveChanges} onDelete={handleDeleteContact} AVAILABLE_TAGS={availableTags} AVAILABLE_COMPANIES={availableCompanies} /> 
            )}
            {isAddModalOpen && ( 
                <AddContactModal onClose={() => setIsAddModalOpen(false)} onAdd={handleAddContact} AVAILABLE_TAGS={availableTags} AVAILABLE_CHANNELS={availableChannels} AVAILABLE_COMPANIES={availableCompanies} /> 
            )}
        </div> 
    );
}