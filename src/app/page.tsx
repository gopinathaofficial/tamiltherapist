// src/app/page.tsx
"use client";

import React from "react";
import { TherapyProvider, useTherapy } from "@/components/TherapyContext";
import ChatContainer from "@/components/ChatContainer";

const Footer = () => {
  // This component is inside TherapyProvider so useTherapy works here
  const { language } = useTherapy();
  return (
    <footer className="text-center p-4 text-xs text-muted-foreground">
      {language === "tamil"
        ? `கிஷோர் மனநல உதவி உரையாடல் © ${new Date().getFullYear()}`
        : `ಶಿಲ್ಪಾ ಮಾನಸಿಕ ಆರೋಗ್ಯ ಸಂವಾದ © ${new Date().getFullYear()}`}
    </footer>
  );
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <TherapyProvider>
        <div className="w-full max-w-4xl h-[85vh] border rounded-lg shadow-sm overflow-hidden">
          <ChatContainer />
        </div>
        <Footer />
      </TherapyProvider>
    </main>
  );
}
