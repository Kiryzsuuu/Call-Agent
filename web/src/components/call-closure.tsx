"use client";

import { useState } from "react";
import { PhoneOff, CheckCircle } from "lucide-react";

interface CallClosureProps {
  sessionId: string;
  onCallClosed?: () => void;
}

export function CallClosure({ sessionId, onCallClosed }: CallClosureProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCloseCall = async () => {
    if (!sessionId) return;

    const reason = prompt("Alasan penutupan (opsional):");
    
    setIsLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8002/close-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
          participant_type: "system",
          message: `Call closed. Reason: ${reason || "Normal completion"}`,
          timestamp: new Date().toISOString(),
          status: "completed",
          result: reason || "Call completed successfully",
        }),
      });

      if (response.ok) {
        alert("Panggilan telah berhasil ditutup");
        onCallClosed?.();
      } else {
        throw new Error("Failed to close call");
      }
    } catch (error) {
      alert("Error: Gagal menutup panggilan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCloseCall}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
    >
      <PhoneOff className="h-4 w-4" />
      {isLoading ? "Menutup..." : "Tutup Panggilan"}
    </button>
  );
}