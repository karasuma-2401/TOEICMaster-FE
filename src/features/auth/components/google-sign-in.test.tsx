// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GoogleSignIn } from "./google-sign-in";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
const googleCallback = vi.hoisted(() => ({
  callback: null as
    ((response: { credential: string }) => Promise<void>) | null,
}));

vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("next/script", () => ({
  default: function MockScript({
    onReady,
    src,
  }: {
    onReady?: () => void;
    src?: string;
  }) {
    return (
      <button data-src={src} onClick={onReady} type="button">
        Load Google SDK
      </button>
    );
  },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  delete window.google;
  googleCallback.callback = null;
});

beforeEach(() => {
  navigation.replace.mockReset();
  navigation.refresh.mockReset();
  googleCallback.callback = null;
});

describe("GoogleSignIn callback", () => {
  it.each([
    { role: "ADMIN", returnTo: "/", destination: "/admin" },
    { role: "USER", returnTo: "/", destination: "/" },
    {
      role: "ADMIN",
      returnTo: "/admin/knowledge?tab=articles",
      destination: "/admin/knowledge?tab=articles",
    },
    {
      role: "USER",
      returnTo: "/admin/knowledge?tab=articles",
      destination: "/admin/knowledge?tab=articles",
    },
  ])(
    "routes $role to $destination from returnTo $returnTo and refreshes the router",
    async ({ role, returnTo, destination }) => {
      const user = userEvent.setup();
      const fetchMock = vi.fn().mockResolvedValue(
        Response.json({
          user: {
            id: "user-id",
            displayName: "Linh",
            email: "linh@example.com",
            role,
          },
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      window.google = {
        accounts: {
          id: {
            initialize: vi.fn(({ callback }) => {
              googleCallback.callback = callback;
            }),
            renderButton: vi.fn(),
          },
        },
      };

      render(<GoogleSignIn clientId="google-client-id" returnTo={returnTo} />);
      await user.click(screen.getByRole("button", { name: "Load Google SDK" }));
      await waitFor(() => expect(googleCallback.callback).not.toBeNull());

      const callback = googleCallback.callback;
      if (!callback) throw new Error("Google callback was not initialized");
      await callback({ credential: "google-id-token" });

      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/google",
        expect.objectContaining({
          body: JSON.stringify({
            credential: "google-id-token",
            rememberMe: false,
          }),
        }),
      );
      expect(navigation.replace).toHaveBeenCalledWith(destination);
      expect(navigation.refresh).toHaveBeenCalledTimes(1);
    },
  );

  it("loads English GSI script (?hl=en) and clamps button width to narrow mobile containers", async () => {
    const user = userEvent.setup();
    const renderButton = vi.fn();
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton,
        },
      },
    };
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        width: 319,
        height: 44,
        top: 0,
        left: 0,
        right: 319,
        bottom: 44,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      });

    try {
      render(<GoogleSignIn clientId="google-client-id" />);
      const sdkButton = screen.getByRole("button", { name: "Load Google SDK" });
      expect(sdkButton).toHaveAttribute(
        "data-src",
        "https://accounts.google.com/gsi/client?hl=en",
      );

      await user.click(sdkButton);
      await waitFor(() => expect(renderButton).toHaveBeenCalled());

      const wrapper = screen.getByLabelText("Sign in with Google");
      expect(wrapper.className).toContain("max-w-[350px]");
      expect(wrapper.className).toContain("overflow-hidden");
      expect(renderButton).toHaveBeenLastCalledWith(
        wrapper,
        expect.objectContaining({
          width: 319,
          locale: "en",
        }),
      );
    } finally {
      rectSpy.mockRestore();
    }
  });
});
