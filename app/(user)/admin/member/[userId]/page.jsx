"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Mail, Phone, Building2, Globe, Shield, ShieldCheck, 
  MessageSquare, CheckCircle2, Clock, TrendingUp, Wifi, WifiOff,
  Calendar, Users, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const statusColors = {
  OPEN: "text-sky-400 bg-sky-400/10 border-sky-400/20",
  PENDING: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  NEW: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  RESOLVED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  CLOSED: "text-white/30 bg-white/5 border-white/10",
};

const platformIcons = {
  facebook: <span className="inline-flex items-center gap-1 text-[#0866FF]"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>Facebook</span>,
  line: <span className="inline-flex items-center gap-1 text-[#06C755]"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1.004C5.926 1.004 1.004 5.03 1.004 10.032c0 4.463 3.96 8.198 9.31 8.91.363.078.857.24.982.55.112.28.073.72.036 1.003l-.158.954c-.048.29-.224 1.136.996.62 1.22-.518 6.586-3.88 8.986-6.64C23.005 13.4 22.996 10.032 22.996 10.032 22.996 5.03 18.074 1.004 12 1.004z"/></svg>LINE</span>,
  telegram: <span className="inline-flex items-center gap-1 text-[#26A5E4]"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.053 5.56-5.023c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>Telegram</span>,
  instagram: <span className="inline-flex items-center gap-1 text-[#E1306C]"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>Instagram</span>,
};

