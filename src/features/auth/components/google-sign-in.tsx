"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { loginWithGoogle, resolveLoginDestination } from "@/features/auth/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }): void;
          renderButton(
            element: HTMLElement,
            options: Record<string, unknown>,
          ): void;
        };
      };
    };
  }
}

export function GoogleSignIn({
  clientId,
  rememberMe = false,
  enabled = true,
  returnTo = "/",
}: {
  clientId?: string;
  rememberMe?: boolean;
  enabled?: boolean;
  returnTo?: string;
}) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const rememberMeRef = useRef(rememberMe);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    rememberMeRef.current = rememberMe;
  }, [rememberMe]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (
      !enabled ||
      !loaded ||
      !clientId ||
      !container.current ||
      !window.google
    )
      return;
    const element = container.current;
    element.replaceChildren();
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        if (!enabledRef.current) return;
        setPending(true);
        setError(undefined);
        try {
          const user = await loginWithGoogle(credential, rememberMeRef.current);
          router.replace(resolveLoginDestination(user, returnTo));
          router.refresh();
        } catch (reason) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to sign in with Google.",
          );
        } finally {
          setPending(false);
        }
      },
    });
    window.google.accounts.id.renderButton(element, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: 350,
      locale: "en",
    });
  }, [clientId, enabled, loaded, returnTo, router]);

  if (!enabled)
    return (
      <p className="mt-4 text-center text-xs text-[#938b87]">
        Please agree to the terms of use to continue with Google.
      </p>
    );

  if (!clientId)
    return (
      <p className="mt-4 text-center text-xs text-[#938b87]">
        Google sign-in is not configured.
      </p>
    );

  return (
    <div className="mt-4">
      <Script
        onReady={() => setLoaded(true)}
        onError={() => setError("Unable to load Google sign-in.")}
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />
      <div
        aria-label="Sign in with Google"
        className="flex justify-center"
        ref={container}
      />
      {pending && <p className="mt-2 text-center text-xs">Signing in...</p>}
      {error && (
        <p className="mt-2 text-center text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
