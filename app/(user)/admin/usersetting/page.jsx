"use client";
import { 
  CircleUser, Ban, Edit, Info, X, AlertTriangle, 
  User, Users, Search, Plus, Trash2, Check, ShieldCheck 
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js"; // 🔥 1. นำเข้า Pusher

export default function UserSettingPage() {
  const { data: session } = useSession();
  
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [editId, setEditId] = useState(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeWsId, setActiveWsId] = useState(null);

  useEffect(() => {
    if (session !== undefined) {
      loadWorkspaceAndUsers();
    }
  }, [session?.user?.email]);

  const loadWorkspaceAndUsers = async () => {
    try {
        const wsRes = await fetch("/api/users/current-workspace");
        if (!wsRes.ok) throw new Error("Failed to get workspace");
        const wsData = await wsRes.json();
        
        if (wsData.activeWorkspaceId) {
            setActiveWsId(wsData.activeWorkspaceId);
            await fetchUserData(wsData.activeWorkspaceId);
        } else {
            setIsLoaded(true);
        }
    } catch (error) {
        console.error(error);
        setIsLoaded(true);
    }
  };

  const fetchUserData = async (workspaceId) => {
    try {
      const response = await fetch(`/api/workspaces/members?wsId=${workspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      
      const allUsers = await response.json();
      
      if (session?.user?.email) {
        const currentUserFromList = allUsers.find(u => u.email === session.user.email);
        if (currentUserFromList) {
          setCurrentUser(currentUserFromList);
          const otherUsers = allUsers.filter(u => u.email !== session.user.email);
          setUsers(otherUsers);
        } else {
          setUsers(allUsers);
          setCurrentUser(null);
        }
      } else {
        setUsers(allUsers);
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Error loading users data", error);
      setError("Failed to load workspace members");
    } finally {
      setIsLoaded(true);
    }
  };

  // 🔥 2. เพิ่ม useEffect สำหรับดักฟังสัญญาณจาก Pusher
  useEffect(() => {
    let pusher;
    let wsChannel;

    if (activeWsId) {
        pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        });

        wsChannel = pusher.subscribe(`workspace-${activeWsId}`);

        // ดักฟังสัญญาณเมื่อมีคนกดยอมรับคำเชิญเข้าทีม
        wsChannel.bind('workspace-updated', function(data) {
            console.log("🔔 อัปเดตรายชื่อสมาชิกแบบ Real-time!", data.message);
            fetchUserData(activeWsId); // สั่งดึงรายชื่อคนใหม่ทันที
        });
    }

    return () => {
        if (pusher && wsChannel) {
            wsChannel.unbind_all();
            pusher.unsubscribe(wsChannel.name);
            pusher.disconnect();
        }
    };
  }, [activeWsId]); // ทำงานเมื่อได้ activeWsId แล้ว

  const displayUsers = currentUser ? [currentUser, ...users] : users;

  const openAddModal = () => {
    setMode("add");
    setEmail("");
    setRole("EMPLOYEE");
    setIsOpen(true);
  };

  const openEditModal = (user) => {
    setMode("edit");
    setEditId(user.id);
    setEmail(user.email);
    setRole(user.role === "Owner" ? "ADMIN" : user.role.toUpperCase()); 
    setIsOpen(true);
  };

  const openDeleteModal = (user) => {
    setDeleteTarget(user);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      
      if (!activeWsId) {
          alert("⚠️ ไม่พบข้อมูลพื้นที่ทำงาน กรุณารีเฟรชหน้าเว็บ");
          setIsLoading(false);
          return;
      }

      const response = await fetch(`/api/workspaces/members/${deleteTarget.id}?wsId=${activeWsId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
         const err = await response.json();
         throw new Error(err.error || "Failed to remove user from workspace");
      }

      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      setError(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!email.trim()) return;
    try {
      setIsLoading(true);
      
      if (!activeWsId) {
          alert("⚠️ ไม่พบข้อมูลพื้นที่ทำงาน กรุณารีเฟรชหน้าเว็บ");
          setIsLoading(false);
          return;
      }
      
      const response = await fetch("/api/workspaces/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, workspaceId: activeWsId })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to send invite");
      }
      
      setIsOpen(false);
      setError(null);
      alert(`✉️ ส่งคำเชิญไปที่ ${email} เรียบร้อยแล้ว! กรุณารอให้ผู้ใช้งานกดยอมรับในหน้าแจ้งเตือน`);
      
    } catch (error) {
      console.error("Error sending invite:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async () => {
    try {
      setIsLoading(true);
      
      if (!activeWsId) {
          alert("⚠️ ไม่พบข้อมูลพื้นที่ทำงาน กรุณารีเฟรชหน้าเว็บ");
          setIsLoading(false);
          return;
      }
      
      const response = await fetch(`/api/workspaces/members/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            role: role,
            workspaceId: activeWsId
        }) 
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update user role");
      }
      
      const updatedUser = await response.json();

      if (currentUser && editId === currentUser.id) {
        setCurrentUser({ ...currentUser, role: updatedUser.role });
      } else {
        setUsers((prev) => prev.map((u) => u.id === editId ? { ...u, role: updatedUser.role } : u));
      }
      setIsOpen(false);
      setError(null);
    } catch (error) {
      console.error("Error updating user:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded) return <div className="text-white text-center mt-20 animate-pulse font-bold tracking-widest uppercase text-xs">Syncing Workspace...</div>;

  const inputClass = "w-full bg-white/[0.03] border border-white/10 focus:border-[#BE7EC7]/50 focus:bg-white/[0.08] outline-none rounded-xl py-2.5 px-4 text-white text-sm transition-all placeholder:text-white/20";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 mb-1.5 ml-1";

  return (
    <div className="w-full h-[95vh] p-4 lg:p-6 ">
      <div className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-2xl flex flex-col h-full overflow-hidden">
        
        {/* Header Section */}
        <div className="p-8 pb-6 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#BE7EC7] flex items-center justify-center shadow-[0_0_20px_rgba(190,126,199,0.3)]">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight leading-none">User Members</h1>
                <p className="text-white/30 text-xs mt-1.5 font-medium">Manage access levels and workspace members</p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input type="text" className="w-full bg-white/5 border border-white/5 focus:border-[#BE7EC7]/50 outline-none rounded-2xl py-2.5 pl-12 pr-4 text-white text-sm" placeholder="Search member..." />
              </div>
              <button onClick={openAddModal} className="flex items-center gap-2 bg-[#BE7EC7] hover:bg-[#a66bb0] disabled:opacity-50 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-[#BE7EC7]/20 transition-all" disabled={isLoading}>
                <Plus size={18} /> Invite Member
              </button>
            </div>
          </div>
        </div>

        <div className="h-px bg-white/5 mx-8"></div>

        {error && (
          <div className="mx-8 mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {/* User List Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-6">
          <div className="flex flex-col gap-3">
            {displayUsers.map((user) => {
              const isMe = currentUser && user.id === currentUser.id;
              
              const isTargetOwner = user.role && user.role.toUpperCase() === "OWNER";
              let displayRole = user.role ? user.role.toUpperCase() : "EMPLOYEE";

              let roleBadgeColor = "text-white/30";
              if (displayRole === "ADMIN") roleBadgeColor = "text-rose-500 border-rose-500/20";
              if (displayRole === "OWNER") roleBadgeColor = "text-yellow-400 border-yellow-500/20";
              
              return (
                <div key={user.id} className={`group relative bg-[#1F192E] border ${isTargetOwner ? 'border-purple-400/20' : 'border-white/5'} rounded-[1.8rem] p-4 px-6 flex justify-between items-center transition-all duration-300 hover:border-[#BE7EC7]/30 hover:shadow-xl hover:-translate-y-0.5`}>
                  
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner overflow-hidden ${isMe ? 'bg-[#BE7EC7]/10 text-[#BE7EC7]' : 'bg-white/5 text-white/20'}`}>
                      {user.profile_image ? (
                        <img src={user.profile_image} className="w-full h-full object-cover" alt={user.name} />
                      ) : (
                        <CircleUser size={32} strokeWidth={1.5} />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold tracking-tight">{user.name || "Unnamed User"}</span>
                        {isMe && <span className="bg-[#BE7EC7] text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest">You</span>}
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] ml-2 ${roleBadgeColor}`}>
                          {displayRole}
                        </span>
                      </div>
                      <span className="text-white/40 text-xs mt-0.5 font-medium">{user.email}</span>
                    </div>
                  </div>

                  {!isTargetOwner && (
                    <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      {!isMe && (
                        <button onClick={() => openDeleteModal(user)} disabled={isLoading} className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all border border-red-500/10">
                          <Ban size={16} />
                        </button>
                      )}
                      <button onClick={() => openEditModal(user)} disabled={isLoading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 disabled:opacity-50 transition-all border border-white/10 font-bold text-xs uppercase tracking-widest">
                        <Edit size={14} /> Manage
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[110] p-4">
          <div className="bg-[#1F192E] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-white text-xl font-bold mb-2 tracking-tight">Remove Member?</h2>
            <p className="text-white/40 text-sm mb-8 leading-relaxed">Are you sure you want to revoke access for <span className="text-white font-bold">"{deleteTarget?.name}"</span> from this workspace?</p>
            <div className="flex gap-3">
              <button onClick={() => setIsDeleteOpen(false)} disabled={isLoading} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 disabled:opacity-50">Cancel</button>
              <button onClick={confirmDelete} disabled={isLoading} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 disabled:opacity-50 transition-all">
                {isLoading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[110] p-4">
          <div className="relative bg-[#161223] text-white w-full max-w-[480px] rounded-[2.5rem] border border-white/5 shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white/30 transition-all">
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#BE7EC7] flex items-center justify-center shadow-[0_0_20px_rgba(190,126,199,0.3)]">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{mode === "add" ? "Invite Member" : "Update Permissions"}</h2>
                <p className="text-white/40 text-xs font-medium">Assign a role and email for the workspace member</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className={labelClass}>User Email Address</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    disabled={mode === "edit"} 
                    className={`${inputClass} pl-11 ${mode === "edit" ? "opacity-50 cursor-not-allowed" : ""}`} 
                    placeholder="name@company.com" 
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Access Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                  <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} pl-11 appearance-none cursor-pointer`}>
                    <option value="ADMIN" className="bg-[#1F192E]">Administrator</option>
                    <option value="EMPLOYEE" className="bg-[#1F192E]">Employee</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">▼</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setIsOpen(false)} disabled={isLoading} className="flex-1 py-3.5 rounded-2xl bg-white/5 text-white/50 font-bold text-xs uppercase tracking-widest hover:bg-white/10 disabled:opacity-50 border border-white/5 transition-all">Cancel</button>
              <button onClick={mode === "add" ? handleAddUser : handleEditUser} disabled={isLoading} className="flex-1 py-3.5 rounded-2xl bg-[#BE7EC7] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#BE7EC7]/20 hover:bg-[#a66bb0] disabled:opacity-50 transition-all transform active:scale-95">
                {isLoading ? "Processing..." : (mode === "add" ? "Send Invite" : "Save Changes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}