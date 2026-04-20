"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, MessageSquareOff, MessageSquareText, CheckCircle2, ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';

export default function DashboardStats() {
    const router = useRouter();
    const [stats, setStats] = useState({
        newCustomers: 0,
        newCustomersTrend: 0,
        unreplied: 0,
        unrepliedTrend: 0,
        incomingMessages: 0,
        incomingTrend: 0,
        closedChatPercent: "0.00",
        closedChatTrend: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("/api/dashboard/stats");
                if (!res.ok) throw new Error("Failed to fetch");
                const data = await res.json();
                setStats({
                    newCustomers: data.newCustomers || 0,
                    newCustomersTrend: parseFloat(data.newCustomersTrend) || 0,
                    unreplied: data.unreplied || 0,
                    unrepliedTrend: parseFloat(data.unrepliedTrend) || 0,
                    incomingMessages: data.incomingMessages || 0,
                    incomingTrend: parseFloat(data.incomingTrend) || 0,
                    closedChatPercent: data.closedChatPercent || "0.00",
                    closedChatTrend: parseFloat(data.closedChatTrend) || 0
                });
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching stats:", error);
                setIsLoading(false);
            }
        };
        fetchDashboardStats();
    }, []);

    const statCards = [
        {
            label: "New Customers",
            value: stats.newCustomers,
            icon: <Users size={18} />,
            color: "text-[#BE7EC7]",
            bg: "bg-[#BE7EC7]/10",
            trend: { 
              value: `${Math.abs(stats.newCustomersTrend)}%`, 
              type: stats.newCustomersTrend >= 0 ? "up" : "down", 
              text: "vs yesterday" 
            },
            timeframe: "TODAY",
            route: "/contact",
            actionText: "VIEW CONTACTS"
        },
        {
            label: "Unreplied",
            value: stats.unreplied,
            unit: "Convs",
            icon: <MessageSquareOff size={18} />,
            color: "text-amber-400",
            bg: "bg-amber-400/10",
            trend: { 
              value: Math.abs(stats.unrepliedTrend).toString(), 
              type: stats.unrepliedTrend >= 0 ? "up" : "down", 
              isGood: stats.unrepliedTrend <= 0, 
              text: "vs last hour" 
            },
            timeframe: "LIVE",
            route: "/chat/allchat?filter=OPEN",
            actionText: "REPLY NOW"
        },
        {
            label: "Incoming",
            value: stats.incomingMessages,
            unit: "Msgs",
            icon: <MessageSquareText size={18} />,
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            trend: { 
              value: `${Math.abs(stats.incomingTrend)}%`, 
              type: stats.incomingTrend >= 0 ? "up" : "down", 
              text: "vs yesterday" 
            },
            timeframe: "TODAY",
            route: "/chat/allchat",
            actionText: "VIEW MESSAGES"
        },
        {
            label: "Resolution",
            value: `${stats.closedChatPercent}%`,
            icon: <CheckCircle2 size={18} />,
            color: "text-emerald-400",
            bg: "bg-emerald-400/10",
            trend: { 
              value: `${Math.abs(stats.closedChatTrend)}%`, 
              type: stats.closedChatTrend >= 0 ? "up" : "down", 
              isGood: stats.closedChatTrend >= 0, 
              text: "vs last week" 
            },
            timeframe: "THIS WEEK",
            route: "/Report/conversation",
            actionText: "VIEW REPORTS"
        }
    ];

    return (
        <div className="w-full mb-6"> 
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card, index) => {
                    const isZero = parseFloat(card.trend.value) === 0;
                    const isTrendGood = card.trend.isGood !== undefined ? card.trend.isGood : card.trend.type === "up";
                    
                    let trendColor = "text-white/40"; // neutral by default for zero
                    if (!isZero) {
                        trendColor = isTrendGood ? "text-emerald-400" : "text-rose-400";
                    }
                    
                    const TrendIcon = card.trend.type === "up" ? TrendingUp : TrendingDown;

                    return (
                        <div 
                            key={index} 
                            onClick={() => router.push(card.route)}
                            className="bg-[#1F192E] border border-white/5 rounded-[1.5rem] p-5 hover:border-[#BE7EC7]/30 transition-all duration-300 group cursor-pointer shadow-lg shadow-black/20 flex flex-col justify-between h-full"
                        >
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-[1rem] flex items-center justify-center shadow-inner`}>
                                            {card.icon}
                                        </div>
                                        <div className="bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded-md">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{card.timeframe}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-white/20 group-hover:text-[#BE7EC7] transition-colors uppercase tracking-widest group-hover:underline group-hover:underline-offset-2">
                                        {card.actionText} <ArrowUpRight size={12} />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase tracking-widest text-white/40">
                                        {card.label}
                                    </p>
                                    
                                    <div className="flex items-baseline gap-2">
                                        {isLoading ? (
                                            <div className="h-8 w-16 bg-white/5 animate-pulse rounded-lg mt-1"></div>
                                        ) : (
                                            <h3 className="text-3xl font-black text-white tracking-tight">
                                                {card.value}
                                            </h3>
                                        )}
                                        {card.unit && !isLoading && (
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest z-10">
                                                {card.unit}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Trend Indicator replacing the progress bar */}
                            {!isLoading && (
                                <div className="mt-4 flex items-center gap-1.5 bg-white/[0.02] border border-white/5 w-fit px-2.5 py-1.5 rounded-lg">
                                    {!isZero && <TrendIcon size={12} className={trendColor} strokeWidth={3} />}
                                    <span className={`text-[10px] font-black ${trendColor}`}>
                                        {!isZero ? (card.trend.type === "up" ? "+" : "-") : ""}{card.trend.value}
                                    </span>
                                    <span className={`text-[10px] font-bold ml-0.5 tracking-wide ${isZero ? "text-white/40" : "text-white/30"}`}>
                                        {card.trend.text}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}