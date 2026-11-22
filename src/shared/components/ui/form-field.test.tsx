import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormField, FormInput, FormSelect, FormTextarea } from "./form-field";
import { PasswordInput } from "./password-input";

describe("ui/form-field and ui/password-input", () => {
  it("wires htmlFor/id, hint, aria-invalid, and role=alert error via aria-describedby", () => {
    const { rerender } = render(
      <FormField hint="Dùng email công ty." id="work-email" label="Email">
        <FormInput placeholder="you@company.com" />
      </FormField>,
    );

    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("id", "work-email");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).toHaveAttribute("aria-describedby", "work-email-hint");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(
      <FormField
        error="Email không hợp lệ."
        hint="Dùng email công ty."
        id="work-email"
        label="Email"
        required
      >
        <FormInput placeholder="you@company.com" />
      </FormField>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Email không hợp lệ.");
    expect(alert).toHaveAttribute("id", "work-email-error");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "work-email-hint work-email-error",
    );
    expect(input).toBeRequired();
  });

  it("supports FormTextarea and FormSelect inside FormField", () => {
    render(
      <div>
        <FormField error="Bắt buộc" id="bio" label="Giới thiệu">
          <FormTextarea />
        </FormField>
        <FormField id="level" label="Trình độ">
          <FormSelect defaultValue="B1">
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </FormSelect>
        </FormField>
      </div>,
    );

    const textarea = screen.getByLabelText("Giới thiệu");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", "bio-error");

    const select = screen.getByLabelText("Trình độ");
    expect(select).toHaveValue("B1");
    expect(select).not.toHaveAttribute("aria-invalid");
  });

  it("PasswordInput toggles input type between password and text with accessible button state", async () => {
    const user = userEvent.setup();
    render(
      <FormField error="Quá ngắn" id="pw" label="Mật khẩu">
        <PasswordInput defaultValue="secret123" />
      </FormField>,
    );

    const input = screen.getByLabelText("Mật khẩu");
    const toggle = screen.getByTestId("password-visibility-toggle");

    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "pw-error");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("aria-label", "Hiện mật khẩu");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("aria-label", "Ẩn mật khẩu");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
