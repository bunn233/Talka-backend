"use client";
import { Info, X, Trash2, Edit, UsersRound, Search, Plus, Check, Settings2, Globe, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

// Modal สำหรับสร้าง/แก้ไขทีม
function TeamModal({
    isOpen, title, onClose, onConfirm, teamName, setTeamName, teamDesc, setTeamDesc,
    teamMembers, setTeamMembers, userOptions, platforms, setPlatforms, isLoading
}) {
    if (!isOpen) return null;

    const inputClass = "w-full bg-white/[0.03] border border-white/10 focus:border-[#BE7EC7]/50 focus:bg-white/[0.08] outline-none rounded-xl py-2.5 px-4 text-white text-sm transition-all placeholder:text-white/20";
    const labelClass = "block text-[10px] font-black uppercase tracking-[0.15em] text-white/40 mb-1.5 ml-1";

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[100] p-4">
            <div className="relative bg-[#161223] text-white w-full max-w-[550px] rounded-[2.5rem] border border-white/5 shadow-2xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-300">
                
                <button onClick={onClose} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white/30 hover:text-white transition-all">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#BE7EC7] flex items-center justify-center shadow-[0_0_20px_rgba(190,126,199,0.3)]">
                        <Settings2 size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                        <p className="text-white/40 text-xs font-medium">Define team scope and assign members</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Team Name */}
                    <div>
                        <label className={labelClass}>Team Name</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="e.g. Customer Support Team A"
                            className={inputClass}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClass}>Team Description</label>
                        <textarea
                            value={teamDesc}
                            onChange={(e) => setTeamDesc(e.target.value)}
                            rows={2}
                            placeholder="Briefly describe this team's responsibility"
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    {/* Platform Selection */}
                    <div>
                        <label className={labelClass}>Connect to Platforms</label>
                        <div className="flex gap-3">
                            {['line', 'facebook'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                                    className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest ${
                                        platforms.includes(p) 
                                        ? (p === 'line' ? 'bg-[#06c755]/10 border-[#06c755] text-[#06c755]' : 'bg-[#1877f2]/10 border-[#1877f2] text-[#1877f2]') 
                                        : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'
                                    }`}
                                >
                                    <i className={`fa-brands fa-${p} text-xl`}></i>
                                    {p === 'line' ? 'Line OA' : 'Facebook'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Members */}
                    <div>
                        <label className={labelClass}>Assign Members ({teamMembers.length})</label>
                        <div className="bg-white/[0.02] border border-white/5 rounded-[1.5rem] p-2 max-h-[180px] overflow-y-auto custom-scrollbar">
                            {userOptions.map((user) => (
                                <label
                                    key={user.id}
                                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all mb-1 last:mb-0 ${
                                        user.isMe 
                                            ? 'bg-[#BE7EC7]/15 border border-[#BE7EC7]/30' 
                                            : teamMembers.includes(user.name) 
                                            ? 'bg-[#BE7EC7]/10' 
                                            : 'hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold uppercase ${
                                            user.isMe 
                                                ? 'bg-[#BE7EC7]/30 text-[#BE7EC7]' 
                                                : 'bg-white/10 text-white/40'
                                        }`}>
                                            {user.name.substring(0, 2)}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className="text-sm font-bold flex items-center gap-2">
                                                {user.name}
                                                {user.isMe && <span className="bg-gradient-to-r from-[#BE7EC7] to-[#d99fe8] text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-lg shadow-[#BE7EC7]/30">You</span>}
                                            </span>
                                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{user.role}</span>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${teamMembers.includes(user.name) ? 'bg-[#BE7EC7] border-[#BE7EC7]' : 'border-white/10'}`}>
                                        {teamMembers.includes(user.name) && <Check size={14} className="text-white" />}
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={teamMembers.includes(user.name)}
                                            onChange={() => {
                                                if (teamMembers.includes(user.name)) {
                                                    setTeamMembers(teamMembers.filter((u) => u !== user.name));
                                                } else {
                                                    setTeamMembers([...teamMembers, user.name]);
                                                }
                                            }}
                                        />
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-10">
                    <button onClick={onClose} disabled={isLoading} className="flex-1 py-3.5 rounded-2xl bg-white/5 text-white/50 font-bold text-xs uppercase tracking-widest hover:bg-white/10 disabled:opacity-50 transition-all border border-white/5">Cancel</button>
                    <button onClick={onConfirm} disabled={isLoading} className="flex-1 py-3.5 rounded-2xl bg-[#BE7EC7] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#BE7EC7]/20 hover:bg-[#a66bb0] disabled:opacity-50 transition-all transform active:scale-95">{isLoading ? "Saving..." : "Save Team"}</button>
                </div>
            </div>
        </div>
    );
}

// Confirm Delete Modal
function ConfirmDeleteModal({ isOpen, teamName, onClose, onConfirm, isLoading }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex justify-center items-center z-[110] p-4">
            <div className="bg-[#1F192E] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-500">
                    <Trash2 size={32} />
                </div>
                <h2 className="text-white text-xl font-bold mb-2 tracking-tight">Delete Team?</h2>
                <p className="text-white/40 text-sm mb-8">Are you sure you want to remove <span className="text-white font-bold">"{teamName}"</span>? This cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} disabled={isLoading} className="flex-1 py-3 rounded-xl bg-white/5 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 disabled:opacity-50">Cancel</button>
                    <button onClick={onConfirm} disabled={isLoading} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-600 disabled:opacity-50 transition-all">{isLoading ? "Deleting..." : "Delete"}</button>
                </div>
            </div>
        </div>
    );
}

export default function TeamSettingPage() {
    const { data: session } = useSession();
    
    const [teams, setTeams] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editTeam, setEditTeam] = useState(null);
    const [deleteTeam, setDeleteTeam] = useState(null);
    const [teamName, setTeamName] = useState("");
    const [teamDesc, setTeamDesc] = useState("");
    const [teamMembers, setTeamMembers] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session, isAddOpen]);

    const fetchData = async () => {
        try {
            setIsLoaded(false);
            
            // ดึงข้อมูล workspace current ก่อน
            const wsRes = await fetch("/api/users/current-workspace");
            const wsData = await wsRes.json();
            const workspaceId = wsData.activeWorkspaceId;
            
            // ดึงรายชื่อ users จาก workspace members (เพื่อให้ได้ workspace-level role)
            const usersResponse = await fetch(`/api/workspaces/members?wsId=${workspaceId}`);
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                
                // สร้าง current user object
                const currentUser = session?.user ? {
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email,
                    role: users.find(u => u.email === session.user.email)?.role || session.user.role || "EMPLOYEE",
                    isMe: true
                } : null;
                
                console.log("=== Team Setting Debug ===");
                console.log("Session:", session?.user);
                console.log("Current User:", currentUser);
                console.log("All Users from API:", users);
                
                // Filter out current user from the list (ใช้ id เป็น primary key)
                const otherUsers = users
                    .filter(u => !currentUser || (u.id !== currentUser.id && u.email !== currentUser.email))
                    .map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role || "EMPLOYEE", isMe: false }));
                
                const finalList = currentUser ? [currentUser, ...otherUsers] : otherUsers;
                console.log("Final User Options:", finalList);
                console.log("========================");
                
                setUserOptions(finalList);
            } else {
                throw new Error(`Failed to fetch users: ${usersResponse.status}`);
            }
            
            // ดึงทีมทั้งหมด
            const teamsResponse = await fetch("/api/teams");
            if (teamsResponse.ok) {
                const teamsData = await teamsResponse.json();
                setTeams(teamsData);
            }
            setError(null);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load data");
        } finally {
            setIsLoaded(true);
        }
    };

    const resetForm = () => {
        setTeamName("");
        setTeamDesc("");
        setTeamMembers([]);
        setPlatforms([]);
    };

    const handleAddTeam = async () => {
        if (!teamName.trim() || teamMembers.length === 0) return setError("Please fill in team name and select members");
        try {
            setIsLoading(true);
            const response = await fetch("/api/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: teamName.trim(),
                    desc: teamDesc.trim(),
                    members: teamMembers,
                    platforms: platforms
                })
            });
            if (!response.ok) throw new Error("Failed to create team");
            const newTeam = await response.json();
            setTeams((prev) => [...prev, newTeam]);
            setIsAddOpen(false);
            resetForm();
            setError(null);
        } catch (error) {
            console.error("Error creating team:", error);
            setError("Failed to create team");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/teams/${editTeam.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: teamName,
                    desc: teamDesc,
                    members: teamMembers,
                    platforms: platforms
                })
            });
            if (!response.ok) throw new Error("Failed to update team");
            const updatedTeam = await response.json();
            setTeams((prev) => prev.map((t) => (t.id === editTeam.id ? updatedTeam : t)));
            setIsEditOpen(false);
            setEditTeam(null);
            resetForm();
            setError(null);
        } catch (error) {
            console.error("Error updating team:", error);
            setError("Failed to update team");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTeam = async (team) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/teams/${team.id}`, {
                method: "DELETE"
            });
            if (!response.ok) throw new Error("Failed to delete team");
            setTeams(prev => prev.filter(t => t.id !== team.id));
            setIsDeleteOpen(false);
            setError(null);
        } catch (error) {
            console.error("Error deleting team:", error);
            setError("Failed to delete team");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenEdit = (team) => {
        setEditTeam(team);
        setTeamName(team.name);
        setTeamDesc(team.desc);
        setTeamMembers(team.members);
        setPlatforms(team.platforms || []);
        setIsEditOpen(true);
    };

    return (
        <div className="w-full h-[95vh] p-4 lg:p-6 ">
            <div className="bg-[#161223] border border-white/5 rounded-[2.5rem] shadow-2xl flex flex-col h-full overflow-hidden">
                
                {/* Header Section */}
                <div className="p-8 pb-6 shrink-0">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#BE7EC7] flex items-center justify-center shadow-[0_0_20px_rgba(190,126,199,0.3)]">
                                <UsersRound className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Team Setting</h1>
                                <p className="text-white/30 text-xs mt-1.5 font-medium">Organize agents and assign communication platforms</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                                <input type="text" className="w-full bg-white/5 border border-white/5 focus:border-[#BE7EC7]/50 outline-none rounded-2xl py-2.5 pl-12 pr-4 text-white text-sm" placeholder="Search team..." />
                            </div>
                            <button onClick={() => { resetForm(); setIsAddOpen(true); }} disabled={isLoading} className="flex items-center gap-2 bg-[#BE7EC7] hover:bg-[#a66bb0] disabled:opacity-50 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-[#BE7EC7]/20 transition-all">
                                <Plus size={18} /> Add Team
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-white/5 mx-8"></div>

                {error && (
                    <div className="mx-8 mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 text-sm flex items-center gap-3">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                {/* Teams List Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {teams.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20">
                            <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5">
                                <Globe size={40} className="text-white/10" />
                            </div>
                            <h2 className="text-white text-xl font-bold mb-2">No Teams Configured</h2>
                            <p className="text-white/30 text-sm max-w-xs mx-auto">Create teams to automate inbox assignments and group your agents.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {teams.map((team) => (
                                <div key={team.id} className="group relative bg-[#1F192E] border border-white/5 rounded-[1.8rem] p-6 hover:border-[#BE7EC7]/30 transition-all duration-300">
                                    {/* Sidebar Accent */}
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-[#BE7EC7] rounded-r-full opacity-0 group-hover:opacity-100 transition-all"></div>
                                    
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold text-white tracking-tight">{team.name}</h3>
                                                <div className="flex gap-1.5">
                                                    {team.platforms?.includes('line') && <i className="fa-brands fa-line text-[#06c755] text-xl"></i>}
                                                    {team.platforms?.includes('facebook') && <i className="fa-brands fa-facebook text-[#1877f2] text-xl"></i>}
                                                </div>
                                            </div>
                                            <p className="text-white/40 text-xs font-medium mb-4 line-clamp-1">{team.desc || "No description provided"}</p>
                                            
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 mr-1">Members:</span>
                                                {team.members.slice(0, 3).map((m, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-white/5 rounded-lg text-[10px] font-bold text-white/60 border border-white/5">
                                                        {m}
                                                    </span>
                                                ))}
                                                {team.members.length > 3 && (
                                                    <span className="text-[10px] font-bold text-[#BE7EC7] bg-[#BE7EC7]/10 px-2 py-1 rounded-lg">
                                                        +{team.members.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => { setDeleteTeam(team); setIsDeleteOpen(true); }} disabled={isLoading} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50 transition-all border border-red-500/10">
                                                <Trash2 size={16} />
                                            </button>
                                            <button onClick={() => handleOpenEdit(team)} disabled={isLoading} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 px-4 h-10 rounded-xl disabled:opacity-50 transition-all font-bold text-xs uppercase tracking-widest">
                                                <Edit size={14} /> Manage
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <TeamModal
                isOpen={isAddOpen} title="Add New Team" onClose={() => setIsAddOpen(false)} onConfirm={handleAddTeam}
                teamName={teamName} setTeamName={setTeamName} teamDesc={teamDesc} setTeamDesc={setTeamDesc}
                teamMembers={teamMembers} setTeamMembers={setTeamMembers} userOptions={userOptions} platforms={platforms} setPlatforms={setPlatforms}
                isLoading={isLoading}
            />

            <TeamModal
                isOpen={isEditOpen} title="Update Team" onClose={() => setIsEditOpen(false)} onConfirm={handleSaveEdit}
                teamName={teamName} setTeamName={setTeamName} teamDesc={teamDesc} setTeamDesc={setTeamDesc}
                teamMembers={teamMembers} setTeamMembers={setTeamMembers} userOptions={userOptions} platforms={platforms} setPlatforms={setPlatforms}
                isLoading={isLoading}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteOpen} teamName={deleteTeam?.name} onClose={() => setIsDeleteOpen(false)} onConfirm={() => handleDeleteTeam(deleteTeam)}
                isLoading={isLoading}
            />
        </div>
    );
}