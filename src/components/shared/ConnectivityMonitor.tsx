"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { WifiOff, Wifi } from "lucide-react";

export default function ConnectivityMonitor() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial status
    if (typeof window !== "undefined") {
      setIsOffline(!window.navigator.onLine);
    }

    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Connection restored", {
        description: "You are back online. Ready to sync with backend.",
        icon: <Wifi className="h-4 w-4 text-emerald-400" />,
        duration: 4000,
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error("Connection lost", {
        description: "You are offline. Please check your connection or retry.",
        icon: <WifiOff className="h-4 w-4 text-rose-500 animate-pulse" />,
        duration: Infinity, // Keep open until connection is restored
        id: "offline-toast",
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
