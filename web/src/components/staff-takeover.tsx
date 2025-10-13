"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Phone, MessageSquare, User } from "lucide-react";

interface TakeoverRequest {
  session_id: string;
  start_time: string;
  message_count: number;
  last_activity: string;
  messages: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export function StaffTakeover() {
  const [requests, setRequests] = useState<TakeoverRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8002/staff-takeover-requests");
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Error fetching takeover requests:", error);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTakeover = async (request: TakeoverRequest) => {
    const staffName = prompt("Masukkan nama staff:");
    if (!staffName) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8002/staff-takeover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: request.session_id,
          staff_name: staffName,
          message: "Staff telah mengambil alih percakapan ini",
        }),
      });

      if (response.ok) {
        alert("Takeover berhasil!");
        fetchRequests();
      } else {
        throw new Error("Failed to takeover");
      }
    } catch (error) {
      alert("Error: Gagal mengambil alih percakapan");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("id-ID");
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4" />;
      case "agent":
        return <MessageSquare className="h-4 w-4" />;
      case "system":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Staff Takeover Requests
          {requests.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
              {requests.length}
            </span>
          )}
        </h3>
      </div>
      <div className="p-6 pt-0">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Tidak ada permintaan takeover saat ini
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.session_id} className="border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">
                      Session: {request.session_id.slice(0, 8)}...
                    </div>
                    <div className="text-sm text-gray-500">
                      Started: {formatTime(request.start_time)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Last Activity: {formatTime(request.last_activity)}
                    </div>
                  </div>
                  <span className="px-2 py-1 border border-orange-600 text-orange-600 text-xs rounded">
                    {request.message_count} messages
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm font-medium mb-2">Recent Messages:</div>
                  <div className="h-24 border rounded p-2 overflow-y-auto">
                    <div className="space-y-1">
                      {request.messages.map((msg, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          {getMessageTypeIcon(msg.type)}
                          <div className="flex-1">
                            <span className="font-medium capitalize">{msg.type}:</span>{" "}
                            {msg.message}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => handleTakeover(request)}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Ambil Alih Percakapan"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}