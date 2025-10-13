import "./globals.css";
import AuthGuard from "./auth-guard";
import { PlaygroundStateProvider } from "@/hooks/use-playground-state";
import { ConnectionProvider } from "@/hooks/use-connection";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { PHProvider } from "@/hooks/posthog-provider";
import { Public_Sans } from "next/font/google";
import dynamic from "next/dynamic";
import GlobalLogout from "@/components/global-logout";

const PostHogPageView = dynamic(
  () => import("../components/posthog-pageview"),
  {
    ssr: false,
  }
);

// Configure the Public Sans font
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

import "@livekit/components-styles";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={publicSans.className}>
        <PHProvider>
          <PlaygroundStateProvider>
            <ConnectionProvider>
              <TooltipProvider>
                <GlobalLogout />
                <PostHogPageView />
                <AuthGuard>{children}</AuthGuard>
                <Toaster />
              </TooltipProvider>
            </ConnectionProvider>
          </PlaygroundStateProvider>
        </PHProvider>
      </body>
    </html>
  );
}
