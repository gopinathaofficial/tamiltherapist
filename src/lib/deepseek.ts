// src/lib/deepseek.ts
import axios from 'axios';
import { createParser } from 'eventsource-parser';
import { DeepSeekRequestBody, DeepSeekResponseChunk, Message, DeepSeekMessage } from './types';
import { generateId } from './utils';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || '';

export function messagesForDeepSeek(messages: Message[]): DeepSeekMessage[] {
  return messages.map(({ role, content }) => ({
    role,
    content,
  }));
}

export async function sendMessageToDeepSeek(messages: DeepSeekMessage[]): Promise<ReadableStream<Uint8Array>> {
  const requestBody: DeepSeekRequestBody = {
    model: 'deepseek-chat',
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 1000
  };

  const response = await axios.post(DEEPSEEK_API_URL, requestBody, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    responseType: 'stream',
  });

  return response.data;
}

export function createDeepSeekResponseParser() {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const parser = createParser({
        onEvent(event) {
          if (event.event === 'event') {
            const data = event.data;
            
            // Check for [DONE] message
            if (data === '[DONE]') {
              return;
            }

            try {
              const json: DeepSeekResponseChunk = JSON.parse(data);
              const text = json.choices[0]?.delta?.content || '';
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            } catch (e) {
              console.error('Error parsing DeepSeek stream:', e);
              controller.error(e);
            }
          }
        }
      });
      
      parser.feed(buffer);
      buffer = '';
    },
  });
}

export async function streamingDeepSeekResponse(
  messages: Message[],
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const deepseekMessages = messagesForDeepSeek(messages);
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: deepseekMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    // let responseText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      
      // Process the chunk (which may contain multiple server-sent events)
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          
          if (data === '[DONE]') {
            continue;
          }
          
          try {
            const json: DeepSeekResponseChunk = JSON.parse(data);
            const textChunk = json.choices[0]?.delta?.content || '';
            if (textChunk) {
              // responseText += textChunk;
              onChunk(textChunk);
            }
          } catch (e) {
            console.warn('Error parsing chunk:', e);
          }
        }
      }
    }

    onDone();
    return;
  } catch (error) {
    console.error('Error in streamingDeepSeekResponse:', error);
    onError(error instanceof Error ? error : new Error('Unknown error'));
    return;
  }
}

export function createInitialAssistantMessage(language: 'tamil' | 'kannada'): Message {
  const greeting = language === 'tamil'
    ? "என்னடா கிஷோர், எப்படி இருக்க? நான் இங்க தான் இருக்கேன் உன்கூட பேச. சொல்லு என்ன நடக்குது?"
    : "ಹೇಯ್ ಶಿಲ್ಪಾ, ಹೇಗಿದ್ದೀಯಾ? ನಾನು ಇಲ್ಲಿದ್ದೀನಿ ನಿನ್ನ ಜೊತೆ ಮಾತಾಡಕ್ಕೆ. ಹೇಳು, ಏನ್ ನಡೀತಾ ಇದೆ?";
    
  return {
    id: generateId(),
    role: 'assistant',
    content: greeting,
    timestamp: Date.now(),
  };
}