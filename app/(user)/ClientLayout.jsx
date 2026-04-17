"use client";
import { useEffect, useState } from "react";
// ⚠️ เช็ค path ตรงนี้ให้ตรงกับที่พี่ใช้อยู่นะครับ
import Sidebar from "../components/Layout/SideBar"; 

export default function ClientLayout({ children }) {
    const [bg, setBg] = useState("/images/Bg.jpg");

    useEffect(() => {
        // ดึงพื้นหลังที่เคยเซฟไว้ (ถ้ามี)
        const savedBg = localStorage.getItem("appBackground");
        if (savedBg) setBg(savedBg);

        const listener = (e) => {
            setBg(e.detail);
        };
        window.addEventListener("background-changed", listener);
        
        return () => window.removeEventListener("background-changed", listener);
    }, []);

    return (
        <div
            className="flex h-screen bg-center bg-cover text-white overflow-hidden transition-all duration-300"
            style={{ backgroundImage: `url(${bg})` }}
        >
            <div className="fixed top-0 left-0 h-full z-20">
                <Sidebar />
            </div>

            <main className="flex-1 ml-[250px] h-full overflow-y-auto p-6">
                {children}
            </main>
        </div>
    );
}