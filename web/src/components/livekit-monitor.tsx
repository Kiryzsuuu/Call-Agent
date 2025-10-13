"use client";

import React, { useState, useEffect } from "react";
import { useConnectionState, useRoomInfo, useParticipants } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Activity, Users, Clock, Wifi, Volume2, VideoIcon } from "lucide-react";

export function LiveKitMonitor() {
  const connectionState = useConnectionState();
  const roomInfo = useRoomInfo();
  const participants = useParticipants();
  const [sessionDuration, setSessionDuration] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionStatus = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return { status: "Connected", color: "bg-green-500", text: "text-green-700" };
      case ConnectionState.Connecting:
        return { status: "Connecting", color: "bg-yellow-500", text: "text-yellow-700" };
      case ConnectionState.Disconnected:
        return { status: "Disconnected", color: "bg-red-500", text: "text-red-700" };
      default:
        return { status: "Unknown", color: "bg-gray-500", text: "text-gray-700" };
    }
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <div className="border rounded-lg p-3 bg-white">
        <div className="text-sm font-medium flex items-center mb-2">
          <Wifi className="h-4 w-4 mr-2" />
          Connection Status
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${connectionStatus.color}`} />
          <span className={`text-sm font-medium ${connectionStatus.text}`}>
            {connectionStatus.status}
          </span>
        </div>
      </div>

      {/* Room Info */}
      <div className="border rounded-lg p-3 bg-white">
        <div className="text-sm font-medium flex items-center mb-2">
          <Activity className="h-4 w-4 mr-2" />
          Room Information
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Room Name:</span>
            <span className="font-medium">{roomInfo?.name || "N/A"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Session Duration:</span>
            <span className="font-medium">{formatDuration(sessionDuration)}</span>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="border rounded-lg p-3 bg-white">
        <div className="text-sm font-medium flex items-center mb-2">
          <Users className="h-4 w-4 mr-2" />
          Participants ({participants.length})
        </div>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div key={participant.identity} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">
                  {participant.name || participant.identity}
                </span>
                {participant.isLocal && (
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">You</span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {participant.isMicrophoneEnabled && (
                  <Volume2 className="h-3 w-3 text-green-600" />
                )}
                {participant.isCameraEnabled && (
                  <VideoIcon className="h-3 w-3 text-blue-600" />
                )}
              </div>
            </div>
          ))}
          {participants.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-2">
              No participants connected
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="border rounded-lg p-3 bg-white">
        <div className="text-sm font-medium flex items-center mb-2">
          <Clock className="h-4 w-4 mr-2" />
          Session Statistics
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-semibold text-blue-700">{participants.length}</div>
              <div className="text-blue-600 text-xs">Active Users</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-semibold text-green-700">
                {participants.filter(p => p.isMicrophoneEnabled).length}
              </div>
              <div className="text-green-600 text-xs">Audio Active</div>
            </div>
          </div>
          <div className="text-center p-2 bg-purple-50 rounded mt-2">
            <div className="font-semibold text-purple-700">{formatDuration(sessionDuration)}</div>
            <div className="text-purple-600 text-xs">Total Duration</div>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="border rounded-lg p-3 bg-white">
        <div className="text-sm font-medium mb-2">Project Details</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Project ID:</span>
            <span className="font-mono">p_5gz1m420iw9</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Region:</span>
            <span>Singapore</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Protocol:</span>
            <span>WebRTC</span>
          </div>
        </div>
      </div>
    </div>
  );
}