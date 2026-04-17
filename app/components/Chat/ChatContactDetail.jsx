"use client";
import React, { useState, useEffect } from 'react';

export default function ContactDetails({ onClose, contact, onUpdateContact }) {
  
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingCountry, setIsEditingCountry] = useState(false);

  useEffect(() => {
    if (contact) {
      setPhone(contact.phone || "");
      setEmail(contact.email || "");
      setCountry(contact.country || "");
    }
    setIsEditingPhone(false);
    setIsEditingEmail(false);
    setIsEditingCountry(false);
  }, [contact]);

  if (!contact) {
    return (
      <div className="w-[320px] max-h-[85vh] mt-3 ml-3 bg-[#1E1B29] border border-[#BE7EC7]/10 rounded-3xl shadow-2xl p-6 flex items-center justify-center self-start text-[#BE7EC7] font-medium text-sm">
        Loading...
      </div>
    );
  }

  const handleSave = async (field) => {
    if (typeof onUpdateContact !== 'function') {
      console.error("onUpdateContact is not a function. Check page.jsx");
      return; 
    }

    // 1. อัปเดตหน้าจอทันทีเพื่อให้ผู้ใช้รู้สึกว่าเร็ว
    if (field === 'phone') {
      onUpdateContact(contact.id, { phone: phone }); 
      setIsEditingPhone(false); 
    }
    if (field === 'email') {
      onUpdateContact(contact.id, { email: email }); 
      setIsEditingEmail(false); 
    }
    if (field === 'country') {
      onUpdateContact(contact.id, { country: country });
      setIsEditingCountry(false);
    }

    try {
      await fetch(`/api/chat-sessions/${contact.id}/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, email, country }) 
      });
    } catch (error) {
      console.error("❌ Failed to save contact info to database:", error);
    }
  };

  const EditButton = ({ onClick }) => (
    <button 
        onClick={onClick}
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-[#BE7EC7]/20 text-white/50 hover:text-[#BE7EC7] transition-all border border-transparent hover:border-[#BE7EC7]/30"
        title="Edit"
    >
        <i className="fa-solid fa-pen text-xs"></i>
    </button>
  );

  return (
    <div className="w-[320px] max-h-[85vh] mt-3 ml-3 bg-[#1E1B29] border border-[#BE7EC7]/10 rounded-3xl shadow-2xl p-6 flex flex-col self-start overflow-y-auto custom-scrollbar">
      
      <h2 className="text-white text-xl font-bold mb-5">Contact details</h2>

      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        {/* 🔥 แก้ไขการแสดงรูปภาพตรงนี้ครับ */}
        <div className="w-16 h-16 bg-gradient-to-br from-[#BE7EC7] to-[#8a55b5] rounded-2xl flex items-center justify-center text-3xl shadow-lg shrink-0 text-white border border-white/10 overflow-hidden">
          {contact.imgUrl ? (
            <img src={contact.imgUrl} alt={contact.name} className="w-full h-full object-cover" />
          ) : (
            contact.avatar || contact.name?.charAt(0).toUpperCase() || "U"
          )}
        </div>
        
        <div className="min-w-0">
          <h3 className="text-white font-semibold text-lg truncate leading-tight mb-1">{contact.name}</h3>
          <span className="text-[10px] uppercase tracking-wider text-[#BE7EC7] bg-[#BE7EC7]/10 px-2 py-0.5 rounded-md border border-[#BE7EC7]/20">
            Customer
          </span>
        </div>
      </div>

      {/* Contact Fields */}
      <div className="space-y-5">
        <h4 className="text-white/60 font-semibold text-xs uppercase tracking-widest mb-2 border-b border-white/5 pb-2">Information</h4>

        {/* Phone */}
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-wider mb-1 block">Phone Number</label>
          {isEditingPhone ? (
            <div className="flex gap-2 mt-1 animate-fade-in">
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-white/5 text-white text-sm rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-[#BE7EC7] border border-white/10 placeholder:text-white/20 transition-all"
                placeholder="0123456789"
                autoFocus
              />
              <button onClick={() => handleSave('phone')} className="bg-[#BE7EC7]/20 hover:bg-[#BE7EC7]/40 text-[#BE7EC7] w-9 h-9 rounded-xl flex items-center justify-center transition-colors">
                <i className="fa-solid fa-check"></i>
              </button>
              <button onClick={() => setIsEditingPhone(false)} className="bg-white/5 hover:bg-white/10 text-white/50 w-9 h-9 rounded-xl flex items-center justify-center transition-colors border border-white/5">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white/5 transition-colors -mx-2 group">
              {contact.phone ? (
                <p className="text-white/90 text-sm font-medium">{contact.phone}</p>
              ) : (
                <p className="text-white/30 text-sm italic">Add Phone Number</p>
              )}
              <EditButton onClick={() => setIsEditingPhone(true)} />
            </div>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-wider mb-1 block">Email Address</label>
          {isEditingEmail ? (
            <div className="flex gap-2 mt-1 animate-fade-in">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/5 text-white text-sm rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-[#BE7EC7] border border-white/10 placeholder:text-white/20 transition-all"
                placeholder="example@email.com"
                autoFocus
              />
              <button onClick={() => handleSave('email')} className="bg-[#BE7EC7]/20 hover:bg-[#BE7EC7]/40 text-[#BE7EC7] w-9 h-9 rounded-xl flex items-center justify-center transition-colors">
                <i className="fa-solid fa-check"></i>
              </button>
              <button onClick={() => setIsEditingEmail(false)} className="bg-white/5 hover:bg-white/10 text-white/50 w-9 h-9 rounded-xl flex items-center justify-center transition-colors border border-white/5">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white/5 transition-colors -mx-2 group">
              {contact.email ? (
                <p className="text-white/90 text-sm font-medium truncate pr-2">{contact.email}</p>
              ) : (
                <p className="text-white/30 text-sm italic">Add Email Address</p>
              )}
              <EditButton onClick={() => setIsEditingEmail(true)} />
            </div>
          )}
        </div>

        {/* Country */}
        <div>
          <label className="text-white/40 text-[10px] uppercase tracking-wider mb-1 block">Country</label>
          {isEditingCountry ? (
            <div className="flex gap-2 mt-1 animate-fade-in">
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="flex-1 bg-white/5 text-white text-sm rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-[#BE7EC7] border border-white/10 placeholder:text-white/20 transition-all"
                placeholder="e.g. Thailand"
                autoFocus
              />
              <button onClick={() => handleSave('country')} className="bg-[#BE7EC7]/20 hover:bg-[#BE7EC7]/40 text-[#BE7EC7] w-9 h-9 rounded-xl flex items-center justify-center transition-colors">
                <i className="fa-solid fa-check"></i>
              </button>
              <button onClick={() => setIsEditingCountry(false)} className="bg-white/5 hover:bg-white/10 text-white/50 w-9 h-9 rounded-xl flex items-center justify-center transition-colors border border-white/5">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-center p-2 rounded-xl hover:bg-white/5 transition-colors -mx-2 group">
              {contact.country ? (
                <p className="text-white/90 text-sm font-medium">{contact.country}</p>
              ) : (
                <p className="text-white/30 text-sm italic">Add Country</p>
              )}
              <EditButton onClick={() => setIsEditingCountry(true)} />
            </div>
          )}
        </div>
      </div>

      {/* ปุ่ม Done */}
      <button
        onClick={onClose}
        className="w-full mt-8 bg-[#BE7EC7]/10 hover:bg-[#BE7EC7]/20 text-[#BE7EC7] border border-[#BE7EC7]/20 hover:border-[#BE7EC7]/40 font-semibold py-2.5 rounded-xl transition-all"
      >
        Done
      </button>
    </div>
  );
}