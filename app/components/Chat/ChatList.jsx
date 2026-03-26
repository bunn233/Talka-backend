"use client";
import React, { useState } from "react";

export default function ChatList({ chats = [], onSelectChat, selectedId, availableTags = [] }) {
    const [searchTerm, setSearchTerm] = useState("");

    const getInitials = (name) => {
        return name
            ?.split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?";
    };

    const getAvatarColor = (name) => {
        const colors = [
            "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500",
            "bg-yellow-500", "bg-red-500", "bg-indigo-500", "bg-cyan-500"
        ];
        return colors[name.charCodeAt(0) % colors.length];
    };

    const filteredChats = chats.filter(chat =>
        chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-96 bg-linear-to-b from-gray-900/80 to-gray-800/60 border-r border-gray-700/50 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700/50">
                <h2 className="text-xl font-bold text-white mb-4">Chat List</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800/50 text-white placeholder-gray-500 rounded-lg border border-gray-700/50 focus:border-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {filteredChats.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-400">
                        No chats found
                    </div>
                ) : (
                    filteredChats.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => onSelectChat(chat)}
                            className={`p-3 border-b border-gray-700/30 cursor-pointer transition-colors ${
                                selectedId === chat.id
                                    ? "bg-gray-700/60 border-l-4 border-l-blue-500"
                                    : "hover:bg-gray-800/40"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-bold ${getAvatarColor(chat.name)}`}>
                                    {getInitials(chat.name)}
                                </div>

                                {/* Chat Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-white truncate">
                                            {chat.name || "Unknown"}
                                        </h3>
                                        <span className="text-xs text-gray-400 ml-2 shrink-0">
                                            {chat.time}
                                        </span>
                                    </div>

                                    {/* Last Message */}
                                    <p className="text-sm text-gray-400 truncate">
                                        {chat.lastMessage || "No messages"}
                                    </p>

                                    {/* Status Badge */}
                                    <div className="flex gap-2 mt-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            chat.status === "OPEN"
                                                ? "bg-green-500/20 text-green-400"
                                                : chat.status === "PENDING"
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : "bg-gray-500/20 text-gray-400"
                                        }`}>
                                            {chat.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
