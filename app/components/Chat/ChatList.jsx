"use client";
import React, { useState } from "react";

export default function ChatList({
  chats = [],
  onSelectChat,
  selectedId,
  availableTags = [],
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const getInitials = (name) => {
    return (
      name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?"
    );
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-indigo-500",
      "bg-cyan-500",
    ];
    return colors[(name || "").charCodeAt(0) % colors.length] || "bg-[#BE7EC7]";
  };

  const filteredChats = chats.filter(
    (chat) =>
      chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // 🔥 ฟังก์ชันแก้บัคโดนดึงกลับแชทเดิม 
  const handleChatClick = (chat) => {
    onSelectChat(chat);
    // เมื่อกดเลือกแชทปุ๊บ ให้แอบลบ ?id= ออกจากลิงก์ด้านบนแบบเนียนๆ
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("id")) {
        url.searchParams.delete("id");
        window.history.replaceState({}, "", url.toString());
      }
    }
  };

  return (
    <div className="w-80 lg:w-96 bg-[#1E1B29] border border-[#BE7EC7]/10 rounded-3xl flex flex-col overflow-hidden shadow-xl shrink-0">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <h2 className="text-xl font-bold text-white mb-4">Chat List</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 bg-white/5 text-white text-sm placeholder:text-white/30 rounded-xl border border-white/10 focus:border-[#BE7EC7] focus:ring-1 focus:ring-[#BE7EC7] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredChats.length === 0 ? (
          <div className="flex justify-center items-center h-full text-white/40 text-sm">
            No chats found
          </div>
        ) : (
          filteredChats.map((chat) => {
            const lastMsgObj = chat.messages?.[chat.messages.length - 1];
            const rawText = chat.lastMessage || "No messages";
            let time = lastMsgObj?.time || chat.time || "";

            if (time && !time.includes("น.") && !time.includes("AM") && !time.includes("PM")) {
                time = `${time} น.`;
            }

            // 🔥 ความฉลาดใหม่: เช็คว่า "แอดมินเคยตอบหรือยัง?"
            const hasAgentReplied = chat.messages?.some(
              (m) => m.from === "me" || m.from === "ADMIN" || m.from === "AGENT"
            );

            // ถ้าแอดมินตอบแล้ว ให้ป้ายบังคับกลายเป็น OPEN ทันที (แม้ DB จะอัปเดตช้า)
            let displayStatus = chat.status?.toUpperCase() || "OPEN";
            if (hasAgentReplied && displayStatus === "NEW") {
              displayStatus = "OPEN";
            }

            // จะเป็น New Chat ของแท้ก็ต่อเมื่อสถานะเป็น NEW และ แอดมินยังไม่ได้ตอบ!
            const isNewChat = displayStatus === "NEW" && !hasAgentReplied;

            const isImage =
              lastMsgObj?.type === "IMAGE" ||
              chat.lastMessageType === "IMAGE" ||
              rawText === "IMAGE" ||
              rawText.includes("/api/line/image/") ||
              rawText.includes("/api/telegram/file/") ||
              (rawText.includes("http") && rawText.match(/\.(jpeg|jpg|gif|png|webp)/i)) ||
              rawText.includes("fbcdn.net") ||
              rawText.includes("line-scdn.net") ||
              rawText.includes("lookaside.fbsbx.com") ||
              rawText.includes("ig_messaging_cdn") ||
              rawText.includes("cdninstagram.com");

            const isMe =
              lastMsgObj?.from === "me" ||
              lastMsgObj?.from === "ADMIN" ||
              lastMsgObj?.from === "AGENT";

            const isUnread =
              !isMe && chat.unreadCount > 0 && chat.id !== selectedId;

            let displayText = rawText;
            if (isImage) {
              displayText = isMe
                ? "คุณส่งรูปภาพ"
                : `${chat.name?.split(" ")[0] || "ลูกค้า"} ส่งรูปภาพ`;
            } else {
              if (isMe) {
                displayText = rawText.startsWith("คุณ:")
                  ? rawText
                  : `คุณ: ${rawText}`;
              } else if (isUnread && !isNewChat) { 
                const unreadCount = chat.unreadCount;
                displayText = `${unreadCount} ข้อความใหม่`;
              } else {
                displayText = rawText;
              }
            }

            const textStyle = isUnread || isNewChat
              ? "text-white font-bold"
              : "text-white/60 font-normal";
            const nameStyle = isUnread || isNewChat
              ? "text-white font-bold"
              : "text-white/90 font-semibold";

            return (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat)} // 🔥 เรียกใช้ฟังก์ชันแก้บัคดึงกลับ
                className={`p-3.5 border-b border-white/5 cursor-pointer transition-all ${
                  selectedId === chat.id
                    ? "bg-[#BE7EC7]/10 border-l-4 border-l-[#BE7EC7]"
                    : "hover:bg-white/5 border-l-4 border-l-transparent"
                }`}
              >
                <div className="flex items-start justify-between w-full">
                  
                  {/* ฝั่งซ้าย: รูปและรายละเอียด */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-3">
                    {/* Avatar */}
                    <div className="relative shrink-0 w-[52px] h-[52px]">
                      {chat.imgUrl ? (
                        <img
                          src={chat.imgUrl}
                          alt={chat.name}
                          className="w-full h-full rounded-full object-cover shadow-sm bg-white/5 border border-white/10"
                        />
                      ) : (
                        <div
                          className={`w-full h-full rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm ${getAvatarColor(chat.name)}`}
                        >
                          {getInitials(chat.name)}
                        </div>
                      )}

                      {/* Badge Platform */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center bg-[#1E1B29] border-2 border-[#1E1B29] shadow-lg">
                        {chat.platform === "INSTAGRAM" ? (
                          <div className="w-full h-full rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center">
                            <i className="fa-brands fa-instagram text-white text-[11px]"></i>
                          </div>
                        ) : chat.platform === "FACEBOOK" ? (
                          <div className="w-full h-full rounded-full bg-[#0866FF] flex items-center justify-center">
                            <i className="fa-brands fa-facebook-f text-white text-[11px]"></i>
                          </div>
                        ) : chat.platform === "LINE" ? (
                          <div className="w-full h-full rounded-full bg-[#06C755] flex items-center justify-center">
                            <i className="fa-brands fa-line text-white text-[11px]"></i>
                          </div>
                        ) : chat.platform === "TELEGRAM" ? (
                          <div className="w-full h-full rounded-full bg-[#0088cc] flex items-center justify-center">
                            <i className="fa-brands fa-telegram text-white text-[11px]"></i>
                          </div>
                        ) : (
                          <div className="w-full h-full rounded-full bg-slate-600 flex items-center justify-center">
                            <i className="fa-solid fa-circle-question text-white text-[11px]"></i>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3
                        className={`truncate text-[15px] leading-tight mb-0.5 ${nameStyle}`}
                      >
                        {chat.name || "Unknown"}
                      </h3>

                      <div
                        className={`text-[13px] w-full mb-1.5 truncate ${textStyle}`}
                      >
                        {displayText}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        
                        {/* 🔥 ถ้าเป็น New Chat จะโชว์ป้ายแดง NEW CHAT แทนป้ายเขียว OPEN ทันที */}
                        {isNewChat ? (
                          <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border bg-red-500/10 text-red-500 border-red-500/20">
                            NEW CHAT
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md border ${
                              displayStatus === "OPEN"
                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                : displayStatus === "PENDING"
                                  ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                  : "bg-white/5 text-white/50 border-white/10"
                            }`}
                          >
                            {displayStatus}
                          </span>
                        )}

                        {/* เรนเดอร์ Tags */}
                        {(chat.tags || []).map((tagObj, i) => {
                          const tagName = typeof tagObj === 'object' ? tagObj.name : tagObj;
                          if (!tagName) return null;

                          const tagColor = typeof tagObj === 'object' ? tagObj.color : '#BE7EC7';
                          const tagEmoji = typeof tagObj === 'object' ? tagObj.emoji : '';

                          return (
                            <span
                              key={`${tagName}-${i}`}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md border flex items-center gap-1 whitespace-nowrap"
                              style={{ color: tagColor, borderColor: `${tagColor}40`, backgroundColor: `${tagColor}10` }}
                            >
                              {tagEmoji && <span>{tagEmoji}</span>}
                              {tagName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ฝั่งขวา: แสดงแค่เวลาอย่างเดียว มุมขวาบน */}
                  <div className="flex flex-col items-end shrink-0 pt-0.5">
                    {time && (
                      <span className="text-white/40 text-[10px] font-medium tracking-wide">
                        {time}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}