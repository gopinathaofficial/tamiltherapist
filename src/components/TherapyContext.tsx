// src/components/TherapyContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, TherapyContextType } from '@/lib/types';
import { generateId, saveMessagesToSession, loadMessagesFromSession } from '@/lib/utils';
import { streamingDeepSeekResponse, createInitialAssistantMessage } from '@/lib/deepseek';
import SYSTEM_PROMPT from './TherapyPrompt';

// Create context
const TherapyContext = createContext<TherapyContextType | undefined>(undefined);

interface TherapyProviderProps {
  children: ReactNode;
}

export const TherapyProvider: React.FC<TherapyProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

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
            role: 'system',
            content: SYSTEM_PROMPT,
            timestamp: Date.now(),
          },
          createInitialAssistantMessage(),
        ]);
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  useEffect(() => {
    // Save messages to session storage whenever they change
    if (isInitialized && messages.length > 0) {
      saveMessagesToSession(messages);
    }
  }, [messages, isInitialized]);

  const addMessage = (content: string, role: 'user' | 'assistant' | 'system') => {
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
      const userMessage = addMessage(content, 'user');

      // Create a placeholder for assistant response
      const assistantPlaceholder: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      };

      setMessages((prevMessages) => [...prevMessages, assistantPlaceholder]);

      // Include system message only if it doesn't exist in messages
      const messagesForAPI = messages.some(m => m.role === 'system')
        ? [...messages, userMessage]
        : [
            {
              id: generateId(),
              role: 'system',
              content: SYSTEM_PROMPT,
              timestamp: Date.now(),
            },
            ...messages,
            userMessage
          ];

      // Stream the response
      let accumulatedResponse = '';
      
      await streamingDeepSeekResponse(
        messagesForAPI as any,
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
          console.error('Error streaming response:', error);
          setError('சில தொழில்நுட்ப சிக்கல்கள் ஏற்பட்டன. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.');
          setIsLoading(false);
          
          // Update the placeholder with error message if it's empty
          if (!accumulatedResponse) {
            setMessages((prevMessages) => 
              prevMessages.map((msg) => 
                msg.id === assistantPlaceholder.id
                  ? { ...msg, content: 'சில தொழில்நுட்ப சிக்கல்கள் ஏற்பட்டன. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.' }
                  : msg
              )
            );
          }
        }
      );
    } catch (error) {
      console.error('Error in sendMessage:', error);
      setError('சில தொழில்நுட்ப சிக்கல்கள் ஏற்பட்டன. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.');
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    const systemMessage = messages.find(m => m.role === 'system');
    
    const newMessages = systemMessage 
      ? [systemMessage, createInitialAssistantMessage()]
      : [
          {
            id: generateId(),
            role: 'system',
            content: SYSTEM_PROMPT,
            timestamp: Date.now(),
          },
          createInitialAssistantMessage(),
        ];
    
    setMessages(newMessages as any);
    saveMessagesToSession(newMessages as any);
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
      }}
    >
      {children}
    </TherapyContext.Provider>
  );
};

export const useTherapy = (): TherapyContextType => {
  const context = useContext(TherapyContext);
  if (!context) {
    throw new Error('useTherapy must be used within a TherapyProvider');
  }
  return context;
};