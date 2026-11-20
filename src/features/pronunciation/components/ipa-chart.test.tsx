// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IpaChart } from "./ipa-chart";

describe("IpaChart", () => {
  it("renders the three groups and 44 sound buttons that open a dialog", () => {
    render(<IpaChart filter="all" onSelect={() => {}} practiced={new Set()} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Nguyên âm đơn" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nguyên âm đôi" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Phụ âm" })).toBeInTheDocument();
    const tiles = screen.getAllByRole("button", { name: /^Âm \// });
    expect(tiles).toHaveLength(44);
    for (const tile of tiles)
      expect(tile).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("marks practised sounds and counts them per group", () => {
    render(
      <IpaChart
        filter="all"
        onSelect={() => {}}
        practiced={new Set(["p", "b"])}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Âm /p/, ví dụ pea, đã luyện" }),
    ).toBeInTheDocument();
    const consonants = screen.getByRole("region", { name: "Phụ âm" });
    expect(
      within(consonants).getByText("24 âm · Đã luyện 2"),
    ).toBeInTheDocument();
  });

  it("calls onSelect with the slug of the clicked sound", async () => {
    const onSelect = vi.fn();
    render(<IpaChart filter="all" onSelect={onSelect} practiced={new Set()} />);
    await userEvent.click(screen.getByRole("button", { name: /Âm \/ð\// }));
    expect(onSelect).toHaveBeenCalledWith("th-voiced");
  });

  it("shows only the filtered group", () => {
    render(
      <IpaChart filter="diphthong" onSelect={() => {}} practiced={new Set()} />,
    );
    const section = screen.getByRole("region", { name: "Nguyên âm đôi" });
    expect(within(section).getAllByRole("button")).toHaveLength(8);
    expect(screen.queryByRole("heading", { name: "Phụ âm" })).toBeNull();
  });
});
