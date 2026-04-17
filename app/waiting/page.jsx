"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Clock, Plus, Building2, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import ClientLayout from "@/app/(user)/ClientLayout";

export default function WaitingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [isCreating, setIsCreating] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) return;
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/workspaces/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      });
      
      if (res.ok) {
        window.location.href = "/chat/allchat";
      } else {
        alert("เกิดข้อผิดพลาดในการสร้าง Workspace");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ClientLayout>
      <div className="flex justify-center items-center h-full w-full font-sans selection:bg-[#BE7EC7] selection:text-white p-4 relative overflow-hidden">
        
        {/* Background Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#BE7EC7]/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#161223] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center relative z-10 transition-all duration-500">
          
          {/* Animated Clock Icon */}
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mb-6 relative border border-white/10 shadow-inner">
            <Clock size={36} className="text-[#BE7EC7] animate-pulse" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-[#161223] animate-bounce"></div>
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight mb-3">
            Waiting for Invitation
          </h1>
          
          <p className="text-white/40 text-sm leading-relaxed mb-8 font-medium px-4">
            Hi <span className="text-white font-bold">{session?.user?.name || "there"}</span>, you haven't joined any workspace yet. Please wait for your team admin to invite you.
          </p>

          {/* Action Area */}
          <div className="w-full">
            {!isCreating ? (
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full bg-[#BE7EC7] hover:bg-[#a66bb0] text-white py-3.5 rounded-2xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-[#BE7EC7]/20 active:scale-95"
              >
                <Plus size={18} /> Or create your own Workspace
              </button>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-3">
                <div className="relative text-left">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:border-[#BE7EC7] focus:bg-white/10 outline-none transition-all text-sm"
                    placeholder="Enter Workspace Name"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsCreating(false)}
                    disabled={isLoading}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    <X size={16} className="mx-auto" />
                  </button>
                  <button 
                    onClick={handleCreateWorkspace}
                    disabled={isLoading || !workspaceName.trim()}
                    className="flex-[3] bg-[#BE7EC7] hover:bg-[#a66bb0] text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all disabled:opacity-50 text-sm"
                  >
                    {isLoading ? "Creating..." : "Confirm & Enter"} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </ClientLayout>
  );
}