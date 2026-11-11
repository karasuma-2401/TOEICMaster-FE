// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadRoomState } from "../loaders";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { LrExamRoom } from "./lr-exam-room";

afterEach(cleanup);

describe("LrExamRoom", () => {
  it("lets the learner answer and opens submit confirmation", () => {
    render(<LrExamRoom {...loadRoomState("x")} resultHref="/result" />);
    fireEvent.click(screen.getAllByRole("radio", { name: /D\./ })[0]);
    expect(
      screen.getAllByRole("radio", { checked: true }).length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Nộp bài thi" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Xác nhận nộp bài L&R" }),
    );
    expect(push).toHaveBeenCalledWith("/result");
  });

  it("renders the reading phase with a locked listening palette", () => {
    render(<LrExamRoom {...loadRoomState("x", 147)} resultHref="/result" />);
    expect(screen.getByText("QUESTION 147")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Câu 1(,|$)/ })).toBeDisabled();
  });
});
