// src/components/ChatContainer.tsx
import React, { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import { useTherapy } from "./TherapyContext";

const ChatContainer: React.FC = () => {
  const { messages, isLoading, resetChat } = useTherapy();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Filter out system messages for display
  const displayMessages = messages.filter((msg) => msg.role !== "system");

  return (
    <div className="flex flex-col h-full max-h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-semibold">Tamil Therapist</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetChat}
          title="உரையாடலை மீட்டமைக்க"
          className="h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Type what you feel!
          </div>
        ) : (
          <>
            {displayMessages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>பதிலளிக்கிறது...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input container */}
      <ChatInput />
    </div>
  );
};

export default ChatContainer;
