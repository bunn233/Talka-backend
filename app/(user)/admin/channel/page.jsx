"use client";
import { useState } from "react";
import ChannelCatalog from "./catalog/page";
import ConnectFacebook from "./facebook/page";
import Telegram from "./Telegram/page"; // นำเข้าหน้า Telegram
import ConnectLine from "./line/line";
import ConnectLineStep1 from "./line/ConnectLineStep1";
import ConnectLineStep2 from "./line/ConnectLineStep2";
import ConnectLineStep3 from "./line/ConnectLineStep3";
import ConnectInstagram from "./instagram/page";
import { CheckCircle2 } from "lucide-react"; // สำหรับ Modal สวยๆ

export default function ChannelPage() {
  const [view, setView] = useState("catalog");
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  return (
    <>
      {/* --- Catalog View --- */}
      {view === "catalog" && (
        <ChannelCatalog
          onConnectFacebook={() => setView("facebook")}
          onConnectLine={() => setView("line")}
          onConnectTelegram={() => setView("telegram")}
          onConnectInstagram={() => setView("instagram")}
        />
      )}

      {/* --- Facebook Flow --- */}
       {view === "facebook" && (
        <ConnectFacebook onBack={() => {  setView("catalog"); }} />
      )}

      {view === "instagram" && (
        <ConnectInstagram onBack={() => { setView("catalog"); }} />
      )}

      {/* --- Telegram Flow --- */}
      {view === "telegram" && (
        <Telegram
          onBack={() => setView("catalog")}
          onComplete={() => {
            setShowCompleteModal(true);
            setView("catalog");
          }}
        />
      )}
      
      {/* --- LINE Flow --- */}
      {view === "line" && (
        <ConnectLine
          onBack={() => setView("catalog")}
          onNext={() => setView("line1")}
        />
      )}

      {view === "line1" && (
        <ConnectLineStep1
          onBack={() => setView("line")}
          onNext={() => setView("line2")}
        />
      )}

      {view === "line2" && (
        <ConnectLineStep2
          onBack={() => setView("line1")}
          onNext={() => setView("line3")}
        />
      )}

      {view === "line3" && (
        <ConnectLineStep3
          onBack={() => setView("line2")}
          onComplete={() => {
            setShowCompleteModal(true);
            setView("catalog");
          }}
        />
      )}

      {/* --- Premium Success Modal --- */}
      {showCompleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-[100] p-4 animate-in fade-in duration-300">
          <div className="bg-[#1F192E] p-10 rounded-[3rem] border border-white/10 shadow-2xl text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-emerald-500 border border-emerald-500/20 shadow-inner">
              <CheckCircle2 size={40} />
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              Linked Successfully!
            </h2>
            <p className="text-white/40 text-sm mb-10 leading-relaxed font-medium">
              Your LINE Official Account has been successfully integrated into your workspace.
            </p>

            <button
              onClick={() => setShowCompleteModal(false)}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all active:scale-95 shadow-lg"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      )}
    </>
  );
}