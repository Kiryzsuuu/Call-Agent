"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GlobalLogout() {
  const [user, setUser] = useState<{ name?: string; phone?: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (raw) setUser(JSON.parse(raw));
      else setUser(null);
    } catch (e) {
      setUser(null);
    }
  }, []);

  function handleLogout() {
    try {
      localStorage.removeItem("user");
    } catch (_) {}
    // also reload app state
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div style={{ position: "fixed", right: 12, top: 12, zIndex: 60 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#111827" }}>{user.name || "User"}</span>
        <button
          onClick={handleLogout}
          style={{ padding: "6px 10px", borderRadius: 6, background: "#efefef", border: "1px solid #e5e7eb", cursor: "pointer", fontSize: 13 }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
