"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => registration.update())
        .catch(() => {});
    };

    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(register, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }

    const t = setTimeout(register, 2000);
    return () => clearTimeout(t);
  }, []);
  return null;
}
