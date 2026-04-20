"use client";
import { useState } from "react";
import MainPage from "@/app/components/Ai-Agent/MainPage.jsx";
import TemplatesPage from "@/app/components/Ai-Agent/TemplatesPage.jsx";
import AgentBuilder from "@/app/components/Ai-Agent/AgentBuilder.jsx";

const TEMPLATES = {
  receptionist: {
    name: "Receptionist",
    emoji: "🛎️",
    greeting: "สวัสดีค่ะ มีอะไรให้ช่วยไหมคะ?",
    instructions: "Greets Contacts, identifies their needs, captures details, and routes them.",
    tone: "professional"
  },
  sales: {
    name: "Sales Agent",
    emoji: "📈",
    greeting: "สวัสดีครับ สนใจสินค้าตัวไหนสอบถามได้เลยครับ",
    instructions: "Learns customer needs, suggests products, and connects to the right team.",
    tone: "persuasive"
  },
  support: {
    name: "Support Agent",
    emoji: "🛠️",
    greeting: "สวัสดีค่ะ พบปัญหาการใช้งานด้านไหนคะ?",
    instructions: "Answers product questions using AI Knowledge Sources and escalates.",
    tone: "friendly"
  }
};

export default function AiSupportFlow() {
  const [currentStep, setCurrentStep] = useState("intro"); 
  const [selectedAgent, setSelectedAgent] = useState(null); 

  return (
    /** * 🟢 ปรับปรุงเลย์เอาต์หลักตรงนี้:
     * - py-6 px-10 lg:px-14: เว้นระยะห่างจากขอบจอและ Sidebar
     * - flex justify-center: จัดให้อยู่กึ่งกลางเสมอ
     * - h-[94vh]: ความสูงมาตรฐานให้เหลือขอบล่างนิดหน่อยดูพรีเมียม
     */
    <div className="w-full h-[94vh] py-6 px-10 lg:px-14 flex justify-center overflow-hidden">
      <div className="w-full max-w-[1800px] h-full flex flex-col animate-in fade-in duration-500">
        
        {currentStep === "intro" && (
          <MainPage onStart={() => setCurrentStep("list")} />
        )}

        {currentStep === "list" && (
          <TemplatesPage 
            onBack={() => setCurrentStep("intro")}
            oncreatenew={() => {
              setSelectedAgent(null); 
              setCurrentStep("builder");
            }}
            onEditAgent={(agent) => {
              setSelectedAgent(agent); 
              setCurrentStep("builder");
            }}
            onreceptionist={() => {
              setSelectedAgent(TEMPLATES.receptionist); 
              setCurrentStep("builder");
            }}
            onsalesagent={() => {
              setSelectedAgent(TEMPLATES.sales);
              setCurrentStep("builder");
            }}
            onsupportagent={() => {
              setSelectedAgent(TEMPLATES.support);
              setCurrentStep("builder");
            }}
          />
        )}

        {currentStep === "builder" && (
          <AgentBuilder 
            initialData={selectedAgent}
            onBack={() => setCurrentStep("list")}
            onSaveSuccess={() => setCurrentStep("list")}
          />
        )}
        
      </div>
    </div>
  );
}