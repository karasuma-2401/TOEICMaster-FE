import { describe, expect, it } from "vitest";
import { validateLogin, validateRecoveryEmail } from "./login";

describe("validateLogin", () => {
  it("requires an email and password", () => {
    expect(validateLogin({ email: "not-an-email", password: "" })).toEqual({
      email: "Email không hợp lệ.",
      password: "Vui lòng nhập mật khẩu.",
    });
  });

  it("accepts normalized valid credentials", () => {
    expect(
      validateLogin({ email: "  linh@example.com  ", password: "password" }),
    ).toEqual({});
  });
});

describe("validateRecoveryEmail", () => {
  it("requires a valid email address", () => {
    expect(validateRecoveryEmail("invalid")).toEqual({
      email: "Email không hợp lệ.",
    });
  });

  it("accepts a valid address after trimming", () => {
    expect(validateRecoveryEmail("  linh@example.com  ")).toEqual({});
  });
});
