"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { 
    MessageCircle, Link as LinkIcon, Users, 
    BarChart3, Bot, Sparkles, ArrowRight, ShieldCheck, X, CheckCircle2
} from 'lucide-react';
import { GlassBackground } from '@/app/components/Shared/GlassBackground';
import ClientLayout from "@/app/(user)/ClientLayout";

// 📚 ข้อมูล Guide พร้อมเนื้อหาแบบละเอียด (Step-by-step)
const guides = [
    {
        id: 'chat',
        title: "การใช้งานระบบสนทนา (Chat)",
        description: "ดูแชทจากทุกช่องทาง ตอบกลับลูกค้า และจัดการสถานะการสนทนา (รอตอบ, ตอบแล้ว)",
        icon: MessageCircle,
        href: "/chat/allchat",
        color: "from-blue-400 to-cyan-400",
        bgLight: "bg-blue-500/10",
        isAdminOnly: false,
        coverImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        steps: [
            {
                title: "1. หน้าต่างรวมแชท (Chat List)",
                description: "เมื่อลูกค้าทักเข้ามาจากช่องทางใดก็ตาม ข้อความจะมารวมอยู่ที่แถบด้านซ้ายมือ คุณสามารถดูแชททั้งหมดได้ที่นี่",
                image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop"
            },
            {
                title: "2. การคัดกรองข้อความ (Filtering)",
                description: "ด้านบนของ Chat List คุณสามารถกรองข้อความตามสถานะ เช่น NEW (แชทใหม่รอตอบ), OPEN (กำลังคุย), หรือ CLOSED (ปิดงานแล้ว)",
                image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop"
            },
            {
                title: "3. การตอบโต้และส่งไฟล์",
                description: "ในช่องพิมพ์ข้อความ คุณสามารถส่งข้อความ แนบรูปภาพ หรือใช้อีโมจิเพื่อสร้างความประทับใจให้ลูกค้าได้",
                image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop"
            }
        ]
    },
    {
        id: 'ai',
        title: "การสร้าง AI Agent",
        description: "สร้างและฝึกฝน AI Agent ให้ตอบคำถามลูกค้าแทนพนักงานแบบอัตโนมัติ 24 ชม.",
        icon: Bot,
        href: "/ai-support",
        color: "from-purple-400 to-pink-400",
        bgLight: "bg-purple-500/10",
        isAdminOnly: true,
        coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
        steps: [
            {
                title: "1. เลือกเทมเพลต (Smart Templates)",
                description: "เริ่มสร้าง AI ได้ง่ายๆ โดยเลือกเทมเพลตที่มีให้ เช่น Sales Agent หรือ Support Agent หรือสร้างใหม่จากศูนย์",
                image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=300&fit=crop"
            },
            {
                title: "2. ป้อนคำสั่งและข้อห้าม (Prompt & Guardrails)",
                description: "กำหนดหน้าที่หลัก โทนเสียง และข้อห้ามที่ AI ไม่ควรตอบ เพื่อให้บอทฉลาดและปลอดภัยต่อแบรนด์",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
            },
            {
                title: "3. ทดสอบและนำไปใช้ (Test & Publish)",
                description: "คุยทดสอบกับบอทในช่อง Live Test ด้านขวามือ หากพอใจแล้วให้กด Publish เพื่อเปิดใช้งานจริง",
                image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&h=300&fit=crop"
            }
        ]
    },
    {
        id: 'connect',
        title: "การเชื่อมต่อช่องทาง (Channels)",
        description: "ตั้งค่าเชื่อมต่อ Facebook, LINE, Telegram เพื่อรวมแชทมาไว้ที่หน้าต่างเดียว",
        icon: LinkIcon,
        href: "/admin/channel",
        color: "from-emerald-400 to-teal-400",
        bgLight: "bg-emerald-500/10",
        isAdminOnly: true,
        coverImage: "/images/chanelPage.png",
        steps: [
            {
                title: "1. เลือกแพลตฟอร์ม",
                description: "คลิกเลือกแพลตฟอร์มที่คุณต้องการเชื่อมต่อ เช่น เพจ Facebook, LINE OA หรือบอท Telegram",
                image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop"
            },
            {
                title: "2. กรอกข้อมูล API",
                description: "ใส่ Access Token หรือ Channel Secret ที่ได้จากแพลตฟอร์มนั้นๆ ลงในช่องที่กำหนดให้ถูกต้อง",
                image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop"
            },
            {
                title: "3. เปิดใช้งาน (Connected)",
                description: "เมื่อเชื่อมต่อสำเร็จ สถานะจะเปลี่ยนเป็น Connected หลังจากนั้นข้อความของลูกค้าจะไหลเข้าสู่ระบบทันที",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
            }
        ]
    },
    {
        id: 'report',
        title: "รายงานและสถิติ (Reports)",
        description: "วิเคราะห์ประสิทธิภาพของทีม ความเร็วในการตอบกลับ และข้อมูลของลูกค้า",
        icon: BarChart3,
        href: "/Report/conversation",
        color: "from-amber-400 to-orange-400",
        bgLight: "bg-amber-500/10",
        isAdminOnly: true,
        coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
        steps: [
            {
                title: "1. ภาพรวมการสนทนา",
                description: "ดูสถิติจำนวนแชทที่เข้ามาในแต่ละวัน ช่วงเวลาที่ลูกค้าทักมาเยอะที่สุด เพื่อจัดเตรียมพนักงานให้พร้อม",
                image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=400&h=300&fit=crop"
            },
            {
                title: "2. ประสิทธิภาพของทีม",
                description: "เช็คความเร็วในการตอบกลับ (Response Time) ของพนักงานแต่ละคน เพื่อประเมินผลการทำงาน",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
            }
        ]
    },
    {
        id: 'team',
        title: "การจัดการทีม (Team)",
        description: "เชิญพนักงานเข้าทีม กำหนดสิทธิ์การเข้าถึง และแบ่งแผนกในการดูแลลูกค้า",
        icon: Users,
        href: "/admin/usersetting",
        color: "from-indigo-400 to-blue-500",
        bgLight: "bg-indigo-500/10",
        isAdminOnly: true,
        coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
        steps: [
            {
                title: "1. เชิญสมาชิก (Invite)",
                description: "เข้าไปที่เมนู Users ส่งคำเชิญผ่านอีเมลเพื่อให้พนักงานใหม่สามารถเข้าสู่ Workspace นี้ได้",
                image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=300&fit=crop"
            },
            {
                title: "2. กำหนดบทบาท (Role)",
                description: "เลือกว่าจะให้เป็นพนักงานทั่วไป (Employee) หรือผู้ดูแลระบบ (Admin) เพื่อจำกัดการเข้าถึงเมนูต่างๆ",
                image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"
            }
        ]
    }
];

