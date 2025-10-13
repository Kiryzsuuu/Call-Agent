"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, Users, Phone } from "lucide-react";

export function SystemStatus() {
  const [stats, setStats] = useState({
    auto_closure: true,
    response_delay: "2s",
    human_takeover: true,
    active_sessions: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8002/active-sessions");
        if (response.ok) {
          const data = await response.json();
          setStats(prev => ({
            ...prev,
            active_sessions: data.sessions.length
          }));
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          System Status
        </h3>
      </div>
      <div className="p-6 pt-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="text-sm">Auto Call Closure</span>
          </div>
          <span className="px-2 py-1 border border-green-600 text-green-600 text-xs rounded">
            Active
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Response Delay</span>
          </div>
          <span className="px-2 py-1 border border-gray-300 text-xs rounded">
            {stats.response_delay}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">Human Takeover</span>
          </div>
          <span className="px-2 py-1 border border-blue-600 text-blue-600 text-xs rounded">
            Ready
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Active Sessions</span>
          <span className="px-2 py-1 bg-gray-100 text-xs rounded">
            {stats.active_sessions}
          </span>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs font-medium mb-2">Keywords:</div>
          <div className="text-xs space-y-1">
            <div><code>CLOSE_CALL_CONFIRMED</code> - Auto closure</div>
            <div><code>TRANSFER_TO_HUMAN</code> - Human takeover</div>
          </div>
        </div>
      </div>
    </div>
  );
}