"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Clock, MessageSquare, Users, AlertCircle } from "lucide-react";

interface CallLog {
  session_id: string;
  start_time: string;
  message_count: number;
  last_message: string;
  status: string;
  result: string;
}

interface ActiveSession {
  session_id: string;
  start_time: string;
  message_count: number;
  last_activity: string;
}

interface CallDetail {
  session_id: string;
  start_time: string;
  messages: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

export function CallDashboard() {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [selectedLog, setSelectedLog] = useState<CallDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [takeoverMessage, setTakeoverMessage] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8001/call-logs");
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching logs:", error);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8001/active-sessions");
      const data = await response.json();
      setActiveSessions(data.sessions || []);
    } catch (error) {
      console.error("Error fetching active sessions:", error);
    }
  };

  const handleStaffTakeover = async (sessionId: string) => {
    if (!staffName || !takeoverMessage) {
      alert("Nama staff dan pesan harus diisi");
      return;
    }
    
    try {
      const response = await fetch("http://127.0.0.1:8001/staff-takeover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          staff_name: staffName,
          message: takeoverMessage
        })
      });
      
      if (response.ok) {
        alert("Berhasil mengambil alih percakapan");
        fetchActiveSessions();
        fetchLogs();
      }
    } catch (error) {
      console.error("Error taking over:", error);
    }
  };

  const fetchLogDetail = async (sessionId: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8001/call-logs/${sessionId}`);
      const data = await response.json();
      setSelectedLog(data);
      setIsDetailOpen(true);
    } catch (error) {
      console.error("Error fetching log detail:", error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("id-ID");
  };

  const formatDuration = (start: string, end: string) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diff = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60);
    return `${diff} menit`;
  };

  useEffect(() => {
    if (!isLoaded) {
      fetchLogs();
      fetchActiveSessions();
      setIsLoaded(true);
    }
    // Auto refresh every 5 seconds
    const interval = setInterval(() => {
      fetchActiveSessions();
    }, 5000);
    return () => clearInterval(interval);
  }, [isLoaded]);

  return (
    <>
      <div className="h-full overflow-hidden">
        <Tabs defaultValue="active" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active">Aktif ({activeSessions.length})</TabsTrigger>
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="flex-1 overflow-y-auto m-0">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2 text-sm">Staff Takeover</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Nama Staff"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="text-sm"
                />
                <Input
                  placeholder="Pesan takeover"
                  value={takeoverMessage}
                  onChange={(e) => setTakeoverMessage(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
              
              {activeSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Tidak ada panggilan aktif
                </div>
              ) : (
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                    <div key={session.session_id} className="p-3 border rounded-lg bg-green-50">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-green-500" />
                          <span className="font-medium text-sm">Session {session.session_id.slice(0, 8)}</span>
                          <Badge variant="secondary" className="bg-green-100 text-xs">AKTIF</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>Dimulai: {formatTime(session.start_time)}</div>
                          <div>{session.message_count} pesan</div>
                          <div>Terakhir: {formatTime(session.last_activity)}</div>
                        </div>
                        <Button
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => handleStaffTakeover(session.session_id)}
                          disabled={!staffName || !takeoverMessage}
                        >
                          Ambil Alih
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </TabsContent>
          
          <TabsContent value="history" className="flex-1 overflow-y-auto m-0">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada riwayat panggilan
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.session_id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fetchLogDetail(log.session_id)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3 w-3 text-blue-500" />
                          <span className="font-medium text-sm">Session {log.session_id.slice(0, 8)}</span>
                          <Badge variant={log.status === "completed" ? "default" : log.status === "staff_taken" ? "destructive" : "secondary"} className="text-xs">
                            {log.status === "completed" ? "SELESAI" : log.status === "staff_taken" ? "STAFF" : "AKTIF"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>{formatTime(log.start_time)}</div>
                          <div>{log.message_count} pesan</div>
                          <div>Durasi: {formatDuration(log.start_time, log.last_message)}</div>
                        </div>
                        {log.result && (
                          <div className="text-xs">
                            <span className="font-medium">Result:</span> {log.result}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              Detail Percakapan - {selectedLog?.session_id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="overflow-y-auto max-h-[60vh]">
              <div className="mb-4 text-sm text-muted-foreground">
                Dimulai: {formatTime(selectedLog.start_time)}
              </div>
              <div className="space-y-3">
                {selectedLog.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      msg.type === "agent"
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : msg.type === "staff"
                        ? "bg-red-50 border-l-4 border-red-500"
                        : "bg-gray-50 border-l-4 border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {msg.type === "agent" ? "🤖 AI Agent" : msg.type === "staff" ? "👨‍💼 Staff" : "👤 User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}