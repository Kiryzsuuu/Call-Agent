"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, Send, Phone, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppConversation {
  session_id: string;
  phone_number: string;
  start_time: string;
  message_count: number;
  last_message: {
    type: string;
    message: string;
    timestamp: string;
  } | null;
  status: string;
}

interface WhatsAppConfig {
  whatsapp_configured: boolean;
  admin_phone_configured: boolean;
  whatsapp_bot_url: string;
}

export function WhatsAppManager() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendMessage, setSendMessage] = useState({ phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const fetchConversations = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8001/whatsapp-conversations");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp conversations:", error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8001/whatsapp-config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error("Error fetching WhatsApp config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!sendMessage.phone || !sendMessage.message) return;
    
    setSending(true);
    try {
      const response = await fetch("http://127.0.0.1:8001/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: sendMessage.phone,
          message: sendMessage.message
        })
      });
      
      if (response.ok) {
        setSendMessage({ phone: "", message: "" });
        fetchConversations(); // Refresh conversations
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchConversations();
    const interval = setInterval(fetchConversations, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString("id-ID");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading WhatsApp data...</div>
      </div>
    );
  }

  if (!config?.whatsapp_configured) {
    return (
      <div className="text-center p-8">
        <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <div className="text-sm text-gray-500 mb-2">WhatsApp not configured</div>
        <div className="text-xs text-gray-400">
          Please set WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in environment variables
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* WhatsApp Status */}
      <div className="border rounded-lg p-3 bg-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
            <span className="text-sm font-medium text-green-700">WhatsApp Bot Active</span>
          </div>
          <div className="text-xs text-green-600">
            {config.whatsapp_bot_url}
          </div>
        </div>
      </div>

      {/* Send Message */}
      <div className="border rounded-lg p-3 bg-white">
        <div className="text-sm font-medium mb-2 flex items-center">
          <Send className="h-4 w-4 mr-2" />
          Send WhatsApp Message
        </div>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Phone number (e.g., 628123456789)"
            value={sendMessage.phone}
            onChange={(e) => setSendMessage(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full text-xs p-2 border rounded"
          />
          <textarea
            placeholder="Message content..."
            value={sendMessage.message}
            onChange={(e) => setSendMessage(prev => ({ ...prev, message: e.target.value }))}
            className="w-full text-xs p-2 border rounded h-20 resize-none"
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={sending || !sendMessage.phone || !sendMessage.message}
            className="w-full"
          >
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </div>

      {/* Conversations */}
      <div className="border rounded-lg p-3 bg-white">
        <div className="text-sm font-medium mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            WhatsApp Conversations ({conversations.length})
          </div>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-4 text-gray-500 text-xs">
            No WhatsApp conversations yet
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {conversations.map((conv) => (
              <div key={conv.session_id} className="border rounded p-2 bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center text-xs">
                    <Phone className="h-3 w-3 mr-1 text-gray-500" />
                    <span className="font-medium">{conv.phone_number}</span>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    conv.status === 'active' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {conv.status}
                  </div>
                </div>
                
                <div className="text-xs text-gray-600 mb-1">
                  {conv.message_count} messages
                </div>
                
                {conv.last_message && (
                  <div className="text-xs bg-white p-2 rounded border-l-2 border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-blue-600">
                        {conv.last_message.type === 'user' ? 'Customer' : 'Agent'}
                      </span>
                      <span className="text-gray-500">
                        {formatDateTime(conv.last_message.timestamp)}
                      </span>
                    </div>
                    <div className="text-gray-700">
                      {conv.last_message.message.length > 100 
                        ? conv.last_message.message.substring(0, 100) + "..."
                        : conv.last_message.message
                      }
                    </div>
                  </div>
                )}
                
                <div className="flex items-center text-xs text-gray-500 mt-2">
                  <Clock className="h-3 w-3 mr-1" />
                  Started: {formatDateTime(conv.start_time)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="border rounded-lg p-3 bg-blue-50">
        <div className="text-sm font-medium text-blue-700 mb-2">Setup Instructions</div>
        <div className="text-xs text-blue-600 space-y-1">
          <div>1. Configure WhatsApp Business API credentials</div>
          <div>2. Set webhook URL to: {config.whatsapp_bot_url}/webhook</div>
          <div>3. Start WhatsApp bot: python whatsapp_bot.py</div>
          <div>4. Customers can now chat with AI via WhatsApp</div>
        </div>
      </div>
    </div>
  );
}