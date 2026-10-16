"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      gutter={12}
      position="top-right"
      toastOptions={{
        duration: 4_000,
        style: {
          background: "#342d2a",
          borderRadius: "0.75rem",
          color: "#fffdfc",
          fontSize: "0.875rem",
          maxWidth: "26rem",
        },
        success: {
          duration: 3_000,
          iconTheme: { primary: "#18a558", secondary: "#fffdfc" },
        },
        error: {
          duration: 5_000,
          iconTheme: { primary: "#ed361c", secondary: "#fffdfc" },
        },
      }}
    />
  );
}
