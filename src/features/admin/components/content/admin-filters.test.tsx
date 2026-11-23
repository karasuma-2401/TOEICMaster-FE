// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminFilterSelect, AdminSearchField } from "./admin-filters";

afterEach(cleanup);

function renderSelect(value = "ALL") {
  const onChange = vi.fn();
  render(
    <AdminFilterSelect
      allValue="ALL"
      ariaLabel="Filter difficulty"
      label="Difficulty"
      onChange={onChange}
      options={[
        { value: "EASY", label: "Easy" },
        { value: "HARD", label: "Hard" },
      ]}
      value={value}
    />,
  );
  return {
    onChange,
    trigger: screen.getByRole("button", { name: /^Filter difficulty/ }),
  };
}

describe("AdminFilterSelect", () => {
  it("exposes the current value and picks an option", () => {
    const { onChange, trigger } = renderSelect("EASY");
    expect(trigger).toHaveAccessibleName("Filter difficulty: Easy");

    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Easy" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Hard" }));

    expect(onChange).toHaveBeenCalledWith("HARD");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("supports the keyboard and returns focus on Escape", () => {
    const { onChange, trigger } = renderSelect();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(
      screen.getByRole("list", { name: "Filter difficulty" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "All" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "All" }), {
      key: "ArrowDown",
    });
    expect(screen.getByRole("button", { name: "Easy" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "Easy" }), {
      key: "Escape",
    });
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it("closes on an outside press without changing the value", () => {
    const { onChange, trigger } = renderSelect();
    fireEvent.click(trigger);

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("AdminSearchField", () => {
  const suggestions = [
    { value: "SPK-01", label: "Speaking prompt", hint: "SPK-01" },
    { value: "SPK-02", label: "Practice", hint: "SPK-02" },
  ];

  it("turns off browser autofill and filters suggestions case-insensitively", () => {
    const onChange = vi.fn();
    render(
      <AdminSearchField
        label="Search"
        onChange={onChange}
        placeholder="Search"
        suggestions={suggestions}
        value="speak"
      />,
    );
    const input = screen.getByRole("searchbox");
    expect(input).toHaveAttribute("autocomplete", "off");

    fireEvent.focus(input);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Speaking prompt/ }));

    expect(onChange).toHaveBeenCalledWith("SPK-01");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("clears the query", () => {
    const onChange = vi.fn();
    render(
      <AdminSearchField
        label="Search"
        onChange={onChange}
        placeholder="Search"
        value="abc"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Clear search/ }));

    expect(onChange).toHaveBeenCalledWith("");
  });
});
