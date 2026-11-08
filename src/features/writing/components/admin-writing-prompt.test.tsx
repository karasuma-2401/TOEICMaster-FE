// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AdminWritingPrompt } from "./admin-writing-prompt";

afterEach(cleanup);

it("shows a Part 1 image and keywords, then an error if the image fails", () => {
  render(
    <AdminWritingPrompt
      question={{
        part: 1,
        imageAssetId: "image-1",
        imageAlt: "Office scene",
        keywordOne: "desk",
        keywordTwo: "work",
      }}
    />,
  );
  const image = screen.getByRole("img", { name: "Office scene" });
  expect(image).toHaveAttribute("src", "/api/admin/writing/media/image-1");
  expect(screen.getByText("desk")).toBeInTheDocument();
  expect(screen.getByText("work")).toBeInTheDocument();
  fireEvent.error(image);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Không thể tải ảnh đề bài",
  );
});

it("shows the email and directions for Part 2", () => {
  render(
    <AdminWritingPrompt
      question={{
        part: 2,
        sender: "Sam",
        recipient: "Pat",
        subject: "Meeting",
        emailBody: "Please join us.",
        directions: "Suggest a time.",
      }}
    />,
  );
  expect(screen.getByText("Please join us.")).toBeInTheDocument();
  expect(screen.getByText("Suggest a time.")).toBeInTheDocument();
});
