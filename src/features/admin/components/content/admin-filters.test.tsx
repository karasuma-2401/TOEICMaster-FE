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
      ariaLabel="Lọc độ khó"
      label="Độ khó"
      onChange={onChange}
      options={[
        { value: "EASY", label: "Dễ" },
        { value: "HARD", label: "Khó" },
      ]}
      value={value}
    />,
  );
  return {
    onChange,
    trigger: screen.getByRole("button", { name: /^Lọc độ khó/ }),
  };
}

describe("AdminFilterSelect", () => {
  it("exposes the current value and picks an option", () => {
    const { onChange, trigger } = renderSelect("EASY");
    expect(trigger).toHaveAccessibleName("Lọc độ khó: Dễ");

    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Dễ" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Khó" }));

    expect(onChange).toHaveBeenCalledWith("HARD");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("supports the keyboard and returns focus on Escape", () => {
    const { onChange, trigger } = renderSelect();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(screen.getByRole("list", { name: "Lọc độ khó" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Tất cả" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "Tất cả" }), {
      key: "ArrowDown",
    });
    expect(screen.getByRole("button", { name: "Dễ" })).toHaveFocus();

    fireEvent.keyDown(screen.getByRole("button", { name: "Dễ" }), {
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
    { value: "SPK-01", label: "Đề luyện nói", hint: "SPK-01" },
    { value: "SPK-02", label: "Practice", hint: "SPK-02" },
  ];

  it("turns off browser autofill and matches without diacritics", () => {
    const onChange = vi.fn();
    render(
      <AdminSearchField
        label="Tìm"
        onChange={onChange}
        placeholder="Tìm"
        suggestions={suggestions}
        value="luyen"
      />,
    );
    const input = screen.getByRole("searchbox");
    expect(input).toHaveAttribute("autocomplete", "off");

    fireEvent.focus(input);
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Đề luyện nói/ }));

    expect(onChange).toHaveBeenCalledWith("SPK-01");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("clears the query", () => {
    const onChange = vi.fn();
    render(
      <AdminSearchField
        label="Tìm"
        onChange={onChange}
        placeholder="Tìm"
        value="abc"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Xóa nội dung/ }));

    expect(onChange).toHaveBeenCalledWith("");
  });
});
