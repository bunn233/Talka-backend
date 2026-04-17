"use client";
import React, { useState, useEffect } from 'react';

export default function AddNote({ onClose, chatId }) {
    const [title, setTitle] = useState("");
    const [noteText, setNoteText] = useState("");
    const [currentNotes, setCurrentNotes] = useState([]);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const fetchNotes = async () => {
        if (!chatId) return;
        try {
            const res = await fetch(`/api/chat-sessions/${chatId}/notes`);
            if (res.ok) {
                const data = await res.json();
                setCurrentNotes(data.notes || []);
            }
        } catch (e) { 
            console.error(e); 
        } finally { 
            setIsLoading(false); 
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [chatId]);

    const handleEditClick = (note) => {
        setEditingId(note.note_id || note.id);
        setTitle(note.title || "");
        setNoteText(note.content || note.text || "");
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setTitle("");
        setNoteText("");
    };

    const handleSave = async () => {
        if (!title || !noteText || !chatId || isSaving) return; 
        setIsSaving(true);
        try {
            if (editingId) {
                const res = await fetch(`/api/chat-sessions/${chatId}/notes`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ noteId: editingId, title, text: noteText })
                });
                if (res.ok) {
                    handleCancelEdit();
                    await fetchNotes(); 
                }
            } else {
                const res = await fetch(`/api/chat-sessions/${chatId}/notes`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ title, text: noteText })
                });
                if (res.ok) {
                    setTitle(""); 
                    setNoteText("");
                    await fetchNotes(); 
                }
            }
        } catch (e) { 
            console.error(e); 
        } finally {
            setIsSaving(false); 
        }
    };

    const toggleSoftDelete = async (id, currentStatus) => {
        setCurrentNotes(prev => prev.map(n => (n.note_id === id || n.id === id) ? { ...n, is_deleted: !currentStatus } : n));
        try {
            await fetch(`/api/chat-sessions/${chatId}/notes`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteId: id, is_deleted: !currentStatus })
            });
            if (editingId === id && !currentStatus) handleCancelEdit();
        } catch (e) {
            console.error(e);
            await fetchNotes(); 
        }
    };

    const handleHardDelete = async (id) => {
        if (!window.confirm("Are you sure you want to permanently delete this note?")) return;
        setCurrentNotes(prev => prev.filter(note => (note.note_id || note.id) !== id));
        try {
            await fetch(`/api/chat-sessions/${chatId}/notes`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ noteId: id })
            });
            await fetchNotes(); 
        } catch (e) {
            console.error(e);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Just now";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Just now";
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        // 🔥 แก้ไขคลาสตรงนี้: เปลี่ยน max-h เป็น h-full และเอา self-start ออก
        <div className="w-[320px] h-full max-h-full bg-[#1E1B29] border border-[#BE7EC7]/10 rounded-3xl shadow-2xl p-6 flex flex-col shrink-0 overflow-hidden relative">
            <div className="flex justify-between items-center mb-5 shrink-0">
                <h2 className="text-white text-xl font-bold">
                    {editingId ? "Edit Note" : "Add Note"}
                </h2>
                {editingId && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#BE7EC7] bg-[#BE7EC7]/10 px-2 py-1 rounded-md animate-pulse">
                        Editing
                    </span>
                )}
            </div>
            
            {/* 🔥 เติม min-h-0 เพื่อป้องกันกล่องทะลุจอ */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 min-h-0">
                <div className="flex flex-col gap-4">
                    <input 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        className="w-full bg-white/5 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-[#BE7EC7] focus:ring-1 focus:ring-[#BE7EC7] border border-white/10 transition-all placeholder:text-white/20" 
                        placeholder="Topic..." 
                    />
                    <textarea 
                        value={noteText} 
                        onChange={(e) => setNoteText(e.target.value)} 
                        className="w-full h-24 bg-white/5 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-[#BE7EC7] focus:ring-1 focus:ring-[#BE7EC7] border border-white/10 transition-all placeholder:text-white/20 resize-none custom-scrollbar" 
                        placeholder="Write details..." 
                    />
                </div>
                
                <div className="flex gap-2 mt-5 mb-6">
                    {editingId && (
                        <button 
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 font-semibold py-2.5 rounded-xl transition-all text-sm"
                        >
                            Cancel
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={!title || !noteText || isSaving} 
                        className="flex-[2] w-full bg-[#BE7EC7] hover:bg-[#a66bb0] disabled:bg-white/10 disabled:text-white/30 text-white font-semibold py-2.5 rounded-xl flex justify-center items-center gap-2 transition-all shadow-lg shadow-[#BE7EC7]/20 disabled:shadow-none text-sm"
                    >
                        {isSaving ? <span className="animate-spin">⏳</span> : null}
                        {isSaving ? "Saving..." : editingId ? "Update Note" : "Save Note"}
                    </button>
                </div>

                <div className="border-t border-white/5 pt-5">
                    <h3 className="text-white/60 font-semibold mb-3 text-xs uppercase tracking-widest">History ({currentNotes.length})</h3>
                    <div className="flex flex-col gap-3">
                        {isLoading ? <p className="text-white/30 text-xs text-center py-4">Loading...</p> : 
                        currentNotes.map((note) => {
                            const uniqueId = note.note_id || note.id; 
                            const isDeleted = note.is_deleted === true; 
                            const isEditingThis = editingId === uniqueId;

                            return (
                                <div key={uniqueId} className={`bg-white/5 border rounded-xl p-3.5 relative group transition-all ${isDeleted ? 'opacity-40 grayscale border-white/5' : isEditingThis ? 'border-[#BE7EC7]/50 bg-[#BE7EC7]/5' : 'border-white/5 hover:bg-white/10'}`}>
                                    <div className="flex justify-between items-start mb-1.5 pr-14">
                                        <h4 className={`text-white font-bold text-sm truncate ${isDeleted ? 'line-through text-white/40' : ''}`}>
                                            {note.title}
                                        </h4>
                                        
                                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            {!isDeleted ? (
                                                <>
                                                    <button onClick={() => handleEditClick(note)} title="Edit Note" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                                                        <i className="fa-solid fa-pen text-[10px] text-white/70"></i>
                                                    </button>
                                                    <button onClick={() => toggleSoftDelete(uniqueId, isDeleted)} title="Move to Trash" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 transition-all">
                                                        <i className="fa-solid fa-trash-can text-[10px] text-red-400"></i>
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => toggleSoftDelete(uniqueId, isDeleted)} title="Restore Note" className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-green-500/20 transition-all">
                                                        <span className="text-green-400 text-[10px]">↺</span>
                                                    </button>
                                                    <button onClick={() => handleHardDelete(uniqueId)} title="Delete Permanently" className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/30 transition-all border border-red-500/20">
                                                        <i className="fa-solid fa-trash-can text-[10px] text-red-500"></i>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-xs mb-2 leading-relaxed ${isDeleted ? 'line-through text-white/20' : 'text-white/60'}`}>{note.content || note.text}</p>
                                    <p className="text-white/20 text-[9px] text-right font-medium tracking-wide">{formatDate(note.created_at)}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            {/* ปุ่ม Done อยู่ด้านล่างเสมอ */}
            <button onClick={onClose} className="w-full mt-5 shrink-0 bg-[#BE7EC7]/10 hover:bg-[#BE7EC7]/20 text-[#BE7EC7] border border-[#BE7EC7]/20 hover:border-[#BE7EC7]/40 font-semibold py-2.5 rounded-xl transition-all">Done</button>
        </div>
    );
}