"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation"; // 🔥 เพิ่ม useSearchParams
import { useSession, signOut } from "next-auth/react";
import Pusher from "pusher-js"; 

import {
  MessageCircle, Contact, Headphones, LayoutDashboard,
  ChevronDown, Megaphone, Building2, Palette, Image as ImageIcon,
  Upload, Sun, Moon, Users, LogOut, Check, X, FileClock,
  Bell, Settings, Sparkles, UserPlus,
} from "lucide-react";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams(); // 🔥 ดึง query string ปัจจุบัน
  const { data: session, status, update } = useSession();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [isOpenWorkspace, setIsOpenWorkspace] = useState(false);

  // Workspace States
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [teamMemberCount, setTeamMemberCount] = useState(1); 

  // User States
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState("ONLINE");
  const [avatar, setAvatar] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userTeam, setUserTeam] = useState("No Team");
  const [openUserMenu, setOpenUserMenu] = useState(false);

  // Notification State
  const [notifications, setNotifications] = useState([]); 
  const [invites, setInvites] = useState([]); 
  const [showNotifications, setShowNotifications] = useState(false);

  // Background & Theme State
  const [showBgModal, setShowBgModal] = useState(false);
  const [bgList, setBgList] = useState([]);
  const [selectedBg, setSelectedBg] = useState(null);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("dark");

  const themes = [
    { id: "light", name: "Light Mode", icon: Sun, description: "Clean & bright interface" },
    { id: "dark", name: "Dark Mode", icon: Moon, description: "Easy on the eyes" },
  ];

  const handleThemeChange = (themeId) => {
    setSelectedTheme(themeId);
    window.dispatchEvent(new CustomEvent("theme-changed", { detail: themeId }));
  };

  const loadNotifications = () => {
    try {
      const savedData = localStorage.getItem("onechat_data");
      if (savedData) {
        const chats = JSON.parse(savedData);
        // ดึงเฉพาะแชทที่เป็น NEW
        const newChats = chats.filter((chat) => chat.status?.toUpperCase() === "NEW" || chat.status === "New Chat");
        
        const formattedNotifications = newChats.map((chat) => ({
          id: chat.id, // ID สำคัญมาก! ต้องเช็คให้ดี
          name: chat.name,
          profile: chat.imgUrl,
          platform: chat.platform || chat.channel,
          message: chat.lastMessage || "มีข้อความใหม่",
          time: chat.lastMessageTime || chat.time || "ล่าสุด",
          icon: chat.channel?.toLowerCase(),
          type: "CHAT",
        }));

        const uniqueNotis = Array.from(new Map(formattedNotifications.map(item => [item.id, item])).values());
        setNotifications(uniqueNotis);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const fetchInvites = async () => {
    if (status !== "authenticated" || !session?.user) return;
    try {
      const res = await fetch("/api/workspaces/invite/respond");
      if (res.ok) {
        const data = await res.json();
        setInvites(data);
      }
    } catch (error) {
      console.error("Failed to fetch invites");
    }
  };

  const handleInviteResponse = async (inviteId, targetWorkspaceId, action) => {
    try {
      const res = await fetch("/api/workspaces/invite/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action }),
      });

      if (res.ok) {
        setInvites((prev) => prev.filter((inv) => inv.invite_id !== inviteId));
        if (action === "ACCEPT") {
          alert("🎉 ยินดีด้วย! คุณเข้าร่วมทีมแล้ว ระบบกำลังพากลับไปหน้าแชท...");
          
          if (targetWorkspaceId) {
             await fetch("/api/users/current-workspace", {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ workspaceId: targetWorkspaceId })
             });
          }
          
          window.location.href = "/chat/allchat"; 
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetch(`/api/workspaces/general?wsId=${activeWorkspace.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.workspace?._count?.members) {
            setTeamMemberCount(data.workspace._count.members);
          }
        })
        .catch((err) => console.error("Failed to fetch member count", err));
    }
  }, [activeWorkspace?.id]);

  const syncProfile = async (shouldUpdateSession = false) => {
    if (status === "authenticated" && session?.user) {
      try {
        const res = await fetch(`/api/users/profile?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setUserName(data.profile.username);
          setAvatar(data.profile.profile_image || "");
          setOnlineStatus(data.profile.online_status || "ONLINE");

          const userWorkspaces = data.workspaces || [];
          setWorkspaces(userWorkspaces);
          
          const wsRes = await fetch("/api/users/current-workspace");
          let currentWsId = null;
          if (wsRes.ok) {
              const wsData = await wsRes.json();
              currentWsId = wsData.activeWorkspaceId ? String(wsData.activeWorkspaceId) : null;
          }

          if (userWorkspaces.length > 0) {
            let currentWs = currentWsId ? userWorkspaces.find((ws) => String(ws.id) === currentWsId) : null;

            if (currentWsId && !currentWs) {
                if (pathname !== "/waiting") {
                    alert("⚠️ สิทธิ์การเข้าถึงของคุณถูกยกเลิก หรือคุณถูกลบออกจากทีมนี้แล้ว");
                    window.location.href = "/waiting";
                }
                return;
            }

            if (!currentWs) currentWs = userWorkspaces[0];

            setActiveWorkspace(currentWs);
            setUserRole(currentWs.role || "EMPLOYEE"); 
          } else {
            setUserRole(data.profile.role);
            if (currentWsId) {
                if (pathname !== "/waiting") {
                    alert("⚠️ สิทธิ์การเข้าถึงของคุณถูกยกเลิก");
                    window.location.href = "/waiting";
                }
                return;
            }
          }

          if (shouldUpdateSession) await update();
        }
      } catch (err) {
        console.error("Sync profile error:", err);
      } finally {
        setIsFetchingProfile(false);
      }
    } else if (status === "unauthenticated") {
      setUserName("Guest");
      setIsFetchingProfile(false);
    }
  };

  useEffect(() => {
    syncProfile(false);
    fetchInvites(); 

    const handleUpdate = () => syncProfile(true);
    window.addEventListener("user_updated", handleUpdate);

    return () => {
      window.removeEventListener("user_updated", handleUpdate);
    };
  }, [status, session?.user?.email, pathname]);

  // 🔥 2. แยก useEffect สำหรับ Pusher 
  useEffect(() => {
    let pusher;
    let wsChannel;
    let userChannel; 

    const setupPusher = async () => {
        if (status === "authenticated") {
            pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
              cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
            });

            try {
                const profileRes = await fetch("/api/users/profile");
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    const myUserId = profileData.profile?.user_id || profileData.profile?.id;
                    
                    if (myUserId) {
                        userChannel = pusher.subscribe(`user-${myUserId}`);
                        
                        userChannel.bind('new-invitation', function(data) {
                            fetchInvites(); 
                        });

                        userChannel.bind('kicked-out', function() {
                            alert("⚠️ สิทธิ์การเข้าถึงของคุณถูกยกเลิก คุณถูกนำออกจากพื้นที่ทำงานแล้ว");
                            window.location.href = "/waiting"; 
                        });

                        userChannel.bind('user_updated', function() {
                            syncProfile(true); 
                        });
                    }
                }
            } catch (e) {
                console.error("Error setting up personal pusher:", e);
            }

            try {
                const wsRes = await fetch("/api/users/current-workspace");
                if (wsRes.ok) {
                    const wsData = await wsRes.json();
                    const activeWsId = wsData.activeWorkspaceId;

                    if (activeWsId) {
                        wsChannel = pusher.subscribe(`workspace-${activeWsId}`);
                        
                        // 🔥 ดักจับข้อความลูกค้าปกติ (แก้ไขให้ฉลาดขึ้น และจัดการ ID ซ้ำซ้อน)
                        wsChannel.bind('webhook-event', function(data) { 
                            if (data.action === "SYNC_MESSAGE" && data.from === "customer") {
                                setNotifications((prev) => {
                                    // 💡 บังคับดึง ID ที่ถูกต้อง (หลังบ้านอาจส่งมาเป็น id หรือ chatId)
                                    const targetId = parseInt(data.chatId || data.id);
                                    if(!targetId) return prev;

                                    const existingIndex = prev.findIndex(n => parseInt(n.id) === targetId);
                                    
                                    if (existingIndex > -1) {
                                        // 💡 ถ้าเป็นห้องแชทเดิมในกระดิ่ง ให้อัปเดตข้อความใหม่ล่าสุด แล้วดันขึ้นบนสุด! ไม่งอกใหม่!
                                        const updated = [...prev];
                                        updated[existingIndex] = { 
                                            ...updated[existingIndex], 
                                            message: data.text || data.message, 
                                            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                                        };
                                        const [moved] = updated.splice(existingIndex, 1);
                                        return [moved, ...updated]; 
                                    }
                                    return prev;
                                });
                            }
                        });
                        
                        // 🔥 ดักฟังสัญญาณลูกค้ารายใหม่ (New Chat)
                        wsChannel.bind('new-customer-chat', function(data) {
                            setNotifications((prev) => {
                                // 💡 บังคับดึง ID ที่ถูกต้อง
                                const targetId = parseInt(data.id || data.chatId);
                                if(!targetId) return prev;

                                const existingIndex = prev.findIndex(n => parseInt(n.id) === targetId);
                                
                                if (existingIndex > -1) {
                                    // 💡 ถ้าคนเดิมทักมาซ้ำ ไม่งอกอันใหม่! อัปเดตข้อความแล้วดันขึ้นบนสุด
                                    const updated = [...prev];
                                    updated[existingIndex] = { 
                                      ...updated[existingIndex], 
                                      message: data.message || data.text, 
                                      time: data.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) 
                                    };
                                    const [moved] = updated.splice(existingIndex, 1);
                                    return [moved, ...updated];
                                }
                                // ถ้ายังไม่มีในกระดิ่ง ถึงจะสร้างอันใหม่ครับ พร้อมใส่ ID ให้เป๊ะ!
                                return [{...data, id: targetId}, ...prev];
                            });
                        });
                    }
                }
            } catch (e) {
                console.error("Error setting up workspace pusher:", e);
            }
        }
    };

    setupPusher();

    return () => {
      if (pusher) {
         if (wsChannel) {
            wsChannel.unbind_all();
            pusher.unsubscribe(wsChannel.name);
         }
         if (userChannel) {
            userChannel.unbind_all();
            pusher.unsubscribe(userChannel.name);
         }
         pusher.disconnect();
      }
    };
  }, [status]); 

  useEffect(() => {
    const isAdminRoute = 
      pathname.startsWith("/admin") || 
      pathname.startsWith("/Report") || 
      pathname.startsWith("/log") || 
      pathname.startsWith("/contact") ||
      pathname.startsWith("/ai-support");

    if (userRole && userRole.toUpperCase() === "EMPLOYEE" && isAdminRoute) {
      alert("⚠️ สิทธิ์ผู้ดูแลระบบของคุณถูกยกเลิก ระบบจะพากลับไปหน้าหลัก");
      router.push("/dashboard"); 
    }
  }, [userRole, pathname, router]);

  useEffect(() => {
    const savedList = localStorage.getItem("backgroundList");
    if (savedList) {
      try {
        setBgList(JSON.parse(savedList));
      } catch {
        setBgList(["/images/Bg.jpg", "/images/Bg2.png", "/images/Bg3.jpg", "/images/Bg4.jpg"]);
      }
    } else {
      const defaults = ["/images/Bg.jpg", "/images/Bg2.png", "/images/Bg3.jpg", "/images/Bg4.jpg"];
      setBgList(defaults);
      localStorage.setItem("backgroundList", JSON.stringify(defaults));
    }

    const savedBg = localStorage.getItem("appBackground");
    if (savedBg) setSelectedBg(savedBg);

    loadNotifications();
    const handleChatUpdate = () => loadNotifications();
    window.addEventListener("chat-data-updated", handleChatUpdate);

    return () => window.removeEventListener("chat-data-updated", handleChatUpdate);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  const handleUploadBg = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const updated = [...bgList, dataUrl];
      setBgList(updated);
      localStorage.setItem("backgroundList", JSON.stringify(updated));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyBackground = (bg) => {
    setSelectedBg(bg);
    localStorage.setItem("appBackground", bg);
    window.dispatchEvent(new CustomEvent("background-changed", { detail: bg }));
    setShowBgModal(false);
  };

  const notiRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalNotifications = notifications.length + invites.length;
  const isAdminOrOwner = userRole?.toUpperCase() === "ADMIN" || userRole?.toUpperCase() === "OWNER";

  return (
    <div className="flex p-3 h-screen">
      <div className="relative w-[260px] h-full rounded-3xl overflow-hidden flex flex-col justify-between shadow-2xl bg-[#1a1423] border border-[#BE7EC7]/10">
        <div className="relative z-10 flex px-5 flex-col flex-1 overflow-y-auto custom-scrollbar pt-6">
          
          <div className="flex items-center justify-between mb-8 gap-3">
            <div
              className="flex items-center gap-3 flex-1 min-w-0 group cursor-pointer"
              onClick={() => setOpenUserMenu(!openUserMenu)}
            >
              
              <div className="relative w-12 h-12 shrink-0">
                {teamMemberCount > 1 && (
                  <div className="absolute top-0 right-0 w-8 h-8 rounded-full bg-[#2a2438] border-[2.5px] border-[#1a1423] flex items-center justify-center overflow-hidden z-0 shadow-sm">
                     <Users size={14} className="text-white/40" />
                  </div>
                )}
                <div
                  className={`absolute ${teamMemberCount > 1 ? 'bottom-0 left-0 w-9 h-9' : 'top-1 left-1 w-10 h-10'} rounded-full flex items-center justify-center text-white font-bold text-sm border-[2.5px] border-[#1a1423] shadow-lg overflow-hidden z-10 transition-all duration-300`}
                  style={{
                    background: `linear-gradient(135deg, ${stringToColor(userName)}, ${stringToColor(userName + "dark")})`,
                  }}
                >
                  {status === "loading" || isFetchingProfile ? (
                    <div className="w-full h-full bg-white/10 animate-pulse"></div>
                  ) : avatar || session?.user?.image ? (
                    <img
                      src={avatar || session.user.image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-[10px]">
                      {getInitials(userName)}
                    </div>
                  )}
                </div>

                <div className={`absolute ${teamMemberCount > 1 ? '-bottom-0.5 left-6' : '-bottom-0.5 right-0'} w-4 h-4 bg-[#1a1423] rounded-full flex items-center justify-center z-20 transition-all duration-300`}>
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      onlineStatus?.toUpperCase() === "ONLINE" ? "bg-green-500" : 
                      onlineStatus?.toUpperCase() === "AWAY" ? "bg-yellow-500" : "bg-neutral-500"
                    }`}
                  ></div>
                </div>

              </div>

              <div className="flex flex-col min-w-0 justify-center pt-1">
                {status === "loading" || isFetchingProfile ? (
                  <div className="space-y-2">
                    <div className="w-20 h-3 bg-white/10 animate-pulse rounded"></div>
                    <div className="w-12 h-2 bg-white/5 animate-pulse rounded"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-white text-sm font-semibold truncate group-hover:text-[#BE7EC7] leading-none">
                      {userName || session?.user?.name || "EMPLOYEE"}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          userRole?.toUpperCase() === "OWNER"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : userRole?.toUpperCase() === "ADMIN"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-[#BE7EC7]/10 text-[#BE7EC7] border-[#BE7EC7]/20"
                        }`}
                      >
                        {userRole || "EMPLOYEE"}
                      </span>
                      {teamMemberCount > 1 && (
                         <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] text-white/70">
                           <Users size={10} />
                           <span>{teamMemberCount}</span>
                         </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                fetchInvites();
                setShowNotifications(true);
              }}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-[#BE7EC7]/10 border border-white/5 hover:border-[#BE7EC7]/30 text-white/70 hover:text-[#e0b8e6]"
            >
              <Bell size={18} />
              {totalNotifications > 0 && (
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>

          {openUserMenu && (
            <div className="absolute top-16 left-5 right-5 bg-[#1E1B29] border border-white/10 rounded-2xl shadow-xl p-2 z-50 overflow-hidden">
              <div className="text-xs font-semibold text-white/40 px-3 py-2 uppercase tracking-wider">
                Account
              </div>
              <Link
                href="/account/profile"
                className="flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white rounded-lg"
              >
                <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
                  <Users size={14} />
                </div>{" "}
                Profile
              </Link>
              <Link
                href="/account/notification"
                className="flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:bg-white/5 hover:text-white rounded-lg"
              >
                <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
                  <Bell size={14} />
                </div>{" "}
                Notifications
              </Link>
              <div className="h-px bg-white/5 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg"
              >
                <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center">
                  <LogOut size={14} />
                </div>{" "}
                Logout
              </button>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <p className="text-[10px] text-[#BE7EC7]/60 font-bold uppercase tracking-widest px-2 mb-2">
                Main Menu
              </p>
              <nav className="space-y-1">
                <SidebarLink href="/tutorial" icon={<Sparkles size={18} />} label="Tutorial" pathname={pathname} />
                <DropdownMenu
                  title="Chat"
                  icon={<MessageCircle size={18} />}
                  isOpen={openDropdown === "Chat"}
                  onToggle={() => setOpenDropdown(openDropdown === "Chat" ? null : "Chat")}
                  links={[
                    { href: "/chat/allchat", label: "All Chat" },
                    { href: "/chat/customchat", label: "Custom Chat" },
                    { href: "/chat/facebook", label: "Facebook" },
                    { href: "/chat/instagram", label: "Instagram" },
                    { href: "/chat/line", label: "Line" },
                    { href: "/chat/telegram", label: "Telegram" },
                  ]}
                  pathname={pathname}
                />
                <SidebarLink href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" pathname={pathname} />
              </nav>
            </div>

            {isAdminOrOwner && (
              <div>
                <p className="text-[10px] text-[#BE7EC7]/60 font-bold uppercase tracking-widest px-2 mb-2">
                  Management
                </p>
                <nav className="space-y-1">
                  <SidebarLink href="/contact" icon={<Contact size={18} />} label="Contacts" pathname={pathname} />
                  <SidebarLink href="/ai-support" icon={<Headphones size={18} />} label="AI Agent" pathname={pathname} />
                  <SidebarLink href="/log" icon={<FileClock size={18} />} label="System Logs" pathname={pathname} />
                  <DropdownMenu
                    title="Reports"
                    icon={<Megaphone size={18} />}
                    isOpen={openDropdown === "Report"}
                    onToggle={() => setOpenDropdown(openDropdown === "Report" ? null : "Report")}
                    links={[
                      { href: "/Report/contacts", label: "Contacts" },
                      { href: "/Report/conversation", label: "Conversations" },
                      { href: "/Report/message", label: "Messages" },
                      { href: "/Report/responses", label: "Responses" },
                      { href: "/Report/users", label: "Team Performance" },
                    ]}
                    pathname={pathname}
                  />
                  <DropdownMenu
                    title="Admin Panel"
                    icon={<Settings size={18} />}
                    isOpen={openDropdown === "Admin"}
                    onToggle={() => setOpenDropdown(openDropdown === "Admin" ? null : "Admin")}
                    links={[
                      { href: "/admin/generalinfo", label: "General Info" },
                      { href: "/admin/channel", label: "Connect" },
                      { href: "/admin/usersetting", label: "Users" },
                      { href: "/admin/teamsetting", label: "Teams" },
                      { href: "/admin/tag", label: "Tags" },
                      { href: "/admin/aiprompt", label: "AI Prompt" },
                    ]}
                    pathname={pathname}
                  />
                </nav>
              </div>
            )}
          </div>
        </div>

        <div className="relative z-20 p-4 mt-auto">
          <div className="relative mb-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                Workspace
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowThemeModal(true)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-[#BE7EC7] hover:bg-white/10"
                >
                  <Palette size={12} />
                </button>
                <button
                  onClick={() => setShowBgModal(true)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-[#BE7EC7] hover:bg-white/10"
                >
                  <ImageIcon size={12} />
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsOpenWorkspace(!isOpenWorkspace)}
              className="w-full flex items-center justify-between gap-3 bg-white/5 border border-white/5 hover:border-[#BE7EC7]/30 hover:bg-white/10 text-white p-2.5 rounded-xl group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 flex items-center justify-center bg-[#BE7EC7] rounded-lg shrink-0">
                  <Building2 size={16} className="text-white" />
                </div>
                <span className="font-medium text-sm truncate">
                  {activeWorkspace ? activeWorkspace.name : "Select Workspace"}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-white/50 shrink-0 ${isOpenWorkspace ? "rotate-180" : ""}`}
              />
            </button>

            {isOpenWorkspace && (
              <div className="absolute bottom-full mb-2 w-full bg-[#1E1B29] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="max-h-48 overflow-y-auto custom-scrollbar p-1">
                  {workspaces.length === 0 && (
                    <div className="px-3 py-2 text-xs text-white/50 text-center">
                      No workspaces
                    </div>
                  )}
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={async () => {
                        await fetch("/api/users/current-workspace", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ workspaceId: ws.id })
                        });
                        setActiveWorkspace(ws);
                        setUserRole(ws.role);
                        setIsOpenWorkspace(false);
                        window.location.reload();
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg flex items-center justify-between ${activeWorkspace?.id === ws.id ? "bg-[#BE7EC7] text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                    >
                      <div className="flex flex-col truncate">
                        <span className="truncate">{ws.name}</span>
                        <span className="text-[9px] opacity-60">Role: {ws.role}</span>
                      </div>
                      {activeWorkspace?.id === ws.id && (
                        <Check size={12} className="shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 opacity-50 hover:opacity-100 py-2 border-t border-white/5">
            <Image src="/images/LogoSidebar.png" alt="Talka" width={20} height={20} className="object-contain" />
            <span className="text-xs font-bold tracking-[0.2em] text-white">TALKA</span>
          </div>
        </div>
      </div>

      {showNotifications && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end p-4 sm:p-6 pointer-events-none">
          <div
            className="absolute inset-0 bg-black/40 pointer-events-auto"
            onClick={() => setShowNotifications(false)}
          ></div>
          <div
            ref={notiRef}
            className="relative pointer-events-auto w-full max-w-sm bg-[#1E1B29] border border-white/10 rounded-2xl shadow-2xl overflow-hidden mt-10 mr-2"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell size={14} className="text-[#BE7EC7]" /> Notifications
              </h3>
              <button onClick={() => setShowNotifications(false)} className="text-white/40 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-3 space-y-3">
              {totalNotifications === 0 ? (
                <div className="p-8 text-center text-white/30 text-xs">No new notifications</div>
              ) : (
                <>
                  {invites.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest px-1">Team Invites</p>
                      {invites.map((invite) => (
                        <div key={invite.invite_id} className="bg-amber-400/5 border border-amber-400/20 p-3 rounded-xl flex flex-col gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                              <UserPlus size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-white font-medium">
                                <span className="font-bold text-amber-400">{invite.inviter.username}</span> invited you to <span className="font-bold">{invite.workspace.name}</span>
                              </p>
                              <p className="text-xs text-white/50 mt-0.5">Role: {invite.role}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleInviteResponse(invite.invite_id, null, "DECLINE")}
                              className="flex-1 py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white text-xs font-bold transition-all"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleInviteResponse(invite.invite_id, invite.workspace_id || invite.workspace.workspace_id, "ACCEPT")}
                              className="flex-1 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold transition-all"
                            >
                              Accept
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {notifications.length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-[10px] text-[#BE7EC7]/60 font-bold uppercase tracking-widest px-1">New Messages</p>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            // ปิดกล่อง Noti
                            setShowNotifications(false);
                            
                            // 🔥 ลบ Noti ออกจากจอทันทีที่กด! 
                            setNotifications((prev) => prev.filter((item) => parseInt(item.id) !== parseInt(n.id)));

                            // 🚨 จุดสำคัญแก้บัคแชทรีเซ็ต: ใช้ router.push แบบรับ query ไม่ใช่โหลดใหม่หมด
                            const url = new URL(window.location.href);
                            const currentId = url.searchParams.get("id");
                            
                            // ถ้าเป็นแชทเดิมที่เปิดอยู่ ไม่ต้องไปโหลดใหม่
                            if(currentId !== String(n.id)) {
                                router.push(`/chat/allchat?id=${n.id}`);
                            }
                          }}
                          className="group flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5"
                        >
                          <img src={n.profile || "/images/default-avatar.png"} className="w-10 h-10 rounded-full object-cover border border-white/10" alt={n.name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-0.5">
                              <p className="text-sm font-medium text-white truncate">{n.name}</p>
                              <span className="text-[10px] text-white/30">{n.time}</span>
                            </div>
                            <p className="text-xs text-white/60 line-clamp-1 group-hover:text-white/80">{n.message}</p>
                            <div className="mt-1.5 flex items-center gap-1.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${
                                n.platform?.toUpperCase() === "LINE" ? "bg-[#06c755]/10 border-[#06c755]/20 text-[#06c755]" : 
                                n.platform?.toUpperCase() === "FACEBOOK" ? "bg-[#0866FF]/10 border-[#0866FF]/20 text-[#0866FF]" :
                                n.platform?.toUpperCase() === "INSTAGRAM" ? "bg-pink-500/10 border-pink-500/20 text-pink-400" :
                                n.platform?.toUpperCase() === "TELEGRAM" ? "bg-[#0088cc]/10 border-[#0088cc]/20 text-[#0088cc]" :
                                "bg-blue-500/10 border-blue-500/20 text-blue-400"
                              }`}>
                                {n.platform || "CHAT"}
                              </span>
                              
                              <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">
                                  NEW
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {(showBgModal || showThemeModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => { setShowBgModal(false); setShowThemeModal(false); }} />
          {showBgModal && (
            <div className="relative bg-[#1E1B29] border border-white/10 p-6 rounded-3xl shadow-2xl max-w-2xl w-full">
              <h3 className="text-xl font-bold text-white mb-4">Select Wallpaper</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {bgList.map((bg, idx) => (
                  <div key={idx} onClick={() => applyBackground(bg)} className={`aspect-video rounded-xl border-2 overflow-hidden cursor-pointer relative group ${selectedBg === bg ? "border-[#BE7EC7]" : "border-transparent hover:border-white/20"}`}>
                    <img src={bg} className="w-full h-full object-cover" />
                    {selectedBg === bg && (
                      <div className="absolute inset-0 bg-[#BE7EC7]/20 flex items-center justify-center">
                        <Check className="text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>
                ))}
                <label className="aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-white/30 hover:bg-white/5 flex flex-col items-center justify-center cursor-pointer transition">
                  <Upload size={20} className="text-white/50 mb-2" />
                  <span className="text-xs text-white/50">Upload</span>
                  <input type="file" accept="image/*" onChange={handleUploadBg} className="hidden" />
                </label>
              </div>
            </div>
          )}
          {showThemeModal && (
            <div className="relative bg-[#1E1B29] border border-white/10 p-6 rounded-3xl shadow-2xl max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Appearance</h3>
              <div className="space-y-3">
                {themes.map((t) => (
                  <button key={t.id} onClick={() => handleThemeChange(t.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border ${selectedTheme === t.id ? "bg-[#BE7EC7] border-[#BE7EC7] text-white" : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"}`}>
                    <t.icon size={24} />
                    <div className="text-left">
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-xs opacity-70">{t.description}</p>
                    </div>
                    {selectedTheme === t.id && <Check size={18} className="ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SidebarLink({ href, icon, label, pathname }) {
  const isActive = pathname.startsWith(href);
  return (
    <Link href={href} className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl overflow-hidden ${isActive ? "bg-[#BE7EC7]/20 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
      <div className={`relative z-10 ${isActive ? "text-[#BE7EC7]" : ""}`}>{icon}</div>
      <span className={`relative z-10 text-sm font-medium tracking-wide ${isActive ? "font-semibold" : ""}`}>{label}</span>
    </Link>
  );
}

function DropdownMenu({ title, icon, links, isOpen, onToggle, pathname }) {
  const isParentActive = links.some((link) => pathname === link.href);
  return (
    <div className="mb-1">
      <button onClick={onToggle} className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl ${isOpen || isParentActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
        <div className={`${isOpen || isParentActive ? "text-[#BE7EC7]" : ""}`}>{icon}</div>
        <span className={`text-sm font-medium tracking-wide ${isParentActive ? "text-white" : ""}`}>{title}</span>
        <ChevronDown size={14} className={`ml-auto opacity-50 ${isOpen ? "rotate-180 opacity-100 text-[#BE7EC7]" : ""}`} />
      </button>
      {isOpen && (
        <div className="overflow-hidden">
          <div className="ml-5 pl-3 border-l border-white/10 space-y-1 py-1 mt-1">
            {links.map((link) => {
              const isLinkActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href} className={`block w-full text-left px-3 py-2 rounded-lg text-xs ${isLinkActive ? "bg-[#BE7EC7]/20 text-[#e0b8e6] font-medium" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = Math.floor(Math.abs(Math.sin(hash) * 16777215) % 16777215).toString(16);
  return `#${"0".repeat(6 - color.length) + color}`;
}