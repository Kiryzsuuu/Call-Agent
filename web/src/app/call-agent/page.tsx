"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoomComponent } from "@/components/room-component";

export default function CallAgentPage() {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!user) {
    return null; // atau loading spinner
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="flex flex-shrink-0 h-14 items-center justify-between px-4 w-full md:mx-auto bg-white border-b">
        <div className="flex items-center gap-2">
          <img src="https://www.softwareone.com/-/media/images/logos/softwareone-logo-blk.svg?iar=0&hash=6A277FF39328B4D79A071F4A9F95F301" alt="SoftwareOne Logo" className="h-8 w-auto" />
          <span className="font-bold text-black text-lg">ICAAI - SoftwareOne</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user.username} ({user.role})</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 transition text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex flex-col flex-grow overflow-hidden p-0 md:p-2 md:pt-0 w-full md:mx-auto">
        <RoomComponent userRole={user.role} />
      </main>
    </div>
  );
}
