import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://traverai-production.up.railway.app";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
}

export const sendChatMessage = async (messages: ChatMessage[]): Promise<string> => {
  const response = await axios.post<ChatResponse>(`${API_URL}/api/chat`, { messages });
  return response.data.reply;
};

export const checkHealth = async (): Promise<boolean> => {
  try {
    await axios.get(`${API_URL}/health`);
    return true;
  } catch {
    return false;
  }
};
