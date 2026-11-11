import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs without `globals`, so Testing Library cannot register its own
// automatic cleanup. Unmount after every test so React never flushes pending
// work after the jsdom environment has been torn down ("window is not defined").
afterEach(() => {
  cleanup();
});
