"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (/sw.js) on mount so the app is installable
 * as a PWA. Feature-detected: silently does nothing in browsers without
 * service worker support. Renders nothing.
 */
export function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Registration is a progressive enhancement — never break the page.
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
