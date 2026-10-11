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
      displayName: "Vui lòng nhập tên hiển thị.",
      email: "Email không hợp lệ.",
      password: "Mật khẩu cần từ 8 đến 128 ký tự.",
      confirmPassword: "Mật khẩu xác nhận chưa khớp.",
      termsAccepted: "Vui lòng đồng ý với điều khoản sử dụng.",
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
            title: "Dữ liệu đăng ký không hợp lệ.",
            errors: { Email: ["Email không hợp lệ."] },
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
      new RegisterError(400, "Dữ liệu đăng ký không hợp lệ.", {
        email: "Email không hợp lệ.",
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
            { title: "Email này đã được sử dụng.", status: 409 },
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
    ).rejects.toEqual(new RegisterError(409, "Email này đã được sử dụng."));
  });
});
