"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, X } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "staff";
  message: string;
  timestamp: string;
}

interface RealtimeChatProps {
  sessionId: string;
  isVisible: boolean;
  onToggle: () => void;
}

export function RealtimeChat({ sessionId, isVisible, onToggle }: RealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (!sessionId || !isVisible) return;

    const pollMessages = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8002/call-logs/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          const chatMessages = data.messages
            .filter((msg: any) => msg.type.startsWith("chat_"))
            .map((msg: any) => ({
              id: `${msg.timestamp}-${msg.type}`,
              sender: msg.type.replace("chat_", "") as "user" | "agent" | "staff",
              message: msg.message,
              timestamp: msg.timestamp,
            }));
          setMessages(chatMessages);
        }
      } catch (error) {
        console.error("Error polling messages:", error);
      }
    };

    const interval = setInterval(pollMessages, 2000); // Poll every 2 seconds
    pollMessages(); // Initial load

    return () => clearInterval(interval);
  }, [sessionId, isVisible]);

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8002/send-chat-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: newMessage,
          sender: "user",
        }),
      });

      if (response.ok) {
        setNewMessage("");
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 p-0 bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-white rounded-lg shadow-lg border">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-medium">Chat Support</h3>
        <button
          onClick={onToggle}
          className="h-6 w-6 p-0 hover:bg-gray-100 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 flex flex-col p-3 space-y-3 h-80">
        <div className="flex-1 overflow-y-auto pr-3">
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Mulai percakapan chat untuk memperbaiki kesalahan pendengaran AI
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      message.sender === "user"
                        ? "bg-blue-600 text-white"
                        : message.sender === "staff"
                        ? "bg-orange-100 text-orange-900"
                        : "bg-gray-100"
                    }`}
                  >
                    <div className="break-words">{message.message}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <div className="flex space-x-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ketik pesan..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !newMessage.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}