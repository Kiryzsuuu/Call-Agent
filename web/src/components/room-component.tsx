"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
} from "@livekit/components-react";

import { ConfigurationForm } from "@/components/configuration-form";
import { Chat } from "@/components/chat";
import { Transcript } from "@/components/transcript";
import { RealtimeChat } from "@/components/realtime-chat";
import { CallClosure } from "@/components/call-closure";
import { CorrectionChat } from "@/components/correction-chat";
import { useConnection } from "@/hooks/use-connection";
import { AgentProvider } from "@/hooks/use-agent";
import { ChevronDown } from "lucide-react";
import { CustomerPdfMenu } from "@/components/customer-pdf-menu";

export function RoomComponent({ userRole }: { userRole?: string }) {
  const { shouldConnect, wsUrl, token } = useConnection();
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const scrollButtonRef = useRef<HTMLButtonElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(userRole !== "customer");
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  
  const handleToggleSidebar = () => {
    if (userRole !== "customer") setIsSidebarOpen((prev) => !prev);
  };
  
  const handleToggleChat = () => {
    setIsChatVisible((prev) => !prev);
  };
  
  // Generate session ID when component mounts
  useEffect(() => {
    if (!sessionId) {
      setSessionId(crypto.randomUUID());
    }
  }, [sessionId]);
  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connect={shouldConnect}
      audio={true}
      className="flex flex-col flex-grow overflow-hidden border-l border-r border-b rounded-b-md"
      style={{ "--lk-bg": "white" } as React.CSSProperties}
      options={{
        publishDefaults: {
          stopMicTrackOnMute: true,
        },
      }}
    >
      <AgentProvider>
        {/* Sidebar + Chat + Transcript in one flex/grid parent */}
        <div className="flex h-full w-full relative">
          {/* Tombol toggle sidebar selalu muncul di samping chat */}
          {userRole !== "customer" && !isSidebarOpen && (
            <button
              onClick={handleToggleSidebar}
              className="absolute left-0 top-4 z-20 p-2 bg-gray-100 rounded-full shadow hover:bg-gray-200"
              aria-label="Show sidebar"
            >
              <span>&#9776;</span>
            </button>
          )}
          {/* Sidebar Configuration */}
          <div className={`relative border-r transition-all duration-300 ${userRole === "customer" ? 'w-0 min-w-0' : isSidebarOpen ? 'w-[20vw] min-w-[280px] max-w-[400px]' : 'w-0 min-w-0'} bg-white flex flex-col`}>
            {userRole !== "customer" && isSidebarOpen && (
              <>
                <button
                  onClick={handleToggleSidebar}
                  className="absolute top-2 right-2 z-20 p-2 bg-gray-100 rounded-full shadow hover:bg-gray-200"
                  aria-label="Hide sidebar"
                >
                  <span>&#10005;</span>
                </button>
                <div className="flex-1 pt-10 pb-4 overflow-hidden">
                    <ConfigurationForm userRole={userRole} />
                </div>
              </>
            )}
          </div>
          {/* Chat (helpful ai) */}
          <div className="flex flex-col justify-center w-[30%] min-w-[300px]">
            {userRole === "customer" && <CustomerPdfMenu />}
            <Chat />
          </div>
          {/* Transcript */}
          <div className="hidden md:flex flex-col h-full border-l relative w-[70%] min-w-[400px]">
            <div
              className="flex-grow overflow-y-scroll"
              ref={transcriptContainerRef}
              style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 #f1f5f9'
              }}
            >
              <Transcript
                scrollContainerRef={transcriptContainerRef}
                scrollButtonRef={scrollButtonRef}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex justify-between items-center">
                {/* Call Closure Button - only for staff */}
                {userRole !== "customer" && sessionId && (
                  <div className="absolute left-4 bottom-4">
                    <CallClosure 
                      sessionId={sessionId}
                      onCallClosed={() => {
                        // Handle call closure
                        console.log("Call closed for session:", sessionId);
                      }}
                    />
                  </div>
                )}
                
                <button
                  ref={scrollButtonRef}
                  className="p-2 bg-white text-gray-500 rounded-full hover:bg-gray-100 transition-colors absolute right-4 bottom-4 shadow-md flex items-center"
                >
                  <ChevronDown className="mr-1 h-4 w-4" />
                  <span className="text-xs pr-1">View latest</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        <RoomAudioRenderer />
        <StartAudio label="Click to allow audio playbook" />
        
        {/* Real-time Chat Support */}
        {sessionId && (
          <RealtimeChat
            sessionId={sessionId}
            isVisible={isChatVisible}
            onToggle={handleToggleChat}
          />
        )}
        
        {/* Quick Correction Chat */}
        {sessionId && (
          <CorrectionChat
            sessionId={sessionId}
            onCorrection={(original, corrected) => {
              console.log("Correction:", { original, corrected });
            }}
          />
        )}
      </AgentProvider>
    </LiveKitRoom>
  );
}
