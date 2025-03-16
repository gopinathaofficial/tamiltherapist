"use client";

import React from "react";
import { TherapyProvider } from "@/components/TherapyContext";
import ChatContainer from "@/components/ChatContainer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-4xl h-[85vh] border rounded-lg shadow-sm overflow-hidden">
        <TherapyProvider>
          <ChatContainer />
        </TherapyProvider>
      </div>
      <footer className="text-center p-4 text-xs text-muted-foreground">
        Tamil Therapist © {new Date().getFullYear()}
      </footer>
    </main>
  );
}
