import { afterEach, describe, expect, it, vi } from "vitest";
import { RegisterError, register, validateRegistration } from "./register";

afterEach(() => vi.unstubAllGlobals());

describe("validateRegistration", () => {
  it("trims display name and email for validation without trimming passwords", () => {
    expect(
      validateRegistration({
        displayName: "  Linh  ",
        email: "  linh@example.com  ",
        password: " password ",
        confirmPassword: " password ",
        termsAccepted: true,
      }),
    ).toEqual({});
  });

  it("returns field errors for invalid registration input", () => {
    expect(
      validateRegistration({
        displayName: "",
        email: "invalid",
        password: "short",
        confirmPassword: "different",
        termsAccepted: false,
      }),
    ).toEqual({
      displayName: "Please enter a display name.",
      email: "Invalid email address.",
      password: "Password must be between 8 and 128 characters.",
      confirmPassword: "Confirmation password does not match.",
      termsAccepted: "Please agree to the terms of use.",
    });
  });
});

describe("register", () => {
  it("posts the normalized backend contract through the same origin", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      register({
        displayName: "  Linh  ",
        email: "  linh@example.com  ",
        password: " password ",
      }),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          displayName: "Linh",
          email: "linh@example.com",
          password: " password ",
        }),
      }),
    );
  });

  it("maps API validation errors to form fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            title: "Invalid registration data.",
            errors: { Email: ["Invalid email address."] },
          },
          { status: 400 },
        ),
      ),
    );

    await expect(
      register({
        displayName: "Linh",
        email: "linh@example.com",
        password: "password",
      }),
    ).rejects.toEqual(
      new RegisterError(400, "Invalid registration data.", {
        email: "Invalid email address.",
      }),
    );
  });

  it("keeps duplicate-email feedback from the proxy", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { title: "This email is already in use.", status: 409 },
            { status: 409 },
          ),
        ),
    );

    await expect(
      register({
        displayName: "Linh",
        email: "linh@example.com",
        password: "password",
      }),
    ).rejects.toEqual(new RegisterError(409, "This email is already in use."));
  });
});
