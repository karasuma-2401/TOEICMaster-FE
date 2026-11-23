import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FormField, FormInput, FormSelect, FormTextarea } from "./form-field";
import { PasswordInput } from "./password-input";

describe("ui/form-field and ui/password-input", () => {
  it.each([undefined, "field-email"])(
    "associates labels and descriptions when the child has its own ID and field ID is %s",
    (fieldId) => {
      render(
        <FormField
          id={fieldId}
          label="Contact email"
          hint="Use your email"
          error="Invalid email"
        >
          <FormInput id="custom-email" placeholder="Contact" />
        </FormField>,
      );
      const input = screen.getByLabelText("Contact email");
      const expectedId = fieldId ?? "custom-email";
      expect(input).toHaveAttribute("id", expectedId);
      expect(input).toHaveAttribute(
        "aria-describedby",
        `${expectedId}-hint ${expectedId}-error`,
      );
      expect(input).toHaveAccessibleDescription("Use your email Invalid email");
    },
  );

  it("keeps render-prop controls associated even when their custom ID conflicts", () => {
    render(
      <FormField
        id="display-name"
        label="Display name"
        hint="Visible to learners"
      >
        {(controlProps) => <input {...controlProps} id="other-name" />}
      </FormField>,
    );
    expect(screen.getByLabelText("Display name")).toHaveAttribute(
      "id",
      "display-name",
    );
    expect(screen.getByLabelText("Display name")).toHaveAccessibleDescription(
      "Visible to learners",
    );
  });

  it("preserves external descriptions without duplicating field description IDs", () => {
    render(
      <>
        <p id="external-note">External note</p>
        <FormField id="contact" label="Contact" hint="Contact hint">
          <input aria-describedby="external-note contact-hint" />
        </FormField>
      </>,
    );
    expect(screen.getByLabelText("Contact")).toHaveAttribute(
      "aria-describedby",
      "external-note contact-hint",
    );
  });

  it("wires htmlFor/id, hint, aria-invalid, and role=alert error via aria-describedby", () => {
    const { rerender } = render(
      <FormField hint="Use your work email." id="work-email" label="Email">
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
        error="Invalid email."
        hint="Use your work email."
        id="work-email"
        label="Email"
        required
      >
        <FormInput placeholder="you@company.com" />
      </FormField>,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Invalid email.");
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
        <FormField error="Required" id="bio" label="Bio">
          <FormTextarea />
        </FormField>
        <FormField id="level" label="Level">
          <FormSelect defaultValue="B1">
            <option value="B1">B1</option>
            <option value="B2">B2</option>
          </FormSelect>
        </FormField>
      </div>,
    );

    const textarea = screen.getByLabelText("Bio");
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAttribute("aria-describedby", "bio-error");

    const select = screen.getByLabelText("Level");
    expect(select).toHaveValue("B1");
    expect(select).not.toHaveAttribute("aria-invalid");
  });

  it("links only error ID in aria-describedby when hint is omitted", () => {
    render(
      <FormField
        error="This field is required."
        id="full-name"
        label="Full name"
      >
        <FormInput />
      </FormField>,
    );

    const input = screen.getByLabelText("Full name");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "full-name-error");
  });

  it("PasswordInput toggles input type between password and text with accessible button state", async () => {
    const user = userEvent.setup();
    render(
      <FormField error="Too short" id="pw" label="Password">
        <PasswordInput defaultValue="secret123" />
      </FormField>,
    );

    const input = screen.getByLabelText("Password");
    const toggle = screen.getByTestId("password-visibility-toggle");

    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "pw-error");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute("aria-label", "Show password");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute("aria-label", "Hide password");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});
