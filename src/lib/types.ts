// src/lib/types.ts

export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface DeepSeekMessage {
  role: Role;
  content: string;
}

export interface DeepSeekRequestBody {
  model: string;
  messages: DeepSeekMessage[];
  stream: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface DeepSeekResponseChunk {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

export interface TherapyContextType {
  messages: Message[];
  addMessage: (content: string, role: Role) => void;
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  resetChat: () => void;
  language: 'tamil' | 'kannada';
  setLanguage: React.Dispatch<React.SetStateAction<'tamil' | 'kannada'>>;
}