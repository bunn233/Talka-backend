"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useSession } from "next-auth/react"; // 🔥 1. ดึง useSession มาใช้ดึงชื่อผู้ใช้
import { GlassBackground } from '@/app/components/Shared/GlassBackground';
import TutorialModal from '@/app/components/Modals/TutorialModal';
import ClientLayout from "@/app/(user)/ClientLayout"; // 🔥 2. Import ClientLayout มาห่อหน้าเว็บ

const tutorials = [
    {
        id: 1,
        title: "การเชื่อมต่อเเพลตฟอร์ม",
        image: "/images/chanelPage.png",
        description: "วิธีการเชื่อมต่อ Platform ต่างๆ เช่น Facebook, LINE เพื่อใช้งานระบบ Chat",
        steps: [
            {
                title: "ไปที่ Menu Conect Platform",
                description: "ด้านซ้ายมือของหน้าจอ คลิกที่ 'Conect Platform' ใน Admin Panel เพื่อเริ่มต้น",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
            },
            {
                title: "เลือก Platform ที่ต้องการเชื่อมต่อ",
                description: "คลิกที่ Platform ที่คุณต้องการเชื่อมต่อ เช่น Facebook หรือ LINE",
                image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=400&h=300&fit=crop"
            },
            {
                title: "ทำตามขั้นตอนการตั้งค่า",
                description: "หลังจากที่กดเลือก Platform แล้ว ให้ทำตามขั้นตอนที่แสดงบนหน้าจอเพื่อเชื่อมต่อ",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
            },
            {
                title: "กดปุ่ม Connected Channels",
                description: "ด้านขวาบนของหน้าจอ คลิกที่ปุ่ม เพื่อดูสถานะการเชื่อมต่อของ Platform ต่างๆ",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
            },
        ]
    },
    {
        id: 2,
        title: "การใช้งานระบบ Chat",
        image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop",
        description: "วิธีการใช้งานระบบ Chat และ Feature ต่างๆ ที่ช่วยให้การตอบลูกค้าง่ายขึ้น",
        steps: [
            {
                title: "Chat list",
                description: "หลังจากที่ลูกค้าส่งข้อความเข้ามา คุณจะเห็นรายชื่อการสนทนาด้านซ้ายมือหัวข้อ Chat List",
                image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop"
            },
            {
                title: "การ Filter ข้อความ",
                description: "ด้านบนของ Chat List คุณสามารถกรองข้อความตามสถานะ เช่น รอตอบ, ตอบแล้ว หรือ แบบ All",
                image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop"
            },
            {
                title: "ทดสอบและปรับปรุง",
                description: "ทดสอบข้อความและปรับปรุงตามผลตอบรับจากผู้ใช้",
                image: "https://images.unsplash.com/photo-1556155092-490a1ba16284?w=400&h=300&fit=crop"
            }
        ]
    },
    {
        id: 3,
        title: "การวิเคราะห์ข้อมูล",
        image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
        description: "ติดตามและวิเคราะห์ประสิทธิภาพของ Chatbot ของคุณ",
        steps: [
            {
                title: "เข้าสู่แดชบอร์ด",
                description: "คลิกที่เมนู 'รายงาน' เพื่อดูข้อมูลสถิติโดยรวม",
                image: "https://images.unsplash.com/photo-1543286386-713bdd548da4?w=400&h=300&fit=crop"
            },
            {
                title: "วิเคราะห์การสนทนา",
                description: "ดูรายละเอียดการสนทนาและหาจุดที่ควรปรับปรุง",
                image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop"
            },
            {
                title: "ส่งออกรายงาน",
                description: "ดาวน์โหลดรายงานเพื่อนำเสนอหรือเก็บเป็นข้อมูล",
                image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop"
            }
        ]
    },
    {
        id: 4,
        title: "การเชื่อมต่อช่องทาง",
        image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop",
        description: "เชื่อมต่อบอทของคุณกับ Facebook, LINE และช่องทางอื่นๆ",
        steps: [
            {
                title: "เลือกช่องทาง",
                description: "เลือกช่องทางที่ต้องการเชื่อมต่อจากรายการที่รองรับ",
                image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&h=300&fit=crop"
            },
            {
                title: "ตั้งค่าการเชื่อมต่อ",
                description: "ป้อน API Key และข้อมูลที่จำเป็นสำหรับการเชื่อมต่อ",
                image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=300&fit=crop"
            },
            {
                title: "ทดสอบการทำงาน",
                description: "ส่งข้อความทดสอบเพื่อยืนยันว่าการเชื่อมต่อสำเร็จ",
                image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop"
            }
        ]
    },
    {
        id: 5,
        title: "การจัดการทีม",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop",
        description: "เพิ่มสมาชิกทีมและจัดการสิทธิ์การเข้าถึง",
        steps: [
            {
                title: "เชิญสมาชิก",
                description: "ส่งคำเชิญผ่านอีเมลให้สมาชิกทีมใหม่",
                image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=400&h=300&fit=crop"
            },
            {
                title: "กำหนดบทบาท",
                description: "ตั้งค่าสิทธิ์การเข้าถึงตามบทบาทของแต่ละคน",
                image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop"
            },
            {
                title: "ติดตามกิจกรรม",
                description: "ดูประวัติการทำงานของสมาชิกในทีม",
                image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop"
            }
        ]
    }
];

