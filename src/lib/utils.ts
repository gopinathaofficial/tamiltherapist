// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Message } from "./types";

// Combine Tailwind CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Save chat history to session storage
export function saveMessagesToSession(messages: Message[]): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('chatHistory', JSON.stringify(messages));
  }
}

// Load chat history from session storage
export function loadMessagesFromSession(): Message[] {
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem('chatHistory');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to parse saved messages:', error);
      }
    }
  }
  return [];
}

// Format timestamp to readable time
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}