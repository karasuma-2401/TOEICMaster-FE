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
  const [buttonWidth, setButtonWidth] = useState(350);
  const rememberMeRef = useRef(rememberMe);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    rememberMeRef.current = rememberMe;
  }, [rememberMe]);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => {
      const measured =
        element.getBoundingClientRect().width || element.clientWidth;
      if (measured > 0) {
        const clamped = Math.min(350, Math.floor(measured));
        setButtonWidth((prev) => (prev === clamped ? prev : clamped));
      }
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, clientId]);

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
      width: buttonWidth,
      locale: "en",
    });
  }, [buttonWidth, clientId, enabled, loaded, returnTo, router]);

  if (!enabled)
    return (
      <p className="mt-4 text-center text-xs text-[var(--tm-ink-subtle)]">
        Please agree to the terms of use to continue with Google.
      </p>
    );

  if (!clientId)
    return (
      <p className="mt-4 text-center text-xs text-[var(--tm-ink-subtle)]">
        Google sign-in is not configured.
      </p>
    );

  return (
    <div className="mt-4 w-full">
      <Script
        onReady={() => setLoaded(true)}
        onError={() => setError("Unable to load Google sign-in.")}
        src="https://accounts.google.com/gsi/client?hl=en"
        strategy="afterInteractive"
      />
      <div
        aria-label="Sign in with Google"
        className="mx-auto flex w-full max-w-[350px] justify-center overflow-hidden"
        ref={container}
      />
      {pending && (
        <p className="mt-2 text-center text-xs text-[var(--tm-ink-muted)]">
          Signing in...
        </p>
      )}
      {error && (
        <p
          className="mt-2 text-center text-xs text-[var(--tm-danger)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
