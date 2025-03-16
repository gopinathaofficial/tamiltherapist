// src/components/ChatMessage.tsx
import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Message } from '@/lib/types';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Don't render system messages
  if (isSystem) {
    return null;
  }

  return (
    <div className={cn(
      'flex w-full py-4',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className="flex items-center gap-4 max-w-[80%]">
        {!isUser && (
          <div className="self-start mt-1">
            <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </Avatar>
          </div>
        )}

        <Card
          className={cn(
            'px-4 py-3',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
          <div className={cn(
            'text-xs mt-1',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
          )}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </Card>

        {isUser && (
          <div className="self-start mt-1">
            <Avatar className="h-8 w-8 bg-secondary text-secondary-foreground">
              <User className="h-4 w-4" />
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;