export default function Page() {
    const { data: session } = useSession(); // 🔥 ดึงข้อมูลจาก Session แทนการใช้ useEffect

    const [selectedCard, setSelectedCard] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const userName = session?.user?.name || "Guest"; // 🔥 ใช้ชื่อจริงๆ จากระบบ

    const openModal = (tutorial) => {
        setSelectedCard(tutorial);
    };

    const closeModal = () => {
        setSelectedCard(null);
    };

    const nextCard = () => {
        setCurrentIndex((prev) => (prev + 1) % tutorials.length);
    };

    const prevCard = () => {
        setCurrentIndex((prev) => (prev - 1 + tutorials.length) % tutorials.length);
    };

    // ฟังก์ชันสำหรับคำนวณตำแหน่งการ์ดแบบวงกลม
    const getCardPosition = (index) => {
        const total = tutorials.length;
        const diff = (index - currentIndex + total) % total;
        const angle = (diff / total) * Math.PI * 2;
        const radius = 550; 
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius - radius;
        const rotateY = -(angle * 180) / Math.PI;
        const position = diff <= total / 2 ? diff : diff - total;

        return { x, z, rotateY, position, isCenter: diff === 0 };
    };

    const textVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.8, ease: "easeOut" }
        }
    };

    return (
        // 🔥 3. ห่อทั้งหมดด้วย ClientLayout
        <ClientLayout>
            <div className="h-[94vh] w-full overflow-hidden bg-[rgba(32,41,59,0.37)] border border-[rgba(254,253,253,0.5)] backdrop-blur-xl rounded-3xl shadow-2xl text-white relative flex flex-col items-center py-10">

                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-linear(ellipse_at_top,var(--tw-gradient-stops))] from-[#1a1c3a] via-[#090a1a] to-[#000000]"></div>
                    {/* ดาว */}
                    <div className='absolute inset-0 opacity-40' style={{
                        backgroundImage: 'radial-gradient(white, rgba(255,255,255,.2) 2px, transparent 5px), radial-gradient(white, rgba(255,255,255,.15) 1px, transparent 3px), radial-gradient(white, rgba(255,255,255,.1) 2px, transparent 4px)',
                        backgroundSize: '550px 550px, 350px 350px, 250px 250px',
                        backgroundPosition: '0 0, 40px 60px, 130px 270px',
                        animation: 'starsAnimation 120s linear infinite'
                    }}></div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[150px] mix-blend-screen z-0"></div>
                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen z-0"></div>
                </div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    className="text-center mb-10 relative z-10 mt-10"
                >
                    <motion.div variants={textVariants} className="inline-block relative">
                        {/* ไอคอน */}
                        <Sparkles className="absolute -top-6 -left-8 w-8 h-8 text-purple-400 animate-pulse" />
                        <h1 className="text-[50px] font-bold leading-tight">
                            <span className="block bg-clip-text text-transparent bg-linear-to-r from-white via-purple-200 to-blue-200 drop-shadow-[0_0_15px_rgba(190, 126, 199, 0.8)]">
                                Welcome, "{userName}"
                            </span>
                            <span className="block text-[28px] font-light text-purple-200/80 mt-2">
                                ยินดีต้อนรับเข้าสู่ Talka
                            </span>
                        </h1>
                        <div className="h-1 w-40 mx-auto mt-6 bg-linear-to-r from-transparent via-purple-500 to-transparent rounded-full opacity-70"></div>
                    </motion.div>
                    <p className='text-lg font-semibold mt-6 text-purple-300 tracking-widest uppercase'>Tutorials</p>
                </motion.div>

                <div className="relative h-[450px] w-full flex items-center justify-center z-20 my-auto">
                    {/* Navigation Buttons */}
                    <motion.button
                        whileHover={{ scale: 1.2, backgroundColor: "rgba(255,255,255,0.2)", boxShadow: "0 0 30px rgba(190, 126, 199, 0.8)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={prevCard}
                        className="absolute left-[10%] z-30 bg-white/5 backdrop-blur-xl rounded-full p-5 transition-all shadow-[0_0_20px_rgba(190,126,199,0.3)] border border-white/20 group"
                    >
                        <ChevronLeft className="w-8 h-8 text-white group-hover:text-purple-200 transition-colors" />
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.2, backgroundColor: "rgba(255,255,255,0.2)", boxShadow: "0 0 30px rgba(190, 126, 199, 0.8)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={nextCard}
                        className="absolute right-[10%] z-30 bg-white/5 backdrop-blur-xl rounded-full p-5 transition-all shadow-[0_0_20px_rgba(190,126,199,0.3)] border border-white/20 group"
                    >
                        <ChevronRight className="w-8 h-8 text-white group-hover:text-purple-200 transition-colors" />
                    </motion.button>

                    {/* Cards Carousel */}
                    <div className="relative w-full max-w-6xl h-full flex items-center justify-center"
                        style={{
                            perspective: "2500px", 
                            perspectiveOrigin: "center center"
                        }}
                    >
                        <AnimatePresence initial={false}>
                            {tutorials.map((tutorial, index) => {
                                const { x, z, rotateY, position, isCenter } = getCardPosition(index);

                                return (
                                    <motion.div
                                        key={tutorial.id}
                                        initial={{ scale: 0.5, opacity: 0, x: x, z: z - 200, rotateY: rotateY }}
                                        animate={{
                                            x: x,
                                            z: z,
                                            scale: isCenter ? 1 : 0.7,
                                            opacity: isCenter ? 1 : 0.3, 
                                            rotateY: rotateY,
                                            zIndex: isCenter ? 20 : Math.round(10 - Math.abs(z) / 50),
                                            filter: isCenter ? 'blur(0px) brightness(1.1) contrast(1.05)' : 'blur(5px) brightness(0.5) grayscale(20%)',
                                        }}
                                        exit={{
                                            scale: 0.3,
                                            opacity: 0,
                                            x: x + (position < 0 ? -500 : 500),
                                            z: z - 400,
                                            rotateY: rotateY + (position < 0 ? -60 : 60),
                                            transition: {
                                                duration: 0.7,
                                                ease: [0.25, 0.1, 0.25, 1],
                                                type: "tween"
                                            }
                                        }}
                                        transition={{
                                            x: { type: "spring", stiffness: 50, damping: 20, mass: 1.2 },
                                            z: { type: "spring", stiffness: 50, damping: 20, mass: 1.2 },
                                            scale: { type: "spring", stiffness: 80, damping: 25 },
                                            opacity: { duration: 0.5, ease: "easeInOut" },
                                            rotateY: { type: "spring", stiffness: 50, damping: 25, mass: 1.5 },
                                            filter: { duration: 0.5, ease: "easeInOut" }
                                        }}
                                        className="absolute w-[420px]"
                                        style={{
                                            pointerEvents: isCenter ? 'auto' : 'none',
                                            transformStyle: "preserve-3d",
                                            transformOrigin: 'center center',
                                        }}
                                    >
                                        <motion.div
                                            whileHover={isCenter ? {
                                                scale: 1.05,
                                                rotateY: 0,
                                                z: 40,
                                                boxShadow: "0 1px 100px -20px rgba(190, 126, 199, 0.8), 0 0 30px rgba(255,255,255,0.2) inset",
                                                transition: {
                                                    duration: 0.5,
                                                    type: "spring",
                                                    stiffness: 150,
                                                    damping: 20
                                                }
                                            } : {}}
                                            className="h-full rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                                            style={{
                                                transformStyle: "preserve-3d",
                                            }}
                                        >
                                            <GlassBackground className="h-full border-white/30 bg-white/10"
                                                style={{
                                                    transform: "translateZ(0)",
                                                    backfaceVisibility: "hidden",
                                                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.02))'
                                                }}
                                            >
                                                <div className="relative h-64 overflow-hidden rounded-t-3xl group-hover:brightness-110 transition-all">
                                                    <img
                                                        src={tutorial.image}
                                                        alt={tutorial.title}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-linear-to-t from-[#090a1a] via-transparent to-transparent opacity-60" />
                                                </div>

                                                <div className="p-6 relative">
                                                    <h3
                                                        className="text-3xl font-bold mb-3 drop-shadow-lg"
                                                        style={{
                                                            background: 'linear-gradient(90deg, #fff, #a855f7, #3b82f6)',
                                                            WebkitBackgroundClip: 'text',
                                                            WebkitTextFillColor: 'transparent',
                                                        }}
                                                    >
                                                        {tutorial.title}
                                                    </h3>
                                                    <p className="text-purple-100/80 mb-8 line-clamp-3 text-sm leading-relaxed font-light">
                                                        {tutorial.description}
                                                    </p>

                                                    {isCenter && (
                                                        <motion.button
                                                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                                                            whileHover={{ scale: 1.05, boxShadow: "0 20px 50px rgba(168, 85, 247, 0.6)" }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => openModal(tutorial)}
                                                            className="w-full bg-[rgba(190,126,199,0.56)] text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg relative overflow-hidden group"
                                                        >
                                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                                เพิ่มเติม <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                            </span>
                                                            <div className="absolute inset-0 h-full w-full bg-linear-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </GlassBackground>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Dots Indicator */}
                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex gap-4 z-20 bg-black/20 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                        {tutorials.map((_, index) => (
                            <motion.button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                animate={{
                                    scale: currentIndex === index ? 1.5 : 1,
                                    opacity: currentIndex === index ? 1 : 0.4,
                                    background: currentIndex === index
                                        ? 'linear-gradient(90deg, #a855f7, #ec4899)'
                                        : 'rgba(255, 255, 255, 0.5)',
                                    boxShadow: currentIndex === index ? "0 0 20px rgba(168, 85, 247, 1)" : "none"
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`w-3 h-3 rounded-full transition-all`}
                            />
                        ))}
                    </div>
                </div>

                <AnimatePresence>
                    {selectedCard && (
                        <TutorialModal
                            tutorial={selectedCard}
                            onClose={closeModal}
                        />
                    )}
                </AnimatePresence>
            </div>
        </ClientLayout>
    );
}