export default function GuidePage() {
    const { data: session } = useSession();
    const router = useRouter();
    
    const [userRole, setUserRole] = useState("EMPLOYEE");
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGuide, setSelectedGuide] = useState(null); // ควบคุม Modal

    const userName = session?.user?.name || "Guest";

    // ดึงสิทธิ์ User เพื่อแยกว่าควรเห็น Guide ของ Admin ไหม
    useEffect(() => {
        const fetchRole = async () => {
            try {
                const res = await fetch(`/api/users/profile`);
                if (res.ok) {
                    const data = await res.json();
                    const wsRes = await fetch("/api/users/current-workspace");
                    
                    if (wsRes.ok) {
                        const wsData = await wsRes.json();
                        const currentWsId = String(wsData.activeWorkspaceId);
                        const userWorkspaces = data.workspaces || [];
                        const currentWs = userWorkspaces.find((ws) => String(ws.id) === currentWsId);
                        
                        if (currentWs) {
                            setUserRole(currentWs.role.toUpperCase());
                        } else {
                            setUserRole(data.profile.role.toUpperCase());
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch role");
            } finally {
                setIsLoading(false);
            }
        };

        fetchRole();
    }, []);

    const isAdminOrOwner = userRole === "ADMIN" || userRole === "OWNER";
    const visibleGuides = guides.filter(guide => !guide.isAdminOnly || isAdminOrOwner);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <ClientLayout>
            <div className="h-[94vh] w-full overflow-y-auto custom-scrollbar bg-[rgba(32,41,59,0.37)] border border-[rgba(254,253,253,0.5)] backdrop-blur-xl rounded-3xl shadow-2xl text-white relative px-6 py-10 md:px-12">
                
                {/* Background Effects */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden rounded-3xl z-0">
                    <div className="absolute inset-0 bg-[radial-linear(ellipse_at_top,var(--tw-gradient-stops))] from-[#1a1c3a] via-[#090a1a] to-[#000000]"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] mix-blend-screen"></div>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col items-center text-center mb-12">
                        <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/10 mb-6 shadow-inner">
                            <Sparkles className="w-6 h-6 text-[#BE7EC7] animate-pulse" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">{userName}</span>
                        </h1>
                        <p className="text-white/50 text-lg max-w-xl">
                            เลือกเมนูที่คุณต้องการเรียนรู้วิธีใช้งาน ระบบได้คัดกรองฟีเจอร์ที่ตรงกับสิทธิ์ของคุณไว้ให้แล้ว
                        </p>
                        
                        {!isLoading && (
                            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold tracking-widest uppercase">
                                <ShieldCheck size={14} className={isAdminOrOwner ? "text-amber-400" : "text-blue-400"} />
                                <span className={isAdminOrOwner ? "text-amber-400" : "text-blue-400"}>
                                    {userRole} ACCESS
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Guides Grid */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="w-10 h-10 border-4 border-[#BE7EC7] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {visibleGuides.map((guide) => (
                                <motion.div key={guide.id} variants={itemVariants}>
                                    <GlassBackground 
                                        className="h-full group hover:bg-white/10 border-white/10 hover:border-white/30 transition-all duration-300 cursor-pointer overflow-hidden"
                                        onClick={() => setSelectedGuide(guide)} // 🔥 เปลี่ยนเป็นเปิด Modal แทน
                                    >
                                        <div className="p-6 flex flex-col h-full relative">
                                            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${guide.color}`} />

                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-inner ${guide.bgLight}`}>
                                                <guide.icon className="w-6 h-6 text-white" />
                                            </div>
                                            
                                            <h3 className="text-xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all">
                                                {guide.title}
                                            </h3>
                                            
                                            <p className="text-sm text-white/50 leading-relaxed flex-1">
                                                {guide.description}
                                            </p>

                                            <div className="mt-8 flex items-center text-sm font-bold text-white/40 group-hover:text-[#BE7EC7] transition-colors">
                                                ดูวิธีการใช้งาน <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </div>
                                    </GlassBackground>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* 🔥 Modal แสดงรายละเอียด (Tutorial Modal) */}
                <AnimatePresence>
                    {selectedGuide && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
                            {/* Backdrop */}
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setSelectedGuide(null)}
                            />

                            {/* Modal Content */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                                animate={{ opacity: 1, scale: 1, y: 0 }} 
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-4xl max-h-full bg-[#120F1D] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                            >
                                {/* Header / Cover Image */}
                                <div className="relative h-48 md:h-64 shrink-0 bg-white/5">
                                    <img src={selectedGuide.coverImage} className="w-full h-full object-cover" alt="Cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#120F1D] via-[#120F1D]/60 to-transparent" />
                                    <button 
                                        onClick={() => setSelectedGuide(null)}
                                        className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-red-500/80 text-white rounded-full flex items-center justify-center transition-colors border border-white/10"
                                    >
                                        <X size={20} />
                                    </button>
                                    <div className="absolute bottom-6 left-6 md:left-10 flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg ${selectedGuide.bgLight}`}>
                                            <selectedGuide.icon className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white">{selectedGuide.title}</h2>
                                            <p className="text-sm text-white/60 mt-1">{selectedGuide.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Steps Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                                    <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
                                        <CheckCircle2 className="text-[#BE7EC7]" size={20} /> ขั้นตอนการใช้งาน
                                    </h3>
                                    
                                    <div className="space-y-8">
                                        {selectedGuide.steps.map((step, idx) => (
                                            <div key={idx} className="flex flex-col md:flex-row gap-6 items-start bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                                <div className="w-full md:w-1/3 shrink-0">
                                                    <img src={step.image} className="w-full h-32 md:h-40 object-cover rounded-xl border border-white/10 shadow-md" alt={`Step ${idx + 1}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-lg font-bold text-purple-200 mb-2">{step.title}</h4>
                                                    <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer Button (Go to Page) */}
                                <div className="p-6 border-t border-white/5 bg-[#0B0914] shrink-0 flex justify-end">
                                    <button
                                        onClick={() => router.push(selectedGuide.href)}
                                        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:scale-105"
                                    >
                                        ไปที่หน้านี้ (Start Using) <ArrowRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </ClientLayout>
    );
}