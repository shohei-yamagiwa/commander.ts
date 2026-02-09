import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import childProcess from "node:child_process";
import * as path from "node:path";
import * as commander from "../index.ts";

describe("incrementNodeInspectorPort", () => {
  let spawnSpy;
  let signalSpy;
  const oldExecArgv = process.execArgv;

  beforeAll(() => {
    spawnSpy = vi.spyOn(childProcess, "spawn").mockImplementation(() => {
      return {
        on: () => {},
      };
    });
    signalSpy = vi.spyOn(process, "on").mockImplementation(() => {});
  });

  afterEach(() => {
    spawnSpy.mockClear();
  });

  afterAll(() => {
    spawnSpy.mockRestore();
    signalSpy.mockRestore();
    process.execArgv = oldExecArgv;
  });

  function makeProgram() {
    const program = new commander.Command();
    const fileWhichExists = path.join(__dirname, "./fixtures/pm-cache.js");
    program.command("cache", "stand-alone command", {
      executableFile: fileWhichExists,
    });
    return program;
  }

  function extractMockExecArgs(mock) {
    return mock.mock.calls[0][1].slice(0, -1);
  }

  test("when --inspect then bump port", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect=127.0.0.1:9230"]);
  });

  test("when --inspect=100 then bump port", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect=100"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect=127.0.0.1:101"]);
  });

  test("when --inspect=1.2.3.4:100 then bump port", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect=1.2.3.4:100"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect=1.2.3.4:101"]);
  });

  test("when --inspect=1.2.3.4 then bump port", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect=1.2.3.4"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect=1.2.3.4:9230"]);
  });

  test("when --inspect-brk then bump port", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect-brk"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect-brk=127.0.0.1:9230"]);
  });

  test("when --inspect-brk=100 then bump port", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect-brk=100"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect-brk=127.0.0.1:101"]);
  });

  test("when --inspect-brk=1.2.3.4 then bump port", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect-brk=1.2.3.4"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect-brk=1.2.3.4:9230"]);
  });

  test("when --inspect-brk=1.2.3.4:100 then bump port", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect-brk=1.2.3.4:100"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect-brk=1.2.3.4:101"]);
  });

  test("when --inspect-port=100 then bump port", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect-port=100"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect-port=127.0.0.1:101"]);
  });

  test("when --inspect-port=1.2.3.4:100 then bump port", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect-port=1.2.3.4:100"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect-port=1.2.3.4:101"]);
  });

  test("when --inspect-unexpected then unchanged", () => {
    const program = makeProgram();
    process.execArgv = ["--inspect-unexpected"];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--inspect-unexpected"]);
  });

  test("when --frozen-intrinsics  then unchanged", () => {
    const program = makeProgram();
    process.execArgv = ["--frozen-intrinsics "];
    program.parse(["node", "test", "cache"]);
    const execArgs = extractMockExecArgs(spawnSpy);
    expect(execArgs).toEqual(["--frozen-intrinsics "]);
  });
});
