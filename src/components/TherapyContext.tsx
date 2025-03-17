import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Message, TherapyContextType } from "@/lib/types";
import {
  generateId,
  saveMessagesToSession,
  loadMessagesFromSession,
} from "@/lib/utils";
import {
  streamingDeepSeekResponse,
  createInitialAssistantMessage,
} from "@/lib/deepseek";
import TAMIL_SYSTEM_PROMPT from "./TherapyPrompt";
import KANNADA_SYSTEM_PROMPT from "./KannadaTherapyPrompt";

// Create context
const TherapyContext = createContext<TherapyContextType | undefined>(undefined);

interface TherapyProviderProps {
  children: ReactNode;
}

export const TherapyProvider: React.FC<TherapyProviderProps> = ({
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [language, setLanguage] = useState<"tamil" | "kannada">("tamil"); // Default to Tamil

  // Watch for language changes and reset chat when language changes
  useEffect(() => {
    // Skip the initial render
    if (isInitialized) {
      console.log("Language changed to:", language);
      // Clear session storage
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("chatHistory");
      }

      // Reset messages with new language
      setMessages([
        {
          id: generateId(),
          role: "system",
          content: getSystemPrompt(),
          timestamp: Date.now(),
        },
        createAssistantGreeting(),
      ]);
    }
  }, [language]); // Create initial assistant message based on current language
  const createAssistantGreeting = (): Message => {
    return createInitialAssistantMessage(language);
  }; // src/components/TherapyContext.tsx

  // Function to get the appropriate system prompt based on language
  const getSystemPrompt = () => {
    return language === "tamil" ? TAMIL_SYSTEM_PROMPT : KANNADA_SYSTEM_PROMPT;
  };

  useEffect(() => {
    // Initialize with saved messages or system message
    if (!isInitialized) {
      const savedMessages = loadMessagesFromSession();

      if (savedMessages.length > 0) {
        setMessages(savedMessages);
      } else {
        // Add system message and initial assistant greeting
        setMessages([
          {
            id: generateId(),
            role: "system",
            content: getSystemPrompt(),
            timestamp: Date.now(),
          },
          createAssistantGreeting(),
        ]);
      }
      setIsInitialized(true);
    }
  }, [isInitialized, language]);

  useEffect(() => {
    // Save messages to session storage whenever they change
    if (isInitialized && messages.length > 0) {
      saveMessagesToSession(messages);
    }
  }, [messages, isInitialized]);

  const addMessage = (
    content: string,
    role: "user" | "assistant" | "system"
  ) => {
    const newMessage: Message = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    return newMessage;
  };

  const sendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Add user message
      const userMessage = addMessage(content, "user");

      // Create a placeholder for assistant response
      const assistantPlaceholder: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prevMessages) => [...prevMessages, assistantPlaceholder]);

      // Always include a fresh system message to ensure proper language context
      const systemMessage = {
        id: generateId(),
        role: "system" as const,
        content: getSystemPrompt(),
        timestamp: Date.now(),
      };

      // Remove any existing system message and add the fresh one
      const filteredMessages = messages.filter((m) => m.role !== "system");
      const messagesForAPI = [systemMessage, ...filteredMessages, userMessage];

      // Stream the response
      let accumulatedResponse = "";

      await streamingDeepSeekResponse(
        messagesForAPI,
        (chunk) => {
          accumulatedResponse += chunk;
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === assistantPlaceholder.id
                ? { ...msg, content: accumulatedResponse }
                : msg
            )
          );
        },
        () => {
          setIsLoading(false);
        },
        (error) => {
          console.error("Error streaming response:", error);
          setError(
            "சில தொழில்நுட்ப சிக்கல்கள் ஏற்பட்டன. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
          );
          setIsLoading(false);

          // Update the placeholder with error message if it's empty
          if (!accumulatedResponse) {
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === assistantPlaceholder.id
                  ? {
                      ...msg,
                      content:
                        "சில தொழில்நுட்ப சிக்கல்கள் ஏற்பட்டன. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.",
                    }
                  : msg
              )
            );
          }
        }
      );
    } catch (error) {
      console.error("Error in sendMessage:", error);
      setError(
        "சில தொழில்நுட்ப சிக்கல்கள் ஏற்பட்டன. தயவுசெய்து மீண்டும் முயற்சிக்கவும்."
      );
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    const newMessages = [
      {
        id: generateId(),
        role: "system",
        content: getSystemPrompt(),
        timestamp: Date.now(),
      },
      createAssistantGreeting(),
    ];

    setMessages(newMessages as Message[]);
    saveMessagesToSession(newMessages as Message[]);
  };

  return (
    <TherapyContext.Provider
      value={{
        messages,
        addMessage,
        sendMessage,
        isLoading,
        error,
        resetChat,
        language,
        setLanguage,
      }}
    >
      {children}
    </TherapyContext.Provider>
  );
};

export const useTherapy = (): TherapyContextType => {
  const context = useContext(TherapyContext);
  if (!context) {
    throw new Error("useTherapy must be used within a TherapyProvider");
  }
  return context;
};
