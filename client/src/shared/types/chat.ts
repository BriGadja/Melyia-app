export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  confidence?: number;
  sources?: string[];
}

export interface ChatResponse {
  response: string;
  confidence?: number;
  sources?: string[];
  conversationId: string;
}