function StatCard({ icon, label, value, color, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1F192E] border border-white/5 rounded-[1.5rem] p-5 flex flex-col gap-2 hover:border-white/10 transition-colors"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <div className="mt-1">
        <p className="text-2xl font-black text-white tracking-tight leading-none">{value}</p>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mt-1">{label}</p>
        {description && <p className="text-[10px] text-white/20 mt-0.5">{description}</p>}
      </div>
    </motion.div>
  );
}

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.userId;

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/dashboard/member-profile?userId=${userId}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
        setMember(data.member);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const getRoleBadge = (role) => {
    const r = role?.toLowerCase();
    if (r === "owner") return { text: "Owner", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", Icon: Shield };
    if (r === "admin") return { text: "Admin", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20", Icon: Shield };
    if (r === "manager") return { text: "Manager", cls: "bg-violet-500/10 text-violet-400 border-violet-500/20", Icon: ShieldCheck };
    return { text: role || "Employee", cls: "bg-white/5 text-white/40 border-white/10", Icon: ShieldCheck };
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" }) : "-";

  const formatTime = (d) =>
    d ? new Date(d).toLocaleString("th-TH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-white/5 rounded-xl" />
          <div className="bg-[#161223] rounded-[2.5rem] p-8 space-y-6">
            <div className="flex gap-5">
              <div className="w-24 h-24 bg-white/5 rounded-[1.5rem]" />
              <div className="space-y-3 flex-1">
                <div className="h-6 w-48 bg-white/5 rounded-xl" />
                <div className="h-4 w-32 bg-white/5 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white/5 rounded-[1.5rem]" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[60vh] text-center">
        <p className="text-red-400 font-bold text-lg mb-4">ไม่พบข้อมูลสมาชิก</p>
        <p className="text-white/30 text-sm mb-6">{error}</p>
        <button onClick={() => router.back()} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 rounded-2xl text-white/60 hover:text-white transition-colors text-sm font-semibold">
          <ArrowLeft size={16} /> กลับไป
        </button>
      </div>
    );
  }

  const badge = getRoleBadge(member?.role);
  const BadgeIcon = badge.Icon;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()}
        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-semibold mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </motion.button>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        {/* Hero Banner */}
        <div className="h-28 bg-gradient-to-br from-[#BE7EC7]/20 via-[#7c4dbb]/10 to-transparent relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(190,126,199,0.15),transparent_70%)]" />
        </div>

        {/* Profile Info */}
        <div className="px-8 pb-8 -mt-14 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-[1.5rem] border-4 border-[#161223] shadow-xl overflow-hidden bg-[#1F192E]">
                {member?.avatar ? (
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-black text-[#BE7EC7]">
                    {member?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-[#161223] shadow-lg ${member?.isOnline ? "bg-emerald-500 shadow-emerald-500/50" : (member?.onlineStatus?.toUpperCase() === "AWAY" ? "bg-gradient-to-br from-[#fde047] to-[#f59e0b] shadow-amber-500/50" : "bg-white/20")}`} />
            </div>

            {/* Name & badges */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex flex-wrap items-center gap-3 mb-1.5">
                <h1 className="text-2xl font-black text-white tracking-tight">{member?.name}</h1>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${badge.cls}`}>
                  <BadgeIcon size={11} />
                  {badge.text}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/40">
                {member?.email && (
                  <span className="flex items-center gap-1.5 transition-colors">
                    <Mail size={13} />{member.email}
                  </span>
                )}
                {member?.phone && (
                  <span className="flex items-center gap-1.5"><Phone size={13} />{member.phone}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-white/30 mt-2">
                {member?.company && <span className="flex items-center gap-1"><Building2 size={11} />{member.company}</span>}
                {member?.country && <span className="flex items-center gap-1"><Globe size={11} />{member.country}</span>}
                <span className="flex items-center gap-1.5">
                  {member?.isOnline ? (
                    <Wifi size={11} className="text-emerald-400" />
                  ) : member?.onlineStatus?.toUpperCase() === "AWAY" ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#fde047] to-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.4)]" />
                  ) : (
                    <WifiOff size={11} />
                  )}
                  <span className={member?.onlineStatus?.toUpperCase() === "AWAY" && !member?.isOnline ? "text-amber-400 font-bold tracking-wide drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" : ""}>
                    {member?.isOnline ? "Online" : member?.onlineStatus?.toUpperCase() === "AWAY" ? "Away" : member?.onlineStatus || "Offline"}
                  </span>
                </span>
                <span className="flex items-center gap-1"><Calendar size={11} />เข้าร่วม {formatDate(member?.joinedAt)}</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatCard
              icon={<MessageSquare size={18} />}
              label="Total Chats"
              value={member?.stats?.totalAssigned ?? 0}
              color="bg-[#BE7EC7]/10 text-[#BE7EC7]"
              description="ทั้งหมดที่ได้รับมอบหมาย"
            />
            <StatCard
              icon={<CheckCircle2 size={18} />}
              label="Resolved"
              value={member?.stats?.resolved ?? 0}
              color="bg-emerald-500/10 text-emerald-400"
              description="แก้ไขสำเร็จแล้ว"
            />
            <StatCard
              icon={<Clock size={18} />}
              label="Open Chats"
              value={member?.stats?.open ?? 0}
              color="bg-sky-500/10 text-sky-400"
              description="ยังดำเนินการอยู่"
            />
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Resolution Rate"
              value={`${member?.stats?.resolutionRate ?? 0}%`}
              color="bg-amber-500/10 text-amber-400"
              description="อัตราการแก้ปัญหาสำเร็จ"
            />
          </div>

          {/* Recent Chats */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-white/60 uppercase tracking-widest">Recent Chat Sessions</h2>
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">5 รายการล่าสุด</span>
            </div>

            {!member?.recentSessions?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-white/[0.02] rounded-[1.5rem] border border-white/5">
                <MessageSquare size={32} className="text-white/10 mb-3" />
                <p className="text-white/30 text-sm font-semibold">ยังไม่มีแชทที่รับผิดชอบ</p>
              </div>
            ) : (
              <div className="space-y-2">
                {member.recentSessions.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-[#1F192E] border border-white/[0.04] rounded-[1.2rem] hover:border-[#BE7EC7]/20 transition-all group"
                  >
                    {/* Customer avatar */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 shrink-0 flex items-center justify-center text-white/20 font-black">
                      {s.customerImage
                        ? <img src={s.customerImage} alt="" className="w-full h-full object-cover" />
                        : s.customerName?.charAt(0)?.toUpperCase() || "?"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{s.customerName}</p>
                      <p className="text-white/30 text-[11px] mt-0.5">
                        {platformIcons[s.platform?.toLowerCase()] || "💬"} {s.channelName} · {formatTime(s.startTime)}
                      </p>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusColors[s.status] || statusColors["CLOSED"]}`}>
                      {s.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Workspace info footer */}
          <div className="mt-8 p-4 bg-white/[0.02] rounded-[1.5rem] border border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#BE7EC7]/10 flex items-center justify-center">
              <Users size={16} className="text-[#BE7EC7]" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold">Workspace</p>
              <p className="text-white text-sm font-bold">{member?.workspaceName}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
