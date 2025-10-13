"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (pathname !== "/login") {
      const user = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (!user) {
        router.replace("/login");
      }
    }
  }, [pathname, router]);
  return <>{children}</>;
}
