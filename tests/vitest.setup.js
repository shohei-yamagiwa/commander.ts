import { vi } from "vitest";

globalThis.jest = vi;

const originalExecArgv = [...process.execArgv];

beforeEach(() => {
  process.execArgv = [];
});

afterAll(() => {
  process.execArgv = originalExecArgv;
});
