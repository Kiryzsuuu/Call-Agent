"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageSquare } from "lucide-react";

interface CorrectionChatProps {
  sessionId: string;
  onCorrection: (originalText: string, correctedText: string) => void;
}

export function CorrectionChat({ sessionId, onCorrection }: CorrectionChatProps) {
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const sendCorrection = async () => {
    if (!message.trim()) return;

    try {
      // Send as correction message
      await fetch("http://127.0.0.1:8002/send-chat-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: `[CORRECTION] ${message}`,
          sender: "user",
        }),
      });

      // Trigger correction callback
      onCorrection("", message);
      setMessage("");
      
    } catch (error) {
      console.error("Error sending correction:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCorrection();
    }
  };

  const quickCorrections = [
    "Maksud saya adalah...",
    "Yang saya inginkan...",
    "Tolong perbaiki...",
    "Sebenarnya saya mau...",
  ];

  return (
    <>
      {/* Toggle Button */}
      {!isVisible && (
        <button
          onClick={() => setIsVisible(true)}
          className="fixed bottom-20 right-4 z-50 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700"
          title="Quick correction"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}

      {/* Correction Panel */}
      {isVisible && (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-white rounded-lg shadow-lg border">
          <div className="p-3 border-b bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Quick Correction</h3>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Perbaiki apa yang agent salah dengar
            </p>
          </div>
          
          <div className="p-3 space-y-3">
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1">
              {quickCorrections.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setMessage(suggestion)}
                  className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            
            {/* Input */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ketik koreksi..."
                className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={sendCorrection}
                disabled={!message.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-xs text-gray-500">
              💡 Tip: Ketik koreksi langsung, agent akan memahami maksud Anda
            </div>
          </div>
        </div>
      )}
    </>
  );
}